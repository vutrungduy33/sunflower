# MVP Readiness

> Current as of 2026-06-08 Round 112. This is the compact launch-readiness
> board for the MVP hardening goal. It is not a stage gate, and it should not
> duplicate the full round history.

## MVP Target

The MVP is usable when the primary customer path, operator path, backend APIs,
and deployment path are all verified with current evidence:

- Miniapp user path: WeChat login, phone binding, home/room browsing, order
  creation, payment flow, order list, cancel, reschedule, and refund request.
- Admin path: account activation/login/password flows, workspace health, room
  management, price/inventory management, order operations, after-sale actions,
  and business overview.
- Backend path: Spring Boot APIs backed by MySQL/Flyway, health endpoint,
  WeChat auth/pay/refund integration boundaries, SMS-backed admin account flows,
  and protected user/order/admin contracts.
- Deployment path: GitHub Actions deployment workflow is understandable and can
  deploy to the dual-ECS topology; production smoke and safety checks are
  recorded after an approved deploy.

## Current Status

| Area | Current evidence | Status | Next action |
| --- | --- | --- | --- |
| Backend local quality | Round 99 aggregate regression passed `mvn -B test` with 57 tests, 0 failures/errors/skips. Backend `8080` hardening was closed in Round 58 and rechecked in Round 100 production read-only audit. | Ready locally | Keep `mvn -B test` and backend `8080` exposure checks green after backend/deploy changes. |
| Admin web local quality | Round 111 refreshed the current `main` baseline: `npm run lint`, `npm run test` with 24 Vitest tests, `npm run build`, behavior wiring with 97 checks, external QA preflight with 6 checks, and entry readiness with 6 passes/2 expected HTTP-IP warnings all passed. | Ready locally | Rerun admin lint/test/build after admin-web changes. |
| Admin entry / manual QA | Round 108 added and passed `node scripts/check_admin_web_entry_readiness.js` for the temporary HTTP/IP admin entry, `/healthz`, and `/api/health`. This is not authenticated operator QA. | Partially verified | Run entry readiness first, then record safe authenticated admin evidence and require `node scripts/check_admin_web_manual_qa.js --strict`. |
| Miniapp automated checks | Round 112 refreshed the current `main` baseline: smoke passed with the expected bare HTTP warning, behavior wiring passed 69 checks, user-flow replay passed 3 scenarios, payment-flow replay passed 5 scenarios, external QA preflight passed with the expected missing-private-config warning, project config/nav guards passed, and key JavaScript syntax checks passed. | Partially verified | Record real AppID preview/real-device evidence, legal HTTPS domain, login, phone binding, booking, payment/refund, and error-state QA. |
| Miniapp HTTPS domain | Round 107 made `node scripts/check_miniapp_https_domain.js` require backend health JSON at `/api/health`. `sunflower.cloud` has a trusted GoDaddy cert valid until 2026-10-04 but returns an HTML lander; `xiangrikui.cloud`, `api.sunflower.cloud`, and `api.xiangrikui.cloud` fail TLS/SNI. | Not ready | Point the chosen ICP-filed API hostname to ECS-1, install/renew a trusted certificate, return backend health JSON, configure the WeChat legal request domain, and rerun the domain checker. |
| Payment / refund | Code supports real WeChat Pay/refund and explicit mock/nonprod mode. The user confirmed real payment private keys/config are not fully provisioned. Strict payment readiness still fails as expected. | Blocked by config/evidence | Use mock/nonprod only as reduced-scope evidence; keep real payment/refund pending until merchant config, keys, callback domain, and approved low-value evidence exist. |
| Deployment | GitHub Actions keeps a single deployment workflow. Round 91 proved backend-only `deployment_lane=nonprod-mock-payment` on ECS-2 for HEAD `d10d11e`. Round 100 production read-only audit passed current service smoke, backend `8080` exposure, and sanitized payment-config inspection. Later docs/checker pushes did not touch deploy-trigger paths. | Partially verified | For `CURRENT-BRANCH-DEPLOYED`, obtain approval, run clean `node scripts/check_deployment_approval_preflight.js`, deploy through the approved path, then record post-deploy smoke. |
| Security / compliance | Secrets are ECS/local-owned and ignored. Backend `8080` is bound to ECS-2 private IP. ICP-filed domains are `xiangrikui.cloud` and `sunflower.cloud`, but final HTTPS request-domain evidence is pending. | Partially ready | Keep secrets out of Git, preserve private backend binding, and finish HTTPS/legal-domain evidence before miniapp release. |

