package com.sunflower.backend.modules.payment.wechat.persistence;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WechatNotifyEventRepository extends JpaRepository<WechatNotifyEventEntity, Long> {

    Optional<WechatNotifyEventEntity> findByNotifyId(String notifyId);
}
