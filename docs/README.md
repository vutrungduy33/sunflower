# 项目文档索引与开发概览

本文档用于快速了解本仓库的文档位置、开发目标、阶段计划与当前文件结构。

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
- 管理后台：Web（技术栈待落地）

说明：`sunflower-backend/` 已初始化 Spring Boot 单体基础结构，根目录已提供 `docker-compose.yml`（MySQL + backend）。

## 4. 文档索引
- `docs/PRD.md`：需求规格与开发计划（范围、优先级、里程碑）
- `docs/Agent-Stage-Plan.md`：按“一次对话=一个 Stage”的执行计划（当前主执行文档）
- `docs/Prototype.md`：MVP 原型页面清单
- `docs/Miniapp-Frontend-MVP.md`：小程序前端一期 MVP 设计与实现说明
- `docs/IA.md`：信息架构（小程序 + 后台）
- `docs/Flows.md`：关键业务流程与状态
- `docs/API.md`：REST 接口清单
- `docs/API-Schemas.md`：接口字段级别定义（含示例）
- `docs/DB-Design.md`：数据库索引与约束设计
- `docs/DataDictionary.md`：核心表数据字典
- `docs/Analytics.md`：埋点与报表 SQL 模板
- `docs/Backlog.md`：Stage Backlog（执行状态）
- `docs/Definition-of-Done.md`：Stage 完成清单（DoD）
- `docs/stage-reports/README.md`：Stage 执行报告规范与模板
- `docs/CI-CD.md`：GitHub Actions CI/CD
- `README.md`：项目总览 + 运营调研资料

## 5. 文件结构（概览）
```
/Users/chenyao/dev/miniapp/sunflower
├─ README.md                      # 项目总览 + 运营调研资料
├─ docs/                          # 产品与技术文档
│  ├─ README.md                   # 本文档
│  ├─ PRD.md
│  ├─ Agent-Stage-Plan.md
│  ├─ Prototype.md
│  ├─ Miniapp-Frontend-MVP.md
│  ├─ IA.md
│  ├─ Flows.md
│  ├─ API.md
│  ├─ API-Schemas.md
│  ├─ DB-Design.md
│  ├─ DataDictionary.md
│  ├─ Analytics.md
│  ├─ Backlog.md
│  ├─ Definition-of-Done.md
│  ├─ stage-reports/
│  └─ CI-CD.md
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
│  └─ project.private.config.json
├─ sunflower-backend/             # Spring Boot 后端基础工程
└─ docker-compose.yml             # 本地联调（MySQL + backend）
```

## 6. 当前进展（截至 2026-02-12）
- 小程序一期 MVP 前端已落地：`pages/mvp/*`
- 已完成链路：首页 → 预订 → 房型详情 → 填单 → 支付（模拟）→ 订单中心
- 已完成能力：手机号绑定、订单状态流转（待支付/待入住/已完成/已取消）、地图与发现页浏览
- 后端一期 API 已落地于 `sunflower-backend`（auth/user/room/order/content），可按 `docs/API.md` 直接联调
- 当前后端为联调模式（内存种子数据），重启后数据会重置；下一步切换 MySQL 持久化
- 管理后台（Web）尚未启动开发
- 已新增分阶段执行文档：`docs/Agent-Stage-Plan.md`（S0 已完成）

## 7. 建议补齐（下一步）
- 按 `docs/Agent-Stage-Plan.md` 从 S1 开始执行（数据库与迁移底座）
- 每完成一个 Stage，同步更新 `docs/Backlog.md` 状态
- 执行 Stage 前后分别运行：`make stage-pre STAGE=Sx`、`make stage-post STAGE=Sx`
- 分支与提交遵循：`codex/s<stage>-<slug>`、`[Sx] ...`
- 严格执行“单 Stage 单对话 + 开发测试同回合”节奏
