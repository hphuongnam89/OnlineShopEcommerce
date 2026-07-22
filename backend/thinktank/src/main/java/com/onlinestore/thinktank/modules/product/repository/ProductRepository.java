package com.onlinestore.thinktank.modules.product.repository;

import com.onlinestore.thinktank.modules.product.entity.Product;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;

@Repository
// Truy vấn sản phẩm, tìm kiếm, phân trang và khóa bản ghi khi cập nhật tồn kho.
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
    
    @Override
    @EntityGraph(attributePaths = {"category", "variants"})
    Page<Product> findAll(Specification<Product> spec, Pageable pageable);

    @EntityGraph(attributePaths = {"category", "variants"})
    @Query("SELECT p FROM Product p " +
           "WHERE (:categoryId IS NULL OR p.category.id = :categoryId) " +
           "AND p.stock > 0 " +
           "AND (:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:minPrice IS NULL OR p.price >= :minPrice) " +
           "AND (:maxPrice IS NULL OR p.price <= :maxPrice) " +
           "ORDER BY (SELECT COALESCE(SUM(oi.quantity), 0) FROM OrderItem oi " +
           "          WHERE oi.product = p AND oi.deleted = false " +
           "          AND oi.order.status <> 'CANCELLED' AND oi.order.deleted = false) DESC, p.id DESC")
    Page<Product> findAllSortedBySales(
            @Param("categoryId") Long categoryId,
            @Param("search") String search,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            Pageable pageable);

    @Override
    @EntityGraph(attributePaths = {"category", "variants"})
    Optional<Product> findById(Long id);
    Optional<Product> findBySlug(String slug);
    boolean existsBySlug(String slug);

    @Query(value = "SELECT COUNT(*) FROM products WHERE slug = :slug", nativeQuery = true)
    long countAnyBySlug(@Param("slug") String slug);

    @Query(value = "SELECT COUNT(*) FROM products WHERE slug = :slug AND id <> :id", nativeQuery = true)
    long countAnyBySlugAndIdNot(@Param("slug") String slug, @Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Product> findWithLockById(Long id);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Product p set p.version = 0 where p.id = :id and p.version is null")
    int initializeVersionIfNull(@Param("id") Long id);
}
