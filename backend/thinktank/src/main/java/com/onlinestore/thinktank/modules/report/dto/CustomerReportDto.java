package com.onlinestore.thinktank.modules.report.dto;

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
public class CustomerReportDto {
    // Customer chart row showing top spending customers and order counts.
    private Long customerId;
    private String fullName;
    private String tierName;
    private BigDecimal totalSpent;
    private Long orderCount;
}
