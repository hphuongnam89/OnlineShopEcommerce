package com.onlinestore.thinktank.modules.auth.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
    // Authentication response returned after login/register with token and user summary.
    private String token;
    private String email;
    private String fullName;
    private String role;
}
