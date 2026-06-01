# Admin Web MVP QA

> Current as of 2026-06-02. This document is the admin-web operations QA entry
> point for MVP handoff. It does not store production credentials or raw customer
> data.

## 1. Automated Baseline

Run from the repository root:

```bash
cd sunflower-admin-web && npm run lint && npm run test && npm run build
```

Current recorded baseline:

- `npm run lint`: passed again in Round 8.
- `npm run test`: passed again in Round 8, 20 tests.
- `npm run build`: passed in the 2026-06-02 closeout audit.

The automated tests cover auth page behavior, protected shell routing, room
management, price/inventory management, order list/detail/actions, and price
batch utility logic. They do not prove production admin account, SMS, browser,
or live data safety.

## 2. Manual QA Ledger

Structured source:

- `docs/Admin-Web-Manual-QA.json`

Check commands:

```bash
node scripts/check_admin_web_manual_qa.js
node scripts/check_admin_web_manual_qa.js --strict
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
