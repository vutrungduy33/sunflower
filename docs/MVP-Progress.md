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
