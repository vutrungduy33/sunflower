# Project State

> Compact current state for future Codex runs. Update this file when durable
> project facts, validation status, risks, or canonical docs change. Do not turn
> it back into a round-by-round log; use `docs/MVP-Progress.md` and git history
> for that.

## Last Updated

2026-06-08

## Current Workflow

- Stage-first workflow, stage guard, branch prefix, commit prefix, and GitHub PR
  gate have been removed.
- Active deployment workflow is `.github/workflows/deploy-backend.yml`.
- Pushes to `main` for deployment-relevant paths still trigger GitHub Actions.
- Manual `workflow_dispatch` supports `deployment_lane=production` and the
  backend-only `deployment_lane=nonprod-mock-payment` lane.
- The deployment workflow now packages the deployment bundle on a GitHub-hosted
  runner and uploads it as a workflow artifact. ECS self-hosted runners download
  and extract that artifact instead of running `actions/checkout` for deploy
  bundle source.
- Local secrets belong under `.secrets/`, which is ignored by Git.
- `scripts/check_miniapp_https_domain.js` is the read-only DNS/TLS/API helper
  for collecting future miniapp HTTPS legal request-domain evidence, and
  `scripts/check_miniapp_external_qa_preflight.js` guards that the miniapp QA
  ledger points operators to it.
- Alibaba Cloud Codeup SSH access from this workstation was verified on
  2026-06-04 after the public key was added: read-only `git ls-remote` against
  the Codeup `sunflower` repository returned `main` successfully. Yunxiao
  migration is planned in `docs/Codeup-Yunxiao-Migration-Plan.md`.

## Current Architecture

- Miniapp: `sunflower-miniapp`, native WeChat mini program, MVP pages under
  `pages/mvp`.
- Admin web: `sunflower-admin-web`, React + TypeScript + Vite + TDesign React.
- Backend: `sunflower-backend`, Spring Boot monolith with MySQL + Flyway.
- Production topology:
  - ECS-1 `47.113.223.248` / `172.25.121.84`: host Nginx, admin-web, public API
    ingress.
  - ECS-2 `47.120.42.15` / `172.25.121.83`: backend and MySQL.
- Backend `8080` is hardened by binding the published backend port to
  `172.25.121.83:8080`; direct public backend `8080` should remain unusable.
- User-provided备案 domains: `xiangrikui.cloud` and `sunflower.cloud`. The
  final WeChat miniapp legal request domain still needs confirmation, HTTPS
  certificate deployment, and WeChat backend configuration.
- Canonical architecture doc: `docs/Architecture.md`.

## Latest Validation Baselines

- Latest default aggregate local MVP regression:
  `scripts/check_mvp_regression.sh` passed in Round 99 on clean local `main`
  HEAD `af46357`, aligned with `origin/main`, with backend/admin/miniapp,
  evidence, and deploy-config checks enabled. Production checks were skipped by
  default.
- Backend baseline from that run: `mvn -B test` passed with 57 tests, 0
  failures, 0 errors, and 0 skipped.
- Latest direct admin-web baseline: Round 111 on clean local `main` passed
  `npm run lint`, `npm run test` (24 Vitest tests across 5 files),
  `npm run build`, behavior wiring (97 checks), external QA preflight
  (6 checks), and admin entry readiness (6 passes with 2 expected HTTP/IP
  warnings). The earlier resumed-goal notes about `_refundId` and 3
  failing/timed-out admin-web tests are stale and did not reproduce.
- Latest direct miniapp automated baseline: Round 112 on clean local `main`
  passed smoke, behavior wiring (69 checks), user-flow replay (3 scenarios),
  payment-flow replay (5 scenarios), external QA preflight (6 checks), project
  config guard, MVP subpage nav guard, and key JavaScript syntax checks for
  `utils/mvp/api.js`, `utils/mvp/payment.js`, `pages/mvp/home/index.js`,
  `pages/mvp/login/index.js`, `pages/mvp/order-create/index.js`, and
  `pages/mvp/order-list/index.js`. The run still warns that the default API
  base remains bare HTTP for local/DevTools validation only and local
  `project.private.config.json` is absent.
