package com.onlinestore.thinktank.modules.auth.entity;

import com.onlinestore.thinktank.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "refresh_tokens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
// Lưu refresh token để cấp lại access token mà không yêu cầu người dùng đăng nhập lại.
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "token", nullable = false, unique = true, length = 64, columnDefinition = "CHAR(64)")
    private String tokenHash;

    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    @Column(nullable = false)
    private Instant expiryDate;
}
