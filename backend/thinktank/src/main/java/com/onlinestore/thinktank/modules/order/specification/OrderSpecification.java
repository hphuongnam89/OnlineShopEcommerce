package com.onlinestore.thinktank.modules.order.specification;

import com.onlinestore.thinktank.modules.order.entity.Order;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

// Tạo điều kiện lọc đơn hàng theo từ khóa, trạng thái và khoảng thời gian.
public class OrderSpecification {

    public static Specification<Order> filter(String search, LocalDateTime startDate, LocalDateTime endDate, String status) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.trim().isEmpty()) {
                String searchPattern = "%" + search.trim().toLowerCase() + "%";
                Predicate fullNameLike = cb.like(cb.lower(root.get("fullName")), searchPattern);
                Predicate phoneLike = cb.like(cb.lower(root.get("phone")), searchPattern);
                Predicate emailLike = cb.like(cb.lower(root.get("email")), searchPattern);
                predicates.add(cb.or(fullNameLike, phoneLike, emailLike));
            }

            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate));
            }

            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate));
            }

            if (status != null && !status.trim().isEmpty()) {
                predicates.add(cb.equal(cb.lower(root.get("status")), status.trim().toLowerCase()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
