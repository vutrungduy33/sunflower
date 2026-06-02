# M1（S1-S6）集成测试计划与执行记录

> 更新时间：2026-02-18  
> 里程碑范围：M1（S1-S6）  
> Stage 锁定：S6（仅执行 M1 收口测试与文档一致性校验，不扩展 S7+ 开发）

## 1. 测试目标

1. 验证 M1 目标是否达成：后端核心链路已落库（MySQL/Flyway 语义）、小程序 P0 主链路可用、订单售后（改期/退款）可闭环。  
2. 形成可复用的集成测试回放清单：每条用例包含前置条件、步骤、预期结果。  
3. 验证需求文档与当前代码一致性，识别并修正文档偏差，确保执行进度与计划一致。

## 2. 需求追踪矩阵（M1）

| 需求ID | 需求描述 | 来源文档 | 代码/实现锚点 |
|---|---|---|---|
| M1-R1 | 迁移机制与核心表可自动创建 | `docs/Agent-Stage-Plan.md`（S1） | `sunflower-backend/src/main/resources/db/migration/common/V1__create_core_tables.sql` |
| M1-R2 | 房型列表/详情/日历改为数据库事实源 | `docs/Agent-Stage-Plan.md`（S2） | `sunflower-backend/src/main/java/com/sunflower/backend/modules/room/RoomService.java` |
| M1-R3 | 登录/绑定手机号/用户资料改为数据库读写并强制鉴权 | `docs/Agent-Stage-Plan.md`（S3） | `sunflower-backend/src/main/java/com/sunflower/backend/modules/auth/AuthService.java`、`sunflower-backend/src/main/java/com/sunflower/backend/modules/user/UserService.java` |
| M1-R4 | 订单创建/支付/取消改为事务化持久化并保证库存一致性 | `docs/Agent-Stage-Plan.md`（S4） | `sunflower-backend/src/main/java/com/sunflower/backend/modules/order/OrderService.java` |
| M1-R5 | 小程序联调收口：登录态请求头、错误兜底、导航可回退 | `docs/Agent-Stage-Plan.md`（S5） | `sunflower-miniapp/utils/mvp/api.js`、`sunflower-miniapp/components/mvp-nav-actions/index.wxml` |
| M1-R6 | 改期/退款接口与订单状态机闭环 | `docs/Agent-Stage-Plan.md`（S6） | `sunflower-backend/src/main/java/com/sunflower/backend/modules/order/OrderController.java`、`sunflower-backend/src/main/java/com/sunflower/backend/modules/order/OrderStatus.java` |
| M1-R7 | M1 已实现接口文档需与代码一致 | `docs/API.md`、`docs/API-Schemas.md` | `sunflower-backend/src/main/java/com/sunflower/backend/modules/**/*Controller.java` |
| M1-R8 | M1 阶段状态需在 Backlog 可追踪 | `docs/Backlog.md` | `docs/Backlog.md` |

## 3. 测试环境与准入

- 后端：`sunflower-backend`（Spring Boot 2.7）  
- 测试 profile：`test`（H2 + Flyway `common,test` 迁移）  
- 小程序：`sunflower-miniapp`（微信原生 + TDesign）  
- 准入条件：
  1. `make stage-pre STAGE=S6` 通过  
  2. 工作区可编译  
  3. M1 文档（PRD/Stage/API）可访问

## 4. 测试用例（含步骤与预期）

### TC-M1-01 核心表迁移
- 覆盖需求：`M1-R1`
- 前置条件：`test` profile 可启动
- 测试步骤：
  1. 执行 `DatabaseMigrationIntegrationTests.shouldCreateCoreTablesViaFlyway`。
  2. 读取 Flyway 迁移后的 schema 表清单。
- 预期结果：
  1. 存在 `users/user_profiles/rooms/room_prices/room_inventory/orders`。
  2. 测试通过，返回成功状态。

### TC-M1-02 核心种子数据
- 覆盖需求：`M1-R1`
- 前置条件：同 TC-M1-01
- 测试步骤：
  1. 执行 `DatabaseMigrationIntegrationTests.shouldSeedTestDataForCoreModules`。
  2. 统计 `users/rooms/orders` 基础数据条数。
- 预期结果：
  1. 三张表计数均达到最小阈值（>=1/>=3/>=1）。
  2. 测试通过。

