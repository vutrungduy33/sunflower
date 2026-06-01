# MVP External Validation Runbook

> Current as of 2026-06-02. This is the operator handoff runbook for the
> remaining external MVP evidence. It does not replace the machine-readable
> ledgers; it tells a human how to execute and record them safely.

## 1. Purpose

The local repository already has green automated checks for backend, admin web,
miniapp syntax/smoke, production smoke, and deployment config syntax. Final MVP
completion still needs external evidence that cannot be proven by local tests
alone:

- WeChat legal HTTPS request domain and preview/real-device execution.
- Real AppID, login, phone authorization, order path, payment, and refund
  evidence.
- Admin web production or approved-staging QA with a dedicated account.
- Backend `8080` security-group/firewall evidence or explicit risk waiver.
- Current branch deployment through the approved GitHub Actions path, or an
  explicit out-of-scope decision.

For a compact first-read handoff, start with `docs/MVP-Handoff-Packet.md` and
validate it with `node scripts/check_mvp_handoff_packet.js`.

Before any external action that needs human approval, prepare the matching lane
in `docs/MVP-External-Approval-Packet.md` and validate the packet with
`node scripts/check_mvp_external_approval_packet.js`.

## 2. Safety Rules

- Do not commit real AppID values, openId/unionId, auth tokens, phone numbers,
  SMS codes, passwords, cookies, payment payloads, merchant credentials, private
  keys, raw screenshots with personal data, or full order/payment ids.
- Record compact evidence only: date, environment, masked/sanitized id suffix,
  route or API, result, and rollback/restoration decision.
- Stop for explicit user approval before any `push main`,
  `workflow_dispatch`, real payment, real refund, security-group/firewall
  mutation, or live production data mutation.
- If a check cannot be run safely, record `waived` only when the user explicitly
  accepts the missing validation for MVP launch.
- Keep committed `sunflower-miniapp/project.config.json` as `touristappid`.

## 3. Execution Order

1. Confirm local baseline is still green:

```bash
scripts/check_mvp_regression.sh
scripts/check_deploy_config.sh
```

2. Prepare external environment evidence:
   - Confirm the HTTPS API domain, certificate, ICP/domain eligibility, and
     WeChat legal request-domain configuration.
   - Confirm the local preview uses a real AppID without committing it.
   - Confirm backend, admin web, WeChat, SMS, payment, and callback configuration
     are the intended environment.
   - Generate the sanitized evidence capture template:

```bash
node scripts/generate_mvp_external_evidence_template.js
node scripts/check_mvp_external_evidence_template.js
node scripts/check_mvp_external_approval_packet.js
```

   - Fill `docs/MVP-External-Evidence-Template.md` during execution, then copy
     only sanitized evidence summaries back into the JSON ledgers.

3. Execute miniapp preview or real-device QA:
   - Record results in `docs/Miniapp-Manual-QA.json`.
   - Run `node scripts/check_miniapp_manual_qa.js` after each update.

4. Execute admin web production or approved-staging QA:
   - Record results in `docs/Admin-Web-Manual-QA.json`.
   - Run `node scripts/check_admin_web_manual_qa.js` after each update.

5. Complete deployment/security evidence:
   - Before requesting any push, merge, or `workflow_dispatch`, run the
     read-only deployment approval preflight:

```bash
node scripts/check_deployment_approval_preflight.js
```

   - Re-run the read-only production audit:

```bash
scripts/check_production_readonly_audit.sh
```

   - Record backend `8080` evidence in `docs/Backend-8080-Security.md` and
     `docs/MVP-Launch-Evidence.json`.
   - Record current-branch deployment evidence in `docs/MVP-Launch-Evidence.json`
     only after an approved GitHub Actions deploy or explicit scope decision.

6. Final strict checks:

```bash
node scripts/check_mvp_launch_evidence.js --strict
node scripts/check_miniapp_manual_qa.js --strict
node scripts/check_admin_web_manual_qa.js --strict
```

## 4. Required Launch Evidence

<!-- evidence:WECHAT-DOMAIN -->
### WECHAT-DOMAIN

- Ledger: `docs/MVP-Launch-Evidence.json`, with supporting miniapp entry
  `MINIAPP-DOMAIN-HTTPS`.
- Goal: miniapp production API uses an HTTPS legal request domain configured in
  the WeChat backend, with valid certificate and ICP/domain eligibility.
- Evidence to record: domain alias, verification date, certificate result,
  WeChat legal-domain result, and non-secret operator note.
- Stop condition: do not record `passed` if the API base is only bare
  `http://47.113.223.248`.

<!-- evidence:WECHAT-PREVIEW-LOGIN -->
### WECHAT-PREVIEW-LOGIN

- Ledger: `docs/MVP-Launch-Evidence.json`, with supporting miniapp entries
  `MINIAPP-APPID-PREVIEW` and `MINIAPP-WX-LOGIN`.
- Goal: WeChat preview or real-device login obtains backend token and restores
  profile state without devtools-only bypasses.
- Evidence to record: date, environment version, AppID handling confirmation,
  route, token/profile success summary, and non-secret failure notes if any.
- Stop condition: do not commit the real AppID or tokens.

<!-- evidence:WECHAT-PHONE -->
### WECHAT-PHONE

- Ledger: `docs/MVP-Launch-Evidence.json`, with supporting miniapp entry
  `MINIAPP-PHONE-BIND`.
- Goal: phone authorization and backend phone binding succeed in preview or
  real-device flow.
- Evidence to record: date, route, masked phone suffix or non-secret success
  summary, and whether the order form received the bound phone.

