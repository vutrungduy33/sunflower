# GitHub Actions CI/CD

> Current as of 2026-06-08.

## 1. 工作流总览

当前保留一个部署工作流：

1. `deploy-backend.yml`：主分支/手动触发的双 ECS 发布入口

---

## 2. PR 门禁

PR 门禁 workflow 已移除。仓库当前不再强制：

- Stage Guard
- 分支命名规范
- Stage 前缀提交信息
- PR 级别自动化测试门禁

补充说明：

- `sunflower-miniapp/project.config.json` 在仓库中必须固定使用占位值 `touristappid`，避免把真实微信小程序 `appid` 提交入库。
- 若本地联调需要真实小程序身份，请复制
  `sunflower-miniapp/project.private.config.example.json` 为被 Git 忽略的
  `sunflower-miniapp/project.private.config.json`，只在该私有配置中填写真实
  AppID；不要修改已提交的 `project.config.json`。
- 推送到 `main` 仍会触发 `deploy-backend.yml` 自动部署。
- 但 workflow 仍受路径过滤影响；仅修改 `docs/**` 等非部署路径时不会触发
  部署。

---

## 3. 生产部署流程（双 ECS + Self-Hosted Runner）

工作流路径：`.github/workflows/deploy-backend.yml`

目标拓扑：

- ECS-1（web / ingress）：
  - 宿主机 Nginx
  - `sunflower-admin-web`
  - 对外暴露 `admin.*`、`api.*`
- ECS-2（backend）：
  - `sunflower-backend`
  - `mysql`
  - 仅通过内网为 ECS-1 提供 upstream
- GitHub Actions deploy runner：
  - `ecs-backend` label 固定部署在 ECS-2
  - `ecs-web` label 固定部署在 ECS-1

触发条件：

- `push` 到 `main`
- `workflow_dispatch`

`workflow_dispatch` 输入：

- `target`：`auto / backend / admin-web / nginx / all / bootstrap`
- `image_tag`：可选，指定历史 GHCR tag 进行回滚或重发 fallback
- `run_seed`：仅 `bootstrap` 目标使用，默认 `false`
- `deployment_lane`：`production / nonprod-mock-payment`，默认
  `production`。push 到 `main` 永远使用 `production`。

执行流程：

1. `detect-targets`
   - `push` 场景按改动文件自动识别 backend / admin-web / ingress。
   - `workflow_dispatch` 场景按 `target` 直接解析发布范围。
   - 输出是否需要触发 backend host 与 web host 两条链路。
2. `build-backend` / `build-admin-web`
   - 两个镜像保持并行构建。
   - 常规发布会在 GitHub Hosted Runner 上构建镜像、推送 GHCR 备用 tag，并额外导出压缩后的镜像 artifact。
   - 若手动传入历史 `image_tag`，则跳过镜像构建与 artifact 生成，直接走既有 GHCR fallback。
3. `package-deploy-bundle`
   - 运行在 GitHub Hosted Runner。
   - checkout 只包含部署所需的 compose、env example、Nginx 模板和 scripts。
   - 通过 `scripts/package_deploy_bundle.sh` 打包 deployment bundle，并上传为 workflow artifact。
   - 这样 ECS self-hosted runner 不再依赖 `actions/checkout` 访问 GitHub 仓库。
4. `deploy-backend-host`
   - 运行在 `self-hosted + ecs-backend`。
   - 下载并解包 deployment bundle artifact、同步到 `$BACKEND_DEPLOY_PATH`、
     下载 backend image artifact、`docker load`，然后生成 pending release
     metadata，校验并部署 backend；只有部署成功后才把 pending 元数据原子
     切换为正式 `.release.env`。
   - 本机部署步骤设置 `timeout-minutes: 20`，避免 runner 本机 deploy 无限挂起。
   - `bootstrap` 时仅 backend host 执行 seed 导入。
