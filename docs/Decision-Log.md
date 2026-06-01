# Decision Log

Append durable decisions here. Keep entries short and include provenance.

## 2026-06-02: Remove Stage Gate as Active Workflow

- Decision: Stage-first workflow, pre/post stage guard, branch prefix, commit
  prefix, and GitHub PR gate are no longer active requirements.
- Rationale: The project moved from staged delivery governance to direct MVP
  hardening and deployment validation.
- Provenance: `AGENTS.md`, `docs/CI-CD.md`, `docs/archive/README.md`.

## 2026-06-02: Archive Historical Stage Materials

- Decision: Move historical stage plans, backlogs, reports, M1 checks, and S14
  gate docs under `docs/archive/`.
- Rationale: Preserve traceability without letting stale process docs mislead
  future agents.
- Provenance: `docs/archive/README.md`, `README.md`, `docs/README.md`.

## 2026-06-02: Adopt File-Based Agent Memory Harness

- Decision: Use `docs/Agent-Memory.md`, `docs/Context-Index.md`,
  `docs/Project-State.md`, and `docs/Decision-Log.md` as the active project
  memory system.
- Rationale: Keep future Codex turns focused on hot context and avoid loading
  noisy archived history by default.
- Provenance: User request on 2026-06-02; references linked in
  `docs/Agent-Memory.md`.

## 2026-06-02: Open-Source Reference First

- Decision: Add global Codex skill `open-source-reference-first` and require
  common feature work to check mature OSS/official examples before custom
  implementation.
- Rationale: Reduce reinvention and improve robustness for common engineering
  problems while respecting licenses.
- Provenance: `/Users/chenyao/.codex/skills/open-source-reference-first/SKILL.md`.

## 2026-06-02: Use MVP Readiness as Launch Source of Truth

- Decision: Track current MVP launch usability in `docs/MVP-Readiness.md` and
  round-by-round progress in `docs/MVP-Progress.md`.
- Rationale: Active docs should answer what is usable, what is verified, and
  what blocks launch without relying on archived stage materials.
- Provenance: `docs/MVP-Readiness.md`, `docs/MVP-Progress.md`.

## 2026-06-02: Add Miniapp Local Smoke Without New Test Framework

- Decision: Use `scripts/check_miniapp_mvp_smoke.js` plus existing shell guards
  for repeatable local miniapp MVP checks.
- Rationale: The miniapp has no package-managed test runner; Node syntax/export
  checks catch low-cost regressions without adding a heavy framework before
  real WeChat device validation.
- Provenance: `scripts/check_miniapp_mvp_smoke.js`,
  `docs/Miniapp-MVP-QA.md`.

## 2026-06-02: Track Backend/API QA Separately

- Decision: Use `docs/Backend-MVP-QA.md` as the backend/API verification and
  smoke checklist.
- Rationale: Backend local test evidence, controller coverage, production smoke,
  and external-service limits need a compact source separate from broad API
  schema docs.
- Provenance: `docs/Backend-MVP-QA.md`, Round 4 `mvn -B test`.

## 2026-06-02: Do Not Auto-Deploy MVP Branch

- Decision: Record production smoke for the currently deployed system, but do
  not push or trigger deployment from `codex/s18-payment-hardening` without
  explicit production approval.
- Rationale: The deploy workflow triggers on `main` and production state changes
  should be intentional.
- Provenance: `docs/Production-Smoke.md`, `.github/workflows/deploy-backend.yml`.

## 2026-06-02: Codify Production Smoke Script

- Decision: Use `scripts/check_production_smoke.sh` as the repeatable
  production smoke entry point.
- Rationale: Public curl checks and ECS internal SSH checks should be replayable
  without copying long command sequences between docs.
- Provenance: `scripts/check_production_smoke.sh`, `docs/Production-Smoke.md`.

## 2026-06-02: Track MVP Launch Evidence Explicitly

