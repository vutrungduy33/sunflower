-- MVP demo seed data for deployment bootstrap.
-- Keep this file idempotent.
-- S3 auth hardening sync: keep seed script touched when persistence layer changes.
-- S4 order persistence sync: orders and inventory seeds must stay compatible with DB-backed order workflow.
-- S6 after-sale sync: keep order reschedule/refund columns compatible with stage APIs.

INSERT INTO users (id, openid, unionid, phone, status)
VALUES ('user_demo_1001', 'mock_openid_mvp_code', NULL, '13800000000', 'ACTIVE')
ON DUPLICATE KEY UPDATE
    phone = VALUES(phone),
    status = VALUES(status),
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO user_profiles (user_id, nickname, avatar, tags_json, preferences_json)
VALUES (
    'user_demo_1001',
    '微信用户',
    '',
    '["亲子","湖景偏好"]',
    '{"language":"zh-CN"}'
)
ON DUPLICATE KEY UPDATE
    nickname = VALUES(nickname),
    avatar = VALUES(avatar),
    tags_json = VALUES(tags_json),
    preferences_json = VALUES(preferences_json),
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO rooms (
    id,
    name,
    subtitle,
    cover,
    capacity,
    area,
    bed_type,
    scenic_type,
    tags_json,
    base_price,
    breakfast,
    intro,
    amenities_json,
    rules_json,
    can_cancel_before_hours,
    status
) VALUES
    (
        'room-lake-101',
        '湖景大床房',
        '推窗见湖 | 亲子友好 | 含双早',
        '/assets/TDesign-logo_light.png',
        2,
        32,
        '1.8m 大床',
        '湖景',
        '["热门","私域专属价"]',
        468,
        '含早餐',
        '房间位于二楼，正对泸沽湖东岸，配备观景阳台与独立卫浴，适合情侣与小家庭。',
        '["空调","地暖","免费 Wi-Fi","智能门锁","观景阳台"]',
        '["14:00 后入住","12:00 前退房","不可加床","支持宠物入住（需提前沟通）"]',
        24,
        'ACTIVE'
    ),
    (
        'room-loft-301',
        '湖景 Loft 亲子房',
        '复式空间 | 可住 3 人 | 含双早',
        '/assets/TDesign-logo_light.png',
        3,
        45,
        '1.8m 大床 + 1.2m 单床',
        '湖景',
        '["亲子推荐","含接驳"]',
        598,
        '含早餐',
        '复式结构，楼上休憩区可看湖。适合亲子出行或好友结伴入住，房内含儿童用品包。',
        '["空调","地暖","免费 Wi-Fi","浴缸","儿童洗漱包"]',
        '["14:00 后入住","12:00 前退房","可加床（收费）","支持宠物入住（需提前沟通）"]',
        48,
        'ACTIVE'
    ),
    (
        'room-mountain-203',
        '静谧山景双床房',
        '高性价比 | 安静好睡 | 含双早',
        '/assets/TDesign-logo_light.png',
        2,
        28,
        '1.2m 双床',
        '山景',
        '["性价比","可改期"]',
        388,
        '含早餐',
        '背湖一侧，安静舒适，适合自驾游客与轻旅居用户。靠近停车区与餐饮合作门店。',
        '["空调","地暖","免费 Wi-Fi","智能电视","遮光窗帘"]',
        '["14:00 后入住","12:00 前退房","不可加床","支持宠物入住（需提前沟通）"]',
        24,
        'ACTIVE'
    )
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    subtitle = VALUES(subtitle),
    cover = VALUES(cover),
    capacity = VALUES(capacity),
    area = VALUES(area),
    bed_type = VALUES(bed_type),
    scenic_type = VALUES(scenic_type),
    tags_json = VALUES(tags_json),
    base_price = VALUES(base_price),
    breakfast = VALUES(breakfast),
    intro = VALUES(intro),
    amenities_json = VALUES(amenities_json),
    rules_json = VALUES(rules_json),
    can_cancel_before_hours = VALUES(can_cancel_before_hours),
    status = VALUES(status),
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO room_prices (room_id, biz_date, price, source)
SELECT
    room_seed.room_id,
    DATE_ADD(CURDATE(), INTERVAL day_seq.day_offset DAY),
    CASE
        WHEN DAYOFWEEK(DATE_ADD(CURDATE(), INTERVAL day_seq.day_offset DAY)) IN (1, 7) THEN room_seed.weekend_price
        ELSE room_seed.weekday_price
    END AS price,
    CASE
        WHEN DAYOFWEEK(DATE_ADD(CURDATE(), INTERVAL day_seq.day_offset DAY)) IN (1, 7) THEN 'WEEKEND'
        ELSE 'BASE'
    END AS source
