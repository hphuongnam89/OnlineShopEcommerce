package com.onlinestore.thinktank.modules.product.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductRequest {
    // Admin product form payload, including base product fields and optional variants.
    @NotBlank(message = "Tên sản phẩm không được để trống")
    @Size(max = 255, message = "Tên sản phẩm không được vượt quá 255 ký tự")
    private String name;
    @NotNull(message = "categoryId không được để trống")
    private Long categoryId;
    @NotBlank(message = "Mô tả không được để trống")
    @Size(max = 20000, message = "Mô tả không được vượt quá 20000 ký tự")
    private String description;
    @NotNull(message = "Giá không được để trống")
    @Min(value = 0, message = "Giá không hợp lệ")
    private BigDecimal price;
    @NotNull(message = "Số lượng tồn kho không được để trống")
    @Min(value = 0, message = "Số lượng tồn kho không hợp lệ")
    private Integer stock;
    @Size(max = 500) private String imageUrl;
    @Size(max = 20) private List<@Size(max = 500) String> additionalImages;
    @Size(max = 100) private String weight;
    @Size(max = 100) private String volume;
    @Size(max = 255) private String material;
    @Size(max = 255) private String dimensions;
    @Size(max = 100) private String sku;
    @Size(max = 20)
    private List<Map<String, String>> highlights;
    @Valid
    @Size(max = 100)
    private List<VariantRequest> variants;
}
