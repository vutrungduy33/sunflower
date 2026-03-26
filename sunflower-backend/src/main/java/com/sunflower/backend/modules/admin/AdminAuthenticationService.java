package com.sunflower.backend.modules.admin;

import com.sunflower.backend.common.exception.BusinessException;
import com.sunflower.backend.modules.admin.dto.AdminAccountProfileDto;
import com.sunflower.backend.modules.admin.dto.AdminAuthSessionResponse;
import com.sunflower.backend.modules.admin.dto.AdminSmsCodeResponse;
import com.sunflower.backend.modules.admin.persistence.AdminAccountCredentialEntity;
import com.sunflower.backend.modules.admin.persistence.AdminAccountCredentialRepository;
import com.sunflower.backend.modules.admin.persistence.AdminAccountEntity;
import com.sunflower.backend.modules.admin.persistence.AdminAccountRepository;
import com.sunflower.backend.modules.admin.persistence.AdminSmsVerificationCodeEntity;
import com.sunflower.backend.modules.admin.persistence.AdminSmsVerificationCodeRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminAuthenticationService {

    private static final String INVALID_CREDENTIALS_MESSAGE = "手机号或密码错误";
    private static final String LOCKED_MESSAGE = "密码连续错误次数过多，请 15 分钟后再试";

    private final AdminAccountRepository adminAccountRepository;
    private final AdminAccountCredentialRepository adminAccountCredentialRepository;
    private final AdminSmsVerificationCodeRepository adminSmsVerificationCodeRepository;
    private final AdminActivationAllowlist adminActivationAllowlist;
    private final AdminSmsSender adminSmsSender;
    private final AdminTokenService adminTokenService;
    private final PasswordEncoder adminPasswordEncoder;
    private final AdminAuthAuditService adminAuthAuditService;
    private final AdminAuthMutationService adminAuthMutationService;
    private final int codeLength;
    private final int codeTtlSeconds;
    private final int resendCooldownSeconds;
    private final int hourlySendLimit;
    private final int dailySendLimit;
    private final int maxVerifyAttempts;
    private final int loginFailureLimit;
    private final int loginLockSeconds;

    public AdminAuthenticationService(
        AdminAccountRepository adminAccountRepository,
        AdminAccountCredentialRepository adminAccountCredentialRepository,
        AdminSmsVerificationCodeRepository adminSmsVerificationCodeRepository,
        AdminActivationAllowlist adminActivationAllowlist,
        AdminSmsSender adminSmsSender,
        AdminTokenService adminTokenService,
        PasswordEncoder adminPasswordEncoder,
        AdminAuthAuditService adminAuthAuditService,
        AdminAuthMutationService adminAuthMutationService,
        @Value("${app.admin.sms.code-length:6}") int codeLength,
        @Value("${app.admin.sms.code-ttl-seconds:600}") int codeTtlSeconds,
        @Value("${app.admin.sms.resend-cooldown-seconds:60}") int resendCooldownSeconds,
        @Value("${app.admin.sms.hourly-send-limit:5}") int hourlySendLimit,
        @Value("${app.admin.sms.daily-send-limit:10}") int dailySendLimit,
        @Value("${app.admin.sms.max-verify-attempts:5}") int maxVerifyAttempts,
        @Value("${app.admin.sms.login-failure-limit:5}") int loginFailureLimit,
        @Value("${app.admin.sms.login-lock-seconds:900}") int loginLockSeconds
    ) {
        this.adminAccountRepository = adminAccountRepository;
        this.adminAccountCredentialRepository = adminAccountCredentialRepository;
        this.adminSmsVerificationCodeRepository = adminSmsVerificationCodeRepository;
        this.adminActivationAllowlist = adminActivationAllowlist;
        this.adminSmsSender = adminSmsSender;
        this.adminTokenService = adminTokenService;
        this.adminPasswordEncoder = adminPasswordEncoder;
        this.adminAuthAuditService = adminAuthAuditService;
        this.adminAuthMutationService = adminAuthMutationService;
        this.codeLength = codeLength;
        this.codeTtlSeconds = codeTtlSeconds;
        this.resendCooldownSeconds = resendCooldownSeconds;
        this.hourlySendLimit = hourlySendLimit;
        this.dailySendLimit = dailySendLimit;
        this.maxVerifyAttempts = maxVerifyAttempts;
        this.loginFailureLimit = loginFailureLimit;
        this.loginLockSeconds = loginLockSeconds;
    }

    @Transactional
    public AdminSmsCodeResponse sendSmsCode(String phone, AdminSmsPurpose purpose) {
        String normalizedPhone = normalizePhone(phone);
        AdminRole roleSnapshot = resolveCodeRole(normalizedPhone, purpose);
        ensureSendLimits(normalizedPhone, purpose);
        adminAuthMutationService.invalidatePendingCodes(normalizedPhone, purpose);

        String code = generateVerificationCode();
        int expiresInMinutes = Math.max(1, codeTtlSeconds / 60);
        AdminSmsSendResult sendResult = adminSmsSender.sendVerificationCode(
            normalizedPhone,
            purpose,
            code,
            expiresInMinutes
        );

        AdminSmsVerificationCodeEntity entity = new AdminSmsVerificationCodeEntity();
        entity.setPhone(normalizedPhone);
        entity.setPurpose(purpose);
        entity.setRole(roleSnapshot);
        entity.setCodeHash(adminPasswordEncoder.encode(code));
        entity.setStatus(AdminSmsCodeStatus.PENDING);
        entity.setVerifyAttemptCount(0);
        entity.setMaxVerifyAttempts(maxVerifyAttempts);
        entity.setExpiresAt(LocalDateTime.now().plusSeconds(codeTtlSeconds));
        entity.setProviderMessageId(sendResult.getProviderMessageId());
        entity.setProviderStatus(sendResult.getProviderStatus());
        adminSmsVerificationCodeRepository.save(entity);

        adminAuthAuditService.log(
            AdminAuditEventType.SMS_CODE_SENT,
            AdminAuditResult.SUCCESS,
            null,
            normalizedPhone,
            purpose.name()
        );
        return new AdminSmsCodeResponse(
            purpose.name(),
            purpose.getLabel(),
            maskPhone(normalizedPhone),
            codeTtlSeconds,
            resendCooldownSeconds
        );
    }

    @Transactional
    public AdminAuthSessionResponse activate(String phone, String smsCode, String password) {
        String normalizedPhone = normalizePhone(phone);
        AdminRole role = adminActivationAllowlist.requireRoleForPhone(normalizedPhone);
        if (adminAccountRepository.findByPhone(normalizedPhone).isPresent()) {
            adminAuthAuditService.log(
                AdminAuditEventType.ACTIVATE_FAILED,
                AdminAuditResult.FAILURE,
                null,
                normalizedPhone,
                "already_activated"
            );
            throw BusinessException.conflict("账号已激活，请直接登录");
        }

        validatePassword(password, "密码");
        useVerificationCode(normalizedPhone, AdminSmsPurpose.ACTIVATE, smsCode);

        LocalDateTime now = LocalDateTime.now();
        AdminAccountEntity account = new AdminAccountEntity();
        account.setId(buildAdminAccountId());
        account.setPhone(normalizedPhone);
        account.setRole(role);
        account.setStatus(AdminAccountStatus.ACTIVE);
        account.setActivatedAt(now);
        account.setLastLoginAt(now);
        adminAccountRepository.save(account);

        AdminAccountCredentialEntity credential = new AdminAccountCredentialEntity();
        credential.setAccountId(account.getId());
        credential.setPasswordHash(adminPasswordEncoder.encode(password.trim()));
        credential.setCredentialVersion(1);
        credential.setFailedLoginCount(0);
        credential.setLockedUntil(null);
        credential.setLastPasswordChangedAt(now);
        adminAccountCredentialRepository.save(credential);

        adminAuthAuditService.log(
            AdminAuditEventType.ACTIVATE_SUCCESS,
            AdminAuditResult.SUCCESS,
            account.getId(),
            normalizedPhone,
            role.name()
        );
        return buildSessionResponse(account, credential.getCredentialVersion());
    }

    public AdminAuthSessionResponse login(String phone, String password) {
        String normalizedPhone = normalizePhone(phone);
        AdminAccountEntity account = adminAccountRepository
            .findByPhoneAndStatus(normalizedPhone, AdminAccountStatus.ACTIVE)
            .orElse(null);
        if (account == null) {
            adminAuthAuditService.log(
                AdminAuditEventType.LOGIN_FAILED,
                AdminAuditResult.FAILURE,
                null,
                normalizedPhone,
                "account_not_found"
            );
            throw BusinessException.unauthorized(INVALID_CREDENTIALS_MESSAGE);
        }

        AdminAccountCredentialEntity credential = requireCredential(account.getId());
        if (isLocked(credential)) {
            adminAuthAuditService.log(
                AdminAuditEventType.LOGIN_LOCKED,
                AdminAuditResult.FAILURE,
                account.getId(),
                normalizedPhone,
                "locked_until=" + credential.getLockedUntil()
            );
            throw BusinessException.unauthorized(LOCKED_MESSAGE);
        }

        if (!adminPasswordEncoder.matches(password == null ? "" : password.trim(), credential.getPasswordHash())) {
            handleFailedLogin(account, credential);
            throw BusinessException.unauthorized(
                isLocked(credential) ? LOCKED_MESSAGE : INVALID_CREDENTIALS_MESSAGE
            );
        }

        LocalDateTime now = LocalDateTime.now();
        credential.setFailedLoginCount(0);
        credential.setLockedUntil(null);
        account.setLastLoginAt(now);
        adminAccountCredentialRepository.save(credential);
        adminAccountRepository.save(account);

        adminAuthAuditService.log(
            AdminAuditEventType.LOGIN_SUCCESS,
            AdminAuditResult.SUCCESS,
            account.getId(),
            normalizedPhone,
            account.getRole().name()
        );
        return buildSessionResponse(account, normalizeCredentialVersion(credential));
    }

    @Transactional
    public AdminAuthSessionResponse resetPassword(String phone, String smsCode, String newPassword) {
        String normalizedPhone = normalizePhone(phone);
        AdminAccountEntity account = adminAccountRepository
            .findByPhoneAndStatus(normalizedPhone, AdminAccountStatus.ACTIVE)
            .orElseThrow(() -> BusinessException.notFound("后台账号不存在"));
        validatePassword(newPassword, "新密码");
        useVerificationCode(normalizedPhone, AdminSmsPurpose.RESET_PASSWORD, smsCode);

        LocalDateTime now = LocalDateTime.now();
        AdminAccountCredentialEntity credential = requireCredential(account.getId());
        credential.setPasswordHash(adminPasswordEncoder.encode(newPassword.trim()));
        credential.setCredentialVersion(normalizeCredentialVersion(credential) + 1);
        credential.setFailedLoginCount(0);
        credential.setLockedUntil(null);
        credential.setLastPasswordChangedAt(now);
        account.setLastLoginAt(now);
        adminAccountCredentialRepository.save(credential);
        adminAccountRepository.save(account);

        adminAuthAuditService.log(
            AdminAuditEventType.RESET_PASSWORD_SUCCESS,
            AdminAuditResult.SUCCESS,
            account.getId(),
            normalizedPhone,
            "reset_success"
        );
        return buildSessionResponse(account, credential.getCredentialVersion());
    }

    @Transactional
    public void logout(AdminAuthSession session) {
        AdminAccountCredentialEntity credential = session.getCredential();
        credential.setCredentialVersion(normalizeCredentialVersion(credential) + 1);
        credential.setFailedLoginCount(0);
        credential.setLockedUntil(null);
        adminAccountCredentialRepository.save(credential);
        adminAuthAuditService.log(
            AdminAuditEventType.LOGOUT,
            AdminAuditResult.SUCCESS,
            session.getAccount().getId(),
            session.getAccount().getPhone(),
            "logout"
        );
    }

    @Transactional
    public AdminAuthSessionResponse changePassword(AdminAuthSession session, String currentPassword, String newPassword) {
        AdminAccountCredentialEntity credential = session.getCredential();
        if (!adminPasswordEncoder.matches(normalizePassword(currentPassword), credential.getPasswordHash())) {
            adminAuthAuditService.log(
                AdminAuditEventType.CHANGE_PASSWORD_FAILED,
                AdminAuditResult.FAILURE,
                session.getAccount().getId(),
                session.getAccount().getPhone(),
                "current_password_incorrect"
            );
            throw BusinessException.badRequest("当前密码不正确");
        }

        validatePassword(newPassword, "新密码");
        if (adminPasswordEncoder.matches(normalizePassword(newPassword), credential.getPasswordHash())) {
            throw BusinessException.badRequest("新密码不能与当前密码相同");
        }

        LocalDateTime now = LocalDateTime.now();
        credential.setPasswordHash(adminPasswordEncoder.encode(newPassword.trim()));
        credential.setCredentialVersion(normalizeCredentialVersion(credential) + 1);
        credential.setFailedLoginCount(0);
        credential.setLockedUntil(null);
        credential.setLastPasswordChangedAt(now);
        session.getAccount().setLastLoginAt(now);
        adminAccountCredentialRepository.save(credential);
        adminAccountRepository.save(session.getAccount());

        adminAuthAuditService.log(
            AdminAuditEventType.CHANGE_PASSWORD_SUCCESS,
            AdminAuditResult.SUCCESS,
            session.getAccount().getId(),
            session.getAccount().getPhone(),
            "password_changed"
        );
        return buildSessionResponse(session.getAccount(), credential.getCredentialVersion());
    }

    public AdminAccountProfileDto toProfile(AdminAccountEntity account) {
        return new AdminAccountProfileDto(
            account.getId(),
            account.getPhone(),
            account.getRole().name(),
            account.getRole().getLabel()
        );
    }

    private void ensureSendLimits(String phone, AdminSmsPurpose purpose) {
        AdminSmsVerificationCodeEntity latestPendingCode = adminSmsVerificationCodeRepository
            .findTopByPhoneAndPurposeAndStatusOrderByIdDesc(phone, purpose, AdminSmsCodeStatus.PENDING)
            .orElse(null);
        if (latestPendingCode != null && latestPendingCode.getCreatedAt() != null) {
            LocalDateTime nextAllowedTime = latestPendingCode.getCreatedAt().plusSeconds(resendCooldownSeconds);
            if (nextAllowedTime.isAfter(LocalDateTime.now())) {
                adminAuthAuditService.log(
                    AdminAuditEventType.SMS_CODE_SEND_REJECTED,
                    AdminAuditResult.FAILURE,
                    null,
                    phone,
                    "cooldown"
                );
                throw BusinessException.badRequest("验证码发送过于频繁，请稍后再试");
            }
        }

        LocalDateTime now = LocalDateTime.now();
        if (adminSmsVerificationCodeRepository.countByPhoneAndCreatedAtAfter(phone, now.minusHours(1)) >= hourlySendLimit) {
            adminAuthAuditService.log(
                AdminAuditEventType.SMS_CODE_SEND_REJECTED,
                AdminAuditResult.FAILURE,
                null,
                phone,
                "hourly_limit"
            );
            throw BusinessException.badRequest("当前手机号 1 小时内验证码发送次数已达上限");
        }
        if (adminSmsVerificationCodeRepository.countByPhoneAndCreatedAtAfter(phone, now.minusDays(1)) >= dailySendLimit) {
            adminAuthAuditService.log(
                AdminAuditEventType.SMS_CODE_SEND_REJECTED,
                AdminAuditResult.FAILURE,
                null,
                phone,
                "daily_limit"
            );
            throw BusinessException.badRequest("当前手机号今日验证码发送次数已达上限");
        }
    }

    private AdminRole resolveCodeRole(String phone, AdminSmsPurpose purpose) {
        if (purpose == AdminSmsPurpose.ACTIVATE) {
            if (adminAccountRepository.findByPhone(phone).isPresent()) {
                throw BusinessException.conflict("账号已激活，请直接登录");
            }
            return adminActivationAllowlist.requireRoleForPhone(phone);
        }

        AdminAccountEntity account = adminAccountRepository
            .findByPhoneAndStatus(phone, AdminAccountStatus.ACTIVE)
            .orElseThrow(() -> BusinessException.notFound("后台账号不存在"));
        requireCredential(account.getId());
        return account.getRole();
    }

    private void useVerificationCode(String phone, AdminSmsPurpose purpose, String smsCode) {
        AdminSmsVerificationCodeEntity latestCode = adminSmsVerificationCodeRepository
            .findTopByPhoneAndPurposeOrderByIdDesc(phone, purpose)
            .orElseThrow(() -> BusinessException.badRequest("请先获取验证码"));

        if (latestCode.getStatus() != AdminSmsCodeStatus.PENDING) {
            throw BusinessException.badRequest("验证码已失效，请重新获取");
        }

        LocalDateTime now = LocalDateTime.now();
        if (latestCode.getExpiresAt().isBefore(now)) {
            adminAuthMutationService.markCodeExpired(latestCode.getId());
            throw BusinessException.badRequest("验证码已过期，请重新获取");
        }

        if (!adminPasswordEncoder.matches(normalizeCode(smsCode), latestCode.getCodeHash())) {
            int nextAttemptCount = latestCode.getVerifyAttemptCount() + 1;
            if (nextAttemptCount >= latestCode.getMaxVerifyAttempts()) {
                adminAuthMutationService.recordCodeFailure(latestCode.getId(), nextAttemptCount, true);
                throw BusinessException.badRequest("验证码错误次数过多，请重新获取");
            }
            adminAuthMutationService.recordCodeFailure(latestCode.getId(), nextAttemptCount, false);
            throw BusinessException.badRequest("验证码错误");
        }

        latestCode.setStatus(AdminSmsCodeStatus.USED);
        latestCode.setUsedAt(now);
        latestCode.setVerifyAttemptCount(latestCode.getVerifyAttemptCount() + 1);
        adminSmsVerificationCodeRepository.save(latestCode);
    }

    private void handleFailedLogin(AdminAccountEntity account, AdminAccountCredentialEntity credential) {
        int nextFailureCount = (credential.getFailedLoginCount() == null ? 0 : credential.getFailedLoginCount()) + 1;
        LocalDateTime lockedUntil = null;
        if (nextFailureCount >= loginFailureLimit) {
            lockedUntil = LocalDateTime.now().plusSeconds(loginLockSeconds);
            adminAuthAuditService.log(
                AdminAuditEventType.LOGIN_LOCKED,
                AdminAuditResult.FAILURE,
                account.getId(),
                account.getPhone(),
                "failure_limit_reached"
            );
        } else {
            adminAuthAuditService.log(
                AdminAuditEventType.LOGIN_FAILED,
                AdminAuditResult.FAILURE,
                account.getId(),
                account.getPhone(),
                "password_incorrect"
            );
        }
        adminAuthMutationService.recordFailedLogin(account.getId(), nextFailureCount, lockedUntil);
        credential.setFailedLoginCount(nextFailureCount);
        credential.setLockedUntil(lockedUntil);
    }

    private boolean isLocked(AdminAccountCredentialEntity credential) {
        return credential.getLockedUntil() != null && credential.getLockedUntil().isAfter(LocalDateTime.now());
    }

    private AdminAccountCredentialEntity requireCredential(String accountId) {
        return adminAccountCredentialRepository
            .findById(accountId)
            .orElseThrow(() -> BusinessException.unauthorized("管理端登录态无效"));
    }

    private AdminAuthSessionResponse buildSessionResponse(AdminAccountEntity account, int credentialVersion) {
        String token = adminTokenService.buildToken(account.getId(), account.getRole(), credentialVersion);
        return new AdminAuthSessionResponse(token, toProfile(account));
    }

    private int normalizeCredentialVersion(AdminAccountCredentialEntity credential) {
        return credential.getCredentialVersion() == null || credential.getCredentialVersion() < 1
            ? 1
            : credential.getCredentialVersion();
    }

    private void validatePassword(String password, String fieldLabel) {
        String normalized = normalizePassword(password);
        if (normalized.length() < 8 || normalized.length() > 32) {
            throw BusinessException.badRequest(fieldLabel + "长度需为 8-32 位");
        }
        boolean hasLetter = false;
        boolean hasDigit = false;
        for (int index = 0; index < normalized.length(); index += 1) {
            char current = normalized.charAt(index);
            if (Character.isWhitespace(current)) {
                throw BusinessException.badRequest(fieldLabel + "不能包含空格");
            }
            if (Character.isLetter(current)) {
                hasLetter = true;
            } else if (Character.isDigit(current)) {
                hasDigit = true;
            }
        }
        if (!hasLetter || !hasDigit) {
            throw BusinessException.badRequest(fieldLabel + "需同时包含字母和数字");
        }
    }

    private String generateVerificationCode() {
        int bound = (int) Math.pow(10, codeLength);
        int floor = (int) Math.pow(10, codeLength - 1);
        return String.valueOf(ThreadLocalRandom.current().nextInt(floor, bound));
    }

    private String buildAdminAccountId() {
        return "admin_" + UUID.randomUUID().toString().replace("-", "");
    }

    private String normalizePhone(String phone) {
        return phone == null ? "" : phone.trim();
    }

    private String normalizeCode(String smsCode) {
        return smsCode == null ? "" : smsCode.trim();
    }

    private String normalizePassword(String password) {
        return password == null ? "" : password.trim();
    }

    private String maskPhone(String phone) {
        if (phone.length() != 11) {
            return phone;
        }
        return phone.substring(0, 3) + "****" + phone.substring(7);
    }
}
