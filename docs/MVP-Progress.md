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

## Round 3: Miniapp MVP Smoke and QA

- Date: 2026-06-02
- Status: completed
- Focus: add repeatable local miniapp verification and manual QA guidance for
  the MVP user path.
- Start evidence:
  - `git status --short --untracked-files=all`: clean after Round 2 commit.
  - Miniapp had individual `node --check` commands and existing shell guards,
    but no single local smoke covering page registration, key exports, and
    runtime config warnings.
- Change summary:
  - Added `scripts/check_miniapp_mvp_smoke.js`.
  - Added `docs/Miniapp-MVP-QA.md` with automated checks, WeChat DevTools setup,
    manual QA checklist, production acceptance, and known limits.
  - Updated README/doc indexes, `docs/Context-Index.md`, and
    `docs/MVP-Readiness.md` to reference the miniapp QA path.
- Open-source reference check:
  - Task classification: repo-specific smoke and QA documentation.
  - Sources checked: not applicable; no external code or common framework
    implementation copied.
  - Selected approach: use Node's built-in syntax checker and CommonJS require
    checks to avoid adding a miniapp test framework dependency in this round.
  - License/compatibility: no external code copied.
- Acceptance criteria:
  - `node scripts/check_miniapp_mvp_smoke.js`: passed with expected warning that
    `DEFAULT_API_BASE_URL` is bare HTTP and only suitable for local/devtools
    validation.
  - `bash scripts/check_miniapp_project_config.sh`: passed.
  - `bash scripts/check_mvp_subpage_nav.sh`: passed.
- Goal correction:
  - Local smoke improves regression evidence but does not prove WeChat real
    login, phone authorization, payment, refund, HTTPS domain, or device
    preview. Those remain launch blockers.
- Next recommended round:
  - Run backend tests and broaden backend/API readiness evidence, then prepare
    for production smoke/deploy validation once production push intent is
    confirmed.

## Round 4: Backend/API Readiness Evidence

- Date: 2026-06-02
- Status: completed
- Focus: refresh backend automated test evidence and document the current API QA
  surface without changing API contracts.
- Start evidence:
  - `git status --short --untracked-files=all`: clean after Round 3 commit.
  - Backend controllers expose the same main API families already listed in
    `docs/API.md`.
- Change summary:
  - Added `docs/Backend-MVP-QA.md` with backend test command, latest result,
    controller/API surface, production smoke checks, and known limits.
  - Updated README/doc indexes, `docs/Context-Index.md`,
    `docs/MVP-Readiness.md`, and `docs/Project-State.md` with Round 4 backend
    evidence.
- Open-source reference check:
  - Task classification: verification and documentation.
  - Sources checked: not applicable; no external code or common feature
    implementation copied.
  - Selected approach: use the existing Maven/Spring test suite and controller
    inventory as authoritative local evidence.
  - License/compatibility: no external code copied.
- Acceptance criteria:
  - `cd sunflower-backend && mvn -B test`: passed, 56 tests, 0 failures, 0
    errors, 0 skipped.
  - Active docs identify the backend/API QA tracker.
- Goal correction:
  - Backend is locally ready, but real WeChat/SMS/payment production behavior
    still needs external-service smoke with real configured credentials.
- Next recommended round:
  - Perform production smoke against ECS/admin public entry and verify CI/CD
    workflow configuration. Do not push/deploy unless production intent is
    confirmed.

## Round 5: Production Smoke and CI/CD Evidence

- Date: 2026-06-02
- Status: completed
- Focus: verify current production health and deployment workflow configuration
  without pushing or triggering deployment.
- Start evidence:
  - `git status --short --untracked-files=all`: clean after Round 4 commit.
  - Current branch: `codex/s18-payment-hardening`, not `main`.
- Change summary:
  - Added `docs/Production-Smoke.md` with public smoke, ECS internal smoke,
    GitHub Actions status, risks, and deployment decision notes.
  - Updated deployment/readiness/context/project-state docs with Round 5
    evidence.
- Open-source reference check:
  - Task classification: production verification and documentation.
  - Sources checked: not applicable; no external code or common feature
    implementation copied.
  - Selected approach: use existing curl, SSH, Docker, systemd, and GitHub CLI
    checks.
  - License/compatibility: no external code copied.
- Acceptance criteria:
  - `.github/workflows/deploy-backend.yml` YAML parsed successfully.
  - Workflow triggers are `workflow_dispatch` and `push` to `main` for
    deployment-relevant paths.
  - GitHub CLI can access the repo and list deployment workflow runs.
  - Public `http://47.113.223.248/api/health`: 200.
  - Public `http://47.113.223.248/api/content/home`: 200.
  - Public `http://47.113.223.248/healthz`: 200.
  - Public `http://47.113.223.248/`: 200 admin web HTML.
  - ECS-1 Nginx active and `sunflower-admin-web` healthy.
  - ECS-2 `sunflower-backend` and `sunflower-mysql` healthy.
- Goal correction:
  - The current branch has not been deployed. Do not claim current branch code
    is live until it is merged/pushed to `main` or manually dispatched with
    production approval.
  - Backend `8080` still binds `0.0.0.0`; keep security-group/firewall
    hardening as a launch blocker.
- Next recommended round:
  - Run a final full local regression across backend/admin/miniapp, produce a
    final MVP closeout audit, and stop for human approval before any production
    push/deploy.

## Final Local Audit: Full Regression and Completion Check

- Date: 2026-06-02
- Status: completed locally, goal remains open.
- Focus: prove current local automated quality and identify remaining external
  launch blockers.
- Change summary:
  - Added `docs/MVP-Closeout-Audit.md`.
  - Updated readiness/context/index/project-state docs to point to the closeout
    audit.
- Verification:
  - `cd sunflower-backend && mvn -B test`: passed, 56 tests.
  - `cd sunflower-admin-web && npm run lint`: passed.
  - `cd sunflower-admin-web && npm run test`: passed, 20 tests.
  - `cd sunflower-admin-web && npm run build`: passed.
  - `node scripts/check_miniapp_mvp_smoke.js`: passed with expected HTTP API
    base warning.
  - `bash scripts/check_miniapp_project_config.sh`: passed.
  - `bash scripts/check_mvp_subpage_nav.sh`: passed.
- Open-source reference check:
  - Task classification: verification and audit documentation.
  - Sources checked: not applicable; no external code or common feature
    implementation copied.
  - License/compatibility: no external code copied.
- Goal correction:
  - Do not mark the overall goal complete yet. The repository has strong local
    and production smoke evidence, but lacks real WeChat preview/device,
    payment/refund, HTTPS domain, admin production manual QA, and backend 8080
    hardening evidence.

## Round 6: Repeatable Production Smoke Script

- Date: 2026-06-02
- Status: completed
- Focus: turn the production smoke commands into a repeatable script and keep
  deployment evidence easy for future Codex runs to replay.
- Start evidence:
  - `git status --short --untracked-files=all`: clean except the new smoke
    script created for this round.
  - Production smoke evidence existed in `docs/Production-Smoke.md`, but the
    executable checks were still scattered across manual curl/SSH notes.
- Change summary:
  - Added `scripts/check_production_smoke.sh`.
  - Updated production, deployment, readiness, context, project-state,
    closeout, and decision docs to use the script as the canonical smoke entry.
- Open-source reference check:
  - Task classification: common production smoke wrapper with repository-specific
    ECS topology.
  - Sources checked: existing local deployment and validation scripts
    (`scripts/deploy_lib.sh`, `scripts/validate_prod_env.sh`) plus the current
    production smoke document.
  - Selected approach: use portable Bash, curl, ssh, systemd, Docker, and `ss`
    checks already present in the project/runtime.
  - License/compatibility: no external code copied.
  - Reused/adapted: local script style and existing smoke commands.
  - Rejected options: adding a new smoke-test framework or encoding production
    secrets in tracked files.
