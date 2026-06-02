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

Current snapshot after 2026-06-02 Round 60 deployment attempt and follow-up
deployment run:

- `RUN_PRODUCTION=1 scripts/check_mvp_regression.sh`: passed in Round 32 with
  6 enabled steps: backend tests, admin-web lint/test/build, admin behavior and
  external preflight checks, miniapp smoke/wiring/replay/external-preflight
  checks, MVP evidence ledger checks, deploy config static checks, and
  production smoke/backend `8080` read-only checks.
- `RUN_PRODUCTION=1 scripts/check_mvp_regression.sh`: passed again in Round 39
  at pre-commit HEAD `255558f001e9` on 2026-06-02 08:58 Asia/Shanghai with the
  same 6 enabled steps. It did not push, deploy, reload Nginx, or change
  ECS/firewall/security-group state.
- `RUN_PRODUCTION=1 scripts/check_mvp_regression.sh`: passed again in Round 47
  on current local `main` HEAD `8d9b11d` with 6 enabled steps: backend tests,
  admin-web lint/test/build plus behavior/external preflight, miniapp smoke
  checks, MVP evidence ledger checks, deploy config static checks, and
  production smoke/backend `8080` read-only checks. The command did not push,
  deploy, reload Nginx, or change ECS/firewall/security-group state.
- `scripts/check_mvp_regression.sh`: passed again in Round 53 on current local
  `main` HEAD `0cbeac5` with the default 5 enabled non-production steps:
  backend tests, admin-web lint/test/build plus behavior/external preflight,
  miniapp smoke/wiring/replay/external-preflight checks, MVP evidence ledger
  checks including termination audit guard, and deploy config static checks.
  Production checks were skipped by default; no push, deploy, workflow dispatch,
  Nginx reload, ECS mutation, firewall mutation, security-group mutation,
  payment/refund action, or live QA data mutation was performed.
- `git fetch origin main`: completed in Round 54. After fetch, local `main`
  HEAD was `e34287552d63`, `origin/main` was still `89f93d704719`,
  `origin/main` was an ancestor of local `HEAD`, and
  `git rev-list --left-right --count origin/main...HEAD` returned `0 57`.
  This proves local `main` includes the latest fetched `origin/main` and is
  ahead by 57 commits. No pull, merge, push, workflow dispatch, deployment, or
  production mutation was performed.
- Deployment approval preflight
  `node scripts/check_deployment_approval_preflight.js`: refreshed in Round 55
  against current local `main` at HEAD `75987946b73b`. Comparison base was
  `origin/main` at `89f93d704719`, changed files since base were 146, path
  rules predicted a push-to-main deploy target `all`, and impact counts were
  backend 38 files, admin-web 5 files, and ingress 1 file. No push, merge,
  workflow dispatch, deployment, Nginx reload, ECS mutation, firewall mutation,
  security-group mutation, payment/refund action, or live QA data mutation was
  performed.
- Round 56 reran the strict closeout commands on local `main` HEAD
  `d9db23166dba` and confirmed the same external/manual blocker shape remains:
  `node scripts/check_mvp_launch_evidence.js --strict` fails with 9 required
  launch entries pending, `node scripts/check_miniapp_manual_qa.js --strict`
  fails with 12 required miniapp manual QA checks pending,
  `node scripts/check_admin_web_manual_qa.js --strict` fails with 12 required
  admin-web manual QA checks pending, and
  `node scripts/check_mvp_closeout_readiness.js --strict` fails with 33
  unresolved required closeout items. These are approval/evidence blockers, not
  new automated code regressions. No further local-only refresh work can satisfy
  the remaining termination criteria without user-approved evidence, waivers, or
  deployment action.
- Round 57 reconciled `docs/MVP-Readiness.md` so its headline readiness matrix
  now points to the latest Round 53 default aggregate regression, Round 55
  deployment approval preflight, and Round 56 strict closeout boundary audit
  instead of presenting older Round 47/Round 49 entries as the newest local and
  deployment facts. No evidence ledger status or production state changed.
