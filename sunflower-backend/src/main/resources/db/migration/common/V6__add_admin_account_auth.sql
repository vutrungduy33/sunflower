CREATE TABLE admin_accounts (
    id VARCHAR(64) PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    role VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    activated_at TIMESTAMP NULL,
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_admin_accounts_phone UNIQUE (phone)
);

CREATE TABLE admin_account_credentials (
    account_id VARCHAR(64) PRIMARY KEY,
    password_hash VARCHAR(255) NOT NULL,
    credential_version INT NOT NULL DEFAULT 1,
    failed_login_count INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMP NULL,
    last_password_changed_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_admin_account_credentials_account FOREIGN KEY (account_id) REFERENCES admin_accounts (id)
);

CREATE TABLE admin_sms_verification_codes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    purpose VARCHAR(32) NOT NULL,
    role VARCHAR(32),
    code_hash VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    verify_attempt_count INT NOT NULL DEFAULT 0,
    max_verify_attempts INT NOT NULL DEFAULT 5,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    invalidated_at TIMESTAMP NULL,
    provider_message_id VARCHAR(128),
    provider_status VARCHAR(64),
    request_ip VARCHAR(64),
    user_agent VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admin_auth_audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    account_id VARCHAR(64),
    phone VARCHAR(20),
    event_type VARCHAR(64) NOT NULL,
    result VARCHAR(32) NOT NULL,
    detail VARCHAR(512),
    request_ip VARCHAR(64),
    user_agent VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_admin_auth_audit_logs_account FOREIGN KEY (account_id) REFERENCES admin_accounts (id)
);

CREATE INDEX idx_admin_sms_codes_phone_purpose_status ON admin_sms_verification_codes (phone, purpose, status);
CREATE INDEX idx_admin_sms_codes_phone_created_at ON admin_sms_verification_codes (phone, created_at);
CREATE INDEX idx_admin_auth_audit_logs_account_created_at ON admin_auth_audit_logs (account_id, created_at);
CREATE INDEX idx_admin_auth_audit_logs_phone_created_at ON admin_auth_audit_logs (phone, created_at);
