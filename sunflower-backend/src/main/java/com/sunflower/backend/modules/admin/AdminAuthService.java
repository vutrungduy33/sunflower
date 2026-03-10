package com.sunflower.backend.modules.admin;

import com.sunflower.backend.common.exception.BusinessException;
import com.sunflower.backend.modules.auth.AuthTokenService;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class AdminAuthService {

    private final AuthTokenService authTokenService;
    private final String adminToken;

    public AdminAuthService(
        AuthTokenService authTokenService,
        @Value("${app.admin.auth.token}") String adminToken
    ) {
        if (adminToken == null || adminToken.trim().isEmpty()) {
            throw new IllegalStateException("app.admin.auth.token 未配置");
        }
        this.authTokenService = authTokenService;
        this.adminToken = adminToken.trim();
    }

    public void requireAdminAccess() {
        Optional<String> token = authTokenService.extractTokenFromCurrentRequest();
        if (token.isEmpty()) {
            throw BusinessException.unauthorized("请先登录管理端");
        }
        if (!adminToken.equals(token.get().trim())) {
            throw BusinessException.unauthorized("管理端登录态无效");
        }
    }
}
