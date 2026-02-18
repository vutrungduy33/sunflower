# 小程序前端一期 MVP 说明（微信原生框架）

> 更新时间：2026-02-18
> 范围基线：`docs/PRD.md` + `docs/IA.md` + `docs/Backlog.md`（M1：S1-S6）

## 1. 目标与范围

一期 MVP 聚焦“可用闭环”，覆盖以下能力：
- 微信登录（`wx.login + code2session`，dev/test 支持 mock）
- 用户资料与手机号绑定
- 房型列表/详情/价格日历
- 订单创建/支付（MVP 模拟）
- 订单中心（查看/支付/取消/改期/退款）
- 首页基础内容与服务入口
- 地图 POI 浏览、发现内容浏览

说明：一期为前端业务骨架，页面层已切换到真实后端 API；`mock/store` 作为历史数据与回归参考保留。

## 2. 工程落地结构

小程序工程路径：`/Users/chenyao/dev/miniapp/sunflower/sunflower-miniapp`

新增目录：
- `pages/mvp/*`：一期业务页面
- `components/mvp-tabbar`：底部 5 导航组件
- `utils/mvp/*`：前端数据层（api / tracker 为当前使用；mock / store 为历史保留）

## 3. 页面路由清单（已实现）

| 页面 | 路由 | 状态 | 说明 |
|---|---|---|---|
| 首页 | `pages/mvp/home/index` | 已完成 | Banner、服务入口、推荐房型、会员权益 |
| 预订 | `pages/mvp/booking/index` | 已完成 | 入住退房选择、关键词检索、房型列表 |
| 地图 | `pages/mvp/map/index` | 已完成 | POI 列表 + 地图 marker + 导航 |
| 发现 | `pages/mvp/discover/index` | 已完成 | 游记/攻略内容浏览 |
| 我的 | `pages/mvp/mine/index` | 已完成 | 用户资料、手机号绑定、订单统计 |
| 房型详情 | `pages/mvp/room-detail/index` | 已完成 | 图文详情、价格日历、规则、下单入口 |
| 订单填写 | `pages/mvp/order-create/index` | 已完成 | 入住信息填写、创建订单、支付确认 |
| 订单中心 | `pages/mvp/order-list/index` | 已完成 | 订单筛选、支付、取消、改期、退款 |

## 4. 业务流程（一期）

### 4.1 预订主链路
1. 首页/预订页进入房型详情
2. 选择入住退房日期
3. 填写入住人信息并提交订单
4. 触发模拟支付
5. 返回订单中心查看状态

### 4.2 用户资料链路
1. 进入“我的”页面
2. 维护昵称
3. 绑定手机号（11 位校验）
4. 通过 API 持久化更新并回显

### 4.3 售后链路（S6）
1. 订单中心对 `CONFIRMED/RESCHEDULED` 订单展示“改期/申请退款”入口
2. 改期支持顺延 1-3 天并调用 `POST /api/orders/{id}/reschedule`
3. 退款调用 `POST /api/orders/{id}/refund`
4. 成功后刷新列表并在筛选栏查看“已改期/已退款”

## 5. 前端数据层设计

- `utils/mvp/mock.js`
  - 房型、Banner、服务、POI、游记等 mock 数据
  - 房价日历生成逻辑（14 天）

- `utils/mvp/store.js`
  - 历史本地状态参考实现（非当前事实源）
  - 仅用于回归参考，不作为线上联调数据入口

- `utils/mvp/api.js`
  - 统一 API 层，页面不直接读写 storage
  - 2026-02-11 起已切换为真实后端 `wx.request` 调用

- `utils/mvp/tracker.js`
  - MVP 埋点记录：`wx_login_success`、`bind_phone_success`、`room_view`、`order_create`、`order_pay_success`、`order_reschedule_success`、`order_refund_success`

## 6. 与后端 API 映射（联调状态）

| 前端方法（当前） | 后端接口 | 状态 |
|---|---|---|
| `wechatLogin` | `POST /api/auth/wechat/login` | 已实现 |
| `postBindPhone` | `POST /api/auth/bind-phone` | 已实现 |
| `fetchProfile` / `patchProfile` | `GET/PATCH /api/users/me` | 已实现 |
| `fetchHomeData` | `GET /api/content/home` | 已实现 |
| `fetchRooms` | `GET /api/rooms` | 已实现 |
| `fetchRoomDetail` | `GET /api/rooms/{id}` + `GET /api/rooms/{id}/calendar` | 已实现 |
| `postCreateOrder` | `POST /api/orders` | 已实现 |
| `postPayOrder` | `POST /api/orders/{id}/pay` | 已实现 |
| `fetchOrders` | `GET /api/orders` | 已实现 |
| `postCancelOrder` | `POST /api/orders/{id}/cancel` | 已实现 |
| `postRescheduleOrder` | `POST /api/orders/{id}/reschedule` | 已实现 |
| `postRefundOrder` | `POST /api/orders/{id}/refund` | 已实现 |
| `fetchPoiList` | `GET /api/poi` | 已实现 |
| `fetchTravelNotes` | `GET /api/posts` | 已实现 |

## 7. 联调切换结果（已完成）

`utils/mvp/api.js` 已完成 mock -> real 切换：
- 保持页面层方法签名不变
- 使用 `wx.request` 对接 `sunflower-backend`
- `mock/store` 不再作为事实源

当前联调配置：
- 默认后端地址：`https://8.155.148.126`
- 支持 `SUNFLOWER_API_BASE_URL` 动态覆盖
- 后端 M1 已切换为数据库持久化事实源（S1-S6 完成）

## 8. 当前边界与下阶段

一期未覆盖（已在 PRD/P1）：
- 餐饮商品点单完整链路
- 接驳/猪槽船服务下单
- 游记发布与审核
- 优惠券与会员权益核销
- 真正微信支付与退款

二期建议优先：
1. 完成管理端后端 API（S7/S8）并提供运营能力
2. 推进管理后台 Web 工程与页面交付（S9-S13）
3. 接入真实微信支付回调与退款对账能力
4. 补齐服务订单与会员权益闭环
