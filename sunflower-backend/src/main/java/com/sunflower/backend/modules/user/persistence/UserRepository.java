package com.sunflower.backend.modules.user.persistence;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<UserEntity, String> {

    Optional<UserEntity> findByOpenid(String openid);

    Optional<UserEntity> findByIdAndStatus(String id, String status);

    boolean existsByIdAndStatus(String id, String status);

    Optional<UserEntity> findByPhone(String phone);

    Optional<UserEntity> findFirstByStatusOrderByIdAsc(String status);
}
