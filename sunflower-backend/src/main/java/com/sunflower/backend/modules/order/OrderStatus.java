package com.sunflower.backend.modules.order;

public enum OrderStatus {
    PENDING_PAYMENT("待支付"),
    CONFIRMED("待入住"),
    CHECKED_IN("已入住"),
    RESCHEDULED("已改期"),
    REFUND_PENDING("退款中"),
    REFUNDED("已退款"),
    COMPLETED("已完成"),
    CANCELLED("已取消"),
    NO_SHOW("已失约");

    private final String label;

    OrderStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
