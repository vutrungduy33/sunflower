package com.sunflower.backend.modules.admin.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;

public class SendAdminSmsCodeRequest {

    @NotBlank(message = "手机号不能为空")
    @Pattern(regexp = "^1\\d{10}$", message = "请输入正确的 11 位手机号")
    private String phone;

    @NotBlank(message = "purpose 不能为空")
    private String purpose;

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }
}
