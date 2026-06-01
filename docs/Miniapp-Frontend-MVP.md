# 小程序前端一期 MVP 说明（微信原生框架）

> 更新时间：2026-06-02
> 当前口径：历史 stage/backlog 已归档；本文描述当前小程序 MVP 实现与仍需验证的边界。

## 1. 目标与范围

一期 MVP 聚焦“可用闭环”，覆盖以下能力：
- 微信登录（`wx.login + code2session`，dev/test 支持 mock）
- 用户资料完善、退出登录与手机号绑定
- 房型列表/详情/价格日历
- 订单创建/支付（真实微信支付链路；dev/test 可显式配置 mock）
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
| 登录页 | `pages/mvp/login/index` | 已完成 | 显式微信登录入口，支持退出登录后重新进入 |
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
4. 触发支付；生产配置下调用 `wx.requestPayment`，dev/test 可显式走 mock
5. 返回订单中心查看状态

### 4.2 用户资料链路
1. 登录页触发微信登录，首次用户回到首页后弹出资料完善卡片
2. 用户可选择头像、修改昵称，稍后也可在“我的”页继续完善
3. “我的”页支持更换头像、维护昵称、绑定手机号与退出登录
4. 下单页要求手机号已绑定，未绑定时先完成微信手机号授权

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
| `postLogout` | `POST /api/auth/logout` | 已实现 |
| `postBindPhone` | `POST /api/auth/bind-phone` | 已实现（主流程提交微信 `phoneCode`，开发态可兜底手输手机号） |
| `uploadProfileAvatar` | `POST /api/users/me/avatar` | 已实现 |
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
- 默认统一 API 入口来自 `sunflower-miniapp/utils/mvp/runtime-config.js` 的 `DEFAULT_API_BASE_URL`
- 支持 `SUNFLOWER_API_BASE_URL` 动态覆盖
- 真机扫码或预览版联调必须切换到 `HTTPS + 微信后台合法 request 域名`；裸 `http://IP` 仅适合开发态排查。
- 后端 M1 已切换为数据库持久化事实源（S1-S6 完成）
- 显式退出登录后，会进入 `pages/mvp/login/index` 重新拉起微信登录

## 8. 当前边界与下阶段

一期未覆盖（已在 PRD/P1）：
- 餐饮商品点单完整链路
- 接驳/猪槽船服务下单
- 游记发布与审核
- 优惠券与会员权益核销

已实现但仍需生产/真机验证：
- 真实微信登录与手机号授权需要在 WeChat DevTools/预览版中使用合法 HTTPS request 域名复核。
- 真实微信支付与退款链路已接入后端支付/退款流水和回调，但上线前仍需使用商户配置做小额实付/退款验证。

二期建议优先：
1. 补齐服务订单与会员权益闭环
2. 增加小程序主链路可重复验收记录
3. 完成 HTTPS 合法域名、微信审核和支付/退款生产 smoke
