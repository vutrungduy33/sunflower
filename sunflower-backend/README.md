# sunflower-backend

Sunflower MVP backend monolith for miniapp, admin web, booking, payment, and
operations APIs.

## Stack

- Java 11
- Spring Boot 2.7.x
- Spring MVC + Bean Validation
- Spring Data JPA
- Flyway migrations
- MySQL 8 in production, H2 in tests
- Tencent Cloud SMS client
- WeChat auth, phone, pay, and refund integration clients

## Current MVP API Scope

Public and miniapp APIs:

- `GET /api/health`
- `POST /api/auth/wechat/login`
- `POST /api/auth/bind-phone`
- `POST /api/auth/logout`
- `GET /api/users/me`
- `PATCH /api/users/me`
- `POST /api/users/me/avatar`
- `GET /api/content/home`
- `GET /api/poi`
- `GET /api/posts`
- `GET /api/rooms`
- `GET /api/rooms/{roomId}`
- `GET /api/rooms/{roomId}/calendar`
- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/{orderId}`
- `POST /api/orders/{orderId}/pay`
- `POST /api/orders/{orderId}/pay/confirm`
- `POST /api/orders/{orderId}/cancel`
- `POST /api/orders/{orderId}/reschedule`
- `POST /api/orders/{orderId}/refund`
- `POST /api/payments/wechat/transactions/notify`
- `POST /api/payments/wechat/refunds/notify`

Admin APIs cover admin auth/account, room management, price and inventory
updates, order operations, after-sale approval/rejection, refund retry, and
business summary. The canonical contract is maintained in `docs/API.md` and
`docs/API-Schemas.md`.

## Data and Runtime

- Production data is MySQL-backed and migrated by Flyway.
- Test profile uses H2 for automated integration tests.
- Production profile reads database, WeChat, payment, SMS, token, and upload
  configuration from ECS-local environment files; secrets are not committed.
- Real WeChat login, phone binding, payment, refund, and SMS behavior depends on
  production credentials and external callbacks.
- Mock payment behavior is only available when explicitly configured for
  development or tests; it is not proof of production merchant readiness.

## Local Run

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

If Maven is not installed locally, run with Docker:

```bash
docker run --rm -it \
  -v "$PWD":/workspace \
  -w /workspace \
  maven:3.9.6-eclipse-temurin-11 \
  mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

## Verification

```bash
mvn -B test
```

The current suite covers application startup, Flyway validation, public MVP API
integration paths, admin auth integration paths, WeChat client behavior, and
Tencent SMS sender behavior.

Production smoke and final launch evidence are tracked outside this README:

- `docs/Backend-MVP-QA.md`
- `docs/Backend-8080-Security.md`
- `docs/MVP-Launch-Evidence.md`
- `docs/MVP-Readiness.md`

## Compose

From the repository root:

```bash
docker compose up -d --build
```

Health check:

```bash
curl -fsS http://localhost:8080/api/health
```
