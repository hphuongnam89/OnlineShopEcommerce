package com.onlinestore.thinktank.modules.report.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RevenueReportDto {
    private String date; // E.g., "2026-06-07" or "Week 23, 2026"
    private BigDecimal revenue;
    private Long orderCount;
}
