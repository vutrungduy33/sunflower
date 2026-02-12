# sunflower-backend

Sunflower 微信小程序 MVP 一期后端（Spring Boot 单体）。

## 技术栈
- Java 11
- Spring Boot 2.7.x
- Spring Web
- Bean Validation
- Spring Data JPA（当前阶段未落库实体）
- MySQL（生产）/H2（测试）

## 当前实现范围（MVP 一期）
已完成并可联调的接口：

- 健康检查
  - `GET /api/health`
- 认证与用户
  - `POST /api/auth/wechat/login`
  - `POST /api/auth/bind-phone`
  - `GET /api/users/me`
  - `PATCH /api/users/me`
- 首页与内容
  - `GET /api/content/home`
  - `GET /api/poi`
  - `GET /api/posts`
- 房型与日历
  - `GET /api/rooms`
  - `GET /api/rooms/{roomId}`
  - `GET /api/rooms/{roomId}/calendar`
- 住宿订单
  - `POST /api/orders`
  - `GET /api/orders`
  - `GET /api/orders/{orderId}`
  - `POST /api/orders/{orderId}/pay`
  - `POST /api/orders/{orderId}/cancel`

## 数据说明
- 当前为联调阶段，业务数据使用**内存种子数据**（对齐小程序 `utils/mvp/mock.js` 契约）。
- 服务重启后，用户与订单数据会重置。
- 后续将切换为 MySQL 持久化（表结构按 `docs/DataDictionary.md` 与 `docs/DB-Design.md`）。

## 目录结构
- `src/main/java/com/sunflower/backend/modules/auth`：登录/绑定手机号
- `src/main/java/com/sunflower/backend/modules/user`：用户资料
- `src/main/java/com/sunflower/backend/modules/room`：房型/价格日历
- `src/main/java/com/sunflower/backend/modules/order`：订单创建/支付/取消
- `src/main/java/com/sunflower/backend/modules/content`：首页、POI、游记
- `src/main/java/com/sunflower/backend/common`：统一响应与异常处理

## 本地运行
如果本机没有 Maven，可用 Docker 运行：

```bash
docker run --rm -it \
  -v "$PWD":/workspace \
  -w /workspace \
  maven:3.9.6-eclipse-temurin-11 \
  mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

## 测试
```bash
docker run --rm -it \
  -v "$PWD":/workspace \
  -w /workspace \
  maven:3.9.6-eclipse-temurin-11 \
  mvn test
```

已包含 `MockMvc` 集成测试，覆盖登录、用户资料、房型、订单主链路。

## docker-compose 启动（推荐）
在仓库根目录执行：

```bash
docker compose up -d --build
```

启动后访问：
- `GET http://localhost:8080/api/health`
