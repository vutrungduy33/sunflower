# GitHub Actions CI/CD

## 1. 工作流总览

当前包含两个工作流：

1. `pr-stage-gate.yml`：PR 门禁（质量检查）
2. `deploy-backend.yml`：主分支/手动触发的 ECS 发布入口

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
5. 自动化测试
   - `cd sunflower-backend && mvn -B test`
   - `cd sunflower-admin-web && npm ci`
   - `cd sunflower-admin-web && npm run lint`
   - `cd sunflower-admin-web && npm run test`
   - `cd sunflower-admin-web && npm run build`
6. API 契约同步提醒（非阻塞）
   - 若后端 `Controller/DTO` 变更但未同步调用端/API 文档，工作流给出 warning

---

## 3. 生产部署流程（ECS）

工作流路径：`.github/workflows/deploy-backend.yml`

触发条件：

- `push` 到 `main`
- `workflow_dispatch`

`workflow_dispatch` 输入：

- `target`：`auto / backend / admin-web / nginx / all / bootstrap`
- `image_tag`：可选，指定历史 GHCR tag 进行回滚或重发
- `run_seed`：仅 `bootstrap` 目标使用，默认 `false`

执行流程：

1. `detect-targets`：
   - `push` 场景按改动文件自动识别 backend / admin-web / ingress。
   - `workflow_dispatch` 场景按 `target` 直接解析发布范围。
   - 若手动传入 `image_tag`，则跳过镜像构建，直接使用该 tag 发布。
2. `build-backend` / `build-admin-web`：
   - 仅在需要发布对应服务且未指定历史 `image_tag` 时执行。
   - 镜像推送到 GHCR，标签为 `commit sha`，`main` 额外推送 `latest`。
3. `deploy`：
   - 打包 `docker-compose.yml`、`deploy/nginx/**`、`.env.prod.example`、`.env.empty` 和 `scripts/**`。
   - 上传到 ECS 的 `$DEPLOY_PATH`。
   - 保留服务器本地 `$DEPLOY_PATH/.env.prod` 不被 workflow 覆盖。
   - 生成本次发布专用的 `$DEPLOY_PATH/.release.env`，只写入：
     - `BACKEND_IMAGE`
     - `ADMIN_WEB_IMAGE`
     - `SOURCE_SHA`
     - `DEPLOY_TARGET`
     - `RUN_SEED`
   - 先执行 `./scripts/validate_prod_env.sh` 校验服务器配置。
   - 常规发布执行 `./scripts/deploy_prod.sh <target>`。
   - 首次初始化执行 `./scripts/bootstrap_prod.sh`。

部署约束：

- GitHub Actions 不再下发业务运行时密钥。
- 业务配置全部由 ECS 本地 `.env.prod` 提供。
- 常规 prod 发布不再自动导入 `mvp_demo_seed.sql`。
- 若 `.env.prod` 缺失微信/短信关键配置，发布会直接失败。
- 若 `.env.prod` 缺失宿主机 HTTPS 证书路径，发布会直接失败。
- `WECHAT_AUTH_MOCK_ENABLED` 与 `WECHAT_MANUAL_PHONE_BIND_ENABLED` 在 prod 校验中必须为 `false`。

---

## 4. Secrets 与配置归属

### 4.1 GitHub Actions Secrets（仅部署通道）

必须配置：

- `ECS_HOST`
- `ECS_USER`
- `ECS_PORT`
- `ECS_SSH_KEY`
- `ECS_SSH_PASSPHRASE`
- `DEPLOY_PATH`
- `GHCR_USERNAME`
- `GHCR_TOKEN`

说明：

- GitHub 仅负责 SSH 进入 ECS、拉取 GHCR 镜像和触发脚本。
- 小程序认证、管理端短信、数据库口令、应用 token secret 等不再存放在 GitHub Secrets。

### 4.2 ECS 本地配置文件

服务器部署目录固定保留：

- `$DEPLOY_PATH/.env.prod`
- `$DEPLOY_PATH/.release.env`

其中：

- `.env.prod`：运维长期维护的真实生产配置
- `.release.env`：GitHub Actions 每次发布覆盖写入的镜像与发布元信息

完整变量清单、首次 bootstrap、回滚与 smoke test 说明见：

- [S19-Prod-Deployment-Config.md](/Users/chenyao/dev/miniapp/sunflower/docs/S19-Prod-Deployment-Config.md)

---

## 5. 本地校验命令

- `make stage-pre STAGE=Sx`
- `make stage-post STAGE=Sx`
- `docker compose --env-file .env.prod.example config`
- `bash -n scripts/deploy_lib.sh scripts/validate_prod_env.sh scripts/deploy_backend.sh scripts/deploy_admin_web.sh scripts/bootstrap_prod.sh scripts/deploy_prod.sh scripts/reload_host_nginx.sh scripts/start_backend_with_mvp_seed.sh scripts/start_admin_web.sh`
- `cd sunflower-admin-web && npm run build`

补充：

- `.env.prod.example` 只用于本地渲染校验与运维对照，不应直接作为线上密钥文件使用。
- deploy 脚本运行时会固定加载 `$DEPLOY_PATH/.release.env`；即使 `.env.prod` 来自 `.env.prod.example`，其中的 release metadata 占位值也不会覆盖当次发布写入的镜像信息。
- 若需要回滚 backend/admin-web，优先通过 `workflow_dispatch + image_tag=<历史 sha>` 完成，而不是在 ECS 上手工改 `docker-compose.yml`。