- Round 58 completed `BACKEND-8080-HARDENING` after explicit user approval to
  close backend `8080`. ECS-2 `/home/chenyao/sunflower/.env.prod` was backed up
  as `.env.prod.pre-backend-8080-hardening-20260602`, then
  `BACKEND_BIND_HOST` was changed from `0.0.0.0` to `172.25.121.83` and
  `sunflower-backend` was force-recreated. Verification:
  `RUN_INTERNAL=1 ENFORCE_RESTRICTED=1 scripts/check_backend_8080_exposure.sh`
  passed with 5 passes and 0 warnings; `docker ps`/`ss` show
  `172.25.121.83:8080->8080/tcp`, ECS-1 private upstream and public ingress
  `/api/health` remain healthy, and direct public backend `8080` is not usable.
  `docs/MVP-Launch-Evidence.json` now marks `BACKEND-8080-HARDENING` passed, so
  launch evidence is 13 required entries: 5 passed and 8 pending.
- User provided miniapp备案 domain `xiangrikui.cloud` in Round 58. It is recorded
  as domain context only; the concrete HTTPS API host, certificate, and WeChat
  legal request-domain configuration still need verification before
  `WECHAT-DOMAIN`/`MINIAPP-DOMAIN-HTTPS` can pass.
- Round 59 completed documentation simplification: `docs/MVP-Progress.md` now
  keeps recent rounds, with older Rounds 1-47 moved to
  `docs/archive/mvp-progress/MVP-Progress-Rounds-1-47.md`; generated external
  evidence template output is compact; `docs/MVP-External-Approval-Packet.md`
  is a short approval boundary packet; root `README.md`, `docs/README.md`, and
  `docs/Context-Index.md` now point to a smaller set of canonical entry docs.
  The JSON evidence ledgers remain the source of truth.
- Round 60 attempted to prove `CURRENT-BRANCH-DEPLOYED` after the approved
  push to `main` at commit `98e68e0dd478`. GitHub Actions run
  `26796051853` built backend and admin-web images successfully. ECS-2
  runner `ecs-2-backend` was initially inactive with a deleted GitHub
  registration; it was re-registered with labels
  `self-hosted,Linux,X64,ecs-backend` and accepted the queued deploy job. The
  deploy then stalled in `actions/checkout` fetching `98e68e0` on ECS-2; a
  12-second ECS-2 curl probe to `https://github.com/vutrungduy33/sunflower`
  timed out, and ECS-2 `.release.env` still pointed at older image tag
  `f9185fe257cee1b40850ea35c820afd7fdb82946`. The current branch is therefore
  not proven deployed, and `CURRENT-BRANCH-DEPLOYED` remains pending. Round 60
  also updated backend deploy/smoke scripts to use the private backend bind host
  instead of hard-coded `127.0.0.1:8080` health checks.
- Round 60 follow-up commits `9e8c087` and `d0af634` were pushed to `main`,
  triggering GitHub Actions run `26796607775`. This run proved the recovered
  ECS-2 runner could check out the deployment bundle, download and load the
  backend image artifact, and confirm image availability. It then failed in
  `Deploy backend host locally` at production env validation with
  `WECHAT_PAY_MCH_ID is required`. ECS-2 `.release.env` now points at backend
  image tag `d0af634314d01180fe061959beadc93c51a9e33e`, but the backend
  container was not recreated from that image because validation failed before
  deploy. Current-branch deployment remains pending. Do not weaken
  `WECHAT_PAY_MOCK_ENABLED=false` production payment validation without an
  explicit non-production/mock-payment deployment decision.
- Round 61 fixed the deployment metadata consistency gap exposed by run
  `26796607775`: `scripts/execute_runner_deploy.sh` now writes
  `.release.env.pending` and `.deploy-source-sha.pending`, uses the pending
  release env for the active deploy attempt, and only promotes those files to
  formal `.release.env`/`.deploy-source-sha` after validation and deployment
  succeed. Failed validation/deploy attempts preserve the previous committed
  release metadata and clean pending files. `scripts/check_deploy_config.sh`
  now runs `scripts/test_execute_runner_deploy_release_env.sh` to guard this
  behavior.
- Round 62 added `scripts/check_backend_payment_config_readiness.sh`, a
  read-only ECS-2 WeChat Pay production config preflight. It SSHes to the
  backend host, sources `.env.prod` locally, and reports only whether required
  payment variables/key files are present plus URL/key-length shape; it does
  not print merchant credentials or key values. Normal mode reports sanitized
  warnings, while `ENFORCE_PAYMENT_CONFIG=1` exits non-zero for missing required
  real-payment config. `scripts/check_production_readonly_audit.sh` now includes
  the preflight so the current `WECHAT_PAY_MCH_ID`-class blocker is repeatable
  without triggering GitHub Actions deployment.
