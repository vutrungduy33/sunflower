# Admin Web MVP QA

> Current as of 2026-06-08. This document is the admin-web operations QA entry
> point for MVP handoff. It does not store production credentials or raw customer
> data.

## 1. Automated Baseline

Run from the repository root:

```bash
cd sunflower-admin-web && npm run lint && npm run test && npm run build
node scripts/check_admin_web_behavior_wiring.js
node scripts/check_admin_web_external_qa_preflight.js
node scripts/check_admin_web_entry_readiness.js
```

Current recorded baseline:

- `npm run lint`: passed in Round 96.
- `npm run test`: passed in Round 96, 24 tests across 5 files.
- `npm run build`: passed in Round 96.
- `node scripts/check_admin_web_behavior_wiring.js`: passed in Round 96 with
  97 key behavior wiring checks across 16 files.
- `node scripts/check_admin_web_external_qa_preflight.js`: passed in Round 96
  with 6 checks.
- `node scripts/check_admin_web_entry_readiness.js`: added in Round 108 and
  passed against the temporary HTTP/IP admin entry. It verifies only the public
  admin HTML shell, `/healthz`, and `/api/health` without login or data
  mutation. It warns that HTTPS/domain evidence remains pending.
- `node scripts/check_admin_web_external_qa_preflight.js` checks admin manual
  QA environment URLs, required evidence IDs, high-risk mutation next actions,
  sensitive evidence boundaries, and credential/live-data safety wording before
  production or approved-staging QA.

Older notes about an unused `_refundId` lint issue or 3 failing/timed-out
admin-web tests are stale; the current Round 96 direct baseline did not
reproduce them.

The automated tests cover auth page behavior, protected shell routing, room
management, price/inventory management, order list/detail/actions, after-sale
approval/rejection, failed refund retry, check-in, check-out, no-show, and price
batch utility logic. Round 45 also covers the order-management check-in date
filter guard: a reversed complete date range shows operator feedback and does
not issue a new order-list query. The behavior wiring guard checks route,
service endpoint, page action, and mutation-refetch wiring. These checks do not
prove production admin account, SMS, browser, or live data safety.

## 2. Manual QA Ledger

Structured source:

- `docs/Admin-Web-Manual-QA.json`

Check commands:

```bash
node scripts/check_admin_web_manual_qa.js
node scripts/check_admin_web_manual_qa.js --strict
node scripts/check_admin_web_entry_readiness.js
```

Use the normal command during development to see unresolved admin QA items. Use
`--strict` only for final MVP completion; it exits non-zero until all required
manual admin checks are `passed` or `waived`.

Current result:

- Required checks: 12.
- Passed: 0.
- Pending: 12.
- Waived: 0.
- Blocked: 0.

## 3. Production / Staging QA Rules

- Use a dedicated QA admin account; do not use personal credentials in recorded
  evidence.
- Do not commit phone numbers, SMS codes, passwords, bearer tokens, cookies,
  raw screenshots containing private data, or full order/payment identifiers.
- For mutating room, price, inventory, order, after-sale, and refund actions,
  use QA data or get explicit user approval before touching live data.
- When a check cannot be executed safely on production data, record `waived`
  only if the user explicitly accepts the missing validation for MVP launch.
- Record compact evidence: date, environment, role label, sanitized resource
  alias or id suffix, outcome, and any rollback/restoration decision.

## 4. Manual QA Scope

Auth and account:

- Login, session recovery, and logout.
- First activation through SMS.
- Password reset and in-session password change on a dedicated QA account.

Workspace:

- Protected shell renders.
- Account header renders.
- Backend health and business summary load.

Rooms:

- Room list/filter loads.
- QA room create/edit works.
- Shelf status can be toggled and restored.

Pricing and inventory:

- Room calendar loads for an approved date range.
- Batch price/inventory update works on safe QA dates and is restored or
  accepted as intended.

Orders and after-sale:

- Order list filters and detail drawer load.
- Check-in, check-out, no-show, reschedule, and refund controls are validated
  with safe QA orders or explicitly waived.
- After-sale approve/reject and refund retry controls are validated when matching
  QA data exists or explicitly waived.

Resilience:

- Unauthorized session redirects/clears state.
- Backend errors, empty states, and invalid form feedback are understandable.

## 5. Open-Source Reference Check

- Task classification: common admin operations QA and release-readiness
  checklist for a React admin dashboard.
- Sources checked:
  - Existing project code/tests:
    `sunflower-admin-web/src/app/router.tsx`,
    `sunflower-admin-web/src/features/**`,
    `sunflower-admin-web/src/test/**`.
  - Playwright authentication guide:
    `https://playwright.dev/docs/auth`.
  - Playwright best practices:
    `https://playwright.dev/docs/best-practices`.
  - Testing Library guiding principles:
    `https://testing-library.com/docs/guiding-principles/`.
- Selected approach: keep a JSON manual QA ledger plus a small Node.js checker,
  matching the project evidence-ledger pattern and avoiding a new browser-test
  dependency before production credentials and safe QA data are available.
- License/compatibility: no external code copied.
- Reused/adapted: project-local checker pattern and the reference guidance to
  keep auth state/secrets out of Git and test operator-visible behavior.
- Rejected options: adding Playwright now, storing auth storage state in the
  repo, or marking mocked unit tests as proof of live admin production QA.

## 6. Static Behavior Wiring Guard

`node scripts/check_admin_web_behavior_wiring.js` verifies that the local admin
web MVP path still has the expected wiring:

- Protected routes, login, activation, reset password, change password, and
  session recovery.
- Axios auth token injection and 401 session cleanup.
- Workspace health query and manual refresh.
- Room list, create/edit, status toggle, filters, and query invalidation.
- Pricing calendar, room/month changes, range selection, price/inventory
  mutations, and calendar invalidation.
- Order overview/list/detail filters, drawer actions, after-sale approval or
  rejection, direct refund/reschedule, check-in/check-out/no-show, refund retry,
  and list/overview invalidation.

It is a static guard only. Final MVP still needs `node
scripts/check_admin_web_manual_qa.js --strict` after safe production or
approved-staging evidence is recorded.

## 7. External QA Preflight

`node scripts/check_admin_web_external_qa_preflight.js` verifies the handoff
state before a human starts production or approved-staging admin QA:

- Manual QA ledger contains all required MVP admin check IDs.
- Admin/API entry URLs are recorded and temporary HTTP-IP usage remains explicit
  until HTTPS/domain evidence is ready.
- Resolved evidence does not match obvious credential, token, SMS code, phone,
  cookie, or password patterns.
- High-risk room, pricing, order, after-sale, and refund checks require QA or
  approved data plus restoration, accepted final state, or explicit waiver.
- Admin runtime still defaults to same-origin `/api`, injects auth from the
  session store, and clears session on unauthorized responses.

The preflight does not log in, mutate data, send SMS, or validate a browser
session. It only makes the manual QA boundary harder to misread.

`node scripts/check_admin_web_entry_readiness.js` is the read-only runtime entry
probe for the admin QA operator. It reads `docs/Admin-Web-Manual-QA.json`,
checks the recorded admin entry URL, `/healthz`, and API `/health`, and warns
when the entry remains temporary HTTP/IP instead of HTTPS/domain. Passing this
script does not satisfy `ADMIN-PROD-QA`; authenticated browser QA and safe data
operations still need manual evidence or explicit waivers.