- Latest production read-only audit: Round 100
  `scripts/check_production_readonly_audit.sh` passed with deploy config static
  checks, production public/ECS internal smoke, backend `8080` exposure checks,
  and payment-config readiness reporting the known sanitized blockers. No push,
  deploy, workflow dispatch, Nginx reload, ECS mutation, firewall/security-
  group mutation, payment/refund action, or live QA data mutation was
  performed.
- Latest strict closeout boundary: Round 56/Round 58 evidence shape remains
  incomplete. Current unresolved required closeout evidence is 32 items: 8
  launch evidence entries, 12 miniapp manual QA checks, and 12 admin-web manual
  QA checks.
- Current operator entry docs were refreshed in Round 101 to align with the
  Round 99 aggregate regression and Round 100 read-only production audit:
  `docs/MVP-Handoff-Packet.md`, `docs/MVP-Next-Approval-Request.md`, and
  `docs/MVP-External-Approval-Packet.md`. This did not change any evidence
  status or unresolved count.
- Round 102 updated `docs/MVP-Launch-Evidence.json` so
  `CURRENT-BRANCH-DEPLOYED.nextAction` explicitly requires approval before
  push/merge/workflow_dispatch and tells operators to run
  `node scripts/check_deployment_approval_preflight.js` on a clean worktree.
  The clean-worktree preflight then passed on local `main` HEAD `9dd2b1a`,
  base `origin/main 167cae7`, with 3 changed files and predicted push-to-main
  deploy target `none`. No push, workflow dispatch, deploy, ECS mutation,
  payment/refund action, or live QA data mutation was performed.
- Round 103 refreshed canonical architecture/CI-CD docs to the same facts:
  backend `8080` is hardened on the ECS-2 private IP,备案 domains are known but
  HTTPS legal-domain evidence remains pending, backend-only nonprod/mock
  deployment does not prove real payment/refund or admin-web/Nginx readiness,
  and current-branch deploy evidence requires explicit approval plus clean
  deployment preflight. Focused verification passed with
  `node scripts/check_deployment_approval_preflight.js`,
  `node scripts/check_mvp_launch_evidence.js`, and `git diff --check`.
- Round 104 refreshed readiness prose so `docs/MVP-Readiness.md` and
  `docs/Miniapp-Manual-QA.md` match the current ledger: 8 pending launch
  evidence entries, 32 unresolved required closeout items, and both
  `xiangrikui.cloud` and `sunflower.cloud` recorded as备案 domain context.
- Round 105 refreshed `docs/MVP-Next-Goal-Prompt.md` to the same current facts:
  Round 99 aggregate baseline, Round 100 production read-only audit, 32
  unresolved required evidence items, backend `8080` hardening passed, and
  current-branch deployment gated by explicit approval plus clean deployment
  preflight. This did not change ledger status.
- Round 106 added `scripts/check_mvp_next_goal_prompt.js` and wired it into
  `scripts/check_mvp_regression.sh` evidence checks so the fresh-goal handoff
  prompt is now machine-checked for current facts, approval lanes, safety
  boundaries, commands, and stale wording. The same round updated
  `scripts/check_mvp_termination_audit.js` to derive the current 32-item
  closeout boundary from the active ledgers instead of the older hardcoded
  33-item pre-8080-hardening shape.
- Round 107 hardened `scripts/check_miniapp_https_domain.js` so the default
  miniapp domain check now requires backend health JSON at `/api/health`.
  Read-only rechecks found `sunflower.cloud` has a trusted GoDaddy certificate
  but serves an HTML lander at `/api/health`; `xiangrikui.cloud`,
  `api.sunflower.cloud`, and `api.xiangrikui.cloud` still fail TLS/SNI. No DNS,
  certificate, or WeChat backend setting was changed.