- Acceptance criteria:
  - `bash -n scripts/check_production_smoke.sh`: passed.
  - `RUN_INTERNAL=1 scripts/check_production_smoke.sh`: passed with 7 checks
    and 1 known warning that ECS-2 backend listens on `0.0.0.0:8080`.
- Goal correction:
  - The smoke is now replayable, but it does not close the external launch
    blockers: WeChat real-device/payment/refund, HTTPS legal request domain,
    admin production manual QA, backend port hardening, and approved deployment
    of the current branch remain unresolved.

## Round 7: MVP Launch Evidence Ledger

- Date: 2026-06-02
- Status: completed
- Focus: make external launch evidence machine-checkable so final MVP closeout
  cannot accidentally treat local automation as proof of WeChat/payment/domain
  readiness.
- Start evidence:
  - `git status --short --untracked-files=all`: clean after Round 6 commit.
  - `docs/MVP-Closeout-Audit.md` listed remaining external blockers, but there
    was no structured checker for passed, pending, blocked, or waived evidence.
- Change summary:
  - Added `docs/MVP-Launch-Evidence.json` as the structured launch evidence
    ledger.
  - Added `docs/MVP-Launch-Evidence.md` as the human-readable evidence entry.
  - Added `scripts/check_mvp_launch_evidence.js` for normal and strict evidence
    checks.
  - Updated readiness, context, project-state, closeout, and decision docs to
    reference the ledger.
- Open-source reference check:
  - Task classification: common release-readiness and external evidence
    tracking for a WeChat/payment MVP.
  - Sources checked: existing project docs/scripts; WeChat Pay merchant docs for
    mini program payment flow and requestPayment; WeChat Mini Program network
    documentation for HTTPS/legal-domain constraints.
  - Selected approach: local JSON ledger plus small Node.js checker using no
    new dependency.
  - License/compatibility: no external code copied.
  - Reused/adapted: project-local smoke/checker style and documented external
    verification requirements.
  - Rejected options: adding a third-party release checklist dependency,
    committing screenshots/payment payloads, or marking local smoke as launch
    evidence for real WeChat/payment flows.
- Acceptance criteria:
  - `node --check scripts/check_mvp_launch_evidence.js`: passed.
  - `node scripts/check_mvp_launch_evidence.js`: passed and listed unresolved
    required evidence.
  - `node scripts/check_mvp_launch_evidence.js --strict`: expected non-zero
    because 9 required external evidence entries remain pending.
- Goal correction:
  - The new checker makes the remaining scope explicit; it does not complete the
    MVP. Next work should gather or explicitly waive the pending external
    evidence items before any final completion claim.

## Round 8: Admin-Web Manual QA Ledger

- Date: 2026-06-02
- Status: completed
- Focus: make admin-web production/staging manual QA executable and
  machine-checkable without storing credentials or customer data.
- Start evidence:
  - `git status --short --untracked-files=all`: clean after Round 7 commit.
  - Launch evidence had `ADMIN-PROD-QA` pending, but no dedicated admin QA
    sub-ledger existed for auth, room, pricing, order, after-sale, and
    resilience checks.
- Change summary:
  - Added `docs/Admin-Web-Manual-QA.json`.
  - Added `docs/Admin-Web-MVP-QA.md`.
  - Added `scripts/check_admin_web_manual_qa.js`.
  - Updated launch evidence, readiness, context, project-state, closeout, and
    decision docs to reference the admin QA ledger.
- Open-source reference check:
  - Task classification: common admin dashboard QA and release-readiness
    checklist.
  - Sources checked: existing admin routes/services/tests; Playwright auth and
    best-practice docs; Testing Library guiding principles.
  - Selected approach: JSON manual QA ledger plus Node checker, no new browser
    automation dependency until safe production/staging credentials and QA data
    are available.
  - License/compatibility: no external code copied.
  - Reused/adapted: existing local evidence-ledger checker style and project
    admin route/API surface.
  - Rejected options: committing Playwright auth storage, storing real
    screenshots/order payloads, or treating mocked Vitest coverage as proof of
    live admin operations.
- Acceptance criteria:
  - `node --check scripts/check_admin_web_manual_qa.js`: passed.
  - `node scripts/check_admin_web_manual_qa.js`: passed and listed unresolved
    required admin QA checks.
  - `node scripts/check_admin_web_manual_qa.js --strict`: expected non-zero
    because 12 required admin manual QA checks remain pending.
  - `node scripts/check_mvp_launch_evidence.js`: passed with
    `ADMIN-PROD-QA` still pending and pointing to the admin QA ledger.
  - `cd sunflower-admin-web && npm run lint`: passed.
  - `cd sunflower-admin-web && npm run test`: passed, 20 tests.
- Goal correction:
  - Admin-web manual QA is now ready to execute and record, but it is not
    complete. A real admin account and safe QA data or explicit user waivers are
    still required before final MVP completion.

## Round 9: Miniapp Manual QA Ledger

- Date: 2026-06-02
- Status: completed
- Focus: make WeChat preview/real-device miniapp QA executable and
  machine-checkable without storing AppID, phone, token, order, or payment
  secrets.
- Start evidence:
  - `git status --short --untracked-files=all`: clean after Round 8 commit.
  - Launch evidence had miniapp and payment entries pending, but no dedicated
    sub-ledger existed for domain, AppID preview, login, phone binding, booking,
    payment, refund, order actions, and error states.
- Change summary:
  - Added `docs/Miniapp-Manual-QA.json`.
  - Added `docs/Miniapp-Manual-QA.md`.
  - Added `scripts/check_miniapp_manual_qa.js`.
  - Updated miniapp QA, launch evidence, readiness, context, project-state,
    closeout, and decision docs to reference the miniapp manual QA ledger.
- Open-source reference check:
  - Task classification: common miniapp preview/real-device, auth, request
    domain, payment, refund, and release-readiness evidence tracking.
  - Sources checked: existing miniapp docs/code; WeChat Mini Program network,
    `wx.login`, phone-number, and `wx.requestPayment` docs; WeChat Pay miniapp
    requestPayment guide.
  - Selected approach: JSON manual QA ledger plus Node checker, no new device
    automation dependency until real AppID, HTTPS domain, merchant credentials,
    and safe QA data are available.
  - License/compatibility: no external code copied.
  - Reused/adapted: existing local evidence-ledger checker style and project
    miniapp route/API surface.
  - Rejected options: committing real AppID/payment payloads/screenshots,
    adding device automation prematurely, or treating syntax smoke as proof of
    real WeChat behavior.
- Acceptance criteria:
  - `node --check scripts/check_miniapp_manual_qa.js`: passed.
  - `node scripts/check_miniapp_manual_qa.js`: passed and listed unresolved
    required miniapp QA checks.
  - `node scripts/check_miniapp_manual_qa.js --strict`: expected non-zero
    because 12 required miniapp manual QA checks remain pending.
  - `node scripts/check_mvp_launch_evidence.js`: passed with miniapp/payment
    entries still pending and pointing to the miniapp QA ledger.
  - `node scripts/check_miniapp_mvp_smoke.js`: passed with the expected bare
    HTTP API warning.
  - `bash scripts/check_miniapp_project_config.sh`: passed.
  - `bash scripts/check_mvp_subpage_nav.sh`: passed.
- Goal correction:
  - Miniapp manual QA is now ready to execute and record, but it is not
    complete. Real preview/device credentials, HTTPS legal domain,
    payment/refund approval, and safe QA data or explicit user waivers are still
    required before final MVP completion.

