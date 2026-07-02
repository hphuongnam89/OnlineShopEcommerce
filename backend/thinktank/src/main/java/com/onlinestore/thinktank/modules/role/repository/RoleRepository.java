package com.onlinestore.thinktank.modules.role.repository;

import com.onlinestore.thinktank.modules.role.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {

    Optional<Role> findByName(String name);
}