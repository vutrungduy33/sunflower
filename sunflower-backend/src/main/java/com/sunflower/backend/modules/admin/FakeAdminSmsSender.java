package com.sunflower.backend.modules.admin;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.admin.sms.provider", havingValue = "fake")
public class FakeAdminSmsSender implements AdminSmsSender {

    private final Map<String, String> latestCodes = new ConcurrentHashMap<>();

    @Override
    public AdminSmsSendResult sendVerificationCode(String phone, AdminSmsPurpose purpose, String code, int expiresInMinutes) {
        latestCodes.put(buildKey(phone, purpose), code);
        return new AdminSmsSendResult("fake-" + UUID.randomUUID(), "MOCK_ACCEPTED");
    }

    public String peekLatestCode(String phone, AdminSmsPurpose purpose) {
        return latestCodes.getOrDefault(buildKey(phone, purpose), "");
    }

    private String buildKey(String phone, AdminSmsPurpose purpose) {
        return phone + "#" + purpose.name();
    }
}
