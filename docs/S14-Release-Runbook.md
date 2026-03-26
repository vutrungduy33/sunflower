# S14 发布与回滚说明

## 发布前检查

- 确认待发布分支已经合入 `main`，且对应 PR 的 `PR Stage Gate` 全绿。
- 确认 [docs/CI-CD.md](./CI-CD.md) 中列出的 GitHub Actions Secrets 已配置完成。
- 确认 ECS 主机可通过 SSH 连接，部署目录存在且剩余磁盘空间足够。
- 确认 GHCR 凭据仍可拉取镜像，避免部署阶段卡在 `docker login` 或 `docker pull`。
- 确认 ECS 本地 `$DEPLOY_PATH/.env.prod` 已存在，并已按 [docs/S19-Prod-Deployment-Config.md](./S19-Prod-Deployment-Config.md) 填好真实配置。
- 确认微信小程序合法域名、管理端域名、短信模板、腾讯云凭据与 prod 配置一致。
- 准备本次发布对应的验收记录，使用 [docs/S14-Release-Acceptance-Checklist.md](./S14-Release-Acceptance-Checklist.md) 逐项打勾。

## 标准发布步骤

1. 将目标变更合入 `main`，等待 GitHub Actions 自动触发 `Deploy Services To ECS`。
2. 如果需要重发同一提交或做回滚，进入 GitHub Actions 手动执行 `workflow_dispatch`。
3. 在 `workflow_dispatch` 中按需填写：
   - `target`
   - `image_tag`
   - `run_seed`
4. 在 `detect-targets` 中确认本次命中的发布目标是否正确：
   - backend 变更：构建并发布 `sunflower-backend` 镜像
   - admin-web 变更：构建并发布 `sunflower-admin-web` 镜像
   - ingress 变更：刷新宿主机 Nginx 入口模板
5. 等待 `build-backend`、`build-admin-web` 完成；若本次使用历史 `image_tag`，这两个 job 应显示 `skipped`。
6. 进入 `deploy` job，确认 deployment bundle 上传完成，并在 ECS 上：
   - 解压 bundle
   - 写入 `.release.env`
   - 执行 `validate_prod_env.sh`
   - 执行 `deploy_prod.sh` 或 `bootstrap_prod.sh`
7. 常规 prod 发布不应导入 demo seed；只有 `target=bootstrap` 且 `run_seed=true` 时才允许导入 `scripts/sql/mvp_demo_seed.sql`。
8. 发布完成后，按 [docs/S14-Release-Acceptance-Checklist.md](./S14-Release-Acceptance-Checklist.md) 执行一轮人工验收并记录结果。

## 回滚步骤

### 1. 仅回滚管理后台

1. 在 GHCR 中找到上一个稳定的 `sunflower-admin-web` 镜像标签。
2. 通过 GitHub Actions 重新触发 `workflow_dispatch`：
   - `target=admin-web`
   - `image_tag=<stable-tag>`
3. workflow 会自动写入 `.release.env` 并执行 `scripts/deploy_prod.sh admin-web`。
4. 复跑管理后台与 `/api/health` 巡检。

### 2. 仅回滚后端

1. 在 GHCR 中找到上一个稳定的 `sunflower-backend` 镜像标签。
2. 通过 GitHub Actions 重新触发 `workflow_dispatch`：
   - `target=backend`
   - `image_tag=<stable-tag>`
3. workflow 会自动写入 `.release.env` 并执行 `scripts/deploy_prod.sh backend`。
4. 若当前前端依赖新接口且与旧后端不兼容，不执行 admin-web 回滚前不要重新开放流量。
5. 完成后检查 `GET /api/health`、核心下单 API、小程序主链路。

### 3. 整体回滚

1. 同时准备 backend 与 admin-web 的上一个稳定镜像标签。
2. 通过 GitHub Actions 重新触发 `workflow_dispatch`：
   - `target=all`
   - `image_tag=<stable-tag>`
3. workflow 会按“后端 -> 管理后台 -> 宿主机 Nginx”顺序执行回滚，保持与标准发布一致。
4. 回滚完成后重新执行一轮最小验收：
   - `/healthz`
   - `/api/health`
   - 管理后台登录
   - 小程序下单主链路

## 故障定位

- `detect-targets` 误判：检查本次提交是否命中 `.github/workflows/deploy-backend.yml`、`docker-compose.yml`、脚本或对应模块目录。
- GHCR 拉镜像失败：检查 `GHCR_USERNAME`、`GHCR_TOKEN` 是否过期，ECS 是否能访问 `ghcr.io`。
- SSH 鉴权失败：检查 `ECS_SSH_KEY`、`ECS_SSH_PASSPHRASE`、ECS `authorized_keys`。
- `validate_prod_env.sh` 失败：检查 `.env.prod` 是否缺失微信、短信、域名或 secret 配置。
- backend 启动失败：检查数据库连通性、Flyway 迁移日志，以及微信/短信配置是否与 prod 要求一致。
- admin-web 启动失败：检查 backend 健康检查是否先通过，以及 `docker compose up -d --no-deps admin-web` 日志。
- 宿主机入口异常：检查 `/etc/nginx/sites-available/${HOST_NGINX_SITE_NAME:-sunflower}` 是否已刷新，并执行 `sudo nginx -t`。

## 变更记录

- 2026-03-13：补齐正式发布 Runbook 与联调验收清单，并纳入 GitHub Actions / Stage Guard 校验。
- 2026-03-24：发布配置收口到 ECS 本地 `.env.prod`，新增 `.release.env`、`bootstrap`/常规发布拆分与基于 `workflow_dispatch + image_tag` 的标准回滚入口。
