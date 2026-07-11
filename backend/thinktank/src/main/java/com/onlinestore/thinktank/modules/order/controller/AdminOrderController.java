package com.onlinestore.thinktank.modules.order.controller;

import com.onlinestore.thinktank.modules.order.dto.CheckoutRequest;
import com.onlinestore.thinktank.modules.order.dto.OrderResponse;
import com.onlinestore.thinktank.modules.order.dto.UpdateOrderRequest;
import com.onlinestore.thinktank.modules.order.entity.Order;
import com.onlinestore.thinktank.modules.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {

    // Admin order API for search, status updates, contact edits, and soft delete.
    private final OrderService orderService;

    @GetMapping
    public ResponseEntity<Page<OrderResponse>> getAdminOrders(
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(name = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size
    ) {
        Page<OrderResponse> orders = orderService.getAdminOrdersPage(search, startDate, endDate, status, page, size)
                .map(OrderResponse::from);
        return ResponseEntity.ok(orders);
    }

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(@Valid @RequestBody CheckoutRequest request) {
        Order order = orderService.createOrder(request);
        return ResponseEntity.ok(OrderResponse.from(order));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable(name = "id") Long id,
            @RequestBody Map<String, String> body
    ) {
        String status = body.get("status");
        if (status == null || status.trim().isEmpty()) {
            throw new com.onlinestore.thinktank.common.exception.InvalidRequestException("Status is required");
        }
        Order order = orderService.updateOrderStatus(id, status);
        return ResponseEntity.ok(OrderResponse.from(order));
    }

    @PutMapping("/{id}")
    public ResponseEntity<OrderResponse> updateOrder(
            @PathVariable(name = "id") Long id,
            @Valid @RequestBody UpdateOrderRequest request
    ) {
        Order order = orderService.updateOrder(id, request);
        return ResponseEntity.ok(OrderResponse.from(order));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteOrder(@PathVariable(name = "id") Long id) {
        orderService.deleteOrder(id);
        return ResponseEntity.ok(Map.of("message", "Order deleted and stock updated successfully"));
    }
}
