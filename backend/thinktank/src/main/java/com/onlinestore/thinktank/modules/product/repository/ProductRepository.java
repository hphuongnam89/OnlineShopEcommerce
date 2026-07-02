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

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
    
    @Override
    @EntityGraph(attributePaths = {"category", "variants"})
    Page<Product> findAll(Specification<Product> spec, Pageable pageable);

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