5. `deploy-web-host`
   - 运行在 `self-hosted + ecs-web`。
   - 仅在 backend host 成功或被跳过后执行。
   - 下载并解包 deployment bundle artifact、同步到 `$WEB_DEPLOY_PATH`、
     下载 admin-web image artifact、`docker load`，然后生成 pending release
     metadata，校验并部署 admin-web；只有部署成功后才把 pending 元数据原子
     切换为正式 `.release.env`。
   - 本机部署步骤设置 `timeout-minutes: 20`。
   - `target=all / nginx / bootstrap` 时最后再刷新宿主机 Nginx。

提效策略：

- 构建、打包 artifact 并行。
- 真正切换流量保持串行：`ECS-2 backend -> ECS-1 admin-web -> ECS-1 nginx reload`。
- 若只改 `sunflower-admin-web/**`，只触发 web host。
- 若只改 `sunflower-backend/**`，只触发 backend host。
- backend artifact 由 ECS-2 直接下载，admin-web artifact 由 ECS-1 直接下载，ECS-1 不再中转 backend 产物。
- deployment bundle artifact 由两台 ECS 各自直接下载，避免 ECS runner 在
  部署阶段执行 `actions/checkout`。

部署约束：

- GitHub Actions 不下发业务运行时密钥。
- 业务配置全部由两台 ECS 各自的本地 `.env.prod` 提供。
- backend host 的 `.env.prod` 固定使用 `DEPLOY_NODE_ROLE=backend`。
- web host 的 `.env.prod` 固定使用 `DEPLOY_NODE_ROLE=web`。
- 常规 prod 发布不自动导入 `mvp_demo_seed.sql`。
- web host 的宿主机 Nginx reload 只在 `target=all / nginx / bootstrap` 时执行。
- 常规 prod 发布主路径不依赖 GitHub Hosted Runner 直连 ECS，也不依赖 ECS 在发布时临时拉取 GHCR。
- 手动 `deployment_lane=nonprod-mock-payment` 只支持 `target=auto` 或
  `target=backend`，且 `auto` 会解析为 `backend`。该 lane 只部署/校验
  backend host，使用 ECS 本地 `.env.prod` 作为基础配置，再叠加
  `.env.nonprod-mock.example` 的 mock-payment overlay，并运行
  `scripts/check_nonprod_mock_payment_deploy_lane.sh`；不会刷新 admin-web
  或 Nginx。

---

## 4. Secrets 与配置归属

### 4.1 GitHub Actions Secrets（仅部署通道）

deploy path 必填：

- `BACKEND_DEPLOY_PATH`
- `WEB_DEPLOY_PATH`

仅手动 `image_tag` fallback 回滚时需要：

- `GHCR_USERNAME`
- `GHCR_TOKEN`

说明：

- 常规发布不再需要 `BACKEND_ECS_*`、`WEB_ECS_*` SSH Secrets。
- GitHub Hosted Runner 只负责构建、上传 artifact，不再负责 SSH 进入 ECS。
- self-hosted runner 会在目标主机本地下载 deployment bundle/image
  artifacts、同步 bundle 并触发脚本，不再 checkout 仓库源码。
- 小程序认证、管理端短信、数据库口令、应用 token secret 等不再存放在 GitHub Secrets。

### 4.2 ECS 本地配置文件

两台服务器部署目录都固定保留：

- `$DEPLOY_PATH/.env.prod`
- `$DEPLOY_PATH/.release.env`

示例模板：

- backend host：[`/.env.prod.example`](/Users/chenyao/dev/miniapp/sunflower/.env.prod.example)
- web host：[`/.env.prod.web.example`](/Users/chenyao/dev/miniapp/sunflower/.env.prod.web.example)

说明：

