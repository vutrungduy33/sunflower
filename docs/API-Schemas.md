# 接口字段级别定义（请求/响应示例）

> 更新时间：2026-02-11  
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

## 1) 认证与用户

### `POST /api/auth/wechat/login`
**请求**
```json
{
  "code": "mvp_code"
}
```
**响应**
```json
{
  "token": "mock_token_1739260800000",
  "openId": "mock_openid_mvp_code",
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
  "createdAt": "2026-02-12T10:00:00+08:00",
  "paidAt": ""
}
```

### `POST /api/orders/{id}/pay`
**响应**
```json
{
  "id": "order_1739260800000_123",
  "status": "CONFIRMED",
  "statusLabel": "待入住"
}
```

### `POST /api/orders/{id}/cancel`
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
  "statusLabel": "已取消"
}
```

### `GET /api/orders`
**响应**
```json
[
  {
    "id": "order_1739260800000_123",
    "orderNo": "SF202602121234",
    "status": "CANCELLED",
    "statusLabel": "已取消"
  }
]
```

### `GET /api/orders/{id}`
**响应**
```json
{
  "id": "order_1739260800000_123",
  "orderNo": "SF202602121234",
  "status": "CANCELLED",
  "statusLabel": "已取消"
}
```
