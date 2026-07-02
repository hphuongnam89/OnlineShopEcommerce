package com.onlinestore.thinktank.modules.product.repository;

import com.onlinestore.thinktank.modules.product.entity.ProductVariant;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {
    Optional<ProductVariant> findBySku(String sku);
    List<ProductVariant> findByProductId(Long productId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<ProductVariant> findWithLockById(Long id);

    @Query("select coalesce(sum(v.stock), 0) from ProductVariant v where v.product.id = :productId")
    Integer sumStockByProductId(Long productId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update ProductVariant v set v.version = 0 where v.id = :id and v.version is null")
    int initializeVersionIfNull(@Param("id") Long id);
}
