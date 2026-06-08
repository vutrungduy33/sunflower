# Decision Log

Append durable decisions here. Keep entries short and include provenance.

## 2026-06-08: Add Miniapp HTTPS Domain Checker

- Decision: Use `scripts/check_miniapp_https_domain.js` as the read-only
  preflight for candidate WeChat miniapp HTTPS API request domains.
- Rationale: `WECHAT-DOMAIN` evidence needs repeatable DNS, trusted TLS
  certificate, certificate-expiry, and API health checks without mutating ECS
  or storing secrets.
- Provenance: `docs/Miniapp-Manual-QA.md`,
  `scripts/check_miniapp_https_domain.js`.

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

## 2026-06-02: Add MVP Closeout Readiness Guard

- Decision: Use `scripts/check_mvp_closeout_readiness.js` as the final aggregate
  closeout readiness guard over launch evidence, miniapp manual QA, and admin-web
  manual QA ledgers.
- Rationale: Individual evidence checkers are useful, but final goal completion
  needs one machine-checkable summary that prevents declaring MVP complete while
  required external evidence is still pending.
- Provenance: `scripts/check_mvp_closeout_readiness.js`,
  `docs/MVP-Closeout-Audit.md`, `docs/MVP-Readiness.md`.

## 2026-06-02: Generate External Evidence Templates

- Decision: Use `scripts/generate_mvp_external_evidence_template.js` and
  `docs/MVP-External-Evidence-Template.md` as the safe capture template for
  external MVP QA evidence.
- Rationale: Operators need a consistent place to record sanitized proof before
  updating JSON ledgers, while avoiding AppID, tokens, phone numbers, SMS codes,
  passwords, payment payloads, raw screenshots, and full order/payment IDs.
- Provenance: `docs/MVP-External-Validation-Runbook.md`,
  `scripts/check_mvp_external_evidence_template.js`.

## 2026-06-02: Add Production Read-Only Audit Entry

- Decision: Use `scripts/check_production_readonly_audit.sh` as the canonical
  production-only read-only audit wrapper.
- Rationale: Deploy config static checks, production smoke, and backend `8080`
  exposure inspection should be replayable from one explicit command without
  making normal local regression contact production by default.
- Provenance: `scripts/check_production_readonly_audit.sh`,
  `docs/Production-Smoke.md`, `docs/MVP-Readiness.md`.

## 2026-06-02: Keep WeChat AppID in Ignored Private Config

- Decision: Do not track `sunflower-miniapp/project.private.config.json`; keep
  real WeChat AppID overrides only in that ignored local file and keep committed
  `project.config.json` at `touristappid`.
- Rationale: WeChat DevTools supports private project configuration with higher
  priority than `project.config.json`, which lets operators run preview/real
  device QA without risking a real AppID commit.
- Provenance: WeChat DevTools project configuration documentation,
  `sunflower-miniapp/project.private.config.example.json`,
  `scripts/check_miniapp_external_qa_preflight.js`.

## 2026-06-02: Add Admin-Web External QA Preflight

- Decision: Use `scripts/check_admin_web_external_qa_preflight.js` as the
  admin-web production/approved-staging manual QA preflight.
- Rationale: Operators need a machine-checkable handoff boundary that validates
  admin QA ledger completeness, credential/privacy wording, high-risk mutation
  restoration or waiver requirements, and same-origin API runtime assumptions
  before using a real admin account or live QA data.
- Provenance: `docs/Admin-Web-MVP-QA.md`,
  `docs/Admin-Web-Manual-QA.json`,
  `scripts/check_admin_web_external_qa_preflight.js`.

## 2026-06-02: Add Deployment Approval Preflight

- Decision: Use `scripts/check_deployment_approval_preflight.js` before any
  production push/merge/workflow_dispatch approval discussion.
- Rationale: The project needs a read-only way to summarize current branch
  cleanliness, workflow trigger shape, changed-file deployment impact, and the
  `CURRENT-BRANCH-DEPLOYED` evidence boundary without accidentally triggering
  GitHub Actions or mutating production.
- Provenance: `.github/workflows/deploy-backend.yml`, `docs/CI-CD.md`,
  `docs/MVP-Launch-Evidence.json`,
  `scripts/check_deployment_approval_preflight.js`.

