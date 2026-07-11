package com.onlinestore.thinktank.modules.order.controller;

import com.onlinestore.thinktank.modules.order.dto.CheckoutRequest;
import com.onlinestore.thinktank.modules.order.entity.Order;
import com.onlinestore.thinktank.modules.order.service.OrderService;
import com.onlinestore.thinktank.modules.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderControllerTest {

    @Mock private OrderService orderService;
    @Mock private UserRepository userRepository;
    @InjectMocks private OrderController orderController;

    @Test
    void checkoutShouldReturnExistingOrderAfterConcurrentIdempotencyConflict() {
        CheckoutRequest request = CheckoutRequest.builder().idempotencyKey("same-key").build();
        Order existing = Order.builder().id(42L).build();
        when(orderService.createOrder(request)).thenThrow(new DataIntegrityViolationException("duplicate"));
        when(orderService.findByIdempotencyKey("same-key")).thenReturn(Optional.of(existing));

        var response = orderController.checkout(request);

        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertEquals(42L, response.getBody().getId());
    }
}
