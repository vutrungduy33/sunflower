# S19 生产部署与配置说明

## 1. 目标

S19 之后，生产部署固定采用双 ECS + self-hosted runner 链路：

`GitHub Hosted Runner(build) -> GitHub artifact -> ECS-2(self-hosted runner, backend/mysql) -> ECS-1(self-hosted runner, admin-web/nginx) -> 公网域名`

职责边界：

- GitHub Actions：
  - 并行构建镜像
  - 上传 backend/admin-web 镜像 artifact
  - 控制“先 backend、后 admin-web、最后 nginx”的串行切流
- ECS-2（backend 节点）：
  - 保存 backend 专用 `.env.prod`
  - 运行 `self-hosted + ecs-backend` runner
  - 运行 `docker-compose.backend.yml`
  - 承载 `mysql` 与 `backend`
- ECS-1（web 节点）：
  - 保存 web 专用 `.env.prod`
  - 运行 `self-hosted + ecs-web` runner
  - 运行 `docker-compose.web.yml`
  - 承载 `admin-web` 与宿主机 Nginx
  - 通过内网访问 ECS-2 backend upstream

---

## 2. 服务器文件布局

两台主机的部署目录都固定包含：

- `$DEPLOY_PATH/.env.prod`
- `$DEPLOY_PATH/.release.env`
- `$DEPLOY_PATH/docker-compose.backend.yml`
- `$DEPLOY_PATH/docker-compose.web.yml`
- `$DEPLOY_PATH/deploy/nginx/sunflower-host.conf.template`
- `$DEPLOY_PATH/scripts/*`

文件职责：

- `.env.prod`
  - 运维手工维护
  - 不由 GitHub Actions 覆盖
  - backend 节点与 web 节点内容不同，但都必须显式声明 `DEPLOY_NODE_ROLE`
- `.release.env`
  - 成功发布后自动覆盖
  - 仅保存镜像与发布元信息
  - 不保存业务 secret
  - runner 部署过程中会先生成 `.release.env.pending`，校验与部署全部成功后
    再原子替换正式 `.release.env`；失败时 pending 文件会清理，正式
    `.release.env` 保持上一次成功发布的值

`.release.env` 当前字段：

- `BACKEND_IMAGE`
- `ADMIN_WEB_IMAGE`
- `SOURCE_SHA`
- `DEPLOY_TARGET`
- `RUN_SEED`

---

## 3. `.env.prod` 模板与变量

可提交模板见：

- backend 节点：[.env.prod.example](/Users/chenyao/dev/miniapp/sunflower/.env.prod.example)
- web 节点：[.env.prod.web.example](/Users/chenyao/dev/miniapp/sunflower/.env.prod.web.example)

### 3.1 backend 节点（ECS-2）

固定值：

- `DEPLOY_NODE_ROLE=backend`
- `BACKEND_BIND_HOST=0.0.0.0`

必填：

- `MYSQL_ROOT_PASSWORD`
- `MYSQL_DATABASE`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `AUTH_TOKEN_SECRET`
- `AUTH_TOKEN_TTL_SECONDS`
- `WECHAT_AUTH_MOCK_ENABLED=false`
- `WECHAT_APP_ID`
- `WECHAT_APP_SECRET`
- `WECHAT_JSCODE2SESSION_URL`
- `WECHAT_STABLE_ACCESS_TOKEN_URL`
- `WECHAT_GET_PHONE_NUMBER_URL`
- `WECHAT_MANUAL_PHONE_BIND_ENABLED=false`
- `ADMIN_ACTIVATION_ALLOWLIST`
- `ADMIN_AUTH_TOKEN_SECRET`
- `ADMIN_AUTH_TOKEN_TTL_SECONDS`
- `ADMIN_SMS_PROVIDER=tencent`
- `ADMIN_SMS_CODE_LENGTH`
- `ADMIN_SMS_CODE_TTL_SECONDS`
- `ADMIN_SMS_RESEND_COOLDOWN_SECONDS`
- `ADMIN_SMS_HOURLY_SEND_LIMIT`
- `ADMIN_SMS_DAILY_SEND_LIMIT`
- `ADMIN_SMS_MAX_VERIFY_ATTEMPTS`
- `ADMIN_LOGIN_FAILURE_LIMIT`
- `ADMIN_LOGIN_LOCK_SECONDS`
- `TENCENT_SMS_SECRET_ID`
- `TENCENT_SMS_SECRET_KEY`
- `TENCENT_SMS_REGION`
- `TENCENT_SMS_SDK_APP_ID`
- `TENCENT_SMS_SIGN_NAME`
- `TENCENT_SMS_TEMPLATE_ID_ACTIVATE`
- `TENCENT_SMS_TEMPLATE_ID_RESET_PASSWORD`
- `BACKEND_HOST_PORT`

