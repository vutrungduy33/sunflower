# GitHub Actions CI/CD

## 1. 工作流总览

当前包含两个工作流：

1. `pr-stage-gate.yml`：PR 门禁（质量检查）
2. `deploy-backend.yml`：主分支部署到 ECS（统一入口发布，按变更目标自动发布 backend、admin-web，并在宿主机 Nginx 上收敛公网入口）

---

## 2. PR 门禁（强制）

工作流路径：`.github/workflows/pr-stage-gate.yml`

触发条件：

- `pull_request`（opened / synchronize / reopened / ready_for_review / edited）
- 草稿 PR（draft）不会执行门禁

门禁项：

1. 分支命名规范检查
   - 必须匹配：`codex/s<stage>-<slug>`
   - 示例：`codex/s14-web-admin-ecs-deploy`

2. 提交信息规范检查
   - PR 内所有 commit subject 必须以前缀 `[Sx]` 开头
   - 示例：`[S14] add web ecs deployment`

3. Stage Guard 检查
   - `make stage-pre STAGE=Sx`
   - `make stage-post STAGE=Sx`

4. 自动化测试
   - `cd sunflower-backend && mvn -B test`
   - `cd sunflower-admin-web && npm ci`
   - `cd sunflower-admin-web && npm run lint`
   - `cd sunflower-admin-web && npm run test`
   - `cd sunflower-admin-web && npm run build`

5. API 契约同步提醒（非阻塞）
   - 若后端 `Controller/DTO` 变更但未同步小程序 API 调用或 API 文档，工作流给出 warning

说明：

- PR 必须通过以上门禁才能合并（需在仓库分支保护规则中把该 workflow 设为 Required）。

---

## 3. 部署流程（ECS）

工作流路径：`.github/workflows/deploy-backend.yml`

触发条件：

- `push` 到 `main`
- 或手动触发 `workflow_dispatch`
- push 变更命中以下任一范围时自动执行：
  - `sunflower-backend/**`
  - `sunflower-admin-web/**`
  - `deploy/nginx/**`
  - `docker-compose.yml`
  - `scripts/start_backend_with_mvp_seed.sh`
  - `scripts/start_admin_web.sh`
  - `scripts/reload_host_nginx.sh`
  - `scripts/sql/**`
  - `.github/workflows/deploy-backend.yml`

执行流程：

1. `detect-targets` job 以最小深度 checkout 当前 `GITHUB_SHA`，仅在 push 场景额外按需抓取 `github.event.before` 对应 commit，用 `git diff` 识别本次 push 是否命中 backend、admin-web、宿主机入口配置或它们的组合。
2. 若命中 backend，则由独立的 `build-backend` job 以 sparse checkout 仅拉取 `.github` 与 `sunflower-backend`，构建 `sunflower-backend` Docker 镜像并推送到 GHCR（标签：`source sha`，主分支额外推 `latest`）。
   - backend 构建使用独立的 `type=gha,scope=sunflower-backend` cache，避免与 admin-web 共享默认 `buildkit` scope 而互相覆盖。
   - Dockerfile 先基于 `pom.xml` 执行 `dependency:go-offline`，让依赖下载层可复用，降低后续重复构建耗时。
   - GitHub-hosted runner 默认使用 Maven Central；只有显式把 `MAVEN_MIRROR=aliyun` 传给 backend Docker build 时，才会启用 `sunflower-backend/.mvn/settings-docker.xml` 中的阿里云 Maven 公共镜像。
3. 若命中 admin-web，则由独立的 `build-admin-web` job 以 sparse checkout 仅拉取 `.github` 与 `sunflower-admin-web`，构建 `sunflower-admin-web` Docker 镜像并推送到 GHCR（标签：`source sha`，主分支额外推 `latest`）。
   - admin-web 构建使用独立的 `type=gha,scope=sunflower-admin-web` cache。
4. backend 与 admin-web 构建 job 满足条件时并行执行，避免双镜像发布串行累加总时长。
5. `deploy` job 以 `fetch-depth: 1` 和 sparse checkout 仅拉取 `docker-compose.yml`、`deploy/nginx/**`、`scripts/**`，在 Runner 打包 deployment bundle（`docker-compose.yml`、宿主机 Nginx 模板、部署脚本、seed SQL），再通过 SCP 上传到 ECS 部署目录。
6. 在 ECS 解压 deployment bundle，并写入本次发布的 `source sha` 标记文件。
7. 若本次需要拉取新镜像，则在 ECS 登录 GHCR。
8. 若本次包含 backend 发布，则先执行 `scripts/start_backend_with_mvp_seed.sh`：启动 MySQL、拉取并启动 backend、等待健康检查、导入 `scripts/sql/mvp_demo_seed.sql`。
9. 若本次包含 admin-web 发布，则在 backend 健康后执行 `scripts/start_admin_web.sh`：确认 `http://127.0.0.1:${BACKEND_HOST_PORT:-8080}/api/health` 可用，再拉取并执行 `docker compose up -d --no-deps admin-web`，避免 admin-only 发布误触发 backend 的本地构建回退路径。
10. 最后统一执行 `scripts/reload_host_nginx.sh`：确认 backend 和 admin-web 都已健康，再把宿主机 Nginx 入口切到最新的本机回环端口。

部署顺序约束：