## Round 10: Backend 8080 Read-Only Security Evidence

- Date: 2026-06-02
- Status: completed, hardening remains pending.
- Focus: make backend `8080` exposure evidence repeatable without modifying
  production firewall, security group, Docker, or deployment configuration.
- Start evidence:
  - `git status --short --untracked-files=all`: clean after Round 9 commit.
  - Production smoke already showed ECS-2 backend listening on
    `0.0.0.0:8080`, but the public probe was not direct proof of Alibaba Cloud
    security group restriction.
- Change summary:
  - Added `scripts/check_backend_8080_exposure.sh`.
  - Added `docs/Backend-8080-Security.md`.
  - Updated launch evidence, readiness, context, project-state, closeout, and
    decision docs with the read-only evidence path.
- Open-source reference check:
  - Task classification: common production port exposure and launch security
    evidence tracking.
  - Sources checked: existing production smoke/deploy docs/scripts, Docker
    Compose port publishing reference, and Ubuntu UFW reference.
  - Selected approach: read-only Bash script using curl, ssh, Docker, `ss`,
    `ufw`, and `iptables`; no new dependency and no production mutation.
  - License/compatibility: no external code copied.
  - Reused/adapted: existing SSH/curl pattern from
    `scripts/check_production_smoke.sh`.
  - Rejected options: automatically modifying Alibaba Cloud security groups,
    rewriting Docker bind host, or treating a single failed public curl as proof
    of restriction.
- Acceptance criteria:
  - `bash -n scripts/check_backend_8080_exposure.sh`: passed.
  - `scripts/check_backend_8080_exposure.sh`: passed with 1 check and 1 warning
    because internal SSH inspection was intentionally skipped.
  - `RUN_INTERNAL=1 scripts/check_backend_8080_exposure.sh`: passed with 3
    checks and 2 warnings.
  - `node scripts/check_mvp_launch_evidence.js`: passed with
    `BACKEND-8080-HARDENING` still pending.
- Goal correction:
  - This round improves evidence but does not complete backend hardening. Final
    MVP still needs Alibaba Cloud security group/firewall evidence or explicit
    user acceptance of the direct-backend-port risk.

## Round 11: Aggregate MVP Regression Script

- Date: 2026-06-02
- Status: completed.
- Focus: make local MVP regression replayable from one command while keeping
  production smoke and strict external evidence checks explicit.
- Start evidence:
  - `git status --short --untracked-files=all`: clean after Round 10 commit.
  - Verification commands existed in `docs/Context-Index.md` and
    `docs/MVP-Readiness.md`, but there was no single entry point for
    backend/admin/miniapp/evidence regression.
- Change summary:
  - Added `scripts/check_mvp_regression.sh`.
  - Updated readiness, context, project-state, closeout, and decision docs to
    reference the aggregate regression command.
- Open-source reference check:
  - Task classification: common CI/local regression orchestration.
  - Sources checked: existing project scripts and command docs; no external code
    needed because this is a thin command runner over repository-native checks.
  - Selected approach: portable Bash wrapper with opt-in production checks via
    `RUN_PRODUCTION=1`.
  - License/compatibility: no external code copied.
  - Reused/adapted: local script conventions and existing verification commands.
  - Rejected options: adding a new task-runner dependency, making production
    smoke run by default, or running strict manual evidence checks before the
    user has provided external validation/waivers.
- Acceptance criteria:
  - `bash -n scripts/check_mvp_regression.sh`: passed.
  - `scripts/check_mvp_regression.sh`: passed with backend/admin/miniapp/evidence
    checks enabled and production checks skipped by default.
  - `node scripts/check_mvp_launch_evidence.js`: passed and still lists pending
    external evidence.
- Goal correction:
  - The aggregate script improves repeatability but does not complete the MVP.
    Strict evidence checks, production deploy approval, HTTPS/domain, real
    WeChat/payment/admin QA, and backend `8080` security-group evidence remain
    open.

## Round 12: Component README Handoff Refresh

- Date: 2026-06-02
- Status: completed.
- Focus: refresh subproject README handoff entries so future development is not
  misled by stale stage, mock-payment, or in-memory-backend wording.
- Start evidence:
  - `git status --short --untracked-files=all`: clean after Round 11 commit.
  - `sunflower-admin-web/README.md` still described the admin web as an `S9`
    stage skeleton.
  - `sunflower-backend/README.md` still claimed business data used in-memory
    seed data and that MySQL persistence was future work.
  - `sunflower-miniapp/README.md` still described order payment as a backend
    mock payment interface without explaining the current real/mock split.
- Open-source reference check:
  - Task classification: handoff documentation refresh, not feature or
    dependency implementation.
  - Sources checked: project-local authoritative docs and code:
    `docs/Architecture.md`, `docs/API.md`, `docs/MVP-Readiness.md`,
    `docs/Admin-Web-MVP-QA.md`, `docs/Backend-MVP-QA.md`,
    `docs/Miniapp-MVP-QA.md`, subproject package/build metadata, and current
    source layout.
  - Selected approach: rewrite stale subproject README facts to point at the
    active MVP readiness and QA evidence system.
  - License/compatibility: no external code or text copied.
  - Reused/adapted: current repository facts only.
  - Rejected options: adding new tooling, reviving stage terminology, or
    claiming external WeChat/payment/admin QA is complete without evidence.
- Risks:
  - Documentation must stay factual: local automated readiness is proven, but
    external miniapp, payment/refund, admin production QA, HTTPS domain, backend
    `8080` hardening, and deploy approval remain open.
- Acceptance criteria:
  - Component READMEs no longer contain active-stage skeleton, in-memory
    backend, or mock-only payment wording.
  - `docs/Project-State.md` no longer lists stale component README wording as a
    known MVP risk.
  - Focused doc checks pass and the round is committed once.
- Verification:
  - `rg -n "S9|阶段交付|工程骨架|内存种子|未落库|后续将切换|模拟支付接口|mock-only|Stage" sunflower-admin-web/README.md sunflower-backend/README.md sunflower-miniapp/README.md`: no matches.
  - `git diff --check`: passed.
  - `node scripts/check_mvp_launch_evidence.js`: passed with 9 required
    external evidence entries still pending.
  - `node scripts/check_miniapp_manual_qa.js && node scripts/check_admin_web_manual_qa.js`:
    passed in non-strict mode, with all manual QA entries still pending.
  - `RUN_BACKEND=0 RUN_ADMIN=0 RUN_MINIAPP=0 scripts/check_mvp_regression.sh`:
    passed evidence-ledger checks with production checks skipped.
- Change summary:
  - Refreshed `sunflower-admin-web/README.md` with current operator scope,
    runtime model, validation commands, and QA handoff references.
  - Refreshed `sunflower-backend/README.md` with current MySQL/Flyway-backed API
    scope, WeChat/SMS/payment integration boundaries, and verification
    references.
  - Refreshed `sunflower-miniapp/README.md` with current user path, runtime
    config, payment real/mock boundary, and manual QA evidence entry points.
  - Updated `docs/Project-State.md` and `docs/Context-Index.md`.
- Goal correction:
  - This removes a handoff/documentation risk but does not complete external
    launch evidence. Real WeChat preview/device validation, HTTPS request
    domain, payment/refund evidence, admin production QA, backend `8080`
    security-group evidence, and approved deploy evidence remain open.

## Round 13: Deploy Config Static Check

- Date: 2026-06-02
- Status: completed.
- Focus: make local deployability checks repeatable without pushing, deploying,
  SSHing to ECS, reloading Nginx, or touching production secrets.
