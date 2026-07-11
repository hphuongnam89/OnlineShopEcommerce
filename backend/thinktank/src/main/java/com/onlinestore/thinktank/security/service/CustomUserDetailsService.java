package com.onlinestore.thinktank.security.service;

import com.onlinestore.thinktank.modules.user.entity.User;
import com.onlinestore.thinktank.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.authentication.DisabledException;

import org.springframework.stereotype.Service;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
// Nạp tài khoản và quyền từ cơ sở dữ liệu cho cơ chế xác thực của Spring Security.
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email)
            throws UsernameNotFoundException {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new UsernameNotFoundException("Tài khoản người dùng không tồn tại"));

        if (Boolean.FALSE.equals(user.getEnabled())) {
            throw new DisabledException("Tài khoản người dùng đã bị vô hiệu hóa");
        }

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPasswordHash(),
                Boolean.TRUE.equals(user.getEnabled()),
                true,
                true,
                true,
                user.getRoles().stream()
                        .map(role -> new SimpleGrantedAuthority(role.getName()))
                        .collect(Collectors.toSet())
        );
    }
}
