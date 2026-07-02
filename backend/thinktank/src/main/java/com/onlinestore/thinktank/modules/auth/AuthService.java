package com.onlinestore.thinktank.modules.auth;

import com.onlinestore.thinktank.common.exception.DuplicateResourceException;
import com.onlinestore.thinktank.common.exception.InvalidRequestException;
import com.onlinestore.thinktank.common.exception.ResourceNotFoundException;
import com.onlinestore.thinktank.modules.auth.dto.*;
import com.onlinestore.thinktank.modules.user.entity.User;
import com.onlinestore.thinktank.modules.user.repository.UserRepository;
import com.onlinestore.thinktank.modules.role.entity.Role;
import com.onlinestore.thinktank.modules.role.repository.RoleRepository;
import com.onlinestore.thinktank.modules.customer.entity.Customer;
import com.onlinestore.thinktank.modules.customer.repository.CustomerRepository;
import com.onlinestore.thinktank.modules.customertier.service.CustomerTierResolver;
import com.onlinestore.thinktank.modules.auth.service.RefreshTokenService;
import com.onlinestore.thinktank.modules.auth.entity.RefreshToken;
import com.onlinestore.thinktank.security.jwt.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
@org.springframework.transaction.annotation.Transactional
public class AuthService {

    // Handles account creation, password verification, JWT issuing, and customer profile setup.
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final CustomerRepository customerRepository;
    private final CustomerTierResolver customerTierResolver;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    public void register(RegisterRequest req) {
        // Register customer accounts and create the matching customer profile in one transaction.
        log.info("Registering new user with email: {}", req.getEmail());
        
        if (userRepository.existsByEmail(req.getEmail())) {
            log.warn("Registration attempt with duplicate email: {}", req.getEmail());
            throw new DuplicateResourceException("Email đã được sử dụng!");
        }

        Role customerRole = roleRepository.findByName("ROLE_CUSTOMER")
                .orElseThrow(() -> new ResourceNotFoundException("Default customer role not found"));

        User user = User.builder()
                .email(req.getEmail())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .fullName(req.getFullName())
                .phone(req.getPhone())
                .enabled(true)
                .roles(Set.of(customerRole))
                .build();

        User savedUser = userRepository.save(user);
        log.debug("User created with ID: {}", savedUser.getId());

        // Save Customer entity
        Customer customer = Customer.builder()
                .user(savedUser)
                .tier(customerTierResolver.resolveDefaultCustomerTier())
                .totalSpent(BigDecimal.ZERO)
                .build();

        customerRepository.save(customer);
        log.info("Customer registration completed for email: {}", req.getEmail());
    }

    public AuthResponse login(LoginRequest req) {
        // Validate credentials, issue JWT, and return the basic session profile.
        log.info("Login attempt for email: {}", req.getEmail());

        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> {
                    log.warn("Login failed - user not found: {}", req.getEmail());
                    return new ResourceNotFoundException("User not found");
                });

        if (Boolean.FALSE.equals(user.getEnabled())) {
            log.warn("Login attempt for disabled account: {}", req.getEmail());
            throw new InvalidRequestException("Tài khoản đã bị vô hiệu hóa");
        }

        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            log.warn("Login failed - invalid password for: {}", req.getEmail());
            throw new InvalidRequestException("Invalid password");
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
                Customer customer = Customer.builder()
                        .user(user)
                        .tier(customerTierResolver.resolveDefaultCustomerTier())
                        .totalSpent(BigDecimal.ZERO)
                        .build();

                customerRepository.save(customer);
                log.debug("Auto-created customer profile for user: {}", user.getId());
            }
        }

        log.info("Login successful for email: {}", req.getEmail());
        
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());

        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken.getToken())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(roleName)
                .build();
    }
}
