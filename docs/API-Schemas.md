# 接口字段级别定义（请求/响应示例）

> 更新时间：2026-03-13  
> 说明：以下示例对齐当前 `sunflower-backend` 的 MVP 一期实现。

统一响应壳：
```json
{
  "code": 0,
  "message": "OK",
  "data": {}
}
```

统一错误示例：
```json
{
  "code": 40001,
  "message": "请输入正确的 11 位手机号",
  "data": null
}
```

鉴权错误示例：
```json
{
  "code": 40100,
  "message": "请先登录",
  "data": null
}
```

## 1) 认证与用户

登录态说明：登录后返回签名 token（默认有效期 2 小时），客户端通过 `Authorization: Bearer <token>` 调用当前用户接口；未携带、token 无效或过期返回 `40100`。
登录链路说明：小程序先调用 `wx.login()` 获取一次性 `code`，后端用 `code` 调微信 `jscode2session` 换取 `openid`；`dev/test` 环境可通过配置开启 mock 交换。

### `POST /api/auth/wechat/login`
**请求**
```json
{
  "code": "wx_login_code_from_client"
}
```
**响应**
```json
{
  "token": "dXNlcl9kZW1vXzEwMDE6MTc2MDAwMDAwMA.lq4XxCjv1P4lY8s5vFv1mEtN2vH8jYk4g7aD8X3T5uY",
  "openId": "oLw8s5exampleOpenId",
  "profile": {
    "nickName": "微信用户",
    "phone": "",
    "tags": ["亲子", "湖景偏好"],
    "isPhoneBound": false
  }
}
```

### `POST /api/auth/bind-phone`
**请求**
```json
{
  "phone": "13800000000"
}
```
**响应**
```json
{
  "nickName": "微信用户",
  "phone": "13800000000",
  "tags": ["亲子", "湖景偏好"],
  "isPhoneBound": true
}
```

### `GET /api/users/me`
**响应**
```json
{
  "nickName": "微信用户",
  "phone": "13800000000",
  "tags": ["亲子", "湖景偏好"],
  "isPhoneBound": true
}
```

### `PATCH /api/users/me`
**请求**
```json
{
  "nickName": "葵花住客"
}
```
**响应**
```json
{
  "nickName": "葵花住客",
  "phone": "13800000000",
  "tags": ["亲子", "湖景偏好"],
  "isPhoneBound": true
}
```

## 2) 首页与内容

### `GET /api/content/home`
**响应**
```json
{
  "banners": [
    {
      "id": "banner-1",
      "title": "湖景连住优惠",
      "subtitle": "连住 2 晚立减 120 元",
      "cta": "立即预订"
    }
  ],
  "services": [
    {
      "id": "service-transfer",
      "name": "机场接驳",
      "desc": "丽江机场往返，提前一天预约",
      "icon": "car"
    }
  ],
  "featuredRooms": [
    {
      "id": "room-lake-101",
      "name": "湖景大床房",
      "todayPrice": 468,
      "stock": 1
    }
  ],
  "memberBenefits": [
    "首单立减券（下单可用）",
    "复购券（退房后自动发放）",
    "接驳服务优先预约"
  ]
}
```

### `GET /api/poi`
**响应**
```json
[
  {
    "id": "poi-lvjiawan",
    "name": "吕家湾码头",
    "category": "码头",
    "distanceKm": 0.2,
    "summary": "步行 5 分钟可达，日出观景点。",
    "latitude": 27.7326,
    "longitude": 100.7762
  }
]
```

### `GET /api/posts`
**响应**
```json
[
  {
    "id": "note-1",
    "title": "两天一晚泸沽湖亲子慢游路线",
    "author": "向日葵住客",
    "likes": 126,
    "tags": ["亲子", "路线"],
    "summary": "包含到达、环湖、晚餐与日出行程安排，适合带娃家庭。"
  }
]
```

## 3) 房型与房态

### `GET /api/rooms`
**请求参数（可选）**
- `checkInDate`：`yyyy-MM-dd`
- `keyword`：关键词（匹配房型名/副标题/景观类型）

