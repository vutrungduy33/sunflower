# Miniapp MVP QA

> Current as of 2026-06-02. This document records repeatable miniapp checks for
> the MVP hardening goal. Automated checks here do not replace WeChat real-device
> validation.

## 1. Automated Smoke

Run from the repository root:

```bash
node scripts/check_miniapp_mvp_smoke.js
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

## 2. WeChat DevTools Setup

1. Open `/Users/chenyao/dev/miniapp/sunflower/sunflower-miniapp`.
2. Keep `project.config.json` committed as `touristappid`.
3. For real login/phone/payment validation, use a local uncommitted real AppID
   and restore `touristappid` before committing.
4. In develop/trial, use the login page API switcher or:

```js
wx.setStorageSync('SUNFLOWER_API_BASE_URL', 'https://<api-domain>')
```

5. Real device/preview validation must use HTTPS and a legal WeChat request
   domain. Bare `http://47.113.223.248` is for DevTools/local investigation
   only.

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

## 4. Known Limits

- The repository cannot prove real WeChat login, phone authorization, or payment
  without a valid AppID, merchant configuration, HTTPS callback domain, and
  real-device/preview execution.
- `node --check` validates syntax only; it does not execute WeChat page
  lifecycles.
- The committed default API base is currently a bare HTTP IP for DevTools
  validation and must be replaced or overridden by HTTPS before production
  preview/release.