- Start evidence:
  - `git status --short --untracked-files=all`: clean after Round 12 commit.
  - `docs/CI-CD.md` listed workflow YAML parsing, compose rendering, and
    deployment shell syntax commands, but those checks were not exposed as one
    reusable script or included in aggregate MVP regression.
  - The deployment workflow remains the only active GitHub Actions workflow and
    production deploy still requires explicit user approval.
- Open-source reference check:
  - Task classification: common CI/CD configuration validation.
  - Sources checked:
    - GitHub Actions workflow syntax documentation for workflow YAML structure.
    - Docker Compose `config` command reference for rendering/validating compose
      configuration.
    - Bash invocation/noexec documentation for syntax-only shell checks.
    - Existing project docs/scripts: `docs/CI-CD.md`,
      `.github/workflows/deploy-backend.yml`, `docker-compose.backend.yml`,
      `docker-compose.web.yml`, and deployment shell scripts.
  - Selected approach: add a thin Bash wrapper over official/project-native
    static checks and wire it into `scripts/check_mvp_regression.sh`.
  - License/compatibility: no external code copied.
  - Reused/adapted: existing local commands already documented in `docs/CI-CD.md`.
  - Rejected options: triggering GitHub Actions, SSHing to ECS, mutating
    security groups/firewalls, or adding a new CI validation dependency.
- Risks:
  - Static deploy config checks prove syntax/renderability only. They do not
    prove current branch deployment, runner health, ECS credentials, domain
    certificates, or runtime production correctness.
- Acceptance criteria:
  - `scripts/check_deploy_config.sh` checks the deployment workflow YAML,
    backend/web compose rendering with example env files, and deployment shell
    syntax.
  - `scripts/check_mvp_regression.sh` includes deploy config checks by default
    while keeping production smoke opt-in.
  - Readiness, context, project-state, and progress docs identify the new
    deploy config evidence path.
- Verification:
  - `bash -n scripts/check_deploy_config.sh scripts/check_mvp_regression.sh`:
    passed.
  - `scripts/check_deploy_config.sh`: passed; workflow YAML parsed, backend/web
    compose config rendered, deployment shell syntax checked.
  - `RUN_BACKEND=0 RUN_ADMIN=0 RUN_MINIAPP=0 RUN_EVIDENCE=0 scripts/check_mvp_regression.sh`:
    passed deploy-config checks with production checks skipped.
  - `git diff --check`: passed.
- Change summary:
  - Added `scripts/check_deploy_config.sh`.
  - Wired deploy config checks into `scripts/check_mvp_regression.sh` via
    `RUN_DEPLOY_CONFIG`, enabled by default.
  - Updated `docs/MVP-Readiness.md`, `docs/Context-Index.md`, and
    `docs/Project-State.md`.
- Goal correction:
  - Local deployability evidence is stronger, but final MVP still needs approved
    deployment evidence or waiver, production smoke as appropriate, HTTPS/domain
    proof, real WeChat/payment/admin QA evidence, and backend `8080`
    security-group evidence or accepted risk.

## Round 14: External Validation Runbook Coverage

- Date: 2026-06-02
- Status: completed.
- Focus: make the remaining external MVP validation executable and
  machine-checkable for handoff, without performing production mutations or
  real payment/refund actions.
- Start evidence:
  - `git status --short --untracked-files=all`: clean after Round 13 commit.
  - `node scripts/check_mvp_launch_evidence.js`: 13 required launch entries,
    with 4 passed and 9 pending.
  - `node scripts/check_miniapp_manual_qa.js`: 12 required miniapp manual QA
    checks pending.
  - `node scripts/check_admin_web_manual_qa.js`: 12 required admin manual QA
    checks pending.
  - The evidence ledgers were structured, but there was no single execution
    runbook that mapped all pending IDs to approval boundaries, recording rules,
    and final strict checks.
- Open-source reference check:
  - Task classification: common release-readiness runbook and QA evidence
    handoff.
  - Sources checked: existing project ledgers and checker scripts:
    `docs/MVP-Launch-Evidence.json`, `docs/Miniapp-Manual-QA.json`,
    `docs/Admin-Web-Manual-QA.json`, `scripts/check_*_qa.js`,
    `docs/MVP-Readiness.md`, and official requirements already recorded in
    the existing evidence docs.
  - Selected approach: add a repository-local runbook with explicit evidence
    markers and a Node.js coverage checker that reads the existing JSON ledgers.
  - License/compatibility: no external code copied.
  - Reused/adapted: existing JSON ledger/checker pattern.
  - Rejected options: adding a release-management SaaS, committing screenshots
    or secrets, or marking external checks complete without evidence.
- Risks:
  - A runbook improves execution quality but does not replace actual external
    validation. Pending checks remain pending until evidence or explicit waivers
    are recorded.
- Acceptance criteria:
  - `docs/MVP-External-Validation-Runbook.md` covers every unresolved required
    launch, miniapp manual QA, and admin manual QA item.
  - `scripts/check_mvp_external_runbook.js` fails if the runbook misses a
    required pending ID or key safety text.
  - `scripts/check_mvp_regression.sh` runs the runbook coverage check as part of
    evidence validation.
- Verification:
  - `node scripts/check_mvp_external_runbook.js`: passed; covered 9 unresolved
    launch evidence entries, 12 miniapp manual QA entries, and 12 admin manual
    QA entries.
  - `RUN_BACKEND=0 RUN_ADMIN=0 RUN_MINIAPP=0 RUN_DEPLOY_CONFIG=0 scripts/check_mvp_regression.sh`:
    passed evidence checks, with deploy config and production checks skipped for
    this focused run.
  - `node scripts/check_mvp_launch_evidence.js`: passed with 9 required
    external evidence entries still pending.
  - `node --check scripts/check_mvp_external_runbook.js`: passed.
  - `bash -n scripts/check_mvp_regression.sh`: passed.
  - `git diff --check`: passed.
- Change summary:
  - Added `docs/MVP-External-Validation-Runbook.md`.
  - Added `scripts/check_mvp_external_runbook.js`.
  - Wired the runbook coverage check into `scripts/check_mvp_regression.sh`.
  - Updated `docs/MVP-Readiness.md`, `docs/Context-Index.md`, and
    `docs/Project-State.md`.
- Goal correction:
  - This round improves handoff and reduces the chance of missed external
    evidence, but does not complete those external checks. The MVP goal remains
    open until the pending evidence is recorded or explicitly waived.

## Round 15: Evidence Quality Guard

- Date: 2026-06-02
- Status: completed.
- Focus: prevent final strict evidence checks from being satisfied by simply
  changing `status` to `passed` or `waived` while leaving placeholder evidence.
- Start evidence:
  - `git status --short --untracked-files=all`: clean after Round 14 commit.
  - Existing launch, miniapp manual QA, and admin manual QA checkers validated
    schema and unresolved counts, but did not reject resolved statuses whose
    evidence still said `Not recorded in repo.`
  - Final MVP completion depends on strict evidence being meaningful, not just
    status-field bookkeeping.
- Open-source reference check:
  - Task classification: common release gate / evidence validation hardening.
  - Sources checked: existing repository JSON ledgers and checker scripts:
    `scripts/check_mvp_launch_evidence.js`,
    `scripts/check_miniapp_manual_qa.js`,
    `scripts/check_admin_web_manual_qa.js`,
    `docs/MVP-Launch-Evidence.json`, `docs/Miniapp-Manual-QA.json`, and
    `docs/Admin-Web-Manual-QA.json`.
  - Selected approach: extend the existing Node.js checker pattern with
    placeholder-evidence rejection, minimum evidence length for resolved items,
    and explicit user-acceptance wording for waived items.
  - License/compatibility: no external code copied.
  - Reused/adapted: project-local checker functions and status model.
  - Rejected options: adding a third-party schema validator, changing JSON
    schema version, or modifying evidence statuses without real evidence.
