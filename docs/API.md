# 接口清单（REST）

> 更新时间：2026-03-19
> 说明：以下区分“已实现（MVP 一期）”与“规划中（后续）”。

## 1. 已实现（MVP 一期）

### 1.1 健康检查
- `GET /api/health`：服务健康状态

### 1.2 认证与用户
- `POST /api/auth/wechat/login`：微信登录（小程序先 `wx.login` 获取 code，后端通过微信 `jscode2session` 换取 openid，再返回签名 token）
- `POST /api/auth/bind-phone`：绑定手机号（主流程消费微信 `getPhoneNumber` 动态 `code`；开发/测试环境可显式开启手输手机号兜底）
- `GET /api/users/me`：获取当前用户信息
- `PATCH /api/users/me`：更新用户资料

说明：当前用户相关接口（`/api/auth/bind-phone`、`/api/users/me`、`/api/orders*`）要求携带 `Authorization: Bearer <token>`；未携带或 token 无效时返回 `40100`。
微信认证说明：
- 默认配置下，小程序登录采用真实微信认证；`prod` 环境若缺失 `WECHAT_APP_ID/WECHAT_APP_SECRET` 会启动失败，不会回退到 mock。
- 小程序手机号绑定主流程为 `getPhoneNumber -> /api/auth/bind-phone(phoneCode)`；手动手机号绑定仅在后端显式开启 `WECHAT_MANUAL_PHONE_BIND_ENABLED=true` 时可用。
管理端说明：当前管理接口（`/api/admin/rooms*`、`/api/admin/room-prices`、`/api/admin/room-inventory`、`/api/admin/orders*`、`/api/admin/reports/summary`）要求携带 `Authorization: Bearer <admin-token>`；未携带时返回“请先登录管理端”，token 无效时返回“管理端登录态无效”。

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
- `POST /api/orders/{id}/cancel`：取消未支付订单
- `POST /api/orders/{id}/reschedule`：提交改期申请
- `POST /api/orders/{id}/refund`：提交退款申请

补充说明：
- 订单返回兼容字段 `status/statusLabel`，同时新增 `bookingStatus/paymentStatus/latestAfterSale*`
- 当前订单主状态采用：`PENDING_PAYMENT` / `CONFIRMED` / `CHECKED_IN` / `CHECKED_OUT` / `CANCELLED` / `NO_SHOW`
- 支付状态采用：`UNPAID` / `PAID` / `REFUND_PENDING` / `REFUNDED` / `PARTIALLY_REFUNDED`
- 售后申请状态采用：`REQUESTED` / `APPROVED` / `REJECTED` / `WITHDRAWN`

### 1.6 管理端房型与房态
- `GET /api/admin/rooms`：后台房型列表（返回全部房型，含上架/下架状态）
- `POST /api/admin/rooms`：新增房型（后台）
- `PATCH /api/admin/rooms/{id}`：编辑房型（支持部分字段更新）
- `POST /api/admin/room-inventory`：批量设置总库存，并自动保留已锁定库存
- `POST /api/admin/room-prices`：批量设置价格

### 1.7 管理端订单与经营概览
- `GET /api/admin/orders`：后台订单列表（支持 `status`、`keyword`、`checkInStartDate`、`checkInEndDate` 筛选）
- `GET /api/admin/orders/{id}`：后台订单详情
- `POST /api/admin/orders/{id}/reschedule`：后台直接改期处理（兼容保留）
- `POST /api/admin/orders/{id}/refund`：后台直接退款处理（兼容保留）
- `POST /api/admin/orders/{id}/after-sale/{requestId}/approve`：同意售后申请
- `POST /api/admin/orders/{id}/after-sale/{requestId}/reject`：拒绝售后申请
- `POST /api/admin/orders/{id}/check-in`：办理入住
- `POST /api/admin/orders/{id}/check-out`：办理离店
- `POST /api/admin/orders/{id}/no-show`：标记失约
- `GET /api/admin/reports/summary`：经营概览（订单数、待入住、退款单、成交额）

## 2. 规划中（后续迭代）

### 2.1 餐饮/商品
- `GET /api/products`：商品列表
- `GET /api/products/{id}`：商品详情
- `POST /api/food-orders`：创建餐饮订单
- `GET /api/food-orders`：用户餐饮订单列表
- `PATCH /api/admin/products/{id}`：商品管理（后台）

### 2.2 服务预订（接驳/猪槽船）
- `GET /api/services`：服务列表
- `POST /api/service-orders`：服务下单
- `GET /api/service-orders`：用户服务订单
- `PATCH /api/admin/service-orders/{id}`：确认/取消（后台）

### 2.3 内容与社区（扩展）
- `GET /api/poi/{id}`：POI 详情
- `POST /api/posts`：发布游记
- `GET /api/reviews`：评论列表
- `POST /api/reviews`：发布评论
- `POST /api/admin/posts/{id}/review`：内容审核（后台）

### 2.4 营销与优惠券
- `GET /api/coupons`：可领取优惠券
- `POST /api/coupons/{id}/claim`：领取优惠券
- `POST /api/orders/{id}/apply-coupon`：订单使用优惠券
- `POST /api/admin/coupons`：创建优惠券（后台）

### 2.5 报表与对账（后台）
- `GET /api/admin/reports/orders`：订单报表
- `GET /api/admin/reports/payments`：支付对账

### 2.6 管理与权限
- `GET /api/admin/users`：后台用户
- `POST /api/admin/roles`：角色与权限
- `PATCH /api/admin/settings`：系统配置
