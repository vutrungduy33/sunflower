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
| Backend local quality | Round 47 `RUN_PRODUCTION=1 scripts/check_mvp_regression.sh` reran `mvn -B test` on current local `main` HEAD `8d9b11d`: passed, 57 tests, 0 failures/errors/skips. Round 28 added public order ownership isolation across current-user list/detail/pay preparation/pay confirmation/cancel/reschedule/refund actions. | Ready locally | Keep green after future backend changes. |
| Admin web local quality | Round 47 aggregate regression reran `npm run lint`, `npm run test` (24 tests across 5 files), and `npm run build` on current local `main` HEAD `8d9b11d`: passed. Behavior wiring passed 97 checks and admin external QA preflight passed 6 checks. Order tests cover check-in, check-out, no-show, after-sale rejection, failed refund retry, and invalid check-in date-range feedback/query blocking. | Ready locally | Keep green after future admin changes. |
| Miniapp syntax/smoke | Round 47 reran miniapp smoke, behavior wiring, user-flow replay, payment-flow replay, external preflight, project config, and subpage nav checks on current local `main` HEAD `8d9b11d`: passed. The run still warns that the default API base is bare HTTP for local/devtools validation and local `project.private.config.json` is absent. | Partially verified | Real-device login/phone/payment evidence still required. |
| Miniapp real user path | Code supports real API, WeChat login, phone binding, `wx.requestPayment`, order and after-sale flows; manual QA ledger now exists. | Needs real-device evidence | Run `node scripts/check_miniapp_manual_qa.js --strict` after recording preview/real-device evidence. |
| WeChat pay/refund | Backend has WeChat payment/refund gateway, callbacks, records, retry, and mock only when explicitly configured; miniapp payment QA ledger now exists. | Needs production evidence | Verify small real payment/refund with merchant config and callback domain, then record sanitized evidence. |
| Admin operations path | Core pages and tests exist for auth, room, price/inventory, and order management; manual QA ledger now exists. | Partially verified | Run `node scripts/check_admin_web_manual_qa.js --strict` against deployed admin web after recording safe evidence. |
| Deployment | Round 47 `RUN_PRODUCTION=1 scripts/check_mvp_regression.sh` passed deploy config static checks plus production public/ECS internal smoke and backend `8080` read-only checks on current local `main` HEAD `8d9b11d`. Round 49 deployment preflight predicted local `main` HEAD `a072612b94a6` push target `all`. No push/deploy was performed. | Partially verified | Push/dispatch deploy only after explicit production approval; local `main` push can trigger `all` deployment. |
| Security / compliance | Secrets are local/ECS-owned; `.secrets/` ignored. Round 47 backend `8080` read-only checks show public 8080 not directly usable from this network, ECS-1 private upstream works, and ECS-2 backend health is present, but ECS-2 still listens on `0.0.0.0:8080` and firewall/security-group restriction is not proven. | Needs hardening | Record Alibaba Cloud security group evidence or explicit user waiver; complete HTTPS/WeChat domain setup. |

Detailed launch evidence is tracked in `docs/MVP-Launch-Evidence.md` and
`docs/MVP-Launch-Evidence.json`. Final MVP completion requires the strict
evidence check to pass, or for missing external evidence to be explicitly
waived by the user.

Latest aggregate regression:

- `RUN_PRODUCTION=1 scripts/check_mvp_regression.sh`: passed in Round 47 on
  current local `main` HEAD `8d9b11d` with backend, admin-web, miniapp,
  non-strict evidence, deploy config static checks, and production read-only
  checks enabled.
- The aggregate evidence checks remain non-strict and reported 33 unresolved
  required closeout items.

Latest direct admin-web automated evidence:

- `cd sunflower-admin-web && npm run lint`: passed in Round 47 on current local
  `main` HEAD `8d9b11d`.
- `cd sunflower-admin-web && npm run test`: passed in Round 47 on current local
  `main` HEAD `8d9b11d`, 24 tests across 5 files.
