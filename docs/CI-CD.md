# GitHub Actions CI/CD

## 1. 工作流总览

当前包含两个工作流：

1. `pr-stage-gate.yml`：PR 门禁（质量检查）
2. `deploy-backend.yml`：主分支/手动触发的双 ECS 发布入口

---

## 2. PR 门禁（强制）

工作流路径：`.github/workflows/pr-stage-gate.yml`

触发条件：

- `pull_request`（opened / synchronize / reopened / ready_for_review / edited）
- 草稿 PR（draft）不会执行门禁

门禁项：

1. 分支命名规范检查
   - 必须匹配：`codex/s<stage>-<slug>`
2. 提交信息规范检查
   - PR 内所有 commit subject 必须以前缀 `[Sx]` 开头
3. Stage Guard 检查
   - `make stage-pre STAGE=Sx`
   - `make stage-post STAGE=Sx`
4. 发布交付物检查
   - `./scripts/check_release_assets.sh`
5. 小程序仓库配置守卫
   - `./scripts/check_miniapp_project_config.sh`
6. 自动化测试
   - `cd sunflower-backend && mvn -B test`
   - `cd sunflower-admin-web && npm ci`
   - `cd sunflower-admin-web && npm run lint`
   - `cd sunflower-admin-web && npm run test`
   - `cd sunflower-admin-web && npm run build`
7. API 契约同步提醒（非阻塞）
   - 若后端 `Controller/DTO` 变更但未同步调用端/API 文档，工作流给出 warning

补充说明：

- `sunflower-miniapp/project.config.json` 在仓库中必须固定使用占位值 `touristappid`，避免把真实微信小程序 `appid` 提交入库。
- 若本地联调需要真实小程序身份，请只在本地工作区临时替换 `project.config.json`，提交前恢复为 `touristappid`。

---

## 3. 生产部署流程（双 ECS）

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

触发条件：

- `push` 到 `main`
- `workflow_dispatch`

`workflow_dispatch` 输入：

- `target`：`auto / backend / admin-web / nginx / all / bootstrap`
- `image_tag`：可选，指定历史 GHCR tag 进行回滚或重发
- `run_seed`：仅 `bootstrap` 目标使用，默认 `false`

执行流程：

1. `detect-targets`
   - `push` 场景按改动文件自动识别 backend / admin-web / ingress。
   - `workflow_dispatch` 场景按 `target` 直接解析发布范围。
   - 输出是否需要触发 backend host 与 web host 两条链路。
2. `build-backend` / `build-admin-web`
   - 两个镜像保持并行构建。
   - 若手动传入历史 `image_tag`，则跳过镜像构建，直接发布指定 tag。
3. `prepare-backend-host` / `prepare-web-host`
   - 两台 ECS 的 deployment bundle 上传并行执行。
   - 上传内容包括 `docker-compose.backend.yml`、`docker-compose.web.yml`、Nginx 模板、示例 env 与部署脚本。
4. `deploy-backend-host`
   - 先在 ECS-2 写入 `.release.env`、校验 `.env.prod`、拉取 backend 镜像并部署 backend。
   - `bootstrap` 时仅 backend host 执行 seed 导入。
5. `deploy-web-host`
   - 仅在 backend host 成功或被跳过后执行。
   - 在 ECS-1 校验远端 backend upstream 健康，再部署 admin-web。
   - `target=all / nginx / bootstrap` 时最后再刷新宿主机 Nginx。

提效策略：

- 构建、推送、bundle 上传并行。
- 真正切换流量保持串行：`ECS-2 backend -> ECS-1 admin-web -> ECS-1 nginx reload`。
- 若只改 `sunflower-admin-web/**`，只触发 web host。
- 若只改 `sunflower-backend/**`，只触发 backend host。

部署约束：

- GitHub Actions 不下发业务运行时密钥。
- 业务配置全部由两台 ECS 各自的本地 `.env.prod` 提供。
- backend host 的 `.env.prod` 固定使用 `DEPLOY_NODE_ROLE=backend`。
- web host 的 `.env.prod` 固定使用 `DEPLOY_NODE_ROLE=web`。
- 常规 prod 发布不自动导入 `mvp_demo_seed.sql`。
- web host 的宿主机 Nginx reload 只在 `target=all / nginx / bootstrap` 时执行。

---

## 4. Secrets 与配置归属

### 4.1 GitHub Actions Secrets（仅部署通道）

backend host 必填：

- `BACKEND_ECS_HOST`
- `BACKEND_ECS_USER`
- `BACKEND_ECS_PORT`
- `BACKEND_ECS_SSH_KEY`
- `BACKEND_ECS_SSH_PASSPHRASE`
- `BACKEND_DEPLOY_PATH`

web host 必填：

- `WEB_ECS_HOST`
- `WEB_ECS_USER`
- `WEB_ECS_PORT`
- `WEB_ECS_SSH_KEY`
- `WEB_ECS_SSH_PASSPHRASE`
- `WEB_DEPLOY_PATH`

公共必填：

- `GHCR_USERNAME`
- `GHCR_TOKEN`

说明：

- GitHub 仅负责 SSH 进入 ECS、拉取 GHCR 镜像和触发脚本。
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

- `make stage-pre STAGE=Sx`
- `make stage-post STAGE=Sx`
- `ruby -e 'require "yaml"; YAML.load_file(".github/workflows/deploy-backend.yml")'`
- `docker compose -f docker-compose.backend.yml --env-file .env.prod.example config`
- `docker compose -f docker-compose.web.yml --env-file .env.prod.web.example config`
- `bash -n scripts/deploy_lib.sh scripts/validate_prod_env.sh scripts/deploy_backend.sh scripts/deploy_admin_web.sh scripts/bootstrap_prod.sh scripts/deploy_prod.sh scripts/reload_host_nginx.sh scripts/start_backend_with_mvp_seed.sh scripts/start_admin_web.sh`
- `cd sunflower-backend && mvn -B test`
- `cd sunflower-admin-web && npm run build`

补充：

- `.env.prod.example` 与 `.env.prod.web.example` 只用于本地渲染校验与运维对照，不应直接作为线上密钥文件使用。
- deploy 脚本运行时会固定加载各自 `$DEPLOY_PATH/.release.env`；即使 `.env.prod` 中残留样板 release metadata，也不会覆盖当次发布镜像信息。
- 若需要回滚 backend/admin-web，优先通过 `workflow_dispatch + image_tag=<历史 sha>` 完成，而不是在 ECS 上手工改 compose 文件。
