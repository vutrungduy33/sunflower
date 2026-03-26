# S19 生产部署与配置说明

## 1. 目标

S19 之后，生产部署固定采用这条链路：

`GitHub Actions -> GHCR -> ECS(SSH) -> docker compose -> 宿主机 Nginx`

职责边界：

- GitHub Actions：
  - 构建镜像
  - 上传 deployment bundle
  - 写入 `.release.env`
  - 触发部署脚本
- ECS 本地：
  - 保存真实 `.env.prod`
  - 运行 `docker compose`
  - 承载宿主机 Nginx 入口

---

## 2. 服务器文件布局

部署目录固定包含：

- `$DEPLOY_PATH/.env.prod`
- `$DEPLOY_PATH/.release.env`
- `$DEPLOY_PATH/docker-compose.yml`
- `$DEPLOY_PATH/deploy/nginx/sunflower-host.conf.template`
- `$DEPLOY_PATH/scripts/*`

文件职责：

- `.env.prod`
  - 运维手工维护
  - 不由 GitHub Actions 覆盖
  - 保存数据库、微信、小程序鉴权、管理端账号、短信、端口、Nginx 站点名等真实配置
- `.release.env`
  - 每次发布自动覆盖
  - 仅保存镜像与发布元信息
  - 不保存业务 secret

运行时约束：

- deploy 脚本始终会从 `$DEPLOY_PATH/.release.env` 读取发布元信息
- `.env.prod` 中若残留 `RELEASE_ENV_FILE`、`BACKEND_IMAGE`、`ADMIN_WEB_IMAGE` 等样板值，不会覆盖本次发布写入的 `.release.env`

格式要求：

- `.env.prod` 需要保持 shell 兼容的 `KEY=value` 语法
- 若值中包含空格，请使用双引号，例如：`ADMIN_WEB_APP_TITLE=\"Sunflower Admin Web\"`

`.release.env` 当前字段：

- `BACKEND_IMAGE`
- `ADMIN_WEB_IMAGE`
- `SOURCE_SHA`
- `DEPLOY_TARGET`
- `RUN_SEED`

---

## 3. `.env.prod` 全量变量

可提交模板见：

- [.env.prod.example](/Users/chenyao/dev/miniapp/sunflower/.env.prod.example)

### 3.1 基础数据库

必填：

- `MYSQL_ROOT_PASSWORD`
- `MYSQL_DATABASE`
- `MYSQL_USER`
- `MYSQL_PASSWORD`

常用：

- `MYSQL_BIND_HOST`
- `MYSQL_HOST_PORT`

### 3.2 小程序用户认证

必填：

- `AUTH_TOKEN_SECRET`
- `AUTH_TOKEN_TTL_SECONDS`
- `WECHAT_AUTH_MOCK_ENABLED=false`
- `WECHAT_APP_ID`
- `WECHAT_APP_SECRET`
- `WECHAT_JSCODE2SESSION_URL`
- `WECHAT_STABLE_ACCESS_TOKEN_URL`
- `WECHAT_GET_PHONE_NUMBER_URL`
- `WECHAT_MANUAL_PHONE_BIND_ENABLED=false`

可选：

- `WECHAT_MOCK_FIXED_OPENID`
- `WECHAT_MOCK_OPENID_PREFIX`
- `WECHAT_MOCK_PHONE_NUMBER_PREFIX`

生产约束：

- `validate_prod_env.sh` 会强制校验 `WECHAT_AUTH_MOCK_ENABLED=false`
- `validate_prod_env.sh` 会强制校验 `WECHAT_MANUAL_PHONE_BIND_ENABLED=false`

### 3.3 管理端真实账号

必填：

- `ADMIN_ACTIVATION_ALLOWLIST`
- `ADMIN_AUTH_TOKEN_SECRET`
- `ADMIN_AUTH_TOKEN_TTL_SECONDS`

说明：

- `ADMIN_ACTIVATION_ALLOWLIST` 格式固定为 `手机号:角色,手机号:角色`
- 当前角色仅支持 `admin` / `operator`

### 3.4 管理端短信

必填：

- `ADMIN_SMS_PROVIDER=tencent`
- `ADMIN_SMS_CODE_LENGTH`
- `ADMIN_SMS_CODE_TTL_SECONDS`
- `ADMIN_SMS_RESEND_COOLDOWN_SECONDS`
- `ADMIN_SMS_HOURLY_SEND_LIMIT`
- `ADMIN_SMS_DAILY_SEND_LIMIT`
- `ADMIN_SMS_MAX_VERIFY_ATTEMPTS`
- `ADMIN_LOGIN_FAILURE_LIMIT`
- `ADMIN_LOGIN_LOCK_SECONDS`

当 `ADMIN_SMS_PROVIDER=tencent` 时必填：

- `TENCENT_SMS_SECRET_ID`
- `TENCENT_SMS_SECRET_KEY`
- `TENCENT_SMS_REGION`
- `TENCENT_SMS_SDK_APP_ID`
- `TENCENT_SMS_SIGN_NAME`
- `TENCENT_SMS_TEMPLATE_ID_ACTIVATE`
- `TENCENT_SMS_TEMPLATE_ID_RESET_PASSWORD`

生产约束：

- `validate_prod_env.sh` 当前固定要求 prod 使用 `tencent`

### 3.5 应用与入口

常用：

