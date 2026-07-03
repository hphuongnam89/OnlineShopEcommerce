package com.onlinestore.thinktank.modules.user.service;

import com.onlinestore.thinktank.modules.customer.entity.Customer;
import com.onlinestore.thinktank.modules.customer.repository.CustomerRepository;
import com.onlinestore.thinktank.modules.customertier.entity.CustomerTier;
import com.onlinestore.thinktank.modules.customertier.repository.CustomerTierRepository;
import com.onlinestore.thinktank.modules.order.entity.Order;
import com.onlinestore.thinktank.modules.order.repository.OrderRepository;
import com.onlinestore.thinktank.modules.role.entity.Role;
import com.onlinestore.thinktank.modules.user.dto.ProfileResponse;
import com.onlinestore.thinktank.modules.user.dto.ProfileUpdateRequest;
import com.onlinestore.thinktank.modules.user.entity.User;
import com.onlinestore.thinktank.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ProfileService {

    // Customer self-service profile logic used by the storefront account page.
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final CustomerTierRepository customerTierRepository;
    private final OrderRepository orderRepository;

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(String currentEmail) {
        User user = findActiveUser(currentEmail);
        return toResponse(user);
    }

    public ProfileResponse updateProfile(String currentEmail, ProfileUpdateRequest request) {
        User user = findActiveUser(currentEmail);

        user.setFullName(request.getFullName().trim());
        user.setPhone(request.getPhone().trim());
        user.setAddress(normalizeOptional(request.getAddress()));

        return toResponse(userRepository.save(user));
    }

    private User findActiveUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (Boolean.FALSE.equals(user.getEnabled())) {
            throw new RuntimeException("Tài khoản đã bị vô hiệu hóa");
        }
        return user;
    }

    private ProfileResponse toResponse(User user) {
        Customer customer = customerRepository.findByUserId(user.getId()).orElse(null);
        CustomerTier currentTier = customer != null ? customer.getTier() : null;
        BigDecimal totalSpent = customer != null && customer.getTotalSpent() != null
                ? customer.getTotalSpent()
                : BigDecimal.ZERO;
        CustomerTier resolvedTier = resolveDisplayTier(currentTier, totalSpent);
        CustomerTier nextTier = resolveNextTier(totalSpent, resolvedTier);
        BigDecimal nextTierMinSpending = nextTier != null ? nextTier.getMinSpending() : null;
        BigDecimal amountToNextTier = nextTierMinSpending != null
                ? nextTierMinSpending.subtract(totalSpent).max(BigDecimal.ZERO)
                : BigDecimal.ZERO;

        String roleName = user.getRoles().stream()
                .map(Role::getName)
                .findFirst()
                .orElse("ROLE_CUSTOMER");

        return ProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .address(resolveAddress(user))
                .role(roleName)
                .tierName(resolvedTier != null ? resolvedTier.getName() : "BRONZE")
                .totalSpent(totalSpent)
                .discountPercent(resolvedTier != null ? resolvedTier.getDiscountPercent() : 0)
                .nextTierName(nextTier != null ? nextTier.getName() : null)
                .nextTierMinSpending(nextTierMinSpending)
                .amountToNextTier(amountToNextTier)
                .build();
    }

    private CustomerTier resolveDisplayTier(CustomerTier currentTier, BigDecimal totalSpent) {
        CustomerTier defaultTier = resolveDefaultTier();
        if (currentTier != null && currentTier.getMinSpending() != null
                && totalSpent.compareTo(currentTier.getMinSpending()) >= 0) {
            if (defaultTier == null || currentTier.getMinSpending().compareTo(defaultTier.getMinSpending()) >= 0) {
                return currentTier;
            }
        }

        CustomerTier earnedTier = customerTierRepository.findAllByOrderByMinSpendingAsc().stream()
                .filter(tier -> tier.getMinSpending() != null && totalSpent.compareTo(tier.getMinSpending()) >= 0)
                .max(Comparator.comparing(CustomerTier::getMinSpending))
                .orElse(currentTier);

        if (defaultTier != null && (earnedTier == null || earnedTier.getMinSpending() == null
                || earnedTier.getMinSpending().compareTo(defaultTier.getMinSpending()) < 0)) {
            return defaultTier;
        }
        return earnedTier;
    }

    private CustomerTier resolveNextTier(BigDecimal totalSpent, CustomerTier currentTier) {
        List<CustomerTier> tiers = customerTierRepository.findAllByOrderByMinSpendingAsc();
        BigDecimal baseline = currentTier != null && currentTier.getMinSpending() != null
                ? currentTier.getMinSpending()
                : totalSpent;
        return tiers.stream()
                .filter(tier -> tier.getMinSpending() != null && tier.getMinSpending().compareTo(baseline) > 0)
                .min(Comparator.comparing(CustomerTier::getMinSpending))
                .orElse(null);
    }

    private CustomerTier resolveDefaultTier() {
        return customerTierRepository.findAllByOrderByMinSpendingAsc().stream()
                .filter(tier -> "BRONZE".equalsIgnoreCase(tier.getName()))
                .findFirst()
                .orElse(null);
    }

    private String resolveAddress(User user) {
        if (user.getAddress() != null && !user.getAddress().trim().isEmpty()) {
            return user.getAddress();
        }

        return orderRepository.findByCustomerUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(Order::getAddress)
                .filter(address -> address != null && !address.trim().isEmpty())
                .findFirst()
                .orElse("");
    }

    private String normalizeOptional(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }
}
