package com.sunflower.backend.modules.auth;

import com.sunflower.backend.common.api.ApiResponse;
import com.sunflower.backend.modules.auth.dto.BindPhoneRequest;
import com.sunflower.backend.modules.auth.dto.WechatLoginRequest;
import com.sunflower.backend.modules.auth.dto.WechatLoginResponse;
import com.sunflower.backend.modules.user.ProfileDto;
import javax.validation.Valid;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/wechat/login")
    public ApiResponse<WechatLoginResponse> wechatLogin(@Valid @RequestBody WechatLoginRequest request) {
        return ApiResponse.ok(authService.wechatLogin(request.getCode().trim()));
    }

    @PostMapping("/bind-phone")
    public ApiResponse<ProfileDto> bindPhone(@Valid @RequestBody BindPhoneRequest request) {
        return ApiResponse.ok(authService.bindPhone(request.getPhone()));
    }
}
