package com.sunflower.backend.modules.admin;

import com.sunflower.backend.common.exception.BusinessException;
import java.util.Arrays;
import java.util.Locale;
import java.util.stream.Collectors;

public enum AdminSmsPurpose {
    ACTIVATE("首次激活"),
    RESET_PASSWORD("重置密码");

    private final String label;

    AdminSmsPurpose(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public static AdminSmsPurpose parse(String value) {
        String normalized = value == null ? "" : value.trim();
        if (normalized.isEmpty()) {
            throw BusinessException.badRequest("purpose 不能为空");
        }
        try {
            return AdminSmsPurpose.valueOf(normalized.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw BusinessException.badRequest(
                "purpose 仅支持 "
                    + Arrays.stream(AdminSmsPurpose.values()).map(Enum::name).collect(Collectors.joining(", "))
            );
        }
    }
}
