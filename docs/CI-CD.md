# GitHub Actions CI/CD（阿里云 ECS）

## 1) 工作流说明

工作流路径：`.github/workflows/deploy-backend.yml`

触发条件：
- push 到 `main`
- 且变更命中 `sunflower-backend/**` 或 `docker-compose.yml`

执行流程：
1. GitHub Actions 通过 SSH 连接 ECS
2. 在 ECS 的部署目录拉取最新代码
3. 执行 `docker compose up -d --build backend`
4. 对 `http://127.0.0.1:8080/api/health` 做健康检查

## 2) 必要 Secrets

在 GitHub 仓库 `Settings -> Secrets and variables -> Actions` 添加：

- `ECS_HOST`：ECS 公网 IP
- `ECS_USER`：SSH 用户（例如 `root`）
- `ECS_PORT`：SSH 端口（默认 `22`）
- `ECS_SSH_KEY`：登录 ECS 的私钥内容
- `DEPLOY_PATH`：服务器部署目录（例如 `/opt/sunflower`）

## 3) 服务器侧准备

首次在 ECS 执行：

```bash
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker

mkdir -p /opt/sunflower
cd /opt/sunflower
git clone https://github.com/vutrungduy33/sunflower.git .
docker compose up -d --build
```

## 4) 验证

1. 提交并推送后端代码到 `main`
2. 在 GitHub Actions 查看 `Deploy Backend To ECS` 任务
3. 任务成功后，访问 ECS 的 `8080` 端口或 Nginx 反向代理地址

## 5) 可选增强

- 在 ECS 上接 Nginx + HTTPS（80/443）
- 为 Actions 增加手动触发 `workflow_dispatch`
- 部署前自动备份旧镜像并支持回滚
