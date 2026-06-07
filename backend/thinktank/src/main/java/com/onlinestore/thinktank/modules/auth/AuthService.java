package com.onlinestore.thinktank.modules.auth;

import com.onlinestore.thinktank.modules.auth.dto.*;
import com.onlinestore.thinktank.modules.user.entity.User;
import com.onlinestore.thinktank.modules.user.repository.UserRepository;
import com.onlinestore.thinktank.modules.role.entity.Role;
import com.onlinestore.thinktank.modules.role.repository.RoleRepository;
import com.onlinestore.thinktank.modules.customer.entity.Customer;
import com.onlinestore.thinktank.modules.customer.repository.CustomerRepository;
import com.onlinestore.thinktank.modules.customertier.entity.CustomerTier;
import com.onlinestore.thinktank.modules.customertier.repository.CustomerTierRepository;
import com.onlinestore.thinktank.security.jwt.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@org.springframework.transaction.annotation.Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final CustomerRepository customerRepository;
    private final CustomerTierRepository customerTierRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public void register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Email đã được sử dụng!");
        }

        Role customerRole = roleRepository.findByName("ROLE_CUSTOMER")
                .orElseThrow(() -> new RuntimeException("Default customer role not found"));

        User user = User.builder()
                .email(req.getEmail())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .fullName(req.getFullName())
                .phone(req.getPhone())
                .enabled(true)
                .roles(Set.of(customerRole))
                .build();

        User savedUser = userRepository.save(user);

        // Fetch default BRONZE tier
        List<CustomerTier> tiers = customerTierRepository.findAllByOrderByMinSpendingAsc();
        CustomerTier bronzeTier = tiers.stream()
                .filter(t -> "BRONZE".equals(t.getName()))
                .findFirst()
                .orElse(null);

        // Save Customer entity
        Customer customer = Customer.builder()
                .user(savedUser)
                .tier(bronzeTier)
                .totalSpent(BigDecimal.ZERO)
                .build();

        customerRepository.save(customer);
    }

    public AuthResponse login(LoginRequest req) {

        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (Boolean.FALSE.equals(user.getEnabled())) {
            throw new RuntimeException("Tài khoản đã bị vô hiệu hóa");
        }

        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid password");
        }

        String token = jwtService.generateToken(user.getEmail());

        String roleName = user.getRoles().stream()
                .map(Role::getName)
                .findFirst()
                .orElse("ROLE_CUSTOMER");

        // Self-healing logic for existing users registered without a Customer record
        if ("ROLE_CUSTOMER".equals(roleName)) {
            boolean hasCustomer = customerRepository.findByUserId(user.getId()).isPresent();
            if (!hasCustomer) {
                List<CustomerTier> tiers = customerTierRepository.findAllByOrderByMinSpendingAsc();
                CustomerTier bronzeTier = tiers.stream()
                        .filter(t -> "BRONZE".equals(t.getName()))
                        .findFirst()
                        .orElse(null);

                Customer customer = Customer.builder()
                        .user(user)
                        .tier(bronzeTier)
                        .totalSpent(BigDecimal.ZERO)
                        .build();

                customerRepository.save(customer);
            }
        }

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(roleName)
                .build();
    }
}
