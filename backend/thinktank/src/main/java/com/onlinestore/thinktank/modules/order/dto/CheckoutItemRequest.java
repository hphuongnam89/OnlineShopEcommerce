package com.onlinestore.thinktank.modules.order.dto;

import lombok.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckoutItemRequest {
    // One line item sent from the cart during checkout.
    @NotNull(message = "productId không được để trống")
    private Long productId;
    private Long variantId;
    @Min(value = 1, message = "Số lượng phải lớn hơn 0")
    private Integer quantity;
}