- Risks:
  - This is still textual validation. It improves guardrails but cannot verify
    screenshots, payment records, security-group console state, or real-device
    behavior without external execution.
- Acceptance criteria:
  - Launch evidence checker rejects `passed`/`waived` entries with placeholder
    evidence.
  - Miniapp manual QA checker rejects `passed`/`waived` entries with placeholder
    evidence.
  - Admin manual QA checker rejects `passed`/`waived` entries with placeholder
    evidence.
  - Current real ledgers still pass non-strict checks and aggregate evidence
    regression.
- Verification:
  - `node --check scripts/check_mvp_launch_evidence.js && node --check scripts/check_miniapp_manual_qa.js && node --check scripts/check_admin_web_manual_qa.js`:
    passed.
  - Negative temporary-ledger test: all three checkers rejected a required item
    changed to `passed` with evidence `Not recorded in repo.`
  - `node scripts/check_mvp_launch_evidence.js && node scripts/check_miniapp_manual_qa.js && node scripts/check_admin_web_manual_qa.js`:
    passed against current ledgers, preserving pending external evidence.
  - `RUN_BACKEND=0 RUN_ADMIN=0 RUN_MINIAPP=0 scripts/check_mvp_regression.sh`:
    passed evidence and deploy-config checks with production checks skipped.
  - `git diff --check`: passed.
- Change summary:
  - Added resolved-evidence quality checks to
    `scripts/check_mvp_launch_evidence.js`.
  - Added the same guard to `scripts/check_miniapp_manual_qa.js` and
    `scripts/check_admin_web_manual_qa.js`.
  - Updated `docs/Project-State.md`.
- Goal correction:
  - This makes future MVP closeout harder to fake and safer to audit, but does
    not complete the external evidence itself. The goal remains open until the
    pending external evidence is recorded or explicitly waived.

## Round 16: Miniapp Behavior Wiring Guard

- Date: 2026-06-02
- Status: completed.
- Focus: add a repeatable local guard that checks whether the MVP miniapp pages
  are wired to the key API, payment, navigation, and WXML event handlers used by
  the real user path.
- Start evidence:
  - `git status --short --untracked-files=all`: clean after Round 15 commit.
  - Existing `scripts/check_miniapp_mvp_smoke.js` verifies page registration,
    JavaScript syntax, and utility exports, but does not assert that buttons and
    page methods are connected to login, phone binding, order creation, payment,
    cancellation, reschedule, or refund behavior.
  - Manual WeChat preview/device QA remains pending and cannot be replaced by a
    local static guard.
- Open-source reference check:
  - Task classification: common static regression guard for UI behavior wiring,
    but highly repository-specific because WeChat miniapp WXML events and local
    page method names are the contract.
  - Sources checked: existing repository miniapp pages and utility scripts:
    `sunflower-miniapp/pages/mvp/**`, `sunflower-miniapp/utils/mvp/api.js`,
    `sunflower-miniapp/utils/mvp/payment.js`, and
    `scripts/check_miniapp_mvp_smoke.js`.
  - Selected approach: add a thin Node.js static checker over explicit local
    wiring invariants and wire it into the aggregate MVP regression.
  - License/compatibility: no external code copied.
  - Reused/adapted: existing local script style and known MVP user-path method
    names.
  - Rejected options: adding a third-party miniapp test framework or copying
    generic UI test code that would not understand this project's WXML/page
    contract.
- Risks:
  - Static wiring checks can catch disconnected page methods and missing event
    bindings, but they cannot prove WeChat login, phone authorization,
    `wx.requestPayment`, HTTPS request-domain compliance, or real backend
    state transitions.
- Acceptance criteria:
  - New checker covers home, login, booking, room detail, order create, order
    list, API utility, and payment utility wiring.
  - `scripts/check_mvp_regression.sh` runs the new checker as part of miniapp
    checks.
  - Miniapp QA/readiness/project-state docs identify the new guard and its
    limits.
  - Focused verification passes and the round is committed once.
- Verification:
  - `node --check scripts/check_miniapp_behavior_wiring.js`: passed.
  - `node scripts/check_miniapp_behavior_wiring.js`: passed with 69 key
    behavior wiring checks across 14 files.
  - `node --check sunflower-miniapp/pages/mvp/booking/index.js`: passed.
  - `node scripts/check_miniapp_mvp_smoke.js`: passed with expected bare HTTP
    API warning.
  - `node scripts/check_mvp_launch_evidence.js`: passed with 9 required
    external evidence entries still pending.
  - `RUN_BACKEND=0 RUN_ADMIN=0 scripts/check_mvp_regression.sh`: passed
    miniapp, evidence, and deploy-config checks with backend, admin, and
    production checks skipped for this focused run.
- Change summary:
  - Added `scripts/check_miniapp_behavior_wiring.js`.
  - Wired the new checker into `scripts/check_mvp_regression.sh`.
  - Updated miniapp QA, readiness, launch evidence, project-state,
    context-index, component README, and decision docs.
  - Fixed `pages/mvp/booking/index.js` so confirming a changed stay date range
    refreshes room search results instead of leaving stale availability data.
- Goal correction:
  - The local miniapp evidence is stronger and catches disconnected behavior
    wiring, but it still does not prove WeChat preview/real-device behavior,
    legal HTTPS request domain, real payment/refund, admin production QA,
    backend `8080` hardening, or deployment of the current branch. The overall
    MVP goal remains open.

## Round 17: Admin-Web Behavior Wiring Guard

- Date: 2026-06-02
- Status: completed.
- Focus: add a repeatable local guard that checks whether the admin web's
  protected routes, auth flows, room CRUD, pricing/inventory operations, order
  actions, query invalidation, and API services remain wired to the MVP
  operator path.
- Start evidence:
  - `git status --short --untracked-files=all`: clean after Round 16 commit.
  - Admin web lint/test/build are currently recorded as green, but the
    automated baseline does not have a single lightweight static guard for
    route-to-page, page-to-service, and mutation-to-refetch wiring.
  - Production or approved-staging admin manual QA remains pending and cannot
    be replaced by a local static guard.
- Open-source reference check:
  - Task classification: common admin CRUD/form/action wiring verification for
    a React dashboard.
  - Sources checked:
    - TanStack Query official invalidation guidance:
      `https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations`.
    - React Router official routing guide:
      `https://reactrouter.com/start/data/routing`.
    - Testing Library guiding principles:
      `https://testing-library.com/docs/guiding-principles/`.
    - TDesign React Table docs:
      `https://tdesign.tencent.com/react/components/table`.
    - Existing project code/tests under `sunflower-admin-web/src/**`.
  - Selected approach: add a project-local Node.js static checker over explicit
    route, service, page action, and query invalidation invariants; keep the
    existing Vitest/Testing Library suite as the executable behavior layer.
  - License/compatibility: no external code copied.
  - Reused/adapted: existing local checker style from miniapp/evidence scripts
    and project-native React/TDesign/TanStack Query patterns.
  - Rejected options: adding Playwright or copying a generic admin dashboard
    test harness before production credentials and safe QA data are available.
- Risks:
  - Static wiring checks can catch disconnected routes, handlers, services, and
    cache refreshes, but they cannot prove real admin account activation, SMS,
    live room/order mutation safety, browser runtime behavior, or production
    data correctness.
