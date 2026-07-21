package com.onlinestore.thinktank.modules.product.entity;

import com.onlinestore.thinktank.common.entity.BaseEntity;
import com.onlinestore.thinktank.modules.category.entity.Category;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@SQLDelete(sql = "UPDATE products SET deleted = true WHERE id = ? AND version = ?")
@SQLRestriction("deleted = false")
public class Product extends BaseEntity {

    // Main catalog item shown on storefront and managed from admin products.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(nullable = false, unique = true, length = 255)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    @Builder.Default
    private Integer stock = 0;

    @Version
    @Builder.Default
    private Long version = 0L;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(name = "additional_images", columnDefinition = "json")
    private List<String> additionalImages;

    @Column(length = 100)
    private String weight;

    @Column(length = 100)
    private String volume;

    @Column(length = 255)
    private String material;

    @Column(length = 255)
    private String dimensions;

    @Column(length = 100)
    private String sku;

    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(name = "highlights", columnDefinition = "json")
    private List<Map<String, String>> highlights;

    @Column(name = "average_rating", precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal averageRating = BigDecimal.ZERO;

    @Column(name = "review_count")
    @Builder.Default
    private Integer reviewCount = 0;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ProductVariant> variants = new ArrayList<>();

    @PrePersist
    @PreUpdate
    private void normalizeInventoryFields() {
        // Existing imported rows may have null version/stock values; Hibernate needs a non-null version when stock changes.
        if (version == null) {
            version = 0L;
        }
        if (stock == null) {
            stock = 0;
        }
    }
}
