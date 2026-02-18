package com.sunflower.backend.modules.order.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;

public class RescheduleOrderRequest {

    @NotBlank(message = "checkInDate 不能为空")
    @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$", message = "checkInDate 格式必须是 yyyy-MM-dd")
    private String checkInDate;

    @NotBlank(message = "checkOutDate 不能为空")
    @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$", message = "checkOutDate 格式必须是 yyyy-MM-dd")
    private String checkOutDate;

    private String reason;

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

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