- Round 108 added `scripts/check_admin_web_entry_readiness.js` and wired it
  into the admin QA docs and preflight checks. The script verifies the temporary
  HTTP/IP admin entry, `/healthz`, and `/api/health` without login or data
  mutation. It is entry-readiness evidence only and does not satisfy
  authenticated admin manual QA.
- Round 109 refreshed `docs/MVP-Next-Goal-Prompt.md` and
  `scripts/check_mvp_next_goal_prompt.js` to the current handoff state,
  including the Round 107 stricter miniapp HTTPS checker/domain results and the
  Round 108 `node scripts/check_admin_web_entry_readiness.js` command. No
  unresolved evidence counts changed.
- Round 110 compacted `docs/MVP-Readiness.md` from a long history document into
  a current-state launch board. Historical detail remains in
  `docs/MVP-Progress.md`, this state file, and the JSON ledgers; the readiness
  page now keeps target, status matrix, closeout boundary, verification
  commands, and next best rounds. No unresolved evidence counts changed.
- Round 111 refreshed the direct admin-web automated validation on current
  `main`: lint, Vitest, production build, behavior wiring, external QA
  preflight, and admin entry readiness all passed. This confirms the stale
  `_refundId`/timed-out-test startup notes remain resolved, but authenticated
  admin manual QA is still pending and the unresolved evidence count is
  unchanged.
- Round 112 refreshed the direct miniapp automated validation on current
  `main`: smoke, behavior wiring, user-flow replay, payment-flow replay,
  external QA preflight, project config guard, subpage nav guard, and key
  JavaScript syntax checks all passed. This confirms local automated miniapp
  wiring remains current, but WeChat legal-domain, real AppID preview,
  phone/login, payment/refund, and manual QA evidence remain pending.
- Round 113 refreshed `docs/MVP-Next-Approval-Request.md` and
  `docs/MVP-External-Validation-Runbook.md` to the current Round 111/112 local
  validation facts and the latest clean deployment preflight snapshot:
  local `main` HEAD `c78fb9b5a645`, `origin/main` at the same SHA, 0 changed
  files, and predicted push-to-main deploy target `none`. No evidence statuses
  changed.
- Round 50 audited the original goal termination criteria and found the MVP
  incomplete. Round 58 later closed the backend `8080` item, leaving the
  current 32 unresolved required items. The completion conclusion remains
  approval/evidence gated until strict closeout evidence passes or itemized
  waivers are recorded.

## Deployment State

- Latest deployment approval preflight: Round 75
  `node scripts/check_deployment_approval_preflight.js` passed on clean local
  `main` HEAD `025f60d0ce84`, base `origin/main d0af634314d0` before push, 41
  changed files, predicted push-to-main target `all`, and backend/admin/ingress
  impact counts of 4/3/3.
- Round 75 pushed local `main` HEAD `025f60d0ce84` to `origin/main`. The
  push-triggered production-lane GitHub Actions run `26799767476` was
  cancelled after `detect-targets`; backend/admin builds and deploy jobs were
  cancelled, so no successful production deploy evidence was created.
- Round 75 then triggered explicit manual backend-only
  `deployment_lane=nonprod-mock-payment` workflow run `26799773234` for HEAD
  `025f60d0ce84`. `detect-targets` and `build-backend` passed, `build-admin-web`
  was skipped as expected, and `deploy-backend-host` reached ECS-2 but remained
  in progress at `Checkout backend deployment bundle source` during the local
  observation window. Current-branch deployment evidence therefore remains
  pending until the run completes and post-deploy smoke is recorded.
- Round 76 observed run `26799773234` still in progress at the same ECS-2
  checkout step and added finite workflow timeouts to self-hosted deploy
  checkout steps (`8` minutes) and local deploy steps (`20` minutes). This makes
  future runner stalls bounded and diagnosable; it does not by itself prove
  deployment or fix the underlying ECS runner/network cause.
