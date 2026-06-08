# Backend MVP QA

> Current as of 2026-06-08 Round 114. This document records repeatable backend/API checks
> for the MVP hardening goal.

## 1. Automated Checks

Run from the repository root:

```bash
cd sunflower-backend && mvn -B test
```

Latest Round 114 result:

- `mvn -B test`: passed.
- Tests run: 57.
- Failures: 0.
- Errors: 0.
- Skipped: 0.

The test suite currently covers:

- Spring Boot application context startup.
- Flyway migration validation against H2 test profile.
- MVP public API integration paths in `MvpApiIntegrationTests`.
- Public order ownership isolation across current-user list/detail/pay
  preparation/pay confirmation/cancel/reschedule/refund actions.
- Admin auth integration paths in `AdminAuthIntegrationTests`.
- WeChat auth/access-token/phone-number client behavior.
- Tencent SMS sender behavior.

## 2. API Surface Covered By Current Controllers

Public and miniapp APIs:

- `GET /api/health`
- `POST /api/auth/wechat/login`
- `POST /api/auth/bind-phone`
- `POST /api/auth/logout`
- `GET/PATCH /api/users/me`
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

Admin APIs:

- `POST /api/admin/auth/sms-code`
- `POST /api/admin/auth/activate`
- `POST /api/admin/auth/login`
- `POST /api/admin/auth/reset-password`
- `POST /api/admin/auth/logout`
- `GET /api/admin/account/me`
- `POST /api/admin/account/change-password`
- `GET /api/admin/rooms`
- `POST /api/admin/rooms`
- `PATCH /api/admin/rooms/{roomId}`
- `POST /api/admin/room-prices`
- `POST /api/admin/room-inventory`
- `GET /api/admin/orders`
- `GET /api/admin/orders/{orderId}`
- `POST /api/admin/orders/{orderId}/reschedule`
- `POST /api/admin/orders/{orderId}/refund`
- `POST /api/admin/orders/{orderId}/refunds/{refundId}/retry`
- `POST /api/admin/orders/{orderId}/after-sale/{requestId}/approve`
- `POST /api/admin/orders/{orderId}/after-sale/{requestId}/reject`
- `POST /api/admin/orders/{orderId}/check-in`
- `POST /api/admin/orders/{orderId}/check-out`
- `POST /api/admin/orders/{orderId}/no-show`
- `GET /api/admin/reports/summary`

The active API contract docs are:

- `docs/API.md`
- `docs/API-Schemas.md`

## 3. Manual / Production Smoke

Local or deployed API:

```bash
curl -fsS http://<host>/api/health
curl -fsS http://<host>/api/content/home
curl -fsS 'http://<host>/api/rooms?checkInDate=2026-06-10'
```

Authenticated miniapp/admin paths require valid tokens and should be exercised
through the miniapp/admin clients or explicit QA scripts with non-secret test
credentials.

Production after approved deploy:

- ECS-2: backend container healthy.
- ECS-2: MySQL container healthy and bound to local host.
- ECS-1: public `/api/health` reaches ECS-2 through the private upstream.
- ECS-1: public admin web can login and call same-origin `/api`.

## 4. Known Limits

- `mvn -B test` proves local test-profile behavior, not real WeChat, real SMS,
  real merchant payment, or production callback delivery.
- Production `.env.prod` files are intentionally ECS-local and not committed, so
  this repo can only document required variables and smoke checks.
- Real payment/refund acceptance still requires merchant credentials, HTTPS
  callback domain, and a low-value transaction/refund run.