## Closeout Boundary

MVP completion is still unproven. Current unresolved required evidence remains:

- 8 launch evidence entries.
- 12 miniapp manual QA checks.
- 12 admin-web manual QA checks.
- 32 unresolved required items total.

The authoritative ledgers are:

- `docs/MVP-Launch-Evidence.json`
- `docs/Miniapp-Manual-QA.json`
- `docs/Admin-Web-Manual-QA.json`

The readable operator docs are:

- `docs/MVP-Handoff-Packet.md`
- `docs/MVP-External-Validation-Runbook.md`
- `docs/MVP-Next-Approval-Request.md`
- `docs/Miniapp-Manual-QA.md`
- `docs/Admin-Web-MVP-QA.md`

## Verification Commands

Run before declaring the goal complete:

```bash
scripts/check_mvp_regression.sh
RUN_PRODUCTION=1 scripts/check_mvp_regression.sh
```

```bash
node scripts/check_mvp_next_goal_prompt.js
node scripts/check_mvp_handoff_packet.js
node scripts/check_mvp_termination_audit.js
node scripts/check_mvp_launch_evidence.js --strict
node scripts/check_miniapp_manual_qa.js --strict
node scripts/check_admin_web_manual_qa.js --strict
node scripts/check_mvp_closeout_readiness.js --strict
```

Backend:

```bash
cd sunflower-backend && mvn -B test
```

Admin web:

```bash
cd sunflower-admin-web && npm run lint && npm run test && npm run build
node scripts/check_admin_web_behavior_wiring.js
node scripts/check_admin_web_external_qa_preflight.js
node scripts/check_admin_web_entry_readiness.js
```

Miniapp:

```bash
cd sunflower-miniapp
node ../scripts/check_miniapp_mvp_smoke.js
node ../scripts/check_miniapp_behavior_wiring.js
node ../scripts/check_miniapp_user_flow_replay.js
node ../scripts/check_miniapp_payment_flow_replay.js
node ../scripts/check_miniapp_external_qa_preflight.js
node ../scripts/check_miniapp_https_domain.js https://<api-domain>
node --check utils/mvp/api.js
node --check utils/mvp/payment.js
node --check pages/mvp/home/index.js
node --check pages/mvp/login/index.js
node --check pages/mvp/order-create/index.js
node --check pages/mvp/order-list/index.js
```

Deployment / production:

```bash
node scripts/check_deployment_approval_preflight.js
scripts/check_production_readonly_audit.sh
RUN_INTERNAL=1 scripts/check_production_smoke.sh
RUN_INTERNAL=1 scripts/check_backend_8080_exposure.sh
RUN_INTERNAL=1 scripts/check_backend_payment_config_readiness.sh
RUN_INTERNAL=1 ENFORCE_PAYMENT_CONFIG=1 scripts/check_backend_payment_config_readiness.sh
```

## Next Best Rounds

1. Finish one external evidence lane at a time, starting with HTTPS legal
   request domain or admin authenticated QA.
2. Record miniapp preview/real-device evidence with real AppID kept only in
   ignored `project.private.config.json`.
3. After payment keys/config are ready, run approved low-value real payment and
   refund validation, or record explicit waivers.
4. After any approved deploy, rerun production read-only audit and backend
   `8080` exposure checks before updating closeout status.
