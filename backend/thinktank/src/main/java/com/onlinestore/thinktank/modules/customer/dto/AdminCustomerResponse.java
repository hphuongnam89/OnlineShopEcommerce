package com.onlinestore.thinktank.modules.customer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminCustomerResponse {
    // Admin customer view model with user, tier, spending, and order-count summary.
    private Long id;
    private UserSummary user;
    private TierSummary tier;
    private BigDecimal totalSpent;
    private Long orderCount;
    private LocalDateTime createdAt;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserSummary {
        private Long id;
        private String fullName;
        private String email;
        private String phone;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TierSummary {
        private Long id;
        private String name;
        private BigDecimal minSpending;
        private Integer discountPercent;
    }
}