- Round 62 read-only ECS-2 payment config preflight confirmed the current
  sanitized blocker shape: 8 issues remain for real-payment production mode:
  missing `WECHAT_PAY_MCH_ID`, `WECHAT_PAY_MERCHANT_SERIAL_NO`,
  `WECHAT_PAY_PRIVATE_KEY_PATH`, `WECHAT_PAY_PUBLIC_KEY_ID`,
  `WECHAT_PAY_PUBLIC_KEY_PATH`, `WECHAT_PAY_API_V3_KEY`, plus invalid
  `WECHAT_PAY_PAYMENT_NOTIFY_URL` and `WECHAT_PAY_REFUND_NOTIFY_URL`. Strict
  mode `RUN_INTERNAL=1 ENFORCE_PAYMENT_CONFIG=1
  scripts/check_backend_payment_config_readiness.sh` exits non-zero until those
  are provisioned or a non-production/mock-payment lane is explicitly chosen.
- Round 62 `CURL_CONNECT_TIMEOUT=15 scripts/check_production_readonly_audit.sh`
  passed with 4 read-only steps after bounded audit retries were added:
  deploy config static checks, production public/ECS internal smoke,
  backend `8080` exposure checks, and backend payment config readiness. The
  audit did not push, deploy, reload Nginx, or mutate ECS/firewall/security
  group state; it reported the same 8 sanitized payment config issues.
- Round 50 audited the original goal termination criteria against current
  evidence in `docs/MVP-Closeout-Audit.md`. Result: the active MVP goal remains
  incomplete because strict external/manual evidence still has 33 unresolved
  required items: 9 launch evidence entries, 12 miniapp manual QA checks, and
  12 admin-web manual QA checks. Automated backend/admin/miniapp readiness is
  green from prior baselines, but real WeChat/domain/payment/refund/admin QA,
  backend `8080` hardening evidence, and current-branch deployment evidence
  remain approval/evidence gated.
- Round 51 added `scripts/check_mvp_termination_audit.js` to guard the
  user-goal termination criteria table and current incomplete-evidence boundary
  in `docs/MVP-Closeout-Audit.md`. The guard is documentation-only; it does not
  change evidence status, prove external/manual QA, push, dispatch, deploy, or
  mutate production.
- Round 52 wired `scripts/check_mvp_termination_audit.js` into
  `scripts/check_mvp_regression.sh` under the non-strict evidence step so
  aggregate regression runs also protect the original goal-completion boundary.
  The aggregate evidence step remains non-strict and still reports 33
  unresolved required external/manual closeout items.
- Backend `mvn -B test`: passed again in Round 32, 57 tests. Round 28 added
  public order ownership isolation coverage for current-user list/detail/pay
  preparation/pay confirmation/cancel/reschedule/refund actions.
- Backend `mvn -B test`: passed again inside Round 39, 57 tests, 0 failures, 0
  errors, 0 skipped.
- Backend `mvn -B test`: passed again inside Round 47, 57 tests, 0 failures, 0
  errors, 0 skipped.
- Aggregate local regression `scripts/check_mvp_regression.sh`: passed in Round
  29 with 5 enabled steps and production checks skipped by default. Round 32
  reran the aggregate regression with `RUN_PRODUCTION=1` and included
  production read-only checks.
- Deployment approval preflight
  `node scripts/check_deployment_approval_preflight.js`: passed again in Round
  41. Current branch was `codex/s18-payment-hardening`, HEAD `5376567d2d1c`,
  worktree was clean, comparison base was `origin/main` at `5a37a6788c21`,
  changed files since base were 142, and path rules predicted a future
  push/merge to `main` would deploy target `all`. Impact counts were backend
  38 files, admin-web 5 files, and ingress 1 file.
- Deployment approval preflight
  `node scripts/check_deployment_approval_preflight.js`: passed again in Round
  46 against current local `main` at HEAD `758729091785`, after temporarily
  stashing the in-progress Round 46 progress-doc edit so the required clean
  worktree check could run. Comparison base was `origin/main` at
  `89f93d704719`, changed files since base were 145, path rules predicted a
  push-to-main deploy target `all`, and impact counts were backend 38 files,
  admin-web 5 files, and ingress 1 file. No push, merge, workflow_dispatch,
  deployment, Nginx reload, or ECS mutation was performed.
