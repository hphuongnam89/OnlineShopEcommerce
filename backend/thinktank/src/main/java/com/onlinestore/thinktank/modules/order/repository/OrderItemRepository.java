package com.onlinestore.thinktank.modules.order.repository;

import com.onlinestore.thinktank.modules.order.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
}
