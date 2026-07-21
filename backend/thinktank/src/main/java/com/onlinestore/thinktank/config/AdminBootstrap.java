package com.onlinestore.thinktank.config;

import com.onlinestore.thinktank.modules.role.repository.RoleRepository;
import com.onlinestore.thinktank.modules.user.entity.User;
import com.onlinestore.thinktank.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class AdminBootstrap implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.bootstrap-email:}")
    private String email;

    @Value("${app.admin.bootstrap-password:}")
    private String password;

    @Override
    public void run(String... args) {
        if (email.isBlank() && password.isBlank()) return;
        if (email.isBlank() || password.length() < 12) {
            throw new IllegalStateException("Admin bootstrap requires a valid email and a password of at least 12 characters");
        }

        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmail(normalizedEmail)) return;

        var adminRole = roleRepository.findByName("ROLE_ADMIN")
                .orElseThrow(() -> new IllegalStateException("ROLE_ADMIN must exist before admin bootstrap"));
        userRepository.save(User.builder()
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(password))
                .fullName("Administrator")
                .enabled(true)
                .roles(Set.of(adminRole))
                .build());
    }
}
