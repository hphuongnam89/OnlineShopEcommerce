package com.onlinestore.thinktank.modules.review.repository;

import com.onlinestore.thinktank.modules.review.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
// Truy vấn đánh giá sản phẩm và tính các số liệu tổng hợp về điểm đánh giá.
public interface ReviewRepository extends JpaRepository<Review, Long> {
    boolean existsByUserIdAndProductId(Long userId, Long productId);

    List<Review> findByProductIdOrderByCreatedAtDesc(Long productId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.product.id = :productId")
    long countByProductId(@Param("productId") Long productId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.product.id = :productId")
    Double getAverageRatingByProductId(@Param("productId") Long productId);
}
