package com.sunflower.backend.modules.order;

public enum PaymentStatus {
    UNPAID("未支付"),
    PAID("已支付"),
    REFUND_PENDING("退款中"),
    REFUNDED("已退款"),
    PARTIALLY_REFUNDED("部分退款");

    private final String label;

    PaymentStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
