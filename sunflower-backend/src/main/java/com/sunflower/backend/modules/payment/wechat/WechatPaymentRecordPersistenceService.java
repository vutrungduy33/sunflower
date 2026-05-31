package com.sunflower.backend.modules.payment.wechat;

import com.sunflower.backend.modules.order.persistence.OrderEntity;
import com.sunflower.backend.modules.payment.wechat.persistence.WechatPaymentOrderEntity;
import com.sunflower.backend.modules.payment.wechat.persistence.WechatPaymentOrderRepository;
import com.sunflower.backend.modules.payment.wechat.persistence.WechatPaymentOrderStatus;
import com.sunflower.backend.modules.payment.wechat.persistence.WechatRefundOrderEntity;
import com.sunflower.backend.modules.payment.wechat.persistence.WechatRefundOrderRepository;
import com.sunflower.backend.modules.payment.wechat.persistence.WechatRefundOrderStatus;
import com.sunflower.backend.modules.user.persistence.UserEntity;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WechatPaymentRecordPersistenceService {

    private final WechatPayProperties wechatPayProperties;
    private final WechatPaymentOrderRepository wechatPaymentOrderRepository;
    private final WechatRefundOrderRepository wechatRefundOrderRepository;

    public WechatPaymentRecordPersistenceService(
        WechatPayProperties wechatPayProperties,
        WechatPaymentOrderRepository wechatPaymentOrderRepository,
        WechatRefundOrderRepository wechatRefundOrderRepository
    ) {
        this.wechatPayProperties = wechatPayProperties;
        this.wechatPaymentOrderRepository = wechatPaymentOrderRepository;
        this.wechatRefundOrderRepository = wechatRefundOrderRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public WechatPaymentOrderEntity createPreparedPaymentOrder(
        OrderEntity order,
        UserEntity user,
        String outTradeNo,
        int totalAmountFen,
        WechatPayClient.CreateOrderResult gatewayOrder
    ) {
        WechatPaymentOrderEntity paymentOrder = new WechatPaymentOrderEntity();
        paymentOrder.setOrderId(order.getId());
        paymentOrder.setUserId(order.getUserId());
        paymentOrder.setAppid(wechatPayProperties.getAppId());
        paymentOrder.setMchid(wechatPayProperties.getMchId());
        paymentOrder.setPayerOpenid(user.getOpenid());
        paymentOrder.setOutTradeNo(outTradeNo);
        paymentOrder.setAmount(totalAmountFen);
        paymentOrder.setPrepayId(gatewayOrder.getPrepayId());
        paymentOrder.setStatus(WechatPaymentOrderStatus.PREPARED);
        paymentOrder.setTimeExpire(gatewayOrder.getExpiresAt());
        paymentOrder.setRequestSnapshot(gatewayOrder.getRequestSnapshot());
        paymentOrder.setResponseSnapshot(gatewayOrder.getResponseSnapshot());
        return wechatPaymentOrderRepository.saveAndFlush(paymentOrder);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public WechatRefundOrderEntity createRefundOrder(
        OrderEntity order,
        WechatPaymentOrderEntity paymentOrder,
        String outRefundNo,
        int refundAmountFen,
        String reason,
        WechatPayClient.CreateRefundResult gatewayRefund,
        WechatRefundOrderStatus refundStatus
    ) {
        LocalDateTime now = LocalDateTime.now(OrderPaymentService.SHANGHAI_ZONE);
        WechatRefundOrderEntity refundOrder = new WechatRefundOrderEntity();
        refundOrder.setOrderId(order.getId());
        refundOrder.setPaymentOrderId(paymentOrder.getId());
        refundOrder.setOutRefundNo(outRefundNo);
        refundOrder.setRefundAmount(refundAmountFen);
        refundOrder.setTotalAmount(paymentOrder.getAmount());
        refundOrder.setReason(reason);
        refundOrder.setRefundId(gatewayRefund.getRefundId());
        refundOrder.setStatus(refundStatus);
        refundOrder.setRequestSnapshot(gatewayRefund.getRequestSnapshot());
        refundOrder.setResponseSnapshot(gatewayRefund.getResponseSnapshot());
        if (refundStatus == WechatRefundOrderStatus.SUCCESS) {
            refundOrder.setSuccessAt(now);
            refundOrder.setFailCode("");
            refundOrder.setFailMessage("");
        } else if (refundStatus == WechatRefundOrderStatus.ABNORMAL
            || refundStatus == WechatRefundOrderStatus.CLOSED
            || refundStatus == WechatRefundOrderStatus.FAILED) {
            refundOrder.setFailCode(refundStatus.name());
            refundOrder.setFailMessage("");
        }
        return wechatRefundOrderRepository.saveAndFlush(refundOrder);
    }
}
