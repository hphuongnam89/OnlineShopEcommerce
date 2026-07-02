package com.onlinestore.thinktank.modules.auth.repository;

import com.onlinestore.thinktank.modules.auth.entity.RefreshToken;
import com.onlinestore.thinktank.modules.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);
    void deleteByUser(User user);
}
