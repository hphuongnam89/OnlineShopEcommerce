package com.onlinestore.thinktank.modules.order.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckoutRequest {
    private String fullName;
    private String phone;
    private String address;
    private String email;
    private String notes;
    private List<CheckoutItemRequest> items;
}
