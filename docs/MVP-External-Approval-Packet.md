# MVP External Approval Packet

> Current as of 2026-06-02. Use this packet before collecting the remaining
> external MVP evidence. It is a pre-approval checklist and request template,
> not proof that any evidence has passed.

## 1. Purpose

Round 32 proved the repeatable local and production read-only baseline with
`RUN_PRODUCTION=1 scripts/check_mvp_regression.sh`. The remaining MVP blockers
need real external action: WeChat preview or real-device QA, legal HTTPS domain
verification, real payment/refund, admin production or approved-staging QA,
backend `8080` hardening evidence, and approved deployment evidence.

This packet turns those actions into explicit approval lanes so future Codex
runs do not accidentally mutate production, run real payments, expose secrets,
or mark evidence as complete from weak proof.

Unresolved required items: 33

## 2. Global Safety Rules

- Stop and request explicit user approval before any `push` to `main`, merge to
  `main`, `workflow_dispatch`, production deploy, security-group/firewall
  mutation, real payment, real refund, or live production data mutation.
- Do not record or commit real AppID values, openId/unionId, auth tokens,
  cookies, SMS codes, passwords, private keys, merchant credentials, raw
  screenshots with personal data, phone numbers, or full order/payment/refund
  identifiers.
- Record sanitized evidence only: date, environment, route/API, masked suffix
  or QA alias, action result, rollback/restoration result, and explicit waiver
  text when applicable.
- Prefer read-only checks first. If a lane requires mutation, name the exact
  data to be changed and the rollback or restoration plan before asking.
- Do not mark a ledger item `passed` or `waived` unless the matching strict
  checker can validate the entry quality afterward.

Reference basis:

- GitHub Actions environments support required reviewers and deployment
  protection rules for controlled deployments:
  `https://docs.github.com/en/actions/reference/deployments-and-environments`
- OWASP logging guidance warns against recording sensitive data and recommends
  sanitizing event data before storage:
  `https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html`

## 3. Approval Request Template

Use this template in the conversation before executing a lane that needs human
approval:

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

## 4. Approval Lanes

<!-- approval-lane:MINIAPP-PREVIEW-DOMAIN -->
### MINIAPP-PREVIEW-DOMAIN

Goal: prove the miniapp can run with the real AppID and legal HTTPS API domain,
then validate the main preview or real-device user path without committing
secrets.

Launch evidence covered:

- `WECHAT-DOMAIN`
- `WECHAT-PREVIEW-LOGIN`
- `WECHAT-PHONE`
- `MINIAPP-BOOKING-PATH`

Manual QA covered:

- `MINIAPP-DOMAIN-HTTPS`
- `MINIAPP-APPID-PREVIEW`
- `MINIAPP-WX-LOGIN`
- `MINIAPP-PHONE-BIND`
- `MINIAPP-HOME-CONTENT`
- `MINIAPP-ROOM-BROWSE`
- `MINIAPP-ORDER-CREATE`
- `MINIAPP-ORDER-LIST-ACTIONS`
- `MINIAPP-ERROR-STATES`

Approval boundary:

- Preview/login/domain checks can be read-only, but order creation or order
  actions against production data require explicit user approval and a QA-order
  cleanup plan.
- Real AppID must remain only in ignored
  `sunflower-miniapp/project.private.config.json`.

Validation after evidence:

```bash
node scripts/check_miniapp_manual_qa.js
node scripts/check_miniapp_manual_qa.js --strict
node scripts/check_mvp_launch_evidence.js
```

<!-- approval-lane:WECHAT-PAYMENT-REFUND -->
### WECHAT-PAYMENT-REFUND

Goal: prove payment and refund behavior with approved merchant configuration
using only low-value or explicitly approved QA transactions.

Launch evidence covered:

- `WECHAT-REAL-PAYMENT`
- `WECHAT-REAL-REFUND`

Manual QA covered:

- `MINIAPP-MOCK-PAYMENT`
- `MINIAPP-REAL-PAYMENT`
- `MINIAPP-REFUND`

Approval boundary:

- Real payment requires explicit user approval before execution.
- Real refund requires explicit user approval before execution.
- Record only masked order/payment/refund suffixes, amount band, callback/status
  summary, and final restoration/waiver decision.