说明：

- backend 节点不需要宿主机 Nginx 相关变量。
- MySQL 建议继续只绑定 `127.0.0.1`。
- 通过安全组限制 `8080` 仅允许 ECS-1 访问。

### 3.2 web 节点（ECS-1）

固定值：

- `DEPLOY_NODE_ROLE=web`

必填：

- `ADMIN_WEB_HOST_PORT`
- `BACKEND_UPSTREAM_HOST`
- `BACKEND_UPSTREAM_PORT`

常用：

- `BACKEND_UPSTREAM_SCHEME=http`
- `ADMIN_WEB_APP_TITLE`
- `ADMIN_WEB_API_BASE_URL=/api`
- `ADMIN_WEB_API_PROXY_TARGET=http://172.25.121.83:8080`
- `ADMIN_WEB_BIND_HOST`
- `HOST_NGINX_ENABLED`
- `HOST_NGINX_SITE_NAME`
- `HOST_NGINX_ADMIN_SERVER_NAME`
- `HOST_NGINX_API_SERVER_NAME`
- `HOST_NGINX_ADMIN_TLS_CERT_PATH`
- `HOST_NGINX_ADMIN_TLS_KEY_PATH`
- `HOST_NGINX_API_TLS_CERT_PATH`
- `HOST_NGINX_API_TLS_KEY_PATH`

说明：

- `HOST_NGINX_ENABLED=true` 时，deploy 会分别校验 admin/api 域名的证书文件并刷新宿主机 Nginx。
- `HOST_NGINX_ENABLED=false` 时，deploy 会跳过 Nginx 校验与 reload，仅验证 admin-web 容器链路。
- 管理端浏览器默认继续走同域 `/api`，由 ECS-1 Nginx 反代到 ECS-2，避免额外 CORS 改造。
- 小程序正式请求域名应配置为 `https://<HOST_NGINX_API_SERVER_NAME>`。

---

## 4. 首次部署（Bootstrap）

首次上线固定分两台主机准备：

1. 在 ECS-2 部署目录放置 backend 节点 `.env.prod`
2. 在 ECS-1 部署目录放置 web 节点 `.env.prod`
3. 确认 ECS-2 安装并注册 `self-hosted + ecs-backend` runner，ECS-1 安装并注册 `self-hosted + ecs-web` runner
4. 手动触发 GitHub Actions：
   - `target=bootstrap`
   - `run_seed=false` 或 `true`

建议步骤：

1. 在两台机器分别 `mkdir -p $DEPLOY_PATH`
2. ECS-2 复制 [.env.prod.example](/Users/chenyao/dev/miniapp/sunflower/.env.prod.example) 为 `.env.prod`
3. ECS-1 复制 [.env.prod.web.example](/Users/chenyao/dev/miniapp/sunflower/.env.prod.web.example) 为 `.env.prod`
4. 按真实值填写数据库、微信、短信、域名、证书和内网 upstream
5. 在 GitHub Actions 触发 `Deploy Services To ECS`
6. 选择：
   - `target=bootstrap`
   - `image_tag=` 留空
   - `run_seed=false`
7. 若需要导入演示数据，再显式执行：
   - `target=bootstrap`
   - `run_seed=true`

