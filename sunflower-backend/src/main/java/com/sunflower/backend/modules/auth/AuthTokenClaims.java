package com.sunflower.backend.modules.auth;

public class AuthTokenClaims {

    private final String userId;
    private final int authVersion;
    private final long expiresAtEpochSeconds;

    public AuthTokenClaims(String userId, int authVersion, long expiresAtEpochSeconds) {
        this.userId = userId;
        this.authVersion = authVersion;
        this.expiresAtEpochSeconds = expiresAtEpochSeconds;
    }

    public String getUserId() {
        return userId;
    }

    public int getAuthVersion() {
        return authVersion;
    }

    public long getExpiresAtEpochSeconds() {
        return expiresAtEpochSeconds;
    }
}
