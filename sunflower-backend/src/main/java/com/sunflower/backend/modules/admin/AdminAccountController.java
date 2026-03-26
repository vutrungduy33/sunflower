package com.sunflower.backend.modules.admin;

import com.sunflower.backend.common.api.ApiResponse;
import com.sunflower.backend.modules.admin.dto.AdminAccountProfileDto;
import com.sunflower.backend.modules.admin.dto.AdminAuthSessionResponse;
import com.sunflower.backend.modules.admin.dto.ChangeAdminPasswordRequest;
import javax.validation.Valid;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/admin/account")
public class AdminAccountController {

    private final AdminAccountService adminAccountService;

    public AdminAccountController(AdminAccountService adminAccountService) {
        this.adminAccountService = adminAccountService;
    }

    @GetMapping("/me")
    public ApiResponse<AdminAccountProfileDto> getCurrentAccountProfile() {
        return ApiResponse.ok(adminAccountService.getCurrentAccountProfile());
    }

    @PostMapping("/change-password")
    public ApiResponse<AdminAuthSessionResponse> changePassword(@Valid @RequestBody ChangeAdminPasswordRequest request) {
        return ApiResponse.ok(adminAccountService.changePassword(request.getCurrentPassword(), request.getNewPassword()));
    }
}
