package com.sunflower.backend.modules.order.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;

public class CreateOrderRequest {

    @NotBlank(message = "roomId 不能为空")
    private String roomId;

    @NotBlank(message = "checkInDate 不能为空")
    @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$", message = "checkInDate 格式必须是 yyyy-MM-dd")
    private String checkInDate;

    @NotBlank(message = "checkOutDate 不能为空")
    @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$", message = "checkOutDate 格式必须是 yyyy-MM-dd")
    private String checkOutDate;

    private String source;

    @NotBlank(message = "入住人姓名不能为空")
    private String guestName;

    @NotBlank(message = "手机号不能为空")
    @Pattern(regexp = "^1\\d{10}$", message = "请输入正确的 11 位手机号")
    private String guestPhone;

    @NotBlank(message = "预计到店时间不能为空")
    private String arrivalTime;

    private String remark;

    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
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

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
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
}