- 同一次 push 若同时命中 backend 和 admin-web，ECS 上固定按“backend -> admin-web -> host nginx”顺序部署。
- 对公网暴露的只有宿主机 Nginx；`mysql`、`backend`、`admin-web` 默认只绑定 ECS 本机回环地址。
- 宿主机 Nginx 负责把 `/` 转发到 `127.0.0.1:${ADMIN_WEB_HOST_PORT:-18080}`，把 `/api/` 转发到 `127.0.0.1:${BACKEND_HOST_PORT:-8080}`。
- Web 管理端和小程序都应访问统一入口的 `/api`，而不是直接访问 `admin-web` 容器或公网 `8080`。

---

## 4. 必要 Secrets（部署）

在 GitHub 仓库 `Settings -> Secrets and variables -> Actions` 添加：

- `ECS_HOST`：ECS 公网 IP
- `ECS_USER`：SSH 用户（例如 `root`）
- `ECS_PORT`：SSH 端口（默认 `22`）
- `ECS_SSH_KEY`：登录 ECS 的私钥内容
- `ECS_SSH_PASSPHRASE`：若 `ECS_SSH_KEY` 是带口令的私钥，则需同步配置该口令；未加密私钥可留空
- `DEPLOY_PATH`：服务器部署目录（例如 `/opt/sunflower`）
- `GHCR_USERNAME`：用于 ECS 拉取 GHCR 镜像的 GitHub 用户名（建议机器账号）
- `GHCR_TOKEN`：用于 ECS 拉取 GHCR 镜像的 Token（至少 `read:packages` 权限）
- `AUTH_TOKEN_SECRET`：后端签名 token 密钥（backend 部署必填）

可选 Secrets：

- `AUTH_TOKEN_TTL_SECONDS`：token 过期秒数（默认 `7200`）
- `WECHAT_AUTH_MOCK_ENABLED`：是否启用微信登录 mock（`true/false`，默认 `false`）
- `WECHAT_APP_ID`：微信小程序 `appId`（当 `WECHAT_AUTH_MOCK_ENABLED=false` 时建议配置）
- `WECHAT_APP_SECRET`：微信小程序 `appSecret`（当 `WECHAT_AUTH_MOCK_ENABLED=false` 时建议配置）
- `WECHAT_JSCODE2SESSION_URL`：微信 `jscode2session` 地址（默认官方地址）
- `WECHAT_MOCK_OPENID_PREFIX`：mock openid 前缀（默认 `mock_openid_`）

可选 Variables：

- `MYSQL_HOST_PORT`：ECS 本机 MySQL 端口（默认 `3306`，仅回环可达）
- `BACKEND_HOST_PORT`：ECS 本机 backend 端口（默认 `8080`，仅回环可达）
- `ADMIN_WEB_HOST_PORT`：ECS 本机 admin-web 端口（默认 `18080`，仅回环可达）
- `HOST_NGINX_SITE_NAME`：宿主机 Nginx 站点名（默认 `sunflower`）

说明：

- workflow 在构建镜像时使用 Actions 自带 `GITHUB_TOKEN` 推送 GHCR，不需要额外配置推送凭据。
- 当前 workflow 的 GitHub-hosted 构建默认使用 Maven Central；如果后续进入阿里云 self-hosted runner 阶段，再按环境把 backend Docker build 的 `MAVEN_MIRROR` 切到 `aliyun`。
- admin-web 当前无需单独的部署 secret；宿主机 Nginx 是唯一公网入口，负责把 `/` 转发到 admin-web，把 `/api` 转发到 backend。
- 小程序默认也应指向统一入口，例如 `http://<ecs-host>` 或未来的 `https://<your-domain>`，由 `/api/*` 路由进入 backend。
- 若 deploy job 在 `Deploy via SSH` 阶段报 `ssh: unable to authenticate, attempted methods [none publickey]`，优先检查 `ECS_SSH_KEY` 是否与 ECS `authorized_keys` 匹配；若私钥带口令，还需配置 `ECS_SSH_PASSPHRASE`。
- 当前 workflow 不再要求 ECS 主机可访问 GitHub 拉取仓库源码；只要求 SSH 连通和 GHCR 拉镜像权限正常。
- 当前 workflow 会覆盖 `/etc/nginx/sites-available/${HOST_NGINX_SITE_NAME:-sunflower}` 并刷新 `/etc/nginx/sites-enabled/${HOST_NGINX_SITE_NAME:-sunflower}`。部署用户需要具备 `root` 或 `sudo` 权限。
- ECS 正常部署路径只拉取 GHCR 镜像，不在服务器上执行 Maven 构建；只有缺失 `BACKEND_IMAGE` 的本地构建回退路径，才会使用同一份 Dockerfile/Maven 镜像配置。
- workflow 已把 backend/admin-web 镜像构建拆成独立 job，并通过 scoped GHA cache 避免两个镜像的 cache 互相覆盖。
- admin-only 部署会复用现有 backend 容器；如果 backend 未运行或健康检查失败，`scripts/start_admin_web.sh` 会直接失败，而不会再尝试本地构建 backend。

---

## 5. 本地对应命令

- Stage 前检查：`make stage-pre STAGE=Sx`
- Stage 后检查：`make stage-post STAGE=Sx`
- 分支/提交规范检查：`make convention-check BRANCH=codex/s1-xxx BASE_SHA=<base> HEAD_SHA=<head>`
- API 契约提醒检查：`make api-contract-check RANGE=main..HEAD`
- Web 本地校验：
  - `cd sunflower-admin-web && npm run lint`
  - `cd sunflower-admin-web && npm run test`
  - `cd sunflower-admin-web && npm run build`
- 部署脚本语法检查：
  - `bash -n scripts/start_backend_with_mvp_seed.sh`
  - `bash -n scripts/start_admin_web.sh`
  - `bash -n scripts/reload_host_nginx.sh`
