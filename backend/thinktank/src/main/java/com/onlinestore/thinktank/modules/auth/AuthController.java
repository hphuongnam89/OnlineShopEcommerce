package com.onlinestore.thinktank.modules.auth;

import com.onlinestore.thinktank.modules.auth.dto.*;
import com.onlinestore.thinktank.modules.auth.AuthService;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final com.onlinestore.thinktank.modules.auth.service.RefreshTokenService refreshTokenService;
    private final com.onlinestore.thinktank.security.jwt.JwtService jwtService;

    @PostMapping("/register")
    public void register(@Valid @RequestBody RegisterRequest req) {
        authService.register(req);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }

    @PostMapping("/refresh")
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
