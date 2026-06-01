# MVP Readiness

> Current as of 2026-06-02. This is the launch-readiness tracker for the MVP
> hardening goal. It is not a revived stage gate.

## 1. MVP Target

The MVP is considered usable when the following primary paths are implemented,
verified, and documented enough for handoff:

- Miniapp user path: WeChat login, phone binding, home content, room browsing,
  room calendar, order creation, payment flow, order list, cancel, reschedule,
  and refund request.
- Admin web path: admin activation/login/reset/change password, protected
  workspace, room management, price/inventory management, order search/detail,
  reschedule/refund/after-sale/check-in/check-out/no-show actions, and business
  overview.
- Backend path: MySQL-backed Spring Boot APIs for auth/user/content/room/order,
  admin APIs, WeChat auth, WeChat pay/refund records, SMS-backed admin account
  flows, health endpoint, and Flyway migrations.
- Deployment path: GitHub Actions deployment workflow can deploy to the dual ECS
  topology, and production smoke checks can prove the public API/admin entry.

## 2. Current Readiness Matrix

| Area | Evidence | Status | Next action |
| --- | --- | --- | --- |
| Backend local quality | Round 4 `mvn -B test`: passed, 56 tests. | Ready locally | Rerun before final MVP closeout if more backend changes land. |
| Admin web local quality | Round 1 `npm run lint`, `npm run test` (20 tests), `npm run build`: passed. | Ready locally | Keep green after future admin changes. |
| Miniapp syntax/smoke | Round 3 `node scripts/check_miniapp_mvp_smoke.js` plus existing miniapp guards. | Partially verified | Real-device login/phone/payment evidence still required. |
| Miniapp real user path | Code supports real API, WeChat login, phone binding, `wx.requestPayment`, order and after-sale flows. | Needs real-device evidence | Verify in WeChat DevTools/preview with legal HTTPS request domain. |
| WeChat pay/refund | Backend has WeChat payment/refund gateway, callbacks, records, retry, and mock only when explicitly configured. | Needs production evidence | Verify small real payment/refund with merchant config and callback domain. |
| Admin operations path | Core pages and tests exist for auth, room, price/inventory, and order management. | Partially verified | Run manual QA against deployed admin web. |
| Deployment | `.github/workflows/deploy-backend.yml` is the active deploy workflow; prior production smoke returned 200 for `/api/health` and `/api/content/home`. | Partially verified | Push/dispatch deploy only after confirming branch/production intent. |
| Security / compliance | Secrets are local/ECS-owned; `.secrets/` ignored. Known issue: backend `8080` observed publicly bound. | Needs hardening | Restrict backend port to ECS-1 and complete HTTPS/WeChat domain setup. |

## 3. Final Verification Commands

Run before declaring the MVP goal complete:

```bash
cd sunflower-backend && mvn -B test
```

Backend/API verification notes live in `docs/Backend-MVP-QA.md`.

```bash
cd sunflower-admin-web && npm run lint && npm run test && npm run build
```

```bash
cd sunflower-miniapp
node ../scripts/check_miniapp_mvp_smoke.js
bash ../scripts/check_miniapp_project_config.sh
bash ../scripts/check_mvp_subpage_nav.sh
node --check utils/mvp/api.js
node --check utils/mvp/payment.js
node --check pages/mvp/home/index.js
node --check pages/mvp/login/index.js
node --check pages/mvp/order-create/index.js
node --check pages/mvp/order-list/index.js
```

After an approved production deploy:

```bash
curl -fsS http://47.113.223.248/api/health
curl -fsS http://47.113.223.248/api/content/home
```

When HTTPS/domain is ready, also verify:

- `https://<api-domain>/api/health`
- `https://<admin-domain>`
- WeChat miniapp request domain is configured to the HTTPS API domain.

## 4. Manual QA Checklist

Miniapp:

- Login through `wx.login`; expired/invalid token returns to login cleanly.
- Bind phone through `getPhoneNumber` in a real preview or approved test setup.
- Browse home, room list, room detail, and calendar.
- Create an order with bound phone and valid guest data.
- Start payment; in dev/test verify mock, in production verify real
  `wx.requestPayment`.
- Confirm order list/detail status after payment.
- Cancel unpaid order.
- Submit reschedule request.
- Submit refund request and observe status feedback.

Admin web:

- Activate an allowlisted admin account through SMS.
- Login, logout, reset password, and change password.
- Confirm workspace health check reaches `/api/health`.
- Create/edit room and toggle shelf status.
- Update price and inventory for a date range.
- Filter orders by status, keyword, and check-in range.
- Open order detail and perform allowed operational actions.
- Retry a failed/abnormal refund record if test data exists.

Production:

- Confirm ECS-1 host Nginx and admin-web health.
- Confirm ECS-2 backend and MySQL health.
- Confirm public API requests flow through ECS-1 to ECS-2 private upstream.
- Confirm direct public access to backend `8080` is blocked or security-group
  restricted to ECS-1.

## 5. Launch Blockers

- No recorded real-device WeChat login/phone/payment/refund validation yet.
- HTTPS legal request domain for miniapp production is not proven in this repo.
- Backend `8080` public exposure needs security-group hardening evidence.
- Push-triggered deployment from the current MVP branch has not been performed;
  deployment requires explicit branch/production confirmation.

## 6. Next Rounds

1. Broaden miniapp validation evidence and add repeatable smoke/manual QA notes.
2. Harden admin operational manual QA against a running backend or production.
3. Run full backend/admin/miniapp verification and production smoke after an
   approved deploy.
