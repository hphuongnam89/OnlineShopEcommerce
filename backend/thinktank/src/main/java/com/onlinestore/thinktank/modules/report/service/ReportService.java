package com.onlinestore.thinktank.modules.report.service;

import com.onlinestore.thinktank.modules.customer.entity.Customer;
import com.onlinestore.thinktank.modules.customer.service.CustomerService;
import com.onlinestore.thinktank.modules.order.entity.Order;
import com.onlinestore.thinktank.modules.order.repository.OrderRepository;
import com.onlinestore.thinktank.modules.order.service.OrderService;
import com.onlinestore.thinktank.modules.report.dto.CustomerReportDto;
import com.onlinestore.thinktank.modules.report.dto.RevenueReportDto;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.WeekFields;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {

    private final OrderRepository orderRepository;
    private final OrderService orderService;
    private final CustomerService customerService;

    public List<RevenueReportDto> getRevenueReport(String period) {
        List<Order> orders = orderRepository.findAll();
        String normalizedPeriod = period == null ? "DAILY" : period.trim().toUpperCase();

        Map<String, List<Order>> grouped = orders.stream()
                .filter(o -> o.getCreatedAt() != null)
                .filter(o -> "DELIVERED".equalsIgnoreCase(o.getStatus()))
                .collect(Collectors.groupingBy(
                        o -> buildPeriodKey(o.getCreatedAt().toLocalDate(), normalizedPeriod),
                        TreeMap::new,
                        Collectors.toList()
                ));

        return grouped.entrySet().stream()
                .map(entry -> {
                    String label = entry.getKey();
                    List<Order> periodOrders = entry.getValue();

                    BigDecimal dailyRevenue = periodOrders.stream()
                            .map(Order::getFinalAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    long count = periodOrders.size();

                    return RevenueReportDto.builder()
                            .date(label)
                            .revenue(dailyRevenue)
                            .orderCount(count)
                            .build();
                })
                .collect(Collectors.toList());
    }

    public List<CustomerReportDto> getTopCustomerReport() {
        List<Customer> customers = customerService.getCustomers(null, null, null, null);
        List<Customer> topCustomers = customers.stream()
                .limit(10)
                .toList();

        Map<Long, Long> orderCountMap = loadOrderCountMap(topCustomers);
        return topCustomers.stream()
                .map(customer -> CustomerReportDto.builder()
                        .customerId(customer.getId())
                        .fullName(customer.getUser() != null ? customer.getUser().getFullName() : "")
                        .tierName(customer.getTier() != null ? customer.getTier().getName() : "BRONZE")
                        .totalSpent(customer.getTotalSpent())
                        .orderCount(orderCountMap.getOrDefault(customer.getId(), 0L))
                        .build())
                .collect(Collectors.toList());
    }

    public byte[] exportOrders(String search, LocalDateTime startDate, LocalDateTime endDate, String status) throws IOException {
        List<Order> orders = orderService.getAdminOrders(search, startDate, endDate, status);

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Orders");

            // Header Font & Style
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            CellStyle headerCellStyle = workbook.createCellStyle();
            headerCellStyle.setFont(headerFont);
            headerCellStyle.setFillForegroundColor(IndexedColors.BLUE.getIndex());
            headerCellStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerCellStyle.setAlignment(HorizontalAlignment.CENTER);

            // Double Style for Amounts
            CellStyle amountStyle = workbook.createCellStyle();
            amountStyle.setDataFormat(workbook.createDataFormat().getFormat("#,##0.00"));

            String[] columns = {"Order ID", "Customer Name", "Customer Phone", "Customer Email", "Address", "Total Amount", "Discount Amount", "Final Amount", "Status", "Created Date"};

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerCellStyle);
            }

            int rowIdx = 1;
            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

            for (Order order : orders) {
                Row row = sheet.createRow(rowIdx++);

                row.createCell(0).setCellValue(order.getId());
                row.createCell(1).setCellValue(order.getFullName());
                row.createCell(2).setCellValue(order.getPhone());
                row.createCell(3).setCellValue(order.getEmail() != null ? order.getEmail() : "");
                row.createCell(4).setCellValue(order.getAddress());

                Cell totalCell = row.createCell(5);
                totalCell.setCellValue(order.getTotalAmount().doubleValue());
                totalCell.setCellStyle(amountStyle);

                Cell discountCell = row.createCell(6);
                discountCell.setCellValue(order.getDiscountAmount() != null ? order.getDiscountAmount().doubleValue() : 0.0);
                discountCell.setCellStyle(amountStyle);

                Cell finalCell = row.createCell(7);
                finalCell.setCellValue(order.getFinalAmount().doubleValue());
                finalCell.setCellStyle(amountStyle);

                row.createCell(8).setCellValue(order.getStatus());
                row.createCell(9).setCellValue(order.getCreatedAt() != null ? order.getCreatedAt().format(dtf) : "");
            }

            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    public byte[] exportCustomers(String search, Long tierId, BigDecimal minSpent, BigDecimal maxSpent, Long minOrders, Long maxOrders) throws IOException {
        List<Customer> customers = customerService.getCustomers(search, tierId, minSpent, maxSpent, minOrders, maxOrders);

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Customers");

            // Header Font & Style
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());

            CellStyle headerCellStyle = workbook.createCellStyle();
            headerCellStyle.setFont(headerFont);
            headerCellStyle.setFillForegroundColor(IndexedColors.GREEN.getIndex());
            headerCellStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerCellStyle.setAlignment(HorizontalAlignment.CENTER);

            // Double Style for Spent
            CellStyle spentStyle = workbook.createCellStyle();
            spentStyle.setDataFormat(workbook.createDataFormat().getFormat("#,##0.00"));

            String[] columns = {"Customer ID", "Customer Name", "Email", "Phone", "Tier", "Total Spent", "Joined Date"};

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerCellStyle);
            }

            int rowIdx = 1;
            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

            for (Customer customer : customers) {
                Row row = sheet.createRow(rowIdx++);

                row.createCell(0).setCellValue(customer.getId());
                row.createCell(1).setCellValue(customer.getUser() != null ? customer.getUser().getFullName() : "");
                row.createCell(2).setCellValue(customer.getUser() != null ? customer.getUser().getEmail() : "");
                row.createCell(3).setCellValue(customer.getUser() != null ? customer.getUser().getPhone() : "");
                row.createCell(4).setCellValue(customer.getTier() != null ? customer.getTier().getName() : "BRONZE");

                Cell spentCell = row.createCell(5);
                spentCell.setCellValue(customer.getTotalSpent().doubleValue());
                spentStyle.setDataFormat(workbook.createDataFormat().getFormat("#,##0.00"));
                spentCell.setCellStyle(spentStyle);

                row.createCell(6).setCellValue(customer.getCreatedAt() != null ? customer.getCreatedAt().format(dtf) : "");
            }

            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    private String buildPeriodKey(LocalDate date, String period) {
        return switch (period) {
            case "WEEKLY" -> {
                WeekFields weekFields = WeekFields.ISO;
                int week = date.get(weekFields.weekOfWeekBasedYear());
                int year = date.get(weekFields.weekBasedYear());
                yield String.format("%d-W%02d", year, week);
            }
            case "MONTHLY" -> String.format("%d-%02d", date.getYear(), date.getMonthValue());
            default -> date.toString();
        };
    }

    private Map<Long, Long> loadOrderCountMap(List<Customer> customers) {
        List<Long> customerIds = customers.stream()
                .map(Customer::getId)
                .toList();
        if (customerIds.isEmpty()) {
            return Map.of();
        }

        return orderRepository.countOrdersByCustomerIds(customerIds).stream()
                .collect(Collectors.toMap(
                        OrderRepository.CustomerOrderCountView::getCustomerId,
                        view -> view.getOrderCount() == null ? 0L : view.getOrderCount()
                ));
    }
}
