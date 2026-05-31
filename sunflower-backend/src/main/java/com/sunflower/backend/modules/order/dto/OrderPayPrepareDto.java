package com.sunflower.backend.modules.order.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class OrderPayPrepareDto {

    private OrderDto order;
    private String paymentMode;
    private Long paymentRecordId;
    private String expiresAt;
    private PaymentRequest paymentRequest;

    public OrderDto getOrder() {
        return order;
    }

    public void setOrder(OrderDto order) {
        this.order = order;
    }

    public String getPaymentMode() {
        return paymentMode;
    }

    public void setPaymentMode(String paymentMode) {
        this.paymentMode = paymentMode;
    }

    public Long getPaymentRecordId() {
        return paymentRecordId;
    }

    public void setPaymentRecordId(Long paymentRecordId) {
        this.paymentRecordId = paymentRecordId;
    }

    public String getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(String expiresAt) {
        this.expiresAt = expiresAt;
    }

    public PaymentRequest getPaymentRequest() {
        return paymentRequest;
    }

    public void setPaymentRequest(PaymentRequest paymentRequest) {
        this.paymentRequest = paymentRequest;
    }

    public static class PaymentRequest {

        private String timeStamp;
        private String nonceStr;
        private String packageValue;
        private String signType;
        private String paySign;

        public String getTimeStamp() {
            return timeStamp;
        }

        public void setTimeStamp(String timeStamp) {
            this.timeStamp = timeStamp;
        }

        public String getNonceStr() {
            return nonceStr;
        }

        public void setNonceStr(String nonceStr) {
            this.nonceStr = nonceStr;
        }

        @JsonProperty("package")
        public String getPackageValue() {
            return packageValue;
        }

        @JsonProperty("package")
        public void setPackageValue(String packageValue) {
            this.packageValue = packageValue;
        }

        public String getSignType() {
            return signType;
        }

        public void setSignType(String signType) {
            this.signType = signType;
        }

        public String getPaySign() {
            return paySign;
        }

        public void setPaySign(String paySign) {
            this.paySign = paySign;
        }
    }
}
