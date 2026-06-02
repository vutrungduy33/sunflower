package com.sunflower.backend.modules.payment.wechat.persistence;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface WechatRefundOrderRepository extends JpaRepository<WechatRefundOrderEntity, Long> {

    Optional<WechatRefundOrderEntity> findTopByOrderIdOrderByCreatedAtDescIdDesc(String orderId);

    Optional<WechatRefundOrderEntity> findByOutRefundNo(String outRefundNo);

    Optional<WechatRefundOrderEntity> findByIdAndOrderId(Long id, String orderId);

    @Query(
        "select coalesce(sum(refund.refundAmount), 0) from WechatRefundOrderEntity refund "
            + "where refund.orderId = :orderId and refund.status = com.sunflower.backend.modules.payment.wechat.persistence.WechatRefundOrderStatus.SUCCESS"
    )
    Long sumSuccessRefundAmountByOrderId(@Param("orderId") String orderId);
}
