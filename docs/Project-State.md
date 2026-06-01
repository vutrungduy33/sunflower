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

Current snapshot after 2026-06-02 Round 29 aggregate local MVP regression
recheck:

- Backend `mvn -B test`: passed again in Round 28, 57 tests. Round 28 added
  public order ownership isolation coverage for current-user list/detail/pay
  preparation/pay confirmation/cancel/reschedule/refund actions.
- Aggregate local regression `scripts/check_mvp_regression.sh`: passed again in
  Round 29 with 5 enabled steps: backend tests, admin-web lint/test/build,
  miniapp smoke checks, MVP evidence ledger checks, and deploy config static
  checks. Production checks were skipped by default.
- Admin web `npm run lint`: passed again in Round 27.
- Admin web `npm run test`: passed again in Round 27, 23 tests. Round 27 added
  order-management tests for check-in, check-out, no-show, after-sale rejection,
  and failed refund retry.
- Admin web `npm run build`: passed again in Round 27.
- Older goal notes that mention an admin-web `_refundId` lint failure or 3
  failing/timed-out admin tests are stale. Round 29 aggregate regression proves
  current admin-web lint/test/build is green.
- Admin web `node scripts/check_admin_web_behavior_wiring.js`: passed in
  Round 17 with 97 key behavior wiring checks across 16 files.
- Admin web external QA preflight
  `node scripts/check_admin_web_external_qa_preflight.js`: added in Round 22 to
  verify admin manual QA environment URLs, required check IDs, high-risk
  mutation safety wording, sensitive evidence boundaries, and same-origin API
  runtime assumptions before production or approved-staging QA.
- Admin web Round 8 recheck `npm run lint`: passed.
- Admin web Round 8 recheck `npm run test`: passed, 20 tests.
- Miniapp `node scripts/check_miniapp_mvp_smoke.js`: passed with the
  expected warning that the default API base is bare HTTP and only suitable for
  local/devtools validation.
- Miniapp `node scripts/check_miniapp_behavior_wiring.js`: passed in Round 16
  with 69 key behavior wiring checks across 14 files.
- Miniapp `node scripts/check_miniapp_user_flow_replay.js`: added in Round 26
  to execute a Node.js-stubbed replay of home login/content/profile prompt,
  order creation, phone binding, payment success, order filtering, cancel,
  refund, and reschedule page-method flows before real-device QA.
- Miniapp `bash scripts/check_miniapp_project_config.sh`: passed.
- Miniapp `bash scripts/check_mvp_subpage_nav.sh`: passed.
- Miniapp external QA preflight
  `node scripts/check_miniapp_external_qa_preflight.js`: added in Round 21 to
  verify committed AppID placeholder, ignored/untracked private DevTools
  config, safe private-config example, API base override support, and required
  manual QA ledger IDs before preview/real-device evidence collection.
- Production `http://47.113.223.248/api/health`: returned 200 in Round 5.
- Production `http://47.113.223.248/api/content/home`: returned 200 in Round 5.
- Production `http://47.113.223.248/healthz`: returned 200 in Round 5.
- Production `http://47.113.223.248/`: returned 200 admin web HTML in Round 5.
- Production `scripts/check_production_readonly_audit.sh`: passed on
  2026-06-02 05:59 Asia/Shanghai. It ran deploy config static checks,
  production public/ECS internal smoke, and backend `8080` exposure inspection
  without pushing, deploying, reloading Nginx, or changing ECS/firewall/security
  group state.
- Production `RUN_INTERNAL=1 scripts/check_production_smoke.sh`: passed on
  2026-06-02 05:59 Asia/Shanghai with 7 checks and 1 known backend-bind
  warning.
- Backend 8080 read-only security check
  `RUN_INTERNAL=1 scripts/check_backend_8080_exposure.sh`: passed on
  2026-06-02 05:59 Asia/Shanghai with 3 checks and 2 warnings. It confirms
  public 8080 is not directly usable from this local network and ECS-1 private
  upstream works, but does not prove security-group restriction because ECS-2
  still listens on `0.0.0.0:8080`.
