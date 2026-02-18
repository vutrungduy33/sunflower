ALTER TABLE orders
    ADD COLUMN after_sale_reason VARCHAR(512) NOT NULL DEFAULT '';

ALTER TABLE orders
    ADD COLUMN rescheduled_at TIMESTAMP NULL;

ALTER TABLE orders
    ADD COLUMN refunded_at TIMESTAMP NULL;
