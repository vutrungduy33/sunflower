package com.sunflower.backend.modules.payment.wechat;

public class WechatPayGatewayException extends RuntimeException {

    private final int statusCode;
    private final String responseBody;

    public WechatPayGatewayException(String message, int statusCode, String responseBody) {
        super(message);
        this.statusCode = statusCode;
        this.responseBody = responseBody;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public String getResponseBody() {
        return responseBody;
    }
}
