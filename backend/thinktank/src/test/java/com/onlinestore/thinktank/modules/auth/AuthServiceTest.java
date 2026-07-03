package com.onlinestore.thinktank.modules.auth;

import com.onlinestore.thinktank.modules.auth.dto.AuthResponse;
import com.onlinestore.thinktank.modules.auth.dto.LoginRequest;
import com.onlinestore.thinktank.modules.auth.entity.RefreshToken;
import com.onlinestore.thinktank.modules.auth.service.RefreshTokenService;
import com.onlinestore.thinktank.modules.customer.repository.CustomerRepository;
import com.onlinestore.thinktank.modules.customertier.repository.CustomerTierRepository;
import com.onlinestore.thinktank.modules.role.entity.Role;
import com.onlinestore.thinktank.modules.role.repository.RoleRepository;
import com.onlinestore.thinktank.modules.user.entity.User;
import com.onlinestore.thinktank.modules.user.repository.UserRepository;
import com.onlinestore.thinktank.security.jwt.JwtService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private CustomerTierRepository customerTierRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;
    @Mock private RefreshTokenService refreshTokenService;

    @InjectMocks private AuthService authService;

    @Test
    void login_shouldRejectDisabledAccount() {
        User user = User.builder()
                .id(1L)
                .email("admin@thinktank.com")
                .passwordHash("$2a$10$hash")
                .enabled(false)
                .roles(Set.of(Role.builder().name("ROLE_ADMIN").build()))
                .build();

        when(userRepository.findByEmail("admin@thinktank.com")).thenReturn(Optional.of(user));

        LoginRequest request = new LoginRequest();
        request.setEmail("admin@thinktank.com");
        request.setPassword("Admin@123456");

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                authService.login(request)
        );

        assertEquals("Tài khoản đã bị vô hiệu hóa", ex.getMessage());
    }

    @Test
    void login_shouldReturnAuthResponseForActiveUser() {
        Role adminRole = Role.builder().name("ROLE_ADMIN").build();
        User user = User.builder()
                .id(1L)
                .email("admin@thinktank.com")
                .passwordHash("hashed")
                .fullName("Admin")
                .enabled(true)
                .roles(Set.of(adminRole))
                .build();

        when(userRepository.findByEmail("admin@thinktank.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Admin@123456", "hashed")).thenReturn(true);
        when(jwtService.generateToken("admin@thinktank.com")).thenReturn("jwt-token");
        when(refreshTokenService.createRefreshToken(1L))
                .thenReturn(RefreshToken.builder().token("refresh-token").user(user).build());

        LoginRequest request = new LoginRequest();
        request.setEmail("admin@thinktank.com");
        request.setPassword("Admin@123456");

        AuthResponse response = authService.login(request);

        assertEquals("jwt-token", response.getToken());
        assertEquals("refresh-token", response.getRefreshToken());
        assertEquals("ROLE_ADMIN", response.getRole());
    }
}
