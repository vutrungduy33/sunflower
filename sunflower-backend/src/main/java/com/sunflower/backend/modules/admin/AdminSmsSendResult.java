package com.sunflower.backend.modules.admin;

public class AdminSmsSendResult {

    private final String providerMessageId;
    private final String providerStatus;

    public AdminSmsSendResult(String providerMessageId, String providerStatus) {
        this.providerMessageId = providerMessageId;
        this.providerStatus = providerStatus;
    }

    public String getProviderMessageId() {
        return providerMessageId;
    }

    public String getProviderStatus() {
        return providerStatus;
    }
}
