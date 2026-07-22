package com.onlinestore.thinktank.modules.user.repository;

import com.onlinestore.thinktank.modules.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// Truy vấn tài khoản dùng cho đăng nhập, hồ sơ cá nhân và quản trị người dùng.
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);
}