- backend host 的 `.env.prod` 保存数据库、微信、小程序鉴权、后台账号、短信与 backend 端口配置。
- web host 的 `.env.prod` 保存 admin-web 端口、内网 backend upstream、Nginx 域名与证书配置。
- `.release.env` 由 workflow 每次覆盖，只保存镜像与发布元信息。
- `.env.nonprod-mock.example` 是后端非生产/mock-payment 验收 lane 的
  overlay 模板；它只保存 lane 标记和 mock payment 覆盖值。数据库凭据、
  token secret、真实微信登录、SMS 等仍来自 ECS 本地 `.env.prod`。它必须通过
  `scripts/check_nonprod_mock_payment_deploy_lane.sh`，但不得被当成完整生产
  `.env.prod` 或真实支付 readiness。

完整变量清单、首次 bootstrap、回滚与 smoke test 说明见：

- [S19-Prod-Deployment-Config.md](/Users/chenyao/dev/miniapp/sunflower/docs/S19-Prod-Deployment-Config.md)

---

## 5. 本地校验命令

- `node scripts/check_deployment_approval_preflight.js`
- `RUN_INTERNAL=1 scripts/check_backend_payment_config_readiness.sh`
- `RUN_INTERNAL=1 ENFORCE_PAYMENT_CONFIG=1 scripts/check_backend_payment_config_readiness.sh`
- `RUN_INTERNAL=1 scripts/check_ecs_runner_github_connectivity.sh`
- `bash scripts/check_nonprod_mock_payment_deploy_lane.sh`
- `node scripts/check_workflow_dispatch_lane_matrix.js`
- `node scripts/check_nonprod_dispatch_readiness.js`
- `node scripts/check_codeup_yunxiao_migration_plan.js`
- `scripts/dispatch_nonprod_mock_payment_deploy.sh --dry-run`
- `ruby -e 'require "yaml"; YAML.load_file(".github/workflows/deploy-backend.yml")'`
- `docker compose -f docker-compose.backend.yml --env-file .env.prod.example config`
- `docker compose -f docker-compose.web.yml --env-file .env.prod.web.example config`
- `bash -n scripts/deploy_lib.sh scripts/validate_prod_env.sh scripts/package_deploy_bundle.sh scripts/deploy_backend.sh scripts/deploy_admin_web.sh scripts/bootstrap_prod.sh scripts/deploy_prod.sh scripts/reload_host_nginx.sh scripts/sync_deploy_bundle.sh scripts/execute_runner_deploy.sh scripts/test_execute_runner_deploy_release_env.sh scripts/start_backend_with_mvp_seed.sh scripts/start_admin_web.sh scripts/check_backend_payment_config_readiness.sh`
- `cd sunflower-backend && mvn -B test`
- `cd sunflower-admin-web && npm run build`

补充：

- `.env.prod.example` 与 `.env.prod.web.example` 只用于本地渲染校验与运维对照，不应直接作为线上密钥文件使用。
- deploy 脚本运行时会固定加载各自 `$DEPLOY_PATH/.release.env`；即使 `.env.prod` 中残留样板 release metadata，也不会覆盖当次发布镜像信息。
- backend compose 按 `PROD_ENV_FILE`、`RUNTIME_OVERLAY_ENV_FILE`、
  `RELEASE_ENV_FILE` 的顺序加载 env file。默认 overlay 是
  `.env.runtime-overlay.empty`；只有 backend-only nonprod/mock-payment lane 会把
  `RUNTIME_OVERLAY_ENV_FILE` 设置为 `.env.nonprod-mock.example`。
- runner deploy 会先写 `$DEPLOY_PATH/.release.env.pending` 与
  `$DEPLOY_PATH/.deploy-source-sha.pending` 供本次部署使用；若校验或部署失败，
  pending 文件会被清理，正式 `.release.env` 和 `.deploy-source-sha` 保持旧值。
  只有部署成功后才会原子替换正式 release metadata。
- `scripts/check_backend_payment_config_readiness.sh` 是只读支付配置预检：
  它只报告 ECS-2 `.env.prod` 中微信支付变量和 key 文件是否存在/形态是否合理，
  不打印密钥值，不推送，不部署。常规模式用于记录阻塞；部署前可用
  `ENFORCE_PAYMENT_CONFIG=1` 让缺项以非零退出。