Validation after evidence:

```bash
node scripts/check_miniapp_manual_qa.js
node scripts/check_mvp_launch_evidence.js
```

<!-- approval-lane:ADMIN-PROD-QA -->
### ADMIN-PROD-QA

Goal: prove admin-web operations with a dedicated QA admin account against
production or an approved staging target.

Launch evidence covered:

- `ADMIN-PROD-QA`

Manual QA covered:

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

Approval boundary:

- Account activation/reset/change must use a dedicated QA account.
- Room, price, inventory, order, after-sale, and refund operations require
  approved QA data and a rollback/restoration or explicit final-state decision.
- Do not record passwords, SMS codes, cookies, bearer tokens, raw customer data,
  or full order/refund identifiers.

Validation after evidence:

```bash
node scripts/check_admin_web_manual_qa.js
node scripts/check_admin_web_manual_qa.js --strict
node scripts/check_mvp_launch_evidence.js
```

<!-- approval-lane:BACKEND-8080-HARDENING -->
### BACKEND-8080-HARDENING

Goal: prove direct backend `8080` is restricted to ECS-1 by Alibaba Cloud
security group or host firewall, or capture an explicit user risk waiver.

Launch evidence covered:

- `BACKEND-8080-HARDENING`

Approval boundary:

- Read-only security group/firewall evidence collection can proceed only if it
  does not expose credentials or sensitive account identifiers in committed
  docs.
- Any security-group/firewall mutation requires explicit user approval first.
- If the user accepts the risk instead of hardening, record the waiver text and
  scope in `docs/MVP-Launch-Evidence.json` and
  `docs/Backend-8080-Security.md`.

Validation after evidence:

```bash
RUN_INTERNAL=1 scripts/check_backend_8080_exposure.sh
node scripts/check_mvp_launch_evidence.js
```

<!-- approval-lane:CURRENT-BRANCH-DEPLOYED -->
### CURRENT-BRANCH-DEPLOYED

Goal: prove the current committed MVP branch was deployed through the approved
GitHub Actions path, or capture an explicit decision that current-branch deploy
evidence is out of scope for MVP closeout.

Launch evidence covered:

- `CURRENT-BRANCH-DEPLOYED`

Approval boundary:

- Pushing to `main`, merging to `main`, or running `workflow_dispatch` requires
  explicit user approval first.
- Before approval, run the read-only deployment approval preflight and report
  branch, commit, predicted target, and deployment risk.
- Latest Round 41 preflight snapshot: branch `codex/s18-payment-hardening`,
  HEAD `5376567d2d1c`, base `origin/main` `5a37a6788c21`, 142 changed files
  since base, predicted deploy target `all`, impact counts backend 38,
  admin-web 5, ingress 1, no push/deploy performed.

Validation after evidence:

```bash
node scripts/check_deployment_approval_preflight.js
scripts/check_production_readonly_audit.sh
node scripts/check_mvp_launch_evidence.js
```

<!-- approval-lane:EVIDENCE-WAIVER -->
### EVIDENCE-WAIVER

Goal: record explicit user acceptance when a required external check cannot be
run safely but the user still wants to treat it as non-blocking for MVP closeout.

Approval boundary:

- A waiver must name the exact ledger id, accepted risk, reason, date, and
  scope. Do not use generic waiver language.
- Waivers must still pass the evidence quality checks; unresolved or too-short
  waiver evidence is rejected by the existing ledger scripts.

Validation after evidence:

```bash
node scripts/check_mvp_launch_evidence.js --strict
node scripts/check_miniapp_manual_qa.js --strict
node scripts/check_admin_web_manual_qa.js --strict
node scripts/check_mvp_closeout_readiness.js --strict
```

## 5. Completion Reminder

The MVP goal can be marked complete only after the final strict commands pass:

```bash
node scripts/check_mvp_launch_evidence.js --strict
node scripts/check_miniapp_manual_qa.js --strict
node scripts/check_admin_web_manual_qa.js --strict
node scripts/check_mvp_closeout_readiness.js --strict
node scripts/check_mvp_handoff_packet.js
```

Until then, keep the goal open and continue one approved evidence lane at a
time.
