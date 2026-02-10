# 数据库索引与约束设计（MySQL）

> 说明：建议 InnoDB，utf8mb4。以下为 MVP 核心约束/索引建议。

## 1) 唯一约束（防止脏数据）

- `users.openid` 唯一  
- `users.unionid` 唯一（可为空）  
- `users.phone` 唯一（可为空）  
- `room_inventory (room_id, date)` 唯一  
- `room_prices (room_id, date)` 唯一  
- `order_items (order_id, room_id)` 唯一  
- `payments.transaction_id` 唯一  
- `coupons.code` 唯一（如采用券码）  

## 2) 外键约束（可根据性能取舍）

- `order_items.order_id` → `orders.id`  
- `order_items.room_id` → `rooms.id`  
- `room_inventory.room_id` → `rooms.id`  
- `room_prices.room_id` → `rooms.id`  
- `payments.order_id` → `orders.id`  
- `refunds.payment_id` → `payments.id`  
- `food_orders.user_id` → `users.id`  
- `posts.user_id` → `users.id`  
- `reviews.user_id` → `users.id`  
- `reviews.target_id` → 对应表（可通过业务约束）

## 3) 常用查询索引

### 房态与价格
- `room_inventory`：`(room_id, date)`  
- `room_prices`：`(room_id, date)`  

### 订单
- `orders`：`(user_id, status, created_at)`  
- `orders`：`(checkin_date, checkout_date)`  
- `payments`：`(order_id)`  
- `refunds`：`(payment_id, status)`  

### 餐饮/服务
- `food_orders`：`(user_id, status, created_at)`  
- `service_orders`：`(user_id, status, service_date)`  

### 内容
- `posts`：`(status, created_at)`  
- `reviews`：`(target_type, target_id)`  
- `poi`：空间索引 `SPATIAL INDEX (location)`（需支持）  

## 4) 状态字段枚举建议

- `orders.status`：`pending_payment / paid / checked_in / completed / refund_pending / refunded / cancelled`  
- `food_orders.status`：`pending_payment / paid / preparing / delivering / completed`  
- `service_orders.status`：`pending_confirm / confirmed / completed / cancelled`  
- `posts.status`：`pending_review / published / rejected`  

## 5) 软删除与审计字段

建议每张业务表带：
- `created_at`、`updated_at`  
- `deleted_at`（软删除）  
- `created_by` / `updated_by`（后台操作追踪）
