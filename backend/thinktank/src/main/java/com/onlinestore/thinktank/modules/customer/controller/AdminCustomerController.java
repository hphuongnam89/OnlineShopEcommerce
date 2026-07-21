package com.onlinestore.thinktank.modules.customer.controller;

import com.onlinestore.thinktank.modules.customer.dto.AdminCustomerResponse;
import com.onlinestore.thinktank.modules.customer.dto.CustomerRequest;
import com.onlinestore.thinktank.modules.customer.entity.Customer;
import com.onlinestore.thinktank.modules.customer.service.CustomerService;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/customers")
@RequiredArgsConstructor
public class AdminCustomerController {

    // Admin customer API for CRUD, spending filters, and tier management.
    private final CustomerService customerService;

    @GetMapping
    public ResponseEntity<List<AdminCustomerResponse>> getCustomers(
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "tierId", required = false) Long tierId,
            @RequestParam(name = "minSpent", required = false) BigDecimal minSpent,
            @RequestParam(name = "maxSpent", required = false) BigDecimal maxSpent,
            @RequestParam(name = "minOrders", required = false) Long minOrders,
            @RequestParam(name = "maxOrders", required = false) Long maxOrders
    ) {
        List<AdminCustomerResponse> customers = customerService.getAdminCustomers(search, tierId, minSpent, maxSpent, minOrders, maxOrders);
        return ResponseEntity.ok(customers);
    }

    @PostMapping
    public ResponseEntity<AdminCustomerResponse> createCustomer(@Valid @RequestBody CustomerRequest request) {
        Customer customer = customerService.createCustomer(request);
        return ResponseEntity.ok(customerService.getAdminCustomerById(customer.getId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AdminCustomerResponse> updateCustomer(
            @PathVariable(name = "id") Long id,
            @Valid @RequestBody CustomerRequest request
    ) {
        Customer customer = customerService.updateCustomer(id, request);
        return ResponseEntity.ok(customerService.getAdminCustomerById(customer.getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteCustomer(@PathVariable(name = "id") Long id) {
        customerService.deleteCustomer(id);
        return ResponseEntity.ok(Map.of("message", "Customer deleted successfully"));
    }
}
