package com.onlinestore.thinktank.modules.order.dto;

import com.onlinestore.thinktank.modules.order.entity.Order;
import com.onlinestore.thinktank.modules.order.entity.OrderItem;
import com.onlinestore.thinktank.modules.product.entity.Product;
import com.onlinestore.thinktank.modules.product.entity.ProductVariant;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class OrderResponse {
    // Public-safe order shape used by checkout, order history, tracking, and admin order screens.
    private Long id;
    private String trackingToken;
    private String fullName;
    private String phone;
    private String address;
    private String email;
    private String notes;
    private BigDecimal totalAmount;
    private BigDecimal discountAmount;
    private BigDecimal finalAmount;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<OrderItemResponse> items;

    public static OrderResponse from(Order order) {
        return OrderResponse.builder()
                .id(order.getId())
                .trackingToken(order.getTrackingToken())
                .fullName(order.getFullName())
                .phone(order.getPhone())
                .address(order.getAddress())
                .email(order.getEmail())
                .notes(order.getNotes())
                .totalAmount(order.getTotalAmount())
                .discountAmount(order.getDiscountAmount())
                .finalAmount(order.getFinalAmount())
                .status(order.getStatus())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .items(order.getItems().stream().map(OrderItemResponse::from).toList())
                .build();
    }

    @Getter
    @Builder
    public static class OrderItemResponse {
        private Long id;
        private Long productId;
        private Long variantId;
        private Integer quantity;
        private BigDecimal price;
        private BigDecimal subtotal;
        private ProductSnapshot product;
        private VariantSnapshot variant;

        public static OrderItemResponse from(OrderItem item) {
            Product product = item.getProduct();
            ProductVariant variant = item.getVariant();
            return OrderItemResponse.builder()
                    .id(item.getId())
                    .productId(product != null ? product.getId() : null)
                    .variantId(variant != null ? variant.getId() : null)
                    .quantity(item.getQuantity())
                    .price(item.getPrice())
                    .subtotal(item.getSubtotal())
                    .product(ProductSnapshot.from(product))
                    .variant(VariantSnapshot.from(variant))
                    .build();
        }
    }

    @Getter
    @Builder
    public static class ProductSnapshot {
        private Long id;
        private String name;
        private String title;
        private String imageUrl;
        private String image;

        public static ProductSnapshot from(Product product) {
            if (product == null) {
                return null;
            }
            return ProductSnapshot.builder()
                    .id(product.getId())
                    .name(product.getName())
                    .title(product.getName())
                    .imageUrl(product.getImageUrl())
                    .image(product.getImageUrl())
                    .build();
        }
    }

    @Getter
    @Builder
    public static class VariantSnapshot {
        private Long id;
        private String name;
        private String color;
        private String size;
        private String imageUrl;
        private String image;

        public static VariantSnapshot from(ProductVariant variant) {
            if (variant == null) {
                return null;
            }
            return VariantSnapshot.builder()
                    .id(variant.getId())
                    .name(variant.getName())
                    .color(variant.getColor())
                    .size(variant.getSize())
                    .imageUrl(variant.getImageUrl())
                    .image(variant.getImageUrl())
                    .build();
        }
    }
}
