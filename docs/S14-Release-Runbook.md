# S14 发布与回滚说明

## 发布前检查

- 确认待发布分支已经合入 `main`，且对应 PR 的 `PR Stage Gate` 全绿。
- 确认 [docs/CI-CD.md](./CI-CD.md) 中列出的 GitHub Actions Secrets 与 self-hosted runner label 已配置完成。
- 确认 ECS-1（web）与 ECS-2（backend）上的 self-hosted runner 在线，部署目录存在且 runner 用户具备 Docker 与部署目录写权限。
- 若计划使用 `image_tag` 回滚，确认 GHCR 凭据仍可拉取镜像；常规 artifact 发布不依赖 GHCR。
- 确认两台 ECS 本地 `$DEPLOY_PATH/.env.prod` 已存在，并已按 [docs/S19-Prod-Deployment-Config.md](./S19-Prod-Deployment-Config.md) 填好真实配置。
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
   - ingress 变更：刷新 ECS-1 宿主机 Nginx 入口模板
5. 等待 `build-backend`、`build-admin-web` 完成；若本次使用历史 `image_tag`，这两个 job 应显示 `skipped`。
6. 进入 `deploy-backend-host`，确认 ECS-2 上：
   - self-hosted runner 成功 checkout 并同步 deployment bundle
   - 若本次重建 backend，已下载并 `docker load` backend artifact
   - 写入 `.release.env`
   - 执行 `validate_prod_env.sh`
   - 执行 `deploy_prod.sh` 或 `bootstrap_prod.sh`
   - backend 健康检查通过
7. 进入 `deploy-web-host`，确认 ECS-1 上：
   - self-hosted runner 成功 checkout 并同步 deployment bundle
   - 若本次重建 admin-web，已下载并 `docker load` admin-web artifact
   - 先检查 ECS-2 backend upstream 健康
   - 执行 `deploy_prod.sh` 或 `bootstrap_prod.sh`
   - 在需要时刷新宿主机 Nginx
8. 常规 prod 发布不应导入 demo seed；只有 `target=bootstrap` 且 `run_seed=true` 时才允许导入 `scripts/sql/mvp_demo_seed.sql`。
9. 发布完成后，按 [docs/S14-Release-Acceptance-Checklist.md](./S14-Release-Acceptance-Checklist.md) 执行一轮人工验收并记录结果。

## 回滚步骤

### 1. 仅回滚管理后台

1. 在 GHCR 中找到上一个稳定的 `sunflower-admin-web` 镜像标签。
2. 通过 GitHub Actions 重新触发 `workflow_dispatch`：
   - `target=admin-web`
   - `image_tag=<stable-tag>`
3. workflow 只会重发 ECS-1 的 web 链路，不触碰 ECS-2 backend。
4. 复跑管理后台与 `/api/health` 巡检。

### 2. 仅回滚后端

1. 在 GHCR 中找到上一个稳定的 `sunflower-backend` 镜像标签。
2. 通过 GitHub Actions 重新触发 `workflow_dispatch`：
   - `target=backend`
   - `image_tag=<stable-tag>`
3. workflow 只会重发 ECS-2 backend 链路，不重启 admin-web。
4. 完成后检查 `GET /api/health`、核心下单 API、小程序主链路。

### 3. 整体回滚

1. 准备 backend 与 admin-web 的稳定镜像标签。
2. 通过 GitHub Actions 重新触发 `workflow_dispatch`：
   - `target=all`
   - `image_tag=<stable-tag>`
3. workflow 会按“ECS-2 backend -> ECS-1 admin-web -> ECS-1 Nginx”顺序执行回滚。
4. 回滚完成后重新执行一轮最小验收：
   - `https://<api-domain>/api/health`
   - 管理后台登录
   - 小程序下单主链路

## 故障定位

- `detect-targets` 误判：检查本次提交是否命中 `.github/workflows/deploy-backend.yml`、`docker-compose.backend.yml`、`docker-compose.web.yml`、脚本或对应模块目录。
- backend host bundle 缺失：检查 ECS-2 的 self-hosted runner checkout 与 `scripts/sync_deploy_bundle.sh` 是否成功。
- web host bundle 缺失：检查 ECS-1 的 self-hosted runner checkout 与 `scripts/sync_deploy_bundle.sh` 是否成功。
- artifact 下载失败：检查对应 self-hosted runner 是否能访问 GitHub Actions artifact 服务。
- GHCR 拉镜像失败：常规发布不应命中；若是 `image_tag` 回滚，检查 `GHCR_USERNAME`、`GHCR_TOKEN` 是否过期，ECS 是否能访问 `ghcr.io`。
- runner 未执行：检查 `ecs-backend` / `ecs-web` label 是否注册正确，runner 用户是否具备 Docker 与部署目录权限。
- `validate_prod_env.sh` 失败：检查对应节点 `.env.prod` 是否缺失角色相关配置，尤其是 `DEPLOY_NODE_ROLE`。
- backend 启动失败：检查数据库连通性、Flyway 迁移日志，以及微信/短信配置是否与 prod 要求一致。
- admin-web 启动失败：检查 ECS-1 到 ECS-2 的 `BACKEND_UPSTREAM_HOST:BACKEND_UPSTREAM_PORT` 是否可达，以及 `docker compose -f docker-compose.web.yml logs --tail=200 admin-web`。
- 宿主机入口异常：检查 `/etc/nginx/sites-available/${HOST_NGINX_SITE_NAME:-sunflower}` 是否已刷新，并执行 `sudo nginx -t`。

## 变更记录

- 2026-03-13：补齐正式发布 Runbook 与联调验收清单，并纳入 GitHub Actions / Stage Guard 校验。
- 2026-03-24：发布配置收口到 ECS 本地 `.env.prod`，新增 `.release.env`、`bootstrap`/常规发布拆分与基于 `workflow_dispatch + image_tag` 的标准回滚入口。
- 2026-03-27：升级为双 ECS 发布 Runbook，构建/上传并行，正式切流固定为“backend -> admin-web -> nginx”。
- 2026-03-27：发布主路径切换为“GitHub artifact + 双 self-hosted runner 本机部署”，常规发布不再依赖公网 SSH/SCP 与远端 GHCR 拉取。
