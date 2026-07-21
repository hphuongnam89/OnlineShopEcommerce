package com.onlinestore.thinktank.modules.review.controller;

import com.onlinestore.thinktank.modules.review.dto.ReviewRequest;
import com.onlinestore.thinktank.modules.review.dto.ReviewResponse;
import com.onlinestore.thinktank.modules.review.service.ReviewService;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    // Customer review API for verified-purchase checks and product reviews.
    private final ReviewService reviewService;

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<ReviewResponse>> getProductReviews(@PathVariable(name = "productId") Long productId) {
        return ResponseEntity.ok(reviewService.getProductReviews(productId));
    }

    @GetMapping("/check-purchase")
    public ResponseEntity<java.util.Map<String, Boolean>> checkPurchase(@RequestParam(name = "productId") Long productId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        boolean purchased = reviewService.checkUserPurchase(email, productId);
        return ResponseEntity.ok(java.util.Map.of("purchased", purchased));
    }

    @PostMapping
    public ResponseEntity<ReviewResponse> addReview(@Valid @RequestBody ReviewRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        ReviewResponse review = reviewService.addReview(email, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(review);
    }
}
