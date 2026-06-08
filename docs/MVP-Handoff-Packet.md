# MVP Handoff Packet

> Current as of 2026-06-08 Round 115. Start here before continuing the MVP hardening
> goal. This packet is a compact operator handoff, not proof that the MVP is
> complete.

## 1. Current Decision

The MVP goal is still open. Local automated checks and read-only production
smoke have strong coverage, but final closeout still has 32 unresolved required
items across launch evidence, miniapp manual QA, and admin-web manual QA.

Do not declare the goal complete until the strict commands in section 7 pass, or
the user explicitly waives the remaining external evidence.

## 2. Proven Baseline

- Round 99 `scripts/check_mvp_regression.sh` passed on clean local `main`
  HEAD `af46357`, aligned with `origin/main`, with the default 5
  non-production steps: backend/admin-web/miniapp/evidence/deploy-config
  checks. Production checks were skipped by default.
- Round 115 `RUN_INTERNAL=1 scripts/check_production_readonly_audit.sh` passed
  with deploy config static checks, production public/ECS internal smoke,
  backend `8080` exposure checks, and backend payment-config readiness. No
  push, dispatch, deploy, ECS mutation, firewall/security-group mutation,
  payment/refund action, or live QA data mutation was performed.
- Backend local tests have passed with 57 tests. The latest direct backend
  baseline is Round 114.
- Admin web lint, unit tests, build, behavior wiring, external QA preflight,
  and entry readiness have passed. The latest direct admin-web baseline is
  Round 111 with `npm run lint`, `npm run test` (24 Vitest tests across 5
  files), `npm run build`, 97 behavior wiring checks, 6 external-preflight
  checks, and 6 entry-readiness passes with 2 expected HTTP/IP warnings.
- Miniapp syntax/smoke, behavior wiring, project config, navigation, external
  QA preflight, user-flow replay, and payment-flow replay have passed. The
  latest direct miniapp automated baseline is Round 112.
- Round 107 hardened the miniapp HTTPS domain checker so `/api/health` must
  return backend health JSON. `sunflower.cloud` currently has a trusted GoDaddy
  certificate but returns an HTML lander at `/api/health`, while
  `xiangrikui.cloud`, `api.sunflower.cloud`, and `api.xiangrikui.cloud` still
  fail TLS/SNI; `WECHAT-DOMAIN` remains pending.
- Round 108 added `node scripts/check_admin_web_entry_readiness.js`, which
  passed for the temporary HTTP/IP admin entry, `/healthz`, and `/api/health`
  with expected HTTP/IP warnings. This is not authenticated admin manual QA.
- Production read-only checks have passed for public health/admin/API smoke,
  ECS private upstream checks, and backend `8080` exposure inspection. Round
  115 had 7 production smoke passes, 5 backend `8080` exposure passes, and the
  latest payment-config readiness still reports the known sanitized real
  payment blockers.
- Deployment config static checks and deployment approval preflight exist. The
  latest successful backend-only nonprod/mock deployment remains Round 91 run
  `27112433529` for `d10d11e`; it proved the reduced-scope backend lane and
  post-deploy smoke, but not real payment/refund or admin-web/Nginx refresh.
  The latest production-lane evidence still fails on missing real WeChat Pay
  config, so current-branch deployment remains pending.
- Rounds 66-68 added an explicit backend-only non-production/mock-payment
  deployment lane. Manual `workflow_dispatch` with
  `deployment_lane=nonprod-mock-payment` and `target=auto` or `target=backend`
  validates `.env.nonprod-mock.example` and deploys only ECS-2 backend. Push to
  `main` and default `workflow_dispatch` remain production-lane. This nonprod
  lane can support approved MVP operator validation, but it is not real
  payment/refund evidence and does not refresh admin-web or Nginx.
- The latest recorded clean deployment preflight snapshot in the approval entry
  is Round 113: local `main` and `origin/main` were both at `c78fb9b5a645`,
  changed files since base were 0, and predicted push-to-main deploy target was
  `none`. Rerun `node scripts/check_deployment_approval_preflight.js` after
  any new commit and before any approved deploy. The recommended interim path
  while real payment private key/config is incomplete is explicit manual
  backend-only nonprod/mock-payment dispatch after approval.
- Round 58 backend `8080` hardening passed after ECS-2 backend host port was
  rebound to private IP `172.25.121.83`.
- Latest strict closeout shape confirms the goal is still incomplete:
  8 launch evidence items, 12 miniapp manual QA items, and 12 admin-web manual
  QA items remain unresolved.

The latest detailed state lives in `docs/Project-State.md`,
`docs/MVP-Readiness.md`, and `docs/MVP-Closeout-Audit.md`.

