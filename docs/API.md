# 接口清单（REST）

> 更新时间：2026-02-13  
> 说明：以下区分“已实现（MVP 一期）”与“规划中（后续）”。

## 1. 已实现（MVP 一期）

### 1.1 健康检查
- `GET /api/health`：服务健康状态

### 1.2 认证与用户
- `POST /api/auth/wechat/login`：微信登录（签名 token，内含 userId 与过期时间）
- `POST /api/auth/bind-phone`：绑定手机号
- `GET /api/users/me`：获取当前用户信息
- `PATCH /api/users/me`：更新用户资料

说明：当前用户相关接口（`/api/auth/bind-phone`、`/api/users/me`、`/api/orders*`）要求携带 `Authorization: Bearer <token>`；未携带或 token 无效时返回 `40100`。

### 1.3 首页与内容
- `GET /api/content/home`：首页聚合数据（banner/服务/推荐房型/会员权益）
- `GET /api/poi`：景点/服务点 POI 列表
- `GET /api/posts`：游记列表（只读）

### 1.4 房型与房态
- `GET /api/rooms`：房型列表（支持 `checkInDate`、`keyword`）
- `GET /api/rooms/{id}`：房型详情（含 14 天价格日历）
- `GET /api/rooms/{id}/calendar`：价格与库存日历（支持 `startDate`、`days`）

### 1.5 住宿订单
- `POST /api/orders`：创建订单
- `GET /api/orders`：当前用户订单列表
- `GET /api/orders/{id}`：订单详情
- `POST /api/orders/{id}/pay`：模拟支付
- `POST /api/orders/{id}/cancel`：取消订单

## 2. 规划中（后续迭代）

### 2.1 房型后台管理
- `POST /api/admin/rooms`：新增房型（后台）
- `PATCH /api/admin/rooms/{id}`：编辑房型
- `POST /api/admin/room-inventory`：批量设置库存
- `POST /api/admin/room-prices`：批量设置价格

### 2.2 住宿订单扩展
- `POST /api/orders/{id}/reschedule`：改期申请
- `POST /api/orders/{id}/refund`：退款申请

### 2.3 餐饮/商品
- `GET /api/products`：商品列表
- `GET /api/products/{id}`：商品详情
- `POST /api/food-orders`：创建餐饮订单
- `GET /api/food-orders`：用户餐饮订单列表
- `PATCH /api/admin/products/{id}`：商品管理（后台）

### 2.4 服务预订（接驳/猪槽船）
- `GET /api/services`：服务列表
- `POST /api/service-orders`：服务下单
- `GET /api/service-orders`：用户服务订单
- `PATCH /api/admin/service-orders/{id}`：确认/取消（后台）

### 2.5 内容与社区（扩展）
- `GET /api/poi/{id}`：POI 详情
- `POST /api/posts`：发布游记
- `GET /api/reviews`：评论列表
- `POST /api/reviews`：发布评论
- `POST /api/admin/posts/{id}/review`：内容审核（后台）

### 2.6 营销与优惠券
- `GET /api/coupons`：可领取优惠券
- `POST /api/coupons/{id}/claim`：领取优惠券
- `POST /api/orders/{id}/apply-coupon`：订单使用优惠券
- `POST /api/admin/coupons`：创建优惠券（后台）

### 2.7 报表与对账（后台）
- `GET /api/admin/reports/summary`：经营概览
- `GET /api/admin/reports/orders`：订单报表
- `GET /api/admin/reports/payments`：支付对账

### 2.8 管理与权限
- `GET /api/admin/users`：后台用户
- `POST /api/admin/roles`：角色与权限
- `PATCH /api/admin/settings`：系统配置