- After that observation, run `26799773234` completed as `failure`: ECS-2
  `deploy-backend-host` failed during `actions/checkout` while `git fetch` was
  accessing GitHub over HTTPS. The sanitized error class was TLS connection
  termination followed by a `github.com:443` connection timeout. Bundle sync,
  artifact download, image load, local backend deploy, and web deploy did not
  run, so current-branch deployment and smoke remain pending.
- Round 77 observed the push-triggered production-lane run `26800134363` for
  HEAD `e797423f1f86`: backend/admin-web image build and artifact packaging
  succeeded; ECS-2 checkout, bundle sync, backend artifact download, docker
  load, and image availability check all succeeded. The backend deploy then
  failed in production validation because `WECHAT_PAY_MCH_ID` is missing. Web
  deploy was skipped because backend deploy failed. This proves the previous
  ECS-2 checkout/network blocker cleared for that run, but current-branch
  production deployment and smoke still remain pending.
- Round 78 triggered backend-only `deployment_lane=nonprod-mock-payment`
  workflow run `26800396663` for HEAD `c714abdcfc59`. `detect-targets` and
  `build-backend` passed, `build-admin-web` was skipped as expected, but
  ECS-2 `deploy-backend-host` failed again during `actions/checkout` before
  bundle sync, artifact download, docker load, or local deploy. The sanitized
  error class was the same GitHub HTTPS fetch problem: TLS connection
  termination followed by `github.com:443` connection timeouts. Current-branch
  backend deploy and smoke remain pending.
- Round 79 added `scripts/check_ecs_runner_github_connectivity.sh` as a
  read-only SSH diagnostic for the ECS-2 self-hosted runner. It checks runner
  process hints, `_diag/Worker_*.log` summaries, GitHub DNS/HTTPS reachability,
  `git ls-remote`, and disk space without printing secrets or mutating ECS.
- Round 80 ran `RUN_INTERNAL=1 scripts/check_ecs_runner_github_connectivity.sh`
  against ECS-2. Current evidence shows the runner service is active, runner
  root and `_diag` exist, GitHub DNS resolves, HTTPS HEAD to `github.com`
  succeeds, `git ls-remote` reaches the repository at HEAD `3f8d237`, and disk
  usage is healthy. The recent worker log still records the previous GitHub
  TLS termination and `github.com:443` timeout failures, so the deploy blocker
  is now documented as intermittent ECS-2 outbound GitHub connectivity during
  checkout rather than a constant runner/service/disk/repository-access failure.
- Round 81 checked the备案 domains `sunflower.cloud` and `xiangrikui.cloud`
  plus common `www`/`api`/`admin` subdomains from local and public DNS
  resolvers. They currently resolve to `198.18.x.x` addresses, which are
  reserved benchmarking/test addresses rather than the ECS-1 public entry
  `47.113.223.248`; TLS probes did not return a usable certificate chain for
  the target API/admin hostnames. This is recorded as DNS/certificate not yet
  deployable, not as a proven expired certificate.
- Round 82 changed `.github/workflows/deploy-backend.yml` so deploy bundle
  source is packaged by `package-deploy-bundle` on a GitHub-hosted runner and
  consumed by ECS deploy jobs via workflow artifact download/extract. This
  reduces the intermittent ECS self-hosted `actions/checkout` dependency; ECS
  still needs GitHub artifact/API connectivity for deploy.
- Round 82 push-triggered workflow run `26803729808` for HEAD `eef3bd7` proved
  the new artifact path through `package-deploy-bundle`, backend/admin image
  builds, and ECS-2 `Download backend deployment bundle artifact` plus
  `Extract backend deployment bundle`. The run then failed in
  `Synchronize backend deployment bundle` because
  `scripts/sync_deploy_bundle.sh` had an EXIT trap referencing a local temp-file
  variable under `set -u`; the follow-up fix expands the temp path when the
  trap is installed.
