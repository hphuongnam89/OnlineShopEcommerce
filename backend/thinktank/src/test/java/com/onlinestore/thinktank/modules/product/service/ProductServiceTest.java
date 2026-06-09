package com.onlinestore.thinktank.modules.product.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.onlinestore.thinktank.modules.category.repository.CategoryRepository;
import com.onlinestore.thinktank.modules.product.dto.ProductRequest;
import com.onlinestore.thinktank.modules.product.dto.VariantRequest;
import com.onlinestore.thinktank.modules.product.entity.Product;
import com.onlinestore.thinktank.modules.product.entity.ProductVariant;
import com.onlinestore.thinktank.modules.product.repository.ProductRepository;
import com.onlinestore.thinktank.modules.product.repository.ProductVariantRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock private ProductRepository productRepository;
    @Mock private ProductVariantRepository productVariantRepository;
    @Mock private CategoryRepository categoryRepository;
    @Mock private ObjectMapper objectMapper;

    @InjectMocks private ProductService productService;

    @Test
    void createProduct_withVariants_shouldSetAggregateStockFromVariantSum() {
        ProductRequest request = ProductRequest.builder()
                .name("Test Bag")
                .price(BigDecimal.valueOf(100000))
                .stock(99)
                .variants(List.of(
                        VariantRequest.builder().sku("TB-1").name("Black").price(BigDecimal.valueOf(100000)).stock(5).build(),
                        VariantRequest.builder().sku("TB-2").name("Grey").price(BigDecimal.valueOf(110000)).stock(7).build()
                ))
                .build();

        when(productRepository.countAnyBySlug("test-bag")).thenReturn(0L);
        when(productRepository.save(org.mockito.ArgumentMatchers.any(Product.class))).thenAnswer(invocation -> {
            Product product = invocation.getArgument(0);
            product.setId(1L);
            return product;
        });
        when(productVariantRepository.sumStockByProductId(1L)).thenReturn(12);

        Product saved = productService.createProduct(request);

        ArgumentCaptor<Product> productCaptor = ArgumentCaptor.forClass(Product.class);
        verify(productRepository, org.mockito.Mockito.times(2)).save(productCaptor.capture());
        assertTrue(productCaptor.getAllValues().stream().anyMatch(p -> p.getStock() == 12));
        assertEquals(12, saved.getStock());
    }
}
