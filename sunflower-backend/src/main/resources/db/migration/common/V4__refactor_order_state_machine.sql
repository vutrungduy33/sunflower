ALTER TABLE orders
    ADD COLUMN booking_status VARCHAR(32) NOT NULL DEFAULT 'PENDING_PAYMENT';

ALTER TABLE orders
    ADD COLUMN payment_status VARCHAR(32) NOT NULL DEFAULT 'UNPAID';

ALTER TABLE orders
    ADD COLUMN checked_in_at TIMESTAMP NULL;

ALTER TABLE orders
    ADD COLUMN checked_out_at TIMESTAMP NULL;

ALTER TABLE orders
    ADD COLUMN no_show_at TIMESTAMP NULL;

UPDATE orders
SET booking_status = CASE status
        WHEN 'PENDING_PAYMENT' THEN 'PENDING_PAYMENT'
        WHEN 'CANCELLED' THEN 'CANCELLED'
        WHEN 'REFUNDED' THEN 'CANCELLED'
        WHEN 'COMPLETED' THEN 'CHECKED_OUT'
        ELSE 'CONFIRMED'
    END,
    payment_status = CASE status
        WHEN 'PENDING_PAYMENT' THEN 'UNPAID'
        WHEN 'CANCELLED' THEN 'UNPAID'
        WHEN 'REFUNDED' THEN 'REFUNDED'
        ELSE 'PAID'
    END;

CREATE TABLE order_after_sale_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL,
    type VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL,
    requested_by VARCHAR(64) NOT NULL,
    requested_at TIMESTAMP NOT NULL,
    reviewed_by VARCHAR(64),
    reviewed_at TIMESTAMP NULL,
    reason VARCHAR(512) NOT NULL DEFAULT '',
    reject_reason VARCHAR(512) NOT NULL DEFAULT '',
    payload_snapshot VARCHAR(2048) NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_after_sale_requests_order FOREIGN KEY (order_id) REFERENCES orders (id)
);

CREATE INDEX idx_orders_booking_status_created ON orders (booking_status, created_at);
CREATE INDEX idx_orders_payment_status_created ON orders (payment_status, created_at);
CREATE INDEX idx_after_sale_order_requested ON order_after_sale_requests (order_id, requested_at);
