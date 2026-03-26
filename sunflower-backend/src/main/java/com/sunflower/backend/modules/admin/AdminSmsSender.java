package com.sunflower.backend.modules.admin;

public interface AdminSmsSender {

    AdminSmsSendResult sendVerificationCode(String phone, AdminSmsPurpose purpose, String code);
}