## 2026-06-04: Treat Nonprod Mock Payment Env as Overlay Only

- Decision: Keep ECS-owned `.env.prod` as the base runtime env for backend
  deployments and apply `.env.nonprod-mock.example` only through
  `RUNTIME_OVERLAY_ENV_FILE` for the backend-only `nonprod-mock-payment` lane.
- Rationale: The mock-payment lane must preserve real ECS database/auth/SMS
  credentials while overriding only the lane marker and mock payment values.
- Provenance: Round 88 workflow run `26932183311`, Round 89
  `scripts/test_execute_runner_deploy_release_env.sh`, `docs/CI-CD.md`.

## 2026-06-04: Align WeChat Payment LOB Columns Through Flyway

- Decision: Keep the WeChat payment/refund/notify JPA `@Lob String` mappings
  and align the backing MySQL columns to `LONGTEXT` with a new versioned Flyway
  migration instead of weakening Hibernate schema validation or editing the
  already-applied V7 migration.
- Rationale: Existing ECS schema used `TEXT`, which caused backend startup to
  fail under production schema validation after the backend-only nonprod/mock
  deploy reached container recreation. A forward migration is the durable and
  auditable repair path.
- Provenance: GitHub Actions run `26936565663`, ECS recovery on 2026-06-04,
  `V8__align_wechat_lob_columns.sql`,
  `scripts/check_wechat_payment_lob_migration.js`.

## 2026-06-02: Prefer Artifact-Based ECS Deploy If Checkout Remains Unstable

- Decision: If ECS self-hosted runner access to GitHub remains unstable, keep
  builds and deployment-bundle packaging on GitHub-hosted runners, then let ECS
  self-hosted jobs download workflow artifacts and execute local deploy scripts
  without running `actions/checkout` on ECS.
- Rationale: Round 80 proved the ECS-2 runner can currently reach GitHub, but
  recent worker logs still show intermittent TLS termination and `github.com:443`
  timeouts during checkout. GitHub-hosted runners and workflow artifacts are
  already part of GitHub Actions and do not add a new paid service; this
  reduces reliance on ECS outbound repository checkout while preserving the
  existing two-ECS topology.
- Provenance: `docs/Project-State.md`, `docs/MVP-Progress.md`, GitHub Actions
  artifact documentation.

## 2026-06-02: Track Alibaba Cloud-Side Deploy Fallback

- Decision: If the GitHub Actions to ECS workflow artifact/API path remains
  unstable, the next no-new-paid-service fallback should move deploy-time
  artifact consumption to Alibaba Cloud-side resources: prefer Alibaba Cloud
  Container Registry Personal Edition or an ECS-local signed image/source
  archive directory, then have ECS pull/load and deploy locally.
- Rationale: The artifact-based GitHub workflow removed ECS repository
  checkout, but ECS still depends on GitHub artifact/API connectivity during
  deployment. Round 83 also showed a separate GitHub hosted runner dependency
  on Docker Hub when Buildx tried to pull `moby/buildkit:buildx-stable-1`.
  Keeping release artifacts in the Alibaba Cloud region reduces the critical
  deploy cutover path to existing ECS plus Alibaba Cloud network and avoids a
  new paid service.
- Provenance: `docs/MVP-Progress.md`, `docs/CI-CD.md`,
  `docs/Project-State.md`, workflow run `26804961943`.

## 2026-06-04: Separate Codeup SSH From Yunxiao Pipeline Credentials

- Decision: Treat Codeup repository SSH access and Yunxiao pipeline creation as
  separate credential tracks. Codeup Git access needs an uploaded SSH public key
  plus the matching private key at the Git client location. Yunxiao pipeline
  creation through the console needs logged-in account permissions; creation
  through OpenAPI needs the required Yunxiao API token/OpenAPI credentials and
  cannot be authenticated by an ECS SSH key alone.
- Rationale: Round 85 found the ECS clone at `/opt/sunflower` still points to
  GitHub HTTPS and the requested `~/.ssh/id_ed25519` is absent from common ECS
  homes. Mixing host SSH, Git SSH, and cloud API credentials would create an
  unsafe deployment setup and could lead to committing or spreading personal
  private keys.