**响应**
```json
[
  {
    "id": "room-lake-101",
    "name": "湖景大床房",
    "subtitle": "推窗见湖 | 亲子友好 | 含双早",
    "capacity": 2,
    "area": 32,
    "scenicType": "湖景",
    "todayPrice": 468,
    "stock": 1
  }
]
```

### `GET /api/rooms/{id}`
**响应**
```json
{
  "id": "room-lake-101",
  "name": "湖景大床房",
  "calendar": [
    {
      "date": "2026-02-12",
      "weekdayLabel": "周四",
      "price": 468,
      "stock": 1
    }
  ]
}
```

### `GET /api/rooms/{id}/calendar`
**请求参数（可选）**
- `startDate`：`yyyy-MM-dd`
- `days`：1-31（默认 14）

**响应**
```json
{
  "roomId": "room-lake-101",
  "calendar": [
    {
      "date": "2026-02-12",
      "weekdayLabel": "周四",
      "price": 468,
      "stock": 1
    }
  ]
}
```

## 4) 住宿订单

兼容状态字段 `status/statusLabel`：
- `PENDING_PAYMENT`（待支付）
- `CONFIRMED`（待入住，兼容包含“退款/改期处理中、被拒绝后继续待入住”的展示）
- `CHECKED_IN`（已入住）
- `RESCHEDULED`（已改期，兼容展示态）
- `REFUNDED`（已退款，兼容展示态）
- `COMPLETED`（已完成）
- `CANCELLED`（已取消）
- `NO_SHOW`（已失约）

主订单状态 `bookingStatus`：
- `PENDING_PAYMENT` / `CONFIRMED` / `CHECKED_IN` / `CHECKED_OUT` / `CANCELLED` / `NO_SHOW`

支付状态 `paymentStatus`：
- `UNPAID` / `PAID` / `REFUND_PENDING` / `REFUNDED` / `PARTIALLY_REFUNDED`

售后申请字段：
- `latestAfterSaleType`：`RESCHEDULE` / `REFUND`
- `latestAfterSaleStatus`：`REQUESTED` / `APPROVED` / `REJECTED` / `WITHDRAWN`

### `POST /api/orders`
**请求**
```json
{
  "roomId": "room-lake-101",
  "checkInDate": "2026-02-12",
  "checkOutDate": "2026-02-14",
  "source": "direct",
  "guestName": "张三",
  "guestPhone": "13800000000",
  "arrivalTime": "18:00",
  "remark": "需要婴儿床"
}
```

**响应**
```json
{
  "id": "order_1739260800000_123",
  "orderNo": "SF202602121234",
  "source": "direct",
  "roomId": "room-lake-101",
  "roomName": "湖景大床房",
  "checkInDate": "2026-02-12",
  "checkOutDate": "2026-02-14",
  "nights": 2,
  "guestName": "张三",
  "guestPhone": "13800000000",
  "arrivalTime": "18:00",
  "remark": "需要婴儿床",
  "totalAmount": 1016,
  "status": "PENDING_PAYMENT",
  "statusLabel": "待支付",
  "bookingStatus": "PENDING_PAYMENT",
  "bookingStatusLabel": "待支付",
  "paymentStatus": "UNPAID",
  "paymentStatusLabel": "未支付",
  "latestAfterSaleRequestId": null,
  "latestAfterSaleType": "",
  "latestAfterSaleStatus": "",
  "latestAfterSaleStatusLabel": "",
  "latestAfterSaleRejectReason": "",
  "rescheduleCount": 0,
  "createdAt": "2026-02-12T10:00:00+08:00",
  "paidAt": "",
  "cancelledAt": "",
  "checkedInAt": "",
  "checkedOutAt": "",
  "noShowAt": "",
  "rescheduledAt": "",
  "refundedAt": "",
  "afterSaleReason": ""
}
```

### `POST /api/orders/{id}/pay`
**响应**
```json
{
  "id": "order_1739260800000_123",
  "status": "CONFIRMED",
  "statusLabel": "待入住",
  "bookingStatus": "CONFIRMED",
  "paymentStatus": "PAID",
  "paidAt": "2026-02-12T10:30:00+08:00"
}
```

### `POST /api/orders/{id}/cancel`
说明：仅允许取消 `bookingStatus = PENDING_PAYMENT` 的未支付订单。

