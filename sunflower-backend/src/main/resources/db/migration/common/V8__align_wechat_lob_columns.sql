ALTER TABLE wechat_payment_orders
    MODIFY request_snapshot LONGTEXT NULL;

ALTER TABLE wechat_payment_orders
    MODIFY response_snapshot LONGTEXT NULL;

ALTER TABLE wechat_refund_orders
    MODIFY request_snapshot LONGTEXT NULL;

ALTER TABLE wechat_refund_orders
    MODIFY response_snapshot LONGTEXT NULL;

ALTER TABLE wechat_notify_events
    MODIFY raw_headers LONGTEXT NULL;

ALTER TABLE wechat_notify_events
    MODIFY raw_body LONGTEXT NULL;

ALTER TABLE wechat_notify_events
    MODIFY decrypted_body LONGTEXT NULL;