- Acceptance criteria:
  - New checker covers auth service/store, router/protected shell, workspace
    health, room management, pricing/inventory, order management, and admin
    service endpoints.
  - `scripts/check_mvp_regression.sh` runs the new checker as part of admin web
    checks.
  - Admin QA/readiness/project-state docs identify the new guard and its
    limits.
  - Focused verification passes and the round is committed once.
- Verification:
  - `node --check scripts/check_admin_web_behavior_wiring.js`: passed.
  - `node scripts/check_admin_web_behavior_wiring.js`: passed with 97 key
    behavior wiring checks across 16 files.
  - `cd sunflower-admin-web && npm run lint`: passed.
  - `cd sunflower-admin-web && npm run test`: passed, 20 tests.
  - `cd sunflower-admin-web && npm run build`: passed.
  - `RUN_BACKEND=0 RUN_MINIAPP=0 scripts/check_mvp_regression.sh`: passed
    admin-web, evidence, and deploy-config checks with backend, miniapp, and
    production checks skipped for this focused run.
- Change summary:
  - Added `scripts/check_admin_web_behavior_wiring.js`.
  - Wired the new checker into `scripts/check_mvp_regression.sh`.
  - Updated admin QA, admin README, readiness, launch evidence, project-state,
    context-index, and decision docs.
- Goal correction:
  - Admin web local handoff evidence is stronger and now catches route/action/API
    wiring drift, but it still does not prove production or approved-staging
    admin account, SMS, live data mutation safety, or browser runtime QA. The
    overall MVP goal remains open until external evidence is recorded or
    explicitly waived.

## Round 18: MVP Closeout Readiness Guard

- Date: 2026-06-02
- Status: completed.
- Focus: add a single machine-checkable closeout guard that summarizes whether
  the MVP goal can be declared complete, without rerunning heavy tests or
  mutating production.
- Start evidence:
  - `git status --short --untracked-files=all`: clean after Round 17 commit.
  - Existing checkers validate launch evidence, miniapp manual QA, admin manual
    QA, deploy config, miniapp wiring, and admin wiring separately.
  - `docs/MVP-Closeout-Audit.md` explains the completion conditions, but there
    is not yet one script that evaluates all closeout ledgers together and
    fails in strict mode when any required external evidence remains pending.
- Open-source reference check:
  - Task classification: common release-readiness / go-live closeout guard.
  - Sources checked: existing repository evidence ledgers and checker scripts:
    `docs/MVP-Launch-Evidence.json`, `docs/Miniapp-Manual-QA.json`,
    `docs/Admin-Web-Manual-QA.json`, `scripts/check_mvp_launch_evidence.js`,
    `scripts/check_miniapp_manual_qa.js`,
    `scripts/check_admin_web_manual_qa.js`, and
    `docs/MVP-Closeout-Audit.md`.
  - Selected approach: add a small project-local Node.js closeout checker that
    reads the existing ledgers, reports unresolved required evidence by area,
    and only exits non-zero when `--strict` is requested.
  - License/compatibility: no external code copied.
  - Reused/adapted: existing project-local JSON ledger/status model and checker
    style.
  - Rejected options: adding a third-party release checklist service, making the
    aggregate regression fail by default while external evidence is intentionally
    pending, or copying a generic release gate that does not understand this
    MVP's WeChat/payment/admin/deployment evidence model.
- Risks:
  - The guard is a readiness decision aid, not proof of screenshots, payment
    settlement, WeChat backend configuration, security-group console state, or
    production deployment. It depends on the existing evidence ledgers being
    updated honestly.
- Acceptance criteria:
  - New checker summarizes required launch, miniapp manual QA, and admin manual
    QA status.
  - Non-strict mode exits zero and prints unresolved blockers for normal
    handoff.
  - Strict mode exits non-zero while current external evidence remains pending.
  - Readiness/context/project-state/closeout docs include the new final closeout
    guard and its limits.
  - Focused verification passes and the round is committed once.
- Verification:
  - `node --check scripts/check_mvp_closeout_readiness.js`: passed.
  - `node scripts/check_mvp_closeout_readiness.js`: passed and summarized 33
    unresolved required closeout items.
  - `node scripts/check_mvp_closeout_readiness.js --strict`: expected non-zero;
    failed with 33 unresolved required items across launch, miniapp manual QA,
    and admin-web manual QA ledgers.
- Change summary:
  - Added `scripts/check_mvp_closeout_readiness.js`.
  - Wired the non-strict closeout readiness summary into
    `scripts/check_mvp_regression.sh` evidence checks.
  - Updated readiness, closeout audit, context index, project-state, and
    decision docs.
- Goal correction:
  - The final completion boundary is now harder to misread: the MVP can only be
    declared complete when the strict closeout readiness guard passes. The
    overall MVP goal remains open because current external evidence is still
    pending.

## Round 19: External QA Evidence Template Generator

- Date: 2026-06-02
- Status: completed.
- Focus: generate a safe, human-fillable evidence template for all pending
  external MVP checks so real-device/admin/deployment QA can be recorded
  consistently without committing secrets or raw customer/payment data.
- Start evidence:
  - `git status --short --untracked-files=all`: clean after Round 18 commit.
  - The JSON ledgers identify pending launch, miniapp, and admin-web checks, and
    the external validation runbook explains how to execute them.
  - Operators still need a compact per-check template for recording sanitized
    evidence before changing JSON statuses to `passed` or `waived`.
- Open-source reference check:
  - Task classification: common QA/release evidence handoff template.
  - Sources checked: existing project evidence ledgers and runbook:
    `docs/MVP-Launch-Evidence.json`, `docs/Miniapp-Manual-QA.json`,
    `docs/Admin-Web-Manual-QA.json`, `docs/MVP-External-Validation-Runbook.md`,
    `scripts/check_mvp_closeout_readiness.js`, and current evidence checker
    validation rules.
  - Selected approach: add a project-local Node.js generator that reads the
    ledgers and writes a Markdown template with required IDs, routes/APIs,
    next actions, safe evidence fields, and explicit forbidden data reminders.
  - License/compatibility: no external code copied.
  - Reused/adapted: existing project-local JSON ledger/status model and safety
    wording.
  - Rejected options: adding a release-management SaaS, storing screenshots in
    Git, or generating pre-filled `passed` evidence without execution.
- Risks:
  - The generated template improves operator consistency but does not replace
    actual external validation. It must not include real AppID, phone numbers,
    SMS codes, passwords, tokens, payment payloads, raw screenshots, or full
    order/payment IDs.
- Acceptance criteria:
  - New generator reads all three evidence ledgers and writes a Markdown
    template under `docs/`.
  - Generated template includes every unresolved required launch, miniapp
    manual QA, and admin-web manual QA item.
  - Generator output is deterministic and safe for Git.
  - Readiness/runbook/context/project-state docs reference the template.
  - Focused verification passes and the round is committed once.
- Verification:
  - `node --check scripts/generate_mvp_external_evidence_template.js`: passed.
  - `node --check scripts/check_mvp_external_evidence_template.js`: passed.
  - `node scripts/generate_mvp_external_evidence_template.js`: passed and wrote
    `docs/MVP-External-Evidence-Template.md` with 33 unresolved required items.
  - `node scripts/check_mvp_external_evidence_template.js`: passed and confirmed
    the template covers 33 unresolved required items.
- Change summary:
  - Added `scripts/generate_mvp_external_evidence_template.js`.
  - Added `scripts/check_mvp_external_evidence_template.js`.
  - Generated `docs/MVP-External-Evidence-Template.md`.
  - Wired the template coverage check into `scripts/check_mvp_regression.sh`.
  - Updated external validation runbook, readiness, context index,
    project-state, and decision docs.