**请求（可选）**
```json
{
  "reason": "行程有变"
}
```

**响应**
```json
{
  "id": "order_1739260800000_123",
  "status": "CANCELLED",
  "statusLabel": "已取消",
  "bookingStatus": "CANCELLED",
  "paymentStatus": "UNPAID",
  "cancelledAt": "2026-02-12T11:00:00+08:00",
  "afterSaleReason": "行程有变"
}
```

### `POST /api/orders/{id}/reschedule`
说明：用户端提交的是“改期申请”，不会立即改动入住日期；审批通过后才会真正更新日期和库存。

**请求**
```json
{
  "checkInDate": "2026-02-15",
  "checkOutDate": "2026-02-17",
  "reason": "机票改签"
}
```

**响应**
```json
{
  "id": "order_1739260800000_123",
  "status": "CONFIRMED",
  "statusLabel": "待入住（改期处理中）",
  "bookingStatus": "CONFIRMED",
  "paymentStatus": "PAID",
  "latestAfterSaleRequestId": 11,
  "latestAfterSaleType": "RESCHEDULE",
  "latestAfterSaleStatus": "REQUESTED",
  "latestAfterSaleStatusLabel": "处理中",
  "checkInDate": "2026-02-12",
  "checkOutDate": "2026-02-14",
  "afterSaleReason": "机票改签"
}
```

### `POST /api/orders/{id}/refund`
说明：用户端提交的是“退款申请”，审批通过后订单会转为 `bookingStatus = CANCELLED` 并更新支付状态。

**请求（可选）**
```json
{
  "reason": "临时取消行程"
}
```

**响应**
```json
{
  "id": "order_1739260800000_123",
  "status": "CONFIRMED",
  "statusLabel": "待入住（退款处理中）",
  "bookingStatus": "CONFIRMED",
  "paymentStatus": "PAID",
  "latestAfterSaleRequestId": 12,
  "latestAfterSaleType": "REFUND",
  "latestAfterSaleStatus": "REQUESTED",
  "latestAfterSaleStatusLabel": "处理中",
  "afterSaleReason": "临时取消行程"
}
```

### `GET /api/orders`
**响应**
```json
[
  {
    "id": "order_1739260800000_123",
    "orderNo": "SF202602121234",
    "status": "CONFIRMED",
    "statusLabel": "待入住（退款处理中）",
    "bookingStatus": "CONFIRMED",
    "paymentStatus": "PAID",
    "latestAfterSaleType": "REFUND",
    "latestAfterSaleStatus": "REQUESTED",
    "checkInDate": "2026-02-15",
    "checkOutDate": "2026-02-17",
    "rescheduledAt": "2026-02-12T11:20:00+08:00"
  }
]
```

### `GET /api/orders/{id}`
**响应**
```json
{
  "id": "order_1739260800000_123",
  "orderNo": "SF202602121234",
  "status": "REFUNDED",
  "statusLabel": "已退款",
  "bookingStatus": "CANCELLED",
  "bookingStatusLabel": "已取消",
  "paymentStatus": "REFUNDED",
  "paymentStatusLabel": "已退款",
  "latestAfterSaleType": "REFUND",
  "latestAfterSaleStatus": "APPROVED",
  "latestAfterSaleStatusLabel": "已同意",
  "refundedAt": "2026-02-12T12:00:00+08:00",
  "afterSaleReason": "临时取消行程"
}
```

## 5) 管理端房型与房态

管理端鉴权说明：当前 MVP 通过静态管理 token 调用管理接口，请在请求头携带 `Authorization: Bearer <admin-token>`。缺失 token 返回 `40100/请先登录管理端`，错误 token 返回 `40100/管理端登录态无效`。默认配置项为 `app.admin.auth.token`，生产环境建议通过 `ADMIN_AUTH_TOKEN` 注入。

