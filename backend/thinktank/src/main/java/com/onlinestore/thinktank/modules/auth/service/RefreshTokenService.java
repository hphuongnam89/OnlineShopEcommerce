package com.onlinestore.thinktank.modules.auth.service;

import com.onlinestore.thinktank.modules.auth.entity.RefreshToken;
import com.onlinestore.thinktank.modules.auth.repository.RefreshTokenRepository;
import com.onlinestore.thinktank.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    // 7 days expiration for refresh token
    private final long refreshTokenDurationMs = 604800000L;

    @Transactional
    public String createRefreshToken(Long userId) {
        var user = userRepository.findById(userId).orElseThrow(() -> new com.onlinestore.thinktank.common.exception.ResourceNotFoundException("Không tìm thấy tài khoản người dùng"));
        RefreshToken refreshToken = refreshTokenRepository.findByUser(user).orElseGet(RefreshToken::new);
        String rawToken = generateToken();
        refreshToken.setUser(user);
        refreshToken.setExpiryDate(Instant.now().plusMillis(refreshTokenDurationMs));
        refreshToken.setTokenHash(hash(rawToken));
        refreshTokenRepository.save(refreshToken);
        return rawToken;
    }

    @Transactional
    public Optional<RefreshToken> findByToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) return Optional.empty();
        return refreshTokenRepository.findByTokenHash(hash(rawToken));
    }

    @Transactional
    public String rotate(RefreshToken token) {
        verifyExpiration(token);
        String rawToken = generateToken();
        token.setTokenHash(hash(rawToken));
        token.setExpiryDate(Instant.now().plusMillis(refreshTokenDurationMs));
        refreshTokenRepository.save(token);
        return rawToken;
    }

    @Transactional
    public void revoke(String rawToken) {
        findByToken(rawToken).ifPresent(refreshTokenRepository::delete);
    }

    @Transactional
    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiryDate().compareTo(Instant.now()) < 0) {
            refreshTokenRepository.delete(token);
            throw new BadCredentialsException("Phiên đăng nhập không hợp lệ");
        }
        return token;
    }

    private String generateToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String rawToken) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is unavailable", e);
        }
    }
}
