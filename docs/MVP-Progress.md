# MVP Progress

> Compact round-by-round progress for the current MVP hardening goal. Keep this
> file factual and update it at the end of each committed round.

## Round 1: Admin Web Quality Baseline

- Date: 2026-06-02
- Status: completed
- Focus: make `sunflower-admin-web` lint, tests, and build pass without changing
  user-facing behavior.
- Start evidence:
  - `git status --short --untracked-files=all`: clean.
  - `npm run test`: passed, 20 tests.
  - `npm run lint`: failed on unused `_refundId` in
    `sunflower-admin-web/src/test/order-management-page.test.tsx`.
- Change summary:
  - Updated the `retryAdminRefund` test mock to return the refund record id it
    receives, removing the unused parameter while keeping the mock faithful to
    the admin order API.
- Open-source reference check:
  - Task classification: tiny repo-specific test lint fix.
  - Sources checked: not applicable; the active `open-source-reference-first`
    skill allows skipping research for obvious bug fixes.
  - Selected approach: use the existing mocked refund id in the returned order
    fixture so the test remains faithful to the API shape.
  - License/compatibility: no external code copied.
  - Reused/adapted: existing local test fixture pattern only.
  - Rejected options: adding lint suppressions or broad test refactors.
- Acceptance criteria:
  - `cd sunflower-admin-web && npm run lint`: passed.
  - `cd sunflower-admin-web && npm run test`: passed, 20 tests.
  - `cd sunflower-admin-web && npm run build`: passed.
  - `docs/Project-State.md` reflects the updated validation snapshot.
  - The round is committed once.
- Goal correction:
  - The prior admin-web test failures were not reproducible in this round; the
    current local evidence shows the admin-web suite passes after the lint fix.
- Next recommended round:
  - Create `docs/MVP-Readiness.md` and refresh stale handoff/API/deployment
    wording against the current architecture and validation evidence.

## Round 2: MVP Readiness and Handoff Docs

- Date: 2026-06-02
- Status: completed
- Focus: create a single MVP readiness checklist and remove stale stage/payment
  wording from active handoff docs.
- Start evidence:
  - `git status --short --untracked-files=all`: clean after Round 1 commit.
  - Active docs still contained historical references to `docs/Backlog.md`,
    `docs/Agent-Stage-Plan.md`, `docs/stage-reports/Sx.md`, and mock-only
    payment wording.
- Change summary:
  - Added `docs/MVP-Readiness.md` with target paths, readiness matrix,
    verification commands, manual QA checklist, launch blockers, and next
    rounds.
  - Updated README/doc indexes to point future agents to MVP readiness/progress.
  - Refreshed miniapp, flow, admin web, PRD, and code-convention docs so active
    guidance no longer treats archived stages as current process.
  - Updated the admin workspace page to show current MVP readiness priorities
    instead of old stage labels.
- Open-source reference check:
  - Task classification: documentation and handoff alignment.
  - Sources checked: not applicable; no common feature implementation or
    external code reuse.
  - Selected approach: derive readiness from current repository evidence and
    local validation commands.
  - License/compatibility: no external code copied.
- Acceptance criteria:
  - Active documentation includes a clear MVP readiness source of truth.
  - Old active stage/backlog references are either removed or explicitly marked
    historical/archived.
  - `cd sunflower-admin-web && npm run lint`: passed.
  - `cd sunflower-admin-web && npm run test`: passed, 20 tests.
  - `cd sunflower-admin-web && npm run build`: passed.
- Goal correction:
  - Do not mark the overall MVP goal complete yet; miniapp real-device
    validation, production HTTPS/domain readiness, backend port hardening, and
    final full regression remain unproven.
- Next recommended round:
  - Broaden miniapp validation evidence and add repeatable smoke/manual QA notes
    for login, phone binding, order creation, payment, and after-sale flows.
