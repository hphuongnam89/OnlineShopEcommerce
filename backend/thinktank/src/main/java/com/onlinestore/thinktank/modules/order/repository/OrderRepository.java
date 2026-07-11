package com.onlinestore.thinktank.modules.order.repository;

import com.onlinestore.thinktank.modules.order.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import java.util.Optional;
import java.time.LocalDateTime;

@Repository
// Truy vấn đơn hàng, hỗ trợ tìm kiếm động và thống kê doanh thu.
public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {

    @Override
    Page<Order> findAll(Specification<Order> spec, Pageable pageable);

    @EntityGraph(attributePaths = {"customer", "items", "items.product", "items.variant"})
    List<Order> findAllByIdIn(Collection<Long> ids);

    @Override
    @EntityGraph(attributePaths = {"customer", "items", "items.product", "items.variant"})
    List<Order> findAll(Specification<Order> spec, Sort sort);

    @Override
    @EntityGraph(attributePaths = {"customer", "items", "items.product", "items.variant"})
    Optional<Order> findById(Long id);
    @EntityGraph(attributePaths = {"items", "items.product", "items.variant"})
    Optional<Order> findByTrackingToken(String trackingToken);
    @EntityGraph(attributePaths = {"customer", "items", "items.product", "items.variant"})
    Optional<Order> findByIdempotencyKey(String idempotencyKey);
    List<Order> findTop100ByStatusAndCreatedAtBeforeOrderByCreatedAtAsc(String status, LocalDateTime createdAt);
    @EntityGraph(attributePaths = {"customer", "items", "items.product", "items.variant"})
    List<Order> findByCustomerUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT COUNT(o) > 0 FROM Order o JOIN o.items i " +
           "WHERE o.customer.user.email = :email " +
           "AND i.product.id = :productId " +
           "AND o.status = 'DELIVERED'")
    boolean hasUserPurchasedProduct(@Param("email") String email, @Param("productId") Long productId);

    @Query("SELECT o.customer.id AS customerId, COUNT(o) AS orderCount " +
            "FROM Order o " +
            "WHERE o.customer.id IN :customerIds " +
            "GROUP BY o.customer.id")
    List<CustomerOrderCountView> countOrdersByCustomerIds(@Param("customerIds") Collection<Long> customerIds);

    interface CustomerOrderCountView {
        Long getCustomerId();
        Long getOrderCount();
    }
}
