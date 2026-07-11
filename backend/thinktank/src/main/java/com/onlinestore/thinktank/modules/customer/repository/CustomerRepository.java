package com.onlinestore.thinktank.modules.customer.repository;

import com.onlinestore.thinktank.modules.customer.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

// Truy vấn hồ sơ khách hàng và hỗ trợ bộ lọc động bằng Specification.
public interface CustomerRepository extends JpaRepository<Customer, Long>, JpaSpecificationExecutor<Customer> {

    Optional<Customer> findByUserId(Long userId);

    Optional<Customer> findByUserPhone(String phone);
}
