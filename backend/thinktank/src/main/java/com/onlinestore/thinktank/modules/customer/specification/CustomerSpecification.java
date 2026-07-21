package com.onlinestore.thinktank.modules.customer.specification;

import com.onlinestore.thinktank.modules.customer.entity.Customer;
import com.onlinestore.thinktank.modules.order.entity.Order;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

// Tạo điều kiện lọc động cho màn hình tìm kiếm khách hàng của quản trị viên.
public class CustomerSpecification {

    public static Specification<Customer> filter(String search, Long tierId, BigDecimal minSpent, BigDecimal maxSpent, Long minOrders, Long maxOrders) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.trim().isEmpty()) {
                String searchPattern = "%" + search.trim().toLowerCase() + "%";
                Predicate fullNameLike = cb.like(cb.lower(root.get("user").get("fullName")), searchPattern);
                Predicate phoneLike = cb.like(cb.lower(root.get("user").get("phone")), searchPattern);
                Predicate emailLike = cb.like(cb.lower(root.get("user").get("email")), searchPattern);
                predicates.add(cb.or(fullNameLike, phoneLike, emailLike));
            }

            if (tierId != null) {
                predicates.add(cb.equal(root.get("tier").get("id"), tierId));
            }

            if (minSpent != null) {
                predicates.add(cb.ge(root.get("totalSpent"), minSpent));
            }

            if (maxSpent != null) {
                predicates.add(cb.le(root.get("totalSpent"), maxSpent));
            }

            if (minOrders != null || maxOrders != null) {
                Subquery<Long> orderCountSubquery = query.subquery(Long.class);
                var orderRoot = orderCountSubquery.from(Order.class);
                orderCountSubquery.select(cb.count(orderRoot));
                orderCountSubquery.where(cb.equal(orderRoot.get("customer").get("id"), root.get("id")));

                if (minOrders != null) {
                    predicates.add(cb.ge(orderCountSubquery, minOrders));
                }
                if (maxOrders != null) {
                    predicates.add(cb.le(orderCountSubquery, maxOrders));
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
