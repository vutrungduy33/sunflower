package com.sunflower.backend.modules.admin.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminAuthAuditLogRepository extends JpaRepository<AdminAuthAuditLogEntity, Long> {
}
