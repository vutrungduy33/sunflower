# GitHub Actions CI/CD

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

执行流程：

1. `detect-targets`
   - `push` 场景按改动文件自动识别 backend / admin-web / ingress。
   - `workflow_dispatch` 场景按 `target` 直接解析发布范围。
   - 输出是否需要触发 backend host 与 web host 两条链路。
2. `build-backend` / `build-admin-web`
   - 两个镜像保持并行构建。
   - 常规发布会在 GitHub Hosted Runner 上构建镜像、推送 GHCR 备用 tag，并额外导出压缩后的镜像 artifact。
   - 若手动传入历史 `image_tag`，则跳过镜像构建与 artifact 生成，直接走既有 GHCR fallback。
3. `deploy-backend-host`
   - 运行在 `self-hosted + ecs-backend`。
   - 本机 checkout deployment bundle、同步到 `$BACKEND_DEPLOY_PATH`、下载 backend artifact、`docker load`，然后写 `.release.env` 并部署 backend。
   - `bootstrap` 时仅 backend host 执行 seed 导入。
4. `deploy-web-host`
   - 运行在 `self-hosted + ecs-web`。
   - 仅在 backend host 成功或被跳过后执行。
   - 本机 checkout deployment bundle、同步到 `$WEB_DEPLOY_PATH`、下载 admin-web artifact、`docker load`，然后部署 admin-web。
   - `target=all / nginx / bootstrap` 时最后再刷新宿主机 Nginx。

提效策略：

- 构建、打包 artifact 并行。
- 真正切换流量保持串行：`ECS-2 backend -> ECS-1 admin-web -> ECS-1 nginx reload`。
- 若只改 `sunflower-admin-web/**`，只触发 web host。
- 若只改 `sunflower-backend/**`，只触发 backend host。
- backend artifact 由 ECS-2 直接下载，admin-web artifact 由 ECS-1 直接下载，ECS-1 不再中转 backend 产物。

部署约束：

- GitHub Actions 不下发业务运行时密钥。
- 业务配置全部由两台 ECS 各自的本地 `.env.prod` 提供。
- backend host 的 `.env.prod` 固定使用 `DEPLOY_NODE_ROLE=backend`。
- web host 的 `.env.prod` 固定使用 `DEPLOY_NODE_ROLE=web`。
- 常规 prod 发布不自动导入 `mvp_demo_seed.sql`。
- web host 的宿主机 Nginx reload 只在 `target=all / nginx / bootstrap` 时执行。
- 常规 prod 发布主路径不依赖 GitHub Hosted Runner 直连 ECS，也不依赖 ECS 在发布时临时拉取 GHCR。

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
- self-hosted runner 会在目标主机本地下载 artifact、同步 bundle 并触发脚本。
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

完整变量清单、首次 bootstrap、回滚与 smoke test 说明见：

- [S19-Prod-Deployment-Config.md](/Users/chenyao/dev/miniapp/sunflower/docs/S19-Prod-Deployment-Config.md)

---

## 5. 本地校验命令

- `node scripts/check_deployment_approval_preflight.js`
- `ruby -e 'require "yaml"; YAML.load_file(".github/workflows/deploy-backend.yml")'`
- `docker compose -f docker-compose.backend.yml --env-file .env.prod.example config`
- `docker compose -f docker-compose.web.yml --env-file .env.prod.web.example config`
- `bash -n scripts/deploy_lib.sh scripts/validate_prod_env.sh scripts/deploy_backend.sh scripts/deploy_admin_web.sh scripts/bootstrap_prod.sh scripts/deploy_prod.sh scripts/reload_host_nginx.sh scripts/sync_deploy_bundle.sh scripts/execute_runner_deploy.sh scripts/start_backend_with_mvp_seed.sh scripts/start_admin_web.sh`
- `cd sunflower-backend && mvn -B test`
- `cd sunflower-admin-web && npm run build`

补充：

- `.env.prod.example` 与 `.env.prod.web.example` 只用于本地渲染校验与运维对照，不应直接作为线上密钥文件使用。
- deploy 脚本运行时会固定加载各自 `$DEPLOY_PATH/.release.env`；即使 `.env.prod` 中残留样板 release metadata，也不会覆盖当次发布镜像信息。
- 若需要回滚 backend/admin-web，优先通过 `workflow_dispatch + image_tag=<历史 sha>` 完成，而不是在 ECS 上手工改 compose 文件。
- `node scripts/check_deployment_approval_preflight.js` 只读分析当前分支相对
  `origin/main`/`main` 的部署影响面和人工审批边界，不会 push、触发
  `workflow_dispatch` 或修改生产。
