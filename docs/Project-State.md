# Project State

> Compact current state for future Codex runs. Update this file when durable
> project facts, validation status, risks, or canonical docs change. Do not turn
> it back into a round-by-round log; use `docs/MVP-Progress.md` and git history
> for that.

## Last Updated

2026-06-04

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
- Alibaba Cloud Codeup/Yunxiao is under investigation as a no-new-paid-service
  fallback control plane. Current ECS evidence does not yet prove Codeup SSH
  access or a Yunxiao pipeline.

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
  `scripts/check_mvp_regression.sh` passed in Round 86 on local `main` HEAD
  `158d894` with backend/admin/miniapp/evidence/deploy-config checks and
  production skipped.
- Backend baseline from that run: `mvn -B test` passed with 57 tests, 0
  failures, 0 errors, and 0 skipped.
- Admin-web baseline from that run: `npm run lint`, `npm run test` (24 Vitest
  tests across 5 files), `npm run build`, behavior wiring (97 checks), and
  external QA preflight (6 checks) passed.
- Miniapp baseline from that run: smoke, behavior wiring (69 checks), user-flow
  replay (3 scenarios), payment-flow replay (5 scenarios), external preflight,
  appid guard, and subpage nav guard passed. The run still warns that the
  default API base remains bare HTTP for local/DevTools validation only and
  local `project.private.config.json` is absent.
- Latest production read-only audit: Round 65
  `CURL_CONNECT_TIMEOUT=15 scripts/check_production_readonly_audit.sh` passed
  with deploy config static checks, production public/ECS internal smoke,
  backend `8080` exposure checks, and payment-config readiness reporting the
  known sanitized blockers. No push, deploy, workflow dispatch, Nginx reload,
  ECS mutation, firewall/security-group mutation, payment/refund action, or live
  QA data mutation was performed.
- Latest strict closeout boundary: Round 56/Round 58 evidence shape remains
  incomplete. Current unresolved required closeout evidence is 32 items: 8
  launch evidence entries, 12 miniapp manual QA checks, and 12 admin-web manual
  QA checks.
- Round 50 audited the original goal termination criteria and found the MVP
  still incomplete with 33 unresolved required items; that conclusion remains
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
- Local `main` and `origin/main` were aligned at `158d894` after the Round 85
  Codeup/Yunxiao feasibility push, before the Round 86 regression-refresh docs
  update. Future deployment-relevant pushes to `main` can still trigger the
  production lane unless a manual nonprod lane is explicitly selected.
- Real WeChat payment production config on ECS-2 remains incomplete. Strict
  payment readiness currently fails for missing/invalid merchant variables,
  key paths, API v3 key, and HTTPS notify URLs.
- `sunflower.cloud` is备案 according to the user, but current DNS/TLS evidence
  is not WeChat-ready: the domain records must be pointed to the public ingress,
  a trusted HTTPS certificate must be installed, TLS must be rechecked, and the
  chosen API host must be added as a WeChat miniapp legal request domain.
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
- Codeup SSH and Yunxiao pipeline setup still need explicit credential
  decisions. Do not copy a personal private key into the repo or docs; prefer a
  dedicated Codeup deploy key/service connection and record only sanitized
  ownership/permission facts.
- User confirmed in Round 71 that the real payment private key/config is not
  fully provisioned yet. It is acceptable to use the explicit mock/nonprod lane
  for interim validation, but this must remain recorded as mock evidence and
  must not satisfy real payment/refund launch evidence.
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
