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
  - 统一 API 层，页面不直接读写 storage
  - 2026-02-11 起已切换为真实后端 `wx.request` 调用

- `utils/mvp/tracker.js`
  - MVP 埋点记录：`wx_login_success`、`bind_phone_success`、`room_view`、`order_create`、`order_pay_success`

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
| `fetchPoiList` | `GET /api/poi` | 已实现 |
| `fetchTravelNotes` | `GET /api/posts` | 已实现 |

## 7. 联调切换结果（已完成）

`utils/mvp/api.js` 已完成 mock -> real 切换：
- 保持页面层方法签名不变
- 使用 `wx.request` 对接 `sunflower-backend`
- `mock/store` 不再作为事实源

当前联调配置：
- 默认后端地址：`http://8.155.148.126`（Nginx 80 反向代理到后端 8080）
- 支持 `SUNFLOWER_API_BASE_URL` 动态覆盖
- 后端一期接口为内存种子数据模式（服务重启会重置）

## 8. 当前边界与下阶段

一期未覆盖（已在 PRD/P1）：
- 餐饮商品点单完整链路
- 接驳/猪槽船服务下单
- 游记发布与审核
- 优惠券与会员权益核销
- 真正微信支付与退款

二期建议优先：
1. 将后端联调数据从内存种子切换到 MySQL 持久化
2. 接入微信支付与退款状态机
3. 完成服务订单（接驳/猪槽船）
4. 补齐优惠券与会员权益
