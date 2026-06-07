package com.onlinestore.thinktank.modules.customer.specification;

import com.onlinestore.thinktank.modules.customer.entity.Customer;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class CustomerSpecification {

    public static Specification<Customer> filter(String search, Long tierId, BigDecimal minSpent, BigDecimal maxSpent) {
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

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
