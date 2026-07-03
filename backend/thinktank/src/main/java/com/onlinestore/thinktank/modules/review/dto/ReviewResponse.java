package com.onlinestore.thinktank.modules.review.dto;

import com.onlinestore.thinktank.modules.product.entity.Product;
import com.onlinestore.thinktank.modules.review.entity.Review;
import com.onlinestore.thinktank.modules.user.entity.User;

import java.time.LocalDateTime;

public record ReviewResponse(
        Long id,
        Long productId,
        String productName,
        String productImageUrl,
        String reviewerName,
        String reviewerEmail,
        Integer rating,
        String comment,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static ReviewResponse from(Review review, boolean includeEmail) {
        Product product = review.getProduct();
        User user = review.getUser();
        return new ReviewResponse(
                review.getId(),
                product.getId(),
                product.getName(),
                product.getImageUrl(),
                user.getFullName(),
                includeEmail ? user.getEmail() : null,
                review.getRating(),
                review.getComment(),
                review.getCreatedAt(),
                review.getUpdatedAt()
        );
    }
}
