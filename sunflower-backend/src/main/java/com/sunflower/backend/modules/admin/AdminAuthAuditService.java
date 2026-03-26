package com.sunflower.backend.modules.admin;

import com.sunflower.backend.modules.admin.persistence.AdminAuthAuditLogEntity;
import com.sunflower.backend.modules.admin.persistence.AdminAuthAuditLogRepository;
import org.springframework.stereotype.Service;

@Service
public class AdminAuthAuditService {

    private final AdminAuthAuditLogRepository adminAuthAuditLogRepository;
    private final AdminRequestMetadataResolver requestMetadataResolver;

    public AdminAuthAuditService(
        AdminAuthAuditLogRepository adminAuthAuditLogRepository,
        AdminRequestMetadataResolver requestMetadataResolver
    ) {
        this.adminAuthAuditLogRepository = adminAuthAuditLogRepository;
        this.requestMetadataResolver = requestMetadataResolver;
    }

    public void log(AdminAuditEventType eventType, AdminAuditResult result, String accountId, String phone, String detail) {
        AdminRequestMetadata metadata = requestMetadataResolver.resolveCurrentRequest();
        AdminAuthAuditLogEntity entity = new AdminAuthAuditLogEntity();
        entity.setAccountId(normalize(accountId));
        entity.setPhone(normalize(phone));
        entity.setEventType(eventType.name());
        entity.setResult(result);
        entity.setDetail(normalize(detail));
        entity.setRequestIp(metadata.getRequestIp());
        entity.setUserAgent(metadata.getUserAgent());
        adminAuthAuditLogRepository.save(entity);
    }

    private String normalize(String value) {
        String normalized = value == null ? "" : value.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}
