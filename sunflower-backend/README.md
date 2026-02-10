# sunflower-backend

Spring Boot 单体后端基础工程。

## 技术栈
- Java 11
- Spring Boot 2.7.x
- Spring Web
- Spring Data JPA
- MySQL

## 目录结构
- `src/main/java/com/sunflower/backend`：应用主包
- `src/main/java/com/sunflower/backend/modules`：业务模块（auth/room/order/content）
- `src/main/java/com/sunflower/backend/common`：公共响应模型等
- `src/main/resources`：配置文件

## 本地运行
如果本机没有 Maven，可用 Docker 运行：

```bash
docker run --rm -it \
  -v "$PWD":/workspace \
  -w /workspace \
  maven:3.9.9-eclipse-temurin-11 \
  mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

## 测试
```bash
docker run --rm -it \
  -v "$PWD":/workspace \
  -w /workspace \
  maven:3.9.9-eclipse-temurin-11 \
  mvn test
```

## docker-compose 启动（推荐）
在仓库根目录执行：

```bash
docker compose up -d --build
```

启动后访问：
- `GET http://localhost:8080/api/health`
