# Miniapp MVP QA

> Current as of 2026-06-08 Round 112. This document records repeatable miniapp checks for
> the MVP hardening goal. Automated checks here do not replace WeChat real-device
> validation.

## 1. Automated Smoke

Run from the repository root:

```bash
node scripts/check_miniapp_mvp_smoke.js
node scripts/check_miniapp_behavior_wiring.js
node scripts/check_miniapp_user_flow_replay.js
node scripts/check_miniapp_payment_flow_replay.js
node scripts/check_miniapp_external_qa_preflight.js
bash scripts/check_miniapp_project_config.sh
bash scripts/check_mvp_subpage_nav.sh
```

The smoke script checks:

- MVP pages are registered in `sunflower-miniapp/app.json`.
- Each MVP page has `js/json/wxml/wxss` files.
- MVP page JavaScript and core `utils/mvp/*` files pass `node --check`.
- `utils/mvp/api.js`, `payment.js`, and `normalize.js` export the expected main
  path functions.
- `project.config.json` keeps the committed placeholder `touristappid`.
- `DEFAULT_API_BASE_URL` is present; non-HTTPS values are reported as a warning
  because they are only acceptable for local/devtools validation.
- `project.private.config.json` is ignored/untracked and safe to use for local
  real AppID preview without changing committed project configuration.

The behavior wiring script checks:

- Login, profile, home content, room browsing, order creation, payment, cancel,
  reschedule, and refund page methods are wired to the expected API/payment
  utility calls.
- WXML buttons, inputs, calendars, phone authorization, avatar selection, and
  status filters are bound to the expected page handlers.
- Booking date changes trigger a refreshed room search instead of leaving stale
  room results after the selected stay dates change.

The user-flow replay script checks:

- Home bootstrap executes login, content load, new-user profile prompt, booking
  navigation, order-center navigation, and login success tracking with stubbed
  `wx`/API helpers.
- Order creation blocks unbound-phone submission, binds a WeChat phone code,
  hydrates the guest phone, creates an order, invokes the payment helper, tracks
  order/payment events, and redirects to the order center.
- Order list loads and filters orders, invokes payment, cancels unpaid orders,
  submits refund requests, submits same-night reschedule requests, tracks
  payment/refund/reschedule events, and shows success feedback.

The payment-flow replay script checks:

- Explicit mock payment mode bypasses `wx.requestPayment` and still confirms the
  backend order state.
- Real payment mode passes backend payment parameters into `wx.requestPayment`.
- Real payment success confirms backend order state.
- Payment cancel/failure returns user-facing page states without confirming the
  backend order.
- Backend confirmation failure returns a confirming state so the page can send
  the user back to the order list for later refresh.

Latest local result:

- `node scripts/check_miniapp_mvp_smoke.js`: passed in Round 112 with the
  expected bare HTTP API warning for local/DevTools validation.
- `node scripts/check_miniapp_behavior_wiring.js`: passed in Round 112 with 69
  key behavior wiring checks across 14 files.
- `node scripts/check_miniapp_user_flow_replay.js`: passed in Round 112 with 3
  replay scenarios covering home/login bootstrap, order creation, and
  order-list actions.
- `node scripts/check_miniapp_payment_flow_replay.js`: passed in Round 112 with
  5 replay scenarios: mock payment, real payment success, real payment cancel,
  real payment failure, and backend confirmation-pending.
- `node scripts/check_miniapp_external_qa_preflight.js`: passed in Round 112
  with 6 checks and the expected local `project.private.config.json` absence
  warning.
- `bash scripts/check_miniapp_project_config.sh`: passed in Round 112.
- `bash scripts/check_mvp_subpage_nav.sh`: passed in Round 112.
- Key JavaScript `node --check` commands passed in Round 112 for
  `utils/mvp/api.js`, `utils/mvp/payment.js`, `pages/mvp/home/index.js`,
  `pages/mvp/login/index.js`, `pages/mvp/order-create/index.js`, and
  `pages/mvp/order-list/index.js`.