<!-- evidence:MINIAPP-BOOKING-PATH -->
### MINIAPP-BOOKING-PATH

- Ledger: `docs/MVP-Launch-Evidence.json`, with supporting miniapp entries
  `MINIAPP-HOME-CONTENT`, `MINIAPP-ROOM-BROWSE`, `MINIAPP-ORDER-CREATE`,
  `MINIAPP-ORDER-LIST-ACTIONS`, and `MINIAPP-ERROR-STATES`.
- Goal: user can browse home/rooms/calendar, create an order, and see it in the
  order center in preview or real-device flow.
- Evidence to record: sanitized room alias, date range, order id suffix or QA
  alias, expected validation failures, status filter/action results, and
  recovery behavior.

<!-- evidence:WECHAT-REAL-PAYMENT -->
### WECHAT-REAL-PAYMENT

- Ledger: `docs/MVP-Launch-Evidence.json`, with supporting miniapp entries
  `MINIAPP-MOCK-PAYMENT` and `MINIAPP-REAL-PAYMENT`.
- Goal: one low-value real WeChat payment completes with merchant configuration,
  backend confirmation, and visible order status update.
- Evidence to record: explicit approval note, masked order/payment suffix,
  amount band, payment success/cancel/failure result, backend confirm/status
  summary, and callback/check result.
- Stop condition: real payment requires explicit user approval before execution.

<!-- evidence:WECHAT-REAL-REFUND -->
### WECHAT-REAL-REFUND

- Ledger: `docs/MVP-Launch-Evidence.json`, with supporting miniapp entry
  `MINIAPP-REFUND`.
- Goal: one real refund or refund request path is validated with merchant
  configuration and backend status update.
- Evidence to record: explicit approval note, masked order/refund suffix,
  refund request or refund result, backend status summary, and whether a waiver
  was used because no safe payment/refund data existed.
- Stop condition: real refund requires explicit user approval before execution.

<!-- evidence:ADMIN-PROD-QA -->
### ADMIN-PROD-QA

- Ledger: `docs/MVP-Launch-Evidence.json`, with all required
  `docs/Admin-Web-Manual-QA.json` checks as support.
- Goal: a real admin account can complete activation/login/password/account,
  room/price/inventory, order operations, and summary checks against production
  or approved staging.
- Evidence to record: environment, role label, masked account identifier,
  sanitized room/order aliases, safe mutation results, rollback/restoration
  decisions, and explicit waivers for unsafe live mutations.
- Stop condition: do not record passwords, SMS codes, bearer tokens, cookies, or
  raw customer/order data.

<!-- evidence:BACKEND-8080-HARDENING -->
### BACKEND-8080-HARDENING

- Ledger: `docs/MVP-Launch-Evidence.json`, with detailed notes in
  `docs/Backend-8080-Security.md`.
- Goal: direct public access to backend port `8080` is restricted to ECS-1 by
  security group or host firewall, or explicitly accepted by the user as a
  launch risk.
- Evidence to record: Alibaba Cloud security-group rule summary or host firewall
  evidence, ECS-1 private upstream result, and current direct-public probe
  result.
- Stop condition: changing a security group or firewall requires explicit user
  approval.

<!-- evidence:CURRENT-BRANCH-DEPLOYED -->
### CURRENT-BRANCH-DEPLOYED

- Ledger: `docs/MVP-Launch-Evidence.json`.
- Goal: current committed MVP branch code has been deployed through the approved
  GitHub Actions path, or deployment is explicitly declared out of scope by the
  user.
- Evidence to record: approval note, commit SHA, workflow run id/url, target,
  deploy result, production smoke result, or explicit out-of-scope decision.
- Stop condition: pushing `main`, merging, or `workflow_dispatch` requires
  explicit user approval.

## 5. Manual QA Coverage Map

### Miniapp Required Checks

<!-- miniapp:MINIAPP-DOMAIN-HTTPS -->
<!-- miniapp:MINIAPP-APPID-PREVIEW -->
<!-- miniapp:MINIAPP-WX-LOGIN -->
<!-- miniapp:MINIAPP-PHONE-BIND -->
<!-- miniapp:MINIAPP-HOME-CONTENT -->
<!-- miniapp:MINIAPP-ROOM-BROWSE -->
<!-- miniapp:MINIAPP-ORDER-CREATE -->
<!-- miniapp:MINIAPP-MOCK-PAYMENT -->
<!-- miniapp:MINIAPP-REAL-PAYMENT -->
<!-- miniapp:MINIAPP-ORDER-LIST-ACTIONS -->
<!-- miniapp:MINIAPP-REFUND -->
<!-- miniapp:MINIAPP-ERROR-STATES -->

Details live in `docs/Miniapp-Manual-QA.json`.

### Admin Web Required Checks

<!-- admin:ADMIN-AUTH-LOGIN -->
<!-- admin:ADMIN-AUTH-ACTIVATE -->
<!-- admin:ADMIN-AUTH-RESET-CHANGE -->
<!-- admin:ADMIN-WORKSPACE-HEALTH -->
<!-- admin:ADMIN-ROOM-LIST-EDIT -->
<!-- admin:ADMIN-ROOM-SHELF -->
<!-- admin:ADMIN-PRICING-CALENDAR -->
<!-- admin:ADMIN-PRICING-BATCH -->
<!-- admin:ADMIN-ORDER-LIST-DETAIL -->
<!-- admin:ADMIN-ORDER-OPS -->
<!-- admin:ADMIN-AFTER-SALE -->
<!-- admin:ADMIN-ERROR-STATES -->

Details live in `docs/Admin-Web-Manual-QA.json`.
