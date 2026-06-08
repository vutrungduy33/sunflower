# 项目文档索引

本文档只保留当前开发与交接需要的入口。历史规划、旧 Stage 与旧轮次日志
已归档到 `docs/archive/`，不作为默认阅读上下文。

> 当前开发流程说明：本项目不再使用 Stage 强制流程、pre/post stage guard、提交前缀、分支前缀或 GitHub PR Gate。历史 Stage 文档已归档到 `docs/archive/`，仅用于追溯，不作为当前开发约束。

## 1. 项目目标（来自 PRD）
- 建设“民宿后台管理系统 + 微信小程序”，实现住客服务闭环与 OTA 转私域
- 为泸沽湖游客提供公共服务：地图 / 景点 / 点评 / 游记
- 业务目标：转私域、效率提升、体验提升

## 2. 当前优先级

- MVP 可用性、验证状态与上线阻塞项以 `docs/MVP-Readiness.md` 为准。
- 产品背景与 P0/P1/P2 范围见 `docs/PRD.md`。
- 早期 IA、流程、原型、埋点、代码规范和 DoD 已归档到
  `docs/archive/planning/`，仅在需要历史背景时读取。

## 3. 技术栈与运行形态（当前约定）
- 前端：微信小程序（原生框架）
- 后端：Spring Boot 单体（开发环境基于 docker-compose）
- 数据库：MySQL（见数据字典与索引设计）
- 管理后台：Web（`React 18 + TypeScript + Vite + Ant Design 5 + ProComponents`，详见 `docs/Web-Admin-Plan.md`）
- 生产部署：GitHub Actions + 双阿里云 ECS + self-hosted runner（详见 `docs/Architecture.md`）

说明：根目录提供单机联调 `docker-compose.yml`，以及生产双节点拆分用的 `docker-compose.backend.yml` / `docker-compose.web.yml`。

## 4. 核心文档

- `docs/Context-Index.md`：上下文加载地图；后续任务按它决定读哪些文档。
- `docs/Project-State.md`：当前事实、验证状态、风险和活跃拓扑。
- `docs/MVP-Readiness.md`：MVP 可用性清单、验证矩阵与阻塞项。
- `docs/MVP-Handoff-Packet.md`：继续 MVP 收口时的紧凑交接入口。
- `docs/MVP-Launch-Evidence.json`、`docs/Miniapp-Manual-QA.json`、
  `docs/Admin-Web-Manual-QA.json`：机器可读证据 ledgers。
- `docs/MVP-Next-Approval-Request.md`：下一轮人工审批/外部证据请求入口。
- `docs/Architecture.md`、`docs/CI-CD.md`、`docs/API.md`、`docs/API-Schemas.md`：
  架构、部署与接口事实。
- `docs/Decision-Log.md`：长期架构/流程/部署决策记录。
- `docs/archive/`：历史 Stage、早期规划与旧 MVP 轮次材料，非当前约束。

按任务再加载：

- 产品背景：`docs/PRD.md`
- 数据库：`docs/DB-Design.md`、`docs/DataDictionary.md`
- 组件/QA 交接：`docs/Web-Admin-Plan.md`、`docs/Miniapp-Frontend-MVP.md`、
  `docs/*-MVP-QA.md`、`docs/*-Manual-QA.md`
- 部署细节：`docs/S19-Prod-Deployment-Config.md`、
  `docs/Production-Smoke.md`
- 外部证据：`docs/MVP-External-Validation-Runbook.md`、
  `docs/MVP-External-Approval-Packet.md`、
  `docs/MVP-External-Evidence-Template.md`

## 5. 文件结构（概览）
```
/Users/chenyao/dev/miniapp/sunflower
├─ README.md                      # 项目总览 + 运营调研资料
├─ docs/                          # 产品与技术文档
│  ├─ README.md                   # 本文档
│  ├─ Agent-Memory.md
│  ├─ Context-Index.md
│  ├─ Project-State.md
│  ├─ MVP-Readiness.md
│  ├─ MVP-Progress.md              # 仅保留最近运营轮次
│  ├─ MVP-Handoff-Packet.md
│  ├─ MVP-Next-Approval-Request.md
│  ├─ MVP-Launch-Evidence.json
│  ├─ Miniapp-Manual-QA.json
│  ├─ Admin-Web-Manual-QA.json
│  ├─ Decision-Log.md
│  ├─ Architecture.md
│  ├─ API.md
│  ├─ API-Schemas.md
│  ├─ CI-CD.md
│  ├─ archive/
│  ├─ archive/mvp-progress/        # 旧 MVP 轮次日志；更多历史见 git
│  ├─ archive/planning/            # 早期规划/流程/原型/规范文档
│  └─ Web-Admin-Plan.md
├─ sunflower-admin-web/           # Web 管理后台工程
├─ sunflower-miniapp/             # 微信小程序工程
│  ├─ app.js / app.json / app.wxss
│  ├─ assets/
│  ├─ behaviors/
│  ├─ components/
│  ├─ demos/
│  ├─ miniprogram_npm/             # 依赖组件（tdesign）
│  ├─ pages/                       # 页面集合
│  ├─ utils/
│  ├─ project.config.json
│  └─ project.private.config.example.json
├─ sunflower-backend/             # Spring Boot 后端工程
├─ docker-compose.yml             # 本地/单机联调
├─ docker-compose.backend.yml     # ECS-2 backend/mysql 部署
└─ docker-compose.web.yml         # ECS-1 admin-web 部署
```

## 6. 当前进展
- 小程序一期 MVP 前端已落地：`pages/mvp/*`
- 已完成链路：首页 → 预订 → 房型详情 → 填单 → 支付 → 订单中心（含改期/退款）
- 已完成能力：手机号绑定、订单状态流转（待支付/待入住/已改期/已退款/已取消）、地图与发现页浏览
- 后端 API 已落地于 `sunflower-backend`（auth/user/room/order/content/admin/payment/media）
- 已完成 Flyway + MySQL 持久化、订单事务化库存控制、小程序联调收口、售后接口、真实微信认证、真实微信支付/退款、管理端真实账号体系
- 管理端后端 API 已覆盖房型/价格/库存、订单/经营概览
- 管理后台（Web）已完成核心运营页面，`sunflower-admin-web/` 已可本地启动、测试与构建
- CI/CD 已完成：推送到 `main` 的部署相关变更会触发 GitHub Actions 自动部署到双 ECS
- 当前 MVP 可用性、验证状态与上线阻塞项以 `docs/MVP-Readiness.md` 为准
- Web 技术选型、环境约束与本地调试说明见：`docs/Web-Admin-Plan.md`

## 7. 文档维护规则

- 默认只读 `Context-Index` 指向的热上下文，不扫描整个 `docs/`。
- `Project-State` 写当前事实，不追加完整轮次日志。
- `MVP-Progress` 只保留最近轮次；旧细节归档或依赖 git 历史。
- 不新增状态类文档，除非现有核心文档无法承载。
- 证据状态以 JSON ledgers 为准，不在说明文档里手工复制整份 ledger。

## 8. 建议补齐（下一步）
- 按实际改动运行对应测试，并同步更新相关 API、部署或用户文档
- 维护 `docs/Architecture.md` 和 `docs/CI-CD.md`，确保部署拓扑、服务器角色与自动部署流程保持最新
