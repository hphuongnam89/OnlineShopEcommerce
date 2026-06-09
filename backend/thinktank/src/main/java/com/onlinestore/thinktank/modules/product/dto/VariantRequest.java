package com.onlinestore.thinktank.modules.product.dto;

import lombok.*;

import java.math.BigDecimal;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VariantRequest {
    // Product variant payload for admin create/update product forms.
    private Long id;
    @NotBlank(message = "SKU không được để trống")
    private String sku;
    @NotBlank(message = "Tên biến thể không được để trống")
    private String name;
    @NotNull(message = "Giá biến thể không được để trống")
    @Min(value = 0, message = "Giá biến thể không hợp lệ")
    private BigDecimal price;
    @NotNull(message = "Tồn kho biến thể không được để trống")
    @Min(value = 0, message = "Tồn kho biến thể không hợp lệ")
    private Integer stock;
    private String color;
    private String size;
    private String imageUrl;
}
