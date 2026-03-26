package com.sunflower.backend.modules.admin;

public class AdminTokenClaims {

    private final String accountId;
    private final AdminRole role;
    private final int credentialVersion;
    private final long expiresAtEpochSeconds;

    public AdminTokenClaims(String accountId, AdminRole role, int credentialVersion, long expiresAtEpochSeconds) {
        this.accountId = accountId;
        this.role = role;
        this.credentialVersion = credentialVersion;
        this.expiresAtEpochSeconds = expiresAtEpochSeconds;
    }

    public String getAccountId() {
        return accountId;
    }

    public AdminRole getRole() {
        return role;
    }

    public int getCredentialVersion() {
        return credentialVersion;
    }

    public long getExpiresAtEpochSeconds() {
        return expiresAtEpochSeconds;
    }
}