执行顺序：

1. `build-backend` / `build-admin-web` 并行构建并上传 artifact
2. `deploy-backend-host` 在 ECS-2 本机同步 bundle、下载 backend artifact 并执行 backend bootstrap
3. `deploy-web-host` 在 backend 健康后，于 ECS-1 本机同步 bundle、下载 admin-web artifact 并执行 web bootstrap

---

## 5. 日常发布

### 5.1 自动发布

将代码合入 `main` 后，workflow 会按改动自动识别目标：

- backend 变更：仅发布 ECS-2 backend，artifact 只由 ECS-2 下载
- admin-web 变更：仅发布 ECS-1 admin-web，artifact 只由 ECS-1 下载
- ingress / web deploy 脚本变更：仅刷新 ECS-1 admin-web 或 nginx
- backend + admin-web 变更：构建并行、artifact 下载各自主机独立完成，切换顺序固定为 `backend -> admin-web -> nginx`

### 5.2 手动发布

可通过 `workflow_dispatch` 指定：

- `target=backend`
- `target=admin-web`
- `target=nginx`
- `target=all`
- `target=bootstrap`

说明：

- `target=backend` 只操作 ECS-2。
- `target=admin-web` 只操作 ECS-1，不刷新 Nginx。
- `target=nginx` 只刷新 ECS-1 宿主机入口，但仍会先检查 ECS-2 backend upstream 与 ECS-1 admin-web 健康。
- `target=all` 会执行 `ECS-2 backend -> ECS-1 admin-web -> ECS-1 nginx reload`。
- 常规发布优先使用当前 run 的 artifact；只有手动 `image_tag` 回滚才走 GHCR fallback。

---

## 6. 回滚

统一回滚接口：

- `workflow_dispatch + image_tag=<历史 sha>`

常见场景：

- 仅回滚 backend：
  - `target=backend`
  - `image_tag=<历史 backend tag>`
- 仅回滚 admin-web：
  - `target=admin-web`
  - `image_tag=<历史 admin-web tag>`
- 整体回滚：
  - `target=all`
  - `image_tag=<历史稳定 tag>`

说明：

- 回滚同样遵循“backend 先切、web 后切”的顺序。
- 若只回滚 admin-web，不会触碰 ECS-2 backend。

---

## 7. Smoke Test

本地标准冒烟命令：

```bash
scripts/check_production_readonly_audit.sh
RUN_INTERNAL=1 scripts/check_production_smoke.sh
```

`scripts/check_production_readonly_audit.sh` is the preferred read-only audit
entry when checking production outside a deployment. It runs deploy config
static checks, production smoke, and backend `8080` exposure inspection without
pushing, deploying, reloading Nginx, or changing ECS/firewall/security-group
state.

backend 节点：

1. `curl http://127.0.0.1:8080/api/health`
2. `docker compose -f docker-compose.backend.yml ps`

web 节点：

1. `curl http://172.25.121.83:8080/api/health`
2. `curl http://127.0.0.1:18080/healthz`
3. `sudo nginx -t`
4. `curl https://<HOST_NGINX_API_SERVER_NAME>/api/health`
5. 打开 `https://<HOST_NGINX_ADMIN_SERVER_NAME>` 验证管理端登录

Latest observed production smoke is tracked in
[Production-Smoke.md](/Users/chenyao/dev/miniapp/sunflower/docs/Production-Smoke.md).

As of the 2026-06-02 scripted smoke:

- Public `http://47.113.223.248/api/health` returned 200.
- Public `http://47.113.223.248/api/content/home` returned 200.
- Public `http://47.113.223.248/healthz` returned 200.
- Public `http://47.113.223.248/` returned 200 admin web HTML.
- ECS-1 Nginx is active and `sunflower-admin-web` is healthy.
- ECS-2 `sunflower-backend` and `sunflower-mysql` are healthy.
- HTTPS/domain validation remains unproven.
- Backend still binds `0.0.0.0:8080`; security group or firewall hardening
  should restrict direct backend access to ECS-1.
