package com.onlinestore.thinktank.modules.order.repository;

import com.onlinestore.thinktank.modules.order.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {
    List<Order> findByCustomerUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT COUNT(o) > 0 FROM Order o JOIN o.items i " +
           "WHERE o.customer.user.email = :email " +
           "AND i.product.id = :productId " +
           "AND o.status = 'DELIVERED'")
    boolean hasUserPurchasedProduct(@Param("email") String email, @Param("productId") Long productId);
}
