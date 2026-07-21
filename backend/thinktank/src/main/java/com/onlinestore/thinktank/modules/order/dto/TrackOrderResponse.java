package com.onlinestore.thinktank.modules.order.dto;

import com.onlinestore.thinktank.modules.order.entity.Order;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class TrackOrderResponse {
    private Long id;
    private String status;
    private BigDecimal finalAmount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<Item> items;

    public static TrackOrderResponse from(Order order) {
        return TrackOrderResponse.builder()
                .id(order.getId())
                .status(order.getStatus())
                .finalAmount(order.getFinalAmount())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .items(order.getItems().stream().map(item -> Item.builder()
                        .name(item.getProduct() == null ? "Sản phẩm" : item.getProduct().getName())
                        .variantName(item.getVariant() == null ? null : item.getVariant().getName())
                        .quantity(item.getQuantity())
                        .build()).toList())
                .build();
    }

    @Getter
    @Builder
    public static class Item {
        private String name;
        private String variantName;
        private Integer quantity;
    }
}
