package com.onlinestore.thinktank.modules.product.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductRequest {
    // Admin product form payload, including base product fields and optional variants.
    @NotBlank(message = "Tên sản phẩm không được để trống")
    private String name;
    @NotNull(message = "categoryId không được để trống")
    private Long categoryId;
    @NotBlank(message = "Mô tả không được để trống")
    private String description;
    @NotNull(message = "Giá không được để trống")
    @Min(value = 0, message = "Giá không hợp lệ")
    private BigDecimal price;
    @NotNull(message = "Số lượng tồn kho không được để trống")
    @Min(value = 0, message = "Số lượng tồn kho không hợp lệ")
    private Integer stock;
    private String imageUrl;
    private List<String> additionalImages;
    private String weight;
    private String volume;
    private String material;
    private String dimensions;
    private String sku;
    private List<Map<String, String>> highlights;
    @Valid
    private List<VariantRequest> variants;
}
