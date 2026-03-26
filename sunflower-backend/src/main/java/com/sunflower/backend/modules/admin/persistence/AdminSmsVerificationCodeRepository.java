package com.sunflower.backend.modules.admin.persistence;

import com.sunflower.backend.modules.admin.AdminSmsCodeStatus;
import com.sunflower.backend.modules.admin.AdminSmsPurpose;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminSmsVerificationCodeRepository extends JpaRepository<AdminSmsVerificationCodeEntity, Long> {

    Optional<AdminSmsVerificationCodeEntity> findTopByPhoneAndPurposeOrderByIdDesc(String phone, AdminSmsPurpose purpose);

    Optional<AdminSmsVerificationCodeEntity> findTopByPhoneAndPurposeAndStatusOrderByIdDesc(
        String phone,
        AdminSmsPurpose purpose,
        AdminSmsCodeStatus status
    );

    List<AdminSmsVerificationCodeEntity> findByPhoneAndPurposeAndStatus(
        String phone,
        AdminSmsPurpose purpose,
        AdminSmsCodeStatus status
    );

    long countByPhoneAndCreatedAtAfter(String phone, LocalDateTime createdAt);
}
