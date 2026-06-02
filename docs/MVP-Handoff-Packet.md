# MVP Handoff Packet

> Current as of 2026-06-02. Start here before continuing the MVP hardening
> goal. This packet is a compact operator handoff, not proof that the MVP is
> complete.

## 1. Current Decision

The MVP goal is still open. Local automated checks and read-only production
smoke have strong coverage, but final closeout still has 33 unresolved required
items across launch evidence, miniapp manual QA, and admin-web manual QA.

Do not declare the goal complete until the strict commands in section 7 pass, or
the user explicitly waives the remaining external evidence.

## 2. Proven Baseline

- Backend local tests have passed with 57 tests.
- Admin web lint, unit tests, build, behavior wiring, and external QA preflight
  have passed.
- Miniapp syntax/smoke, behavior wiring, project config, navigation, and
  external QA preflight have passed.
- Production read-only checks have passed for public health/admin/API smoke,
  ECS private upstream checks, and backend `8080` exposure inspection.
- Deployment config static checks and deployment approval preflight exist.

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
scripts/check_mvp_regression.sh
RUN_PRODUCTION=1 scripts/check_mvp_regression.sh
node scripts/check_mvp_closeout_readiness.js
node scripts/generate_mvp_external_evidence_template.js
node scripts/check_mvp_external_evidence_template.js
node scripts/check_mvp_next_approval_request.js
node scripts/check_mvp_external_approval_packet.js
node scripts/check_deployment_approval_preflight.js
```

Use this read-only production audit only when the user expects production
checks:

```bash
scripts/check_production_readonly_audit.sh
```

## 4. Approval Boundaries

- Do not push to `main`, merge to `main`, run `workflow_dispatch`, or trigger a
  production deploy without explicit user approval first.
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
- `BACKEND-8080-HARDENING`: prove direct backend `8080` is restricted to ECS-1
  by security-group/firewall, or capture an explicit user risk waiver.
- `CURRENT-BRANCH-DEPLOYED`: prove the current branch commit was deployed by
  the approved GitHub Actions path, or capture an explicit out-of-scope decision.

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

## 7. Execution Order

1. Refresh local baseline with `scripts/check_mvp_regression.sh`.
2. Generate safe capture notes with
   `node scripts/generate_mvp_external_evidence_template.js`.
3. Validate the capture template with
   `node scripts/check_mvp_external_evidence_template.js`.
4. Prepare the next approval request with
   `docs/MVP-Next-Approval-Request.md`, then prepare the matching approval lane
   with
   `docs/MVP-External-Approval-Packet.md` before any external action that needs
   user confirmation.
5. Run miniapp preview or real-device QA and update
   `docs/Miniapp-Manual-QA.json`.
6. Run admin-web production or approved-staging QA and update
   `docs/Admin-Web-Manual-QA.json`.
7. Run backend `8080` read-only evidence and record security-group/firewall
   proof or a user waiver in the launch ledger.
8. Before any approved deploy action, run
   `node scripts/check_deployment_approval_preflight.js`.
9. After approved deploy, run `scripts/check_production_readonly_audit.sh`.
10. Run final strict closeout:

```bash
node scripts/check_mvp_launch_evidence.js --strict
node scripts/check_miniapp_manual_qa.js --strict
node scripts/check_admin_web_manual_qa.js --strict
node scripts/check_mvp_closeout_readiness.js --strict
```

Non-strict daily summaries:

```bash
node scripts/check_mvp_launch_evidence.js
node scripts/check_miniapp_manual_qa.js
node scripts/check_admin_web_manual_qa.js
node scripts/check_mvp_next_approval_request.js
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
