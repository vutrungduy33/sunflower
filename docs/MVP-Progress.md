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
