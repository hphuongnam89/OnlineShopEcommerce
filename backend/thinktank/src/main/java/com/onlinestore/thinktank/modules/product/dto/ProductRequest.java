package com.onlinestore.thinktank.modules.product.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductRequest {
    private String name;
    private Long categoryId;
    private String description;
    private BigDecimal price;
    private Integer stock;
    private String imageUrl;
    private List<String> additionalImages;
    private String weight;
    private String volume;
    private String material;
    private String dimensions;
    private String sku;
    private List<VariantRequest> variants;
}