FROM (
    SELECT 'room-lake-101' AS room_id, 468 AS weekday_price, 548 AS weekend_price
    UNION ALL
    SELECT 'room-loft-301' AS room_id, 598 AS weekday_price, 678 AS weekend_price
    UNION ALL
    SELECT 'room-mountain-203' AS room_id, 388 AS weekday_price, 468 AS weekend_price
) AS room_seed
CROSS JOIN (
    SELECT ones.d + tens.d * 10 AS day_offset
    FROM (SELECT 0 AS d UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) AS ones
    CROSS JOIN (SELECT 0 AS d UNION ALL SELECT 1 UNION ALL SELECT 2) AS tens
    WHERE ones.d + tens.d * 10 < 30
) AS day_seq
WHERE 1 = 1
ON DUPLICATE KEY UPDATE
    price = VALUES(price),
    source = VALUES(source),
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO room_inventory (room_id, biz_date, total_stock, available_stock, locked_stock)
SELECT
    room_seed.room_id,
    DATE_ADD(CURDATE(), INTERVAL day_seq.day_offset DAY),
    3 AS total_stock,
    CASE
        WHEN DAYOFWEEK(DATE_ADD(CURDATE(), INTERVAL day_seq.day_offset DAY)) IN (1, 7) THEN 2
        ELSE 3
    END AS available_stock,
    CASE
        WHEN DAYOFWEEK(DATE_ADD(CURDATE(), INTERVAL day_seq.day_offset DAY)) IN (1, 7) THEN 1
        ELSE 0
    END AS locked_stock
FROM (
    SELECT 'room-lake-101' AS room_id
    UNION ALL
    SELECT 'room-loft-301' AS room_id
    UNION ALL
    SELECT 'room-mountain-203' AS room_id
) AS room_seed
CROSS JOIN (
    SELECT ones.d + tens.d * 10 AS day_offset
    FROM (SELECT 0 AS d UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) AS ones
    CROSS JOIN (SELECT 0 AS d UNION ALL SELECT 1 UNION ALL SELECT 2) AS tens
    WHERE ones.d + tens.d * 10 < 30
) AS day_seq
WHERE 1 = 1
ON DUPLICATE KEY UPDATE
    total_stock = VALUES(total_stock),
    available_stock = VALUES(available_stock),
    locked_stock = VALUES(locked_stock),
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO orders (
    id,
    order_no,
    user_id,
    source,
    room_id,
    room_name,
    check_in_date,
    check_out_date,
    nights,
    guest_name,
    guest_phone,
    arrival_time,
    remark,
    after_sale_reason,
    total_amount,
    status,
    paid_at,
    rescheduled_at,
    refunded_at
)
VALUES (
    'order_seed_demo_0001',
    'SFDEMO0001',
    'user_demo_1001',
    'direct',
    'room-mountain-203',
    '静谧山景双床房',
    DATE_ADD(CURDATE(), INTERVAL 1 DAY),
    DATE_ADD(CURDATE(), INTERVAL 2 DAY),
    1,
    '演示住客',
    '13800000000',
    '18:00',
    '系统初始化订单',
    '',
    388,
    'COMPLETED',
    CURRENT_TIMESTAMP,
    NULL,
    NULL
)
ON DUPLICATE KEY UPDATE
    user_id = VALUES(user_id),
    source = VALUES(source),
    room_id = VALUES(room_id),
    room_name = VALUES(room_name),
    check_in_date = VALUES(check_in_date),
    check_out_date = VALUES(check_out_date),
    nights = VALUES(nights),
    guest_name = VALUES(guest_name),
    guest_phone = VALUES(guest_phone),
    arrival_time = VALUES(arrival_time),
    remark = VALUES(remark),
    after_sale_reason = VALUES(after_sale_reason),
    total_amount = VALUES(total_amount),
    status = VALUES(status),
    paid_at = VALUES(paid_at),
    rescheduled_at = VALUES(rescheduled_at),
    refunded_at = VALUES(refunded_at),
    updated_at = CURRENT_TIMESTAMP;
