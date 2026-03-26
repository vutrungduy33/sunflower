package com.sunflower.backend.modules.admin;

import com.sunflower.backend.common.exception.BusinessException;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class AdminActivationAllowlist {

    private final Map<String, AdminRole> allowedPhones;

    public AdminActivationAllowlist(@Value("${app.admin.activation.allowlist:}") String allowlistText) {
        this.allowedPhones = parseAllowlist(allowlistText);
    }

    public AdminRole requireRoleForPhone(String phone) {
        AdminRole role = allowedPhones.get(normalizePhone(phone));
        if (role == null) {
            throw BusinessException.unauthorized("该手机号未在后台激活白名单中");
        }
        return role;
    }

    private Map<String, AdminRole> parseAllowlist(String allowlistText) {
        String normalized = allowlistText == null ? "" : allowlistText.trim();
        if (normalized.isEmpty()) {
            return Collections.emptyMap();
        }

        Map<String, AdminRole> result = new LinkedHashMap<>();
        for (String entry : normalized.split(",")) {
            String trimmedEntry = entry.trim();
            if (trimmedEntry.isEmpty()) {
                continue;
            }

            String[] parts = trimmedEntry.split(":");
            if (parts.length != 2) {
                throw new IllegalStateException("ADMIN_ACTIVATION_ALLOWLIST 格式必须为 手机号:角色,手机号:角色");
            }
            result.put(normalizePhone(parts[0]), AdminRole.parse(parts[1], "allowlist role"));
        }
        return Collections.unmodifiableMap(result);
    }

    private String normalizePhone(String phone) {
        return phone == null ? "" : phone.trim();
    }
}
