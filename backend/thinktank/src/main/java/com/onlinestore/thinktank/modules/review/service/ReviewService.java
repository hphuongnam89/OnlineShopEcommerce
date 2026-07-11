package com.onlinestore.thinktank.modules.review.service;

import com.onlinestore.thinktank.modules.product.entity.Product;
import com.onlinestore.thinktank.modules.product.repository.ProductRepository;
import com.onlinestore.thinktank.modules.review.dto.ReviewRequest;
import com.onlinestore.thinktank.modules.review.dto.ReviewResponse;
import com.onlinestore.thinktank.common.exception.DuplicateResourceException;
import com.onlinestore.thinktank.common.exception.ResourceNotFoundException;
import com.onlinestore.thinktank.modules.review.entity.Review;
import com.onlinestore.thinktank.modules.review.repository.ReviewRepository;
import com.onlinestore.thinktank.modules.user.entity.User;
import com.onlinestore.thinktank.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.dao.DataIntegrityViolationException;
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

    public ReviewResponse addReview(String email, ReviewRequest request) {
        // Reviews are only allowed after a verified purchase for the requested product.
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản"));

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với id: " + request.getProductId()));

        // Verified purchase guard keeps ratings tied to real order history.
        boolean hasPurchased = orderRepository.hasUserPurchasedProduct(email, request.getProductId());
        if (!hasPurchased) {
            throw new AccessDeniedException("Bạn chỉ có thể đánh giá sản phẩm này sau khi đã mua và nhận hàng thành công!");
        }
        if (reviewRepository.existsByUserIdAndProductId(user.getId(), product.getId())) {
            throw new DuplicateResourceException("Bạn đã đánh giá sản phẩm này rồi.");
        }

        Review review = Review.builder()
                .product(product)
                .user(user)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        Review savedReview;
        try {
            savedReview = reviewRepository.saveAndFlush(review);
        } catch (DataIntegrityViolationException ex) {
            throw new DuplicateResourceException("Bạn đã đánh giá sản phẩm này rồi.");
        }

        // Rebuild product score after inserting the new review row.
        recalculateProductStats(product.getId());

        return ReviewResponse.from(savedReview, false);
    }

    @Transactional(readOnly = true)
    public boolean checkUserPurchase(String email, Long productId) {
        return orderRepository.hasUserPurchasedProduct(email, productId);
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getProductReviews(Long productId) {
        // Public review list stays filtered by the entity-level soft delete rule.
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId).stream()
                .map(review -> ReviewResponse.from(review, false))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getAdminReviews() {
        // Admin view is the raw moderation queue for all active reviews.
        return reviewRepository.findAll().stream()
                .map(review -> ReviewResponse.from(review, true))
                .toList();
    }

    public void deleteReview(Long id) {
        // Soft delete the review and then refresh the product's aggregate rating.
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đánh giá với id: " + id));
        Long productId = review.getProduct().getId();
        reviewRepository.delete(review);

        // Recalculate stats after deletion so the displayed averages stay accurate.
        recalculateProductStats(productId);
    }

    private void recalculateProductStats(Long productId) {
        // Aggregate data is always derived from the currently active review rows.
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với id: " + productId));

        long count = reviewRepository.countByProductId(productId);
        Double avg = reviewRepository.getAverageRatingByProductId(productId);

        product.setReviewCount((int) count);
        product.setAverageRating(avg != null ? BigDecimal.valueOf(avg).setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO);

        productRepository.save(product);
    }
}
