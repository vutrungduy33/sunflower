# 项目文档索引与开发概览

本文档用于快速了解本仓库的文档位置、开发目标、当前架构与文件结构。

> 当前开发流程说明：本项目不再使用 Stage 强制流程、pre/post stage guard、提交前缀、分支前缀或 GitHub PR Gate。历史 Stage 文档已归档到 `docs/archive/`，仅用于追溯，不作为当前开发约束。

## 1. 项目目标（来自 PRD）
- 建设“民宿后台管理系统 + 微信小程序”，实现住客服务闭环与 OTA 转私域
- 为泸沽湖游客提供公共服务：地图 / 景点 / 点评 / 游记
- 业务目标：转私域、效率提升、体验提升

## 2. 开发目标与范围（优先级）
### P0（必须）
- 房型/房态/价格展示（小程序）
- 订单管理（下单/支付/取消/改期/入住核销）
- 后台房态与价格管理
- 微信登录与手机号绑定、用户标签
- 微信支付与对账报表
- 基础内容：民宿介绍、位置与交通、客服
- 私域转化入口与客源归因

### P1（高优先）
- 餐饮/商品点单
- 泸沽湖地图与景点推荐
- 猪槽船/接驳服务预订
- 评价与分享、优惠券与会员权益
- 私域触达与再营销、会员成长体系

### P2（可延后）
- 活动与主题团
- 数据分析面板
- CRM 与私域触达
- 多店扩展

## 3. 技术栈与运行形态（当前约定）
- 前端：微信小程序（原生框架）
- 后端：Spring Boot 单体（开发环境基于 docker-compose）
- 数据库：MySQL（见数据字典与索引设计）
- 管理后台：Web（`React 18 + TypeScript + Vite + TDesign React`，详见 `docs/Web-Admin-Plan.md`）
- 生产部署：GitHub Actions + 双阿里云 ECS + self-hosted runner（详见 `docs/Architecture.md`）

说明：根目录提供单机联调 `docker-compose.yml`，以及生产双节点拆分用的 `docker-compose.backend.yml` / `docker-compose.web.yml`。

## 4. 文档索引
- `docs/Agent-Memory.md`：Codex 记忆与上下文管理规则
- `docs/Context-Index.md`：后续任务的上下文加载地图
- `docs/Project-State.md`：当前项目事实、验证状态与风险快照
- `docs/MVP-Readiness.md`：MVP 上线可用性清单、验证矩阵与阻塞项
- `docs/MVP-Progress.md`：当前 MVP 推进轮次记录
- `docs/MVP-Closeout-Audit.md`：MVP 完成度审计与剩余外部验证缺口
- `docs/MVP-Next-Goal-Prompt.md`：用于继续 MVP 收口的 Codex goal 提示词
- `docs/MVP-External-Approval-Packet.md`：外部证据采集前的审批边界与请求模板
- `docs/Decision-Log.md`：长期架构/流程/部署决策记录
- `docs/Architecture.md`：当前系统架构、部署拓扑与运行组件说明
- `docs/PRD.md`：需求规格与开发计划（范围、优先级、里程碑）
- `docs/Prototype.md`：MVP 原型页面清单
- `docs/Miniapp-Frontend-MVP.md`：小程序前端一期 MVP 设计与实现说明
- `docs/Miniapp-MVP-QA.md`：小程序 MVP 自动 smoke 与人工 QA 清单
- `docs/IA.md`：信息架构（小程序 + 后台）
- `docs/Flows.md`：关键业务流程与状态
- `docs/API.md`：REST 接口清单
- `docs/API-Schemas.md`：接口字段级别定义（含示例）
- `docs/Backend-MVP-QA.md`：后端/API 自动测试、接口覆盖与生产 smoke 清单
- `docs/DB-Design.md`：数据库索引与约束设计
- `docs/DataDictionary.md`：核心表数据字典
- `docs/Analytics.md`：埋点与报表 SQL 模板
- `docs/Definition-of-Done.md`：当前交付检查清单（DoD）
- `docs/Code-Conventions.md`：后续新增代码统一规范
- `docs/CI-CD.md`：GitHub Actions CI/CD
- `docs/S19-Prod-Deployment-Config.md`：生产部署与配置说明
- `docs/Production-Smoke.md`：最近一次生产 smoke 与 ECS 状态记录
- `docs/Web-Admin-Plan.md`：管理后台 Web 选型、开发约束与环境依赖
- `docs/archive/`：历史 Stage 计划、报告、M1/S14 验收与旧门禁材料（非当前约束）
- `README.md`：项目总览 + 运营调研资料

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
│  ├─ MVP-Progress.md
│  ├─ MVP-Closeout-Audit.md
│  ├─ MVP-Next-Goal-Prompt.md
│  ├─ Decision-Log.md
│  ├─ Architecture.md
│  ├─ PRD.md
│  ├─ Prototype.md
│  ├─ Miniapp-Frontend-MVP.md
│  ├─ Miniapp-MVP-QA.md
│  ├─ IA.md
│  ├─ Flows.md
│  ├─ API.md
│  ├─ API-Schemas.md
│  ├─ Backend-MVP-QA.md
│  ├─ DB-Design.md
│  ├─ DataDictionary.md
│  ├─ Analytics.md
│  ├─ Definition-of-Done.md
│  ├─ Code-Conventions.md
│  ├─ CI-CD.md
│  ├─ S19-Prod-Deployment-Config.md
│  ├─ Production-Smoke.md
│  ├─ archive/
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

## 7. 建议补齐（下一步）
- 按实际改动运行对应测试，并同步更新相关 API、部署或用户文档
- 维护 `docs/Architecture.md` 和 `docs/CI-CD.md`，确保部署拓扑、服务器角色与自动部署流程保持最新
