# Miniapp Manual QA

> Current as of 2026-06-02. This is the WeChat DevTools preview / real-device QA
> entry point for the miniapp MVP user path. Automated syntax smoke does not
> replace this evidence.

## 1. Automated Baseline

Run from the repository root:

```bash
node scripts/check_miniapp_mvp_smoke.js
node scripts/check_miniapp_behavior_wiring.js
node scripts/check_miniapp_external_qa_preflight.js
bash scripts/check_miniapp_project_config.sh
bash scripts/check_mvp_subpage_nav.sh
```

Current recorded baseline:

- `node scripts/check_miniapp_mvp_smoke.js`: passed in the 2026-06-02 closeout
  audit with the expected bare HTTP API warning.
- `node scripts/check_miniapp_behavior_wiring.js`: passed in Round 16 with 69
  key behavior wiring checks across 14 files.
- `node scripts/check_miniapp_external_qa_preflight.js`: added in Round 21 to
  check AppID/private-config boundaries and external QA readiness without
  printing private AppID values.
- `bash scripts/check_miniapp_project_config.sh`: passed in the 2026-06-02
  closeout audit.
- `bash scripts/check_mvp_subpage_nav.sh`: passed in the 2026-06-02 closeout
  audit.

These checks prove project wiring, JavaScript syntax, and key static behavior
bindings only. They do not prove real WeChat login, phone authorization, legal
request domain, payment, refund, or device preview behavior.

## 2. Manual QA Ledger

Structured source:

- `docs/Miniapp-Manual-QA.json`

Check commands:

```bash
node scripts/check_miniapp_manual_qa.js
node scripts/check_miniapp_manual_qa.js --strict
```

Use the normal command during development to see unresolved miniapp evidence.
Use `--strict` only for final MVP completion; it exits non-zero until all
required miniapp manual checks are `passed` or `waived`.

Current result:

- Required checks: 12.
- Passed: 0.
- Pending: 12.
- Waived: 0.
- Blocked: 0.

## 3. Preview / Real-Device Rules

- Keep committed `sunflower-miniapp/project.config.json` at `touristappid`.
- Use a local uncommitted real AppID for preview or real-device validation by
  copying `sunflower-miniapp/project.private.config.example.json` to
  `sunflower-miniapp/project.private.config.json` and replacing only the local
  placeholder. WeChat DevTools gives this private file higher priority than
  `project.config.json`, and the file is ignored by Git.
- Override API base only with an HTTPS legal WeChat request domain:

```js
wx.setStorageSync('SUNFLOWER_API_BASE_URL', 'https://<api-domain>')
```

- User-provided miniapp备案 domain: `xiangrikui.cloud` (recorded on
  2026-06-02). Treat this as domain context only until a concrete HTTPS API
  host under the domain, certificate result, and WeChat legal request-domain
  configuration are verified.
- Do not commit real AppID, phone numbers, auth tokens, openId/unionId, merchant
  credentials, payment payloads, transaction ids, raw screenshots with personal
  data, or full order identifiers.
- Record compact evidence: date, environment version, API domain alias, route,
  sanitized order/resource alias or id suffix, result, and recovery/rollback
  notes.
- Any real payment/refund action requires explicit user confirmation before
  execution.

## 4. Manual QA Scope

Environment and domain:

- HTTPS API domain is configured as legal request domain in the WeChat backend.
- Preview/real-device run uses local real AppID while the committed AppID stays
  `touristappid`.

Auth:

- `wx.login` returns code, backend login returns token/profile, token persists,
  and profile restores through `/api/users/me`.
- `getPhoneNumber` returns phone code, backend phone binding succeeds, and order
  form receives the bound phone.

Browse and booking:

- Home content loads.
- Booking room list/filter and room detail/calendar load.
- Order creation blocks invalid input and succeeds with valid bound-phone data.

Payment and orders:

- Mock payment path works in approved dev/test mode when backend explicitly
  returns `MOCK_WECHAT_PAY`.
- Real low-value payment works in production mode after user approval.
- Order list filters statuses and supports cancel, reschedule, refund request,
  and visible status refresh.
- Refund or refund-request path is validated after user approval or explicitly
  waived when no safe data exists.

Resilience:

- Expired token, network/API failure, payment cancel/failure, invalid form data,
  and denied phone authorization show understandable feedback and recovery path.

## 5. Open-Source Reference Check

- Task classification: common miniapp preview/real-device, auth, request-domain,
  payment, and refund QA evidence tracking.
- Sources checked:
  - Existing project docs/code:
    `docs/Miniapp-MVP-QA.md`, `sunflower-miniapp/app.json`,
    `sunflower-miniapp/pages/mvp/**`, `sunflower-miniapp/utils/mvp/**`.
  - WeChat Mini Program network documentation:
    `https://developers.weixin.qq.com/miniprogram/dev/framework/ability/network.html`.
  - WeChat `wx.login` documentation:
    `https://developers.weixin.qq.com/miniprogram/dev/api/open-api/login/wx.login.html`.
  - WeChat phone-number capability documentation:
    `https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/getPhoneNumber.html`.
  - WeChat `wx.requestPayment` documentation:
    `https://developers.weixin.qq.com/miniprogram/dev/api/payment/wx.requestPayment.html`.
  - WeChat Pay Mini Program requestPayment guide:
    `https://pay.wechatpay.cn/doc/v3/merchant/4012791898`.
  - WeChat DevTools project configuration documentation:
    `https://developers.weixin.qq.com/miniprogram/dev/devtools/projectconfig.html`.
- Selected approach: JSON manual QA ledger plus Node checker, matching the
  project evidence-ledger pattern and avoiding a new device automation
  dependency before real AppID/domain/payment credentials are available.
- License/compatibility: no external code copied.
- Reused/adapted: project-local checker style and external validation
  requirements from official docs.
- Rejected options: committing real AppID or screenshots, storing payment
  payloads, adding device automation before credentials/domain are ready, or
  marking syntax smoke as proof of real WeChat behavior.
