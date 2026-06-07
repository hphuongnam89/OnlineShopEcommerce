package com.onlinestore.thinktank.modules.review.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewRequest {
    private Long productId;
    private Integer rating;
    private String comment;
}
