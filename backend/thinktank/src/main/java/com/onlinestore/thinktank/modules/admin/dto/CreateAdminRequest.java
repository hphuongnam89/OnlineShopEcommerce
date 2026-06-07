package com.onlinestore.thinktank.modules.admin.dto;

import lombok.Data;

@Data
public class CreateAdminRequest {
    private String email;
    private String password;
    private String fullName;
    private String phone;
}
