package com.onlinestore.thinktank.modules.order.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckoutItemRequest {
    private Long productId;
    private Long variantId;
    private Integer quantity;
}
