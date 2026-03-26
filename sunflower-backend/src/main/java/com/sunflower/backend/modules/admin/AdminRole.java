package com.sunflower.backend.modules.admin;

import com.sunflower.backend.common.exception.BusinessException;
import java.util.Arrays;
import java.util.Locale;
import java.util.stream.Collectors;

public enum AdminRole {
    ADMIN("管理员"),
    OPERATOR("运营");

    private final String label;

    AdminRole(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public static AdminRole parse(String value, String fieldName) {
        String normalized = value == null ? "" : value.trim();
        if (normalized.isEmpty()) {
            throw BusinessException.badRequest(fieldName + " 不能为空");
        }
        try {
            return AdminRole.valueOf(normalized.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw BusinessException.badRequest(
                fieldName + " 仅支持 " + Arrays.stream(AdminRole.values()).map(Enum::name).collect(Collectors.joining(", "))
            );
        }
    }
}
