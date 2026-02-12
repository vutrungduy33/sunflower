package com.sunflower.backend.modules.auth.dto;

import javax.validation.constraints.NotBlank;

public class WechatLoginRequest {

    @NotBlank(message = "微信登录 code 不能为空")
    private String code;

    private String inviteCode;

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getInviteCode() {
        return inviteCode;
    }

    public void setInviteCode(String inviteCode) {
        this.inviteCode = inviteCode;
    }
}
