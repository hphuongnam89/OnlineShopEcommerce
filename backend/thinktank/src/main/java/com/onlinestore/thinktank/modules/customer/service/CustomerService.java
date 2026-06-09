package com.onlinestore.thinktank.modules.customer.service;

import com.onlinestore.thinktank.modules.customer.dto.AdminCustomerResponse;
import com.onlinestore.thinktank.modules.customer.dto.CustomerRequest;
import com.onlinestore.thinktank.modules.customer.entity.Customer;
import com.onlinestore.thinktank.modules.customer.repository.CustomerRepository;
import com.onlinestore.thinktank.modules.customer.specification.CustomerSpecification;
import com.onlinestore.thinktank.modules.customertier.entity.CustomerTier;
import com.onlinestore.thinktank.modules.customertier.service.CustomerTierResolver;
import com.onlinestore.thinktank.modules.order.repository.OrderRepository;
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
import java.util.Map;
import java.util.stream.Collectors;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final CustomerTierResolver customerTierResolver;
    private final OrderRepository orderRepository;
    private final PasswordEncoder passwordEncoder;

    public List<Customer> getCustomers(String search, Long tierId, BigDecimal minSpent, BigDecimal maxSpent) {
        return getCustomers(search, tierId, minSpent, maxSpent, null, null);
    }

    public List<Customer> getCustomers(String search, Long tierId, BigDecimal minSpent, BigDecimal maxSpent, Long minOrders, Long maxOrders) {
        // Central customer listing used by both admin views and report exports.
        Specification<Customer> spec = CustomerSpecification.filter(search, tierId, minSpent, maxSpent, minOrders, maxOrders);
        return customerRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "totalSpent"));
    }

    public List<AdminCustomerResponse> getAdminCustomers(String search, Long tierId, BigDecimal minSpent, BigDecimal maxSpent, Long minOrders, Long maxOrders) {
        // Build the admin response with order count and tier snapshot for dashboard display.
        List<Customer> customers = getCustomers(search, tierId, minSpent, maxSpent, minOrders, maxOrders);
        Map<Long, Long> orderCountMap = loadOrderCountMap(customers);
        return customers.stream()
                .map(customer -> toAdminResponse(customer, orderCountMap.getOrDefault(customer.getId(), 0L)))
                .collect(Collectors.toList());
    }

    @Transactional
    public Customer createCustomer(CustomerRequest request) {
        // Create the linked user account first so the customer record can reference it safely.
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
        CustomerTier tier = customerTierResolver.resolveBySpent(totalSpent);

        Customer customer = Customer.builder()
                .user(user)
                .tier(tier)
                .totalSpent(totalSpent)
                .build();

        return customerRepository.save(customer);
    }

    @Transactional
    public Customer updateCustomer(Long id, CustomerRequest request) {
        // Update the user profile and customer spending/tier together to keep the pair in sync.
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
            CustomerTier tier = customerTierResolver.resolveBySpent(request.getTotalSpent());
            customer.setTier(tier);
        }

        return customerRepository.save(customer);
    }

    @Transactional
    public void deleteCustomer(Long id) {
        // Soft delete the customer and its linked user account so the identity cannot be reused accidentally.
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + id));

        User user = customer.getUser();

        // Mark the customer as deleted instead of removing the row.
        customer.setDeleted(true);
        customerRepository.save(customer);

        if (user != null) {
            // Disable the user account and soft delete it as well.
            user.setEnabled(false);
            user.setDeleted(true);
            userRepository.save(user);
        }
    }

    private Map<Long, Long> loadOrderCountMap(List<Customer> customers) {
        List<Long> customerIds = customers.stream()
                .map(Customer::getId)
                .toList();
        if (customerIds.isEmpty()) {
            return Map.of();
        }

        return orderRepository.countOrdersByCustomerIds(customerIds).stream()
                .collect(Collectors.toMap(
                        OrderRepository.CustomerOrderCountView::getCustomerId,
                        view -> view.getOrderCount() == null ? 0L : view.getOrderCount()
                ));
    }

    private AdminCustomerResponse toAdminResponse(Customer customer, Long orderCount) {
        User user = customer.getUser();
        CustomerTier tier = customer.getTier();
        return AdminCustomerResponse.builder()
                .id(customer.getId())
                .user(AdminCustomerResponse.UserSummary.builder()
                        .id(user != null ? user.getId() : null)
                        .fullName(user != null ? user.getFullName() : null)
                        .email(user != null ? user.getEmail() : null)
                        .phone(user != null ? user.getPhone() : null)
                        .build())
                .tier(tier == null ? null : AdminCustomerResponse.TierSummary.builder()
                        .id(tier.getId())
                        .name(tier.getName())
                        .minSpending(tier.getMinSpending())
                        .discountPercent(tier.getDiscountPercent())
                        .build())
                .totalSpent(customer.getTotalSpent())
                .orderCount(orderCount == null ? 0L : orderCount)
                .createdAt(customer.getCreatedAt())
                .build();
    }

    public AdminCustomerResponse getAdminCustomerById(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + id));
        Map<Long, Long> orderCountMap = loadOrderCountMap(List.of(customer));
        return toAdminResponse(customer, orderCountMap.getOrDefault(customer.getId(), 0L));
    }
}
