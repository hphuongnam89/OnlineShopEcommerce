package com.onlinestore.thinktank.modules.auth.service;

import com.onlinestore.thinktank.modules.auth.entity.RefreshToken;
import com.onlinestore.thinktank.modules.auth.repository.RefreshTokenRepository;
import com.onlinestore.thinktank.modules.user.entity.User;
import com.onlinestore.thinktank.modules.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {

    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private UserRepository userRepository;
    @InjectMocks private RefreshTokenService refreshTokenService;

    @Test
    void repeatedLoginShouldUpdateExistingRefreshToken() {
        User user = User.builder().id(1L).build();
        RefreshToken existing = RefreshToken.builder().id(2L).user(user).token("old-token").build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(refreshTokenRepository.findByUser(user)).thenReturn(Optional.of(existing));
        when(refreshTokenRepository.save(existing)).thenReturn(existing);

        RefreshToken result = refreshTokenService.createRefreshToken(1L);

        assertSame(existing, result);
        assertNotEquals("old-token", result.getToken());
    }
}
