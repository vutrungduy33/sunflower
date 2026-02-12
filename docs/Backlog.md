# Stage Backlog（V1）

> 更新时间：2026-02-12  
> 执行基线：`docs/Agent-Stage-Plan.md`  
> 规则：每个 Stage 必须在一次与 Agent 的对话中完成开发与测试。
> 守卫命令：`make stage-pre STAGE=Sx` / `make stage-post STAGE=Sx`
> DoD：`docs/Definition-of-Done.md`
> Git 规范：`codex/s<stage>-<slug>` + commit 前缀 `[Sx]`

## 状态看板

- [x] S0 目标重确认与文档分期
- [x] S1 数据库与迁移底座
- [ ] S2 房型模块落库（替换 RoomService 硬编码）
- [ ] S3 用户与认证落库（替换 User/Auth 硬编码）
- [ ] S4 订单落库与事务化
- [ ] S5 小程序联调收口（鉴权与错误兜底）
- [ ] S6 订单改期与退款（小程序 + 后端）
- [ ] S7 管理端后端 API（房型/价格/库存）
- [ ] S8 管理端后端 API（订单与经营概览）
- [ ] S9 管理后台工程初始化（Web）
- [ ] S10 管理后台登录与权限骨架
- [ ] S11 管理后台页面（房型管理）
- [ ] S12 管理后台页面（价格日历与库存）
- [ ] S13 管理后台页面（订单与售后）
- [ ] S14 联调收口、CI 门禁与发布验收

## 里程碑映射

- M1：S1-S6
- M2：S7-S13
- M3：S14

## 当前优先执行

1. S1 数据库与迁移底座
2. S2 房型模块落库
3. S3 用户与认证落库
