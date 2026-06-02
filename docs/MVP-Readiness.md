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
| Backend local quality | Round 53 default aggregate regression reran `mvn -B test`: passed, 57 tests, 0 failures/errors/skips. Round 28 added public order ownership isolation across current-user list/detail/pay preparation/pay confirmation/cancel/reschedule/refund actions. | Ready locally | Keep green after future backend changes. |
| Admin web local quality | Round 53 default aggregate regression reran `npm run lint`, `npm run test` (24 tests across 5 files), and `npm run build`: passed. Behavior wiring passed 97 checks and admin external QA preflight passed 6 checks. Order tests cover check-in, check-out, no-show, after-sale rejection, failed refund retry, and invalid check-in date-range feedback/query blocking. | Ready locally | Keep green after future admin changes. |
| Miniapp syntax/smoke | Round 53 default aggregate regression reran miniapp smoke, behavior wiring, user-flow replay, payment-flow replay, external preflight, project config, and subpage nav checks: passed. The run still warns that the default API base is bare HTTP for local/devtools validation and local `project.private.config.json` is absent. | Partially verified | Real-device login/phone/payment evidence still required. |
| Miniapp real user path | Code supports real API, WeChat login, phone binding, `wx.requestPayment`, order and after-sale flows; manual QA ledger now exists. | Needs real-device evidence | Run `node scripts/check_miniapp_manual_qa.js --strict` after recording preview/real-device evidence. |
| WeChat pay/refund | Backend has WeChat payment/refund gateway, callbacks, records, retry, and mock only when explicitly configured; miniapp payment QA ledger now exists. | Needs production evidence | Verify small real payment/refund with merchant config and callback domain, then record sanitized evidence. |
| Admin operations path | Core pages and tests exist for auth, room, price/inventory, and order management; manual QA ledger now exists. | Partially verified | Run `node scripts/check_admin_web_manual_qa.js --strict` against deployed admin web after recording safe evidence. |
| Deployment | Round 60 pushed commit `98e68e0dd478` to `main` and triggered GitHub Actions run `26796051853`. Backend/admin-web builds succeeded, but the first deploy attempt stalled in ECS-2 checkout. Follow-up commits `9e8c087` and `d0af634` triggered run `26796607775`; ECS-2 checkout/artifact download/image load succeeded, but backend deploy failed production env validation because `WECHAT_PAY_MCH_ID` is missing while real payment mode is configured. | Blocked on production payment config | Provision real WeChat Pay production variables/key files on ECS-2, or explicitly switch the deployment lane to non-production/mock-payment with risk acceptance, then rerun deployment and post-deploy smoke. |
| Security / compliance | Secrets are local/ECS-owned; `.secrets/` ignored. Round 58 closed external backend `8080` by changing ECS-2 production `BACKEND_BIND_HOST` from `0.0.0.0` to `172.25.121.83`, recreating `sunflower-backend`, and verifying public 8080 is unusable while ECS-1 private upstream remains healthy. The user-provided miniapp备案 domain is `xiangrikui.cloud`, but HTTPS API host and WeChat legal request-domain configuration remain unverified. | Partially ready | Keep backend `8080` private after redeploys; complete HTTPS/WeChat domain setup. |

Detailed launch evidence is tracked in `docs/MVP-Launch-Evidence.md` and
`docs/MVP-Launch-Evidence.json`. Final MVP completion requires the strict
evidence check to pass, or for missing external evidence to be explicitly
waived by the user.

Latest aggregate regression:

- `scripts/check_mvp_regression.sh`: passed in Round 53 with the default 5
  non-production steps: backend tests, admin-web lint/test/build plus
  behavior/external preflight, miniapp smoke/wiring/replay/external preflight,
  non-strict evidence checks including the termination audit guard, and deploy
  config static checks.
- `RUN_PRODUCTION=1 scripts/check_mvp_regression.sh`: last passed in Round 47
  on local `main` HEAD `8d9b11d` with backend, admin-web, miniapp,
  non-strict evidence, deploy config static checks, and production read-only
  checks enabled.
- The aggregate evidence checks remain non-strict and still report 33
  unresolved required closeout items.

Latest direct admin-web automated evidence:

- `cd sunflower-admin-web && npm run lint`: passed in Round 53.
- `cd sunflower-admin-web && npm run test`: passed in Round 53, 24 tests across
  5 files.
- `cd sunflower-admin-web && npm run build`: passed in Round 53.
- `node scripts/check_admin_web_behavior_wiring.js`: passed in Round 53 with
  97 checks across 16 files.
- `node scripts/check_admin_web_external_qa_preflight.js`: passed in Round 53
  with 6 checks.
