package com.onlinestore.thinktank.modules.review.service;

import com.onlinestore.thinktank.modules.product.entity.Product;
import com.onlinestore.thinktank.modules.product.repository.ProductRepository;
import com.onlinestore.thinktank.modules.review.dto.ReviewRequest;
import com.onlinestore.thinktank.modules.review.entity.Review;
import com.onlinestore.thinktank.modules.review.repository.ReviewRepository;
import com.onlinestore.thinktank.modules.user.entity.User;
import com.onlinestore.thinktank.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final com.onlinestore.thinktank.modules.order.repository.OrderRepository orderRepository;

    public Review addReview(String email, ReviewRequest request) {
        // Reviews are only allowed after a verified purchase for the requested product.
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + request.getProductId()));

        // Verified purchase guard keeps ratings tied to real order history.
        boolean hasPurchased = orderRepository.hasUserPurchasedProduct(email, request.getProductId());
        if (!hasPurchased) {
            throw new RuntimeException("Bạn chỉ có thể đánh giá sản phẩm này sau khi đã mua và nhận hàng thành công!");
        }

        Review review = Review.builder()
                .product(product)
                .user(user)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        Review savedReview = reviewRepository.save(review);

        // Rebuild product score after inserting the new review row.
        recalculateProductStats(product.getId());

        return savedReview;
    }

    @Transactional(readOnly = true)
    public boolean checkUserPurchase(String email, Long productId) {
        return orderRepository.hasUserPurchasedProduct(email, productId);
    }

    @Transactional(readOnly = true)
    public List<Review> getProductReviews(Long productId) {
        // Public review list stays filtered by the entity-level soft delete rule.
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId);
    }

    @Transactional(readOnly = true)
    public List<Review> getAdminReviews() {
        // Admin view is the raw moderation queue for all active reviews.
        return reviewRepository.findAll();
    }

    public void deleteReview(Long id) {
        // Soft delete the review and then refresh the product's aggregate rating.
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review not found with id: " + id));
        Long productId = review.getProduct().getId();
        reviewRepository.delete(review);

        // Recalculate stats after deletion so the displayed averages stay accurate.
        recalculateProductStats(productId);
    }

    private void recalculateProductStats(Long productId) {
        // Aggregate data is always derived from the currently active review rows.
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));

        long count = reviewRepository.countByProductId(productId);
        Double avg = reviewRepository.getAverageRatingByProductId(productId);

        product.setReviewCount((int) count);
        product.setAverageRating(avg != null ? BigDecimal.valueOf(avg).setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO);

        productRepository.save(product);
    }
}
