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
