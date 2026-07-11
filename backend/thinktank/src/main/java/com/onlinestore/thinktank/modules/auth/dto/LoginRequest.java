package com.onlinestore.thinktank.modules.auth.dto;

import lombok.Data;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Data
public class LoginRequest {
    // Login payload used by both customer and admin authentication screens.
    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    @Size(max = 255)
    private String email;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(max = 128)
    private String password;
}
