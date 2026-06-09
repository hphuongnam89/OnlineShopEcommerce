package com.onlinestore.thinktank.modules.review.controller;

import com.onlinestore.thinktank.modules.review.entity.Review;
import com.onlinestore.thinktank.modules.review.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/reviews")
@RequiredArgsConstructor
public class AdminReviewController {

    // Admin review API for moderation list and soft-delete actions.
    private final ReviewService reviewService;

    @GetMapping
    public ResponseEntity<List<Review>> getAdminReviews() {
        return ResponseEntity.ok(reviewService.getAdminReviews());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReview(@PathVariable(name = "id") Long id) {
        reviewService.deleteReview(id);
        return ResponseEntity.noContent().build();
    }
}
