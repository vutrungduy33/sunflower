# Stage Backlog（V1）

> 更新时间：2026-03-26
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
- [x] S14 联调收口、CI 门禁与发布验收（2026-02-18：后端部署切换为 GHCR 预构建镜像发布；2026-03-12：补齐 Web 管理端 CI/CD 与 ECS 自动部署；2026-03-12：公网入口收敛为宿主机 Nginx，移除容器 edge-gateway；2026-03-12：发布构建切换阿里云 Maven 镜像并增加依赖预热层；2026-03-12：admin-only 部署改为 `--no-deps`，避免回退构建 backend；2026-03-13：deploy workflow 拆分 detect/build jobs、checkout 改为浅拉取与 sparse checkout、backend/admin GHA cache scope 隔离，GitHub-hosted backend 构建默认回到 Maven Central；2026-03-13：补齐正式联调验收清单与发布/回滚 Runbook，并纳入 PR 门禁与 Stage Guard；2026-03-26：补齐小程序 `project.config.json` 占位 appid、PR guard 与 GitHub secret scanning 路径忽略，避免真实微信 AppID 再次入库）
- [x] S15 订单状态机重构（即时确认 + 售后子状态，2026-03-13：订单分层状态模型、售后申请表、审批/入住/离店/失约接口、小程序与管理端联调、API 文档与回归测试完成）
- [x] S16 小程序真实微信认证与手机号绑定（2026-03-19：默认关闭生产 mock 登录、接入微信手机号动态 code 绑定、补齐 access token/手机号调用客户端、开发态手动手机号兜底与 API/部署文档同步）
- [x] S17 管理端真实账号登录（手机号 + 密码 + 短信重置，2026-03-24：真实后台账号、短信激活/重置、会话 token、管理端 Web 登录恢复与修改密码完成；2026-03-26：补齐腾讯云短信回执状态校验，避免模板/签名失败时仍被误记为发送成功；2026-03-26：短信模板参数收口为单验证码变量，并统一固定 5 分钟有效）
- [ ] S18 真实微信支付/退款与资金流水
- [x] S19 生产入口与微信发布阻塞项收口（2026-03-24：prod 配置切换到 ECS 本地 `.env.prod`，新增 `.release.env`、bootstrap/常规发布拆分、宿主机 Nginx HTTPS 入口模板、workflow_dispatch 回滚与小程序默认 HTTPS 域名配置位；2026-03-26：修复 deploy workflow 上传目录与远端解包假设不一致导致的发布失败；2026-03-26：为 `DEPLOY_PATH=~/...` 场景补齐路径归一化与目录诊断，避免 scp 上传落在家目录而 SSH 步骤进入字面量 `~/...` 目录；2026-03-26：将 deploy path 归一化改写为 ssh-action `script_stop` 可解析的单行命令，修复函数定义被 action 注入脚本打断；2026-03-26：移除 deploy SSH 收尾分支中的 `else`，避免 `script_stop` 守卫把 `DEPLOY_TARGET!=bootstrap` 的正常条件结果误判为失败；2026-03-26：运行时强制以 `.release.env` 为准，修复 `.env.prod` 中样板 `RELEASE_ENV_FILE=.env.empty` 导致镜像发布信息失效并意外回退本地 build；2026-03-26：移除 compose 顶层废弃 `version` 并增强发布诊断，修复 `.release.env` 被 ssh-action 守卫污染、在 backend 拉起前预检 MySQL 应用账号可用性，并在服务不健康时输出容器状态与日志；2026-03-26：新增 `HOST_NGINX_ENABLED` 开关，支持正式域名未备案或证书未落盘前跳过宿主机 Nginx，并将占位域名/证书缺失前移到配置校验阶段；2026-03-26：将 deploy bundle 上传改为宽超时 + best-effort，修复 `scp-action` 在远端已解包成功后因清理/回连超时把整次发布误判失败的问题）
- [ ] S20 对账、安全收口与 V1 最终验收

## 里程碑映射

- M1：S1-S6
- M2：S7-S13
- M3：S14-S15
- M4：S16-S20

## 当前优先执行

1. `S18`：真实微信支付/退款与资金流水；该 Stage 依赖小程序与管理端身份链路已完成的配置基线。
2. `S19`：生产入口与微信发布阻塞项收口，完成 HTTPS 域名、支付回调域名与发布环境一致性。
3. `S20`：对账、安全收口与 V1 最终验收，补齐报表、审计与最终上线清单。
4. 前置外部条件需并行准备：微信小程序主体认证、`AppID/AppSecret`、微信支付商户号与证书、短信服务商签名与模板、正式 HTTPS 域名。