### `GET /api/admin/rooms`
**响应**
```json
[
  {
    "id": "room-lake-101",
    "name": "270° 湖景大床房",
    "subtitle": "落地窗 + 湖景露台",
    "cover": "/images/rooms/lake-101.png",
    "capacity": 2,
    "area": 46,
    "bedType": "1.8m 大床",
    "scenicType": "湖景",
    "tags": ["爆款", "含早餐"],
    "basePrice": 488,
    "breakfast": "含双早",
    "intro": "适合情侣和闺蜜度假，带湖景露台。",
    "amenities": ["空调", "投影", "浴缸"],
    "rules": ["14:00 后入住", "12:00 前退房"],
    "canCancelBeforeHours": 24,
    "status": "ACTIVE"
  },
  {
    "id": "room-admin-20260310101530-4821",
    "name": "云顶湖景套房",
    "subtitle": "270 度观景露台 | 可住 4 人",
    "cover": "/assets/admin-room-cover.png",
    "capacity": 4,
    "area": 68,
    "bedType": "2m 大床 + 1.2m 沙发床",
    "scenicType": "湖景",
    "tags": ["新上架", "家庭出游"],
    "basePrice": 688,
    "breakfast": "含 4 份早餐",
    "intro": "顶层景观套房，适合家庭和小团体入住。",
    "amenities": ["空调", "投影", "露台浴缸"],
    "rules": ["14:00 后入住", "12:00 前退房"],
    "canCancelBeforeHours": 24,
    "status": "INACTIVE"
  }
]
```

### `POST /api/admin/rooms`
**请求**
```json
{
  "name": "云顶湖景套房",
  "subtitle": "270 度观景露台 | 可住 4 人",
  "cover": "/assets/admin-room-cover.png",
  "capacity": 4,
  "area": 68,
  "bedType": "2m 大床 + 1.2m 沙发床",
  "scenicType": "湖景",
  "tags": ["新上架", "家庭出游"],
  "basePrice": 688,
  "breakfast": "含 4 份早餐",
  "intro": "顶层景观套房，适合家庭和小团体入住。",
  "amenities": ["空调", "投影", "露台浴缸"],
  "rules": ["14:00 后入住", "12:00 前退房"],
  "canCancelBeforeHours": 24,
  "status": "ACTIVE"
}
```
**响应**
```json
{
  "id": "room-admin-20260310101530-4821",
  "name": "云顶湖景套房",
  "subtitle": "270 度观景露台 | 可住 4 人",
  "cover": "/assets/admin-room-cover.png",
  "capacity": 4,
  "area": 68,
  "bedType": "2m 大床 + 1.2m 沙发床",
  "scenicType": "湖景",
  "tags": ["新上架", "家庭出游"],
  "basePrice": 688,
  "breakfast": "含 4 份早餐",
  "intro": "顶层景观套房，适合家庭和小团体入住。",
  "amenities": ["空调", "投影", "露台浴缸"],
  "rules": ["14:00 后入住", "12:00 前退房"],
  "canCancelBeforeHours": 24,
  "status": "ACTIVE"
}
```

### `PATCH /api/admin/rooms/{id}`
**请求（部分字段）**
```json
{
  "name": "云顶湖景家庭套房",
  "basePrice": 699,
  "status": "ACTIVE"
}
```
**响应**
```json
{
  "id": "room-admin-20260310101530-4821",
  "name": "云顶湖景家庭套房",
  "basePrice": 699,
  "status": "ACTIVE"
}
```

### `POST /api/admin/room-prices`
**请求**
```json
{
  "roomId": "room-admin-20260310101530-4821",
  "items": [
    {
      "date": "2026-02-20",
      "price": 699,
      "source": "MANUAL"
    },
    {
      "date": "2026-02-21",
      "price": 799,
      "source": "WEEKEND"
    }
  ]
}
```
**响应**
```json
{
  "roomId": "room-admin-20260310101530-4821",
  "updatedCount": 2,
  "items": [
    {
      "date": "2026-02-20",
      "price": 699,
      "source": "MANUAL"
    },
    {
      "date": "2026-02-21",
      "price": 799,
      "source": "WEEKEND"
    }
  ]
}
```

