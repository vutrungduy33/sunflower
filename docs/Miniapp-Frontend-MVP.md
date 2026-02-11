# 小程序前端一期 MVP 说明（微信原生框架）

> 更新时间：2026-02-11
> 范围基线：`docs/PRD.md` + `docs/IA.md` + `docs/Backlog.md` Sprint 1

## 1. 目标与范围

一期 MVP 聚焦“可用闭环”，覆盖以下能力：
- 微信登录（前端模拟）
- 用户资料与手机号绑定
- 房型列表/详情/价格日历
- 订单创建/支付（模拟）
- 订单中心（查看/支付/取消）
- 首页基础内容与服务入口
- 地图 POI 浏览、发现内容浏览

说明：一期为前端业务骨架，数据层使用本地 mock + storage，便于并行开发与后续接口联调。

## 2. 工程落地结构

小程序工程路径：`/Users/chenyao/dev/miniapp/sunflower/sunflower-miniapp`

新增目录：
- `pages/mvp/*`：一期业务页面
- `components/mvp-tabbar`：底部 5 导航组件
- `utils/mvp/*`：前端数据层（mock / store / api / tracker）

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
| 订单中心 | `pages/mvp/order-list/index` | 已完成 | 订单筛选、支付、取消 |

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
4. 写入本地用户资料并更新订单页默认手机号

## 5. 前端数据层设计

- `utils/mvp/mock.js`
  - 房型、Banner、服务、POI、游记等 mock 数据
  - 房价日历生成逻辑（14 天）

- `utils/mvp/store.js`
  - 基于 `wx.setStorageSync` 的本地状态持久化
  - 用户、订单读写
  - 订单创建/支付/取消状态流转

- `utils/mvp/api.js`
  - 统一“伪 API”层，页面不直接读写 storage
  - 便于后续无痛切换真实后端接口

- `utils/mvp/tracker.js`
  - MVP 埋点记录：`wx_login_success`、`bind_phone_success`、`room_view`、`order_create`、`order_pay_success`

## 6. 与后端 API 映射（联调目标）

| 前端方法（当前） | 目标后端接口（后续） |
|---|---|
| `wechatLogin` | `POST /api/auth/wechat/login` |
| `postBindPhone` | `POST /api/auth/bind-phone` |
| `fetchProfile` / `patchProfile` | `GET/PATCH /api/users/me` |
| `fetchRooms` | `GET /api/rooms` |
| `fetchRoomDetail` | `GET /api/rooms/{id}` + `GET /api/rooms/{id}/calendar` |
| `postCreateOrder` | `POST /api/orders` |
| `postPayOrder` | `POST /api/orders/{id}/pay` |
| `fetchOrders` | `GET /api/orders` |
| `postCancelOrder` | `POST /api/orders/{id}/cancel` |
| `fetchPoiList` | `GET /api/poi` |
| `fetchTravelNotes` | `GET /api/posts` |

## 7. 联调切换建议

当后端接口可用后，只需要在 `utils/mvp/api.js` 中替换实现：
- 保持方法签名不变
- 将本地 mock 改为 `wx.request`
- 保留 `store` 仅做轻量缓存（非事实源）

这样可避免页面层大面积改动。

## 8. 当前边界与下阶段

一期未覆盖（已在 PRD/P1）：
- 餐饮商品点单完整链路
- 接驳/猪槽船服务下单
- 游记发布与审核
- 优惠券与会员权益核销
- 真正微信支付与退款

二期建议优先：
1. 接后端真实登录/房型/订单接口
2. 接入微信支付与退款状态机
3. 完成服务订单（接驳/猪槽船）
4. 补齐优惠券与会员权益