- `scripts/check_nonprod_mock_payment_deploy_lane.sh` 是非生产/mock-payment
  lane 的配置边界检查：默认用 `.env.prod.example` +
  `.env.nonprod-mock.example` 做本地模板检查；runner 执行时用 ECS
  `.env.prod` + `.env.nonprod-mock.example`。它要求
  `SUNFLOWER_DEPLOY_LANE=nonprod-mock-payment`、后端节点、私有/本机
  backend 绑定、真实微信登录模式，以及
  `WECHAT_PAY_MOCK_ENABLED=true`。该检查只证明 mock-payment lane 配置形态可用，
  不证明生产支付、退款、HTTPS 域名、当前分支已部署或 MVP 可上线。
- 当前 `.github/workflows/deploy-backend.yml` 的 push-to-main 和默认
  `workflow_dispatch` runner 路径仍调用 `scripts/validate_prod_env.sh`，即
  生产 lane。只有手动选择 `deployment_lane=nonprod-mock-payment` 且目标为
  `auto/backend` 时，backend runner 才会使用非生产/mock-payment 校验，并在
  ECS `.env.prod` 基础上叠加 `.env.nonprod-mock.example`。
- `scripts/check_workflow_dispatch_lane_matrix.js` 是本地 deployment-lane
  矩阵 guard：它覆盖 production dispatch、nonprod accepted/rejected
  dispatch，以及 push event 默认 production 行为，避免 workflow 手动入口漂移。
- `scripts/check_nonprod_dispatch_readiness.js` 是请求 backend-only
  nonprod/mock-payment 手动 dispatch 前的只读预检：它要求当前分支/工作区适合
  审批讨论、workflow lane 边界存在、approval/handoff 文档写明 reduced-scope
  证据边界、`CURRENT-BRANCH-DEPLOYED` 仍为 pending，并复用 lane matrix 与
  `.env.nonprod-mock.example` overlay 检查。开发中的 `scripts/check_deploy_config.sh`
  会以 `ALLOW_DIRTY=1` 运行它；真正请求审批前应使用默认严格模式。
- `scripts/dispatch_nonprod_mock_payment_deploy.sh --dry-run` 是
  backend-only nonprod/mock-payment lane 的人工派发辅助入口。默认只运行
  readiness guard 并打印固定的
  `gh workflow run deploy-backend.yml --ref main -f target=backend -f run_seed=false -f deployment_lane=nonprod-mock-payment`
  命令，不会触发 GitHub Actions；只有在审批后同时传入 `--execute` 且设置
  `CONFIRM_NONPROD_MOCK_DISPATCH=1` 才会执行。该 lane 仍不刷新
  admin-web/Nginx，也不是 real payment/refund evidence。
- 若 self-hosted deploy job 卡在 artifact 下载或 runner 本机步骤，优先查看
  对应 ECS runner 工作目录下的 `_diag/Worker_*.log`，并确认 runner 进程、
  GitHub artifact/API 网络连通性、磁盘空间和工作目录权限。workflow timeout
  只负责让挂起有界失败，不代表根因已修复。
- `scripts/check_ecs_runner_github_connectivity.sh` 是只读 ECS runner 诊断：
  默认不连 ECS；设置 `RUN_INTERNAL=1` 后通过 SSH 到 ECS-2 检查 runner 进程、
  `_diag/Worker_*.log` 摘要、`github.com` DNS/HTTPS、`git ls-remote` 和磁盘
  空间，不打印密钥，也不修改 runner/部署状态。
- 若需要回滚 backend/admin-web，优先通过 `workflow_dispatch + image_tag=<历史 sha>` 完成，而不是在 ECS 上手工改 compose 文件。
- `node scripts/check_deployment_approval_preflight.js` 只读分析当前分支相对
  `origin/main`/`main` 的部署影响面和人工审批边界，不会 push、触发
  `workflow_dispatch` 或修改生产。