- Deployment approval preflight
  `node scripts/check_deployment_approval_preflight.js`: passed again in Round
  49 against current local `main` at HEAD `a072612b94a6`, after temporarily
  stashing the in-progress Round 49 progress-doc edit so the required clean
  worktree check could run. Comparison base was `origin/main` at
  `89f93d704719`, changed files since base were 145, path rules predicted a
  push-to-main deploy target `all`, and impact counts were backend 38 files,
  admin-web 5 files, and ingress 1 file. No push, merge, workflow_dispatch,
  deployment, Nginx reload, or ECS mutation was performed.
- Production smoke and backend `8080` read-only checks: passed again in Round
  32 through `RUN_PRODUCTION=1 scripts/check_mvp_regression.sh`. The checks did
  not push, deploy, reload Nginx, or change ECS/firewall/security-group state.
- Production smoke and backend `8080` read-only checks: passed again in Round
  39 through `RUN_PRODUCTION=1 scripts/check_mvp_regression.sh` with 7
  production smoke passes/1 backend-bind warning and backend `8080` exposure 3
  passes/2 warnings.
- Production read-only audit `scripts/check_production_readonly_audit.sh`:
  passed again in Round 46 with 3 read-only audit steps: deploy config static
  checks, production public/ECS internal smoke, and backend `8080` exposure
  inspection. Production smoke still had 7 passes and 1 warning for ECS-2
  backend listening on `0.0.0.0:8080`; backend `8080` inspection still had 3
  passes and 2 warnings because public 8080 was not directly usable from this
  network but local firewall output did not prove restriction. No push,
  deploy, reload, or production configuration mutation was performed.
- Admin web `npm run lint`: passed again in Round 36 at 2026-06-02 08:46
  Asia/Shanghai.
- Admin web `npm run test`: passed again in Round 36 at 2026-06-02 08:46
  Asia/Shanghai, 23 tests across 5 files. Round 27 added order-management tests
  for check-in, check-out, no-show, after-sale rejection, and failed refund
  retry.
- Admin web `npm run build`: passed again in Round 36 at 2026-06-02 08:46
  Asia/Shanghai.
- Admin web `npm run lint`: passed again in Round 42 at 2026-06-02 09:21
  Asia/Shanghai using Node `v20.20.1`.
- Admin web `npm run test`: passed again in Round 42 at 2026-06-02 09:22
  Asia/Shanghai using Node `v20.20.1`, 23 tests across 5 files.
- Admin web `npm run build`: passed again in Round 42 at 2026-06-02 09:22
  Asia/Shanghai using Node `v20.20.1`.
- Admin web order-management focused test
  `npx vitest run src/test/order-management-page.test.tsx`: passed in Round 45
  with 8 tests. Round 45 added coverage that an invalid check-in date range
  shows operator feedback and does not issue a new order-list API query.
- Admin web `npm run lint`, `npm run test`, and `npm run build`: passed again
  in Round 45 on local `main` using Node `v20.20.1`. Vitest passed 24 tests
  across 5 files.
- Admin web `npm run lint`, `npm run test`, and `npm run build`: passed again
  inside Round 47 on current local `main` HEAD `8d9b11d`. Vitest passed 24
  tests across 5 files.
- Admin web `node scripts/check_admin_web_behavior_wiring.js`: passed again in
  Round 45 with 97 checks across 16 files.
- Admin web `node scripts/check_admin_web_external_qa_preflight.js`: passed
  again in Round 45 with 6 checks.
- Admin web behavior wiring and external QA preflight passed again inside
  Round 47 with 97 checks and 6 checks respectively.
- Admin web lint/test/build passed again inside Round 39; Vitest passed 23
  tests across 5 files, behavior wiring passed 97 checks, and admin external QA
  preflight passed 6 checks.
- Older goal notes that mention an admin-web `_refundId` lint failure or 3
  failing/timed-out admin tests are stale. Round 36/Round 42 direct admin-web
  reruns and Round 32/Round 39 aggregate regressions prove current admin-web
  lint/test/build is green.
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
- Miniapp `node scripts/check_miniapp_payment_flow_replay.js`: added in Round
  44 to replay `utils/mvp/payment.js` with stubbed miniapp payment APIs across
  mock payment, real `wx.requestPayment` success, cancel, failure, and backend
  confirmation-pending outcomes before real payment QA.
