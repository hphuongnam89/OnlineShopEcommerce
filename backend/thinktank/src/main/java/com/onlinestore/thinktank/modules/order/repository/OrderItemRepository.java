package com.onlinestore.thinktank.modules.order.repository;

import com.onlinestore.thinktank.modules.order.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
// Truy vấn các dòng sản phẩm thuộc từng đơn hàng.
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
}
