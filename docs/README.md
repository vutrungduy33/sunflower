# 项目文档索引与开发概览

本文档用于快速了解本仓库的文档位置、开发目标与当前文件结构。

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

说明：目前 `sunflower-backend/` 为空，`docker-compose` 配置尚未落地。

## 4. 文档索引
- `docs/PRD.md`：需求规格与开发计划（范围、优先级、里程碑）
- `docs/Prototype.md`：MVP 原型页面清单
- `docs/IA.md`：信息架构（小程序 + 后台）
- `docs/Flows.md`：关键业务流程与状态
- `docs/API.md`：REST 接口清单
- `docs/API-Schemas.md`：接口字段级别定义（含示例）
- `docs/DB-Design.md`：数据库索引与约束设计
- `docs/DataDictionary.md`：核心表数据字典
- `docs/Analytics.md`：埋点与报表 SQL 模板
- `docs/Backlog.md`：Sprint Backlog（MVP）
- `docs/CI-CD.md`：GitHub Actions CI/CD
- `README.md`：项目总览 + 运营调研资料

## 5. 文件结构（概览）
```
/Users/chenyao/dev/miniapp/sunflower
├─ README.md                      # 项目总览 + 运营调研资料
├─ docs/                          # 产品与技术文档
│  ├─ README.md                   # 本文档
│  ├─ PRD.md
│  ├─ Prototype.md
│  ├─ IA.md
│  ├─ Flows.md
│  ├─ API.md
│  ├─ API-Schemas.md
│  ├─ DB-Design.md
│  ├─ DataDictionary.md
│  ├─ Analytics.md
│  ├─ Backlog.md
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
└─ sunflower-backend/             # Spring Boot 后端（待初始化）
```

## 6. 建议补齐（下一步）
- 在 `sunflower-backend/` 初始化 Spring Boot 单体结构
- 增加 `docker-compose.yml`（MySQL + 后端服务）
- 补充后端说明文档