- Goal correction:
  - External QA handoff is now easier to execute safely, but the MVP goal remains
    open. The generated template is not evidence by itself; real external QA or
    explicit waivers still need to be recorded in the JSON ledgers before strict
    closeout can pass.

## Round 20: Production Read-Only Audit Entry

- Date: 2026-06-02
- Status: completed.
- Focus: add a single repeatable production-only audit command that combines
  static deploy configuration checks, public/ECS smoke, and backend `8080`
  exposure inspection without pushing, deploying, or changing production
  configuration.
- Start evidence:
  - `git status --short --untracked-files=all`: clean after Round 19 commit.
  - Existing production verification is split across
    `scripts/check_deploy_config.sh`, `scripts/check_production_smoke.sh`, and
    `scripts/check_backend_8080_exposure.sh`.
  - Current docs already warn that backend `8080` remains a launch blocker until
    Alibaba Cloud security group/firewall evidence or an explicit waiver is
    recorded.
- Open-source reference check:
  - Task classification: common production readiness / smoke audit wrapper,
    but highly repository-specific because it relies on this project's dual-ECS
    topology, ignored SSH key location, compose files, and evidence ledgers.
  - Sources checked: existing repository scripts and docs:
    `scripts/check_deploy_config.sh`, `scripts/check_production_smoke.sh`,
    `scripts/check_backend_8080_exposure.sh`, `docs/Production-Smoke.md`,
    `docs/Backend-8080-Security.md`, and `docs/CI-CD.md`.
  - Selected approach: add a thin Bash wrapper that executes the existing
    project-native checks in a clear order and keeps all production operations
    read-only.
  - License/compatibility: no external code copied.
  - Reused/adapted: existing local Bash logging and validation script style.
  - Rejected options: copying a generic deployment smoke framework, adding a new
    dependency, or making this command mutate ECS/firewall/security-group state.
- Risks:
  - A read-only audit can prove current reachability and container health from
    the checked vantage points, but it still cannot prove WeChat domain
    approval, real payment/refund, admin manual QA, or Alibaba Cloud console
    security-group rules.
- Acceptance criteria:
  - New wrapper runs deploy config, production smoke, and backend `8080`
    read-only checks from one command.
  - The wrapper is included in shell syntax validation.
  - Readiness/context/project-state/production docs identify the wrapper and
    its limits.
  - Focused verification passes and the round is committed once.
- Verification:
  - `bash -n scripts/check_production_readonly_audit.sh scripts/check_deploy_config.sh`:
    passed.
  - `scripts/check_production_readonly_audit.sh`: passed at 2026-06-02 05:59
    Asia/Shanghai with 3 read-only audit steps.
  - Deploy config static checks passed inside the wrapper.
  - Production smoke passed with 7 checks and 1 known warning that ECS-2 backend
    still listens on `0.0.0.0:8080`.
  - Backend `8080` exposure inspection passed with 3 checks and 2 warnings:
    public `8080` was not directly usable from this local network and ECS-1
    private upstream worked, but local firewall/security-group restriction was
    not proven.
  - `node scripts/generate_mvp_external_evidence_template.js`: passed and wrote
    `docs/MVP-External-Evidence-Template.md` with 33 unresolved required items.
  - `node scripts/check_mvp_external_evidence_template.js`: passed.
- Change summary:
  - Added `scripts/check_production_readonly_audit.sh`.
  - Included the new wrapper in deploy shell syntax validation.
  - Updated production smoke, backend `8080`, readiness, context, deployment,
    closeout, launch evidence, external validation, project-state, and decision
    docs.
- Goal correction:
  - The two Alibaba Cloud servers are currently reachable and serving the
    existing production app through the read-only audit, but the MVP goal remains
    open. This round did not prove WeChat HTTPS legal domain, real-device login
    and phone binding, real payment/refund, admin production manual QA, current
    branch deployment, or Alibaba Cloud security-group restriction for backend
    `8080`.

## Round 21: Miniapp External QA Preflight

- Date: 2026-06-02
- Status: completed.
- Focus: reduce the risk of leaking a real WeChat AppID during preview or
  real-device QA by moving personal DevTools configuration to an ignored private
  file pattern and adding a machine-checkable miniapp external QA preflight.
- Start evidence:
  - `git status --short --untracked-files=all`: clean after Round 20 commit.
  - `sunflower-miniapp/project.config.json` is correctly committed with
    `touristappid`.
  - `sunflower-miniapp/project.private.config.json` is currently tracked even
    though WeChat DevTools treats it as personal/local configuration.
  - Miniapp manual QA remains pending because real AppID, legal HTTPS request
    domain, phone binding, payment, and refund evidence is not recorded.
- Open-source reference check:
  - Task classification: common mobile/app external QA secret-hygiene preflight
    around local project configuration.
  - Sources checked:
    - WeChat official project configuration documentation:
      `https://developers.weixin.qq.com/miniprogram/dev/devtools/projectconfig.html`.
    - Existing project scripts and docs:
      `scripts/check_miniapp_project_config.sh`,
      `scripts/check_miniapp_mvp_smoke.js`,
      `docs/Miniapp-Manual-QA.md`, `docs/Miniapp-MVP-QA.md`, and
      `sunflower-miniapp/README.md`.
  - Selected approach: follow WeChat DevTools' `project.private.config.json`
    pattern for personal AppID overrides, keep that file ignored/untracked, and
    add a repo-local Node.js preflight that validates the safe boundaries without
    printing private AppID values.
  - License/compatibility: official documentation referenced; no external code
    copied.
  - Reused/adapted: existing project-local smoke/checker style and evidence
    ledger model.
  - Rejected options: editing committed `project.config.json` for real AppID,
    storing real AppID in docs, or adding device automation before HTTPS domain
    and credentials are available.
- Risks:
  - This preflight improves handoff and secret hygiene, but it still cannot
    prove WeChat login, phone authorization, payment/refund, or legal request
    domain behavior. Those require external execution and sanitized evidence.
- Acceptance criteria:
  - `sunflower-miniapp/project.private.config.json` is ignored and no longer
    tracked by Git.
  - A safe private-config example exists for local operators.
  - A new preflight verifies placeholder committed AppID, ignored/untracked
    private config, safe template, runtime API override support, and required
    miniapp manual QA ledger entries.
  - Miniapp automated checks include the new preflight.
  - Miniapp docs explain using private config instead of editing committed
    `project.config.json`.
  - Focused verification passes and the round is committed once.
- Verification:
  - `node --check scripts/check_miniapp_external_qa_preflight.js`: passed.
  - `node scripts/check_miniapp_external_qa_preflight.js`: passed with 6 checks
    and the expected warning that local `project.private.config.json` is absent
    until an operator creates it for real preview QA.
  - `node scripts/check_miniapp_mvp_smoke.js`: passed with the expected bare
    HTTP API warning.
  - `node scripts/check_miniapp_manual_qa.js`: passed in non-strict mode and
    still reports 12 pending required external QA checks.
  - `node scripts/check_mvp_external_evidence_template.js`: passed.
  - `RUN_BACKEND=0 RUN_ADMIN=0 RUN_EVIDENCE=0 RUN_DEPLOY_CONFIG=0 scripts/check_mvp_regression.sh`:
    passed miniapp checks with backend, admin, evidence, deploy config, and
    production checks skipped for this focused run.
- Change summary:
  - Stopped tracking `sunflower-miniapp/project.private.config.json` and added
    it to `.gitignore`.
  - Added `sunflower-miniapp/project.private.config.example.json`.
  - Added `scripts/check_miniapp_external_qa_preflight.js`.
  - Wired the preflight into aggregate miniapp regression.
  - Updated miniapp QA, readiness, launch evidence, context, CI/CD, README,
    project-state, and decision docs.
