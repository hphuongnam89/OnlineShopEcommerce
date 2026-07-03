package com.onlinestore.thinktank.modules.auth;

import com.onlinestore.thinktank.modules.auth.dto.*;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final com.onlinestore.thinktank.modules.auth.service.RefreshTokenService refreshTokenService;
    private final com.onlinestore.thinktank.security.jwt.JwtService jwtService;

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@Valid @RequestBody RegisterRequest req) {
        authService.register(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Đăng ký thành công!"));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }

    @PostMapping("/refresh")
    @Transactional(readOnly = true)
    public AuthResponse refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        return refreshTokenService.findByToken(request.getRefreshToken())
                .map(refreshTokenService::verifyExpiration)
                .map(com.onlinestore.thinktank.modules.auth.entity.RefreshToken::getUser)
                .map(user -> {
                    String accessToken = jwtService.generateToken(user.getEmail());
                    String roleName = user.getRoles().stream()
                            .map(com.onlinestore.thinktank.modules.role.entity.Role::getName)
                            .findFirst()
                            .orElse("ROLE_CUSTOMER");
                    return AuthResponse.builder()
                            .token(accessToken)
                            .refreshToken(request.getRefreshToken())
                            .email(user.getEmail())
                            .fullName(user.getFullName())
                            .role(roleName)
                            .build();
                })
                .orElseThrow(() -> new com.onlinestore.thinktank.common.exception.ResourceNotFoundException("Refresh token is not in database!"));
    }
}
