package com.onlinestore.thinktank.modules.product.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.onlinestore.thinktank.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;

@Entity
@Table(name = "product_variants")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@SQLDelete(sql = "UPDATE product_variants SET deleted = true WHERE id = ? AND version = ?")
@SQLRestriction("deleted = false")
public class ProductVariant extends BaseEntity {

    // Variant row for product options such as color, size, SKU, image, and stock.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @JsonIgnore
    private Product product;

    @Column(nullable = false, unique = true, length = 100)
    private String sku;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    @Builder.Default
    private Integer stock = 0;

    @Version
    @Builder.Default
    private Long version = 0L;

    @Column(length = 50)
    private String color;

    @Column(length = 50)
    private String size;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @PrePersist
    @PreUpdate
    private void normalizeInventoryFields() {
        // Imported catalog variants can contain null version/stock values; stock updates require safe defaults.
        if (version == null) {
            version = 0L;
        }
        if (stock == null) {
            stock = 0;
        }
    }
}
