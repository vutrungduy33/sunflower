package com.sunflower.backend.modules.order;

public enum AfterSaleRequestType {
    RESCHEDULE("改期"),
    REFUND("退款");

    private final String label;

    AfterSaleRequestType(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
