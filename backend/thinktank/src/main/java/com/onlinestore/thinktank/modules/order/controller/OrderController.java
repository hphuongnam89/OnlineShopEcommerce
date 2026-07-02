package com.onlinestore.thinktank.modules.order.controller;

import com.onlinestore.thinktank.modules.order.dto.CheckoutRequest;
import com.onlinestore.thinktank.modules.order.dto.OrderResponse;
import com.onlinestore.thinktank.modules.order.entity.Order;
import com.onlinestore.thinktank.modules.order.service.OrderService;
import com.onlinestore.thinktank.modules.user.entity.User;
import com.onlinestore.thinktank.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    // Customer-facing order API for checkout, personal history, and tracking.
    private final OrderService orderService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<OrderResponse> checkout(@Valid @RequestBody CheckoutRequest request) {
        Order order = orderService.createOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(OrderResponse.from(order));
    }

    @GetMapping("/my-orders")
    public ResponseEntity<List<OrderResponse>> getMyOrders() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Current user not found with email: " + email));
        List<Order> orders = orderService.getMyOrders(user.getId());
        return ResponseEntity.ok(orders.stream().map(OrderResponse::from).toList());
    }

    @GetMapping("/track")
    public ResponseEntity<OrderResponse> trackOrder(@RequestParam String orderId, @RequestParam String phone) {
        Order order = orderService.trackOrder(orderId, phone);
        return ResponseEntity.ok(OrderResponse.from(order));
    }
}