### `POST /api/admin/room-inventory`
**请求**
```json
{
  "roomId": "room-admin-20260310101530-4821",
  "items": [
    {
      "date": "2026-02-20",
      "totalStock": 2
    },
    {
      "date": "2026-02-21",
      "totalStock": 1
    }
  ]
}
```
**响应**
```json
{
  "roomId": "room-admin-20260310101530-4821",
  "updatedCount": 2,
  "items": [
    {
      "date": "2026-02-20",
      "totalStock": 2,
      "availableStock": 2,
      "lockedStock": 0
    },
    {
      "date": "2026-02-21",
      "totalStock": 1,
      "availableStock": 1,
      "lockedStock": 0
    }
  ]
}
```

## 6) 管理端订单与经营概览

### `GET /api/admin/orders`
**Query 参数**

- `status`：可选，支持 `PENDING_PAYMENT` / `CONFIRMED` / `CHECKED_IN` / `RESCHEDULED` / `REFUNDED` / `COMPLETED` / `CANCELLED` / `NO_SHOW`
- `keyword`：可选，模糊匹配 `orderNo` / `roomName` / `guestName` / `guestPhone`
- `checkInStartDate`：可选，格式 `yyyy-MM-dd`
- `checkInEndDate`：可选，格式 `yyyy-MM-dd`

**响应**
```json
[
  {
    "id": "order_1741651200000_3456",
    "orderNo": "SF2026031110301234",
    "userId": "user_demo_1001",
    "source": "direct",
    "roomId": "room-lake-101",
    "roomName": "270° 湖景大床房",
    "checkInDate": "2026-02-15",
    "checkOutDate": "2026-02-16",
    "nights": 1,
    "guestName": "后台售后住客A",
    "guestPhone": "13800000011",
    "arrivalTime": "18:00",
    "remark": "后台改期单",
    "totalAmount": 488,
    "status": "CONFIRMED",
    "statusLabel": "待入住（退款处理中）",
    "bookingStatus": "CONFIRMED",
    "bookingStatusLabel": "待入住",
    "paymentStatus": "PAID",
    "paymentStatusLabel": "已支付",
    "latestAfterSaleRequestId": 18,
    "latestAfterSaleType": "REFUND",
    "latestAfterSaleStatus": "REQUESTED",
    "latestAfterSaleStatusLabel": "处理中",
    "latestAfterSaleRejectReason": "",
    "rescheduleCount": 1,
    "createdAt": "2026-03-11T10:30:12+08:00",
    "paidAt": "2026-03-11T10:31:00+08:00",
    "cancelledAt": "",
    "checkedInAt": "",
    "checkedOutAt": "",
    "noShowAt": "",
    "rescheduledAt": "2026-03-11T10:35:00+08:00",
    "refundedAt": "",
    "afterSaleReason": "用户申请退款"
  }
]
```

### `GET /api/admin/orders/{id}`
**响应**
```json
{
  "id": "order_1741651200000_3456",
  "orderNo": "SF2026031110301234",
  "userId": "user_demo_1001",
  "source": "direct",
  "roomId": "room-lake-101",
  "roomName": "270° 湖景大床房",
  "checkInDate": "2026-02-15",
  "checkOutDate": "2026-02-16",
  "nights": 1,
  "guestName": "后台售后住客A",
  "guestPhone": "13800000011",
  "arrivalTime": "18:00",
  "remark": "后台改期单",
  "totalAmount": 488,
  "status": "RESCHEDULED",
  "statusLabel": "已改期",
  "bookingStatus": "CONFIRMED",
  "bookingStatusLabel": "待入住",
  "paymentStatus": "PAID",
  "paymentStatusLabel": "已支付",
  "latestAfterSaleRequestId": 17,
  "latestAfterSaleType": "RESCHEDULE",
  "latestAfterSaleStatus": "APPROVED",
  "latestAfterSaleStatusLabel": "已同意",
  "latestAfterSaleRejectReason": "",
  "rescheduleCount": 1,
  "createdAt": "2026-03-11T10:30:12+08:00",
  "paidAt": "2026-03-11T10:31:00+08:00",
  "cancelledAt": "",
  "checkedInAt": "",
  "checkedOutAt": "",
  "noShowAt": "",
  "rescheduledAt": "2026-03-11T10:35:00+08:00",
  "refundedAt": "",
  "afterSaleReason": "后台人工协调档期"
}
```

### `POST /api/admin/orders/{id}/reschedule`
说明：兼容保留的后台直接改期接口，会立即完成审批并更新日期、库存和兼容状态。

