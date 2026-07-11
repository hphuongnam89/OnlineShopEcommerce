package com.onlinestore.thinktank.modules.customer.dto;

import lombok.*;
import java.math.BigDecimal;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.PositiveOrZero;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerRequest {
    // Admin customer form payload for creating and editing customer profiles.
    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    @Size(max = 255)
    private String email;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^[0-9]{9,15}$", message = "Số điện thoại không hợp lệ")
    private String phone;

    @NotBlank(message = "Họ tên không được để trống")
    @Size(max = 255)
    private String fullName;

    @Size(min = 8, max = 128, message = "Mật khẩu phải có từ 8 đến 128 ký tự")
    private String password;
    @PositiveOrZero(message = "Tổng chi tiêu không hợp lệ")
    private BigDecimal totalSpent;
}
