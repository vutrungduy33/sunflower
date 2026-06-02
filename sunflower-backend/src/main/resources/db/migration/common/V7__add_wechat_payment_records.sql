CREATE TABLE wechat_payment_orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    appid VARCHAR(64) NOT NULL,
    mchid VARCHAR(64) NOT NULL,
    payer_openid VARCHAR(128) NOT NULL,
    out_trade_no VARCHAR(64) NOT NULL,
    amount INT NOT NULL,
    prepay_id VARCHAR(128),
    transaction_id VARCHAR(128),
    status VARCHAR(32) NOT NULL,
    time_expire TIMESTAMP NULL,
    request_snapshot TEXT,
    response_snapshot TEXT,
    last_query_at TIMESTAMP NULL,
    success_at TIMESTAMP NULL,
    fail_code VARCHAR(64),
    fail_message VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_wechat_payment_orders_out_trade_no UNIQUE (out_trade_no),
    CONSTRAINT fk_wechat_payment_orders_order FOREIGN KEY (order_id) REFERENCES orders (id),
    CONSTRAINT fk_wechat_payment_orders_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE wechat_refund_orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL,
    payment_order_id BIGINT NOT NULL,
    out_refund_no VARCHAR(64) NOT NULL,
    refund_amount INT NOT NULL,
    total_amount INT NOT NULL,
    reason VARCHAR(512) NOT NULL DEFAULT '',
    refund_id VARCHAR(128),
    status VARCHAR(32) NOT NULL,
    request_snapshot TEXT,
    response_snapshot TEXT,
    last_query_at TIMESTAMP NULL,
    success_at TIMESTAMP NULL,
    fail_code VARCHAR(64),
    fail_message VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_wechat_refund_orders_out_refund_no UNIQUE (out_refund_no),
    CONSTRAINT fk_wechat_refund_orders_order FOREIGN KEY (order_id) REFERENCES orders (id),
    CONSTRAINT fk_wechat_refund_orders_payment FOREIGN KEY (payment_order_id) REFERENCES wechat_payment_orders (id)
);

CREATE TABLE wechat_notify_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    notify_id VARCHAR(128) NOT NULL,
    notify_type VARCHAR(32) NOT NULL,
    resource_id VARCHAR(128),
    event_type VARCHAR(64),
    summary VARCHAR(255),
    status VARCHAR(32) NOT NULL,
    raw_headers TEXT,
    raw_body TEXT,
    decrypted_body TEXT,
    processed_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_wechat_notify_events_notify_id UNIQUE (notify_id)
);

CREATE INDEX idx_wechat_payment_orders_order_created ON wechat_payment_orders (order_id, created_at);
CREATE INDEX idx_wechat_payment_orders_status_created ON wechat_payment_orders (status, created_at);
CREATE INDEX idx_wechat_refund_orders_order_created ON wechat_refund_orders (order_id, created_at);
CREATE INDEX idx_wechat_refund_orders_payment_created ON wechat_refund_orders (payment_order_id, created_at);
CREATE INDEX idx_wechat_notify_events_type_created ON wechat_notify_events (notify_type, created_at);