Manual preview/real-device evidence is tracked in:

- `docs/Miniapp-Manual-QA.md`
- `docs/Miniapp-Manual-QA.json`

Check commands:

```bash
node scripts/check_miniapp_manual_qa.js
node scripts/check_miniapp_manual_qa.js --strict
```

## 2. WeChat DevTools Setup

1. Open `/Users/chenyao/dev/miniapp/sunflower/sunflower-miniapp`.
2. Keep `project.config.json` committed as `touristappid`.
3. For real login/phone/payment validation, copy
   `project.private.config.example.json` to `project.private.config.json` and
   put the real AppID only in that ignored local file. WeChat DevTools gives
   `project.private.config.json` higher priority than `project.config.json`.
4. In develop/trial, use the login page API switcher or:

```js
wx.setStorageSync('SUNFLOWER_API_BASE_URL', 'https://<api-domain>')
```

5. Real device/preview validation must use HTTPS and a legal WeChat request
   domain. Bare `http://47.113.223.248` is for DevTools/local investigation
   only.

Known filed miniapp domain:

- `xiangrikui.cloud` and `sunflower.cloud` are the备案 domains provided by the
  user. This records the domain facts only; final MVP evidence still needs the
  concrete HTTPS API host, certificate validation, backend health JSON, and
  WeChat backend legal request-domain configuration before `WECHAT-DOMAIN` or
  `MINIAPP-DOMAIN-HTTPS` can be marked passed.

## 3. Manual QA Checklist

Login and profile:

- Open MVP home and confirm unauthenticated bootstrap reaches a logged-in state
  or redirects to the login page when logout is required.
- From login page, trigger WeChat login in develop/trial and verify token/profile
  are stored.
- Bind phone with `getPhoneNumber` on a real preview or approved test setup.
- Edit nickname/avatar from home profile prompt or mine page.
- Logout and verify the next entry returns to login.

Browse and booking:

- Home loads banners, services, featured rooms, and member benefits.
- Booking page loads rooms, filters by keyword, and updates date range.
- Room detail loads calendar, total amount, rules, and navigates to order create.
- Order create blocks submission when phone is not bound or guest data is
  invalid.
- Order create succeeds with bound phone and redirects to payment/order list.

Payment and order center:

- Dev/test mock payment returns success and refreshes the order list.
- Production payment calls `wx.requestPayment` and handles success, cancel, and
  failure feedback.
- Order list filters all supported statuses.
- Unpaid order can be cancelled.
- Paid confirmed order can submit a reschedule request.
- Paid confirmed order can submit a refund request.

Production acceptance:

- Verify API requests go through HTTPS public API domain.
- Verify WeChat backend legal request domain includes the API domain.
- Verify one low-value real payment and one refund with merchant credentials
  before launch.
- Record screenshots or logs externally; do not commit secrets or raw payment
  payloads.
- Record pass/fail/waiver status in `docs/Miniapp-Manual-QA.json` using
  sanitized evidence only.

## 4. Known Limits

- The repository cannot prove real WeChat login, phone authorization, or payment
  without a valid AppID, merchant configuration, HTTPS callback domain, and
  real-device/preview execution.
- `node --check` validates syntax only; it does not execute WeChat page
  lifecycles.
- `node scripts/check_miniapp_behavior_wiring.js` is a static wiring guard; it
  cannot prove runtime WeChat API behavior, backend persistence, or payment
  settlement.
- `node scripts/check_miniapp_user_flow_replay.js` executes page methods with
  Node.js stubs. It is stronger than syntax/static wiring for state flow
  regressions, but still does not replace WeChat preview/real-device QA.
- The committed default API base is currently a bare HTTP IP for DevTools
  validation and must be replaced or overridden by HTTPS before production
  preview/release.
- `project.private.config.json` is intentionally ignored. Do not commit a real
  AppID or local private DevTools settings.
- `node scripts/check_miniapp_manual_qa.js --strict` currently fails by design
  until preview/real-device, payment, refund, and error-state evidence is
  recorded or explicitly waived.
