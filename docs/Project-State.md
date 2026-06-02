# Project State

> Compact current state for future Codex runs. Update this file when durable
> project facts, validation status, risks, or canonical docs change. Do not turn
> it back into a round-by-round log; use `docs/MVP-Progress.md` and git history
> for that.

## Last Updated

2026-06-02

## Current Workflow

- Stage-first workflow, stage guard, branch prefix, commit prefix, and GitHub PR
  gate have been removed.
- Active deployment workflow is `.github/workflows/deploy-backend.yml`.
- Pushes to `main` for deployment-relevant paths still trigger GitHub Actions.
- Manual `workflow_dispatch` supports `deployment_lane=production` and the
  backend-only `deployment_lane=nonprod-mock-payment` lane.
- Local secrets belong under `.secrets/`, which is ignored by Git.

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
- User-provided miniapp备案 domain: `xiangrikui.cloud`. HTTPS API host,
  certificate, and WeChat legal request-domain configuration still need
  verification.
- Canonical architecture doc: `docs/Architecture.md`.

## Latest Validation Baselines

- Latest default aggregate local MVP regression:
  `scripts/check_mvp_regression.sh` passed in Round 71 on local `main` HEAD
  `2af1ed43dfc9` with backend/admin/miniapp/evidence/deploy-config checks and
  production skipped.
- Backend baseline from that run: `mvn -B test` passed with 57 tests, 0
  failures, 0 errors, and 0 skipped.
- Admin-web baseline from that run: `npm run lint`, `npm run test` (24 Vitest
  tests across 5 files), `npm run build`, behavior wiring (97 checks), and
  external QA preflight (6 checks) passed.
- Miniapp baseline from that run: smoke, behavior wiring (69 checks), user-flow
  replay (3 scenarios), payment-flow replay (5 scenarios), external preflight,
  appid guard, and subpage nav guard passed. The default API base remains bare
  HTTP for local/DevTools validation only.
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

- Latest deployment approval preflight: Round 72
  `node scripts/check_deployment_approval_preflight.js` passed on clean local
  `main` HEAD `5a836f4704b7`, base `origin/main d0af634314d0`, 39 changed
  files, predicted push-to-main target `all`, and backend/admin/ingress impact
  counts of 4/3/3. No push, workflow dispatch, deploy, or ECS mutation was
  performed.
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
- Current local `main` is ahead of `origin/main`; pushing deployment-relevant
  changes to `main` can trigger the production lane unless a manual nonprod lane
  is explicitly selected.
- Real WeChat payment production config on ECS-2 remains incomplete. Strict
  payment readiness currently fails for missing/invalid merchant variables,
  key paths, API v3 key, and HTTPS notify URLs.
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
