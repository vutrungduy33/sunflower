# Web 管理后台选型与开发约束

> 更新时间：2026-03-11
> 适用范围：S9-S13

## 1. 背景与目标

- V1 后台只覆盖最小可运营能力：仪表盘、房型管理、价格日历与库存、订单与售后。
- P1/P2 范围（餐饮商品、内容审核、会员营销、系统设置等）不作为 S9-S13 的阻塞项。
- S9 的目标是建立可持续迭代的工程骨架，不在此阶段引入过重的平台抽象。

## 2. 选型结论

- 管理平台骨架：参考 `TDesign React Starter` 的工程组织与后台实践，不直接整仓 fork。
- UI 框架：统一使用 `TDesign React`。
- 工程栈：`React 18 + TypeScript + Vite + React Router + TanStack Query + Axios + Vitest + ESLint`。
- 落地方式：在 S9 中新建 `sunflower-admin-web` 目录并按以上技术栈初始化；此前的占位工程已移除，不作为后续正式基线。

## 3. 选择理由

### 3.1 为什么选择 TDesign React

- 与现有微信小程序方向更一致。TDesign 同时覆盖 React 与微信小程序组件体系，便于统一品牌色、状态色与交互语义。
- 更贴近国内运营后台习惯，表格、表单、筛选、抽屉和状态展示组件成熟度足够支撑 S10-S13。
- 该组合与当前仓库的小程序技术方向和后台需求边界最匹配，后续演进成本最低。

### 3.2 为什么选择 Vite

- S9 需要的是轻量、可持续的前端工程底座，Vite 在本地启动、热更新和构建配置复杂度上更合适。
- `sunflower-admin-web` 作为计划中的工程目录，其目标形态在阶段计划中已明确为 `React + TypeScript + Vite`，与后续工程约束一致。

### 3.3 为什么不选更重的平台方案

- `Ant Design Pro` 生态强，但官方骨架偏 `umi/dva`，对当前 V1 范围来说过重。
- `Refine`、`React Admin` 更适合资源型 CRUD，S12 的价格日历与库存批量编辑属于强业务定制页面，抽象收益有限。
- 本项目当前只有一个后台 Web，应避免微前端、低代码平台或多框架混用。

## 4. 强约束

### 4.1 工程约束

- 只维护一个 SPA 工程，不引入微前端。
- 只使用一个主 UI 框架，不混用 `antd`、`arco`、`mantine` 等其他大型 UI 库。
- 默认数据层组合为 `TanStack Query + Axios + 局部 React state`；在明确出现跨页面复杂共享状态前，不引入 Redux。
- 路由、菜单、权限守卫使用统一的模块配置，不允许页面各自散落定义。

### 4.2 联调约束

- 以后端 `S7/S8` API 契约为准，默认保持向后兼容。
- 若后台 API 契约变更，必须同步更新：
  - 调用端代码
  - `docs/API.md`
  - `docs/API-Schemas.md`
- 本地调试默认使用 `/api` 相对路径 + Vite dev proxy，禁止在页面组件里硬编码 `http://localhost:8080`。

### 4.3 页面设计约束

- 统一采用后台标准布局：侧边导航、顶栏、面包屑、页面标题、筛选区、结果区、详情抽屉/弹窗。
- S11-S13 的表格、状态标签、空态、错误态、加载态必须统一组件封装和视觉语义。
- V1 语言以中文为主，不在 S9-S13 引入完整 i18n 体系。

## 5. S9-S13 页面范围

- `S9`：工程骨架、主题、路由、环境配置、HTTP、测试基线。
- `S10`：登录页、鉴权守卫、基础布局、菜单权限。
- `S11`：房型列表、创建/编辑、上架/下架。
- `S12`：价格日历、库存批量编辑、变更反馈。
- `S13`：订单列表、订单详情、售后处理、经营概览卡片。

## 6. Web 开发与调试前置依赖

### 6.1 必备版本

- `Node.js`：`>= 20.19.0`，推荐使用 Node 20 LTS。
- `npm`：`>= 10`。
- 浏览器：最新两个大版本内的 Chrome 或 Edge。
- 后端联调环境：`docker compose` 可用，且 `http://localhost:8080/api/health` 可访问。

说明：

- Vite 官方文档要求 Node.js `20.19+` 或 `22.12+`。
- 当前系统默认 Node 版本仍为 `v18.4.0`，但已在 `$HOME/.local/node-v20.20.1-darwin-arm64` 安装 Node `v20.20.1` 供 `sunflower-admin-web` 使用。

### 6.2 建议工具

- `nvm`：用于切换 Node 版本。
- `Git`：用于常规分支与提交操作。
- `curl`：快速验证后端健康检查与接口响应。

## 7. 本地开发/调试约定

### 7.1 首次准备

1. 安装并切换到 Node 20 LTS；当前工作区可直接使用 `$HOME/.local/node-v20.20.1-darwin-arm64/bin`。
2. 启动后端：`docker compose up -d mysql backend`
3. 确认健康检查：`curl http://localhost:8080/api/health`
4. 在仓库根目录创建并初始化 `sunflower-admin-web` 工程。
5. 进入 Web 工程：`cd sunflower-admin-web`
6. 安装依赖：`npm install`

### 7.2 日常命令

- 本地启动：`npm run dev`
- 单元测试：`npm run test`
- 代码检查：`npm run lint`
- 生产构建：`npm run build`

### 7.3 环境变量约定

- 开发环境默认通过 Vite 代理把 `/api` 转发到 `http://localhost:8080`。
- 环境变量统一使用 `VITE_` 前缀。
- 推荐最小配置：

```env
VITE_API_BASE_URL=/api
VITE_API_PROXY_TARGET=http://localhost:8080
```

### 7.4 常见调试问题

- 若页面提示接口不可达，先检查后端容器和 `/api/health`。
- 若出现跨域问题，优先检查 Vite proxy 配置，而不是在业务代码中改写请求地址。
- 若本地启动失败，先检查 Node 版本是否满足 `>= 20.19.0`。

## 8. 文档落点

- 产品与总体目标：`docs/PRD.md`
- Stage 执行计划：`docs/Agent-Stage-Plan.md`
- 当前阶段状态：`docs/Backlog.md`
- S9 文档报告：`docs/stage-reports/S9.md`

## 9. 参考资料

- Vite Guide: `https://vite.dev/guide/`
- TDesign React Starter: `https://github.com/Tencent/tdesign-react-starter`
- TDesign React: `https://github.com/Tencent/tdesign-react`