Before any external action that needs human approval, use
`docs/MVP-Next-Approval-Request.md` plus
`docs/MVP-External-Approval-Packet.md` and validate them with
`node scripts/check_mvp_next_approval_request.js` and
`node scripts/check_mvp_external_approval_packet.js`.

## 3. Do First

Run these before editing code or evidence:

```bash
git status --short --untracked-files=all
node scripts/check_mvp_closeout_readiness.js
node scripts/generate_mvp_external_evidence_template.js
node scripts/check_mvp_external_evidence_template.js
node scripts/check_mvp_next_approval_request.js
node scripts/check_mvp_next_goal_prompt.js
node scripts/check_mvp_external_approval_packet.js
```

Do not rerun the full aggregate baseline unless code, deployment state, or
production state changed; Round 99 refreshed the current local default
baseline. Before the `CURRENT-BRANCH-DEPLOYED` lane, rerun:

```bash
node scripts/check_deployment_approval_preflight.js
node scripts/check_workflow_dispatch_lane_matrix.js
bash scripts/check_nonprod_mock_payment_deploy_lane.sh
node scripts/check_nonprod_dispatch_readiness.js
scripts/dispatch_nonprod_mock_payment_deploy.sh --dry-run
```

Use this read-only production audit only when the user expects production
checks:

```bash
scripts/check_production_readonly_audit.sh
```

## 4. Approval Boundaries

- Do not push to `main`, merge to `main`, run `workflow_dispatch`, or trigger a
  production deploy without explicit user approval first.
- If the user approves non-production backend validation instead of production,
  use only `workflow_dispatch` with `deployment_lane=nonprod-mock-payment` and
  `target=auto` or `target=backend`; record that it is backend-only,
  mock-payment, and not real payment/refund evidence.
- Do not run real payment or real refund validation without explicit user
  approval first.
- Do not mutate Alibaba Cloud security-group/firewall rules without explicit
  user approval first.
- Do not mutate live production data unless the user has approved the exact QA
  action and rollback/restoration plan.
- Do not commit real AppID values, auth tokens, cookies, SMS codes, passwords,
  merchant credentials, private keys, raw screenshots with personal data, phone
  numbers, or full payment/order/refund identifiers.
- Keep the real AppID only in ignored
  `sunflower-miniapp/project.private.config.json`; committed
  `sunflower-miniapp/project.config.json` must remain `touristappid`.

## 5. Remaining Required Launch Evidence

These entries are still unresolved in `docs/MVP-Launch-Evidence.json`:

- `WECHAT-DOMAIN`: prove the HTTPS API domain is a valid WeChat legal request
  domain with certificate and ICP/domain readiness.
- `WECHAT-PREVIEW-LOGIN`: prove preview or real-device login obtains backend
  token/profile state without devtools-only bypasses.
- `WECHAT-PHONE`: prove phone authorization and backend binding in preview or
  real-device flow.
- `MINIAPP-BOOKING-PATH`: prove home/rooms/calendar/order-create/order-center
  path on preview or real device.
- `WECHAT-REAL-PAYMENT`: prove one approved low-value real WeChat payment.
- `WECHAT-REAL-REFUND`: prove one approved real refund or refund request path.
- `ADMIN-PROD-QA`: prove admin-web production or approved-staging manual QA.
- `CURRENT-BRANCH-DEPLOYED`: prove the current branch commit was deployed by
  the approved GitHub Actions path, or capture an explicit out-of-scope decision.
  Round 60 attempted this for `98e68e0dd478`; backend/admin-web images built,
  but ECS-2 checkout to GitHub stalled. Follow-up run `26796607775` for
  `d0af634314d0` reached ECS-2 image load and then failed because
  `WECHAT_PAY_MCH_ID` is missing, so this remains pending.
  An approved backend-only nonprod/mock-payment dispatch can provide deployment
  smoke evidence for that lane, but production current-branch deployment remains
  unproven unless the user explicitly accepts the reduced scope.

Latest strict launch evidence result after Round 58:

- Total required launch evidence: 13.
- Passed: 5.
- Pending: 8.
- Strict checker: `node scripts/check_mvp_launch_evidence.js --strict` exits
  non-zero until the pending items are passed or waived with valid evidence.

## 6. Remaining Manual QA Evidence

These miniapp entries are still unresolved in `docs/Miniapp-Manual-QA.json`:

- `MINIAPP-DOMAIN-HTTPS`
- `MINIAPP-APPID-PREVIEW`
- `MINIAPP-WX-LOGIN`
- `MINIAPP-PHONE-BIND`
- `MINIAPP-HOME-CONTENT`
- `MINIAPP-ROOM-BROWSE`
- `MINIAPP-ORDER-CREATE`
- `MINIAPP-MOCK-PAYMENT`
- `MINIAPP-REAL-PAYMENT`
- `MINIAPP-ORDER-LIST-ACTIONS`
- `MINIAPP-REFUND`
- `MINIAPP-ERROR-STATES`

