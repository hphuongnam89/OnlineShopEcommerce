package com.onlinestore.thinktank.modules.customer.service;

import com.onlinestore.thinktank.modules.customer.entity.Customer;
import com.onlinestore.thinktank.modules.customer.repository.CustomerRepository;
import com.onlinestore.thinktank.modules.customer.specification.CustomerSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CustomerService {

    private final CustomerRepository customerRepository;

    public List<Customer> getCustomers(String search, Long tierId, BigDecimal minSpent, BigDecimal maxSpent) {
        Specification<Customer> spec = CustomerSpecification.filter(search, tierId, minSpent, maxSpent);
        return customerRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "totalSpent"));
    }
}
