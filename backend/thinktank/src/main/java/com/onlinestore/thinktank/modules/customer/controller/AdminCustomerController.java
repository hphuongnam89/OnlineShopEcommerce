package com.onlinestore.thinktank.modules.customer.controller;

import com.onlinestore.thinktank.modules.customer.dto.CustomerRequest;
import com.onlinestore.thinktank.modules.customer.entity.Customer;
import com.onlinestore.thinktank.modules.customer.service.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

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

    @PostMapping
    public ResponseEntity<Customer> createCustomer(@RequestBody CustomerRequest request) {
        Customer customer = customerService.createCustomer(request);
        return ResponseEntity.ok(customer);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Customer> updateCustomer(
            @PathVariable(name = "id") Long id,
            @RequestBody CustomerRequest request
    ) {
        Customer customer = customerService.updateCustomer(id, request);
        return ResponseEntity.ok(customer);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteCustomer(@PathVariable(name = "id") Long id) {
        customerService.deleteCustomer(id);
        return ResponseEntity.ok(Map.of("message", "Customer deleted successfully"));
    }
}
