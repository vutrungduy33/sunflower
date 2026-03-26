package com.sunflower.backend.modules.admin;

import com.sunflower.backend.common.exception.BusinessException;
import com.sunflower.backend.modules.admin.persistence.AdminAccountCredentialEntity;
import com.sunflower.backend.modules.admin.persistence.AdminAccountCredentialRepository;
import com.sunflower.backend.modules.admin.persistence.AdminAccountEntity;
import com.sunflower.backend.modules.admin.persistence.AdminAccountRepository;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class AdminAuthService {

    private final AdminTokenService adminTokenService;
    private final AdminAccountRepository adminAccountRepository;
    private final AdminAccountCredentialRepository adminAccountCredentialRepository;

    public AdminAuthService(
        AdminTokenService adminTokenService,
        AdminAccountRepository adminAccountRepository,
        AdminAccountCredentialRepository adminAccountCredentialRepository
    ) {
        this.adminTokenService = adminTokenService;
        this.adminAccountRepository = adminAccountRepository;
        this.adminAccountCredentialRepository = adminAccountCredentialRepository;
    }

    public void requireAdminAccess() {
        requireAuthenticated();
    }

    public AdminAuthSession requireAuthenticated() {
        Optional<String> token = adminTokenService.extractTokenFromCurrentRequest();
        if (token.isEmpty()) {
            throw BusinessException.unauthorized("请先登录管理端");
        }

        AdminTokenClaims claims = adminTokenService
            .parseClaims(token.get())
            .orElseThrow(() -> BusinessException.unauthorized("管理端登录态无效"));
        AdminAccountEntity account = adminAccountRepository
            .findById(claims.getAccountId())
            .orElseThrow(() -> BusinessException.unauthorized("管理端登录态无效"));
        if (account.getStatus() != AdminAccountStatus.ACTIVE) {
            throw BusinessException.unauthorized("管理端登录态无效");
        }

        AdminAccountCredentialEntity credential = adminAccountCredentialRepository
            .findById(account.getId())
            .orElseThrow(() -> BusinessException.unauthorized("管理端登录态无效"));
        int credentialVersion = credential.getCredentialVersion() == null ? 1 : credential.getCredentialVersion();
        if (credentialVersion != claims.getCredentialVersion() || account.getRole() != claims.getRole()) {
            throw BusinessException.unauthorized("管理端登录态无效");
        }

        return new AdminAuthSession(account, credential, claims);
    }
}