- `APP_MEDIA_AVATAR_STORAGE_PATH`
- `BACKEND_BIND_HOST`
- `BACKEND_HOST_PORT`
- `ADMIN_WEB_BIND_HOST`
- `ADMIN_WEB_HOST_PORT`
- `HOST_NGINX_ENABLED`
- `HOST_NGINX_SITE_NAME`
- `HOST_NGINX_SERVER_NAME`
- `HOST_NGINX_TLS_CERT_PATH`
- `HOST_NGINX_TLS_KEY_PATH`
- `ADMIN_WEB_APP_TITLE`
- `ADMIN_WEB_API_BASE_URL`
- `ADMIN_WEB_API_PROXY_TARGET`

说明：

- `HOST_NGINX_ENABLED=true` 时，deploy 会校验证书文件并刷新宿主机 Nginx
- `HOST_NGINX_ENABLED=false` 时，deploy 会跳过宿主机 Nginx 校验与 reload，适合正式域名尚未完成 ICP 备案或证书尚未落盘前的容器链路验证
- `validate_prod_env.sh` 会在 `HOST_NGINX_ENABLED=true` 时拒绝 `admin.example.com` 这类样板域名，并检查证书文件是否已落盘
- `HOST_NGINX_SERVER_NAME` 应配置为正式域名
- `HOST_NGINX_TLS_CERT_PATH` / `HOST_NGINX_TLS_KEY_PATH` 应指向宿主机已签发证书
- 宿主机 Nginx 模板会将 `80` 端口跳转到 `443`，并在 `443 ssl` 上将 `/api/*` 转发到 backend，将 `/` 转发到 admin-web

---

## 4. 首次部署（Bootstrap）

首次上线固定两步：

1. 在 ECS 部署目录放置 `.env.prod`
2. 手动触发 GitHub Actions：
   - `target=bootstrap`
   - `run_seed=false` 或 `true`

建议步骤：

1. `mkdir -p $DEPLOY_PATH`
2. 将 [.env.prod.example](/Users/chenyao/dev/miniapp/sunflower/.env.prod.example) 复制为服务器本地 `.env.prod`
3. 按真实值填写微信、短信、数据库和域名配置
4. 在 GitHub Actions 触发 `Deploy Services To ECS`
5. 选择：
   - `target=bootstrap`
   - `image_tag=` 留空
   - `run_seed=false`
6. 若需要导入演示数据，再显式执行：
   - `target=bootstrap`
   - `run_seed=true`

注意：

- `.env.prod.example` 可作为 `.env.prod` 模板，但其中 release metadata 片段只用于本地校验与对照，真正发布时以 `.release.env` 为准
- 若 `HOST_NGINX_ENABLED=false`，backend/admin-web 仍会部署，但默认只监听 `127.0.0.1:8080/18080`；备案完成前可通过 SSH 隧道或服务器本机做验证
- 常规 prod 不应导入 `mvp_demo_seed.sql`
- `bootstrap` 会执行：
  - `validate_prod_env.sh`
  - `deploy_backend.sh`
  - 可选 seed
  - `deploy_admin_web.sh`
  - `reload_host_nginx.sh`

---

## 5. 日常发布

### 5.1 自动发布

将代码合入 `main` 后，workflow 会按改动自动识别目标：

- backend 变更：发布 backend 并刷新 Nginx
- admin-web 变更：发布 admin-web 并刷新 Nginx
- nginx/compose/部署脚本变更：刷新入口或按目标重新部署
- backend + admin-web 变更：按 `backend -> admin-web -> nginx` 顺序发布

### 5.2 手动发布

可通过 `workflow_dispatch` 指定：

- `target=backend`
- `target=admin-web`
- `target=nginx`
- `target=all`
- `target=bootstrap`

说明：

- `target=backend` / `admin-web` / `all` 仍会在末尾统一执行 `reload_host_nginx.sh`
- `HOST_NGINX_ENABLED=false` 时，`reload_host_nginx.sh` 会记录 skip 并直接返回
- `target=nginx` 只刷新宿主机入口，但仍会要求 backend/admin-web 健康

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
  - `image_tag=<历史稳定版本 sha>`

说明：

- 当 `image_tag` 非空时，workflow 不会重新构建镜像，而是直接使用历史 GHCR tag
- 回滚不会覆盖服务器 `.env.prod`

---

## 7. Smoke Test 清单

每次 prod 发布后至少检查：

1. `curl https://<HOST_NGINX_SERVER_NAME>/api/health`
2. 管理端登录页可访问，真实账号可登录
3. 小程序通过正式 `HTTPS` 域名完成微信登录
4. 小程序下单主链路可用
5. 支付回调入口域名配置与运行域名一致

建议补充：

- 管理端修改密码 / 重置密码
- 小程序手机号绑定
- Nginx `/` 与 `/api/*` 转发均正常

---

## 8. 常见失败原因

- `validate_prod_env.sh` 失败：
  - `.env.prod` 缺失
  - 仍使用 placeholder secret
  - 微信配置缺失
  - 腾讯云短信配置缺失
  - `WECHAT_AUTH_MOCK_ENABLED=true`
- GHCR 拉镜像失败：
  - `GHCR_USERNAME` / `GHCR_TOKEN` 失效
  - ECS 到 `ghcr.io` 网络不通
- backend 健康检查失败：
  - DB 口令错误
  - Flyway 迁移失败
  - 微信/短信配置缺失导致 Spring Boot 启动失败
- nginx 刷新失败：
  - `HOST_NGINX_SITE_NAME` / `HOST_NGINX_SERVER_NAME` 未配置
  - `nginx -t` 校验失败
  - 部署用户缺少 `sudo` 权限