- The earlier resumed-goal notes about `_refundId` or 3 failing/timed-out admin
  tests are stale and did not reproduce on the current worktree.

Latest production/deployment evidence:

- Round 60 pushed current commit `98e68e0dd478` and triggered GitHub Actions
  run `26796051853`. The build phase succeeded for backend and admin-web.
  ECS-2 runner `ecs-2-backend` was re-registered after its old registration
  had been deleted by GitHub. The deploy phase then stalled in
  `actions/checkout` on ECS-2, and an ECS-2 curl probe to GitHub timed out
  after 12 seconds.
- Follow-up commits `9e8c087` and `d0af634` triggered run `26796607775` at
  HEAD `d0af634314d0`. This run proved ECS-2 checkout, artifact download, image
  load, and image availability, then failed deploy validation because
  `WECHAT_PAY_MCH_ID` is missing on ECS-2. Current branch deployment is still
  unproven because the backend container was not recreated from the new image.
- Backend `8080` hardening passed in Round 58. ECS-2 production
  `BACKEND_BIND_HOST` now binds the backend published port to
  `172.25.121.83`; `RUN_INTERNAL=1 ENFORCE_RESTRICTED=1
  scripts/check_backend_8080_exposure.sh` passed with 5 passes and 0 warnings.
  No Alibaba Cloud security group change was made.

Latest strict closeout evidence:

- Round 56 reran `node scripts/check_mvp_launch_evidence.js --strict`,
  `node scripts/check_miniapp_manual_qa.js --strict`,
  `node scripts/check_admin_web_manual_qa.js --strict`, and
  `node scripts/check_mvp_closeout_readiness.js --strict` on local `main` HEAD
  `d9db23166dba`.
- The strict commands failed as expected because 9 launch entries, 12 miniapp
  manual QA checks, and 12 admin-web manual QA checks remain unresolved. These
  are approval/evidence blockers, not local automated code regressions.
- No further local-only reruns can make the strict closeout commands pass
  without user-approved evidence, waivers, or deployment action.

The execution runbook for the remaining external evidence is
`docs/MVP-External-Validation-Runbook.md`.

The next human approval entry is `docs/MVP-Next-Approval-Request.md`. It turns
the 32 unresolved required evidence items into one-lane approval requests and is
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
`docs/Backend-8080-Security.md`; Round 58 marks it passed in
`docs/MVP-Launch-Evidence.json`.

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
RUN_INTERNAL=1 scripts/check_backend_payment_config_readiness.sh
RUN_INTERNAL=1 ENFORCE_PAYMENT_CONFIG=1 scripts/check_backend_payment_config_readiness.sh
```

Latest production smoke notes live in `docs/Production-Smoke.md`.

`node scripts/check_deployment_approval_preflight.js` is the read-only
deployment approval preflight. It checks the active workflow shape, current
branch cleanliness, changed-file deployment impact against `main`, and the
`CURRENT-BRANCH-DEPLOYED` evidence boundary. It does not push, dispatch,
deploy, or prove the current branch is live.

`scripts/check_production_readonly_audit.sh` is the production-only read-only
audit wrapper. It runs deploy config static checks, production smoke, backend
`8080` exposure inspection, and backend payment config readiness inspection. It
does not push, deploy, reload Nginx, change ECS configuration, print secrets, or
prove that the current branch is live.

`scripts/check_backend_payment_config_readiness.sh` is the read-only ECS-2
WeChat Pay production config preflight. Normal mode reports sanitized missing
config warnings; `ENFORCE_PAYMENT_CONFIG=1` makes missing required real-payment
config fail before an operator triggers deployment.

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
- Confirm direct public access to backend `8080` remains blocked and ECS-1
  private upstream remains healthy after future deploys.

## 5. Launch Blockers

- No recorded real-device WeChat login/phone/payment/refund validation yet.
- HTTPS legal request domain for miniapp production is not proven in this repo.
- Backend `8080` public exposure was closed in Round 58 by binding the backend
  published port to the ECS-2 private IP.
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
- `RUN_INTERNAL=1 ENFORCE_RESTRICTED=1 scripts/check_backend_8080_exposure.sh`
  passed in Round 58 and should pass with no warnings after future backend
  redeploys.

## 6. Next Rounds

1. Complete WeChat preview/real-device validation for login, phone binding,
   order creation, payment, refund, and after-sale flows.
2. Harden admin operational manual QA against a running backend or production.
3. Verify HTTPS legal request domain before declaring launch readiness; recheck
   backend `8080` restriction after any backend redeploy.

## 7. Closeout Audit

Current completion audit:

- `docs/MVP-Closeout-Audit.md`
