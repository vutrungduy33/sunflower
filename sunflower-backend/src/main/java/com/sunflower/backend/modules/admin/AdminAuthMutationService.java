package com.sunflower.backend.modules.admin;

import com.sunflower.backend.common.exception.BusinessException;
import com.sunflower.backend.modules.admin.persistence.AdminAccountCredentialEntity;
import com.sunflower.backend.modules.admin.persistence.AdminAccountCredentialRepository;
import com.sunflower.backend.modules.admin.persistence.AdminSmsVerificationCodeEntity;
import com.sunflower.backend.modules.admin.persistence.AdminSmsVerificationCodeRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminAuthMutationService {

    private final AdminSmsVerificationCodeRepository adminSmsVerificationCodeRepository;
    private final AdminAccountCredentialRepository adminAccountCredentialRepository;

    public AdminAuthMutationService(
        AdminSmsVerificationCodeRepository adminSmsVerificationCodeRepository,
        AdminAccountCredentialRepository adminAccountCredentialRepository
    ) {
        this.adminSmsVerificationCodeRepository = adminSmsVerificationCodeRepository;
        this.adminAccountCredentialRepository = adminAccountCredentialRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void invalidatePendingCodes(String phone, AdminSmsPurpose purpose) {
        List<AdminSmsVerificationCodeEntity> pendingCodes = adminSmsVerificationCodeRepository.findByPhoneAndPurposeAndStatus(
            phone,
            purpose,
            AdminSmsCodeStatus.PENDING
        );
        LocalDateTime now = LocalDateTime.now();
        for (AdminSmsVerificationCodeEntity pendingCode : pendingCodes) {
            pendingCode.setStatus(AdminSmsCodeStatus.INVALIDATED);
            pendingCode.setInvalidatedAt(now);
        }
        adminSmsVerificationCodeRepository.saveAll(pendingCodes);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markCodeExpired(Long codeId) {
        AdminSmsVerificationCodeEntity codeEntity = requireCode(codeId);
        codeEntity.setStatus(AdminSmsCodeStatus.EXPIRED);
        adminSmsVerificationCodeRepository.save(codeEntity);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordCodeFailure(Long codeId, int nextAttemptCount, boolean invalidate) {
        AdminSmsVerificationCodeEntity codeEntity = requireCode(codeId);
        codeEntity.setVerifyAttemptCount(nextAttemptCount);
        if (invalidate) {
            codeEntity.setStatus(AdminSmsCodeStatus.INVALIDATED);
            codeEntity.setInvalidatedAt(LocalDateTime.now());
        }
        adminSmsVerificationCodeRepository.save(codeEntity);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordFailedLogin(String accountId, int nextFailureCount, LocalDateTime lockedUntil) {
        AdminAccountCredentialEntity credential = adminAccountCredentialRepository
            .findById(accountId)
            .orElseThrow(() -> BusinessException.unauthorized("管理端登录态无效"));
        credential.setFailedLoginCount(nextFailureCount);
        credential.setLockedUntil(lockedUntil);
        adminAccountCredentialRepository.save(credential);
    }

    private AdminSmsVerificationCodeEntity requireCode(Long codeId) {
        return adminSmsVerificationCodeRepository
            .findById(codeId)
            .orElseThrow(() -> BusinessException.badRequest("验证码已失效，请重新获取"));
    }
}
