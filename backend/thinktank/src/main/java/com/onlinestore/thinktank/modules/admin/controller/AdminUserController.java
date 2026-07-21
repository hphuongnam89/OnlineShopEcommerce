package com.onlinestore.thinktank.modules.admin.controller;

import com.onlinestore.thinktank.common.exception.DuplicateResourceException;
import com.onlinestore.thinktank.common.exception.InvalidRequestException;
import com.onlinestore.thinktank.common.exception.ResourceNotFoundException;
import com.onlinestore.thinktank.modules.admin.dto.AdminUserResponse;
import com.onlinestore.thinktank.modules.admin.dto.CreateAdminRequest;
import com.onlinestore.thinktank.modules.role.entity.Role;
import com.onlinestore.thinktank.modules.role.repository.RoleRepository;
import com.onlinestore.thinktank.modules.user.entity.User;
import com.onlinestore.thinktank.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Set;
import java.util.Locale;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    // Admin account API for creating administrator users with ROLE_ADMIN.
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/admins")
    public AdminUserResponse createAdmin(@Valid @RequestBody CreateAdminRequest req) {
        if (req.getEmail() == null || req.getEmail().isBlank()) {
            throw new InvalidRequestException("Email không được để trống");
        }
        if (req.getPassword() == null || req.getPassword().isBlank()) {
            throw new InvalidRequestException("Mật khẩu không được để trống");
        }
        String email = req.getEmail().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("Email đã được sử dụng!");
        }

        Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy quyền ROLE_ADMIN"));

        User admin = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .fullName(req.getFullName())
                .phone(req.getPhone())
                .enabled(true)
                .roles(Set.of(adminRole))
                .build();

        User saved = userRepository.save(admin);

        return AdminUserResponse.builder()
                .id(saved.getId())
                .email(saved.getEmail())
                .fullName(saved.getFullName())
                .phone(saved.getPhone())
                .role("ROLE_ADMIN")
                .enabled(saved.getEnabled())
                .build();
    }
}