- Follow-up run `26803892859` for HEAD `86b4cc2` proved the full new artifact
  path through ECS-2: deployment bundle artifact download/extract/sync passed,
  backend image artifact download/load passed, and backend image availability
  passed. The run then failed at `Deploy backend host locally` in the production
  env validation with sanitized error `WECHAT_PAY_MCH_ID is required`. This
  confirms the previous ECS checkout blocker is removed for the backend lane;
  current-branch deployment and smoke remain blocked by real payment config or
  by choosing the explicit nonprod/mock-payment lane.
- Round 83 committed and pushed `b10bb7e`, then triggered explicit
  backend-only `deployment_lane=nonprod-mock-payment` workflow run
  `26804961943`. `detect-targets` and `package-deploy-bundle` passed, and
  `build-admin-web` was skipped as expected. `build-backend` failed before ECS
  deployment when the GitHub hosted runner timed out pulling Docker Hub image
  `moby/buildkit:buildx-stable-1` during Docker Buildx setup. Backend image
  build, ECS deploy, and smoke did not run, so current-branch deployment
  remains pending.
- If the GitHub Actions to ECS artifact/API path remains unstable, the current
  no-new-paid-service fallback recommendation is to move deploy-time artifact
  consumption to Alibaba Cloud-side resources: preferably Alibaba Cloud
  Container Registry Personal Edition or an existing free registry quota for
  images, with an ECS-local signed artifact directory as a simpler manual
  backup. ECS would then pull/load artifacts inside the Alibaba Cloud network
  and run the existing deploy scripts locally, reducing dependence on GitHub
  artifact downloads during the cutover.
- Round 85 checked Codeup/Yunxiao feasibility. ECS-2 has a clone at
  `/opt/sunflower`, owned by root, but it is a detached GitHub HTTPS clone with
  `origin=https://github.com/vutrungduy33/sunflower.git`, not the Codeup SSH
  remote. ECS-1 and ECS-2 common homes do not currently contain
  `~/.ssh/id_ed25519`, so Codeup SSH access with the requested key cannot be
  proven from the current ECS state. Creating a Yunxiao pipeline manually can
  be done through the console with account permissions; creating it through
  Yunxiao OpenAPI requires the appropriate Yunxiao API token/OpenAPI
  credentials and cannot be done with an ECS SSH key alone.
- Round 86 refreshed the default local automated MVP regression on HEAD
  `158d894`. The first run failed only at
  `scripts/check_nonprod_dispatch_readiness.js` because
  `CURRENT-BRANCH-DEPLOYED.nextAction` lacked the explicit
  `workflow_dispatch` / `non-production/mock-payment` approval wording expected
  by the guard. After updating that evidence text, a full second
  `scripts/check_mvp_regression.sh` run passed all 5 enabled non-production
  steps. No production smoke, workflow dispatch, ECS mutation, payment/refund,
  or live QA was performed.
- Round 87 hardened `.github/workflows/deploy-backend.yml` after the Round 83
  BuildKit helper-image timeout: backend/admin-web build jobs now use plain
  Docker CLI (`docker build`, `docker push`, local `docker save`) instead of
  `docker/setup-buildx-action` and `docker/build-push-action`. The workflow
  still builds on GitHub hosted runners and still depends on base-image pulls
  from external registries, but it no longer pulls
  `moby/buildkit:buildx-stable-1` before building images. A static guard in
  `scripts/check_workflow_dispatch_lane_matrix.js` now fails if the Buildx
  action path is reintroduced.
- Round 87 push-triggered workflow run `26931880619` for HEAD `7993721` proved
  the hardened build path and ECS artifact path through backend/admin image
  build, GHCR push, image artifact export/upload, ECS backend bundle
  download/sync, backend image artifact download/load, and local backend image
  availability. The run then failed at `Deploy backend host locally` in the
  production lane with sanitized validation error `WECHAT_PAY_MCH_ID is
  required`, so backend container recreation and post-deploy smoke still did
  not run.