- 在任何用于关闭 `CURRENT-BRANCH-DEPLOYED` 的 push、merge、
  `workflow_dispatch` 或 deploy 前，必须先取得明确人工批准，并在干净工作区
  运行 `node scripts/check_deployment_approval_preflight.js`。

## 6. 零新增付费服务的备用发布方案

当前 artifact-based GitHub Actions 路径已经避免 ECS 在部署阶段执行
`actions/checkout`，但 ECS self-hosted runner 仍需要访问 GitHub workflow
artifact/API 下载部署包和镜像 artifact。若该链路继续不稳定，优先采用以下
备用方案，不新增额外付费服务：

1. 首选：Alibaba Cloud-side image pull
   - 使用阿里云容器镜像服务个人版或账号内已有免费额度的镜像仓库作为镜像源。
   - GitHub Actions 或人工构建步骤把 backend/admin-web 镜像推送到该仓库。
   - ECS-1/ECS-2 使用阿里云同地域/内网仓库地址拉取镜像，再执行现有
     `scripts/execute_runner_deploy.sh` / compose 切换。
   - 部署时不再依赖 ECS 下载 GitHub workflow artifact；GitHub 仍可保留为代码
     检查和触发入口。

2. 备选：ECS-local artifact directory
   - 在 ECS 部署目录下维护受权限控制的 release artifact 目录，存放签名或校验
     过的 deployment bundle、`docker save` 镜像包和 release metadata。
   - 发布步骤只在 ECS 本机 `docker load` 并执行现有校验/部署脚本。
   - 该方式减少外部网络依赖，但需要人工或脚本安全投递 artifact，并记录
     sha256、来源 commit、操作者和回滚点。

3. 构建链路加固
   - Round 83 workflow run `26804961943` 失败在 GitHub hosted runner
     `docker/setup-buildx-action@v3` 拉取 Docker Hub
     `moby/buildkit:buildx-stable-1` 超时，backend image 未构建，未进入 ECS
     部署。
   - Round 87 将 backend/admin-web 镜像构建从
     `docker/setup-buildx-action` / `docker/build-push-action` 改为普通
     Docker CLI：`docker build`、`docker push`、本地 `docker save` 后上传
     workflow artifact。这样保留 GHCR 镜像和 artifact 部署拓扑，同时移除
     每次构建前拉取 BuildKit helper image 的直接依赖。
   - 该调整不消除所有外部 registry 风险：backend/admin-web Dockerfile 仍
     需要拉取 Maven、Temurin、Node、Nginx 等基础镜像。若这些基础镜像拉取
     也不稳定，再评估镜像加速、基础镜像镜像到阿里云侧、或采用第 1/2
     个备用发布方案。

4. 选择边界
   - 不引入新的付费部署 SaaS。
   - 不弱化 production lane 的真实支付、HTTPS 域名、Nginx/8080 安全校验。
   - mock/nonprod lane 仍只能作为 reduced-scope evidence，不能替代真实
     WeChat Pay/refund launch evidence。

5. Codeup / 云效迁移计划
   - 迁移目标文档：
     [Codeup-Yunxiao-Migration-Plan.md](/Users/chenyao/dev/miniapp/sunflower/docs/Codeup-Yunxiao-Migration-Plan.md)。
   - 已选路线：Codeup + 云效 Flow + 现有阿里云 ECS + ECS 本地制品；v1 不
     引入 GHCR/ACR/SWR 等镜像仓库。
   - 已验证：本机 `~/.ssh/id_ed25519` 可只读访问 Codeup `sunflower` 仓库
     `main`；云效 OpenAPI 可读取 `向日葵民宿开发部`
     (`6a1e70a56ca3fad97ed1fbab`) 组织和流水线列表，当前流水线列表为空。
   - 待人工配置：在云效 Flow 创建流水线、确认 Codeup 仓库 UI 可选、接入
     ECS-1/ECS-2 主机组、配置非业务密钥变量、设置制品保留和首次手动
     nonprod/mock 验证。
