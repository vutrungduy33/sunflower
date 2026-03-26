package com.sunflower.backend.modules.admin.dto;

public class AdminSmsCodeResponse {

    private String purpose;
    private String purposeLabel;
    private String maskedPhone;
    private int expiresInSeconds;
    private int resendCooldownSeconds;

    public AdminSmsCodeResponse(
        String purpose,
        String purposeLabel,
        String maskedPhone,
        int expiresInSeconds,
        int resendCooldownSeconds
    ) {
        this.purpose = purpose;
        this.purposeLabel = purposeLabel;
        this.maskedPhone = maskedPhone;
        this.expiresInSeconds = expiresInSeconds;
        this.resendCooldownSeconds = resendCooldownSeconds;
    }

    public String getPurpose() {
        return purpose;
    }

    public String getPurposeLabel() {
        return purposeLabel;
    }

    public String getMaskedPhone() {
        return maskedPhone;
    }

    public int getExpiresInSeconds() {
        return expiresInSeconds;
    }

    public int getResendCooldownSeconds() {
        return resendCooldownSeconds;
    }
}
