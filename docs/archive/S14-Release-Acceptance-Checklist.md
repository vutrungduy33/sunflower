# S14 联调验收清单

## 验收前提

- 验收分支已通过 `PR Stage Gate`，并且对应 PR 的分支名与提交信息符合 Stage 规范。
- `main` 上待发布提交已触发 `.github/workflows/deploy-backend.yml`，或计划通过 `workflow_dispatch` 手动触发一次完整发布。
- GitHub Actions Secrets/Variables 已按 [docs/CI-CD.md](./CI-CD.md) 配置完成。
- ECS 上已存在宿主机 Nginx，且部署账号具备刷新站点配置与执行 Docker Compose 的权限。
- 小程序、管理后台、后端 API 使用同一套演示数据基线：`scripts/sql/mvp_demo_seed.sql`。

## 联调验收步骤

### 1. CI 门禁

- [ ] 在目标 PR 的 Actions 中确认 `PR Stage Gate` 全绿。
- [ ] 检查 `Backend automated tests`、`Web lint`、`Web tests`、`Web build` 均通过。
- [ ] 检查 `Stage post-check` 通过，且日志中包含 `release-assets PASS`。

### 2. 发布链路

- [ ] 在 `Deploy Services To ECS` 中确认 `detect-targets` 能识别本次发布目标。
- [ ] 若同时变更 backend 和 admin-web，确认 `build-backend` 与 `build-admin-web` 并行执行。
- [ ] 在 `deploy-backend-host` 与 `deploy-web-host` 日志中确认对应 self-hosted runner 已完成 bundle 同步。
- [ ] 若同时变更 backend 和 admin-web，确认 backend artifact 只在 ECS-2 下载，admin-web artifact 只在 ECS-1 下载。
- [ ] 在 `deploy-backend-host` 日志中确认 ECS-2 已完成 backend 发布并通过健康检查。
- [ ] 在 `deploy-web-host` 日志中确认 ECS-1 在 backend 健康后才执行 admin-web/Nginx 切换。
- [ ] 在 ECS-2 执行 `docker ps --format '{{.Names}} {{.Status}} {{.Ports}}' | grep 'sunflower-'`，确认 `sunflower-backend`、`sunflower-mysql` 健康。
- [ ] 在 ECS-1 执行 `docker ps --format '{{.Names}} {{.Status}} {{.Ports}}' | grep 'sunflower-'`，确认 `sunflower-admin-web` 健康。

### 3. 后端 API

- [ ] 访问对外 API 域名 `GET https://<api-domain>/api/health` 返回成功。
- [ ] 在 ECS-1 上执行 `curl http://<BACKEND_UPSTREAM_HOST>:<BACKEND_UPSTREAM_PORT>/api/health` 返回成功。
- [ ] 以演示账号完成一次登录，确认 token 可用于后续 API 请求。
- [ ] 创建一笔订单并完成支付、取消或售后查询中的任一闭环，确认响应结构与既有契约一致。
- [ ] 在 ECS-2 宿主机或容器日志中确认无启动失败、Flyway 迁移失败、seed 导入失败等错误。

### 4. 管理后台

- [ ] 打开管理后台首页，确认静态资源可加载，页面请求 `/api/health` 成功。
- [ ] 使用后台账号登录，确认受保护路由可访问，未登录状态会被重定向到登录页。
- [ ] 验证已上线页面至少各完成一次核心动作：
  - [ ] 房型管理：列表可加载。
  - [ ] 价格与库存管理：房型切换、日期选择、批量提交成功。
- [ ] 若本次发布仅包含 admin-web，确认部署日志中出现 `up -d --no-deps admin-web`，且未触发 ECS-2 backend 发布。

### 5. 小程序

- [ ] 将小程序 API Base URL 指向统一入口域名或 ECS 地址。
- [ ] 从首页进入预订流程，确认房型列表、详情、日历价格/库存展示正常。
- [ ] 提交订单并在订单中心查看状态变化，确认支付模拟、取消、改期或退款中的至少一条链路可用。
- [ ] 验证小程序错误兜底仍生效：接口失败时能看到明确提示，不出现空白页或崩溃。

## 发布后巡检

- [ ] 访问 `https://<admin-domain>/`、`https://<api-domain>/api/health`、`https://<admin-domain>/healthz` 均正常返回。
- [ ] 在 ECS-1 上执行 `sudo nginx -T | grep -n '127.0.0.1:18080\\|<BACKEND_UPSTREAM_HOST>:<BACKEND_UPSTREAM_PORT>'`，结果符合入口转发预期。
- [ ] 在 ECS-2 上执行 `docker compose -f docker-compose.backend.yml logs --tail=200 backend` 无持续报错或重启抖动。
- [ ] 在 ECS-1 上执行 `docker compose -f docker-compose.web.yml logs --tail=200 admin-web` 无持续报错或重启抖动。
- [ ] 在 GitHub 仓库的 Runners 页面确认 `ecs-backend` 与 `ecs-web` 两个 self-hosted runner 处于在线状态。
- [ ] 记录本次发布的 Git SHA、Actions Run URL、验证人、验证时间。

## 验收结论

- 发布提交：
- Actions Run：
- 验收时间：
- 验收人：
- 结论：
- 备注：
