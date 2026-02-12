package com.sunflower.backend.modules.auth;

import com.sunflower.backend.modules.auth.dto.WechatLoginResponse;
import com.sunflower.backend.modules.user.ProfileDto;
import com.sunflower.backend.modules.user.UserService;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserService userService;

    public AuthService(UserService userService) {
        this.userService = userService;
    }

    public WechatLoginResponse wechatLogin(String code) {
        ProfileDto profile = userService.getCurrentProfile();
        String token = "mock_token_" + System.currentTimeMillis();
        String openId = "mock_openid_" + code;
        return new WechatLoginResponse(token, openId, profile);
    }

    public ProfileDto bindPhone(String phone) {
        return userService.bindCurrentUserPhone(phone);
    }
}
