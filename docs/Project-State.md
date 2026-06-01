# Project State

> Compact current state for future Codex runs. Update this file when durable
> project facts, validation status, risks, or canonical docs change.

## Last Updated

2026-06-02

## Current Workflow

- Stage-first workflow, stage guard, branch prefix, commit prefix, and GitHub PR
  gate have been removed.
- Active deployment workflow is `.github/workflows/deploy-backend.yml`.
- Historical stage and gate materials are archived under `docs/archive/`.
- Local secrets belong under `.secrets/`, which is ignored by Git.

## Current Architecture

- Miniapp: `sunflower-miniapp`, native WeChat mini program, MVP pages under
  `pages/mvp`.
- Admin web: `sunflower-admin-web`, React + TypeScript + Vite + TDesign React.
- Backend: `sunflower-backend`, Spring Boot monolith with MySQL + Flyway.
- Production topology:
  - ECS-1 `47.113.223.248` / `172.25.121.84`: host Nginx + admin-web + public API ingress.
  - ECS-2 `47.120.42.15` / `172.25.121.83`: backend + MySQL.
- Canonical architecture doc: `docs/Architecture.md`.

## Recent Validation Snapshot

Current snapshot after 2026-06-02 final local audit:

- Backend `mvn -B test`: passed, 56 tests.
- Aggregate local regression `scripts/check_mvp_regression.sh`: passed on
  2026-06-02 with backend/admin/miniapp/evidence checks enabled and production
  checks skipped by default.
- Admin web `npm run lint`: passed.
- Admin web `npm run test`: passed, 20 tests.
- Admin web `npm run build`: passed.
- Admin web `node scripts/check_admin_web_behavior_wiring.js`: passed in
  Round 17 with 97 key behavior wiring checks across 16 files.
- Admin web Round 8 recheck `npm run lint`: passed.
- Admin web Round 8 recheck `npm run test`: passed, 20 tests.
- Miniapp `node scripts/check_miniapp_mvp_smoke.js`: passed with the
  expected warning that the default API base is bare HTTP and only suitable for
  local/devtools validation.
- Miniapp `node scripts/check_miniapp_behavior_wiring.js`: passed in Round 16
  with 69 key behavior wiring checks across 14 files.
- Miniapp `bash scripts/check_miniapp_project_config.sh`: passed.
- Miniapp `bash scripts/check_mvp_subpage_nav.sh`: passed.
- Production `http://47.113.223.248/api/health`: returned 200 in Round 5.
- Production `http://47.113.223.248/api/content/home`: returned 200 in Round 5.
- Production `http://47.113.223.248/healthz`: returned 200 in Round 5.
- Production `http://47.113.223.248/`: returned 200 admin web HTML in Round 5.
- Production `RUN_INTERNAL=1 scripts/check_production_smoke.sh`: passed on
  2026-06-02 with 7 checks and 1 known backend-bind warning.
- Backend 8080 read-only security check
  `RUN_INTERNAL=1 scripts/check_backend_8080_exposure.sh`: passed on
  2026-06-02 with 3 checks and 2 warnings. It confirms public 8080 is not
  directly usable from this local network and ECS-1 private upstream works, but
  does not prove security-group restriction because ECS-2 still listens on
  `0.0.0.0:8080`.
- Launch evidence `node scripts/check_mvp_launch_evidence.js`: passed on
  2026-06-02.
- Launch evidence `node scripts/check_mvp_launch_evidence.js --strict`: expected
  non-zero on 2026-06-02 because 9 required external evidence entries remain
  pending.
- Miniapp manual QA `node scripts/check_miniapp_manual_qa.js`: passed on
  2026-06-02.
- Miniapp manual QA `node scripts/check_miniapp_manual_qa.js --strict`:
  expected non-zero on 2026-06-02 because 12 required miniapp manual QA checks
  remain pending.
- Miniapp Round 9 recheck `node scripts/check_miniapp_mvp_smoke.js`: passed
  with expected bare HTTP API warning.
- Miniapp Round 9 recheck `bash scripts/check_miniapp_project_config.sh`:
  passed.
- Miniapp Round 9 recheck `bash scripts/check_mvp_subpage_nav.sh`: passed.
- Admin manual QA `node scripts/check_admin_web_manual_qa.js`: passed on
  2026-06-02.
- Admin manual QA `node scripts/check_admin_web_manual_qa.js --strict`:
  expected non-zero on 2026-06-02 because 12 required admin manual QA checks
  remain pending.
- ECS-1 Nginx active; `sunflower-admin-web` healthy on `127.0.0.1:18080`.
- ECS-2 `sunflower-backend` and `sunflower-mysql` healthy.
- Component README handoff refresh completed on 2026-06-02 for
  `sunflower-miniapp/README.md`, `sunflower-admin-web/README.md`, and
  `sunflower-backend/README.md`.
- Deploy config static check `scripts/check_deploy_config.sh`: added and passed
  on 2026-06-02; it parses the active deployment workflow, renders backend/web
  compose files with example env files, and checks deployment shell syntax
  without pushing or deploying.
- Miniapp behavior wiring guard `scripts/check_miniapp_behavior_wiring.js`: added
  on 2026-06-02 and included in aggregate miniapp regression. It statically
  checks login, phone binding, room browsing, order creation, payment, cancel,
  reschedule, refund, navigation, and WXML event bindings; it does not replace
  WeChat preview/real-device QA.
- Admin web behavior wiring guard `scripts/check_admin_web_behavior_wiring.js`:
  added on 2026-06-02 and included in aggregate admin-web regression. It
  statically checks protected routes, auth/session wiring, room CRUD,
  pricing/inventory, order actions, service endpoints, and query invalidation;
  it does not replace production or approved-staging manual QA.
- External validation runbook `docs/MVP-External-Validation-Runbook.md`: added
  on 2026-06-02 with coverage checked by
  `scripts/check_mvp_external_runbook.js`.
- Evidence quality guard added on 2026-06-02: launch, miniapp manual QA, and
  admin manual QA checkers now reject `passed`/`waived` entries whose evidence
  still looks unresolved or too short for handoff.

## Known MVP Risks

- Miniapp real-device validation for WeChat login, phone binding, and payment is
  not yet documented as passed.
- Miniapp default API base is still bare HTTP IP for devtools validation; final
  production requires HTTPS legal WeChat request domain.
- Backend container observed binding public `0.0.0.0:8080`; security group should
  restrict direct backend access to ECS-1 where possible.
- Canonical MVP readiness tracker: `docs/MVP-Readiness.md`.
- Miniapp QA tracker: `docs/Miniapp-MVP-QA.md`.
- Miniapp manual QA tracker: `docs/Miniapp-Manual-QA.md`.
- Backend/API QA tracker: `docs/Backend-MVP-QA.md`.
- Backend 8080 security tracker: `docs/Backend-8080-Security.md`.
- Admin web QA tracker: `docs/Admin-Web-MVP-QA.md`.
- Production smoke tracker: `docs/Production-Smoke.md`.
- Launch evidence tracker: `docs/MVP-Launch-Evidence.md`.
- External validation runbook: `docs/MVP-External-Validation-Runbook.md`.
- MVP closeout audit: `docs/MVP-Closeout-Audit.md`.
- Aggregate MVP regression script: `scripts/check_mvp_regression.sh`.
- Deploy config static check: `scripts/check_deploy_config.sh`.
- Admin web behavior wiring check: `scripts/check_admin_web_behavior_wiring.js`.

## Current Dirty Worktree Note

No intended MVP audit files should remain uncommitted after each round commit.
