package com.onlinestore.thinktank.modules.order.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateOrderRequest {
    private String fullName;
    private String phone;
    private String address;
    private String email;
    private String notes;
}
