package com.sunflower.backend.modules.payment.wechat;

public class WechatNotifyAckResponse {

    private String code;
    private String message;

    public WechatNotifyAckResponse() {
    }

    public WechatNotifyAckResponse(String code, String message) {
        this.code = code;
        this.message = message;
    }

    public static WechatNotifyAckResponse success() {
        return new WechatNotifyAckResponse("SUCCESS", "成功");
    }

    public static WechatNotifyAckResponse fail(String message) {
        return new WechatNotifyAckResponse("FAIL", message);
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