Round 48 strict miniapp manual QA result:

- Total required miniapp manual QA checks: 12.
- Passed: 0.
- Pending: 12.
- Strict checker: `node scripts/check_miniapp_manual_qa.js --strict` exits
  non-zero until these items are passed or waived with valid evidence.

These admin-web entries are still unresolved in
`docs/Admin-Web-Manual-QA.json`:

- `ADMIN-AUTH-LOGIN`
- `ADMIN-AUTH-ACTIVATE`
- `ADMIN-AUTH-RESET-CHANGE`
- `ADMIN-WORKSPACE-HEALTH`
- `ADMIN-ROOM-LIST-EDIT`
- `ADMIN-ROOM-SHELF`
- `ADMIN-PRICING-CALENDAR`
- `ADMIN-PRICING-BATCH`
- `ADMIN-ORDER-LIST-DETAIL`
- `ADMIN-ORDER-OPS`
- `ADMIN-AFTER-SALE`
- `ADMIN-ERROR-STATES`

Round 48 strict admin-web manual QA result:

- Total required admin-web manual QA checks: 12.
- Passed: 0.
- Pending: 12.
- Strict checker: `node scripts/check_admin_web_manual_qa.js --strict` exits
  non-zero until these items are passed or waived with valid evidence.

## 7. Execution Order

1. Generate safe capture notes with
   `node scripts/generate_mvp_external_evidence_template.js`.
2. Validate the capture template with
   `node scripts/check_mvp_external_evidence_template.js`.
3. Prepare the next approval request with
   `docs/MVP-Next-Approval-Request.md`, then prepare the matching approval lane
   with
   `docs/MVP-External-Approval-Packet.md` before any external action that needs
   user confirmation.
4. Run miniapp preview or real-device QA and update
   `docs/Miniapp-Manual-QA.json`.
5. Run admin-web production or approved-staging QA and update
   `docs/Admin-Web-Manual-QA.json`.
6. Re-run backend `8080` hardening evidence after backend redeploys or
   production network changes; Round 58 already marks the launch ledger entry
   passed.
7. Before any approved deploy action, run
   `node scripts/check_deployment_approval_preflight.js`.
8. For backend-only nonprod/mock-payment deploy approval, also run
   `node scripts/check_workflow_dispatch_lane_matrix.js` and
   `bash scripts/check_nonprod_mock_payment_deploy_lane.sh`, then run
   `scripts/dispatch_nonprod_mock_payment_deploy.sh --dry-run` to print the
   exact approved command. After explicit approval, execute only with
   `CONFIRM_NONPROD_MOCK_DISPATCH=1` plus `--execute`; this dispatch must stay
   `target=auto` or `target=backend` with
   `deployment_lane=nonprod-mock-payment`.
9. After approved deploy, run `scripts/check_production_readonly_audit.sh`.
10. Run final strict closeout:

```bash
node scripts/check_mvp_launch_evidence.js --strict
node scripts/check_miniapp_manual_qa.js --strict
node scripts/check_admin_web_entry_readiness.js
node scripts/check_admin_web_manual_qa.js --strict
node scripts/check_mvp_closeout_readiness.js --strict
```

Non-strict daily summaries:

```bash
node scripts/check_mvp_launch_evidence.js
node scripts/check_miniapp_manual_qa.js
node scripts/check_admin_web_entry_readiness.js
node scripts/check_admin_web_manual_qa.js
node scripts/check_mvp_next_approval_request.js
node scripts/check_mvp_next_goal_prompt.js
node scripts/check_mvp_closeout_readiness.js
node scripts/check_mvp_handoff_packet.js
```

## 8. Completion Rule

The goal can be marked complete only when:

- `scripts/check_mvp_regression.sh` passes.
- `RUN_PRODUCTION=1 scripts/check_mvp_regression.sh` or
  `scripts/check_production_readonly_audit.sh` passes after any relevant deploy.
- `node scripts/check_mvp_launch_evidence.js --strict` passes.
- `node scripts/check_miniapp_manual_qa.js --strict` passes.
- `node scripts/check_admin_web_manual_qa.js --strict` passes.
- `node scripts/check_mvp_closeout_readiness.js --strict` passes.
- `git status --short --untracked-files=all` is clean after the final round
  commit.

If these cannot pass because external approval or real-world evidence is
missing, stop the current goal and report the updated goal prompt for human
approval rather than marking the work complete.
