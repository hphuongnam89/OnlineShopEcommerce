package com.onlinestore.thinktank.modules.order.dto;

import lombok.*;

import java.util.List;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckoutRequest {
    // Checkout payload containing customer info and selected cart items.
    @NotBlank(message = "Khóa chống gửi trùng không được để trống")
    @Pattern(regexp = "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$", message = "Khóa chống gửi trùng không hợp lệ")
    private String idempotencyKey;

    @NotBlank(message = "Họ tên không được để trống")
    @Size(max = 255, message = "Họ tên không được vượt quá 255 ký tự")
    private String fullName;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^[0-9]{9,15}$", message = "Số điện thoại không hợp lệ")
    private String phone;

    @NotBlank(message = "Địa chỉ không được để trống")
    @Size(max = 500, message = "Địa chỉ không được vượt quá 500 ký tự")
    private String address;

    @Email(message = "Email không hợp lệ")
    @Size(max = 255, message = "Email không được vượt quá 255 ký tự")
    private String email;
    @Size(max = 2000, message = "Ghi chú không được vượt quá 2000 ký tự")
    private String notes;
    @Pattern(regexp = "^(COD|ONLINE_DEMO)$", message = "Phương thức thanh toán không hợp lệ")
    private String paymentMethod = "COD";
    @NotEmpty(message = "Đơn hàng phải có ít nhất một sản phẩm")
    @Size(max = 50, message = "Đơn hàng không được vượt quá 50 dòng sản phẩm")
    @Valid
    private List<CheckoutItemRequest> items;
}
