package com.onlinestore.thinktank.modules.order.dto;

import lombok.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateOrderRequest {
    // Admin order edit payload for contact and delivery information.
    @NotBlank(message = "Họ tên không được để trống")
    private String fullName;
    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^[0-9]{9,15}$", message = "Số điện thoại không hợp lệ")
    private String phone;
    @NotBlank(message = "Địa chỉ không được để trống")
    private String address;
    @Email(message = "Email không hợp lệ")
    private String email;
    private String notes;
}