### TC-M1-03 登录-绑手机号-改资料链路
- 覆盖需求：`M1-R3`
- 前置条件：后端服务可处理 `/api/auth/*`、`/api/users/me`
- 测试步骤：
  1. 登录获取 token。  
  2. 携带 token 调用绑定手机号。  
  3. 调用 `PATCH /api/users/me` 更新昵称。  
  4. 调用 `GET /api/users/me` 复查。
- 预期结果：
  1. token 返回成功，`profile` 结构完整。  
  2. 手机号绑定成功，`isPhoneBound=true`。  
  3. 昵称更新成功并可读回。

### TC-M1-04 房型列表/详情/日历查询
- 覆盖需求：`M1-R2`
- 前置条件：房型、价格、库存种子存在
- 测试步骤：
  1. 调用 `GET /api/rooms?checkInDate=...&keyword=湖景`。  
  2. 调用 `GET /api/rooms/{id}`。  
  3. 调用 `GET /api/rooms/{id}/calendar?startDate=...&days=3`。
- 预期结果：
  1. 房型列表返回可用价格和库存。  
  2. 详情返回 14 天日历。  
  3. 日历接口返回指定天数。

### TC-M1-05 房型参数异常
- 覆盖需求：`M1-R2`
- 前置条件：无
- 测试步骤：
  1. 调用非法日期格式（如 `2026/02/12`）。  
  2. 调用非法 `days=0`。
- 预期结果：
  1. 返回 `400` 与业务错误码。  
  2. message 明确指出日期或范围错误。

### TC-M1-06 订单创建-支付-取消链路
- 覆盖需求：`M1-R4`
- 前置条件：已登录，目标日期有库存
- 测试步骤：
  1. `POST /api/orders` 创建订单。  
  2. `POST /api/orders/{id}/pay` 支付。  
  3. `POST /api/orders/{id}/cancel` 取消。  
  4. `GET /api/orders/{id}` 查询详情。
- 预期结果：
  1. 状态按 `PENDING_PAYMENT -> CONFIRMED -> CANCELLED` 流转。  
  2. 状态标签与状态一致。  
  3. 订单详情可查询。

### TC-M1-07 订单改期-退款闭环
- 覆盖需求：`M1-R6`
- 前置条件：已支付订单，原/新日期库存可用
- 测试步骤：
  1. 对 `CONFIRMED` 订单调用 `POST /reschedule`。  
  2. 校验新老日期库存变化。  
  3. 调用 `POST /refund`。  
  4. 再次校验库存回补与订单状态。
- 预期结果：
  1. 状态变为 `RESCHEDULED`，入住日期更新。  
  2. 旧日期库存释放，新日期库存锁定。  
  3. 退款后状态为 `REFUNDED` 且库存回补。

### TC-M1-08 非法退款状态拦截
- 覆盖需求：`M1-R6`
- 前置条件：订单状态为 `PENDING_PAYMENT`
- 测试步骤：
  1. 直接调用 `POST /api/orders/{id}/refund`。
- 预期结果：
  1. 返回 `409`。  
  2. message 为“当前订单状态不可退款”。

### TC-M1-09 库存不足与并发保护
- 覆盖需求：`M1-R4`
- 前置条件：将目标库存设置为 1
- 测试步骤：
  1. 场景 A：库存 0 时创建订单。  
  2. 场景 B：两个用户并发创建同房同日订单。
- 预期结果：
  1. 场景 A 返回 `409` 库存不足。  
  2. 场景 B 仅一单成功，另一单 `409`，库存锁定量正确。

### TC-M1-10 鉴权失效与参数非法
- 覆盖需求：`M1-R3`、`M1-R5`
- 前置条件：可构造非法 token/缺失 token
- 测试步骤：
  1. 不带 token 请求 `/api/users/me`、`/api/orders`。  
  2. 使用篡改 token 与旧 mock token 请求。  
  3. 提交非法登录 code、非法手机号、空昵称。
- 预期结果：
  1. 未登录返回 `40100`（请先登录/登录态无效）。  
  2. 非法参数返回 `40000/40001` 且 message 明确。

