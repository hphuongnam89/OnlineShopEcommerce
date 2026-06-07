package com.onlinestore.thinktank.modules.report.controller;

import com.onlinestore.thinktank.modules.report.dto.RevenueReportDto;
import com.onlinestore.thinktank.modules.report.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/revenue")
    public ResponseEntity<List<RevenueReportDto>> getRevenueReport() {
        return ResponseEntity.ok(reportService.getDailyRevenueReport());
    }

    @GetMapping("/export/orders")
    public ResponseEntity<byte[]> exportOrders(
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(name = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(name = "status", required = false) String status
    ) throws IOException {
        byte[] excelData = reportService.exportOrders(search, startDate, endDate, status);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=orders.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelData);
    }

    @GetMapping("/export/customers")
    public ResponseEntity<byte[]> exportCustomers(
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "tierId", required = false) Long tierId,
            @RequestParam(name = "minSpent", required = false) BigDecimal minSpent,
            @RequestParam(name = "maxSpent", required = false) BigDecimal maxSpent
    ) throws IOException {
        byte[] excelData = reportService.exportCustomers(search, tierId, minSpent, maxSpent);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=customers.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelData);
    }
}
