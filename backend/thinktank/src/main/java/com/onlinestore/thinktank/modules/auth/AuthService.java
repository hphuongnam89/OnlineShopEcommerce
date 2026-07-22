package com.onlinestore.thinktank.modules.auth;

import com.onlinestore.thinktank.common.exception.DuplicateResourceException;
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
import com.onlinestore.thinktank.security.jwt.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Set;
import java.util.Locale;

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
    private final String dummyPasswordHash = new BCryptPasswordEncoder().encode("not-a-real-password");

    public void register(RegisterRequest req) {
        // Register customer accounts and create the matching customer profile in one transaction.
        String email = normalizeEmail(req.getEmail());
        log.info("Registering new user");
        
        if (userRepository.existsByEmail(email)) {
            log.warn("Registration attempt with duplicate email");
            throw new DuplicateResourceException("Email đã được sử dụng!");
        }
        String phone = req.getPhone().trim();
        if (userRepository.existsByPhone(phone)) {
            throw new DuplicateResourceException("Số điện thoại đã được sử dụng!");
        }

        Role customerRole = roleRepository.findByName("ROLE_CUSTOMER")
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy quyền khách hàng mặc định (ROLE_CUSTOMER)"));

        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .fullName(req.getFullName())
                .phone(phone)
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
        log.info("Customer registration completed");
    }

    public AuthResponse login(LoginRequest req) {
        // Validate credentials, issue JWT, and return the basic session profile.
        String email = normalizeEmail(req.getEmail());
        var userResult = userRepository.findByEmail(email);
        String passwordHash = userResult.map(User::getPasswordHash).orElse(dummyPasswordHash);
        boolean passwordMatches = passwordEncoder.matches(req.getPassword(), passwordHash);
        User user = userResult.orElse(null);

        if (user == null || !passwordMatches || Boolean.FALSE.equals(user.getEnabled())) {
            log.warn("Login failed");
            throw new BadCredentialsException("Email hoặc mật khẩu không đúng");
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

        log.info("Login successful");
        
        String refreshToken = refreshTokenService.createRefreshToken(user.getId());

        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .role(roleName)
                .build();
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