- Round 88 triggered backend-only `deployment_lane=nonprod-mock-payment`
  workflow run `26932183311` for HEAD `1c75671`. Strict local nonprod dispatch
  readiness and the dry-run helper passed first. The run proved backend-only
  target detection, deployment bundle packaging, backend Docker CLI image
  build/GHCR push/image artifact export/upload, ECS-2 bundle download/sync,
  backend image artifact download/load, and image availability.
  `build-admin-web` was skipped as expected, and the runner passed the
  nonprod/mock lane config guard. The local deploy then failed after MySQL
  recreate because the MySQL app credentials from `.env.prod` could not access
  database `sunflower` as user `sunflower`. Post-failure read-only production
  smoke passed 7/7, backend 8080 exposure check passed 5/5, and payment
  readiness still reported the known 8 real WeChat Pay config issues.
  Current-branch deployment remains pending; the next reduced-scope deploy
  blocker is ECS-2 MySQL app credential alignment, not Buildx, checkout,
  artifact download, or production payment validation.
- Round 89 fixes the nonprod/mock credential overlay bug locally: the backend
  compose runtime env order is now `.env.prod` base, optional runtime overlay,
  then `.release.env`; `.env.nonprod-mock.example` is overlay-only and no
  longer carries DB/auth/admin/SMS secrets; `execute_runner_deploy.sh` sets
  `RUNTIME_OVERLAY_ENV_FILE=.env.nonprod-mock.example` instead of replacing
  `PROD_ENV_FILE`. Focused checks passed, including shell syntax, runner deploy
  tests, nonprod lane guard, workflow lane matrix, `scripts/check_deploy_config.sh`,
  compose rendering through `load_runtime_envs`, and deployment bundle contents.
  This is not yet ECS deployment evidence until a new backend-only
  nonprod/mock dispatch completes and smoke is recorded.
- Round 90 observed Round 89 after push. Production run `26936286888` proved the
  deployment bundle/image artifact path with `.env.runtime-overlay.empty`, then
  failed at the expected production payment validation blocker
  `WECHAT_PAY_MCH_ID is required`. Backend-only nonprod/mock run `26936565663`
  proved the overlay fix on ECS and reached backend recreation, then exposed a
  new schema drift: WeChat payment `@Lob String` columns were `TEXT` in the
  existing MySQL schema while Hibernate expected `LONGTEXT`. ECS-2 MySQL was
  repaired by altering the seven payment/refund/notify LOB columns to
  `LONGTEXT`, backend was restarted successfully through
  `scripts/deploy_backend.sh`, and post-recovery
  `RUN_INTERNAL=1 scripts/check_production_smoke.sh` plus
  `RUN_INTERNAL=1 scripts/check_backend_8080_exposure.sh` passed. The repository
  now carries the durable Flyway repair as
  `V8__align_wechat_lob_columns.sql` plus a static migration guard.
- Round 90 push-triggered production run `26937269296` for HEAD `f9ac47c`
  proved the committed V8 backend image build/push/export path and ECS-2
  deployment bundle plus backend image artifact download/load path. It then
  failed before backend recreation at the expected production validation
  blocker `WECHAT_PAY_MCH_ID is required`, so it did not replace the recovered
  backend container or prove real payment readiness.
- Round 91 first committed/pushed the existing Codeup/Yunxiao migration-plan
  work as `d10d11e`; this docs/scripts-only push did not create a new
  deployment workflow run. It then triggered backend-only manual
  `deployment_lane=nonprod-mock-payment` workflow run `27112433529` for HEAD
  `d10d11e`. The run passed detect-targets, deployment bundle packaging,
  backend Docker build/GHCR push/image artifact export/upload, skipped
  admin-web as expected, passed ECS-2 deployment bundle download/extract/sync,
  backend image artifact download/load, image availability, nonprod/mock lane
  validation for `.env.prod + .env.nonprod-mock.example`, MySQL/backend
  recreation, backend health wait, and backend deploy completion. Post-deploy
  `RUN_INTERNAL=1 scripts/check_production_smoke.sh` passed 7/7, and
  `RUN_INTERNAL=1 scripts/check_backend_8080_exposure.sh` passed 5/5. This is
  reduced-scope backend current-branch deployment evidence only; it does not
  refresh admin-web/Nginx or prove real payment/refund readiness.