- Goal correction:
  - Miniapp external QA is safer and more repeatable for the next human
    preview/real-device pass, but the MVP goal remains open. This round did not
    execute real WeChat login, phone authorization, legal HTTPS request-domain
    validation, real payment/refund, or admin production QA.

## Round 22: Admin-Web External QA Preflight

- Date: 2026-06-02
- Status: completed.
- Focus: add a machine-checkable admin-web external QA preflight so operators
  can prepare production or approved-staging manual QA without committing
  credentials, raw customer/order data, SMS codes, cookies, or unsafe live data
  mutations.
- Start evidence:
  - `git status --short --untracked-files=all`: clean after Round 21 commit.
  - Admin-web local lint/test/build and behavior wiring are recorded as green.
  - `docs/Admin-Web-Manual-QA.json` still has 12 required manual checks pending.
  - Existing docs describe safety rules, but there is no dedicated preflight
    script to verify admin QA ledger boundaries before external execution.
- Open-source reference check:
  - Task classification: common admin dashboard release-readiness and manual QA
    secret/data-safety preflight.
  - Sources checked:
    - Playwright authentication guide:
      `https://playwright.dev/docs/auth`.
    - Playwright best practices:
      `https://playwright.dev/docs/best-practices`.
    - Testing Library guiding principles:
      `https://testing-library.com/docs/guiding-principles/`.
    - Existing project docs/scripts:
      `docs/Admin-Web-MVP-QA.md`, `docs/Admin-Web-Manual-QA.json`,
      `scripts/check_admin_web_manual_qa.js`,
      `scripts/check_admin_web_behavior_wiring.js`, and
      `sunflower-admin-web/README.md`.
  - Selected approach: add a repo-local Node.js preflight that validates the
    admin manual QA ledger, environment URLs, required high-risk action
    warnings, and safe evidence wording; avoid storing browser auth state or
    adding Playwright until credentials and QA data are available.
  - License/compatibility: official/reference documentation only; no external
    code copied.
  - Reused/adapted: existing project-local checker style and evidence ledger
    model.
  - Rejected options: adding E2E login automation now, storing auth state in
    Git, or treating local tests as proof of live admin operation safety.
- Risks:
  - The preflight can catch unsafe ledger drift and missing handoff rules, but
    it cannot prove a real admin account, SMS, browser runtime, live data
    mutation safety, or production correctness. Those still need external
    execution or explicit waiver.
- Acceptance criteria:
  - New preflight verifies admin manual QA environment URLs, required check IDs,
    safe evidence/nextAction wording, high-risk action approvals/restoration
    notes, and credential/secrets prohibitions.
  - Admin automated checks include the new preflight.
  - Admin QA/readiness/project-state/context docs identify the preflight and
    its limits.
  - Focused verification passes and the round is committed once.
- Verification:
  - `node --check scripts/check_admin_web_external_qa_preflight.js`: passed.
  - `node scripts/check_admin_web_external_qa_preflight.js`: passed with 6
    preflight checks.
  - `node scripts/check_mvp_external_evidence_template.js`: passed.
  - `node scripts/check_admin_web_manual_qa.js`: passed in non-strict mode and
    still reports 12 pending required admin manual QA checks.
- Change summary:
  - Added `scripts/check_admin_web_external_qa_preflight.js`.
  - Wired the new preflight into aggregate admin-web regression.
  - Tightened `docs/Admin-Web-Manual-QA.json` next actions for room edit and
    pricing batch checks so final state restoration, acceptance, or waiver is
    explicit.
  - Updated admin QA, admin README, readiness, context, project-state, external
    evidence template, and decision docs.
- Goal correction:
  - Admin-web handoff safety is stronger, but the MVP goal remains open. This
    round did not log into production, send SMS, mutate live rooms/prices/orders,
    validate refunds, or provide the `node scripts/check_admin_web_manual_qa.js
    --strict` evidence needed for final completion.

## Round 23: Deployment Approval Preflight

- Date: 2026-06-02
- Status: completed.
- Focus: add a read-only preflight that summarizes whether the current MVP
  branch is safe to consider for GitHub Actions deployment approval, what would
  trigger on `main`, and which deployment targets are affected.
- Start evidence:
  - `git status --short --untracked-files=all`: clean after Round 22 commit.
  - Active deployment workflow is `.github/workflows/deploy-backend.yml`.
  - Launch evidence still marks `CURRENT-BRANCH-DEPLOYED` as pending because the
    current branch has not been pushed or merged to `main`, and no deployment
    was triggered by the latest MVP commits.
  - Existing `scripts/check_deploy_config.sh` validates workflow YAML, compose
    rendering, and deployment shell syntax, but does not explain current branch
    deployment impact or approval requirements.
- Open-source reference check:
  - Task classification: common CI/CD pre-deployment impact and approval
    preflight.
  - Sources checked:
    - GitHub Actions workflow syntax and trigger documentation:
      `https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions`.
    - Existing project workflow/docs:
      `.github/workflows/deploy-backend.yml`, `docs/CI-CD.md`,
      `docs/Production-Smoke.md`, `docs/MVP-Launch-Evidence.json`, and
      `scripts/check_deploy_config.sh`.
  - Selected approach: add a repo-local Node.js preflight that reads the active
    workflow and current git diff against `origin/main`/`main`, classifies
    deployment-relevant paths using the workflow's path rules, and prints a
    non-secret approval summary without pushing or calling GitHub APIs.
  - License/compatibility: official documentation referenced; no external code
    copied.
  - Reused/adapted: project-local checker style and workflow path classification
    already encoded in `.github/workflows/deploy-backend.yml`.
  - Rejected options: pushing to `main`, running `workflow_dispatch`, or adding
    a GitHub API dependency before explicit production approval.
- Risks:
  - This preflight predicts deployment impact from local workflow path rules and
    git state, but it does not prove remote runner health, GitHub secrets,
    production deployment success, or that current branch code is live.
- Acceptance criteria:
  - New preflight reports current branch, clean/dirty state, base ref, changed
    files, target classification, and required human approval boundary.
  - The script verifies workflow triggers and dispatch target options match the
    documented deployment flow.
  - Deploy config checks include the new script's syntax.
  - Deployment/readiness/launch docs identify the preflight and its limits.
  - Focused verification passes and the round is committed once.
- Verification:
  - `node --check scripts/check_deployment_approval_preflight.js`: passed.
  - `scripts/check_deploy_config.sh`: passed; it now checks deployment shell
    syntax plus the deployment approval preflight's Node.js syntax.
  - `node scripts/generate_mvp_external_evidence_template.js`: passed and wrote
    `docs/MVP-External-Evidence-Template.md` with 33 unresolved required items.
  - `node scripts/check_mvp_external_evidence_template.js`: passed.
  - `node scripts/check_deployment_approval_preflight.js`: expected non-zero
    before commit because this round's staged changes made the worktree dirty;
    it still reported current branch `codex/s18-payment-hardening`, base
    `origin/main`, and predicted deploy target `all`.
  - `git diff --check`: passed.
- Change summary:
  - Added `scripts/check_deployment_approval_preflight.js`.
  - Added the preflight syntax check to `scripts/check_deploy_config.sh`.
  - Updated readiness, CI/CD, external validation runbook, launch evidence,
    context index, project-state, external evidence template, and decision docs.
- Goal correction:
  - Deployment approval is now easier to review safely before any push or
    workflow dispatch, but the MVP goal remains open. This round did not push,
    merge, dispatch GitHub Actions, deploy current branch code, or prove
    `CURRENT-BRANCH-DEPLOYED`.
