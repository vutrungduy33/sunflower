package com.sunflower.backend.modules.order.admin.dto;

public class AdminOrderOverviewDto {

    private long orderCount;
    private long pendingCheckInCount;
    private long refundedOrderCount;
    private int revenueAmount;

    public AdminOrderOverviewDto() {
    }

    public AdminOrderOverviewDto(
        long orderCount,
        long pendingCheckInCount,
        long refundedOrderCount,
        int revenueAmount
    ) {
        this.orderCount = orderCount;
        this.pendingCheckInCount = pendingCheckInCount;
        this.refundedOrderCount = refundedOrderCount;
        this.revenueAmount = revenueAmount;
    }

    public long getOrderCount() {
        return orderCount;
    }

    public void setOrderCount(long orderCount) {
        this.orderCount = orderCount;
    }

    public long getPendingCheckInCount() {
        return pendingCheckInCount;
    }

    public void setPendingCheckInCount(long pendingCheckInCount) {
        this.pendingCheckInCount = pendingCheckInCount;
    }

    public long getRefundedOrderCount() {
        return refundedOrderCount;
    }

    public void setRefundedOrderCount(long refundedOrderCount) {
        this.refundedOrderCount = refundedOrderCount;
    }

    public int getRevenueAmount() {
        return revenueAmount;
    }

    public void setRevenueAmount(int revenueAmount) {
        this.revenueAmount = revenueAmount;
    }
}
