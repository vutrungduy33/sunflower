# GitHub Actions CI/CD

## 1. 工作流总览

当前包含两个工作流：

1. `pr-stage-gate.yml`：PR 门禁（质量检查）
2. `deploy-backend.yml`：主分支后端部署到 ECS

---

## 2. PR 门禁（强制）

工作流路径：`.github/workflows/pr-stage-gate.yml`

触发条件：

- `pull_request`（opened / synchronize / reopened / ready_for_review / edited）
- 草稿 PR（draft）不会执行门禁

门禁项：

1. 分支命名规范检查  
   - 必须匹配：`codex/s<stage>-<slug>`  
   - 示例：`codex/s1-db-migration`

2. 提交信息规范检查  
   - PR 内所有 commit subject 必须以前缀 `[Sx]` 开头  
   - 示例：`[S1] add flyway baseline migration`

3. Stage Guard 检查  
   - `make stage-pre STAGE=Sx`
   - `make stage-post STAGE=Sx`

4. 自动化测试  
   - `cd sunflower-backend && mvn -B test`

5. API 契约同步提醒（非阻塞）  
   - 若后端 `Controller/DTO` 变更但未同步小程序 API 调用或 API 文档，工作流给出 warning

说明：

- PR 必须通过以上门禁才能合并（需在仓库分支保护规则中把该 workflow 设为 Required）。

---

## 3. 部署流程（ECS）

工作流路径：`.github/workflows/deploy-backend.yml`

触发条件：

- push 到 `main`
- 且变更命中 `sunflower-backend/**` 或 `docker-compose.yml`

执行流程：

1. GitHub Actions 在 Runner 构建 `sunflower-backend` Docker 镜像并推送到 GHCR（标签：`sha`，主分支额外推 `latest`）
2. GitHub Actions 通过 SSH 连接 ECS
3. 在 ECS 的部署目录拉取最新代码
4. 在 ECS 登录 GHCR，注入 `BACKEND_IMAGE=ghcr.io/<owner>/sunflower-backend:<sha>`
5. 执行 `scripts/start_backend_with_mvp_seed.sh`（先启动 MySQL，再拉取并启动 backend，最后导入 `scripts/sql/mvp_demo_seed.sql`）
6. 对 `http://127.0.0.1:8080/api/health` 做健康检查

---

## 4. 必要 Secrets（部署）

在 GitHub 仓库 `Settings -> Secrets and variables -> Actions` 添加：

- `ECS_HOST`：ECS 公网 IP
- `ECS_USER`：SSH 用户（例如 `root`）
- `ECS_PORT`：SSH 端口（默认 `22`）
- `ECS_SSH_KEY`：登录 ECS 的私钥内容
- `DEPLOY_PATH`：服务器部署目录（例如 `/opt/sunflower`）
- `AUTH_TOKEN_SECRET`：后端签名 token 密钥（必填）
- `GHCR_USERNAME`：用于 ECS 拉取 GHCR 镜像的 GitHub 用户名（建议机器账号）
- `GHCR_TOKEN`：用于 ECS 拉取 GHCR 镜像的 Token（至少 `read:packages` 权限）

可选（若不配置则使用默认值）：

- `AUTH_TOKEN_TTL_SECONDS`：token 过期秒数（默认 `7200`）
- `WECHAT_AUTH_MOCK_ENABLED`：是否启用微信登录 mock（`true/false`，默认 `false`）
- `WECHAT_APP_ID`：微信小程序 `appId`（当 `WECHAT_AUTH_MOCK_ENABLED=false` 时必填）
- `WECHAT_APP_SECRET`：微信小程序 `appSecret`（当 `WECHAT_AUTH_MOCK_ENABLED=false` 时必填）
- `WECHAT_JSCODE2SESSION_URL`：微信 `jscode2session` 地址（默认官方地址）
- `WECHAT_MOCK_OPENID_PREFIX`：mock openid 前缀（默认 `mock_openid_`）
- `WECHAT_MOCK_FIXED_OPENID`：mock 固定 openid（默认空，只有显式配置时才启用固定账号）

说明：

- workflow 在构建镜像时使用 Actions 自带 `GITHUB_TOKEN` 推送 GHCR，不需要额外配置推送凭据。

---

## 5. 本地对应命令

- Stage 前检查：`make stage-pre STAGE=Sx`
- Stage 后检查：`make stage-post STAGE=Sx`
- 分支/提交规范检查：`make convention-check BRANCH=codex/s1-xxx BASE_SHA=<base> HEAD_SHA=<head>`
- API 契约提醒检查：`make api-contract-check RANGE=main..HEAD`
