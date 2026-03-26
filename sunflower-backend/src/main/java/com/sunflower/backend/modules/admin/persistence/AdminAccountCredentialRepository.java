package com.sunflower.backend.modules.admin.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminAccountCredentialRepository extends JpaRepository<AdminAccountCredentialEntity, String> {
}
