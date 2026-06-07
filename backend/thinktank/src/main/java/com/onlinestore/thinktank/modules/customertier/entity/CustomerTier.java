package com.onlinestore.thinktank.modules.customertier.entity;

import com.onlinestore.thinktank.common.entity.BaseEntity;
import com.onlinestore.thinktank.modules.customer.entity.Customer;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "customer_tiers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class CustomerTier extends BaseEntity {

    @Id
    @GeneratedValue(strategy =
            GenerationType.IDENTITY)
    private Long id;

    @Column(
            nullable = false,
            unique = true,
            length = 100
    )
    private String name;

    @Column(
            name = "min_spending",
            nullable = false,
            precision = 15,
            scale = 2
    )
    @Builder.Default
    private BigDecimal minSpending =
            BigDecimal.ZERO;

    @Column(
            name = "discount_percent",
            nullable = false
    )
    @Builder.Default
    private Integer discountPercent = 0;

    @OneToMany(mappedBy = "tier")
    @Builder.Default
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Set<Customer> customers =
            new HashSet<>();
}