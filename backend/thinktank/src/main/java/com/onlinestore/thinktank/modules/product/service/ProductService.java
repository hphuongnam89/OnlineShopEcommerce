package com.onlinestore.thinktank.modules.product.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.onlinestore.thinktank.common.exception.ResourceNotFoundException;
import com.onlinestore.thinktank.modules.category.entity.Category;
import com.onlinestore.thinktank.modules.category.repository.CategoryRepository;
import com.onlinestore.thinktank.modules.product.dto.ProductRequest;
import com.onlinestore.thinktank.modules.product.dto.VariantRequest;
import com.onlinestore.thinktank.modules.product.entity.Product;
import com.onlinestore.thinktank.modules.product.entity.ProductVariant;
import com.onlinestore.thinktank.modules.product.repository.ProductRepository;
import com.onlinestore.thinktank.modules.product.repository.ProductVariantRepository;
import com.onlinestore.thinktank.modules.product.specification.ProductSpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final CategoryRepository categoryRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public Page<Product> getProducts(int page, int limit, Long categoryId, String search,
                                     BigDecimal minPrice, BigDecimal maxPrice, String sort) {
        // Public catalog query with pagination, filtering, and sort options for the storefront.
        log.debug("Fetching products - page: {}, limit: {}, categoryId: {}, search: {}", page, limit, categoryId, search);
        
        Sort springSort = Sort.by(Sort.Direction.DESC, "createdAt");
        if (sort != null) {
            switch (sort) {
                case "price_asc" -> springSort = Sort.by(Sort.Direction.ASC, "price");
                case "price_desc" -> springSort = Sort.by(Sort.Direction.DESC, "price");
                case "name_asc" -> springSort = Sort.by(Sort.Direction.ASC, "name");
                case "name_desc" -> springSort = Sort.by(Sort.Direction.DESC, "name");
                case "rating_desc" -> springSort = Sort.by(Sort.Direction.DESC, "averageRating");
                case "created_at_desc" -> springSort = Sort.by(Sort.Direction.DESC, "createdAt");
                case "created_at_asc" -> springSort = Sort.by(Sort.Direction.ASC, "createdAt");
            }
        }
        Pageable pageable = PageRequest.of(page, limit, springSort);
        Specification<Product> spec = ProductSpecification.filter(categoryId, search, minPrice, maxPrice);
        return productRepository.findAll(spec, pageable);
    }

    @Transactional(readOnly = true)
    public Product getProductById(Long id) {
        // Soft-deleted products are filtered out by Hibernate @Where on the entity.
        log.debug("Fetching product by id: {}", id);
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
    }

    public Product createProduct(ProductRequest request) {
        // Build the base product first, then attach variants so stock can be aggregated correctly.
        log.info("Creating product: {}", request.getName());
        
        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));
        }

        String slug = generateUniqueSlug(request.getName(), null);

        Product product = Product.builder()
                .category(category)
                .name(request.getName())
                .slug(slug)
                .description(request.getDescription())
                .price(request.getPrice())
                .stock(request.getStock() != null ? request.getStock() : 0)
                .imageUrl(request.getImageUrl())
                .additionalImages(request.getAdditionalImages())
                .weight(request.getWeight())
                .volume(request.getVolume())
                .material(request.getMaterial())
                .dimensions(request.getDimensions())
                .sku(request.getSku())
                .highlights(request.getHighlights())
                .build();

        Product savedProduct = productRepository.save(product);
        log.debug("Product created with ID: {}", savedProduct.getId());

        if (request.getVariants() != null && !request.getVariants().isEmpty()) {
            // Variants are stored as separate rows so the admin can edit them independently.
            Product productForVariants = savedProduct;
            List<ProductVariant> variants = request.getVariants().stream()
                    .map(vr -> ProductVariant.builder()
                            .product(productForVariants)
                            .sku(vr.getSku())
                            .name(vr.getName())
                            .price(vr.getPrice())
                            .stock(vr.getStock() != null ? vr.getStock() : 0)
                            .color(vr.getColor())
                            .size(vr.getSize())
                            .imageUrl(vr.getImageUrl())
                            .build())
                    .collect(Collectors.toList());
            productVariantRepository.saveAll(variants);
            savedProduct.setStock(sumVariantStocks(savedProduct.getId()));
            savedProduct = productRepository.save(savedProduct);
            log.debug("Added {} variants to product {}", variants.size(), savedProduct.getId());
        }

        log.info("Product {} created successfully", request.getName());
        return savedProduct;
    }

    public Product updateProduct(Long id, ProductRequest request) {
        // Update product metadata and keep slug/stock in sync with the latest form values.
        log.info("Updating product with ID: {}", id);
        
        Product product = getProductById(id);

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.getCategoryId()));
        }

        if (!product.getName().equals(request.getName())) {
            product.setSlug(generateUniqueSlug(request.getName(), id));
        }

        product.setCategory(category);
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setImageUrl(request.getImageUrl());
        product.setAdditionalImages(request.getAdditionalImages());
        product.setWeight(request.getWeight());
        product.setVolume(request.getVolume());
        product.setMaterial(request.getMaterial());
        product.setDimensions(request.getDimensions());
        product.setSku(request.getSku());
        product.setHighlights(request.getHighlights());

        // Update variants while preserving existing rows whenever possible.
        List<ProductVariant> currentVariants = productVariantRepository.findByProductId(id);
        Map<Long, ProductVariant> currentVariantsMap = currentVariants.stream()
                .collect(Collectors.toMap(ProductVariant::getId, v -> v));

        List<ProductVariant> updatedVariants = new ArrayList<>();
        Set<Long> keptVariantIds = new HashSet<>();

        if (request.getVariants() != null) {
            for (VariantRequest vr : request.getVariants()) {
                if (vr.getId() != null && currentVariantsMap.containsKey(vr.getId())) {
                    // Existing variant: update in place.
                    ProductVariant v = currentVariantsMap.get(vr.getId());
                    v.setSku(vr.getSku());
                    v.setName(vr.getName());
                    v.setPrice(vr.getPrice());
                    v.setStock(vr.getStock() != null ? vr.getStock() : 0);
                    v.setColor(vr.getColor());
                    v.setSize(vr.getSize());
                    v.setImageUrl(vr.getImageUrl());
                    updatedVariants.add(v);
                    keptVariantIds.add(v.getId());
                } else {
                    // New variant: create a fresh row and link it to the product.
                    ProductVariant v = ProductVariant.builder()
                            .product(product)
                            .sku(vr.getSku())
                            .name(vr.getName())
                            .price(vr.getPrice())
                            .stock(vr.getStock() != null ? vr.getStock() : 0)
                            .color(vr.getColor())
                            .size(vr.getSize())
                            .imageUrl(vr.getImageUrl())
                            .build();
                    updatedVariants.add(v);
                }
            }
        }

        // Removed variants are soft-deleted so historical order data still has a stable reference.
        for (ProductVariant cv : currentVariants) {
            if (!keptVariantIds.contains(cv.getId())) {
                productVariantRepository.delete(cv);
            }
        }

        product.getVariants().clear();
        product.getVariants().addAll(updatedVariants);
        if (!updatedVariants.isEmpty()) {
            product.setStock(sumVariantStocks(id));
        } else {
            product.setStock(request.getStock() != null ? request.getStock() : 0);
        }

        return productRepository.save(product);
    }

    public void deleteProduct(Long id) {
        // Product itself is soft-deleted through @SQLDelete on the entity.
        Product product = getProductById(id);
        // Touch the variant collection so cascade soft-delete can be applied deterministically.
        product.getVariants().size();
        productRepository.delete(product);
    }

    private String generateUniqueSlug(String name, Long currentProductId) {
        String baseSlug = toSlug(name);
        String slug = baseSlug;
        int counter = 1;
        while (slugAlreadyUsed(slug, currentProductId)) {
            slug = baseSlug + "-" + counter;
            counter++;
        }
        return slug;
    }

    private boolean slugAlreadyUsed(String slug, Long currentProductId) {
        if (currentProductId == null) {
            return productRepository.countAnyBySlug(slug) > 0;
        }
        return productRepository.countAnyBySlugAndIdNot(slug, currentProductId) > 0;
    }

    private String toSlug(String input) {
        if (input == null) return "";
        String nonWhitespace = input.trim().toLowerCase();
        String normalized = Normalizer.normalize(nonWhitespace, Normalizer.Form.NFD);
        String result = normalized.replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        result = result.replaceAll("đ", "d").replaceAll("Đ", "d");
        result = result.replaceAll("[^a-z0-9\\s-]", "");
        result = result.replaceAll("\\s+", "-");
        result = result.replaceAll("-+", "-");
        return result;
    }



    private Integer sumVariantStocks(Long productId) {
        Integer total = productVariantRepository.sumStockByProductId(productId);
        return total != null ? total : 0;
    }
}
