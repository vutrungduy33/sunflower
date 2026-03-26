package com.sunflower.backend.modules.admin.dto;

public class AdminAuthSessionResponse {

    private String token;
    private AdminAccountProfileDto account;

    public AdminAuthSessionResponse(String token, AdminAccountProfileDto account) {
        this.token = token;
        this.account = account;
    }

    public String getToken() {
        return token;
    }

    public AdminAccountProfileDto getAccount() {
        return account;
    }
}
