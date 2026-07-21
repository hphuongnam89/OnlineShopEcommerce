package com.onlinestore.thinktank.modules.review.dto;

import com.onlinestore.thinktank.modules.product.entity.Product;
import com.onlinestore.thinktank.modules.review.entity.Review;
import com.onlinestore.thinktank.modules.user.entity.User;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

// Kiểm tra ánh xạ dữ liệu đánh giá từ entity sang response trả cho frontend.
class ReviewResponseTest {

    @Test
    void publicResponseShouldKeepReviewerEmailPrivate() {
        Review review = Review.builder()
                .id(1L)
                .product(Product.builder().id(2L).name("Bag").imageUrl("/bag.jpg").build())
                .user(User.builder().id(3L).fullName("Nam").email("nam@example.com").build())
                .rating(5)
                .comment("Tốt")
                .build();

        ReviewResponse response = ReviewResponse.from(review, false);

        assertEquals("Bag", response.productName());
        assertEquals("Nam", response.reviewerName());
        assertNull(response.reviewerEmail());
    }
}
