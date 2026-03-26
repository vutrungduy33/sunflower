package com.sunflower.backend.modules.admin;

import com.sunflower.backend.common.api.ApiResponse;
import com.sunflower.backend.modules.admin.dto.ActivateAdminAccountRequest;
import com.sunflower.backend.modules.admin.dto.AdminAuthSessionResponse;
import com.sunflower.backend.modules.admin.dto.AdminLoginRequest;
import com.sunflower.backend.modules.admin.dto.ResetAdminPasswordRequest;
import com.sunflower.backend.modules.admin.dto.SendAdminSmsCodeRequest;
import javax.validation.Valid;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/admin/auth")
public class AdminAuthController {

    private final AdminAuthenticationService adminAuthenticationService;
    private final AdminAuthService adminAuthService;

    public AdminAuthController(
        AdminAuthenticationService adminAuthenticationService,
        AdminAuthService adminAuthService
    ) {
        this.adminAuthenticationService = adminAuthenticationService;
        this.adminAuthService = adminAuthService;
    }

    @PostMapping("/sms-code")
    public ApiResponse<?> sendSmsCode(@Valid @RequestBody SendAdminSmsCodeRequest request) {
        return ApiResponse.ok(
            adminAuthenticationService.sendSmsCode(
                request.getPhone(),
                AdminSmsPurpose.parse(request.getPurpose())
            )
        );
    }

    @PostMapping("/activate")
    public ApiResponse<AdminAuthSessionResponse> activate(@Valid @RequestBody ActivateAdminAccountRequest request) {
        return ApiResponse.ok(
            adminAuthenticationService.activate(request.getPhone(), request.getSmsCode(), request.getPassword())
        );
    }

    @PostMapping("/login")
    public ApiResponse<AdminAuthSessionResponse> login(@Valid @RequestBody AdminLoginRequest request) {
        return ApiResponse.ok(adminAuthenticationService.login(request.getPhone(), request.getPassword()));
    }

    @PostMapping("/reset-password")
    public ApiResponse<AdminAuthSessionResponse> resetPassword(@Valid @RequestBody ResetAdminPasswordRequest request) {
        return ApiResponse.ok(
            adminAuthenticationService.resetPassword(
                request.getPhone(),
                request.getSmsCode(),
                request.getNewPassword()
            )
        );
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout() {
        adminAuthenticationService.logout(adminAuthService.requireAuthenticated());
        return ApiResponse.ok(null);
    }
}
