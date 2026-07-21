package com.onlinestore.thinktank.modules.user.controller;

import com.onlinestore.thinktank.modules.customer.entity.Customer;
import com.onlinestore.thinktank.modules.customer.repository.CustomerRepository;
import com.onlinestore.thinktank.modules.customertier.entity.CustomerTier;
import com.onlinestore.thinktank.modules.customertier.repository.CustomerTierRepository;
import com.onlinestore.thinktank.modules.role.entity.Role;
import com.onlinestore.thinktank.modules.role.repository.RoleRepository;
import com.onlinestore.thinktank.modules.user.entity.User;
import com.onlinestore.thinktank.modules.user.repository.UserRepository;
import com.onlinestore.thinktank.security.jwt.JwtService;
import com.onlinestore.thinktank.security.service.CustomUserDetailsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Set;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
// Kiểm tra API hồ sơ chỉ cho phép người dùng đã xác thực truy cập và cập nhật.
class ProfileSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private CustomerTierRepository customerTierRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    private String testEmail;

    @BeforeEach
    void setUp() {
        customerRepository.deleteAll();
        customerTierRepository.deleteAll();
        userRepository.deleteAll();
        roleRepository.deleteAll();
        testEmail = "customer-" + UUID.randomUUID() + "@example.com";

        Role customerRole = roleRepository.save(Role.builder()
                .name("ROLE_CUSTOMER")
                .build());

        User user = User.builder()
                .email(testEmail)
                .passwordHash("hashed-password")
                .fullName("Customer")
                .phone("0912345678")
                .address("123 Nguyen Hue, Quan 1, TP.HCM")
                .enabled(true)
                .roles(Set.of(customerRole))
                .build();

        User savedUser = userRepository.save(user);

        CustomerTier silver = customerTierRepository.save(CustomerTier.builder()
                .name("SILVER")
                .minSpending(new BigDecimal("10000000"))
                .discountPercent(5)
                .build());
        customerTierRepository.save(CustomerTier.builder()
                .name("GOLD")
                .minSpending(new BigDecimal("20000000"))
                .discountPercent(10)
                .build());

        customerRepository.save(Customer.builder()
                .user(savedUser)
                .tier(silver)
                .totalSpent(new BigDecimal("13700000"))
                .build());
    }

    @Test
    void profileEndpointShouldAcceptValidJwt() throws Exception {
        String token = jwtService.generateToken(testEmail);
        assertEquals(testEmail, jwtService.extractEmail(token));
        assertEquals(testEmail, userDetailsService.loadUserByUsername(testEmail).getUsername());

        mockMvc.perform(get("/api/profile")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(testEmail))
                .andExpect(jsonPath("$.fullName").value("Customer"))
                .andExpect(jsonPath("$.address").value("123 Nguyen Hue, Quan 1, TP.HCM"))
                .andExpect(jsonPath("$.tierName").value("SILVER"))
                .andExpect(jsonPath("$.discountPercent").value(5))
                .andExpect(jsonPath("$.nextTierName").value("GOLD"))
                .andExpect(jsonPath("$.amountToNextTier").value(6300000));
    }

    @Test
    void profilePreflightShouldBeAllowed() throws Exception {
        mockMvc.perform(options("/api/profile")
                        .header(HttpHeaders.ORIGIN, "http://localhost:5173")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "authorization"))
                .andExpect(status().isOk());
    }
}