- Provenance: `docs/MVP-Progress.md`, `docs/Project-State.md`, Alibaba Cloud
  Codeup/Yunxiao official documentation, read-only ECS inspection on
  2026-06-04.

## 2026-06-04: Plan Yunxiao Migration With ECS-Local Artifacts

- Decision: Plan the GitHub Actions migration around Alibaba Cloud Codeup +
  Yunxiao Flow + the existing Alibaba Cloud ECS hosts, using ECS-local release
  artifacts for v1 instead of introducing GHCR, ACR, SWR, or another image
  registry as the normal deployment path.
- Rationale: The current reliability issue is the GitHub Actions/ECS artifact
  and external network path, while the runtime hosts remain Alibaba Cloud ECS.
  Keeping the CI/CD control plane and deployment targets in Alibaba Cloud
  reduces cross-cloud network and security-group complexity. Reusing the
  existing bundle/image-tar + `scripts/execute_runner_deploy.sh` path preserves
  ECS-owned `.env.prod` secrets and keeps the first migration narrowly scoped.
- Provenance: `docs/Codeup-Yunxiao-Migration-Plan.md`, `docs/CI-CD.md`,
  `docs/Project-State.md`, Alibaba Cloud Yunxiao Flow/Codeup official
  documentation, and read-only Codeup/Yunxiao credential checks on 2026-06-04.

## 2026-06-02: Add MVP Handoff Packet

- Decision: Use `docs/MVP-Handoff-Packet.md` as the compact first-read handoff
  for future MVP hardening work and `scripts/check_mvp_handoff_packet.js` as
  its coverage guard.
- Rationale: The remaining launch blockers are spread across several evidence
  ledgers and runbooks. A machine-checked handoff packet reduces context drift
  while still preventing a false completion claim before strict external
  evidence passes.
- Provenance: `docs/MVP-Handoff-Packet.md`,
  `scripts/check_mvp_handoff_packet.js`,
  `docs/MVP-Launch-Evidence.json`, `docs/Miniapp-Manual-QA.json`,
  `docs/Admin-Web-Manual-QA.json`.

## 2026-06-02: Add External Approval Packet Before Risky MVP Evidence

- Decision: Use `docs/MVP-External-Approval-Packet.md` and
  `scripts/check_mvp_external_approval_packet.js` before collecting external
  evidence that may involve real WeChat preview credentials, live data, real
  payment/refund, security-group/firewall changes, or GitHub Actions
  deployment.
- Rationale: Round 32 proved the repeatable local and production read-only
  baseline, so remaining progress depends on external evidence with explicit
  approval boundaries. A machine-checked approval packet keeps the next action
  precise and reduces the chance of committing secrets or mutating production
  without consent.
- Provenance: `docs/MVP-External-Approval-Packet.md`,
  `scripts/check_mvp_external_approval_packet.js`,
  `docs/MVP-Handoff-Packet.md`.

## 2026-06-02: Keep Active Docs Compact

- Decision: Keep default documentation entry points focused on current project
  state, architecture, API/deploy facts, MVP readiness, handoff, and evidence
  ledgers. Move early planning docs and older MVP progress rounds under
  `docs/archive/`.
- Rationale: The repository accumulated enough planning and round-history
  material that default context loading became noisy. Archiving preserves
  traceability without making stale planning or old evidence look current.
- Provenance: `docs/README.md`, `docs/Context-Index.md`,
  `docs/archive/README.md`, `docs/MVP-Progress.md`.

## 2026-06-02: Separate Non-Production Mock-Payment Lane

- Decision: Keep `scripts/validate_prod_env.sh` strict for production and add
  `.env.nonprod-mock.example` plus
  `scripts/check_nonprod_mock_payment_deploy_lane.sh` for an explicit
  non-production/mock-payment backend validation lane.
- Rationale: The current environment lacks real WeChat Pay merchant config, but
  weakening production validation would make mock payment look like launch
  readiness. A separate lane supports MVP validation while preserving the
  production boundary.
- Provenance: `docs/S19-Prod-Deployment-Config.md`, `docs/CI-CD.md`,
  `.env.nonprod-mock.example`,
  `scripts/check_nonprod_mock_payment_deploy_lane.sh`.