- Round 98 checked GitHub Actions after later documentation/evidence commits.
  The latest `deploy-backend.yml` run remained successful workflow_dispatch run
  `27112433529` for `d10d11e`; no newer runs were created by the docs-only
  pushes. `git diff --name-only d10d11e..HEAD -- <deploy workflow paths>`
  returned no files, so current `main` HEAD `291305d` has no application or
  deployment-path changes after the reduced-scope backend deployment evidence.
- Round 92 refreshed the default local automated MVP regression on clean local
  `main` HEAD `7cc7e04`, aligned with `origin/main`. The run passed all 5
  default non-production steps: backend tests, admin-web lint/test/build plus
  behavior/external preflight, miniapp smoke/wiring/user-flow/payment-flow
  replays plus external preflight/appid/nav guards, non-strict evidence ledger
  checks, and deploy config static checks. Production checks were skipped by
  default, and strict closeout still reports 32 unresolved required evidence
  items.
- Round 60 pushed `98e68e0dd478` to `main` and triggered GitHub Actions run
  `26796051853`; backend/admin-web images built, but ECS-2 checkout stalled
  before deployment completed.
- Follow-up run `26796607775` at `d0af634314d0` proved ECS-2 checkout, artifact
  download, and image load, then failed production env validation because
  `WECHAT_PAY_MCH_ID` was missing. The backend container was not recreated from
  that image, so current-branch deployment remains pending.
- Round 61 changed runner deployment metadata handling so pending
  `.release.env` / `.deploy-source-sha` files are promoted only after
  successful validation and deployment.
- Round 66 added `.env.nonprod-mock.example` and
  `scripts/check_nonprod_mock_payment_deploy_lane.sh`.
- Round 67 added manual `deployment_lane=nonprod-mock-payment`; it only supports
  `target=auto` or `target=backend`, deploys backend-only, uses mock payment,
  and does not refresh admin-web or Nginx.
- Round 68 added `scripts/check_workflow_dispatch_lane_matrix.js`, wired into
  `scripts/check_deploy_config.sh`, to guard production and nonprod lane
  dispatch behavior.
- Round 73 added `scripts/check_nonprod_dispatch_readiness.js`, wired into
  `scripts/check_deploy_config.sh`, as the strict local preflight before asking
  for backend-only nonprod/mock-payment dispatch approval. It does not push,
  dispatch, deploy, or mutate ECS.
- Round 74 added `scripts/dispatch_nonprod_mock_payment_deploy.sh` as the
  default dry-run helper for the backend-only nonprod/mock-payment manual
  dispatch path. It prints the fixed `gh workflow run` command after readiness
  checks; actual dispatch requires `--execute` plus
  `CONFIRM_NONPROD_MOCK_DISPATCH=1` and remains reduced-scope mock evidence.
- Round 69 updated handoff and approval packets so operators see the backend-only
  nonprod/mock-payment lane and its reduced-scope evidence boundary.
- With real payment private key/config still incomplete, the recommended
  deploy-validation path is explicit manual `workflow_dispatch` using
  `deployment_lane=nonprod-mock-payment` and `target=auto` or `target=backend`.
  Plain `push main` uses the production lane and is expected to hit the payment
  config blocker before backend recreation.

## Known MVP Risks

- The active MVP goal is still open. Do not mark complete until strict closeout
  evidence passes or the user explicitly waives itemized blockers.
- Future deployment-relevant pushes to `main` can still trigger the production
  lane unless a manual nonprod lane is explicitly selected.
- Real WeChat payment production config on ECS-2 remains incomplete. Strict
  payment readiness currently fails for missing/invalid merchant variables,
  key paths, API v3 key, and HTTPS notify URLs.
