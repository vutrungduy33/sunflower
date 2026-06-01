# MVP Launch Evidence

> Current as of 2026-06-02. This is the evidence ledger for the active MVP
> hardening goal. It complements `docs/MVP-Readiness.md` and prevents external
> validation gaps from being mistaken for completed launch readiness.

## 1. Machine-Readable Ledger

Structured source:

- `docs/MVP-Launch-Evidence.json`
- Miniapp sub-ledger: `docs/Miniapp-Manual-QA.json`
- Admin web sub-ledger: `docs/Admin-Web-Manual-QA.json`

Check commands:

```bash
node scripts/check_mvp_launch_evidence.js
node scripts/check_mvp_launch_evidence.js --strict
node scripts/check_miniapp_manual_qa.js
node scripts/check_miniapp_manual_qa.js --strict
node scripts/check_admin_web_manual_qa.js
node scripts/check_admin_web_manual_qa.js --strict
RUN_INTERNAL=1 scripts/check_backend_8080_exposure.sh
```

Use the first command during normal rounds to print the current evidence status.
Use `--strict` only when attempting final MVP completion; it exits non-zero
while required evidence remains `pending` or `blocked`.

Allowed status values:

- `passed`: evidence is recorded and sufficient for the stated requirement.
- `pending`: evidence is missing or too weak.
- `blocked`: the requirement cannot currently be verified without external
  action.
- `waived`: the user explicitly accepted the missing requirement or risk for MVP
  launch.

## 2. Current Result

Current machine-check result:

- Required entries: 13.
- Passed: 4.
- Pending: 9.
- Waived: 0.
- Blocked: 0.

The MVP goal is therefore still open.

## 3. Required External Evidence

The remaining launch evidence is concentrated in these areas:

- WeChat HTTPS legal request domain and certificate readiness.
- WeChat preview or real-device login. Detailed miniapp QA ledger:
  `docs/Miniapp-Manual-QA.md`.
- Phone authorization and backend phone binding. Detailed miniapp QA ledger:
  `docs/Miniapp-Manual-QA.md`.
- Miniapp booking path through order creation and order center. Detailed miniapp
  QA ledger: `docs/Miniapp-Manual-QA.md`.
- One low-value real payment and one refund/refund request validation.
- Admin web production manual QA with a real admin account. Detailed admin QA
  ledger: `docs/Admin-Web-MVP-QA.md`.
- Backend `8080` direct-access restriction or explicit user risk acceptance.
  Detailed security evidence: `docs/Backend-8080-Security.md`.
- Approved deployment of current branch code through GitHub Actions, or explicit
  user decision that deployment is out of MVP closeout scope.

## 4. Evidence Recording Rules

- Do not commit real AppID replacements, merchant credentials, SMS secrets,
  phone numbers, payment payloads, private keys, or raw screenshots containing
  sensitive data.
- Record compact pass/fail summaries, dates, environment, and non-secret ids
  only.
- If evidence lives outside the repo, record where it can be found without
  exposing secrets.
- Any real payment/refund, security group change, push to `main`, or
  `workflow_dispatch` production deploy requires explicit user confirmation
  before execution.

## 5. Reference Check

Open-source/reference review for this evidence ledger:

- Task classification: common release-readiness and external evidence tracking
  for a WeChat/payment MVP.
- Sources checked:
  - Existing project docs and scripts:
    `docs/MVP-Readiness.md`, `docs/Miniapp-MVP-QA.md`,
    `docs/Production-Smoke.md`, `scripts/check_production_smoke.sh`.
  - WeChat Pay merchant JSAPI development guide:
    `https://pay.wechatpay.cn/doc/v3/merchant/4012791911`.
  - WeChat Pay Mini Program requestPayment guide:
    `https://pay.wechatpay.cn/doc/v3/merchant/4012791898`.
  - WeChat Mini Program network documentation:
    `https://developers.weixin.qq.com/miniprogram/dev/framework/ability/network.html`.
- Selected approach: keep a local JSON ledger plus a Node.js checker instead of
  adding a release-management dependency.
- License/compatibility: no external code copied.
- Reused/adapted: only repository-local verification style and the external
  requirements implied by the referenced docs.
- Rejected options: storing screenshots/payment payloads in Git, adding a
  third-party checklist SaaS, or treating local automated checks as proof of
  real WeChat/payment readiness.