**请求**
```json
{
  "checkInDate": "2026-02-15",
  "checkOutDate": "2026-02-16",
  "reason": "后台人工协调档期"
}
```
**响应**
```json
{
  "id": "order_1741651200000_3456",
  "status": "RESCHEDULED",
  "statusLabel": "已改期",
  "bookingStatus": "CONFIRMED",
  "paymentStatus": "PAID",
  "latestAfterSaleType": "RESCHEDULE",
  "latestAfterSaleStatus": "APPROVED",
  "checkInDate": "2026-02-15",
  "checkOutDate": "2026-02-16",
  "rescheduledAt": "2026-03-11T10:35:00+08:00",
  "afterSaleReason": "后台人工协调档期"
}
```

### `POST /api/admin/orders/{id}/refund`
说明：兼容保留的后台直接退款接口，会立即完成退款状态落库。

**请求**
```json
{
  "reason": "后台审核同意退款"
}
```
**响应**
```json
{
  "id": "order_1741651200000_7890",
  "status": "REFUNDED",
  "statusLabel": "已退款",
  "bookingStatus": "CANCELLED",
  "paymentStatus": "REFUNDED",
  "latestAfterSaleType": "REFUND",
  "latestAfterSaleStatus": "APPROVED",
  "refundedAt": "2026-03-11T10:40:00+08:00",
  "afterSaleReason": "后台审核同意退款"
}
```

### `POST /api/admin/orders/{id}/after-sale/{requestId}/approve`
**响应**
```json
{
  "id": "order_1741651200000_3456",
  "latestAfterSaleRequestId": 18,
  "latestAfterSaleType": "REFUND",
  "latestAfterSaleStatus": "APPROVED",
  "latestAfterSaleStatusLabel": "已同意",
  "status": "REFUNDED",
  "bookingStatus": "CANCELLED",
  "paymentStatus": "REFUNDED"
}
```

### `POST /api/admin/orders/{id}/after-sale/{requestId}/reject`
**请求**
```json
{
  "rejectReason": "已超过当前房型退款时限"
}
```
**响应**
```json
{
  "id": "order_1741651200000_3456",
  "latestAfterSaleRequestId": 18,
  "latestAfterSaleType": "REFUND",
  "latestAfterSaleStatus": "REJECTED",
  "latestAfterSaleStatusLabel": "已拒绝",
  "latestAfterSaleRejectReason": "已超过当前房型退款时限",
  "status": "CONFIRMED",
  "bookingStatus": "CONFIRMED",
  "paymentStatus": "PAID"
}
```

### `POST /api/admin/orders/{id}/check-in`
**响应**
```json
{
  "id": "order_1741651200000_3456",
  "status": "CHECKED_IN",
  "statusLabel": "已入住",
  "bookingStatus": "CHECKED_IN",
  "checkedInAt": "2026-03-11T15:00:00+08:00"
}
```

### `POST /api/admin/orders/{id}/check-out`
**响应**
```json
{
  "id": "order_1741651200000_3456",
  "status": "COMPLETED",
  "statusLabel": "已完成",
  "bookingStatus": "CHECKED_OUT",
  "checkedOutAt": "2026-03-12T12:00:00+08:00"
}
```

### `POST /api/admin/orders/{id}/no-show`
**响应**
```json
{
  "id": "order_1741651200000_3456",
  "status": "NO_SHOW",
  "statusLabel": "已失约",
  "bookingStatus": "NO_SHOW",
  "noShowAt": "2026-03-11T22:00:00+08:00"
}
```

### `GET /api/admin/reports/summary`
说明：当前返回的是管理端订单经营快照。

- `orderCount`：全部订单数
- `pendingCheckInCount`：当前 `bookingStatus = CONFIRMED` 的订单数
- `refundedOrderCount`：当前 `paymentStatus = REFUNDED` 的订单数
- `revenueAmount`：当前 `paymentStatus = PAID / PARTIALLY_REFUNDED` 的订单总金额汇总

**响应**
```json
{
  "orderCount": 3,
  "pendingCheckInCount": 2,
  "refundedOrderCount": 1,
  "revenueAmount": 976
}
```
