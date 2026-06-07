package com.onlinestore.thinktank.modules.customer.service;

import com.onlinestore.thinktank.modules.customer.dto.CustomerRequest;
import com.onlinestore.thinktank.modules.customer.entity.Customer;
import com.onlinestore.thinktank.modules.customer.repository.CustomerRepository;
import com.onlinestore.thinktank.modules.customer.specification.CustomerSpecification;
import com.onlinestore.thinktank.modules.customertier.entity.CustomerTier;
import com.onlinestore.thinktank.modules.customertier.repository.CustomerTierRepository;
import com.onlinestore.thinktank.modules.role.entity.Role;
import com.onlinestore.thinktank.modules.role.repository.RoleRepository;
import com.onlinestore.thinktank.modules.user.entity.User;
import com.onlinestore.thinktank.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final CustomerTierRepository customerTierRepository;
    private final PasswordEncoder passwordEncoder;

    public List<Customer> getCustomers(String search, Long tierId, BigDecimal minSpent, BigDecimal maxSpent) {
        Specification<Customer> spec = CustomerSpecification.filter(search, tierId, minSpent, maxSpent);
        return customerRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "totalSpent"));
    }

    @Transactional
    public Customer createCustomer(CustomerRequest request) {
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new RuntimeException("Email is required");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email is already taken");
        }
        if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            throw new RuntimeException("Password is required");
        }

        Role customerRole = roleRepository.findByName("ROLE_CUSTOMER")
                .orElseThrow(() -> new RuntimeException("ROLE_CUSTOMER role not found"));

        User user = User.builder()
                .email(request.getEmail().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword().trim()))
                .fullName(request.getFullName() != null ? request.getFullName().trim() : null)
                .phone(request.getPhone() != null ? request.getPhone().trim() : null)
                .enabled(true)
                .roles(Set.of(customerRole))
                .build();
        userRepository.save(user);

        BigDecimal totalSpent = request.getTotalSpent() != null ? request.getTotalSpent() : BigDecimal.ZERO;
        CustomerTier tier = resolveTier(totalSpent);

        Customer customer = Customer.builder()
                .user(user)
                .tier(tier)
                .totalSpent(totalSpent)
                .build();

        return customerRepository.save(customer);
    }

    @Transactional
    public Customer updateCustomer(Long id, CustomerRequest request) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + id));

        User user = customer.getUser();
        if (user == null) {
            throw new RuntimeException("Associated user not found for customer: " + id);
        }

        if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            String newEmail = request.getEmail().trim();
            if (!newEmail.equalsIgnoreCase(user.getEmail()) && userRepository.existsByEmail(newEmail)) {
                throw new RuntimeException("Email is already taken");
            }
            user.setEmail(newEmail);
        }

        if (request.getPhone() != null) {
            user.setPhone(request.getPhone().trim());
        }

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName().trim());
        }

        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword().trim()));
        }

        userRepository.save(user);

        if (request.getTotalSpent() != null) {
            customer.setTotalSpent(request.getTotalSpent());
            CustomerTier tier = resolveTier(request.getTotalSpent());
            customer.setTier(tier);
        }

        return customerRepository.save(customer);
    }

    @Transactional
    public void deleteCustomer(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + id));

        User user = customer.getUser();
        
        // Delete Customer first to avoid constraint violation
        customerRepository.delete(customer);
        
        if (user != null) {
            userRepository.delete(user);
        }
    }

    private CustomerTier resolveTier(BigDecimal totalSpent) {
        List<CustomerTier> tiers = customerTierRepository.findAllByOrderByMinSpendingAsc();
        CustomerTier matchedTier = null;
        for (CustomerTier tier : tiers) {
            if (totalSpent.compareTo(tier.getMinSpending()) >= 0) {
                matchedTier = tier;
            }
        }
        if (matchedTier == null && !tiers.isEmpty()) {
            matchedTier = tiers.get(0);
        }
        return matchedTier;
    }
}
