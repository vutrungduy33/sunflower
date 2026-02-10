# 接口字段级别定义（请求/响应示例）

> 说明：示例为 MVP 核心接口的字段级别定义，实际字段可按业务扩展。  
> 统一错误格式：`{ "code": "ERR_xxx", "message": "说明", "requestId": "uuid" }`

## 1) 登录与用户

### `POST /api/auth/wechat/login`
**请求**
```json
{
  "code": "wx_login_code",
  "inviteCode": "optional"
}
```
**响应**
```json
{
  "token": "jwt_or_session",
  "user": {
    "id": 1001,
    "nickname": "住客",
    "phone": null,
    "avatar": "https://..."
  }
}
```

### `POST /api/auth/bind-phone`
**请求**
```json
{
  "phone": "13800000000",
  "smsCode": "123456"
}
```
**响应**
```json
{ "ok": true }
```

## 2) 房型与房态

### `GET /api/rooms`
**响应**
```json
[
  {
    "id": 11,
    "name": "湖景大床",
    "viewType": "lake",
    "capacity": 2,
    "basePrice": 399,
    "baseInventory": 2
  }
]
```

### `GET /api/rooms/{id}/calendar`
**响应**
```json
{
  "roomId": 11,
  "calendar": [
    { "date": "2026-02-01", "price": 399, "available": 3 },
    { "date": "2026-02-02", "price": 459, "available": 0 }
  ]
}
```

## 3) 住宿订单

### `POST /api/orders`
**请求**
```json
{
  "roomId": 11,
  "checkinDate": "2026-02-01",
  "checkoutDate": "2026-02-03",
  "guests": 2,
  "contactName": "张三",
  "contactPhone": "13800000000",
  "arriveTime": "18:00",
  "note": "需要婴儿床"
}
```
**响应**
```json
{
  "id": 90001,
  "roomId": 11,
  "roomName": "湖景大床",
  "checkinDate": "2026-02-01",
  "checkoutDate": "2026-02-03",
  "guests": 2,
  "contactName": "张三",
  "contactPhone": "13800000000",
  "arriveTime": "18:00",
  "note": "需要婴儿床",
  "status": "pending_payment",
  "totalAmount": 858,
  "createdAt": "2026-01-30T18:30:00",
  "source": "direct"
}
```

### `POST /api/orders/{id}/pay`
**响应**
```json
{
  "orderId": 90001,
  "status": "paid",
  "amount": 858
}
```

### `POST /api/orders/{id}/cancel`
**请求**
```json
{ "reason": "行程有变" }
```
**响应**
```json
{ "status": "cancelled" }
```

### `POST /api/orders/{id}/refund`
**响应**
```json
{ "status": "refund_pending" }
```

## 4) 餐饮/商品

### `GET /api/products`
**响应**
```json
[
  {
    "id": 501,
    "name": "柴火鸡",
    "price": 128,
    "stock": 30,
    "category": "特色餐"
  }
]
```

### `POST /api/food-orders`
**请求**
```json
{
  "items": [
    { "productId": 501, "qty": 1 }
  ],
  "deliveryType": "room",
  "roomNo": "201"
}
```
**响应**
```json
{ "orderId": 80001, "status": "pending_payment" }
```

## 5) 服务预订（接驳/猪槽船）

### `POST /api/service-orders`
**请求**
```json
{
  "serviceType": "pickup",
  "date": "2026-02-01",
  "time": "15:30",
  "people": 3,
  "note": "丽江机场到达"
}
```
**响应**
```json
{ "orderId": 81001, "status": "pending_confirm" }
```

## 6) 内容与社区

### `POST /api/posts`
**请求**
```json
{
  "title": "泸沽湖日出",
  "content": "清晨湖面很安静",
  "images": ["https://.../1.jpg"]
}
```
**响应**
```json
{ "postId": 30001, "status": "pending_review" }
```

### `POST /api/reviews`
**请求**
```json
{
  "targetType": "poi",
  "targetId": 2001,
  "score": 5,
  "content": "风景很好"
}
```
**响应**
```json
{ "reviewId": 40001 }
```

## 7) 后台订单状态流转

### `POST /api/admin/orders/{id}/checkin`
**响应**
```json
{
  "id": 90001,
  "status": "checked_in"
}
```

### `POST /api/admin/orders/{id}/complete`
**响应**
```json
{
  "id": 90001,
  "status": "completed"
}
```
