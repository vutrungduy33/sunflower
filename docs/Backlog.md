# Stage Backlog（V1）

> 更新时间：2026-03-13
> 执行基线：`docs/Agent-Stage-Plan.md`
> 规则：每个 Stage 必须在一次与 Agent 的对话中完成开发与测试。
> 守卫命令：`make stage-pre STAGE=Sx` / `make stage-post STAGE=Sx`
> DoD：`docs/Definition-of-Done.md`
> Git 规范：`codex/s<stage>-<slug>` + commit 前缀 `[Sx]`
> 数据迁移同步：若变更命中 `db/migration` 或 `persistence`，需同步更新 `scripts/sql/mvp_demo_seed.sql`（由 `stage_guard post` 强校验）。

## 状态看板

- [x] S0 目标重确认与文档分期
- [x] S1 数据库与迁移底座（含 2026-02-12 Flyway MySQL hotfix、2026-02-13 部署演示数据自动入库脚本）
- [x] S2 房型模块落库（替换 RoomService 硬编码）
- [x] S3 用户与认证落库（替换 User/Auth 硬编码，含 2026-02-14 mock 固定 OpenID 改为显式开启热修）
- [x] S4 订单落库与事务化
- [x] S5 小程序联调收口（鉴权与错误兜底，含订单页返回导航补齐、2026-03-11 “我的”页与同类页面渲染空值兼容热修）
- [x] S6 订单改期与退款（小程序 + 后端，含 2026-02-18 M1 集成测试验收、首页登录态复用修复、改期锁顺序稳定化）
- [x] S7 管理端后端 API（房型/价格/库存）
- [x] S8 管理端后端 API（订单与经营概览）
- [x] S9 管理后台工程初始化（Web，TDesign React + Vite）
- [x] S10 管理后台登录与权限骨架（2026-03-12：登录页、Token 鉴权守卫与基础布局完成）
- [x] S11 管理后台页面（房型管理，2026-03-13：补充新增代码统一规范文档入口）
- [x] S12 管理后台页面（价格日历与库存，2026-03-13：价格日历查询、按日期区间批量更新价格/库存、发布反馈与前端测试完成；2026-03-13：升级为可点击日历卡片、快捷区间与窗口切换交互；2026-03-13：重构为可选择月份的月历视图，按周一到周日 7 列排列并优化尺寸布局）
- [x] S13 管理后台页面（订单与售后，2026-03-13：订单列表筛选、详情抽屉、经营概览卡片与改期/退款处理页完成）
- [x] S14 联调收口、CI 门禁与发布验收（2026-02-18：后端部署切换为 GHCR 预构建镜像发布；2026-03-12：补齐 Web 管理端 CI/CD 与 ECS 自动部署；2026-03-12：公网入口收敛为宿主机 Nginx，移除容器 edge-gateway；2026-03-12：发布构建切换阿里云 Maven 镜像并增加依赖预热层；2026-03-12：admin-only 部署改为 `--no-deps`，避免回退构建 backend；2026-03-13：deploy workflow 拆分 detect/build jobs、checkout 改为浅拉取与 sparse checkout、backend/admin GHA cache scope 隔离，GitHub-hosted backend 构建默认回到 Maven Central；2026-03-13：补齐正式联调验收清单与发布/回滚 Runbook，并纳入 PR 门禁与 Stage Guard）
- [x] S15 订单状态机重构（即时确认 + 售后子状态，2026-03-13：订单分层状态模型、售后申请表、审批/入住/离店/失约接口、小程序与管理端联调、API 文档与回归测试完成）

## 里程碑映射

- M1：S1-S6
- M2：S7-S13
- M3：S14

## 当前优先执行

1. 待确认下一 Stage 范围（建议优先：真实支付/退款链路或生产发布阻塞项）
