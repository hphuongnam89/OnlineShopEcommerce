package com.onlinestore.thinktank.modules.permission.repository;

import com.onlinestore.thinktank.modules.permission.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// Truy vấn danh mục quyền dùng cho mô hình phân quyền hệ thống.
public interface PermissionRepository extends JpaRepository<Permission, Long> {

    Optional<Permission> findByName(String name);
}
