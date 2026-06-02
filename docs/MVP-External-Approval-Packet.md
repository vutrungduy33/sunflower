# MVP External Approval Packet

> Current as of 2026-06-02. Compact approval boundary for the remaining MVP
> external evidence. This is not proof that any evidence has passed.

## Current Count

Unresolved required items: 32

Backend `8080` hardening passed in Round 58. Revalidate it after backend
redeploys or network changes, but it is no longer an unresolved item.

## Global Safety Rules

- Stop and request explicit user approval before any `push` to `main`, merge to
  `main`, `workflow_dispatch`, production deploy, security-group/firewall
  mutation, real payment, real refund, or live production data mutation.
- Real payment requires explicit user approval.
- Real refund requires explicit user approval.
- Do not record or commit real AppID values, openId/unionId, auth tokens,
  cookies, SMS codes, passwords, private keys, merchant credentials, raw
  screenshots with personal data, phone numbers, or full order/payment/refund
  identifiers.
- Record only sanitized date, environment, route/API, masked suffix or QA alias,
  action result, rollback/restoration result, and waiver text when applicable.
- Every lane must include a Rollback/restoration plan and Abort conditions.

## Approval Request Template

```text
Approval lane:
Requested action:
Environment:
Will this mutate production data or configuration:
Will this run real payment or real refund:
Will this trigger GitHub Actions deployment:
Exact commands or manual steps:
Expected evidence to record:
Sensitive data that must stay out of Git:
Rollback/restoration plan:
Abort conditions:
Ledger entries to update after approval:
```

## Lanes

<!-- approval-lane:MINIAPP-PREVIEW-DOMAIN -->
### MINIAPP-PREVIEW-DOMAIN

Unresolved ids:

- `WECHAT-DOMAIN`
- `WECHAT-PREVIEW-LOGIN`
- `WECHAT-PHONE`
- `MINIAPP-BOOKING-PATH`
- `MINIAPP-DOMAIN-HTTPS`
- `MINIAPP-APPID-PREVIEW`
- `MINIAPP-WX-LOGIN`
- `MINIAPP-PHONE-BIND`
- `MINIAPP-HOME-CONTENT`
- `MINIAPP-ROOM-BROWSE`
- `MINIAPP-ORDER-CREATE`
- `MINIAPP-ORDER-LIST-ACTIONS`
- `MINIAPP-ERROR-STATES`

Boundary: real AppID stays only in ignored `project.private.config.json`;
production order mutations need explicit scope and cleanup.

<!-- approval-lane:WECHAT-PAYMENT-REFUND -->
### WECHAT-PAYMENT-REFUND

Unresolved ids:

- `WECHAT-REAL-PAYMENT`
- `WECHAT-REAL-REFUND`
- `MINIAPP-MOCK-PAYMENT`
- `MINIAPP-REAL-PAYMENT`
- `MINIAPP-REFUND`

Boundary: use only approved low-value QA transactions and masked suffixes.

<!-- approval-lane:ADMIN-PROD-QA -->
### ADMIN-PROD-QA

Unresolved ids:

- `ADMIN-PROD-QA`
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

Boundary: use a dedicated QA admin account and approved QA data; do not record
passwords, SMS codes, cookies, bearer tokens, raw customer data, or full order
ids.

<!-- approval-lane:BACKEND-8080-HARDENING -->
### BACKEND-8080-HARDENING

Status: passed in Round 58. Revalidate after backend redeploys or topology
changes.

```bash
RUN_INTERNAL=1 scripts/check_backend_8080_exposure.sh
RUN_INTERNAL=1 ENFORCE_RESTRICTED=1 scripts/check_backend_8080_exposure.sh
node scripts/check_mvp_launch_evidence.js
```

<!-- approval-lane:CURRENT-BRANCH-DEPLOYED -->
### CURRENT-BRANCH-DEPLOYED

Unresolved ids:

- `CURRENT-BRANCH-DEPLOYED`

Boundary: before push/merge/workflow dispatch, run deployment preflight and
report branch, commit, predicted target, and risk.

Deploy-lane choices:

- Production lane: push to `main` or default `workflow_dispatch`; requires real
  production payment config before claiming production readiness.
- Backend-only nonprod/mock-payment lane: manual `workflow_dispatch` with
  `deployment_lane=nonprod-mock-payment` and `target=auto` or `target=backend`;
  validates `.env.nonprod-mock.example`, deploys only ECS-2 backend, does not
  refresh admin-web or Nginx, and is not real payment/refund evidence.

Required preflight before asking for backend-only nonprod dispatch approval:

```bash
node scripts/check_deployment_approval_preflight.js
node scripts/check_workflow_dispatch_lane_matrix.js
bash scripts/check_nonprod_mock_payment_deploy_lane.sh
node scripts/check_nonprod_dispatch_readiness.js
```

<!-- approval-lane:EVIDENCE-WAIVER -->
### EVIDENCE-WAIVER

Use only for explicit itemized user waivers. The waiver must name the exact
ledger id, accepted risk, reason, date, and scope.

## Validation Commands

```bash
node scripts/check_miniapp_manual_qa.js --strict
node scripts/check_admin_web_manual_qa.js --strict
node scripts/check_mvp_launch_evidence.js --strict
node scripts/check_mvp_closeout_readiness.js --strict
node scripts/check_mvp_handoff_packet.js
node scripts/check_deployment_approval_preflight.js
node scripts/check_workflow_dispatch_lane_matrix.js
bash scripts/check_nonprod_mock_payment_deploy_lane.sh
node scripts/check_nonprod_dispatch_readiness.js
scripts/check_production_readonly_audit.sh
```

Until then, keep the goal open.
