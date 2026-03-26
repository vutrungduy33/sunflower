package com.sunflower.backend.modules.admin;

import com.sunflower.backend.modules.admin.dto.AdminAccountProfileDto;
import com.sunflower.backend.modules.admin.dto.AdminAuthSessionResponse;
import org.springframework.stereotype.Service;

@Service
public class AdminAccountService {

    private final AdminAuthService adminAuthService;
    private final AdminAuthenticationService adminAuthenticationService;

    public AdminAccountService(
        AdminAuthService adminAuthService,
        AdminAuthenticationService adminAuthenticationService
    ) {
        this.adminAuthService = adminAuthService;
        this.adminAuthenticationService = adminAuthenticationService;
    }

    public AdminAccountProfileDto getCurrentAccountProfile() {
        return adminAuthenticationService.toProfile(adminAuthService.requireAuthenticated().getAccount());
    }

    public AdminAuthSessionResponse changePassword(String currentPassword, String newPassword) {
        return adminAuthenticationService.changePassword(
            adminAuthService.requireAuthenticated(),
            currentPassword,
            newPassword
        );
    }
}
