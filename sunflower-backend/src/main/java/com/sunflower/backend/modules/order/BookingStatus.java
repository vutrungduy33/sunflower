package com.sunflower.backend.modules.order;

public enum BookingStatus {
    PENDING_PAYMENT("待支付"),
    CONFIRMED("待入住"),
    CHECKED_IN("已入住"),
    CHECKED_OUT("已离店"),
    CANCELLED("已取消"),
    NO_SHOW("已失约");

    private final String label;

    BookingStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
