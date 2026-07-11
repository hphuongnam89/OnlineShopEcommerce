package com.onlinestore.thinktank.modules.auth;

import com.onlinestore.thinktank.modules.auth.dto.*;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.time.Duration;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
// Tiếp nhận yêu cầu đăng ký, đăng nhập, làm mới token và đăng xuất.
public class AuthController {

    private final AuthService authService;
    private final com.onlinestore.thinktank.modules.auth.service.RefreshTokenService refreshTokenService;
    private final com.onlinestore.thinktank.security.jwt.JwtService jwtService;

    @Value("${app.auth.secure-cookie:true}")
    private boolean secureCookie;

    private static final String REFRESH_COOKIE = "refresh_token";

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@Valid @RequestBody RegisterRequest req) {
        authService.register(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Đăng ký thành công!"));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        AuthResponse response = authService.login(req);
        String refreshToken = response.getRefreshToken();
        response.setRefreshToken(null);
        return withRefreshCookie(response, refreshToken);
    }

    @PostMapping("/refresh")
    @Transactional
    public ResponseEntity<AuthResponse> refreshToken(
            @CookieValue(name = REFRESH_COOKIE, required = false) String rawToken
    ) {
        var storedToken = refreshTokenService.findByToken(rawToken)
                .orElseThrow(() -> new org.springframework.security.authentication.BadCredentialsException("Phiên đăng nhập không hợp lệ"));
        var user = storedToken.getUser();
        if (Boolean.FALSE.equals(user.getEnabled())) {
            refreshTokenService.revoke(rawToken);
            throw new org.springframework.security.authentication.BadCredentialsException("Phiên đăng nhập không hợp lệ");
        }

        String rotatedToken = refreshTokenService.rotate(storedToken);
        String roleName = user.getRoles().stream()
                .map(com.onlinestore.thinktank.modules.role.entity.Role::getName)
                .findFirst()
                .orElse("ROLE_CUSTOMER");
        AuthResponse response = AuthResponse.builder()
                .token(jwtService.generateToken(user.getEmail()))
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .role(roleName)
                .build();
        return withRefreshCookie(response, rotatedToken);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(name = REFRESH_COOKIE, required = false) String rawToken
    ) {
        refreshTokenService.revoke(rawToken);
        ResponseCookie expired = refreshCookie("", Duration.ZERO);
        return ResponseEntity.noContent().header(HttpHeaders.SET_COOKIE, expired.toString()).build();
    }

    private ResponseEntity<AuthResponse> withRefreshCookie(AuthResponse body, String rawToken) {
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie(rawToken, Duration.ofDays(7)).toString())
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(body);
    }

    private ResponseCookie refreshCookie(String value, Duration maxAge) {
        return ResponseCookie.from(REFRESH_COOKIE, value)
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite("Strict")
                .path("/api/auth")
                .maxAge(maxAge)
                .build();
    }
}