## 2026-06-02: Add Manual Backend-Only Nonprod Deploy Lane

- Decision: Add `deployment_lane` to `.github/workflows/deploy-backend.yml`.
  Push-to-main and default manual dispatch stay on `production`; manual
  `nonprod-mock-payment` supports only `target=auto/backend`, with `auto`
  resolving to backend-only deploy.
- Rationale: The project needs a deployable path when there is no production
  merchant config, but mock payment must not refresh web/nginx or be confused
  with production readiness.
- Provenance: `.github/workflows/deploy-backend.yml`,
  `scripts/execute_runner_deploy.sh`, `scripts/sync_deploy_bundle.sh`,
  `scripts/test_execute_runner_deploy_release_env.sh`, `docs/CI-CD.md`.

## 2026-06-02: Add Workflow Dispatch Lane Matrix Guard

- Decision: Use `scripts/check_workflow_dispatch_lane_matrix.js` inside
  `scripts/check_deploy_config.sh` to verify production dispatch, backend-only
  nonprod dispatch, rejected nonprod web/nginx/all/bootstrap targets, and
  push-event production behavior.
- Rationale: The manual `deployment_lane` input is security-sensitive enough
  that string checks are too weak; a local matrix guard makes the expected
  target/build/host behavior explicit without adding a GitHub Actions runner
  dependency.
- Provenance: `scripts/check_workflow_dispatch_lane_matrix.js`,
  `scripts/check_deploy_config.sh`, `docs/CI-CD.md`.

## 2026-06-02: Guard Nonprod Deploy Lane in Handoff Packets

- Decision: Require the MVP handoff, next approval request, and external
  approval packet to document the backend-only nonprod/mock-payment dispatch
  lane, reduced-scope evidence boundary, `.env.nonprod-mock.example`, and
  local guard commands.
- Rationale: A deploy lane that is technically available but missing from the
  handoff package can be misused or forgotten. Packet checkers now protect the
  operator-facing boundary.
- Provenance: `docs/MVP-Handoff-Packet.md`,
  `docs/MVP-Next-Approval-Request.md`,
  `docs/MVP-External-Approval-Packet.md`,
  `scripts/check_mvp_handoff_packet.js`,
  `scripts/check_mvp_next_approval_request.js`,
  `scripts/check_mvp_external_approval_packet.js`.

## 2026-06-02: Keep Project State as Snapshot, Not Ledger

- Decision: Keep `docs/Project-State.md` as a compact current-state snapshot
  and keep `docs/MVP-Progress.md` limited to recent operational rounds. Do not
  add new status/runbook documents unless an existing canonical doc cannot
  carry the information.
- Rationale: The active docs had accumulated duplicated round evidence and
  stale validation history. Smaller default context reduces drift while JSON
  ledgers, guard scripts, archive files, and git history preserve traceability.
- Provenance: `docs/Project-State.md`, `docs/MVP-Progress.md`,
  `docs/Context-Index.md`, `docs/README.md`.

## 2026-06-04: Prefer Docker CLI Builds Over Buildx Actions In Deploy Workflow

- Decision: Build backend/admin-web deployment images in GitHub Actions with
  plain Docker CLI steps (`docker build`, `docker push`, `docker save`) instead
  of `docker/setup-buildx-action` and `docker/build-push-action`.
- Rationale: Round 83 proved the deploy path can fail before any ECS work when
  the GitHub hosted runner times out pulling the BuildKit helper image
  `moby/buildkit:buildx-stable-1` from Docker Hub. The project does not
  currently need multi-arch or Buildx-only Dockerfile features, so removing the
  action path lowers one external network dependency while preserving GHCR
  images and workflow image artifacts.
- Consequences: GitHub hosted builds may be slower because the previous
  Buildx/GHA cache wiring is removed. Base image pulls still depend on external
  registries; if those become unstable, use the documented no-new-paid-service
  fallback rather than reintroducing Buildx helper-image pulls.
- Provenance: `.github/workflows/deploy-backend.yml`,
  `scripts/check_workflow_dispatch_lane_matrix.js`,
  `docs/MVP-Progress.md`, workflow run `26804961943`.
