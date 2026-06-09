package com.onlinestore.thinktank.modules.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileResponse {
    // Customer profile response for the "Thông tin của tôi" page.
    private Long id;
    private String email;
    private String fullName;
    private String phone;
    private String address;
    private String role;
    private String tierName;
    private BigDecimal totalSpent;
    private Integer discountPercent;
    private String nextTierName;
    private BigDecimal nextTierMinSpending;
    private BigDecimal amountToNextTier;
}
