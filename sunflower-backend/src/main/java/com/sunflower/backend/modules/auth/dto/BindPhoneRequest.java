package com.sunflower.backend.modules.auth.dto;

import javax.validation.constraints.Pattern;

public class BindPhoneRequest {

    @Pattern(regexp = "^1\\d{10}$", message = "请输入正确的 11 位手机号")
    private String phone;

    private String phoneCode;

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getPhoneCode() {
        return phoneCode;
    }

    public void setPhoneCode(String phoneCode) {
        this.phoneCode = phoneCode;
    }
}
