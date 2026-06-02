# 接口清单（REST）

> 更新时间：2026-04-08
> 说明：以下区分“已实现（MVP 一期）”与“规划中（后续）”。

## 1. 已实现（MVP 一期）

### 1.1 健康检查
- `GET /api/health`：服务健康状态

### 1.2 认证与用户
- `POST /api/auth/wechat/login`：微信登录（小程序先 `wx.login` 获取 code，后端通过微信 `jscode2session` 换取 openid，再返回签名 token）
- `POST /api/auth/logout`：退出登录（服务端失效当前用户 token 版本）
- `POST /api/auth/bind-phone`：绑定手机号（主流程消费微信 `getPhoneNumber` 动态 `code`；开发/测试环境可显式开启手输手机号兜底）
- `GET /api/users/me`：获取当前用户信息
- `PATCH /api/users/me`：更新用户资料
- `POST /api/users/me/avatar`：上传并更新当前用户头像

说明：当前用户相关接口（`/api/auth/logout`、`/api/auth/bind-phone`、`/api/users/me`、`/api/orders*`）要求携带 `Authorization: Bearer <token>`；未携带或 token 无效时返回 `40100`。
微信认证说明：
- 默认配置下，小程序登录采用真实微信认证；`prod` 环境若缺失 `WECHAT_APP_ID/WECHAT_APP_SECRET` 会启动失败，不会回退到 mock。
- 登录响应会返回 `isNewUser` 与扩展后的 `profile`，供小程序决定是否展示首次资料完善卡片。
- 小程序手机号绑定主流程为 `getPhoneNumber -> /api/auth/bind-phone(phoneCode)`；手动手机号绑定仅在后端显式开启 `WECHAT_MANUAL_PHONE_BIND_ENABLED=true` 时可用。
- 当前 profile 返回包含 `avatarUrl`、`needsProfileCompletion`；后者在头像缺失或昵称仍为默认值时为 `true`，用于提醒用户继续完善资料。
- 头像文件经 backend 保存后通过 `/api/media/avatars/**` 对外暴露，仍沿用统一 `/api` 公网入口。
管理端说明：当前管理接口（`/api/admin/rooms*`、`/api/admin/room-prices`、`/api/admin/room-inventory`、`/api/admin/orders*`、`/api/admin/reports/summary`）与账号接口要求携带 `Authorization: Bearer <token>`；未携带时返回“请先登录管理端”，token 无效时返回“管理端登录态无效”。
- `POST /api/admin/auth/sms-code`：发送管理端短信验证码（`ACTIVATE` 首次激活，`RESET_PASSWORD` 重置密码）
- `POST /api/admin/auth/activate`：允许白名单手机号首次激活后台账号并设置密码
- `POST /api/admin/auth/login`：手机号 + 密码登录管理端
- `POST /api/admin/auth/reset-password`：短信验证码重置密码，成功后直接返回新登录态
- `POST /api/admin/auth/logout`：退出当前管理端登录态
- `GET /api/admin/account/me`：获取当前后台账号资料
- `POST /api/admin/account/change-password`：已登录后台账号修改密码，成功后直接返回新登录态

管理端认证补充说明：
- S17 起管理端仍沿用 `Authorization: Bearer <token>`，但 token 已从静态 `app.admin.auth.token` 切换为后台签名会话 token，载荷包含 `accountId`、`role`、`credentialVersion`、`expiresAt`；现有管理业务接口路径与返回结构保持不变，旧静态 token 已废弃。
- 当前角色模型仅收口为 `ADMIN` / `OPERATOR`；现有房型、价格库存、订单、经营概览接口均允许 `ADMIN/OPERATOR` 访问，账号自助接口面向任意已登录后台账号。
- 首次激活仅允许环境变量 `ADMIN_ACTIVATION_ALLOWLIST=手机号:角色,手机号:角色` 中的手机号，不支持任意自注册。
- 管理端密码规则：8-32 位、必须同时包含字母和数字、不能包含空格。
- 短信验证码默认规则：6 位、固定 5 分钟有效、60 秒重发冷却、每手机号 1 小时最多 5 次/24 小时最多 10 次、单验证码最多 5 次校验；连续 5 次密码错误锁定 15 分钟。
- `logout`、`reset-password`、`change-password` 成功后都会通过递增 `credentialVersion` 使旧 token 失效。
- 短信服务默认走腾讯云短信：`TENCENT_SMS_SECRET_ID`、`TENCENT_SMS_SECRET_KEY`、`TENCENT_SMS_SDK_APP_ID`、`TENCENT_SMS_SIGN_NAME`、`TENCENT_SMS_TEMPLATE_ID_ACTIVATE`、`TENCENT_SMS_TEMPLATE_ID_RESET_PASSWORD` 为必填；`test` 环境使用 fake provider，`dev/prod` 缺少配置时启动失败，不回退 mock。

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
- `POST /api/orders/{id}/pay`：创建支付单并返回小程序调起支付参数（开发/测试环境可显式走 mock）
- `POST /api/orders/{id}/pay/confirm`：确认支付结果（开发态 mock 直返成功，正式链路主动查单兜底）
- `POST /api/orders/{id}/cancel`：取消未支付订单
- `POST /api/orders/{id}/reschedule`：提交改期申请
- `POST /api/orders/{id}/refund`：提交退款申请
- `POST /api/payments/wechat/transactions/notify`：微信支付回调
- `POST /api/payments/wechat/refunds/notify`：微信退款回调

补充说明：
- 订单返回兼容字段 `status/statusLabel`，同时新增 `bookingStatus/paymentStatus/paymentMode/paymentRecordStatus/paymentRecordNo/transactionId/latestRefund*/latestAfterSale*`
- 兼容状态 `status` 支持：`PENDING_PAYMENT` / `CONFIRMED` / `CHECKED_IN` / `RESCHEDULED` / `REFUND_PENDING` / `REFUNDED` / `COMPLETED` / `CANCELLED` / `NO_SHOW`
- 当前订单主状态采用：`PENDING_PAYMENT` / `CONFIRMED` / `CHECKED_IN` / `CHECKED_OUT` / `CANCELLED` / `NO_SHOW`
- 支付状态采用：`UNPAID` / `PAID` / `REFUND_PENDING` / `REFUNDED` / `PARTIALLY_REFUNDED`
- 售后申请状态采用：`REQUESTED` / `APPROVED` / `REJECTED` / `WITHDRAWN`
- 退款审批通过后，订单会先进入 `bookingStatus = CANCELLED` + `paymentStatus = REFUND_PENDING`；仅在微信退款回调成功后才转为 `paymentStatus = REFUNDED`
- 支付/退款流水字段可用于追踪：`paymentRecordNo = outTradeNo`、`transactionId = 微信支付单号`、`latestRefundRecordId/latestRefundStatus/latestRefundFailure* = 最近一笔退款流水`

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
- `POST /api/admin/orders/{id}/refund`：后台直接发起退款（兼容保留；返回退款处理中态，最终结果以微信回调为准）
- `POST /api/admin/orders/{id}/refunds/{refundId}/retry`：重试失败/异常/关闭的退款流水
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