- Miniapp `node scripts/check_miniapp_payment_flow_replay.js`: passed in Round
  44 with 5 replay scenarios.
- Miniapp-only aggregate regression
  `RUN_BACKEND=0 RUN_ADMIN=0 RUN_EVIDENCE=0 RUN_DEPLOY_CONFIG=0 RUN_PRODUCTION=0 scripts/check_mvp_regression.sh`:
  passed in Round 44. It included miniapp smoke, behavior wiring, user-flow
  replay, payment-flow replay, external preflight, project config, and subpage
  nav checks. Expected warnings remained: bare HTTP default API base for
  local/devtools validation, absent local `project.private.config.json`, and
  shell locale warnings.
- Miniapp smoke checks passed again inside Round 47, including smoke, behavior
  wiring, user-flow replay, payment-flow replay, external preflight, project
  config guard, and subpage navigation guard. Expected warnings remained:
  default API base is bare HTTP for local/devtools validation only, local
  `project.private.config.json` is absent, and shell locale warnings.
- Miniapp `bash scripts/check_miniapp_project_config.sh`: passed.
- Miniapp `bash scripts/check_mvp_subpage_nav.sh`: passed.
- Miniapp external QA preflight
  `node scripts/check_miniapp_external_qa_preflight.js`: added in Round 21 to
  verify committed AppID placeholder, ignored/untracked private DevTools
  config, safe private-config example, API base override support, and required
  manual QA ledger IDs before preview/real-device evidence collection.
- Miniapp smoke, behavior wiring, user-flow replay, external preflight, project
  config, and subpage navigation checks passed again inside Round 39. The
  expected warnings remain: default API base is bare HTTP for local/devtools
  validation only, and local `project.private.config.json` is absent.
- Production `http://47.113.223.248/api/health`: returned 200 in Round 5.
- Production `http://47.113.223.248/api/content/home`: returned 200 in Round 5.
- Production `http://47.113.223.248/healthz`: returned 200 in Round 5.
- Production `http://47.113.223.248/`: returned 200 admin web HTML in Round 5.
- Production checks under `RUN_PRODUCTION=1 scripts/check_mvp_regression.sh`:
  passed on 2026-06-02 07:33 Asia/Shanghai. They ran production public/ECS
  internal smoke and backend `8080` exposure inspection without pushing,
  deploying, reloading Nginx, or changing ECS/firewall/security-group state.
- Production checks under `RUN_PRODUCTION=1 scripts/check_mvp_regression.sh`:
  passed again on 2026-06-02 08:58 Asia/Shanghai at pre-commit HEAD
  `255558f001e9` with the same no-mutation boundary.
- Production `RUN_INTERNAL=1 scripts/check_production_smoke.sh`: passed on
  2026-06-02 07:33 Asia/Shanghai with 7 checks and 1 known backend-bind
  warning.
- Backend 8080 read-only security check
  `RUN_INTERNAL=1 scripts/check_backend_8080_exposure.sh`: passed again in
  Round 37 at 2026-06-02 08:49 Asia/Shanghai on HEAD `9c9d242` with 3 checks
  and 2 warnings. It confirms public 8080 is not directly usable from this local
  network and ECS-1 private upstream works, but does not prove security-group
  restriction because ECS-2 still listens on `0.0.0.0:8080`.
- Backend 8080 read-only security check passed again inside Round 39 with the
  same 3 pass/2 warning shape; Alibaba Cloud security-group evidence or an
  explicit waiver is still required for closeout.
- Launch evidence `node scripts/check_mvp_launch_evidence.js`: passed on
  2026-06-02.
- Launch evidence ledger `docs/MVP-Launch-Evidence.json`: refreshed in Round
  35 so the passed automated baseline entries and deployment/8080 pending
  entries reference Round 32/Round 34 evidence instead of older 56-test or
  05:59 smoke summaries. No pending external evidence was marked passed.
- Launch evidence ledger `docs/MVP-Launch-Evidence.json`: refreshed again in
  Round 37 for `BACKEND-8080-HARDENING` with current read-only backend `8080`
  evidence. The entry remains `pending`; no security-group/firewall mutation was
  performed.
- Launch evidence ledger `docs/MVP-Launch-Evidence.json`: refreshed again in
  Round 39 for automated baseline, production smoke, and backend `8080`
  evidence at pre-commit HEAD `255558f001e9`. Pending external evidence entries
  remain pending.
