package com.onlinestore.thinktank.modules.order.dto;

import lombok.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Max;

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
    @NotNull(message = "quantity không được để trống")
    @Min(value = 1, message = "Số lượng phải lớn hơn 0")
    @Max(value = 100, message = "Mỗi sản phẩm không được vượt quá 100")
    private Integer quantity;
}
