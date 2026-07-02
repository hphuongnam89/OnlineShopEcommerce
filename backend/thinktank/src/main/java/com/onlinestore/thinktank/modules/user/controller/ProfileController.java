package com.onlinestore.thinktank.modules.user.controller;

import com.onlinestore.thinktank.modules.user.dto.ProfileResponse;
import com.onlinestore.thinktank.modules.user.dto.ProfileUpdateRequest;
import com.onlinestore.thinktank.modules.user.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    // Customer profile API for viewing and updating "Thông tin của tôi".
    private final ProfileService profileService;

    @GetMapping
    public ProfileResponse getProfile() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return profileService.getProfile(email);
    }

    @PutMapping
    public ProfileResponse updateProfile(@Valid @RequestBody ProfileUpdateRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return profileService.updateProfile(email, request);
    }
}
