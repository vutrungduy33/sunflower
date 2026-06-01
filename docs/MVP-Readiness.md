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
| Backend local quality | Final audit `mvn -B test`: passed, 56 tests. | Ready locally | Keep green after future backend changes. |
| Admin web local quality | Final audit `npm run lint`, `npm run test` (20 tests), `npm run build`: passed. Round 17 `node scripts/check_admin_web_behavior_wiring.js` passed 97 key behavior wiring checks across 16 files. | Ready locally | Keep green after future admin changes. |
| Miniapp syntax/smoke | Final audit `node scripts/check_miniapp_mvp_smoke.js` plus existing miniapp guards passed. Round 16 `node scripts/check_miniapp_behavior_wiring.js` passed 69 key behavior wiring checks across 14 files. | Partially verified | Real-device login/phone/payment evidence still required. |
| Miniapp real user path | Code supports real API, WeChat login, phone binding, `wx.requestPayment`, order and after-sale flows; manual QA ledger now exists. | Needs real-device evidence | Run `node scripts/check_miniapp_manual_qa.js --strict` after recording preview/real-device evidence. |
| WeChat pay/refund | Backend has WeChat payment/refund gateway, callbacks, records, retry, and mock only when explicitly configured; miniapp payment QA ledger now exists. | Needs production evidence | Verify small real payment/refund with merchant config and callback domain, then record sanitized evidence. |
| Admin operations path | Core pages and tests exist for auth, room, price/inventory, and order management; manual QA ledger now exists. | Partially verified | Run `node scripts/check_admin_web_manual_qa.js --strict` against deployed admin web after recording safe evidence. |
| Deployment | Scripted production smoke returned 7 passes and 1 known backend-bind warning; public `/api/health`, `/api/content/home`, `/healthz`, admin web HTML, and ECS internal health passed. | Partially verified | Push/dispatch deploy only after confirming branch/production intent. |
| Security / compliance | Secrets are local/ECS-owned; `.secrets/` ignored. `RUN_INTERNAL=1 scripts/check_backend_8080_exposure.sh` shows public 8080 not directly usable from this network, but ECS-2 still listens on `0.0.0.0:8080` and firewall/security-group restriction is not proven. | Needs hardening | Record Alibaba Cloud security group evidence or explicit user waiver; complete HTTPS/WeChat domain setup. |

Detailed launch evidence is tracked in `docs/MVP-Launch-Evidence.md` and
`docs/MVP-Launch-Evidence.json`. Final MVP completion requires the strict
evidence check to pass, or for missing external evidence to be explicitly
waived by the user.

The execution runbook for the remaining external evidence is
`docs/MVP-External-Validation-Runbook.md`.

Miniapp manual QA is tracked separately in `docs/Miniapp-Manual-QA.md` and
`docs/Miniapp-Manual-QA.json`.

Admin-web manual QA is tracked separately in `docs/Admin-Web-MVP-QA.md` and
`docs/Admin-Web-Manual-QA.json`.

Backend `8080` hardening evidence is tracked separately in
`docs/Backend-8080-Security.md`.

## 3. Final Verification Commands

Run before declaring the MVP goal complete:

```bash
scripts/check_mvp_regression.sh
RUN_PRODUCTION=1 scripts/check_mvp_regression.sh
```

```bash
node scripts/check_mvp_external_runbook.js
node scripts/generate_mvp_external_evidence_template.js
node scripts/check_mvp_external_evidence_template.js
node scripts/check_mvp_closeout_readiness.js
node scripts/check_mvp_closeout_readiness.js --strict
node scripts/check_mvp_launch_evidence.js --strict
node scripts/check_miniapp_manual_qa.js --strict
node scripts/check_admin_web_manual_qa.js --strict
```

```bash
cd sunflower-backend && mvn -B test
```

Backend/API verification notes live in `docs/Backend-MVP-QA.md`.

```bash
cd sunflower-admin-web && npm run lint && npm run test && npm run build
```

```bash
node scripts/check_admin_web_behavior_wiring.js
```

```bash
cd sunflower-miniapp
node ../scripts/check_miniapp_mvp_smoke.js
node ../scripts/check_miniapp_behavior_wiring.js
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
scripts/check_production_readonly_audit.sh
scripts/check_deploy_config.sh
RUN_INTERNAL=1 scripts/check_production_smoke.sh
RUN_INTERNAL=1 scripts/check_backend_8080_exposure.sh
```

Latest production smoke notes live in `docs/Production-Smoke.md`.

`scripts/check_production_readonly_audit.sh` is the production-only read-only
audit wrapper. It runs deploy config static checks, production smoke, and backend
`8080` exposure inspection. It does not push, deploy, reload Nginx, change ECS
configuration, or prove that the current branch is live.

`scripts/check_deploy_config.sh` is a local static deployability check for the
GitHub Actions workflow, production compose rendering, and deployment shell
syntax. It does not push, deploy, SSH to ECS, reload Nginx, or prove that the
current branch is live.

The aggregate local regression script intentionally runs manual evidence checks
in non-strict mode; strict evidence commands still need to pass separately
before MVP completion.

`node scripts/check_mvp_closeout_readiness.js` is the final closeout readiness
summary over launch, miniapp manual QA, and admin-web manual QA ledgers. Its
non-strict mode is safe for daily handoff and exits zero while listing pending
external evidence. Its `--strict` mode must pass before the MVP goal can be
declared complete.

`node scripts/generate_mvp_external_evidence_template.js` writes
`docs/MVP-External-Evidence-Template.md`, a sanitized capture template for the
remaining external QA items. `node scripts/check_mvp_external_evidence_template.js`
ensures the template still covers every unresolved required evidence item.

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

Detailed checklist and evidence rules:

- `docs/Miniapp-Manual-QA.md`

Admin web:

- Activate an allowlisted admin account through SMS.
- Login, logout, reset password, and change password.
- Confirm workspace health check reaches `/api/health`.
- Create/edit room and toggle shelf status.
- Update price and inventory for a date range.
- Filter orders by status, keyword, and check-in range.
- Open order detail and perform allowed operational actions.
- Retry a failed/abnormal refund record if test data exists.

Detailed checklist and evidence rules:

- `docs/Admin-Web-MVP-QA.md`

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
- `node scripts/check_mvp_launch_evidence.js --strict` currently fails by
  design because required external evidence remains pending.
- `node scripts/check_mvp_closeout_readiness.js --strict` currently fails by
  design because required launch, miniapp manual QA, and admin-web manual QA
  evidence remains pending.
- `node scripts/check_miniapp_manual_qa.js --strict` currently fails by design
  because miniapp preview/real-device/payment evidence remains pending.
- `node scripts/check_admin_web_manual_qa.js --strict` currently fails by
  design because admin production/staging manual QA evidence remains pending.
- `RUN_INTERNAL=1 scripts/check_backend_8080_exposure.sh` improves evidence but
  does not prove Alibaba Cloud security group restriction.

## 6. Next Rounds

1. Complete WeChat preview/real-device validation for login, phone binding,
   order creation, payment, refund, and after-sale flows.
2. Harden admin operational manual QA against a running backend or production.
3. Verify HTTPS legal request domain and backend `8080` restriction before
   declaring launch readiness.

## 7. Closeout Audit

Current completion audit:

- `docs/MVP-Closeout-Audit.md`
