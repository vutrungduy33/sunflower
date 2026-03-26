package com.sunflower.backend.modules.admin.persistence;

import com.sunflower.backend.modules.admin.AdminRole;
import com.sunflower.backend.modules.admin.AdminSmsCodeStatus;
import com.sunflower.backend.modules.admin.AdminSmsPurpose;
import java.time.LocalDateTime;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;

@Entity
@Table(name = "admin_sms_verification_codes")
public class AdminSmsVerificationCodeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String phone;

    @Enumerated(EnumType.STRING)
    private AdminSmsPurpose purpose;

    @Enumerated(EnumType.STRING)
    private AdminRole role;

    @Column(name = "code_hash")
    private String codeHash;

    @Enumerated(EnumType.STRING)
    private AdminSmsCodeStatus status;

    @Column(name = "verify_attempt_count")
    private Integer verifyAttemptCount;

    @Column(name = "max_verify_attempts")
    private Integer maxVerifyAttempts;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "used_at")
    private LocalDateTime usedAt;

    @Column(name = "invalidated_at")
    private LocalDateTime invalidatedAt;

    @Column(name = "provider_message_id")
    private String providerMessageId;

    @Column(name = "provider_status")
    private String providerStatus;

    @Column(name = "request_ip")
    private String requestIp;

    @Column(name = "user_agent")
    private String userAgent;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    public Long getId() {
        return id;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public AdminSmsPurpose getPurpose() {
        return purpose;
    }

    public void setPurpose(AdminSmsPurpose purpose) {
        this.purpose = purpose;
    }

    public AdminRole getRole() {
        return role;
    }

    public void setRole(AdminRole role) {
        this.role = role;
    }

    public String getCodeHash() {
        return codeHash;
    }

    public void setCodeHash(String codeHash) {
        this.codeHash = codeHash;
    }

    public AdminSmsCodeStatus getStatus() {
        return status;
    }

    public void setStatus(AdminSmsCodeStatus status) {
        this.status = status;
    }

    public Integer getVerifyAttemptCount() {
        return verifyAttemptCount;
    }

    public void setVerifyAttemptCount(Integer verifyAttemptCount) {
        this.verifyAttemptCount = verifyAttemptCount;
    }

    public Integer getMaxVerifyAttempts() {
        return maxVerifyAttempts;
    }

    public void setMaxVerifyAttempts(Integer maxVerifyAttempts) {
        this.maxVerifyAttempts = maxVerifyAttempts;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public LocalDateTime getUsedAt() {
        return usedAt;
    }

    public void setUsedAt(LocalDateTime usedAt) {
        this.usedAt = usedAt;
    }

    public LocalDateTime getInvalidatedAt() {
        return invalidatedAt;
    }

    public void setInvalidatedAt(LocalDateTime invalidatedAt) {
        this.invalidatedAt = invalidatedAt;
    }

    public String getProviderMessageId() {
        return providerMessageId;
    }

    public void setProviderMessageId(String providerMessageId) {
        this.providerMessageId = providerMessageId;
    }

    public String getProviderStatus() {
        return providerStatus;
    }

    public void setProviderStatus(String providerStatus) {
        this.providerStatus = providerStatus;
    }

    public String getRequestIp() {
        return requestIp;
    }

    public void setRequestIp(String requestIp) {
        this.requestIp = requestIp;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
