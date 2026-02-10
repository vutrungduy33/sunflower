# 埋点表结构与报表 SQL 模板（MySQL）

> 目标：为私域转化漏斗与运营指标提供统一的埋点存储与 SQL 口径。

## 1) 埋点表结构（建议）

### 1.1 `event_logs`
```sql
CREATE TABLE event_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NULL,
  session_id VARCHAR(64) NULL,
  event_name VARCHAR(64) NOT NULL,
  event_time DATETIME NOT NULL,
  platform VARCHAR(16) NULL,       -- ios/android
  device VARCHAR(64) NULL,
  channel VARCHAR(32) NULL,        -- OTA/直订/线下/扫码
  event_props JSON NULL,           -- 事件属性
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_event_name_time (event_name, event_time),
  INDEX idx_user_time (user_id, event_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 1.2 `orders`（需包含来源字段）
```sql
ALTER TABLE orders
  ADD COLUMN source VARCHAR(32) DEFAULT 'direct',  -- direct/ota/offline
  ADD COLUMN is_first_order TINYINT DEFAULT 0;
```

### 1.3 `coupon_redemptions`
```sql
ALTER TABLE coupon_redemptions
  ADD COLUMN used_at DATETIME NULL;
```

## 2) 报表 SQL 模板（示例）

### 2.1 私域转化漏斗（按自然日）
```sql
-- 扫码人数
SELECT DATE(event_time) AS dt, COUNT(DISTINCT user_id) AS qr_users
FROM event_logs
WHERE event_name = 'qr_scan'
GROUP BY dt;

-- 绑定人数
SELECT DATE(event_time) AS dt, COUNT(DISTINCT user_id) AS bind_users
FROM event_logs
WHERE event_name = 'bind_phone_success'
GROUP BY dt;

-- 首单人数（直订）
SELECT DATE(created_at) AS dt, COUNT(DISTINCT user_id) AS first_order_users
FROM orders
WHERE source = 'direct' AND is_first_order = 1
GROUP BY dt;
```

### 2.2 直订占比
```sql
SELECT DATE(created_at) AS dt,
  SUM(CASE WHEN source='direct' THEN 1 ELSE 0 END) / COUNT(*) AS direct_ratio
FROM orders
GROUP BY dt;
```

### 2.3 券核销率
```sql
SELECT DATE(created_at) AS dt,
  SUM(CASE WHEN status='used' THEN 1 ELSE 0 END) / COUNT(*) AS coupon_use_ratio
FROM coupon_redemptions
GROUP BY dt;
```

### 2.4 触达点击率
```sql
SELECT DATE(event_time) AS dt,
  SUM(CASE WHEN event_name='campaign_click' THEN 1 ELSE 0 END) /
  NULLIF(SUM(CASE WHEN event_name='campaign_sent' THEN 1 ELSE 0 END),0) AS ctr
FROM event_logs
WHERE event_name IN ('campaign_sent','campaign_click')
GROUP BY dt;
```
