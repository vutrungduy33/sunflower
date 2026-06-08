# Web 管理后台选型与开发约束

> 更新时间：2026-06-08
> 适用范围：当前 `sunflower-admin-web` 工程与后续管理端增量开发。

## 1. 背景与目标

- 后台覆盖单店自营民宿的核心运营能力：工作台、账号激活/登录、房型管理、价格日历与库存、订单与售后。
- 当前上线重点是高频运营路径的可用性、验证与生产交接；餐饮商品、内容审核、会员营销、系统设置等后续范围不作为当前上线阻塞项。
- 视觉与交互目标是冷静、密集、可扫描的运营后台，避免演示页、阶段页或开发态标识。

## 2. 选型结论

- UI 底座：统一采用 `Ant Design 5 + ProComponents`。
- 工程栈：保留 `React 18 + TypeScript + Vite + React Router + TanStack Query + Axios + Vitest + ESLint`。
- 落地方式：不迁移到完整 `Ant Design Pro/Umi`，不引入 `Refine`，不混用 `shadcn/ui`、`Arco Design Pro` 或其他大型 UI 框架。
- 兼容说明：原计划调研包含 `Ant Design 6`，但当前 `@ant-design/pro-components@2.8.10` 的 peer dependency 覆盖 `antd ^4.24.15 || ^5.11.2`，不覆盖 AntD 6；因此当前上线底座采用 `antd@5.29.3`，待 ProComponents 官方兼容 AntD 6 后再评估升级。

## 3. 选择理由

### 3.1 为什么选择 Ant Design + ProComponents

- 本后台的核心界面是表格、筛选、表单、抽屉、描述列表、日期选择、日历和状态流转；AntD/ProComponents 在这些后台场景的成熟度最高。
- `ProTable`、`ProForm`、`ProCard` 能减少页面层的重复布局代码，同时保留现有 Vite、路由、鉴权和服务层。
- 相比继续沿用 TDesign React，AntD/ProComponents 更贴近最终上线运营后台的信息密度、表格能力和后台生态。
- 相比完整 Ant Design Pro，保留当前 SPA 工程能降低迁移面，避免引入 Umi、运行时插件和更重的工程约束。

### 3.2 为什么保留 Vite 与当前应用结构

- 当前 `sunflower-admin-web` 已经具备可工作的 Vite、React Router、TanStack Query、Axios、鉴权守卫和测试基线。
- 本次重构目标是替换展示层和页面编排，不改变后端接口、不重写鉴权、不扩大部署拓扑。
- Vite 对单后台 SPA 的本地启动、热更新和构建复杂度更合适。

### 3.3 为什么不采用其他方案

- `Ant Design Pro`：后台能力完整，但 Umi/插件体系迁移面大，超过单店运营后台当前需要。
- `Refine`：资源型 CRUD 抽象强，但价格日历、库存批量编辑、订单售后流转需要较多业务定制，抽象收益有限。
- `shadcn/ui`：适合高度定制产品界面，但本项目更需要成熟后台组件、表格和中文运营后台生态。
- `Arco Design Pro`：可作为国内后台参考，但在本项目里没有比 AntD/ProComponents 带来更低迁移成本或更高确定性。

## 4. 强约束

### 4.1 工程约束

- 只维护一个 SPA 工程，不引入微前端。
- 只使用一个主 UI 框架；后台 Web 不再引入 TDesign React 或其他大型 UI 库。
- 默认数据层组合为 `TanStack Query + Axios + 局部 React state`；在明确出现跨页面复杂共享状态前，不引入 Redux。
- 路由、菜单、权限守卫使用统一模块配置，不允许页面各自散落定义。
- 保持 `app/features/pages/services/styles/test` 分层，不为 UI 迁移改写业务服务边界。

### 4.2 联调约束

