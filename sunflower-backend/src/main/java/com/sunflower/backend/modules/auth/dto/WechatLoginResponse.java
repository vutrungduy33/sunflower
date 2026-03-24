package com.sunflower.backend.modules.auth.dto;

import com.sunflower.backend.modules.user.ProfileDto;

public class WechatLoginResponse {

    private String token;
    private String openId;
    private boolean newUser;
    private ProfileDto profile;

    public WechatLoginResponse(String token, String openId, boolean newUser, ProfileDto profile) {
        this.token = token;
        this.openId = openId;
        this.newUser = newUser;
        this.profile = profile;
    }

    public String getToken() {
        return token;
    }

    public String getOpenId() {
        return openId;
    }

    public boolean isNewUser() {
        return newUser;
    }

    public ProfileDto getProfile() {
        return profile;
    }
}
