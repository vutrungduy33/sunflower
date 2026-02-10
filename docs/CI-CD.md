# GitHub Actions CI/CD（自动化部署）

## 1) 工作流说明

工作流路径：`.github/workflows/ci-cd.yml`

包含两阶段：
1. **build-backend**：构建 Spring Boot JAR
2. **deploy**：复制 JAR 到服务器并执行部署命令（需配置 Secrets）

当 `DEPLOY_HOST` 未配置时，部署步骤会自动跳过。

## 2) 必要 Secrets

在 GitHub 仓库 Settings → Secrets and variables → Actions 添加：

- `DEPLOY_HOST`：服务器地址  
- `DEPLOY_USER`：SSH 用户  
- `DEPLOY_KEY`：SSH 私钥（不加密原文）  
- `DEPLOY_PORT`：SSH 端口（可选，默认 22）  
- `DEPLOY_PATH`：远端存放 JAR 的目录  
- `DEPLOY_CMD`：部署命令（如 systemd 重启）

示例：
```
DEPLOY_PATH=/opt/lugulake
DEPLOY_CMD=sudo systemctl restart lugulake
```

## 3) 服务器侧准备

**系统服务示例（systemd）**

`/etc/systemd/system/lugulake.service`：
```
[Unit]
Description=Lugulake Backend
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/opt/lugulake
ExecStart=/usr/bin/java -jar /opt/lugulake/lugulake-backend.jar
Restart=always
Environment=SPRING_PROFILES_ACTIVE=prod

[Install]
WantedBy=multi-user.target
```

初始化：
```
sudo systemctl daemon-reload
sudo systemctl enable lugulake
sudo systemctl start lugulake
```

## 4) 可选增强

- 接入 Nginx 反向代理  
- 增加健康检查与回滚  
- 部署前备份旧 JAR  
