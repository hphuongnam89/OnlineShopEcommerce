package com.onlinestore.thinktank.modules.product.controller;

import com.onlinestore.thinktank.modules.product.dto.ProductRequest;
import com.onlinestore.thinktank.modules.product.entity.Product;
import com.onlinestore.thinktank.modules.product.service.ProductService;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/admin/products")
@RequiredArgsConstructor
public class AdminProductController {

    // Admin product API for creating, updating, and soft-deleting products.
    private final ProductService productService;

    @GetMapping
    public ResponseEntity<Page<Product>> getProducts(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "limit", defaultValue = "20") int limit,
            @RequestParam(name = "categoryId", required = false) Long categoryId,
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "minPrice", required = false) BigDecimal minPrice,
            @RequestParam(name = "maxPrice", required = false) BigDecimal maxPrice,
            @RequestParam(name = "sort", required = false) String sort
    ) {
        Page<Product> products = productService.getProducts(page, limit, categoryId, search, minPrice, maxPrice, sort);
        return ResponseEntity.ok(products);
    }

    @PostMapping
    public ResponseEntity<Product> createProduct(@Valid @RequestBody ProductRequest request) {
        Product product = productService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(product);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(
            @PathVariable(name = "id") Long id,
            @Valid @RequestBody ProductRequest request
    ) {
        Product product = productService.updateProduct(id, request);
        return ResponseEntity.ok(product);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable(name = "id") Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }
}
