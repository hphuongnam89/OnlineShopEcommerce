package com.onlinestore.thinktank.modules.order.controller;

import com.onlinestore.thinktank.modules.order.dto.CheckoutRequest;
import com.onlinestore.thinktank.modules.order.dto.OrderResponse;
import com.onlinestore.thinktank.modules.order.dto.UpdateOrderRequest;
import com.onlinestore.thinktank.modules.order.entity.Order;
import com.onlinestore.thinktank.modules.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<List<OrderResponse>> getAdminOrders(
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(name = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(name = "status", required = false) String status
    ) {
        List<Order> orders = orderService.getAdminOrders(search, startDate, endDate, status);
        return ResponseEntity.ok(orders.stream().map(OrderResponse::from).toList());
    }

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(@RequestBody CheckoutRequest request) {
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
            throw new RuntimeException("Status is required");
        }
        Order order = orderService.updateOrderStatus(id, status);
        return ResponseEntity.ok(OrderResponse.from(order));
    }

    @PutMapping("/{id}")
    public ResponseEntity<OrderResponse> updateOrder(
            @PathVariable(name = "id") Long id,
            @RequestBody UpdateOrderRequest request
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
