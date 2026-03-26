package com.sunflower.backend.modules.admin;

import com.sunflower.backend.modules.admin.persistence.AdminAccountCredentialEntity;
import com.sunflower.backend.modules.admin.persistence.AdminAccountEntity;

public class AdminAuthSession {

    private final AdminAccountEntity account;
    private final AdminAccountCredentialEntity credential;
    private final AdminTokenClaims claims;

    public AdminAuthSession(
        AdminAccountEntity account,
        AdminAccountCredentialEntity credential,
        AdminTokenClaims claims
    ) {
        this.account = account;
        this.credential = credential;
        this.claims = claims;
    }

    public AdminAccountEntity getAccount() {
        return account;
    }

    public AdminAccountCredentialEntity getCredential() {
        return credential;
    }

    public AdminTokenClaims getClaims() {
        return claims;
    }
}
