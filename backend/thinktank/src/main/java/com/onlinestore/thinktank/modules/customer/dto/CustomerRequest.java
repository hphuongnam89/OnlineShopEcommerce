package com.onlinestore.thinktank.modules.customer.dto;

import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerRequest {
    private String email;
    private String phone;
    private String fullName;
    private String password;
    private BigDecimal totalSpent;
}
