package com.onlinestore.thinktank.modules.permission.repository;

import com.onlinestore.thinktank.modules.permission.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PermissionRepository extends JpaRepository<Permission, Long> {

    Optional<Permission> findByName(String name);
}