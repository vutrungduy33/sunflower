package com.sunflower.backend.modules.order.dto;

public class OrderDto {

    private String id;
    private String orderNo;
    private String source;
    private String roomId;
    private String roomName;
    private String checkInDate;
    private String checkOutDate;
    private int nights;
    private String guestName;
    private String guestPhone;
    private String arrivalTime;
    private String remark;
    private int totalAmount;
    private String status;
    private String statusLabel;
    private String bookingStatus;
    private String bookingStatusLabel;
    private String paymentStatus;
    private String paymentStatusLabel;
    private String paymentMode;
    private String paymentRecordStatus;
    private String paymentRecordNo;
    private String transactionId;
    private Long latestRefundRecordId;
    private String latestRefundStatus;
    private String latestRefundFailureCode;
    private String latestRefundFailureMessage;
    private int latestRefundAmount;
    private Long latestAfterSaleRequestId;
    private String latestAfterSaleType;
    private String latestAfterSaleStatus;
    private String latestAfterSaleStatusLabel;
    private String latestAfterSaleRejectReason;
    private int rescheduleCount;
    private String createdAt;
    private String paidAt;
    private String cancelledAt;
    private String checkedInAt;
    private String checkedOutAt;
    private String noShowAt;
    private String rescheduledAt;
    private String refundedAt;
    private String afterSaleReason;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getOrderNo() {
        return orderNo;
    }

    public void setOrderNo(String orderNo) {
        this.orderNo = orderNo;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    public String getRoomName() {
        return roomName;
    }

    public void setRoomName(String roomName) {
        this.roomName = roomName;
    }

    public String getCheckInDate() {
        return checkInDate;
    }

    public void setCheckInDate(String checkInDate) {
        this.checkInDate = checkInDate;
    }

    public String getCheckOutDate() {
        return checkOutDate;
    }

    public void setCheckOutDate(String checkOutDate) {
        this.checkOutDate = checkOutDate;
    }

    public int getNights() {
        return nights;
    }

    public void setNights(int nights) {
        this.nights = nights;
    }

    public String getGuestName() {
        return guestName;
    }

    public void setGuestName(String guestName) {
        this.guestName = guestName;
    }

    public String getGuestPhone() {
        return guestPhone;
    }

    public void setGuestPhone(String guestPhone) {
        this.guestPhone = guestPhone;
    }

    public String getArrivalTime() {
        return arrivalTime;
    }

    public void setArrivalTime(String arrivalTime) {
        this.arrivalTime = arrivalTime;
    }

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }

    public int getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(int totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getStatusLabel() {
        return statusLabel;
    }

    public void setStatusLabel(String statusLabel) {
        this.statusLabel = statusLabel;
    }

    public String getBookingStatus() {
        return bookingStatus;
    }

    public void setBookingStatus(String bookingStatus) {
        this.bookingStatus = bookingStatus;
    }

    public String getBookingStatusLabel() {
        return bookingStatusLabel;
    }

    public void setBookingStatusLabel(String bookingStatusLabel) {
        this.bookingStatusLabel = bookingStatusLabel;
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public String getPaymentStatusLabel() {
        return paymentStatusLabel;
    }

    public void setPaymentStatusLabel(String paymentStatusLabel) {
        this.paymentStatusLabel = paymentStatusLabel;
    }

    public String getPaymentMode() {
        return paymentMode;
    }

    public void setPaymentMode(String paymentMode) {
        this.paymentMode = paymentMode;
    }

    public String getPaymentRecordStatus() {
        return paymentRecordStatus;
    }

    public void setPaymentRecordStatus(String paymentRecordStatus) {
        this.paymentRecordStatus = paymentRecordStatus;
    }

    public String getPaymentRecordNo() {
        return paymentRecordNo;
    }

    public void setPaymentRecordNo(String paymentRecordNo) {
        this.paymentRecordNo = paymentRecordNo;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }

    public Long getLatestRefundRecordId() {
        return latestRefundRecordId;
    }

    public void setLatestRefundRecordId(Long latestRefundRecordId) {
        this.latestRefundRecordId = latestRefundRecordId;
    }

    public String getLatestRefundStatus() {
        return latestRefundStatus;
    }

    public void setLatestRefundStatus(String latestRefundStatus) {
        this.latestRefundStatus = latestRefundStatus;
    }

    public String getLatestRefundFailureCode() {
        return latestRefundFailureCode;
    }

    public void setLatestRefundFailureCode(String latestRefundFailureCode) {
        this.latestRefundFailureCode = latestRefundFailureCode;
    }

    public String getLatestRefundFailureMessage() {
        return latestRefundFailureMessage;
    }

    public void setLatestRefundFailureMessage(String latestRefundFailureMessage) {
        this.latestRefundFailureMessage = latestRefundFailureMessage;
    }

    public int getLatestRefundAmount() {
        return latestRefundAmount;
    }

    public void setLatestRefundAmount(int latestRefundAmount) {
        this.latestRefundAmount = latestRefundAmount;
    }

    public Long getLatestAfterSaleRequestId() {
        return latestAfterSaleRequestId;
    }

    public void setLatestAfterSaleRequestId(Long latestAfterSaleRequestId) {
        this.latestAfterSaleRequestId = latestAfterSaleRequestId;
    }

    public String getLatestAfterSaleType() {
        return latestAfterSaleType;
    }

    public void setLatestAfterSaleType(String latestAfterSaleType) {
        this.latestAfterSaleType = latestAfterSaleType;
    }

    public String getLatestAfterSaleStatus() {
        return latestAfterSaleStatus;
    }

    public void setLatestAfterSaleStatus(String latestAfterSaleStatus) {
        this.latestAfterSaleStatus = latestAfterSaleStatus;
    }

    public String getLatestAfterSaleStatusLabel() {
        return latestAfterSaleStatusLabel;
    }

    public void setLatestAfterSaleStatusLabel(String latestAfterSaleStatusLabel) {
        this.latestAfterSaleStatusLabel = latestAfterSaleStatusLabel;
    }

    public String getLatestAfterSaleRejectReason() {
        return latestAfterSaleRejectReason;
    }

    public void setLatestAfterSaleRejectReason(String latestAfterSaleRejectReason) {
        this.latestAfterSaleRejectReason = latestAfterSaleRejectReason;
    }

    public int getRescheduleCount() {
        return rescheduleCount;
    }

    public void setRescheduleCount(int rescheduleCount) {
        this.rescheduleCount = rescheduleCount;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getPaidAt() {
        return paidAt;
    }

    public void setPaidAt(String paidAt) {
        this.paidAt = paidAt;
    }

    public String getCancelledAt() {
        return cancelledAt;
    }

    public void setCancelledAt(String cancelledAt) {
        this.cancelledAt = cancelledAt;
    }

    public String getCheckedInAt() {
        return checkedInAt;
    }

    public void setCheckedInAt(String checkedInAt) {
        this.checkedInAt = checkedInAt;
    }

    public String getCheckedOutAt() {
        return checkedOutAt;
    }

    public void setCheckedOutAt(String checkedOutAt) {
        this.checkedOutAt = checkedOutAt;
    }

    public String getNoShowAt() {
        return noShowAt;
    }

    public void setNoShowAt(String noShowAt) {
        this.noShowAt = noShowAt;
    }

    public String getRescheduledAt() {
        return rescheduledAt;
    }

    public void setRescheduledAt(String rescheduledAt) {
        this.rescheduledAt = rescheduledAt;
    }

    public String getRefundedAt() {
        return refundedAt;
    }

    public void setRefundedAt(String refundedAt) {
        this.refundedAt = refundedAt;
    }

    public String getAfterSaleReason() {
        return afterSaleReason;
    }

    public void setAfterSaleReason(String afterSaleReason) {
        this.afterSaleReason = afterSaleReason;
    }
}
