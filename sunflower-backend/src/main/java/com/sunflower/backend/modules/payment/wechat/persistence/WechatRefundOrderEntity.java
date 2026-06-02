package com.sunflower.backend.modules.payment.wechat.persistence;

import java.time.LocalDateTime;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Lob;
import javax.persistence.Table;

@Entity
@Table(name = "wechat_refund_orders")
public class WechatRefundOrderEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id")
    private String orderId;

    @Column(name = "payment_order_id")
    private Long paymentOrderId;

    @Column(name = "out_refund_no")
    private String outRefundNo;

    @Column(name = "refund_amount")
    private int refundAmount;

    @Column(name = "total_amount")
    private int totalAmount;

    private String reason;

    @Column(name = "refund_id")
    private String refundId;

    @Enumerated(EnumType.STRING)
    private WechatRefundOrderStatus status;

    @Lob
    @Column(name = "request_snapshot")
    private String requestSnapshot;

    @Lob
    @Column(name = "response_snapshot")
    private String responseSnapshot;

    @Column(name = "last_query_at")
    private LocalDateTime lastQueryAt;

    @Column(name = "success_at")
    private LocalDateTime successAt;

    @Column(name = "fail_code")
    private String failCode;

    @Column(name = "fail_message")
    private String failMessage;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public Long getPaymentOrderId() {
        return paymentOrderId;
    }

    public void setPaymentOrderId(Long paymentOrderId) {
        this.paymentOrderId = paymentOrderId;
    }

    public String getOutRefundNo() {
        return outRefundNo;
    }

    public void setOutRefundNo(String outRefundNo) {
        this.outRefundNo = outRefundNo;
    }

    public int getRefundAmount() {
        return refundAmount;
    }

    public void setRefundAmount(int refundAmount) {
        this.refundAmount = refundAmount;
    }

    public int getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(int totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getRefundId() {
        return refundId;
    }

    public void setRefundId(String refundId) {
        this.refundId = refundId;
    }

    public WechatRefundOrderStatus getStatus() {
        return status;
    }

    public void setStatus(WechatRefundOrderStatus status) {
        this.status = status;
    }

    public String getRequestSnapshot() {
        return requestSnapshot;
    }

    public void setRequestSnapshot(String requestSnapshot) {
        this.requestSnapshot = requestSnapshot;
    }

    public String getResponseSnapshot() {
        return responseSnapshot;
    }

    public void setResponseSnapshot(String responseSnapshot) {
        this.responseSnapshot = responseSnapshot;
    }

    public LocalDateTime getLastQueryAt() {
        return lastQueryAt;
    }

    public void setLastQueryAt(LocalDateTime lastQueryAt) {
        this.lastQueryAt = lastQueryAt;
    }

    public LocalDateTime getSuccessAt() {
        return successAt;
    }

    public void setSuccessAt(LocalDateTime successAt) {
        this.successAt = successAt;
    }

    public String getFailCode() {
        return failCode;
    }

    public void setFailCode(String failCode) {
        this.failCode = failCode;
    }

    public String getFailMessage() {
        return failMessage;
    }

    public void setFailMessage(String failMessage) {
        this.failMessage = failMessage;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
