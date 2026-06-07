package com.onlinestore.thinktank.modules.customer.controller;

import com.onlinestore.thinktank.modules.customer.entity.Customer;
import com.onlinestore.thinktank.modules.customer.service.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/admin/customers")
@RequiredArgsConstructor
public class AdminCustomerController {

    private final CustomerService customerService;

    @GetMapping
    public ResponseEntity<List<Customer>> getCustomers(
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "tierId", required = false) Long tierId,
            @RequestParam(name = "minSpent", required = false) BigDecimal minSpent,
            @RequestParam(name = "maxSpent", required = false) BigDecimal maxSpent
    ) {
        List<Customer> customers = customerService.getCustomers(search, tierId, minSpent, maxSpent);
        return ResponseEntity.ok(customers);
    }
}