- Launch evidence `node scripts/check_mvp_launch_evidence.js`: passed on
  2026-06-02.
- Launch evidence `node scripts/check_mvp_launch_evidence.js --strict`: expected
  non-zero on 2026-06-02 because 9 required external evidence entries remain
  pending.
- MVP closeout readiness `node scripts/check_mvp_closeout_readiness.js`: passed
  in Round 18 and summarized 33 unresolved required closeout items.
- MVP closeout readiness `node scripts/check_mvp_closeout_readiness.js --strict`:
  expected non-zero in Round 18 because required launch, miniapp manual QA, and
  admin-web manual QA evidence remains pending.
- External evidence template
  `node scripts/generate_mvp_external_evidence_template.js`: passed in Round 19
  and generated `docs/MVP-External-Evidence-Template.md` for 33 unresolved
  required items.
- External evidence template coverage
  `node scripts/check_mvp_external_evidence_template.js`: passed in Round 19.
- MVP handoff packet `docs/MVP-Handoff-Packet.md` and coverage guard
  `node scripts/check_mvp_handoff_packet.js`: added in Round 24 to keep the
  next-operator entry synchronized with 33 unresolved required launch, miniapp,
  and admin-web evidence items plus approval boundaries and closeout commands.
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
- Production read-only audit `scripts/check_production_readonly_audit.sh`: added
  on 2026-06-02 as the one-command production audit entry for deploy config
  static checks, production smoke, and backend `8080` exposure inspection. It
  does not mutate production and does not prove current-branch deployment.
- Deployment approval preflight
  `node scripts/check_deployment_approval_preflight.js`: added in Round 23 to
  summarize current branch cleanliness, branch/base refs, changed-file
  deployment impact, workflow trigger shape, and the approval boundary before
  any push/merge/workflow_dispatch. It does not deploy or prove current branch
  code is live.
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
- MVP closeout readiness guard `scripts/check_mvp_closeout_readiness.js`: added
  on 2026-06-02 and included in aggregate evidence regression. Non-strict mode
  summarizes unresolved closeout evidence; strict mode is the final aggregate
  completion guard.
- External evidence template `docs/MVP-External-Evidence-Template.md`: added on
  2026-06-02 and generated from launch, miniapp, and admin-web evidence ledgers.
  It provides safe operator fields for recording sanitized external QA evidence
  before updating JSON statuses.

## Known MVP Risks

- Miniapp real-device validation for WeChat login, phone binding, and payment is
  not yet documented as passed.
- Real WeChat AppID must stay in ignored local
  `sunflower-miniapp/project.private.config.json`; committed
  `sunflower-miniapp/project.config.json` must remain `touristappid`.
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
- External evidence template: `docs/MVP-External-Evidence-Template.md`.
- MVP handoff packet: `docs/MVP-Handoff-Packet.md`.
- MVP closeout audit: `docs/MVP-Closeout-Audit.md`.
- MVP closeout readiness guard: `scripts/check_mvp_closeout_readiness.js`.
- MVP handoff packet guard: `scripts/check_mvp_handoff_packet.js`.
- Aggregate MVP regression script: `scripts/check_mvp_regression.sh`.
- Production read-only audit script:
  `scripts/check_production_readonly_audit.sh`.
- Deployment approval preflight:
  `scripts/check_deployment_approval_preflight.js`.
- Deploy config static check: `scripts/check_deploy_config.sh`.
- Admin web behavior wiring check: `scripts/check_admin_web_behavior_wiring.js`.
- Admin web external QA preflight:
  `scripts/check_admin_web_external_qa_preflight.js`.
- Miniapp external QA preflight:
  `scripts/check_miniapp_external_qa_preflight.js`.
- Miniapp user-flow replay guard: `scripts/check_miniapp_user_flow_replay.js`.

## Current Dirty Worktree Note

No intended MVP audit files should remain uncommitted after each round commit.
