package com.onlinestore.thinktank.modules.product.service;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.*;
import java.util.stream.Collectors;

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
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
    }

    public Product createProduct(ProductRequest request) {
        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found with id: " + request.getCategoryId()));
        }

        String slug = generateUniqueSlug(request.getName());

        Product product = Product.builder()
                .category(category)
                .name(request.getName())
                .slug(slug)
                .description(request.getDescription())
                .price(request.getPrice())
                .stock(request.getStock() != null ? request.getStock() : 0)
                .imageUrl(request.getImageUrl())
                .additionalImages(serializeList(request.getAdditionalImages()))
                .weight(request.getWeight())
                .volume(request.getVolume())
                .material(request.getMaterial())
                .dimensions(request.getDimensions())
                .sku(request.getSku())
                .build();

        Product savedProduct = productRepository.save(product);

        if (request.getVariants() != null && !request.getVariants().isEmpty()) {
            List<ProductVariant> variants = request.getVariants().stream()
                    .map(vr -> ProductVariant.builder()
                            .product(savedProduct)
                            .sku(vr.getSku())
                            .name(vr.getName())
                            .price(vr.getPrice())
                            .stock(vr.getStock() != null ? vr.getStock() : 0)
                            .color(vr.getColor())
                            .size(vr.getSize())
                            .build())
                    .collect(Collectors.toList());
            productVariantRepository.saveAll(variants);
            savedProduct.setVariants(variants);
        }

        return savedProduct;
    }

    public Product updateProduct(Long id, ProductRequest request) {
        Product product = getProductById(id);

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found with id: " + request.getCategoryId()));
        }

        if (!product.getName().equals(request.getName())) {
            product.setSlug(generateUniqueSlug(request.getName()));
        }

        product.setCategory(category);
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setStock(request.getStock() != null ? request.getStock() : 0);
        product.setImageUrl(request.getImageUrl());
        product.setAdditionalImages(serializeList(request.getAdditionalImages()));
        product.setWeight(request.getWeight());
        product.setVolume(request.getVolume());
        product.setMaterial(request.getMaterial());
        product.setDimensions(request.getDimensions());
        product.setSku(request.getSku());

        // Update variants
        List<ProductVariant> currentVariants = productVariantRepository.findByProductId(id);
        Map<Long, ProductVariant> currentVariantsMap = currentVariants.stream()
                .collect(Collectors.toMap(ProductVariant::getId, v -> v));

        List<ProductVariant> updatedVariants = new ArrayList<>();
        Set<Long> keptVariantIds = new HashSet<>();

        if (request.getVariants() != null) {
            for (VariantRequest vr : request.getVariants()) {
                if (vr.getId() != null && currentVariantsMap.containsKey(vr.getId())) {
                    // Update existing
                    ProductVariant v = currentVariantsMap.get(vr.getId());
                    v.setSku(vr.getSku());
                    v.setName(vr.getName());
                    v.setPrice(vr.getPrice());
                    v.setStock(vr.getStock() != null ? vr.getStock() : 0);
                    v.setColor(vr.getColor());
                    v.setSize(vr.getSize());
                    updatedVariants.add(v);
                    keptVariantIds.add(v.getId());
                } else {
                    // Create new
                    ProductVariant v = ProductVariant.builder()
                            .product(product)
                            .sku(vr.getSku())
                            .name(vr.getName())
                            .price(vr.getPrice())
                            .stock(vr.getStock() != null ? vr.getStock() : 0)
                            .color(vr.getColor())
                            .size(vr.getSize())
                            .build();
                    updatedVariants.add(v);
                }
            }
        }

        // Delete removed variants
        for (ProductVariant cv : currentVariants) {
            if (!keptVariantIds.contains(cv.getId())) {
                productVariantRepository.delete(cv);
            }
        }

        product.getVariants().clear();
        product.getVariants().addAll(updatedVariants);

        return productRepository.save(product);
    }

    public void deleteProduct(Long id) {
        Product product = getProductById(id);
        productRepository.delete(product);
    }

    private String generateUniqueSlug(String name) {
        String baseSlug = toSlug(name);
        String slug = baseSlug;
        int counter = 1;
        while (productRepository.existsBySlug(slug)) {
            slug = baseSlug + "-" + counter;
            counter++;
        }
        return slug;
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

    private String serializeList(List<String> list) {
        if (list == null) return "[]";
        try {
            return objectMapper.writeValueAsString(list);
        } catch (Exception e) {
            return "[]";
        }
    }
}