- Decision: Use `docs/MVP-Launch-Evidence.json` plus
  `scripts/check_mvp_launch_evidence.js` to separate proven MVP evidence from
  pending external validation.
- Rationale: Local tests and production health checks are not enough to prove
  WeChat real-device, payment/refund, HTTPS domain, admin production QA, port
  hardening, or current-branch deployment readiness.
- Provenance: `docs/MVP-Launch-Evidence.md`, `docs/MVP-Closeout-Audit.md`.

## 2026-06-02: Track Admin-Web Manual QA Separately

- Decision: Use `docs/Admin-Web-Manual-QA.json` plus
  `scripts/check_admin_web_manual_qa.js` as the admin production/staging manual
  QA evidence ledger.
- Rationale: Admin unit tests prove local behavior, but MVP handoff still needs
  real account, SMS, live API, room/pricing/order operation, and error-state
  evidence without committing secrets or customer data.
- Provenance: `docs/Admin-Web-MVP-QA.md`, `docs/MVP-Launch-Evidence.md`.

## 2026-06-02: Track Miniapp Manual QA Separately

- Decision: Use `docs/Miniapp-Manual-QA.json` plus
  `scripts/check_miniapp_manual_qa.js` as the WeChat preview/real-device miniapp
  QA evidence ledger.
- Rationale: Miniapp syntax smoke proves file wiring only; MVP launch still
  needs legal HTTPS domain, real AppID preview, WeChat login, phone binding,
  booking, payment/refund, and resilience evidence without committing secrets or
  personal/payment data.
- Provenance: `docs/Miniapp-Manual-QA.md`, `docs/MVP-Launch-Evidence.md`.

## 2026-06-02: Track Backend 8080 Restriction Separately

- Decision: Use `scripts/check_backend_8080_exposure.sh` and
  `docs/Backend-8080-Security.md` for read-only backend port exposure evidence.
- Rationale: A failed public curl does not prove Alibaba Cloud security group
  restriction while ECS-2 still listens on `0.0.0.0:8080`; launch readiness
  needs security-group/firewall evidence or explicit risk acceptance.
- Provenance: `docs/Backend-8080-Security.md`,
  `docs/MVP-Launch-Evidence.md`.

## 2026-06-02: Add Aggregate MVP Regression Script

- Decision: Use `scripts/check_mvp_regression.sh` as the repeatable local MVP
  regression entry point.
- Rationale: Backend, admin-web, miniapp, and evidence checks should be
  replayable from one command while keeping production smoke opt-in and manual
  evidence strictness explicit.
- Provenance: `scripts/check_mvp_regression.sh`, `docs/MVP-Readiness.md`.

## 2026-06-02: Add Miniapp Behavior Wiring Guard

- Decision: Use `scripts/check_miniapp_behavior_wiring.js` as a static guard
  for MVP miniapp page-to-API/payment/event wiring, and include it in aggregate
  miniapp regression.
- Rationale: Page registration and syntax checks can pass while important
  buttons, calendars, phone authorization, payment, or after-sale actions drift
  away from their handlers; a lightweight static guard catches that class of
  regression without adding a miniapp test framework.
- Provenance: `scripts/check_miniapp_behavior_wiring.js`,
  `docs/Miniapp-MVP-QA.md`.

## 2026-06-02: Add Admin-Web Behavior Wiring Guard

- Decision: Use `scripts/check_admin_web_behavior_wiring.js` as a static guard
  for MVP admin web route, auth, service, page action, and query invalidation
  wiring, and include it in aggregate admin-web regression.
- Rationale: Admin lint/unit/build checks are strong, but a lightweight static
  guard catches route-to-page, page-to-service, and mutation-to-refetch drift
  before handoff without adding browser credentials or a new e2e dependency.
- Provenance: `scripts/check_admin_web_behavior_wiring.js`,
  `docs/Admin-Web-MVP-QA.md`.