- 以后端当前 API 契约为准，默认保持向后兼容。
- 若后台 API 契约变更，必须同步更新调用端代码、`docs/API.md` 和 `docs/API-Schemas.md`。
- 本地调试默认使用 `/api` 相对路径 + Vite dev proxy，禁止在页面组件里硬编码 `http://localhost:8080`。

### 4.3 页面设计约束

- 统一采用后台标准布局：侧边导航、顶栏、面包屑、页面标题、筛选区、结果区、详情抽屉/弹窗。
- 优先使用 `ProTable`、`ProForm`、`ProCard`、`Descriptions`、`Drawer`、`DatePicker`、`Calendar` 等 AntD/ProComponents 能力。
- 页面可见文案不得出现阶段编号、开发中、占位演示、内部 token 或类似临时提示。
- 表格密度、状态标签、空态、错误态、加载态必须统一视觉语义。
- 语言以中文为主，当前不引入完整 i18n 体系。

## 5. 当前页面范围

- 工程骨架、主题、路由、环境配置、HTTP、测试基线。
- 登录页、首次激活、短信重置密码、修改密码、鉴权守卫、基础布局、菜单权限。
- 工作台经营概览、系统健康、常用操作和运营提醒。
- 房型列表、创建/编辑、筛选、上架/下架。
- 价格日历、库存批量编辑、变更反馈。
- 订单列表、订单详情、售后处理、履约状态操作。

## 6. Web 开发与调试前置依赖

### 6.1 必备版本

- `Node.js`：`>= 20.19.0`，推荐使用 Node 20 LTS。
- `npm`：`>= 10`。
- 浏览器：最新两个大版本内的 Chrome 或 Edge。
- 后端联调环境：`docker compose` 可用，且 `http://localhost:8080/api/health` 可访问。

说明：

- Vite 官方文档要求 Node.js `20.19+` 或 `22.12+`。
- 当前工作区可使用 `$HOME/.local/node-v20.20.1-darwin-arm64` 的 Node `20.20.1`。

### 6.2 建议工具

- `nvm`：用于切换 Node 版本。
- `Git`：用于常规分支与提交操作。
- `curl`：快速验证后端健康检查与接口响应。

## 7. 本地开发/调试约定

### 7.1 首次准备

1. 安装并切换到 Node 20 LTS；当前工作区可直接使用 `$HOME/.local/node-v20.20.1-darwin-arm64/bin`。
2. 启动后端：`docker compose up -d mysql backend`
3. 确认健康检查：`curl http://localhost:8080/api/health`
4. 进入 Web 工程：`cd sunflower-admin-web`
5. 安装依赖：`npm install` 或 `npm ci`

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
- 若本地启动失败，先检查 Node 和 npm 版本是否满足必备版本。

## 8. 文档落点

- 产品与总体目标：`docs/PRD.md`
- 当前架构：`docs/Architecture.md`
- 当前上线可用性与阻塞项：`docs/MVP-Readiness.md`
- 当前推进记录：`docs/MVP-Progress.md`
- 历史 stage 资料：`docs/archive/`

## 9. 开源参考与取舍

- Ant Design: `https://github.com/ant-design/ant-design`，MIT，选中。
- Ant Design v6 migration: `https://ant.design/docs/react/migration-v6/`，作为后续升级参考；当前因 ProComponents peer dependency 暂缓。
- ProComponents: `https://github.com/ant-design/pro-components`，MIT，选中。
- ProTable: `https://procomponents.ant.design/en-US/components/table/`，选中为表格/筛选主路径。
- Ant Design Pro: `https://github.com/ant-design/ant-design-pro`，MIT，参考但不采用完整 Umi 底座。
- Refine: `https://refine.dev/docs/`，MIT，参考但不采用资源抽象框架。
- shadcn/ui: `https://github.com/shadcn-ui/ui`，MIT，参考但不采用为主后台框架。
- Arco Design Pro: `https://github.com/arco-design/arco-design-pro`，MIT，参考但不采用。

本次没有复制第三方实现代码；仅采用官方组件库能力和既有项目工程结构。