- `cd sunflower-admin-web && npm run build`: passed in Round 47 on current
  local `main` HEAD `8d9b11d`.
- `node scripts/check_admin_web_behavior_wiring.js`: passed in Round 47 with
  97 checks across 16 files.
- `node scripts/check_admin_web_external_qa_preflight.js`: passed in Round 47
  with 6 checks.
- The earlier resumed-goal notes about `_refundId` or 3 failing/timed-out admin
  tests are stale and did not reproduce on the current worktree.

Latest production/deployment read-only evidence:

- `node scripts/check_deployment_approval_preflight.js`: passed in Round 49 on
  current local `main` at HEAD `a072612b94a6`. Comparison base was
  `origin/main` at `89f93d704719`, changed files since base were 145, push to
  `main` is predicted to trigger deploy target `all`, and impact counts were
  backend 38, admin-web 5, ingress 1. No push, merge, workflow dispatch, or
  deployment was performed.
- Production checks inside `RUN_PRODUCTION=1 scripts/check_mvp_regression.sh`:
  passed in Round 47 with deploy config static checks, production public/ECS
  internal smoke, and backend `8080` exposure read-only checks enabled. No
  push, deploy, Nginx reload, ECS mutation, firewall mutation, or
  security-group mutation was performed.
- Backend `8080` hardening remains unresolved after the Round 47 direct
  read-only check because ECS-2 still listens on `0.0.0.0:8080` and local
  firewall output did not prove restriction.

The execution runbook for the remaining external evidence is
`docs/MVP-External-Validation-Runbook.md`.

The next human approval entry is `docs/MVP-Next-Approval-Request.md`. It turns
the 33 unresolved required evidence items into one-lane approval requests and is
checked by `node scripts/check_mvp_next_approval_request.js`.

The compact handoff entry for the next operator is
`docs/MVP-Handoff-Packet.md`. It is checked by
`node scripts/check_mvp_handoff_packet.js` to ensure the packet still covers all
unresolved required evidence IDs, approval boundaries, and closeout commands.

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
node scripts/check_mvp_external_approval_packet.js
node scripts/check_mvp_next_approval_request.js
node scripts/check_mvp_handoff_packet.js
node scripts/check_mvp_termination_audit.js
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
node scripts/check_admin_web_external_qa_preflight.js
```

```bash
cd sunflower-miniapp
node ../scripts/check_miniapp_mvp_smoke.js
node ../scripts/check_miniapp_behavior_wiring.js
node ../scripts/check_miniapp_user_flow_replay.js
node ../scripts/check_miniapp_payment_flow_replay.js
node ../scripts/check_miniapp_external_qa_preflight.js
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
node scripts/check_deployment_approval_preflight.js
scripts/check_production_readonly_audit.sh
scripts/check_deploy_config.sh
RUN_INTERNAL=1 scripts/check_production_smoke.sh
RUN_INTERNAL=1 scripts/check_backend_8080_exposure.sh
```

Latest production smoke notes live in `docs/Production-Smoke.md`.

`node scripts/check_deployment_approval_preflight.js` is the read-only
deployment approval preflight. It checks the active workflow shape, current
branch cleanliness, changed-file deployment impact against `main`, and the
`CURRENT-BRANCH-DEPLOYED` evidence boundary. It does not push, dispatch,
deploy, or prove the current branch is live.

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

`node scripts/check_mvp_handoff_packet.js` verifies
`docs/MVP-Handoff-Packet.md` still names every unresolved required launch,
miniapp, and admin-web evidence item, plus the required approval boundaries and
closeout commands.

`node scripts/check_mvp_termination_audit.js` verifies
`docs/MVP-Closeout-Audit.md` still maps the original user goal termination
criteria to current evidence and explicitly keeps the goal incomplete while
external/manual evidence remains pending.

`node scripts/check_mvp_next_approval_request.js` verifies
`docs/MVP-Next-Approval-Request.md` still names every unresolved evidence id,
approval lane, safety boundary, and validation command needed for the next
human-approved evidence round.

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