### TC-M1-11 小程序子页面导航守卫
- 覆盖需求：`M1-R5`
- 前置条件：可运行脚本守卫
- 测试步骤：
  1. 执行 `./scripts/check_mvp_subpage_nav.sh`。
- 预期结果：
  1. 所有非 tab 的 mvp 页面均包含 `<mvp-nav-actions>`。  
  2. 脚本输出 PASS。

### TC-M1-12 小程序订单中心售后入口（手工）
- 覆盖需求：`M1-R6`
- 前置条件：微信开发者工具可启动，存在 `CONFIRMED/RESCHEDULED` 订单
- 测试步骤：
  1. 进入“订单中心”页面。  
  2. 对可操作订单点击“改期”，选择顺延 1-3 天任一项。  
  3. 再点击“申请退款”并确认。  
 4. 切换筛选“已改期/已退款”。  
 5. 返回首页并再次进入“订单中心”。
- 预期结果：
  1. 改期后订单状态与日期更新。  
  2. 退款后状态更新为已退款。  
 3. 筛选结果与状态一致。  
 4. 重新进入首页不会触发用户切换，订单列表保持可见。
- 执行模板：`docs/M1-TC-M1-12-Manual-Checklist.md`

### TC-M1-13 文档与代码一致性核对
- 覆盖需求：`M1-R7`、`M1-R8`
- 前置条件：文档与代码可读取
- 测试步骤：
  1. 核对 `docs/API.md`、`docs/API-Schemas.md` 与 Controller/DTO。  
  2. 核对 `docs/Backlog.md` 与 Stage 报告状态。  
  3. 核对业务流程文档中的订单状态机与代码枚举。
- 预期结果：
  1. API 路径、字段、状态枚举与代码一致。  
  2. Backlog 与 Stage 报告状态对齐。  
  3. 发现偏差项已在本次文档修正中闭环。

## 5. 自动化执行记录（2026-02-18）

### 命令与结果

1. `cd sunflower-backend && mvn test -Dtest=DatabaseMigrationIntegrationTests,MvpApiIntegrationTests`  
- 结果：通过  
- 摘要：`Tests run: 16, Failures: 0, Errors: 0, Skipped: 0`

2. `./scripts/check_mvp_subpage_nav.sh`  
- 结果：通过  
- 摘要：`PASS: all non-tab mvp pages contain <mvp-nav-actions>`

## 6. 文档-代码一致性校验结论

| 文档 | 核对项 | 结论 | 处理 |
|---|---|---|---|
| `docs/API.md` | M1 已实现接口清单 | 一致 | 无需修正 |
| `docs/API-Schemas.md` | 订单状态/售后字段/鉴权语义 | 一致 | 无需修正 |
| `docs/Flows.md` | 订单状态枚举与售后流程 | 发现偏差 | 已修正为当前代码状态机 |
| `docs/Miniapp-Frontend-MVP.md` | 联调现状、订单中心能力、后端持久化状态 | 发现偏差 | 已修正为 M1 实际实现 |
| `docs/README.md` | 当前进展时间与 M1 状态 | 发现偏差 | 已修正为 2026-02-18 基线 |
| `docs/Backlog.md` | M1 阶段状态 | 一致 | 补充 M1 集成验收注记 |

## 7. QA 手工回放步骤（建议）

1. 后端启动后在小程序登录，完成一次“下单 -> 支付 -> 改期 -> 退款”完整链路。  
2. 在订单中心切换状态筛选，确认 `待支付/待入住/已改期/已退款/已取消` 的列表正确。  
3. 手动清理本地 token 后访问“我的/订单中心”，确认出现登录态失效提示。  
4. 在房型页输入非法日期参数（通过调试工具请求），确认返回 400 系列明确错误信息。  
5. 断网后打开 `首页/预订/我的/订单中心`，确认错误态与“重新加载”按钮可恢复。  
6. 恢复网络后重试，确认页面能恢复正常内容。

## 8. 退出准则与剩余风险

- 退出准则：
  1. 自动化集成测试通过。  
  2. 文档偏差项完成修正并可追踪。  
  3. 手工回放步骤可复现。

- 剩余风险：
  1. 本次未在真实微信支付网关执行退款回调验证（MVP 仍为模拟支付/退款语义）。  
  2. 高并发库存竞争仅覆盖基础并发场景，尚未进行压力测试级验证。
