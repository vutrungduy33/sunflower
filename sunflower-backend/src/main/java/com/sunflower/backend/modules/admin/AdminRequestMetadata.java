package com.sunflower.backend.modules.admin;

public class AdminRequestMetadata {

    private final String requestIp;
    private final String userAgent;

    public AdminRequestMetadata(String requestIp, String userAgent) {
        this.requestIp = requestIp;
        this.userAgent = userAgent;
    }

    public String getRequestIp() {
        return requestIp;
    }

    public String getUserAgent() {
        return userAgent;
    }
}
