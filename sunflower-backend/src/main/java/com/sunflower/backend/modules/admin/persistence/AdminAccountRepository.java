package com.sunflower.backend.modules.admin.persistence;

import com.sunflower.backend.modules.admin.AdminAccountStatus;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminAccountRepository extends JpaRepository<AdminAccountEntity, String> {

    Optional<AdminAccountEntity> findByPhone(String phone);

    Optional<AdminAccountEntity> findByPhoneAndStatus(String phone, AdminAccountStatus status);
}
