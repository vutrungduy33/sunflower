package com.sunflower.backend.modules.auth.dto;

import com.sunflower.backend.modules.user.ProfileDto;

public class WechatLoginResponse {

    private String token;
    private String openId;
    private ProfileDto profile;

    public WechatLoginResponse(String token, String openId, ProfileDto profile) {
        this.token = token;
        this.openId = openId;
        this.profile = profile;
    }

    public String getToken() {
        return token;
    }

    public String getOpenId() {
        return openId;
    }

    public ProfileDto getProfile() {
        return profile;
    }
}
