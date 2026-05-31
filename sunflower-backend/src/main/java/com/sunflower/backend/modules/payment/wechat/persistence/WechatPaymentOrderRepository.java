package com.sunflower.backend.modules.payment.wechat.persistence;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WechatPaymentOrderRepository extends JpaRepository<WechatPaymentOrderEntity, Long> {

    Optional<WechatPaymentOrderEntity> findTopByOrderIdOrderByCreatedAtDescIdDesc(String orderId);

    Optional<WechatPaymentOrderEntity> findByOutTradeNo(String outTradeNo);

    Optional<WechatPaymentOrderEntity> findByIdAndOrderId(Long id, String orderId);
}
