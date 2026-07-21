package com.onlinestore.thinktank.modules.review.dto;

import lombok.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewRequest {
    // Review submission payload for verified-purchase product ratings.
    @NotNull(message = "productId không được để trống")
    private Long productId;
    @NotNull(message = "rating không được để trống")
    @Min(value = 1, message = "rating phải từ 1 đến 5")
    @Max(value = 5, message = "rating phải từ 1 đến 5")
    private Integer rating;
    @NotBlank(message = "comment không được để trống")
    @Size(max = 2000, message = "Nội dung đánh giá không được vượt quá 2000 ký tự")
    private String comment;
}