- `sunflower.cloud` is备案 according to the user and currently has a trusted
  certificate, but it is not WeChat-ready as a miniapp API domain because
  `/api/health` returns an HTML lander instead of backend health JSON.
  `xiangrikui.cloud` and the tested `api.*` candidates still fail TLS/SNI. The
  chosen API host must point to the public ingress, serve backend API responses
  over trusted HTTPS, and be added as a WeChat miniapp legal request domain.
- GitHub Actions self-hosted checkout on ECS-2 has intermittent outbound
  connectivity to GitHub. If this remains unstable, the preferred no-new-paid
  service path is to keep image builds/artifacts on GitHub-hosted runners and
  change ECS deploy jobs so they consume workflow artifacts or a prepacked
  deployment bundle instead of running `actions/checkout` on ECS.
- The artifact-based GitHub path still depends on GitHub artifact/API downloads
  from ECS, and GitHub hosted builds can also fail on external registry access
  such as Docker Hub BuildKit pulls. If this broader path remains unstable,
  move release images/artifacts to Alibaba Cloud-side free resources before the
  deploy cutover, then have ECS pull/load locally.
- Codeup repository SSH access is readable from the local machine with
  `~/.ssh/id_ed25519`:
  `git@codeup.aliyun.com:6a1e70a56ca3fad97ed1fbab/xiangrikui/sunflower.git`
  exposes `refs/heads/main`. The selected migration route is Codeup + Yunxiao
  Flow + existing Alibaba Cloud ECS + ECS-local artifacts, with no image
  registry in v1; see `docs/Codeup-Yunxiao-Migration-Plan.md`.
- User confirmed in Round 71 that the real payment private key/config is not
  fully provisioned yet. It is acceptable to use the explicit mock/nonprod lane
  for interim validation, but this must remain recorded as mock evidence and
  must not satisfy real payment/refund launch evidence.
- Backend-only nonprod/mock deployment for current `main` has passed after the
  Round 90 Flyway V8 repair. Remaining deployment blockers are production-like
  real payment config, HTTPS legal domain, and strict external/manual QA
  evidence; the mock lane must not be treated as real payment/refund evidence.
- Miniapp real-device/preview evidence is still pending for HTTPS request
  domain, real AppID preview, WeChat login, phone binding, booking path, payment,
  refund, and error states.
- Admin-web production or approved-staging manual QA remains pending.
- Real AppID must stay only in ignored
  `sunflower-miniapp/project.private.config.json`; committed
  `sunflower-miniapp/project.config.json` must remain `touristappid`.
- Do not commit secrets, tokens, phone numbers, SMS codes, raw personal-data
  screenshots, merchant credentials, private keys, or full order/payment/refund
  identifiers.

## Canonical Active Docs

- Hot context: `AGENTS.md`, `docs/Agent-Memory.md`,
  `docs/Context-Index.md`, `docs/Project-State.md`, and git status.
- MVP state and handoff: `docs/MVP-Readiness.md`,
  `docs/MVP-Handoff-Packet.md`, `docs/MVP-Next-Approval-Request.md`, and
  `docs/MVP-External-Approval-Packet.md`.
- Machine-readable evidence ledgers: `docs/MVP-Launch-Evidence.json`,
  `docs/Miniapp-Manual-QA.json`, and `docs/Admin-Web-Manual-QA.json`.
- Architecture, deployment, and contracts: `docs/Architecture.md`,
  `docs/CI-CD.md`, `docs/S19-Prod-Deployment-Config.md`, `docs/API.md`,
  `docs/API-Schemas.md`, `docs/DB-Design.md`, and `docs/DataDictionary.md`.
- Durable decisions: `docs/Decision-Log.md`.
- Progress log: `docs/MVP-Progress.md` keeps only recent operational rounds;
  old progress and planning materials are cold context under `docs/archive/` or
  available through git history.

## Current Dirty Worktree Note

No intended MVP audit files should remain uncommitted after each round commit.