- Launch evidence ledger `docs/MVP-Launch-Evidence.json`: refreshed again in
  Round 47 so automated backend/admin/miniapp and production smoke evidence
  point to current local `main` HEAD `8d9b11d`. Pending external evidence
  entries remain pending.
- MVP next Codex goal prompt `docs/MVP-Next-Goal-Prompt.md`: refined again in
  Round 40 with the current Round 39 baseline, mandatory per-round commit loop,
  open-source-reference-first rule, approval lanes, hard safety boundaries,
  exact strict completion commands, and stop/manual-intervention conditions.
- MVP readiness documentation was reconciled again in Round 43 so
  `docs/MVP-Readiness.md`, `docs/MVP-Closeout-Audit.md`,
  `docs/Admin-Web-MVP-QA.md`, `docs/MVP-Handoff-Packet.md`,
  `docs/MVP-Next-Goal-Prompt.md`, and `docs/MVP-Launch-Evidence.json` include
  the Round 42 direct admin-web lint/test/build evidence while keeping the 33
  unresolved external/manual closeout items pending.
- Launch evidence `node scripts/check_mvp_launch_evidence.js --strict`: expected
  non-zero on 2026-06-02 because 9 required external evidence entries remain
  pending.
- Launch evidence `node scripts/check_mvp_launch_evidence.js --strict`: rerun
  in Round 48 and expected non-zero because 9 required launch evidence entries
  remain pending.
- MVP closeout readiness `node scripts/check_mvp_closeout_readiness.js`: passed
  in Round 18 and summarized 33 unresolved required closeout items.
- MVP closeout readiness `node scripts/check_mvp_closeout_readiness.js --strict`:
  expected non-zero in Round 18 because required launch, miniapp manual QA, and
  admin-web manual QA evidence remains pending.
- MVP closeout readiness
  `node scripts/check_mvp_closeout_readiness.js --strict`: rerun in Round 48
  and expected non-zero because 33 required closeout items remain unresolved:
  9 launch evidence entries, 12 miniapp manual QA checks, and 12 admin-web
  manual QA checks.
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
- Miniapp manual QA `node scripts/check_miniapp_manual_qa.js --strict`: rerun
  in Round 48 and expected non-zero because all 12 required miniapp manual QA
  checks remain pending.
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
- Admin manual QA `node scripts/check_admin_web_manual_qa.js --strict`: rerun
  in Round 48 and expected non-zero because all 12 required admin manual QA
  checks remain pending.
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
  `node scripts/check_deployment_approval_preflight.js`: added in Round 23 and
  rerun most recently in Round 49 to summarize current branch cleanliness,
  branch/base refs, changed-file deployment impact, workflow trigger shape, and
  the approval boundary before any push/merge/workflow_dispatch. It does not
  deploy or prove current branch code is live.
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
- External approval packet `docs/MVP-External-Approval-Packet.md`: added on
  2026-06-02 as the pre-approval checklist for WeChat preview/domain, real
  payment/refund, admin production or approved-staging QA, backend `8080`
  hardening evidence, and current-branch deployment evidence. It is checked by
  `scripts/check_mvp_external_approval_packet.js`.
- Next approval request `docs/MVP-Next-Approval-Request.md`: added in Round 41
  as the visible one-lane human approval entry for the 33 unresolved required
  MVP evidence items. It is checked by
  `scripts/check_mvp_next_approval_request.js`.
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
- External approval packet: `docs/MVP-External-Approval-Packet.md`.
- Next approval request: `docs/MVP-Next-Approval-Request.md`.
- External evidence template: `docs/MVP-External-Evidence-Template.md`.
- MVP handoff packet: `docs/MVP-Handoff-Packet.md`.
- MVP next Codex goal prompt: `docs/MVP-Next-Goal-Prompt.md`.
- MVP closeout audit: `docs/MVP-Closeout-Audit.md`.
- MVP termination audit guard: `scripts/check_mvp_termination_audit.js`.
- MVP closeout readiness guard: `scripts/check_mvp_closeout_readiness.js`.
- MVP handoff packet guard: `scripts/check_mvp_handoff_packet.js`.
- Aggregate MVP regression script: `scripts/check_mvp_regression.sh`, including
  the non-strict termination audit guard in its evidence step.
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
