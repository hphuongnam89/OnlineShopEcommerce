package com.onlinestore.thinktank.modules.auth.repository;

import com.onlinestore.thinktank.modules.auth.entity.RefreshToken;
import com.onlinestore.thinktank.modules.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.stereotype.Repository;
import jakarta.persistence.LockModeType;

import java.util.Optional;

@Repository
// Truy vấn và quản lý refresh token trong cơ sở dữ liệu.
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<RefreshToken> findByTokenHash(String tokenHash);
    Optional<RefreshToken> findByUser(User user);
}
