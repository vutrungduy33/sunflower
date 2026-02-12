package com.sunflower.backend.modules.order;

public enum OrderStatus {
    PENDING_PAYMENT("待支付"),
    CONFIRMED("待入住"),
    COMPLETED("已完成"),
    CANCELLED("已取消");

    private final String label;

    OrderStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
