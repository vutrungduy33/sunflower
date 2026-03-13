package com.sunflower.backend.modules.order;

public enum AfterSaleRequestStatus {
    REQUESTED("处理中"),
    APPROVED("已同意"),
    REJECTED("已拒绝"),
    WITHDRAWN("已撤回");

    private final String label;

    AfterSaleRequestStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
