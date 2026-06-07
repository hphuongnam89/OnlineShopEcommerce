package com.onlinestore.thinktank.modules.admin.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminUserResponse {
    private Long id;
    private String email;
    private String fullName;
    private String phone;
    private String role;
    private Boolean enabled;
}
