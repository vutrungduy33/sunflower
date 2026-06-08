# MVP Progress

> Compact round-by-round progress for the current MVP hardening goal. Keep this
> file factual and update it at the end of each committed round.
> This active file keeps only the latest operational rounds. Older rounds are
> archived in `docs/archive/mvp-progress/`.

## Round 101: Handoff and Approval Doc Refresh

- Date: 2026-06-08
- Status: completed
- Focus: refresh the compact handoff and approval entry documents so they point
  at the latest Round 99/100 validation facts instead of older Round 72/47
  wording.
- Start evidence:
  - `docs/MVP-Handoff-Packet.md`, `docs/MVP-Next-Approval-Request.md`, and
    `docs/MVP-External-Approval-Packet.md` still referenced 2026-06-02 and
    older round numbers.
  - `docs/Project-State.md` and `docs/MVP-Readiness.md` already reflected the
    latest regression and read-only production audit facts.
- Open-source reference check:
  - Task classification: repository-local documentation and state refresh.
  - Sources checked: current project docs and the existing validation scripts.
  - License/compatibility: no external code copied.
  - Selected approach: keep the canonical docs compact and update only the
    stale operator entry points instead of creating new docs.
- Risks:
  - This round must not invent new deployment evidence or reduce the unresolved
    count; it should only align the operator-facing docs with the current
    verified state.
- Acceptance criteria:
  - Update the stale handoff/approval packets to the latest validated facts.
  - Keep the unresolved evidence counts unchanged.
  - Run the packet validators and the closeout guard.
  - Commit the refresh cleanly.
- Change summary:
  - Updated `docs/MVP-Handoff-Packet.md` from the older Round 71/72 wording to
    the current Round 99 aggregate regression, Round 100 production read-only
    audit, Round 91 backend-only nonprod/mock deployment evidence, and the
    still-pending full production current-branch deployment boundary.
  - Updated `docs/MVP-Next-Approval-Request.md` to show 8 pending launch
    evidence entries and 32 total unresolved required closeout items.
  - Updated `docs/MVP-External-Approval-Packet.md` with the current date and
    an explicit reminder that backend-only mock deployment does not close real
    payment/refund, admin-web/Nginx, or production current-branch evidence.
  - Updated `docs/Project-State.md` so future runs know the operator entry
    docs are aligned to the latest facts.
- Verification:
  - `node scripts/check_mvp_handoff_packet.js`: passed, covering 32 unresolved
    required items.
  - `node scripts/check_mvp_next_approval_request.js`: passed, covering 32
    unresolved items and the deployment lane boundaries.
  - `node scripts/check_mvp_external_approval_packet.js`: passed, covering 32
    unresolved items and the approval lanes.
  - `node scripts/check_mvp_closeout_readiness.js`: passed in non-strict mode
    and still reported 32 unresolved required closeout items.
  - `node scripts/check_mvp_launch_evidence.js`: passed in non-strict mode and
    still reported 13 total launch items, 5 passed, and 8 pending.
- Outcome:
  - The compact handoff/approval docs now match the latest evidence baseline.
    This was a docs-only clarity round; it did not push, dispatch, deploy,
    mutate ECS, run payment/refund, or reduce the pending evidence count.

## Round 102: Deployment Preflight Boundary Fix

- Date: 2026-06-08
- Status: completed
- Focus: fix the deployment-approval evidence wording so
  `node scripts/check_deployment_approval_preflight.js` can validate the
  `CURRENT-BRANCH-DEPLOYED` boundary on the current `main`.
- Start evidence:
  - The current `main` branch was clean and aligned with `origin/main` at
    `167cae7`.
  - `node scripts/check_deployment_approval_preflight.js` failed only because
    `CURRENT-BRANCH-DEPLOYED.nextAction` did not yet mention approval before
    `push/merge/workflow_dispatch`, while the deployment workflow and launch
    boundary checks already passed.
- Open-source reference check:
  - Task classification: repository-local evidence wording and validation
    refresh.
  - Sources checked: the preflight script, `docs/MVP-Launch-Evidence.json`,
    and the current approval packets.
  - License/compatibility: no external code copied.
  - Selected approach: repair the current-branch deployment evidence text
    instead of widening the approval surface.
- Risks:
  - The fix must not imply a deploy was run; it only makes the preflight ledger
    honest and machine-checkable.
- Acceptance criteria:
  - Add the explicit approval-before-push/merge/workflow_dispatch wording to
    `CURRENT-BRANCH-DEPLOYED.nextAction`.
  - Re-run the deployment approval preflight on a clean worktree.
  - Update `docs/Project-State.md` with the verified preflight result.
- Change summary:
  - Updated `docs/MVP-Launch-Evidence.json` so
    `CURRENT-BRANCH-DEPLOYED.nextAction` requires explicit user approval before
    push, merge, `workflow_dispatch`, or deploy, and requires a clean-worktree
    deployment approval preflight.
  - Recorded the refreshed deployment preflight state in
    `docs/Project-State.md`.
- Verification:
  - First `node scripts/check_deployment_approval_preflight.js` run failed as
    expected because the launch evidence wording did not yet mention approval
    before `push/merge/workflow_dispatch`.
  - After fixing the ledger and committing, a clean-worktree
    `node scripts/check_deployment_approval_preflight.js` run passed with 4
    checks on local `main` HEAD `9dd2b1a`, base `origin/main 167cae7`, 3
    changed files, and predicted push-to-main deploy target `none`.
  - `node scripts/check_mvp_launch_evidence.js` passed in non-strict mode and
    still reported 13 total launch items, 5 passed, and 8 pending.
- Outcome:
  - The deployment approval preflight boundary is now machine-checkable again
    on the current branch. This round did not push, dispatch, deploy, mutate
    ECS, run payment/refund, or reduce the unresolved evidence count.

## Round 100: Production Read-Only Audit Refresh

- Date: 2026-06-08
- Status: completed
- Focus: refresh the read-only production smoke/audit evidence on the current
  branch without pushing, deploying, or mutating ECS so the deployment and
  security baselines stay current.
- Start evidence:
  - Local `main` and `origin/main` were aligned at `71a535a`.
  - Worktree was clean before validation.
  - `docs/Production-Smoke.md`, `docs/MVP-Readiness.md`, and
    `docs/Project-State.md` still referenced Round 95 as the latest read-only
    production audit.
- Open-source reference check:
  - Task classification: production-read-only audit using existing repo-native
    smoke scripts.
  - Sources checked: `docs/Architecture.md`, `docs/CI-CD.md`, existing smoke
    scripts, and current command output.
  - License/compatibility: local repository scripts only; no external code
    copied.
  - Selected approach: run the canonical read-only production audit wrapper and
    update the evidence docs with the current run result.
- Risks:
  - The audit is read-only, but it still depends on live ECS/public network
    reachability, so it cannot replace real payment, HTTPS domain, or manual QA
    evidence.
  - It does not change the unresolved MVP external evidence count.
- Acceptance criteria:
  - `scripts/check_production_readonly_audit.sh` passes on the current branch.
  - `docs/Project-State.md`, `docs/MVP-Readiness.md`,
    `docs/MVP-Launch-Evidence.json`, and `docs/Production-Smoke.md` reflect the
    refreshed audit.
  - Keep unresolved MVP evidence pending and document the new latest production
    read-only result.
- Verification:
  - `scripts/check_production_readonly_audit.sh`: passed in Round 100 with 4
    read-only steps: deploy config static checks, production public/ECS
    internal smoke, backend `8080` exposure checks, and backend payment config
    readiness. Production smoke had 7 passes and 0 warnings; backend `8080`
    exposure had 5 passes and 0 warnings. The backend payment readiness step
    still reported the same 8 sanitized real-payment config issues.
- Outcome:
  - Latest read-only production audit is now Round 100. The audit confirms the
    current public runtime is reachable and the known payment blockers remain
    unchanged; it does not change the unresolved MVP external evidence count.

## Round 99: Aggregate MVP Regression Refresh

- Date: 2026-06-08
- Status: completed
- Focus: rerun the default aggregate MVP regression on the current clean `main`
  so the repo-wide validation baseline matches the latest admin-web and
  miniapp refreshes.
- Start evidence:
  - Local `main` and `origin/main` were aligned at `af46357` (`0 0` divergence).
  - Worktree was clean before validation.
  - `docs/Project-State.md` and `docs/MVP-Readiness.md` still pointed to the
    older Round 92 aggregate regression as the latest repo-wide baseline.
- Open-source reference check:
  - Task classification: repository-local validation baseline refresh.
  - Sources checked: existing regression scripts, current command output, and
    the already-established project docs.
  - License/compatibility: no external code copied.
  - Selected approach: run the canonical aggregate regression and update the
    baseline docs only.
- Risks:
  - The default aggregate regression skips production smoke, so it cannot
    replace the separate read-only deployment audit or real preview/manual QA.
  - The unresolved miniapp/admin/manual/deployment evidence remains pending.
- Acceptance criteria:
  - `scripts/check_mvp_regression.sh` passes on current `main`.
  - `docs/Project-State.md`, `docs/MVP-Readiness.md`, and launch evidence point
    to the fresh aggregate baseline.
  - Commit the baseline refresh.
- Verification:
  - `scripts/check_mvp_regression.sh`: passed with backend tests, admin-web
    lint/test/build plus behavior/external preflight, miniapp smoke/wiring/user
    flow/payment flow/external preflight/appid/nav guards, non-strict evidence
    checks, and deploy config static checks. Production checks were skipped by
    default.
- Outcome:
  - The repo-wide local MVP regression baseline is current again on `main`.
    This still leaves external miniapp/admin QA, HTTPS/payment/refund evidence,
    and production-like current-branch deployment evidence unresolved.

## Round 98: Deployment Workflow Status Clarification

- Date: 2026-06-08
- Status: completed
- Focus: inspect the current GitHub Actions deployment workflow state after the
  recent documentation/evidence commits, and clarify whether those pushes
  should have triggered ECS deployment.
- Start evidence:
  - Local `main` and `origin/main` were aligned at `291305d`.
  - Worktree was clean before validation.
  - The latest successful deploy evidence was still Round 91 workflow run
    `27112433529` for `main` HEAD `d10d11e`.
- Open-source reference check:
  - Task classification: repository-specific CI/CD status inspection and
    evidence clarification.
  - Sources checked: `.github/workflows/deploy-backend.yml`, current `gh run`
    output, git history, and path diffs between `d10d11e` and `HEAD`.
  - License/compatibility: no external code copied.
  - Selected approach: use `gh run list` / `gh run view` plus local path diff
    checks instead of changing workflow logic.
- Risks:
  - This round is read-only with respect to GitHub Actions and ECS; it does not
    dispatch, deploy, mutate ECS, or prove production payment readiness.
  - It clarifies deployment trigger state but does not close the pending
    current-branch production deployment evidence requirement.
- Acceptance criteria:
  - Confirm the latest deployment workflow run visible from GitHub Actions.
  - Confirm whether the recent docs/checker commits changed any deploy-trigger
    paths.
  - Update project state/progress with the resulting deployment explanation.
- Verification:
  - `gh run list --workflow deploy-backend.yml --limit 10`: latest listed run
    remained `27112433529`, `workflow_dispatch`, `success`, created
    `2026-06-08T02:21:17Z`.
  - `gh run view 27112433529 --json ...`: confirmed run `27112433529` completed
    successfully for `main` head SHA `d10d11e27aff2cd3875dffb8de1d9f74ce86db04`.
  - `git diff --name-only d10d11e..HEAD`: only docs plus
    `scripts/check_miniapp_external_qa_preflight.js` and
    `scripts/check_miniapp_https_domain.js` changed.
  - `git diff --name-only d10d11e..HEAD -- <deploy workflow paths>`: no files
    changed under the push-trigger path list from `.github/workflows/deploy-backend.yml`.
- Outcome:
  - The recent Round 92-97 documentation/evidence/checker commits did not
    require or trigger ECS deployment under the active workflow path filters.
    Latest deploy evidence remains Round 91 reduced-scope backend
    nonprod/mock-payment deployment; production-like closeout still needs real
    payment config, HTTPS legal domain, external QA, and production deployment
    evidence or explicit waivers.

## Round 97: Miniapp Automated Path Baseline Refresh

- Date: 2026-06-08
- Status: completed
- Focus: refresh the miniapp automated smoke, behavior wiring, user-flow replay,
  payment-flow replay, external preflight, and key JavaScript syntax baseline on
  the current clean `main`.
- Start evidence:
  - Local `main` and `origin/main` were aligned at `2fc543e`.
  - Worktree was clean before validation.
  - `docs/Project-State.md`, `docs/MVP-Readiness.md`,
    `docs/Miniapp-Manual-QA.md`, and `docs/MVP-Launch-Evidence.json` still
    recorded the miniapp automated baseline mainly from Round 92/Round 93.
- Open-source reference check:
  - Task classification: repo-local verification baseline refresh for existing
    miniapp scripts and QA docs.
  - Sources checked: `docs/Miniapp-Manual-QA.md`,
    `docs/Miniapp-Manual-QA.json`, current miniapp pages/utilities, and the
    existing miniapp replay/preflight scripts.
  - License/compatibility: no external code copied.
  - Selected approach: run the canonical repository miniapp checks and update
    only evidence/status docs. No new dependency or device automation was
    introduced.
- Risks:
  - The replay checks validate page methods, wiring, payment handling branches,
    and key syntax in a local harness; they do not prove WeChat preview,
    real-device login, legal HTTPS request-domain setup, real payment, or real
    refund.
  - The default API base still warns as bare HTTP and remains acceptable only
    for local/DevTools validation.
- Acceptance criteria:
  - Miniapp smoke, behavior wiring, user-flow replay, payment-flow replay,
    external QA preflight, and key JavaScript syntax checks pass.
  - `docs/Project-State.md`, `docs/MVP-Readiness.md`,
    `docs/MVP-Launch-Evidence.json`, and `docs/Miniapp-Manual-QA.md` reflect
    the refreshed baseline.
  - Keep all manual/external miniapp evidence pending.
- Verification:
  - `cd sunflower-miniapp && node ../scripts/check_miniapp_mvp_smoke.js`:
    passed with the expected bare HTTP API warning.
  - `cd sunflower-miniapp && node ../scripts/check_miniapp_behavior_wiring.js`:
    passed with 69 checks across 14 files.
  - `cd sunflower-miniapp && node ../scripts/check_miniapp_user_flow_replay.js`:
    passed 3 replay scenarios covering home/login bootstrap, order creation,
    and order-list actions.
  - `cd sunflower-miniapp && node ../scripts/check_miniapp_payment_flow_replay.js`:
    passed 5 replay scenarios covering mock payment, real payment success,
    cancel/failure, and backend confirm failure handling.
  - `cd sunflower-miniapp && node ../scripts/check_miniapp_external_qa_preflight.js`:
    passed 6 checks with the expected local private-config absence warning.
  - `cd sunflower-miniapp && node --check ...`: passed for `utils/mvp/api.js`,
    `utils/mvp/payment.js`, and the key home/login/order-create/order-list
    page files.
- Outcome:
  - The miniapp automated main-path baseline is current on `main`. The MVP
    still requires legal HTTPS domain, real AppID preview/real-device, phone,
    booking, payment/refund, and error-state evidence before final closeout.

## Round 96: Admin Web Validation Baseline Refresh

- Date: 2026-06-08
- Status: completed
- Focus: refresh the direct admin-web validation baseline on the current clean
  `main` so the MVP readiness docs reflect the real lint/test/build state
  instead of the earlier stale failure note.
- Start evidence:
  - Local `main` and `origin/main` were aligned at `c329835`.
  - Worktree was clean before validation.
  - The startup baseline still mentioned an old `_refundId` lint note and 3
    admin-web test failures/timeouts, but that no longer matched the current
    code state.
- Open-source reference check:
  - Task classification: repo-local validation refresh for a common admin web
    React/Vitest/ESLint setup.
  - Sources checked: existing repository tests, ESLint/Vitest/Vite usage, and
    the current admin-web package scripts.
  - License/compatibility: no external code copied.
  - Selected approach: run the canonical admin-web lint/test/build commands
    plus the repo's behavior wiring and external QA preflight checks, then
    update the readiness/docs baseline.
- Risks:
  - This proves the current automated admin-web baseline only; it does not
    replace deployed-browser manual QA or backend/API compatibility checks.
  - The wider MVP closeout still has unresolved miniapp, payment, and
    deployment evidence.
- Acceptance criteria:
  - `npm run lint`, `npm run test`, and `npm run build` pass on admin-web.
  - Admin behavior wiring and external QA preflight still pass.
  - `docs/MVP-Readiness.md`, `docs/Project-State.md`, and launch evidence are
    updated to the current state.
  - Commit the documentation refresh.
- Verification:
  - `cd sunflower-admin-web && npm run lint`: passed.
  - `cd sunflower-admin-web && npm run test`: passed with 24 tests across 5
    files.
  - `cd sunflower-admin-web && npm run build`: passed.
  - `node scripts/check_admin_web_behavior_wiring.js`: passed with 97 checks
    across 16 files.
  - `node scripts/check_admin_web_external_qa_preflight.js`: passed with 6
    checks.
- Outcome:
  - The admin-web automated baseline is green again on the current branch.
    This round only refreshes evidence and does not close the remaining MVP
    manual QA and deployment gaps.

## Round 95: Production Read-Only Audit Refresh

- Date: 2026-06-08
- Status: completed
- Focus: refresh the read-only production smoke/audit evidence on the current
  branch without pushing, deploying, or mutating ECS so the deployment and
  security baselines stay current.
- Start evidence:
  - Local `main` and `origin/main` were aligned at `d687370`.
  - Worktree was clean before validation.
  - `docs/Production-Smoke.md`, `docs/MVP-Readiness.md`, and
    `docs/Project-State.md` still referenced Round 65 as the latest read-only
    production audit.
- Open-source reference check:
  - Task classification: production-read-only audit using existing repo-native
    smoke scripts.
  - Sources checked: `docs/Architecture.md`, `docs/CI-CD.md`, existing smoke
    scripts, and current command output.
  - License/compatibility: local repository scripts only; no external code
    copied.
  - Selected approach: run the canonical read-only production audit wrapper and
    update the evidence docs with the approved-network result.
- Risks:
  - The audit is read-only, but it still depends on live ECS/public network
    reachability, so a sandbox-only run may fail while the approved-network run
    passes.
  - The audit does not prove real payment readiness, HTTPS legal-domain setup,
    or current-branch deployment through the production lane.
- Acceptance criteria:
  - `scripts/check_production_readonly_audit.sh` passes on the current branch.
  - `docs/Project-State.md`, `docs/MVP-Readiness.md`,
    `docs/MVP-Launch-Evidence.json`, and `docs/Production-Smoke.md` reflect the
    refreshed audit.
  - Keep unresolved MVP evidence pending and document the new latest production
    read-only result.
- Verification:
  - First sandboxed run of `scripts/check_production_readonly_audit.sh` could
    not connect to the public API health endpoint.
  - Approved-network rerun of `scripts/check_production_readonly_audit.sh`
    passed all 4 read-only steps: deploy config static checks, public and ECS
    internal smoke, backend `8080` exposure checks, and backend payment config
    readiness. The smoke returned 7 passes, 0 warnings; backend `8080`
    exposure returned 5 passes, 0 warnings; payment readiness still reported
    the known 8 sanitized real-payment config issues.
- Outcome:
  - Latest read-only production audit is now Round 95. The audit confirms the
    current public runtime is reachable from the approved network and the known
    payment blockers remain unchanged; it does not change the unresolved MVP
    external evidence count.

## Round 94: Miniapp HTTPS Evidence Boundary Tightening

- Date: 2026-06-08
- Status: completed
- Focus: align the miniapp HTTPS/domain evidence boundary across the manual QA
  ledger, launch evidence ledger, QA preflight, and project memory so future
  operators consistently run the same read-only checker before recording
  `WECHAT-DOMAIN` evidence.
- Start evidence:
  - Local `main` and `origin/main` were aligned at `7d939df`.
  - Worktree was clean before the documentation and guard updates.
  - The new checker from Round 93 already existed and passed local positive
    smoke against a temporary loopback HTTPS server.
- Open-source reference check:
  - Task classification: documentation and quality-gate alignment for a common
    HTTPS certificate/domain readiness workflow.
  - Sources checked: existing round 93 outputs, `docs/Miniapp-Manual-QA.md`,
    `docs/MVP-Launch-Evidence.json`, `scripts/check_miniapp_external_qa_preflight.js`,
    and repository-native memory docs.
  - License/compatibility: local repository text only; no external code copied.
  - Selected approach: tighten the evidence nextAction text and the preflight
    guard so the new domain checker is the canonical preflight for `WECHAT-DOMAIN`.
- Risks:
  - This round changes only evidence-gating text and helper scripts; it does
    not move any unresolved external evidence to passed.
  - The production domain still remains unproven until DNS, TLS, WeChat legal
    request-domain setup, and a real API health response are available.
- Acceptance criteria:
  - `MINIAPP-DOMAIN-HTTPS` nextAction mentions
    `scripts/check_miniapp_https_domain.js`.
  - `scripts/check_miniapp_external_qa_preflight.js` enforces that mention.
  - `docs/Context-Index.md`, `docs/Project-State.md`,
    `docs/Decision-Log.md`, and `docs/Miniapp-Manual-QA.md` reflect the helper.
  - Targeted validation passes and the round is committed/pushed.
- Verification:
  - `node scripts/check_miniapp_external_qa_preflight.js`: passed.
  - `node scripts/check_miniapp_manual_qa.js`: passed in non-strict mode with
    the unchanged 12 pending checks.
  - `node scripts/check_mvp_launch_evidence.js`: passed in non-strict mode with
    the unchanged 8 pending launch evidence entries.
  - `node scripts/check_mvp_closeout_readiness.js`: passed in non-strict mode
    with 32 unresolved required closeout items.
  - `git diff --check`: passed.
- Outcome:
  - `WECHAT-DOMAIN` evidence now has a canonical read-only preflight path and
    the project memory points to it. MVP completion remains blocked by the same
    external miniapp, payment/refund, admin, and deployment evidence items.

## Round 93: Miniapp HTTPS Domain Checker

- Date: 2026-06-08
- Status: completed
- Focus: add a repeatable read-only checker for candidate miniapp HTTPS API
  domains so `WECHAT-DOMAIN` / `MINIAPP-DOMAIN-HTTPS` evidence can be collected
  consistently when DNS, certificate, and WeChat backend configuration are
  ready.
- Start evidence:
  - Local `main` and `origin/main` were aligned at `d145e2b`.
  - Worktree was clean before implementation.
  - The 32 unresolved closeout items still include HTTPS legal request-domain
    evidence and miniapp preview/real-device evidence.
- Open-source reference check:
  - Task classification: common infrastructure validation for HTTPS request
    domains and TLS certificates.
  - Sources checked: WeChat Mini Program network/request-domain documentation,
    Node.js official `https`, `tls`, and `dns` APIs, and repository-native
    read-only checker style.
  - License/compatibility: official documentation and local code only; no
    external source code copied.
  - Selected approach: add a small dependency-free Node checker using DNS
    lookup, trusted HTTPS request, Node hostname/certificate validation,
    certificate expiry inspection, and an API health response check.
  - Rejected options: adding a new third-party TLS library, weakening cert
    validation for self-signed domains, or wiring the check into default local
    regression before a real HTTPS API domain exists.
- Risks:
  - This checker proves only DNS/TLS/API shape for a supplied URL; it cannot
    prove the domain has been configured in the WeChat backend as a legal
    request domain.
  - Running the checker against current备案 domains is expected to fail until
    DNS points to ECS-1 and a trusted certificate is deployed.
  - The script is not part of default aggregate regression because it depends
    on an external domain that is still pending.
- Acceptance criteria:
  - Add a read-only `scripts/check_miniapp_https_domain.js` helper.
  - Document it in the miniapp QA and context entry points.
  - Verify syntax, CLI help, and a positive HTTPS/TLS/API path without
    contacting production.
  - Keep all external evidence statuses unchanged.
- Verification:
  - `node --check scripts/check_miniapp_https_domain.js`: passed.
  - `node scripts/check_miniapp_https_domain.js --help`: passed.
  - Local positive smoke with a temporary trusted HTTPS server:
    `NODE_EXTRA_CA_CERTS=/tmp/sunflower-miniapp-domain-ip.crt node scripts/check_miniapp_https_domain.js https://127.0.0.1:34443 --path=/api/health --min-valid-days=1`
    passed 4 checks: DNS resolution, trusted TLS certificate, certificate
    validity window, and HTTP 200. The temporary server and certificate were
    local-only and not committed.
- Outcome:
  - Future `WECHAT-DOMAIN` evidence can use
    `node scripts/check_miniapp_https_domain.js https://<api-domain>` before
    recording sanitized manual QA evidence. MVP completion remains blocked by
    HTTPS legal request-domain configuration, miniapp real-device QA, real
    payment/refund evidence, admin manual QA, and production-like deployment
    evidence.

## Round 92: Current Main Aggregate Regression Refresh

- Date: 2026-06-08
- Status: completed
- Focus: refresh the default local automated MVP regression baseline on the
  current clean `main` after the V8 schema repair, Codeup/Yunxiao plan, and
  backend-only nonprod/mock deploy evidence commits.
- Start evidence:
  - Local `main` and `origin/main` were aligned at `7cc7e04`.
  - Worktree was clean before validation.
  - `docs/Project-State.md` and `docs/MVP-Readiness.md` still recorded Round
    86 / HEAD `158d894` as the latest default aggregate local regression, so
    the validation baseline was stale.
- Open-source reference check:
  - Task classification: verification and documentation-only baseline refresh.
  - Sources checked: repository hot context, `docs/Architecture.md`,
    `docs/CI-CD.md`, existing regression scripts, and current command output.
  - License/compatibility: no external code or dependency reused.
  - Selected approach: rerun the existing aggregate regression script and update
    only the durable validation/evidence docs.
- Risks:
  - The default aggregate regression is local/non-production only; it skips
    production read-only smoke unless `RUN_PRODUCTION=1` is set.
  - Passing non-strict evidence checks does not satisfy the 32 unresolved
    required external closeout items.
  - Real WeChat Pay config, HTTPS legal request domain, miniapp real-device QA,
    admin manual QA, and full production-like deployment evidence remain
    pending.
- Acceptance criteria:
  - `scripts/check_mvp_regression.sh` passes on current `main`.
  - `docs/Project-State.md`, `docs/MVP-Readiness.md`, and
    `docs/MVP-Launch-Evidence.json` record the new local automated baseline
    without changing external pending evidence to passed.
  - Evidence/handoff/closeout guards and `git diff --check` pass.
  - Commit and push the round record.
- Verification:
  - `scripts/check_mvp_regression.sh`: passed 5 enabled non-production steps.
    Backend `mvn -B test` passed 57 tests with 0 failures, 0 errors, and 0
    skipped. Admin-web `npm run lint`, `npm run test` (24 tests across 5
    files), `npm run build`, behavior wiring (97 checks), and external QA
    preflight (6 checks) passed. Miniapp smoke, behavior wiring (69 checks),
    user-flow replay (3 scenarios), payment-flow replay (5 scenarios),
    external preflight, appid guard, and subpage nav guard passed. Evidence
    ledger checks and deploy config static checks passed. Production checks
    were skipped by default.
- Outcome:
  - Current local automated MVP baseline is refreshed to `main` HEAD
    `7cc7e04`. MVP completion remains blocked by the same 32 required external
    evidence items: 8 launch evidence entries, 12 miniapp manual QA checks, and
    12 admin-web manual QA checks.

## Round 90: WeChat Payment LOB Schema Recovery

- Date: 2026-06-04
- Status: completed
- Focus: recover ECS-2 backend health after the corrected backend-only
  nonprod/mock deploy reached container recreation but failed Hibernate schema
  validation because WeChat payment LOB columns were created as `TEXT` while
  the JPA entities use `@Lob String`.
- Start evidence:
  - Local `main` had already committed and pushed Round 89 as `1747a6f`.
  - Push-triggered production run `26936286888` proved the deployment bundle and
    backend image artifact path with the new runtime overlay file, then failed
    before backend recreation at the expected production validation blocker:
    `WECHAT_PAY_MCH_ID is required`.
  - Manual backend-only `deployment_lane=nonprod-mock-payment` run
    `26936565663` proved the Round 89 overlay fix on ECS: `.env.prod` remained
    the base env, `.env.nonprod-mock.example` supplied only mock-payment
    overrides, MySQL app credential access passed, and backend deployment
    reached container recreation. The backend then failed startup with
    `Schema-validation: wrong column type ... decrypted_body ... found text ...
    expecting longtext`.
- Open-source reference check:
  - Task classification: common Flyway/Spring Boot/Hibernate schema migration
    repair.
  - Sources checked: Hibernate ORM User Guide for `@Lob`/materialized `String`
    LOB mapping, and Redgate/Flyway documentation for versioned SQL migrations.
  - License/compatibility: official documentation only; no external source code
    copied.
  - Selected approach: keep the existing JPA API and add a new Flyway V8 SQL
    migration that aligns all WeChat payment/refund/notify `@Lob String`
    columns to `LONGTEXT`.
  - Rejected options: editing already-applied V7, weakening production schema
    validation, removing `@Lob`, or fixing only `decrypted_body` and waiting for
    the next column mismatch.
- Risks:
  - This round included an ECS MySQL schema mutation to restore service before
    committing the equivalent migration. The operation changed only WeChat
    payment audit/snapshot text columns from `TEXT` to `LONGTEXT`.
  - Current-branch deployment evidence is still reduced-scope: payment remains
    mock/nonprod because real WeChat Pay private key/config is incomplete.
  - Pushing a backend migration to `main` can trigger the production lane, which
    is still expected to fail real payment validation until payment variables
    and key files are provisioned.
- Acceptance criteria:
  - ECS-2 backend is restored healthy without printing secrets.
  - Public production smoke and backend 8080 exposure checks pass after
    recovery.
  - A committed V8 Flyway migration makes the schema repair durable for future
    deploys/new databases.
  - A lightweight static guard covers the expected WeChat LOB columns.
  - Backend tests and focused deployment/evidence checks pass; docs are updated
    and the round is committed/pushed.
- Execution:
  - On ECS-2 MySQL, altered
    `wechat_payment_orders.request_snapshot/response_snapshot`,
    `wechat_refund_orders.request_snapshot/response_snapshot`, and
    `wechat_notify_events.raw_headers/raw_body/decrypted_body` to `LONGTEXT`.
  - Restarted backend through `scripts/deploy_backend.sh`; it completed
    successfully and the backend became healthy.
  - Confirmed ECS MySQL reports all seven affected columns as `longtext`.
  - Added `V8__align_wechat_lob_columns.sql` with the same column changes.
  - Added `scripts/check_wechat_payment_lob_migration.js` and wired it into
    `scripts/check_deploy_config.sh`.
- Verification:
  - `RUN_INTERNAL=1 scripts/check_production_smoke.sh`: passed 7 checks, 0
    warnings after recovery.
  - `RUN_INTERNAL=1 scripts/check_backend_8080_exposure.sh`: passed 5 checks, 0
    warnings; public backend 8080 remained unusable and ECS-1 private upstream
    worked.
  - `node scripts/check_wechat_payment_lob_migration.js`: passed for 7 expected
    WeChat payment/refund/notify LOB columns.
  - `scripts/check_deploy_config.sh`: passed, including the new LOB migration
    guard.
  - `cd sunflower-backend && mvn -B test`: passed, 57 tests, 0 failures, 0
    errors, 0 skipped. The first attempt failed because H2 did not accept
    multiple `MODIFY` clauses in one `ALTER TABLE`; V8 was changed to one
    column per statement and the suite then passed.
  - `node scripts/check_mvp_launch_evidence.js`,
    `node scripts/check_mvp_handoff_packet.js`,
    `node scripts/check_mvp_next_approval_request.js`, and
    `node scripts/check_mvp_closeout_readiness.js`: passed/non-strict, with the
    expected 32 unresolved required closeout items still listed.
  - `git diff --check`: passed.
  - After commit/push, production-lane workflow run `26937269296` for
    `f9ac47c` passed detect-targets, deployment bundle packaging, backend
    Docker build/GHCR push/image artifact export/upload, ECS-2 deployment
    bundle download/extract/sync, backend image artifact download/load, and
    image availability. It then failed before backend recreation at the
    expected production validation blocker: `WECHAT_PAY_MCH_ID is required`.
- Outcome:
  - Backend service was restored and the schema drift now has a durable Flyway
    migration. Current MVP completion remains blocked by real payment config,
    HTTPS legal domain, current-branch deployment evidence, and strict
    miniapp/admin manual QA evidence.

## Round 91: Backend Current-Branch Nonprod Deploy Evidence

- Date: 2026-06-08
- Status: completed
- Focus: prove the V8-fixed current `main` can deploy backend through the
  approved backend-only `deployment_lane=nonprod-mock-payment` GitHub Actions
  path, then record post-deploy smoke without claiming real payment readiness.
- Start evidence:
  - Local `main` and `origin/main` were aligned at `b908625`.
  - Worktree initially contained uncommitted Codeup/Yunxiao migration-plan
    docs/scripts. These were verified with
    `node scripts/check_codeup_yunxiao_migration_plan.js`,
    `scripts/check_deploy_config.sh`, and `git diff --check`, then committed
    and pushed as `d10d11e`.
  - The docs/scripts-only push did not create a new `deploy-backend.yml` run.
  - Strict `node scripts/check_nonprod_dispatch_readiness.js` passed on clean
    `main` HEAD `d10d11e`.
- Open-source reference check:
  - Task classification: operational deployment validation using existing
    repository workflow/scripts.
  - Sources checked: local workflow, `docs/CI-CD.md`, readiness guard,
    dispatch helper, and GitHub Actions run output.
  - License/compatibility: no external code or dependency reused.
  - Selected approach: execute the existing approved dispatch helper for
    `target=backend`, `deployment_lane=nonprod-mock-payment`, and `ref=main`.
  - Rejected options: production lane rerun before real WeChat Pay config,
    marking real payment/refund evidence passed, or refreshing admin-web/Nginx
    in this backend-only lane.
- Risks:
  - This lane mutates ECS-2 backend state and enables mock payment through the
    explicit runtime overlay; it is not production payment/refund evidence.
  - Admin-web and host Nginx are intentionally skipped.
  - Production payment config remains incomplete and strict payment readiness
    still reports 8 sanitized issues.
- Acceptance criteria:
  - Strict nonprod dispatch readiness passes on a clean `main`.
  - The workflow run succeeds through backend build, artifact transfer/load,
    nonprod/mock lane validation, backend recreation, and backend health wait.
  - Post-deploy production smoke and backend 8080 exposure checks pass.
  - Real payment readiness remains recorded as incomplete.
  - Update project/evidence docs, run focused checks, and commit/push the
    round record.
- Execution:
  - Triggered
    `CONFIRM_NONPROD_MOCK_DISPATCH=1 scripts/dispatch_nonprod_mock_payment_deploy.sh --execute --target backend --ref main`.
  - GitHub Actions run `27112433529` ran against HEAD `d10d11e`.
  - `detect-targets` passed, `package-deploy-bundle` passed, `build-backend`
    passed, and `build-admin-web` was skipped as expected.
  - ECS-2 `deploy-backend-host` passed deployment bundle download/extract/sync,
    backend image artifact download/load, image availability, nonprod/mock lane
    validation for `.env.prod + .env.nonprod-mock.example`, MySQL/backend
    recreation, backend health wait, and deploy completion.
- Verification:
  - `RUN_INTERNAL=1 scripts/check_production_smoke.sh`: passed 7 checks, 0
    warnings.
  - `RUN_INTERNAL=1 scripts/check_backend_8080_exposure.sh`: passed 5 checks, 0
    warnings; public backend 8080 remained unusable, ECS-1 private upstream
    worked, and ECS-2 backend 8080 remained bound to `172.25.121.83`.
  - `RUN_INTERNAL=1 scripts/check_backend_payment_config_readiness.sh`:
    completed in non-strict read-only mode with the known 8 real WeChat Pay
    production config issues.
- Outcome:
  - Current `main` backend has successful reduced-scope deploy evidence through
    the approved GitHub Actions nonprod/mock lane. MVP completion remains
    blocked by real WeChat Pay/refund config/evidence, HTTPS legal domain,
    miniapp real-device QA, admin manual QA, and full strict closeout evidence.

## Round 89: Nonprod Mock Env Overlay Credential Fix

- Date: 2026-06-04
- Status: completed
- Focus: fix the backend-only nonprod/mock deployment blocker from Round 88 by
  preserving ECS-owned `.env.prod` database/auth credentials and applying
  `.env.nonprod-mock.example` only as a mock-payment overlay.
- Start evidence:
  - Local `main` and `origin/main` are aligned at `b10316a`.
  - Worktree is clean.
  - Round 88 workflow run `26932183311` passed backend-only dispatch, backend
    build, artifact transfer/load, image availability, and the nonprod lane
    guard, then failed in `deploy_backend.sh` because MySQL app credentials
    from `.env.prod` could not access database `sunflower` as user
    `sunflower`.
  - Script inspection shows `execute_runner_deploy.sh` currently sets
    `PROD_ENV_FILE=.env.nonprod-mock.example` for the nonprod lane, so the
    bundled example file can replace ECS-local real DB credentials.
- Open-source reference check:
  - Task classification: common Docker Compose deployment configuration /
    env-file overlay handling.
  - Sources checked: Docker Compose official documentation for `env_file` and
    environment-variable precedence, plus repository-native deploy scripts and
    compose files.
  - License/compatibility: official documentation and local code only; no
    external code copied.
  - Selected approach: keep `.env.prod` as the required ECS-owned base env,
    add an optional runtime overlay env file loaded after the base and before
    release metadata, and make the nonprod/mock file contain only the payment
    mock lane overrides instead of DB/auth secrets.
  - Rejected options: copying real DB secrets into `.env.nonprod-mock.example`,
    recreating MySQL users from guessed credentials, or weakening the
    nonprod/mock guard to skip DB access.
- Risks:
  - Env-file precedence is security-sensitive: the overlay must not override
    database credentials, token secrets, real WeChat auth, or admin SMS config.
  - Deployment remains reduced-scope mock evidence even if this fix lets the
    lane deploy; real payment/refund, HTTPS legal domain, real-device miniapp
    QA, and admin QA remain pending.
  - A deployment-relevant script push to `main` can trigger the production
    lane; record the expected payment-config failure separately if it happens.
- Acceptance criteria:
  - Runtime env loading supports an optional overlay file.
  - Nonprod/mock dispatch validates `.env.prod` plus the overlay, while Docker
    Compose uses the same base-plus-overlay env order.
  - `.env.nonprod-mock.example` no longer carries MySQL/app auth/admin secrets.
  - Focused deploy config tests pass, including a guard proving nonprod overlay
    preserves base DB credentials.
  - Update project/deployment docs, commit, push, and observe any triggered
    workflow result if deployment-relevant paths trigger Actions.
- Execution:
  - Added `.env.runtime-overlay.empty` as the default no-op runtime overlay so
    compose can always render a stable three-file order.
  - Changed backend compose and runner deployment scripts so production keeps
    `PROD_ENV_FILE=.env.prod`, while the backend-only
    `nonprod-mock-payment` lane sets
    `RUNTIME_OVERLAY_ENV_FILE=.env.nonprod-mock.example`.
  - Narrowed `.env.nonprod-mock.example` to lane marker and mock payment
    overrides only; database credentials, token secrets, real WeChat auth, admin
    auth, and SMS variables remain owned by ECS `.env.prod`.
  - Preserved resolved base, overlay, and release env file paths while sourcing
    env contents so stale sample variables inside an env file cannot change the
    compose file list for the current run.
  - Updated workflow path detection, bundle packaging/sync, readiness guards,
    CI/CD docs, production deployment config docs, launch evidence, readiness,
    project state, and decision log.
- Verification:
  - `bash -n scripts/deploy_lib.sh scripts/execute_runner_deploy.sh scripts/check_nonprod_mock_payment_deploy_lane.sh scripts/test_execute_runner_deploy_release_env.sh scripts/deploy_backend.sh scripts/package_deploy_bundle.sh scripts/sync_deploy_bundle.sh`: passed.
  - `bash scripts/test_execute_runner_deploy_release_env.sh`: passed, including
    overlay preservation of base MySQL/auth credentials and env file paths.
  - `bash scripts/check_nonprod_mock_payment_deploy_lane.sh`: passed for
    `.env.prod.example + .env.nonprod-mock.example`.
  - `node scripts/check_workflow_dispatch_lane_matrix.js`: passed 12 checks.
  - `scripts/check_deploy_config.sh`: passed.
  - `docker compose -f docker-compose.backend.yml --env-file .env.prod.example config`: passed and rendered the default `.env.runtime-overlay.empty` order.
  - Deployment-path compose render after `load_runtime_envs` with
    `RUNTIME_OVERLAY_ENV_FILE=.env.nonprod-mock.example` preserved base
    `MYSQL_PASSWORD` and rendered `WECHAT_PAY_MOCK_ENABLED=true`.
  - `scripts/package_deploy_bundle.sh` bundle contents include
    `.env.runtime-overlay.empty`, `.env.nonprod-mock.example`,
    `docker-compose.backend.yml`, and the relevant deploy scripts.
- Outcome:
  - Local deploy configuration now fixes the committed overlay bug found in
    Round 88. Actual current-branch deployment remains unproven until a new
    backend-only `deployment_lane=nonprod-mock-payment` workflow run completes
    on ECS and post-deploy smoke is recorded.
- Next recommended round:
  - Commit and push this deployment-relevant fix, observe the push-triggered
    production-lane result separately, then run the explicit backend-only
    nonprod/mock dispatch to validate ECS deployment with the corrected overlay
    semantics.

## Round 88: Backend Nonprod Mock Deployment Evidence

- Date: 2026-06-04
- Status: completed
- Focus: run the approved backend-only `deployment_lane=nonprod-mock-payment`
  workflow path on current `main` after Round 87 proved the Docker CLI build
  path, then record whether it can deploy backend and support reduced-scope
  smoke evidence without claiming real payment readiness.
- Start evidence:
  - Local `main` and `origin/main` are aligned at `1595345`.
  - Worktree is clean.
  - Latest push workflow run `26931880619` proved backend/admin image build,
    GHCR push, image artifact export/upload, ECS backend bundle download/sync,
    backend image artifact download/load, and local backend image availability.
    It then failed only in the production lane with sanitized validation error
    `WECHAT_PAY_MCH_ID is required`.
  - `docs/Project-State.md`, `docs/CI-CD.md`, and
    `scripts/dispatch_nonprod_mock_payment_deploy.sh` define the reduced-scope
    lane: backend-only, no admin-web/Nginx refresh, mock payment only, real
    WeChat auth preserved, and not real payment/refund evidence.
- Open-source reference check:
  - Task classification: operational deployment validation using
    repository-native workflow and scripts.
  - Sources checked: repository deployment workflow, dispatch helper,
    readiness guard, CI/CD doc, project state, and launch evidence ledger.
  - License/compatibility: no external code or dependency reuse.
  - Selected approach: run the strict local nonprod dispatch readiness guard,
    execute the existing dispatch helper with the required confirmation env,
    observe the GitHub Actions run to completion, then record sanitized
    evidence.
  - Rejected options: production push/deploy without real payment config,
    marking real payment/refund evidence passed, or changing the deploy lane
    in the same round.
- Risks:
  - This dispatch mutates ECS-2 backend deployment state and may temporarily
    run backend with mock payment configuration; it intentionally does not
    refresh admin-web or Nginx.
  - If ECS artifact/API downloads or runner local deploy steps fail, the result
    should stay as diagnostic evidence rather than MVP completion.
  - Passing this lane still leaves HTTPS legal domain, real device miniapp QA,
    real payment/refund, admin manual QA, and production payment config pending.
- Acceptance criteria:
  - Strict nonprod dispatch readiness and dry-run helper pass on clean `main`.
  - Execute `workflow_dispatch` with `deployment_lane=nonprod-mock-payment`,
    `target=backend`, and `run_seed=false`.
  - Observe the GitHub Actions run to completion and capture sanitized outcome.
  - If backend deploy succeeds, run relevant read-only smoke/8080 checks that
    fit the lane; otherwise capture the exact failed stage.
  - Update launch evidence/readiness/project state/progress docs, run focused
    evidence checks, commit, and push the docs-only record.
- Execution:
  - First strict readiness attempt failed because this Round 88 analysis entry
    made the worktree dirty. Committed the analysis-only docs update as
    `d5b9be1` and pushed it; docs-only push did not trigger the deploy
    workflow.
  - A second strict readiness attempt exposed a real evidence wording drift:
    `CURRENT-BRANCH-DEPLOYED.nextAction` did not explicitly mention approval
    before `push` / `merge` / `workflow_dispatch`. Updated the launch evidence
    ledger, committed `1c75671`, and pushed it; docs-only push did not trigger
    the deploy workflow.
  - Strict `node scripts/check_nonprod_dispatch_readiness.js` passed 6 checks
    on clean `main` HEAD `1c75671`.
  - `scripts/dispatch_nonprod_mock_payment_deploy.sh --dry-run --target backend
    --ref main` passed and printed the backend-only
    `deployment_lane=nonprod-mock-payment` command.
  - Executed the helper with
    `CONFIRM_NONPROD_MOCK_DISPATCH=1 ... --execute --target backend --ref
    main`, triggering workflow run `26932183311`.
- Verification:
  - Workflow run `26932183311` behavior:
    - `detect-targets` passed and resolved backend-only nonprod/mock dispatch.
    - `package-deploy-bundle` passed.
    - `build-backend` passed: build, GHCR push, image artifact export/upload.
    - `build-admin-web` was skipped as expected.
    - `deploy-backend-host` passed deployment bundle download/extract/sync,
      backend image artifact download/load, and image availability check.
    - The runner deploy step passed
      `scripts/check_nonprod_mock_payment_deploy_lane.sh`, then failed in
      `deploy_backend.sh` after MySQL recreate because the MySQL app
      credentials from `.env.prod` could not access database `sunflower` as
      user `sunflower`.
  - Post-failure read-only checks:
    - `RUN_INTERNAL=1 scripts/check_production_smoke.sh`: passed 7 checks, 0
      warnings. Public API/admin and ECS internal backend/mysql health remained
      usable.
    - `RUN_INTERNAL=1 scripts/check_backend_8080_exposure.sh`: passed 5 checks,
      0 warnings. Backend 8080 remained bound to `172.25.121.83`, not public.
    - `RUN_INTERNAL=1 scripts/check_backend_payment_config_readiness.sh`:
      completed with the known 8 real WeChat Pay config issues.
- Goal correction:
  - The current branch still is not deployed through the approved path because
    backend container recreation did not complete and post-deploy smoke did not
    run. This run is useful reduced-scope diagnostic evidence only.
  - The next deployment blocker is no longer Buildx, checkout, artifact
    download, or production payment validation for this lane; it is ECS-2 MySQL
    app credential alignment for the existing persisted `sunflower` database.
- Next recommended round:
  - Diagnose ECS-2 MySQL credential drift without printing secrets: compare
    non-secret `.env.prod` variable presence, `.env.nonprod-mock.example`
    overlay behavior, persisted MySQL users, and deployment script assumptions.
    Prefer a fix that preserves real DB credentials from ECS `.env.prod` while
    overlaying only the nonprod/mock payment lane variables, then rerun the
    backend-only nonprod/mock dispatch.

## Round 87: GitHub Actions Docker Build Path Hardening

- Date: 2026-06-04
- Status: completed
- Focus: remove the workflow dependency on `docker/setup-buildx-action` /
  `docker/build-push-action` for backend/admin image builds so a transient
  Docker Hub `moby/buildkit:buildx-stable-1` pull failure does not block image
  build before ECS deploy.
- Start evidence:
  - Local `main` and `origin/main` are aligned at `5a185bd`.
  - Round 83 workflow run `26804961943` failed in `build-backend` while the
    GitHub hosted runner tried to pull the BuildKit helper image from Docker
    Hub; backend image build, ECS deploy, and smoke did not run.
  - `sunflower-backend/Dockerfile` and `sunflower-admin-web/Dockerfile` are
    ordinary multi-stage Dockerfiles and do not require Buildx-only features.
- Open-source reference check:
  - Task classification: common CI/CD Docker image build/push hardening.
  - Sources checked: Docker official CLI references for `docker build`,
    `docker push`, and `docker image save`, plus GitHub Actions/Docker official
    examples for authenticated registry builds.
  - License/compatibility: official documentation only; no external code
    copied.
  - Selected approach: keep GHCR login and existing image/artifact topology,
    but use plain Docker CLI build, push, and save steps in the GitHub hosted
    runner. Add a local static workflow guard so the Buildx action path is not
    reintroduced accidentally.
  - Rejected options: adding a paid external builder, changing the ECS deploy
    topology in the same round, or mirroring BuildKit/base images before first
    removing the direct Buildx helper-image dependency.
- Risks:
  - Plain Docker CLI builds may be slower because the previous GHA cache wiring
    is removed.
  - The runner still depends on Docker Hub for base images (`maven`, Temurin,
    Node, Nginx), so this mitigates the observed BuildKit helper-image failure
    but does not eliminate every external registry risk.
  - Pushing a workflow change on `main` matches the deploy workflow path
    trigger; because the user allowed code merge/push and there is no
    production environment, this round may trigger a production-lane workflow
    that should be treated as deployment evidence only if it actually passes
    the relevant steps.
- Acceptance criteria:
  - Backend/admin build jobs use `docker build`, `docker push`, and local
    `docker save` without `setup-buildx-action` or `build-push-action`.
  - Static workflow guard fails if Buildx actions are reintroduced.
  - Update CI/CD, project state, and decision docs with the narrowed risk.
  - Run focused workflow/document validation, commit once, push, and record the
    triggered workflow outcome or current status.
- Execution:
  - Replaced backend/admin image tag output with explicit `primary_tag` and
    optional `latest_tag` outputs.
  - Removed `docker/setup-buildx-action@v3`,
    `docker/build-push-action@v6`, Buildx/GHA cache wiring, and redundant
    post-push `docker pull` artifact-packaging steps.
  - Added plain Docker CLI build/push steps for backend and admin-web, then
    kept the existing local `docker save | gzip` artifact upload path.
  - Extended `scripts/check_workflow_dispatch_lane_matrix.js` so deploy config
    validation fails if the Buildx action path is reintroduced and confirms the
    Docker CLI build/push/save snippets exist.
  - Updated `docs/CI-CD.md`, `docs/Project-State.md`,
    `docs/Decision-Log.md`, `docs/MVP-Readiness.md`, and
    `docs/MVP-Launch-Evidence.json` with the narrowed deployment risk.
- Verification:
  - `ruby -e 'require "yaml"; YAML.load_file(".github/workflows/deploy-backend.yml")'`:
    passed.
  - `node scripts/check_workflow_dispatch_lane_matrix.js`: passed 12 checks.
  - `scripts/check_deploy_config.sh`: passed, including the workflow lane
    matrix and nonprod dispatch readiness checks.
  - `node scripts/check_mvp_launch_evidence.js`: passed with the expected 5
    passed and 8 pending required launch evidence entries.
  - `node scripts/check_mvp_handoff_packet.js`: passed.
  - `node scripts/check_mvp_next_approval_request.js`: passed.
  - `node scripts/check_mvp_external_approval_packet.js`: passed.
  - `node scripts/check_mvp_closeout_readiness.js`: passed in non-strict mode
    and still reports the expected 32 unresolved external/manual evidence
    items.
  - `git diff --check`: passed.
  - After pushing `7993721` to `main`, workflow run `26931880619` proved the
    hardened Docker CLI path through backend/admin image build, GHCR push,
    local image artifact export/upload, ECS deployment bundle download/sync,
    backend image artifact download/load, and backend image availability check.
    The run then failed at `Deploy backend host locally` in the production lane
    with sanitized validation error `WECHAT_PAY_MCH_ID is required`; backend
    container recreation and smoke did not run.
- Goal correction:
  - The BuildKit helper-image blocker is mitigated, but current-branch
    deployment remains pending until a new workflow run reaches deploy/smoke.
    Real payment, HTTPS legal-domain, real-device miniapp, and admin QA
    evidence remain outside this round.
- Next recommended round:
  - After this commit is pushed, inspect the triggered push workflow. If it
    still fails before deploy, use the failure point to decide between another
    targeted CI hardening pass or the documented Alibaba Cloud-side free
    artifact fallback. If it reaches production env validation, use the
    explicit backend-only `deployment_lane=nonprod-mock-payment` dispatch for
    reduced-scope smoke until real WeChat Pay config is available.

## Round 86: Current Main Local Regression Refresh

- Date: 2026-06-04
- Status: completed
- Focus: refresh the local automated MVP regression baseline on current
  `main` HEAD after the recent deployment/Codeup documentation rounds, without
  touching production or external services.
- Start evidence:
  - Local `main` and `origin/main` are aligned at `158d894`.
  - `docs/Project-State.md` still records the latest default aggregate local
    regression from Round 71 on older HEAD `2af1ed43`.
  - Strict closeout remains incomplete because external/manual evidence is
    still pending; this round only refreshes local automated evidence.
- Open-source reference check:
  - Task classification: validation/documentation refresh only.
  - Sources checked: repository-native regression scripts and active docs.
  - License/compatibility: no external code or dependency reuse.
  - Selected approach: run `scripts/check_mvp_regression.sh` in default
    non-production mode, then update the compact state/readiness docs with the
    actual result.
  - Rejected options: running production smoke without a specific deployment
    lane decision, marking external/manual evidence complete, or changing code
    to make unrelated checks pass.
- Risks:
  - The aggregate regression can take several minutes because it includes
    backend Maven tests and admin-web lint/test/build.
  - Passing local automation does not prove WeChat real-device flows, real
    payment/refund, HTTPS legal domain, current-branch deployment, or admin
    production QA.
- Acceptance criteria:
  - Run `scripts/check_mvp_regression.sh` on clean current `main`.
  - Record pass/fail details in `docs/Project-State.md`,
    `docs/MVP-Readiness.md`, and this progress entry.
  - Run focused document/evidence checks and `git diff --check`.
  - Commit and push the documentation update once.
- Execution:
  - First `scripts/check_mvp_regression.sh` run: backend tests passed
    (57 tests, 0 failures/errors/skips), admin-web lint/test/build passed
    (24 Vitest tests), miniapp smoke/replay checks passed, and evidence checks
    passed. The run failed at deploy config static checks because
    `CURRENT-BRANCH-DEPLOYED.nextAction` did not include the explicit
    `workflow_dispatch` / `non-production/mock-payment` wording required by
    `scripts/check_nonprod_dispatch_readiness.js`.
  - Updated only `docs/MVP-Launch-Evidence.json` next-action wording for
    `CURRENT-BRANCH-DEPLOYED`; status remains `pending`.
  - Second full `scripts/check_mvp_regression.sh` run: passed all 5 enabled
    default non-production steps.
- Verification:
  - Backend: `mvn -B test` passed with 57 tests, 0 failures, 0 errors, 0
    skipped.
  - Admin web: `npm run lint`, `npm run test` (24 tests across 5 files),
    `npm run build`, behavior wiring (97 checks), and external QA preflight
    (6 checks) passed.
  - Miniapp: smoke, behavior wiring (69 checks), user-flow replay
    (3 scenarios), payment-flow replay (5 scenarios), external preflight,
    appid guard, and subpage nav guard passed. Warnings remain for bare HTTP
    default API base and missing local `project.private.config.json`, both
    expected until real preview/HTTPS evidence.
  - Evidence/deploy config: non-strict launch/manual QA/closeout checks passed
    with the expected 32 unresolved external/manual evidence items; deploy
    config static checks passed. Production checks were skipped by default.
- Change summary:
  - Updated `docs/MVP-Launch-Evidence.json` automatic evidence entries and the
    current-branch deployment next-action wording.
  - Refreshed `docs/Project-State.md` and `docs/MVP-Readiness.md` to make
    Round 86 / HEAD `158d894` the latest local automated baseline.
- Goal correction:
  - The active MVP goal remains incomplete. Local automation is green, but
    current-branch deployment, HTTPS legal domain, real miniapp preview/device
    evidence, real payment/refund evidence, and admin production/staging manual
    QA remain pending.
- Next recommended round:
  - Pick one external evidence lane instead of rerunning local-only checks:
    either provision/approve a deploy lane for current-branch smoke, or collect
    sanitized miniapp/admin manual QA evidence against an approved environment.

## Round 84: No-New-Paid-Service Deploy Fallback Research

- Date: 2026-06-02
- Status: completed
- Focus: answer the user request for a replacement deployment approach if the
  GitHub Actions to Alibaba Cloud ECS network path remains unstable, without
  adding any extra paid service.
- Start evidence:
  - Local `main` and `origin/main` are aligned at `b10bb7e`.
  - Round 82 already removed ECS self-hosted `actions/checkout` from the deploy
    bundle path by using workflow artifacts.
  - Round 83 nonprod/mock workflow dispatch run `26804961943` failed before
    ECS deploy: backend image build reached GitHub hosted runner Docker Buildx
    setup, then timed out pulling `moby/buildkit:buildx-stable-1` from Docker
    Hub (`registry-1.docker.io`). The backend image was not built, so ECS
    deploy and smoke did not run.
- Open-source reference check:
  - Task classification: common CI/CD deployment architecture and cloud
    artifact delivery fallback.
  - Sources checked: GitHub self-hosted runner network and workflow artifact
    documentation, GitHub Actions `workflow_dispatch`/artifact behavior already
    used by this repository, Alibaba Cloud Container Registry personal-edition
    documentation, Alibaba Cloud ECS/ACR deployment patterns, and WeChat
    miniapp HTTPS domain requirements for the related domain/certificate todo.
  - License/compatibility: official documentation and repository-native
    scripts only; no external code copied.
  - Selected approach: keep GitHub Actions as the source verification/build
    orchestrator where it is stable, but make the fallback deployment path
    consume artifacts from Alibaba Cloud-side resources: push Docker images to
    Alibaba Cloud Container Registry Personal Edition or save/load image
    archives from an ECS-local artifact directory, and have ECS pull/deploy
    over Alibaba Cloud network rather than downloading GitHub workflow
    artifacts during the cutover.
  - Rejected options: adding a paid deployment service, depending on direct
    GitHub-hosted SSH into ECS, treating the current GitHub artifact path as
    sufficient if artifact/API downloads also become unstable, or weakening real
    payment/HTTPS launch requirements.
- Risks:
  - Alibaba Cloud Container Registry Personal Edition must be verified for the
    account's free quota, region, namespace, credential model, and private
    access behavior before implementation.
  - If builds remain on GitHub hosted runners, external registry availability
    can still affect image build unless base/BuildKit images are mirrored or a
    pre-warmed builder path is used.
  - A local/ECS build fallback avoids GitHub-to-ECS deployment transfer but
    increases operational responsibility on the ECS host and still needs source
    delivery or a signed source bundle.
  - Any fallback deployment remains mock/nonprod until real WeChat Pay keys,
    HTTPS domain, and smoke evidence are completed.
- Acceptance criteria:
  - Record the observed `26804961943` failure cause.
  - Add a durable no-new-paid-service fallback recommendation to
    `Project-State`, `CI-CD`, `Decision-Log`, `MVP-Readiness`, and the launch
    evidence ledger.
  - Run documentation/evidence validation and commit once.
- Change summary:
  - Recorded Round 83 workflow run `26804961943` as a GitHub hosted runner to
    Docker Hub/BuildKit timeout before backend image build, with no ECS deploy
    or smoke evidence.
  - Added the no-new-paid-service fallback to `docs/CI-CD.md`: prefer Alibaba
    Cloud-side image pull via ACR Personal Edition or existing free registry
    quota, with an ECS-local signed artifact directory as a manual backup.
  - Added the durable decision to `docs/Decision-Log.md`.
  - Updated `docs/Project-State.md`, `docs/MVP-Readiness.md`, and
    `docs/MVP-Launch-Evidence.json` so current-branch deployment remains
    pending and the fallback is visible to the next operator.
- Verification:
  - `node scripts/check_mvp_launch_evidence.js`: passed; required evidence is
    still 5 passed, 8 pending.
  - `node scripts/check_mvp_handoff_packet.js`: passed.
  - `node scripts/check_mvp_next_approval_request.js`: passed.
  - `node scripts/check_mvp_external_approval_packet.js`: passed.
  - `node scripts/check_mvp_closeout_readiness.js`: passed in non-strict mode
    and still reports the expected 32 unresolved external/manual evidence
    items.
  - `git diff --check`: passed.
- Next recommended round:
  - Implement one concrete build/deploy hardening lane: either retry nonprod
    mock dispatch after BuildKit/Docker Hub mitigation, or add an ACR/ECS-local
    artifact fallback script path and validate it without treating mock payment
    as production launch evidence.

## Round 85: Codeup SSH And Yunxiao Pipeline Feasibility

- Date: 2026-06-04
- Status: completed
- Focus: verify whether the Alibaba Cloud ECS clone can use local
  `~/.ssh/id_ed25519` to access the Codeup repository
  `git@codeup.aliyun.com:6a1e70a56ca3fad97ed1fbab/xiangrikui/sunflower.git`,
  and clarify whether creating an Alibaba Cloud Yunxiao pipeline needs an API
  key/token.
- Start evidence:
  - Local `main` and `origin/main` are aligned at `3b7d1f4`.
  - User reported that a GitHub repository clone exists on Alibaba Cloud and
    asked whether Codeup SSH access and Yunxiao pipeline creation can use local
    SSH keys or require Alibaba Cloud credentials.
- Open-source reference check:
  - Task classification: common CI/CD/source-control integration and cloud
    pipeline setup.
  - Sources checked: Alibaba Cloud official Codeup SSH key documentation,
    Codeup host fingerprint documentation, Yunxiao `CreatePipeline` OpenAPI
    documentation, Yunxiao pipeline API index, and repository-native deployment
    docs.
  - License/compatibility: official documentation and read-only ECS inspection
    only; no external code copied.
  - Selected approach: perform read-only ECS checks for existing private keys,
    cloned repository remotes, and Codeup SSH readiness; do not upload keys,
    create pipelines, or write cloud resources without explicit credentials and
    approval.
  - Rejected options: copying a personal private key to ECS, creating a pipeline
    from guessed credentials, or treating GitHub HTTPS clone access as proof of
    Codeup SSH access.
- Findings:
  - ECS-2 `/opt/sunflower` exists and is owned by root, but it is detached HEAD
    with `origin` set to `https://github.com/vutrungduy33/sunflower.git`.
  - ECS-1 and ECS-2 common user homes do not currently contain
    `~/.ssh/id_ed25519`; ECS-2 root home also lacks `/root/.ssh/id_ed25519`.
  - Because the private key is absent on ECS, Codeup SSH authentication with
    `~/.ssh/id_ed25519` cannot be proven from the current ECS state.
  - Codeup SSH requires the corresponding public key to be uploaded to the
    Yunxiao/Codeup account. Pipeline creation through Yunxiao OpenAPI requires
    a Yunxiao personal access token (`x-yunxiao-token`) for the OAPI endpoint,
    while broader Alibaba Cloud OpenAPI/SDK access can require AccessKey-based
    authentication depending on the API family used. Manual console creation
    requires logged-in Yunxiao permissions rather than an API key.
- Risks:
  - Do not commit or paste private keys. Prefer generating a dedicated deploy
    key/service key for Codeup or configuring a Yunxiao service connection.
  - A pipeline source that points to Codeup usually needs a service connection
    or authorized repository binding; an ECS host private key is not a
    substitute for Yunxiao pipeline API authentication.
  - Existing ECS clone is not yet the Codeup remote and should not be used as
    evidence that Codeup mirror/deploy is ready.
- Verification:
  - Read-only SSH inspection of ECS-2 `47.120.42.15`: `/root/.ssh/id_ed25519`
    and `/home/chenyao/.ssh/id_ed25519` are missing.
  - Read-only SSH inspection of ECS-1 `47.113.223.248`: common
    `id_ed25519` locations are missing.
  - Read-only repository scan found ECS-2 `/opt/sunflower`; `git remote -v`
    reports GitHub HTTPS origin, not Codeup SSH.
- Next recommended round:
  - Choose one credential path: upload a dedicated Codeup public key and place
    the matching private key only where needed for read-only mirror testing, or
    create a Yunxiao service connection/PAT and build a pipeline through the
    console/OpenAPI. Record credential ownership without storing secrets.

## Round 83: Backend Nonprod Mock Deploy Smoke

- Date: 2026-06-02
- Status: completed
- Focus: use the explicit backend-only `deployment_lane=nonprod-mock-payment`
  workflow dispatch to collect reduced-scope cloud deployment evidence after
  the artifact-based deploy bundle path removed the ECS checkout blocker.
- Start evidence:
  - Local `main` and `origin/main` are aligned at `c11e293`.
  - Production-lane run `26803892859` for HEAD `86b4cc2` proved bundle/image
    artifact download and load on ECS-2, then failed at production env
    validation because `WECHAT_PAY_MCH_ID` is missing.
  - User has stated there is no production environment, code merge/push is
    allowed, and payment can be mocked/bypassed with documentation.
- Open-source reference check:
  - Task classification: common GitHub Actions manual workflow dispatch and
    smoke evidence collection.
  - Sources checked: GitHub Actions official `workflow_dispatch` guidance and
    the repository-native dispatch helper/guards.
  - License/compatibility: official documentation and local code only; no
    external code copied.
  - Selected approach: run the existing readiness guard and helper, execute
    only `deployment_lane=nonprod-mock-payment` with `target=backend`, then
    observe GitHub Actions and run read-only smoke checks if deployment reaches
    backend recreation.
  - Rejected options: weakening production env validation or treating mock
    payment as real payment/refund evidence.
- Risks:
  - The lane is backend-only and mock-payment; it does not refresh admin-web or
    Nginx and cannot satisfy real payment/refund evidence.
  - ECS still needs GitHub artifact/API connectivity for image artifact
    download.
  - If deployment succeeds, smoke evidence is reduced-scope and must remain
    labeled as nonprod/mock.
- Acceptance criteria:
  - Run strict local nonprod dispatch readiness and helper dry-run on a clean
    worktree.
  - Execute the backend-only nonprod/mock workflow dispatch.
  - Observe the resulting run and record whether it reaches backend deploy and
    smoke checks.
  - Update Project-State, launch evidence, and progress docs; run relevant
    evidence/deploy checks; commit once.
- Execution and result:
  - `node scripts/check_nonprod_dispatch_readiness.js`: passed on clean
    `main` HEAD `b10bb7e`.
  - `scripts/dispatch_nonprod_mock_payment_deploy.sh --dry-run`: passed and
    printed the fixed backend-only nonprod/mock dispatch command.
  - `CONFIRM_NONPROD_MOCK_DISPATCH=1
    scripts/dispatch_nonprod_mock_payment_deploy.sh --execute`: dispatched
    workflow run `26804961943` for HEAD `b10bb7e`.
  - Run `26804961943`: `detect-targets` and `package-deploy-bundle` passed;
    `build-admin-web` was skipped as expected for backend-only nonprod/mock.
    `build-backend` failed at `Set up Docker Buildx` because the GitHub hosted
    runner timed out pulling `moby/buildkit:buildx-stable-1` from Docker Hub
    (`registry-1.docker.io`). Backend image build, ECS deploy, and smoke did
    not run.
- Completion note:
  - The nonprod/mock deployment path remains unproven for HEAD `b10bb7e`.
    This failure is a GitHub hosted runner to Docker Hub/registry availability
    issue, not an ECS deploy-stage checkout or artifact-download result.
- Next recommended round:
  - Either rerun the same nonprod/mock dispatch if treated as transient, or
    harden the build path by avoiding runtime BuildKit pulls from Docker Hub and
    move deploy artifacts/images to an Alibaba Cloud-side free artifact source
    if GitHub-to-ECS/artifact networking remains unreliable.

## Round 82: Artifact-Based Deployment Bundle

- Date: 2026-06-02
- Status: completed
- Focus: reduce ECS self-hosted runner dependency on repository checkout by
  packaging the deployment bundle on a GitHub-hosted runner and delivering it
  to ECS deploy jobs as a workflow artifact.
- Start evidence:
  - Local `main` and `origin/main` are aligned at `d3f8c0a`.
  - Round 80 live diagnostics showed current ECS-2 GitHub DNS/HTTPS/git checks
    passing, but runner `_diag` still recorded intermittent GitHub TLS/443
    failures during `actions/checkout`.
  - Round 81 selected artifact-based ECS deploy as the preferred no-new-paid
    service fallback if checkout instability persists.
- Open-source reference check:
  - Task classification: common GitHub Actions artifact-based deployment and
    self-hosted runner reliability improvement.
  - Sources checked: GitHub Actions official `upload-artifact` /
    `download-artifact` documentation and GitHub self-hosted runner
    troubleshooting guidance.
  - License/compatibility: official documentation only; no external code
    copied.
  - Selected approach: add a repository-native deployment bundle packaging
    script, upload the bundle from a GitHub-hosted job, and make ECS deploy
    jobs download/extract it before running existing deploy scripts.
  - Rejected options: adding a paid deployment service, weakening production
    payment validation, or continuing to rely on self-hosted `actions/checkout`
    for the deploy bundle.
- Risks:
  - ECS runners still need GitHub Actions artifact/API connectivity.
  - A workflow change pushed to `main` is deployment-relevant and may trigger
    the production lane; push should be handled deliberately.
  - This round changes deployment mechanics but does not prove a successful
    cloud deploy until a workflow run and smoke evidence are recorded.
- Acceptance criteria:
  - Add a reusable deployment bundle packaging script.
  - Update `.github/workflows/deploy-backend.yml` so ECS deploy jobs no longer
    use `actions/checkout` for bundle source.
  - Add a static guard that fails if self-hosted deploy checkout returns.
  - Update deployment docs/state and run focused workflow/deploy validation.
- Change summary:
  - Added `scripts/package_deploy_bundle.sh`.
  - Updated `scripts/sync_deploy_bundle.sh` to use the same packaging script as
    the workflow.
  - Added `package-deploy-bundle` to `.github/workflows/deploy-backend.yml`.
  - Replaced backend/web self-hosted deployment bundle checkout steps with
    `actions/download-artifact` plus local `tar` extraction.
  - Added workflow guards in `scripts/check_workflow_dispatch_lane_matrix.js`
    and `scripts/check_deployment_approval_preflight.js` so self-hosted bundle
    checkout does not silently return.
  - Updated `docs/Architecture.md`, `docs/CI-CD.md`,
    `docs/Context-Index.md`, and `docs/Project-State.md`.
- Verification:
  - `scripts/package_deploy_bundle.sh <tmp>.tar.gz` plus `tar -tzf` smoke:
    passed for expected bundle files.
  - `ruby -e 'require "yaml"; YAML.load_file(".github/workflows/deploy-backend.yml")'`:
    passed.
  - `bash -n scripts/package_deploy_bundle.sh scripts/sync_deploy_bundle.sh
    scripts/check_deploy_config.sh`: passed.
  - `node scripts/check_workflow_dispatch_lane_matrix.js`: passed with the new
    artifact bundle guard.
  - `scripts/check_deploy_config.sh`: passed, including workflow YAML,
    compose rendering, shell syntax, nonprod env check, runner release metadata
    guard, workflow lane matrix, nonprod readiness, dispatch helper dry-run,
    and Node.js syntax.
  - `node scripts/check_deployment_approval_preflight.js`: passed after the
    first commit on clean `main` HEAD `eef3bd7`; it predicted push-to-main
    deploy target `all`.
  - `git push origin main`: succeeded for `eef3bd7` and triggered workflow run
    `26803729808`.
  - GitHub Actions run `26803729808`: `detect-targets`, `package-deploy-bundle`,
    `build-admin-web`, and `build-backend` passed. On ECS-2,
    `Download backend deployment bundle artifact` and
    `Extract backend deployment bundle` passed, proving the deploy job no
    longer depends on ECS `actions/checkout` for bundle source.
  - The same run failed in `Synchronize backend deployment bundle` because
    `scripts/sync_deploy_bundle.sh` used an EXIT trap that referenced a local
    variable after return under `set -u`. This round fixed the trap to expand
    the temp path at trap definition time.
  - `bash scripts/sync_deploy_bundle.sh <tmp>` smoke after the trap fix:
    passed.
  - `git push origin main` for follow-up commit `86b4cc2`: succeeded and
    triggered workflow run `26803892859`.
  - GitHub Actions run `26803892859`: `detect-targets`,
    `package-deploy-bundle`, `build-admin-web`, and `build-backend` passed.
    ECS-2 `deploy-backend-host` passed deployment bundle artifact
    download/extract/sync, backend image artifact download/load, and backend
    image availability. It then failed at production `Deploy backend host
    locally` with sanitized validation error `WECHAT_PAY_MCH_ID is required`.
- Goal correction:
  - The active MVP goal remains incomplete. This round reduces deployment
    checkout risk but does not prove current-branch deployment, HTTPS domain,
    production smoke, or manual QA evidence.
- Next recommended round:
  - Choose the next deployment evidence lane: either provision real ECS-2
    WeChat Pay production config and rerun production deploy, or explicitly
    dispatch backend-only `deployment_lane=nonprod-mock-payment` and record it
    as reduced-scope mock evidence. Keep real payment/refund evidence pending.

## Round 73: Nonprod Dispatch Readiness Guard

- Date: 2026-06-02
- Status: completed
- Focus: add a single local preflight that answers whether it is safe to ask
  for backend-only nonprod/mock-payment manual dispatch approval while real
  payment private key/config remains incomplete.
- Start evidence:
  - Local `main` was clean and ahead of `origin/main` by 13 commits.
  - Round 72 refreshed approval docs, but operators still had to run several
    separate commands to know whether the nonprod dispatch request was ready.
  - No push, workflow dispatch, deployment, or ECS mutation was intended.
- Open-source reference check:
  - Task classification: common CI/CD manual deployment preflight and approval
    boundary.
  - Sources checked: GitHub Actions official workflow syntax,
    `workflow_dispatch` input documentation, and GitHub Actions deployment
    environments/protection documentation.
  - License/compatibility: official documentation only; no external code
    copied.
  - Selected approach: add a repository-native Node.js guard that checks the
    existing workflow lane, approval/handoff wording, evidence boundary, env
    template shape, and existing deployment guards. This preserves the current
    GitHub Actions design and avoids introducing a third-party runner or
    weakening production validation.
  - Rejected options: adding a new deployment dependency, using production lane
    while payment keys are missing, or marking mock payment as production
    payment evidence.
- Risks:
  - The guard proves local readiness to request/execute a backend-only nonprod
    dispatch; it does not perform the dispatch or prove cloud deployment.
  - During development, deploy config checks must allow a dirty worktree, while
    the actual approval preflight must require a clean worktree.
- Acceptance criteria:
  - Add `scripts/check_nonprod_dispatch_readiness.js`.
  - Require strict mode to run on clean local `main` before approval; allow
    `ALLOW_DIRTY=1` only for static deploy config validation.
  - Wire the guard into `scripts/check_deploy_config.sh`.
  - Update deployment docs/state/progress and run focused checks.
- Change summary:
  - Added `scripts/check_nonprod_dispatch_readiness.js`.
  - Wired it into `scripts/check_deploy_config.sh` with `ALLOW_DIRTY=1` for
    in-progress static validation.
  - Updated `docs/CI-CD.md`, `docs/Context-Index.md`, and
    `docs/Project-State.md` with the new command and its boundary.
  - Normalized approval wording so backend-only mock dispatch is consistently
    described as not real payment/refund evidence.
  - Updated handoff/approval packet guards so the new command remains listed
    in operator-facing deployment approval flows.
- Verification:
  - `ALLOW_DIRTY=1 node scripts/check_nonprod_dispatch_readiness.js`: passed
    during development with 6 checks.
  - `node scripts/check_mvp_handoff_packet.js`,
    `node scripts/check_mvp_next_approval_request.js`, and
    `node scripts/check_mvp_external_approval_packet.js`: passed with the new
    command coverage.
  - `scripts/check_deploy_config.sh`: passed, including workflow YAML, compose
    rendering, shell syntax, nonprod env check, runner release metadata guard,
    workflow lane matrix, nonprod dispatch readiness, and Node.js syntax.
  - `git diff --check`: passed.
- Goal correction:
  - The active MVP goal remains incomplete. This round improves deployment
    approval readiness but does not dispatch GitHub Actions, deploy current
    branch, prove HTTPS domain, or collect manual QA/payment/refund evidence.
- Next recommended round:
  - After commit, run `node scripts/check_nonprod_dispatch_readiness.js` in
    strict clean-worktree mode. With explicit user approval, then manually
    dispatch `target=auto/backend` plus `deployment_lane=nonprod-mock-payment`.

## Round 74: Nonprod Mock Dispatch Helper

- Date: 2026-06-02
- Status: completed
- Focus: add a default dry-run helper for the backend-only
  nonprod/mock-payment workflow dispatch path so operators do not hand-compose
  risky `gh workflow run` arguments while real payment private key/config is
  incomplete.
- Start evidence:
  - Local `main` is clean and ahead of `origin/main` by 14 commits.
  - Round 73 added a strict readiness guard, but the actual dispatch command
    still has to be assembled manually.
  - This round must not push, deploy, mutate ECS, or run real payment/refund.
- Open-source reference check:
  - Task classification: common CI/CD manual workflow dispatch helper.
  - Sources checked: GitHub Docs manual workflow run guidance and GitHub CLI
    `gh workflow run` manual.
  - License/compatibility: official documentation only; no external code
    copied.
  - Selected approach: keep the repository-native GitHub Actions workflow and
    add a small shell wrapper that defaults to dry-run, runs the existing
    readiness guard first, hard-codes the nonprod/mock-payment lane, and
    requires an explicit confirmation variable before executing.
  - Rejected options: pushing `main` into the production lane while payment
    config is incomplete, weakening production env validation, or introducing a
    third-party deployment dispatcher.
- Risks:
  - A successful helper dry-run proves only local readiness and command shape;
    it does not dispatch or prove cloud deployment.
  - If executed after approval, the lane is backend-only and mock-payment; it
    still cannot satisfy real payment/refund evidence or admin-web/Nginx
    refresh evidence.
- Acceptance criteria:
  - Add a helper that defaults to dry-run and prints the exact `gh workflow run`
    command for `deployment_lane=nonprod-mock-payment`.
  - Reject unsupported targets and require an explicit environment
    confirmation before real dispatch.
  - Wire the helper into deployment config checks and operator-facing docs.
  - Run focused validation and commit once.
- Change summary:
  - Added `scripts/dispatch_nonprod_mock_payment_deploy.sh`.
  - The helper runs `scripts/check_nonprod_dispatch_readiness.js`, hard-codes
    `deployment_lane=nonprod-mock-payment`, defaults to `target=backend`, and
    rejects unsupported targets.
  - Dry-run mode prints the exact `gh workflow run` command without triggering
    GitHub Actions. Execute mode additionally requires `--execute` and
    `CONFIRM_NONPROD_MOCK_DISPATCH=1`.
  - Wired the helper into `scripts/check_deploy_config.sh`,
    `docs/CI-CD.md`, `docs/Context-Index.md`, handoff/approval packets, and
    packet guard scripts.
- Verification:
  - `bash -n scripts/dispatch_nonprod_mock_payment_deploy.sh
    scripts/check_deploy_config.sh`: passed.
  - `ALLOW_DIRTY=1 scripts/dispatch_nonprod_mock_payment_deploy.sh --dry-run`:
    passed; it printed
    `gh workflow run deploy-backend.yml --ref main -f target=backend -f run_seed=false -f deployment_lane=nonprod-mock-payment`
    and did not trigger `workflow_dispatch`.
  - `scripts/check_deploy_config.sh`: passed, including workflow YAML, compose
    rendering, shell syntax, nonprod env check, runner release metadata guard,
    workflow lane matrix, nonprod readiness, helper dry-run, and Node.js
    syntax.
  - `node scripts/check_mvp_handoff_packet.js`,
    `node scripts/check_mvp_next_approval_request.js`,
    `node scripts/check_mvp_external_approval_packet.js`, and
    `node scripts/check_mvp_closeout_readiness.js`: passed in non-strict mode;
    closeout still reports 32 unresolved required items.
  - `git diff --check`: passed.
- Goal correction:
  - The active MVP goal remains incomplete. This round improves the approved
    nonprod/mock-payment dispatch handoff but does not push, dispatch, deploy,
    prove HTTPS domain, or collect real payment/refund/manual QA evidence.
- Next recommended round:
  - If approved for cloud validation, run the helper in strict clean mode and
    execute only the backend-only nonprod/mock-payment dispatch; then capture
    sanitized reduced-scope smoke evidence. Keep real payment/refund evidence
    pending until real credentials and explicit approval exist.

## Round 75: Push and Nonprod Mock Dispatch Attempt

- Date: 2026-06-02
- Status: completed
- Focus: move the current committed `main` branch to GitHub and attempt the
  explicitly approved backend-only nonprod/mock-payment workflow dispatch so
  current-branch deployability can be tested without real payment credentials.
- Start evidence:
  - Local `main` is clean and ahead of `origin/main` by 15 commits at HEAD
    `af3e8d0ceaf0`.
  - User previously approved code merge/push and said there is no production
    environment. User also confirmed real payment private key/config is not
    fully provisioned and mock/bypass is acceptable if recorded.
  - `gh version` is available locally, and `origin` points to
    `git@github.com:vutrungduy33/sunflower.git`.
- Open-source reference check:
  - Task classification: common GitHub Actions manual workflow dispatch and
    deployment operation.
  - Sources checked: GitHub Docs manual workflow run guidance and GitHub CLI
    `gh workflow run` manual.
  - License/compatibility: official documentation only; no external code
    copied.
  - Selected approach: push the current committed branch, then use the
    repository-native `scripts/dispatch_nonprod_mock_payment_deploy.sh` helper
    with `deployment_lane=nonprod-mock-payment`, preserving the production
    payment blocker rather than weakening production validation.
  - Rejected options: treating mock payment as real payment/refund evidence,
    pushing uncommitted changes, or manually assembling an ad hoc
    `workflow_dispatch` command.
- Risks:
  - Pushing `main` can trigger the production lane because the workflow has a
    push trigger. The user has explicitly allowed push/merge and said there is
    no production environment, but real payment config remains incomplete, so
    any production-lane run may fail env validation before backend recreation.
  - The nonprod/mock-payment dispatch is backend-only; it does not refresh
    admin-web or Nginx and cannot prove real payment/refund evidence.
- Acceptance criteria:
  - Re-run local deployment approval and nonprod readiness guards on a clean
    worktree.
  - Commit this pre-action plan.
  - Push local `main` to `origin/main`.
  - Execute only the backend-only nonprod/mock-payment dispatch helper if
    guards pass.
  - Record the actual run result or blocker in project state/progress and
    commit once more.
- Change summary:
  - Committed this pre-action plan as `025f60d`.
  - Pushed local `main` to `origin/main`, moving remote `main` from
    `d0af634314d0` to `025f60d0ce84`.
  - Executed
    `CONFIRM_NONPROD_MOCK_DISPATCH=1 scripts/dispatch_nonprod_mock_payment_deploy.sh --execute`.
  - Recorded the actual GitHub Actions outcomes without changing evidence
    statuses or treating mock payment as real payment/refund evidence.
- Verification and external run results:
  - `node scripts/check_deployment_approval_preflight.js`: passed before push
    on clean `main` HEAD `025f60d0ce84`; predicted push-to-main target `all`.
  - `node scripts/check_nonprod_dispatch_readiness.js`: passed before dispatch
    with 6 checks.
  - `scripts/dispatch_nonprod_mock_payment_deploy.sh --dry-run`: passed before
    execution and printed the fixed nonprod/mock command.
  - `git push origin main`: succeeded, updating `origin/main` to
    `025f60d0ce84`.
  - Push-triggered workflow run `26799767476`: completed as `cancelled` after
    successful `detect-targets`; `build-admin-web`, `build-backend`,
    `deploy-backend-host`, and `deploy-web-host` were cancelled.
  - Manual workflow run `26799773234`:
    `event=workflow_dispatch`, `headSha=025f60d0ce84`, and
    `deployment_lane=nonprod-mock-payment` via the dispatch helper. During the
    local observation window, `detect-targets` passed, `build-backend` passed,
    `build-admin-web` was skipped, and `deploy-backend-host` was still
    `in_progress` at `Checkout backend deployment bundle source`.
- Goal correction:
  - The active MVP goal remains incomplete. This round proves current commits
    were pushed and the backend image build/artifact path works for the
    explicit nonprod/mock lane, but it does not prove backend deployment,
    post-deploy smoke, real payment/refund, HTTPS domain, or manual QA.
- Next recommended round:
  - Re-check GitHub Actions run `26799773234`. If it completed successfully,
    run/read the appropriate smoke checks and record sanitized reduced-scope
    evidence. If it remains hung or fails in ECS-2 checkout, investigate the
    self-hosted runner checkout/network state before retrying deployment.

## Round 76: Self-Hosted Deploy Timeout Guard

- Date: 2026-06-02
- Status: completed
- Focus: prevent ECS self-hosted deploy jobs from hanging indefinitely in
  checkout/deploy steps so deployment failures become bounded, diagnosable, and
  handoff-ready.
- Start evidence:
  - Local `main` is clean and ahead of `origin/main` by 1 commit
    (`55ee305`) containing the Round 75 result record.
  - GitHub Actions run `26799773234` is still `in_progress` with
    `deploy-backend-host` stuck at `Checkout backend deployment bundle source`;
    `detect-targets` and `build-backend` already passed.
  - This repeats the class of ECS self-hosted runner checkout stall seen in the
    earlier deployment attempt, so waiting alone is not a useful MVP-closing
    action.
- Open-source reference check:
  - Task classification: common GitHub Actions self-hosted runner hardening and
    workflow timeout behavior.
  - Sources checked: GitHub Actions workflow syntax documentation for
    `timeout-minutes` and GitHub self-hosted runner troubleshooting guidance
    for inspecting runner diagnostic logs.
  - License/compatibility: official documentation only; no external code
    copied.
  - Selected approach: add explicit timeout bounds to the self-hosted checkout
    and local deploy steps in the existing workflow, preserving current
    deployment semantics while making runner stalls fail with actionable
    evidence.
  - Rejected options: retrying the same dispatch indefinitely, weakening deploy
    validation, or marking current-branch deployment passed from a stuck run.
- Risks:
  - The timeout guard does not fix the underlying ECS runner/network cause by
    itself; it makes the failure bounded and easier to diagnose.
  - Workflow changes on `main` can trigger production-lane path rules when
    pushed, so another push should be recorded as deployment-relevant.
- Acceptance criteria:
  - Add finite timeouts to self-hosted checkout and deploy steps for backend and
    web deploy jobs.
  - Update CI/CD/state/progress docs with the current run status and diagnostic
    boundary.
  - Run workflow YAML parsing, deploy config checks, packet/closeout guards,
    and commit once.
- Change summary:
  - Added `timeout-minutes: 8` to backend and web self-hosted deployment bundle
    checkout steps.
  - Added `timeout-minutes: 20` to backend and web local deploy steps.
  - Updated `docs/CI-CD.md` and `docs/Project-State.md` with the bounded-hang
    behavior and runner diagnostic boundary.
- Verification:
  - `scripts/check_deploy_config.sh`: passed, including workflow YAML parse,
    compose rendering, shell syntax, nonprod env check, runner release metadata
    guard, workflow lane matrix, nonprod readiness, helper dry-run, and Node.js
    syntax.
  - `node scripts/check_mvp_handoff_packet.js`,
    `node scripts/check_mvp_next_approval_request.js`,
    `node scripts/check_mvp_external_approval_packet.js`, and
    `node scripts/check_mvp_closeout_readiness.js`: passed in non-strict mode;
    closeout still reports 32 unresolved required items.
  - `git diff --check`: passed.
  - Post-observation update: GitHub Actions run `26799773234` later completed
    as `failure`. The backend deploy job failed in `actions/checkout` while
    `git fetch` accessed GitHub over HTTPS; the sanitized error class was TLS
    connection termination followed by a `github.com:443` connection timeout.
    Bundle sync, artifact download, image load, local deploy, and web deploy
    did not run.
- Goal correction:
  - The active MVP goal remains incomplete. This round does not deploy current
    branch or collect smoke/manual QA evidence; it prevents future self-hosted
    runner stalls from remaining unbounded.
- Next recommended round:
  - Push the timeout guard commit if deployment validation should continue,
    then inspect ECS runner `_diag/Worker_*.log`, runner process status,
    GitHub network access to `github.com:443`, disk space, and workspace
    permissions before retrying backend-only nonprod/mock lane.

## Round 77: Production-Lane Run Result Capture

- Date: 2026-06-02
- Status: completed
- Focus: capture the actual result of push-triggered GitHub Actions run
  `26800134363` after the timeout guard and distinguish infrastructure
  recovery from remaining payment configuration blockers.
- Start evidence:
  - Local `main` and `origin/main` are aligned at `e797423`.
  - Run `26800134363` was created by the push of Round 76 commits and uses the
    production lane because push-to-main always resolves to production.
  - The previous manual nonprod/mock run `26799773234` failed at ECS-2 checkout
    before bundle sync or deploy.
- Open-source reference check:
  - Task classification: repository-specific deployment result capture.
  - Sources checked: no new external implementation needed; the run result was
    read through GitHub CLI and the existing workflow/run documentation context
    from Rounds 75-76 still applies.
  - License/compatibility: no external code copied.
  - Selected approach: record the authoritative GitHub Actions run state and
    keep evidence status pending because the run failed before backend deploy.
  - Rejected options: treating successful build/artifact/load as production
    deployment, or weakening payment validation to make production lane pass.
- Risks:
  - The run is production-lane and still cannot pass without real payment
    configuration or an explicit nonprod/mock lane.
  - Successful checkout/artifact/load is useful infrastructure evidence but is
    not post-deploy smoke evidence.
- Acceptance criteria:
  - Query run `26800134363` and identify the first failing step.
  - Record whether ECS-2 checkout/network recovered.
  - Update project state/progress without marking MVP evidence passed.
  - Run focused documentation/evidence guards and commit once.
- Change summary:
  - Recorded that `detect-targets`, backend image build/artifact, admin-web
    image build/artifact, ECS-2 checkout, bundle sync, artifact download,
    docker load, and backend image availability check succeeded in run
    `26800134363`.
  - Recorded that `Deploy backend host locally` failed during production
    validation because `WECHAT_PAY_MCH_ID` is missing.
  - Kept current-branch deployment, production smoke, and real payment/refund
    evidence pending.
- Verification:
  - `gh run view 26800134363`: completed `failure`; first failed job was
    `deploy-backend-host`, first failed step was `Deploy backend host locally`.
  - Sanitized failed-step log summary: production lane called
    `scripts/execute_runner_deploy.sh` with `DEPLOY_TARGET=all` and
    `DEPLOYMENT_LANE=production`; validation failed because
    `WECHAT_PAY_MCH_ID` is missing.
  - `node scripts/check_mvp_handoff_packet.js`,
    `node scripts/check_mvp_next_approval_request.js`,
    `node scripts/check_mvp_external_approval_packet.js`, and
    `node scripts/check_mvp_closeout_readiness.js`: passed in non-strict mode;
    closeout still reports 32 unresolved required items.
  - `git diff --check`: passed.
- Goal correction:
  - The active MVP goal remains incomplete. This round proves the deployment
    runner can now pass checkout/artifact/docker-load for a production-lane run,
    but backend deployment is still blocked by missing real WeChat Pay config.
- Next recommended round:
  - Either provision real ECS-2 WeChat Pay production variables/key files and
    rerun production lane, or explicitly rerun backend-only
    `deployment_lane=nonprod-mock-payment` for reduced-scope backend deploy
    validation while keeping real payment/refund evidence pending.

## Round 78: Nonprod Mock Backend Deploy Retry

- Date: 2026-06-02
- Status: completed
- Focus: rerun the explicit backend-only nonprod/mock-payment deployment lane on
  current `main` after production-lane run `26800134363` proved ECS-2 checkout,
  bundle sync, artifact download, and docker load can succeed.
- Start evidence:
  - Local `main` and `origin/main` are aligned at `0c92385`.
  - `node scripts/check_nonprod_dispatch_readiness.js` passed with 6 checks.
  - `scripts/dispatch_nonprod_mock_payment_deploy.sh --dry-run` passed and
    printed the fixed backend-only nonprod/mock command.
  - Real WeChat Pay production config remains incomplete, so production lane is
    expected to fail validation before backend recreation.
- Open-source reference check:
  - Task classification: common GitHub Actions manual workflow dispatch.
  - Sources checked: official GitHub workflow dispatch and GitHub CLI
    `gh workflow run` documentation from prior deployment rounds; no new
    implementation reference was needed.
  - License/compatibility: official documentation only; no external code
    copied.
  - Selected approach: use the repository-native guarded dispatch helper with
    `deployment_lane=nonprod-mock-payment`, preserving production validation
    while collecting reduced-scope backend deploy evidence.
  - Rejected options: rerunning production lane without real payment config or
    treating mock payment as real payment/refund evidence.
- Risks:
  - The lane is backend-only and will not refresh admin-web or Nginx.
  - Even if deploy succeeds, it is reduced-scope mock evidence and cannot close
    real payment/refund or full production deployment evidence.
- Acceptance criteria:
  - Execute the guarded helper with `CONFIRM_NONPROD_MOCK_DISPATCH=1`.
  - Observe the resulting GitHub Actions run through backend deploy conclusion.
  - If deploy succeeds, run or record appropriate read-only backend smoke
    evidence; if it fails, record the first failing step and non-secret cause.
  - Update project state/progress and run focused guards before committing.
- Change summary:
  - Committed and pushed the pre-action Round 78 plan as `c714abd` so
    workflow dispatch used the current remote `main`.
  - Executed
    `CONFIRM_NONPROD_MOCK_DISPATCH=1 scripts/dispatch_nonprod_mock_payment_deploy.sh --execute`.
  - Observed workflow run `26800396663` through completion.
- Verification and external run results:
  - Pre-dispatch `node scripts/check_nonprod_dispatch_readiness.js`: passed
    with 6 checks.
  - Pre-dispatch `scripts/dispatch_nonprod_mock_payment_deploy.sh --dry-run`:
    passed and printed the fixed backend-only nonprod/mock command.
  - Run `26800396663`: completed `failure`.
  - `detect-targets`: success.
  - `build-backend`: success, including backend image build and artifact
    upload.
  - `build-admin-web`: skipped as expected for backend-only nonprod/mock lane.
  - `deploy-backend-host`: failed at `Checkout backend deployment bundle
    source`; bundle sync, artifact download, docker load, image availability
    check, and local backend deploy were skipped.
  - Sanitized failed-step log summary: ECS-2 `git fetch` over HTTPS to
    `github.com` hit TLS connection termination and `github.com:443`
    connection timeouts.
- Goal correction:
  - The active MVP goal remains incomplete. This round proves the guarded
    nonprod/mock lane dispatches and builds backend artifacts, but ECS-2
    GitHub network/checkout instability still blocks backend deployment and
    post-deploy smoke.
- Next recommended round:
  - Fix or work around ECS-2 runner network access to GitHub before retrying:
    inspect runner `_diag/Worker_*.log`, test `git ls-remote` and HTTPS access
    to GitHub from ECS-2, check DNS/proxy/firewall/security-group/egress rules,
    and only then re-dispatch backend-only nonprod/mock lane.

## Round 79: ECS Runner GitHub Connectivity Diagnostic

- Date: 2026-06-02
- Status: completed
- Focus: add a repeatable read-only diagnostic for ECS self-hosted runner
  connectivity to GitHub so deployment checkout failures can be investigated
  without manually assembling SSH commands.
- Start evidence:
  - Local `main` and `origin/main` are aligned at `9ce4a10`.
  - Repeated backend deploy attempts now fail before app deploy when ECS-2
    `actions/checkout` runs `git fetch` against GitHub over HTTPS.
  - The failure class is TLS connection termination and
    `github.com:443` connection timeouts; backend application validation is not
    reached in the latest nonprod/mock run.
- Open-source reference check:
  - Task classification: common GitHub Actions self-hosted runner
    observability and network diagnostic workflow.
  - Sources checked: GitHub official self-hosted runner monitoring and
    troubleshooting documentation, including runner `_diag` logs and network
    communication requirements.
  - License/compatibility: official documentation only; no external code
    copied.
  - Selected approach: add a repository-native read-only SSH diagnostic script
    that checks runner process/workspace hints, recent `_diag` logs, DNS,
    HTTPS reachability, `git ls-remote`, and disk space without printing
    secrets or mutating ECS state.
  - Rejected options: repeated workflow re-dispatch without fixing runner
    egress, committing secrets, or replacing GitHub Actions deployment
    architecture.
- Risks:
  - The script diagnoses connectivity but cannot fix cloud networking by
    itself.
  - RUN_INTERNAL mode requires SSH access to ECS-2; local-only mode can only
    validate script shape.
- Acceptance criteria:
  - Add a read-only runner connectivity diagnostic script.
  - Document the command in CI/CD and Context Index.
  - Wire shell syntax into deploy config validation.
  - Update Project-State/Progress and run focused checks before committing.
- Change summary:
  - Added `scripts/check_ecs_runner_github_connectivity.sh`.
  - The script defaults to local no-op guidance; with `RUN_INTERNAL=1`, it SSHes
    to ECS-2 and checks runner process hints, `_diag/Worker_*.log` summaries,
    GitHub DNS/HTTPS, `git ls-remote`, and disk space without mutating ECS.
  - Wired shell syntax into `scripts/check_deploy_config.sh`.
  - Updated `docs/CI-CD.md`, `docs/Context-Index.md`, and
    `docs/Project-State.md`.
- Verification:
  - `scripts/check_ecs_runner_github_connectivity.sh`: passed local default
    mode with one expected warning that `RUN_INTERNAL=1` is required for ECS
    inspection.
  - `bash -n scripts/check_ecs_runner_github_connectivity.sh
    scripts/check_deploy_config.sh`: passed.
  - `scripts/check_deploy_config.sh`: passed, including workflow YAML parse,
    compose rendering, shell syntax, nonprod env check, runner release metadata
    guard, workflow lane matrix, nonprod readiness, helper dry-run, and Node.js
    syntax.
  - `node scripts/check_mvp_handoff_packet.js`,
    `node scripts/check_mvp_next_approval_request.js`,
    `node scripts/check_mvp_external_approval_packet.js`, and
    `node scripts/check_mvp_closeout_readiness.js`: passed in non-strict mode;
    closeout still reports 32 unresolved required items.
  - `git diff --check`: passed.
- Goal correction:
  - The active MVP goal remains incomplete. This round adds a reproducible
    diagnostic path for the current ECS-2 GitHub connectivity blocker; it does
    not deploy backend or collect smoke/manual QA evidence.
- Next recommended round:
  - Run `RUN_INTERNAL=1 scripts/check_ecs_runner_github_connectivity.sh` with
    ECS SSH access. Fix any DNS/HTTPS/git connectivity issue it reports before
    retrying backend-only nonprod/mock dispatch.

## Round 80: ECS Runner Live Connectivity Evidence

- Date: 2026-06-02
- Status: completed
- Focus: run the read-only ECS-2 runner connectivity diagnostic against the
  actual self-hosted runner and turn the result into durable deployment-blocker
  evidence.
- Start evidence:
  - Local `main` and `origin/main` are aligned at `3f8d237`.
  - Current-branch backend deploy/smoke remains pending because the latest
    backend-only nonprod/mock run failed during ECS-2 `actions/checkout`.
  - Real WeChat Pay private key/config remains incomplete, so real
    payment/refund evidence is still out of scope for this round.
- Open-source reference check:
  - Task classification: common GitHub Actions self-hosted runner
    troubleshooting and network-readiness diagnosis.
  - Sources checked: GitHub official self-hosted runner communication
    requirements and monitoring/troubleshooting docs.
  - License/compatibility: official documentation only; no code copied.
  - Selected approach: use the repo-native read-only diagnostic to inspect
    runner process presence, `_diag` worker log hints, GitHub DNS/HTTPS,
    repository `git ls-remote`, and disk status. This follows GitHub guidance
    to verify the runner application is running, outbound HTTPS over 443 is
    available, and diagnostic logs under `_diag` are reviewed.
  - Rejected options: retrying workflow dispatch without new evidence,
    modifying ECS networking blindly, or recording mock deploy evidence as real
    payment/deploy readiness.
- Risks:
  - SSH or transient network failure may make the result inconclusive.
  - The diagnostic is read-only and may identify cloud/network remediation that
    cannot be fixed purely in this repo.
  - Output must remain sanitized; do not record secrets, tokens, or full
    sensitive runtime logs.
- Acceptance criteria:
  - Run `RUN_INTERNAL=1 scripts/check_ecs_runner_github_connectivity.sh`.
  - Summarize the sanitized outcome and next corrective action in
    `docs/Project-State.md` and this progress section.
  - Run focused validation for touched docs/scripts.
  - Commit the round separately.
- Diagnostic result:
  - `RUN_INTERNAL=1 scripts/check_ecs_runner_github_connectivity.sh` passed
    against ECS-2 with 7 pass(es) and 0 warning(s).
  - Current runner evidence: the GitHub Actions runner process is present, the
    expected runner root and `_diag` directory exist, `github.com` DNS resolves,
    HTTPS HEAD to `github.com` succeeds, `git ls-remote` reaches the repository
    and sees `main` at `3f8d237`, and disk usage is healthy.
  - Recent worker log evidence still shows the earlier checkout failure class:
    a GitHub TLS connection was non-properly terminated, followed by repeated
    `github.com:443` connection timeouts during repository access.
- Change summary:
  - Updated `docs/Project-State.md` with the live diagnostic result and
    corrected the stale local/remote branch risk wording.
  - Updated this progress section from planning to completed evidence.
- Verification:
  - `RUN_INTERNAL=1 scripts/check_ecs_runner_github_connectivity.sh`: passed.
- Goal correction:
  - The active MVP goal remains incomplete. This round provides stronger
    deployment-blocker evidence but does not deploy current branch code or
    collect production smoke/manual QA evidence.
- Next recommended round:
  - Treat ECS-2 GitHub checkout failures as intermittent outbound connectivity
    instability. Before retrying the backend-only nonprod/mock lane, either
    coordinate cloud/network remediation for ECS-2 egress to GitHub over 443 or
    add workflow-level resilience around self-hosted checkout if acceptable.
    Then re-dispatch nonprod/mock backend deploy and record post-deploy smoke.

## Round 81: Domain Certificate and No-Cost Deploy Alternative Research

- Date: 2026-06-02
- Status: completed
- Focus: investigate the备案 domain/certificate situation and record a no-new-paid
  service fallback if GitHub-to-Aliyun ECS connectivity remains unstable.
- Start evidence:
  - User stated `sunflower.cloud` is already备案.
  - Earlier project memory also recorded `xiangrikui.cloud` as a user-provided
    miniapp备案 domain.
  - Latest ECS-2 live runner diagnosis passed current GitHub DNS/HTTPS/git
    probes, but previous runner logs still show intermittent GitHub TLS/443
    checkout failures.
- Open-source/reference check:
  - Task classification: common HTTPS certificate and GitHub Actions deployment
    reliability research.
  - Sources checked: GitHub self-hosted runner diagnostics and workflow artifact
    docs, Let's Encrypt/Certbot free certificate guidance, IANA/RFC reserved
    address documentation for `198.18.0.0/15`, and WeChat miniapp HTTPS/legal
    domain requirement references. WeChat official pages should still be
    rechecked in the miniapp backend before final launch because public web
    access to the exact official page was unreliable during this round.
  - License/compatibility: documentation only; no external code copied.
  - Selected approach: record DNS/certificate as a pending launch prerequisite,
    prefer trusted free DV certificates with automated renewal, and prefer an
    artifact-based GitHub Actions deploy path if ECS checkout keeps failing.
- Findings:
  - DNS: `sunflower.cloud`, `www.sunflower.cloud`, `api.sunflower.cloud`,
    `admin.sunflower.cloud`, `xiangrikui.cloud`, and common subdomains were
    checked against local DNS plus public resolvers `1.1.1.1`, `8.8.8.8`,
    `223.5.5.5`, and `114.114.114.114`.
  - All tested names currently resolve to `198.18.x.x` addresses, which are
    reserved benchmarking/test addresses rather than ECS-1 public ingress
    `47.113.223.248`.
  - TLS: `openssl s_client` did not return a usable certificate chain for the
    tested API/admin hostnames. `curl -I https://...` either reached placeholder
    responses for root/www `sunflower.cloud` or failed TLS handshake for API,
    admin, and `xiangrikui.cloud` names.
  - Conclusion: current certificate state is not deployable/WeChat-ready. It is
    not proven as "expired"; the stronger evidence is DNS points away from ECS
    and no usable TLS certificate chain is served on the intended hostnames.
  - Free certificate feasibility: Let's Encrypt or cloud-provider free DV
    certificates should satisfy the technical HTTPS requirement if the selected
    hostname resolves to ECS-1, the full certificate chain is trusted, TLS is
    modern, renewal is automated, and the hostname is configured in the WeChat
    miniapp backend as a legal request domain. Let's Encrypt's 90-day validity
    makes automated renewal mandatory.
  - No-new-paid deployment alternative: if ECS self-hosted runner checkout keeps
    failing, move repository checkout and deployment-bundle packaging to
    GitHub-hosted runners, upload the bundle as a workflow artifact, and let ECS
    self-hosted jobs download artifacts plus image artifacts and execute local
    deploy scripts without `actions/checkout`.
- Change summary:
  - Updated `docs/Project-State.md` with `sunflower.cloud`, DNS/TLS evidence,
    and the preferred no-new-paid deploy fallback.
  - Updated `docs/MVP-Readiness.md` deployment and security/compliance rows.
  - Updated `docs/MVP-Launch-Evidence.json` next actions for `WECHAT-DOMAIN`
    and `CURRENT-BRANCH-DEPLOYED`.
  - Added a durable deployment decision to `docs/Decision-Log.md`.
- Verification:
  - DNS and TLS probes were run from the local environment.
  - Documentation/evidence checker validation is recorded in the command output
    for this round's commit.
- Next recommended round:
  - Choose the final public hostnames, point DNS to ECS-1, install a trusted
    free certificate with automatic renewal, and add a small repeatable domain
    TLS checker before attempting WeChat preview/domain evidence.
  - Separately, implement the artifact-based ECS deploy fallback if another
    workflow run fails at ECS `actions/checkout`.

## Round 72: Nonprod Mock Deployment Approval Snapshot

- Date: 2026-06-02
- Status: completed
- Focus: refresh the current deployment approval snapshot and make the
  backend-only nonprod/mock-payment path the documented next deployment option
  while real payment private key/config remains incomplete.
- Start evidence:
  - Local `main` was clean and ahead of `origin/main` by 12 commits at HEAD
    `5a836f4704b7`.
  - User confirmed real payment private key/config is not fully provisioned yet
    and mock/bypass is acceptable if recorded.
  - Push-to-main still uses the production lane and can trigger deployment.
- Open-source reference check:
  - Task classification: common CI/CD manual deployment-lane approval boundary.
  - Sources checked: GitHub Actions official workflow syntax and
    `workflow_dispatch` input documentation; GitHub Actions environments and
    deployment protection documentation.
  - License/compatibility: official documentation only; no external code
    copied.
  - Selected approach: keep the existing repository-native
    `deployment_lane=nonprod-mock-payment` choice input, require local lane
    matrix/config guards, and update approval docs rather than adding a new
    deployment dependency or weakening production validation.
  - Rejected options: pushing `main` to rely on production lane while payment
    keys are missing, relaxing `scripts/validate_prod_env.sh`, or treating mock
    payment as real payment/refund evidence.
- Risks:
  - This round does not push, dispatch GitHub Actions, deploy, or mutate ECS.
  - A backend-only nonprod/mock-payment dispatch can prove only reduced-scope
    backend deployability; it does not refresh admin-web/Nginx and does not
    satisfy real payment/refund evidence.
- Acceptance criteria:
  - Run deployment approval preflight on a clean worktree and record current
    branch, HEAD, base, changed-file count, predicted target, and impact counts.
  - Run workflow lane matrix and nonprod mock-payment lane guards.
  - Update approval/state/progress docs with the current deployment decision
    boundary.
  - Run packet/evidence/deploy guards and commit once.
- Change summary:
  - Refreshed `docs/MVP-Next-Approval-Request.md` deployment snapshot to
    current HEAD `5a836f4704b7`, base `origin/main d0af634314d0`, 39 changed
    files, predicted push-to-main target `all`, and backend/admin/ingress
    impact counts of 4/3/3.
  - Updated `docs/Project-State.md` so future operators see that production
    lane remains blocked by incomplete real payment config and that the
    available interim path is manual backend-only nonprod/mock-payment dispatch.
  - Kept real payment/refund and current-branch deployment evidence pending.
- Verification:
  - `node scripts/check_deployment_approval_preflight.js`: passed with 4 checks
    on clean local `main`; it did not push, dispatch, deploy, or mutate
    production.
  - `node scripts/check_workflow_dispatch_lane_matrix.js`: passed with 12
    matrix checks.
  - `bash scripts/check_nonprod_mock_payment_deploy_lane.sh`: passed for
    `.env.nonprod-mock.example`.
  - `node scripts/check_mvp_handoff_packet.js`,
    `node scripts/check_mvp_next_approval_request.js`, and
    `node scripts/check_mvp_external_approval_packet.js`: passed.
  - `node scripts/check_mvp_closeout_readiness.js`: passed in non-strict mode
    with 32 unresolved required closeout items.
  - `scripts/check_deploy_config.sh`: passed, including workflow YAML, compose
    rendering, shell syntax, nonprod lane, runner metadata guard, workflow lane
    matrix, and Node.js syntax.
  - `git diff --check`: passed.
- Goal correction:
  - The active MVP goal remains incomplete. This round improves deploy
    handoff/approval readiness but does not prove current branch deployment,
    real payment/refund, HTTPS WeChat domain, or manual QA.
- Next recommended round:
  - With explicit user approval, manually dispatch
    `target=auto` or `target=backend` plus
    `deployment_lane=nonprod-mock-payment`, then record backend-only mock
    deploy smoke as reduced-scope evidence. Do not mark production payment or
    full current-branch deployment passed from that alone.

## Round 71: Current HEAD Default Regression Refresh

- Date: 2026-06-02
- Status: completed
- Focus: refresh the default local automated MVP regression on current local
  `main` HEAD `2af1ed43dfc9` after the recent deployment-lane, handoff, and
  documentation-pruning commits, without pushing, dispatching GitHub Actions,
  deploying, or mutating production.
- Start evidence:
  - Local `main` was clean and ahead of `origin/main` by 11 commits.
  - The latest documented default aggregate regression is still Round 64 at
    HEAD `4a3f630f30eb`; this no longer covers Rounds 65-70.
  - The latest read-only production audit remains Round 65; this round keeps
    production checks skipped because no deployment or production state changed.
- Open-source reference check:
  - Task classification: repository-specific validation and documentation
    refresh.
  - Sources checked: not needed; no common feature, third-party implementation,
    framework integration, deployment code, auth/payment flow, or UI pattern is
    being introduced.
  - License/compatibility: no external code copied.
  - Selected approach: run the existing aggregate regression script on current
    HEAD, record the exact result, and keep unresolved external/manual evidence
    pending.
  - Rejected options: re-running production smoke without a production-state
    change, pushing to main to trigger deployment, or treating local regression
    as proof of manual/external QA.
- Risks:
  - Default regression does not prove current-branch deployment, HTTPS WeChat
    domain, real payment/refund, or manual admin/miniapp QA.
  - If the regression fails, this round must switch from documentation refresh
    to fixing the failing focused area before committing.
- Acceptance criteria:
  - Run `scripts/check_mvp_regression.sh` on current local HEAD.
  - Record backend/admin/miniapp/evidence/deploy-config results.
  - Update readiness/state/progress docs with current HEAD and unresolved
    blocker facts.
  - Run focused doc/check guards and commit once.
- Change summary:
  - Refreshed the default local automated MVP regression on current local
    `main` HEAD `2af1ed43dfc9`.
  - Updated `docs/Project-State.md` and `docs/MVP-Readiness.md` so the latest
    default aggregate regression points to Round 71 instead of Round 64.
  - Recorded the user's Round 71 clarification that real payment private
    key/config is not fully provisioned yet; interim validation may use explicit
    mock/nonprod evidence, but real payment/refund launch evidence remains
    pending.
- Verification:
  - `scripts/check_mvp_regression.sh`: passed with 5 enabled default steps.
    Backend `mvn -B test` passed with 57 tests, 0 failures, 0 errors, and 0
    skipped. Admin-web lint, 24 Vitest tests across 5 files, production build,
    behavior wiring (97 checks), and external QA preflight (6 checks) passed.
    Miniapp smoke, behavior wiring (69 checks), user-flow replay (3
    scenarios), payment-flow replay (5 scenarios), external preflight, appid
    guard, and subpage nav guard passed. Evidence ledger checks and deploy
    config static checks passed. Production checks were skipped by default.
- Goal correction:
  - The active MVP goal remains incomplete. This round proves the current
    local automated baseline, but does not prove current-branch deployment,
    HTTPS WeChat legal domain, real payment/refund, or manual admin/miniapp QA.
- Next recommended round:
  - Use the explicit backend-only `deployment_lane=nonprod-mock-payment` path
    if interim cloud/mock validation is needed while real payment private keys
    are missing; otherwise provision real payment config before production-lane
    deployment.

## Round 70: Active Documentation Pruning

- Date: 2026-06-02
- Status: completed
- Focus: reduce redundant active documentation while preserving the canonical
  handoff, readiness, architecture, deployment, API, decision, and
  machine-readable evidence sources.
- Start evidence:
  - User requested another documentation simplification round because the repo
    still had too many overlapping docs.
  - Local `main` was ahead of `origin/main` by 10 commits.
  - A stale in-progress Round 70 regression note existed in
    `docs/MVP-Progress.md`; its long-running process was no longer available
    after context transition, so this round replaced it rather than preserving
    an unverified partial result.
- Open-source reference check:
  - Task classification: repository-specific documentation pruning and memory
    compaction.
  - Sources checked: not needed; no common feature, third-party implementation,
    framework integration, deployment code, auth/payment flow, or UI pattern is
    being introduced.
  - License/compatibility: no external code copied.
  - Selected approach: keep canonical active docs and machine-readable ledgers,
    compress status/progress history, and keep task-specific docs discoverable
    through `docs/Context-Index.md` instead of loading them by default.
  - Rejected options: deleting evidence ledgers, deleting guard-dependent QA
    docs, adding another archive document, or marking external/manual evidence
    as passed during a docs cleanup.
- Risks:
  - Over-pruning can break handoff or guard scripts, so evidence ledgers,
    approval packets, readiness, handoff, and closeout guard documents remain.
  - This round does not run a fresh full backend/admin/miniapp regression and
    does not prove deployment, WeChat domain, payment/refund, or manual QA.
- Acceptance criteria:
  - Keep active docs focused on the smallest useful set of entry points.
  - Remove stale in-progress validation wording and old progress duplication
    from active status docs.
  - Update context index/readme/project-state with the reduced documentation
    model.
  - Run focused documentation/evidence guards and commit once.
- Change summary:
  - Replaced the stale in-progress Round 70 regression note with this completed
    documentation pruning record.
  - Trimmed active `docs/MVP-Progress.md` so it keeps only the latest
    operational rounds plus the current pruning round; older round detail stays
    available through git history and prior archive files.
  - Compressed `docs/Project-State.md` from a long historical ledger into
    current facts, latest validation baselines, deployment blockers, risks, and
    canonical doc ownership.
  - Updated `docs/Context-Index.md` and `docs/README.md` so future turns
    default to fewer documents and load task-specific QA/runbook docs only when
    needed.
- Verification:
  - `node scripts/check_mvp_handoff_packet.js`: passed.
  - `node scripts/check_mvp_next_approval_request.js`: passed.
  - `node scripts/check_mvp_external_approval_packet.js`: passed.
  - `node scripts/check_mvp_termination_audit.js`: passed after preserving the
    compact Round 50 incomplete-goal summary in project state.
  - `node scripts/check_mvp_closeout_readiness.js`: passed in non-strict mode
    with 32 unresolved required closeout items.
  - `node scripts/check_mvp_launch_evidence.js`: passed in non-strict mode
    with 13 required launch entries, 5 passed, and 8 pending.
  - `node scripts/check_mvp_external_runbook.js`: passed.
  - `node scripts/check_mvp_external_evidence_template.js`: passed.
  - `scripts/check_deploy_config.sh`: passed, including workflow YAML,
    compose rendering, shell syntax, nonprod mock-payment lane, runner release
    metadata guard, workflow lane matrix, and Node.js syntax.
  - `git diff --check`: passed.
- Goal correction:
  - The active MVP goal remains incomplete. Documentation is leaner, but the
    same external/manual blockers remain: current-branch deployment, HTTPS
    WeChat domain under `xiangrikui.cloud`, real payment/refund, miniapp
    manual QA, and admin-web manual QA.
- Next recommended round:
  - Choose one evidence lane from `docs/MVP-Next-Approval-Request.md`; the
    highest-leverage choices remain HTTPS/domain verification under
    `xiangrikui.cloud`, backend-only nonprod/mock-payment dispatch, or real
    payment configuration before production-lane deployment.

## Round 69: Nonprod Deploy Lane Handoff and Approval Coverage

- Date: 2026-06-02
- Status: completed
- Focus: make the backend-only non-production/mock-payment deployment lane
  visible in the MVP handoff and approval packets, and guard that visibility
  with the existing packet checkers.
- Start evidence:
  - Local `main` was clean and ahead of `origin/main` by 9 commits.
  - Rounds 67-68 added and verified the manual
    `deployment_lane=nonprod-mock-payment` backend-only workflow path.
  - `docs/MVP-Handoff-Packet.md`, `docs/MVP-Next-Approval-Request.md`, and
    `docs/MVP-External-Approval-Packet.md` still described only the older
    generic push/workflow_dispatch production deployment boundary.
- Open-source reference check:
  - Task classification: repository-specific approval and handoff
    documentation for an existing deployment lane.
  - Sources checked: not needed beyond existing repository docs and checkers;
    no common implementation, third-party dependency, or reusable external code
    is being introduced.
  - License/compatibility: no external code copied.
  - Selected approach: update the active handoff and approval packets and add
    checker assertions so future changes cannot silently omit the nonprod lane
    risk boundary.
  - Rejected options: adding another large runbook document, treating nonprod
    deploy as production evidence, or weakening existing approval boundaries.
- Risks:
  - Documentation/checker updates do not push, dispatch, deploy, or prove
    current-branch deployment.
  - The nonprod lane can support operator validation, but it is not real
    payment/refund evidence and does not refresh admin-web or Nginx.
- Acceptance criteria:
  - Update handoff/approval docs so operators can choose production deployment
    or backend-only nonprod/mock-payment dispatch with correct risk wording.
  - Require the packet checkers to mention the nonprod lane, backend-only target
    boundary, `.env.nonprod-mock.example`, and workflow lane matrix guard.
  - Run packet/evidence/deploy checks and commit once.
- Change summary:
  - Updated `docs/MVP-Handoff-Packet.md` with backend-only nonprod/mock-payment
    dispatch behavior, required commands, and reduced-scope evidence wording.
  - Updated `docs/MVP-Next-Approval-Request.md` and
    `docs/MVP-External-Approval-Packet.md` so `CURRENT-BRANCH-DEPLOYED` approval
    distinguishes production deployment from backend-only nonprod/mock-payment
    dispatch.
  - Strengthened `scripts/check_mvp_handoff_packet.js`,
    `scripts/check_mvp_next_approval_request.js`, and
    `scripts/check_mvp_external_approval_packet.js` to require the nonprod lane
    boundary and guard commands.
- Verification:
  - `node scripts/check_mvp_handoff_packet.js`: passed with 32 unresolved
    required items, 14 commands, 8 safety boundaries, and 7 nonprod deploy
    boundary items covered.
  - `node scripts/check_mvp_next_approval_request.js`: passed with 6 lanes, 32
    unresolved items, 15 safety items, 12 commands, and 7 nonprod deploy
    boundary items covered.
  - `node scripts/check_mvp_external_approval_packet.js`: passed with 6 lanes,
    32 unresolved items, 14 safety items, 10 commands, and 7 nonprod deploy
    boundary items covered.
- Goal correction:
  - The active MVP goal remains incomplete. This round improves handoff and
    approval readiness, but does not push, dispatch, deploy, prove current local
    `main` is live, or collect external/manual QA, HTTPS domain, real payment,
    or refund evidence.
- Next recommended round:
  - Run the updated packet/deploy checks together, then either request explicit
    approval for backend-only nonprod dispatch or provision real payment config
    for production-lane deployment.

## Round 68: Workflow Dispatch Lane Matrix Guard

- Date: 2026-06-02
- Status: completed
- Focus: add a local matrix guard for the manual deployment lane logic so the
  `deployment_lane` workflow input remains verifiably production-safe and
  backend-only for mock-payment dispatches.
- Start evidence:
  - Local `main` was clean and ahead of `origin/main` by 8 commits.
  - Round 67 added the manual `deployment_lane` input and runner branching.
  - Existing checks verified workflow YAML, string snippets, and runner script
    behavior, but did not execute the workflow target/lane matrix as a unit.
- Open-source reference check:
  - Task classification: common CI/CD workflow input validation and local
    deployment guard.
  - Sources checked:
    - GitHub Actions workflow syntax and `workflow_dispatch` input docs:
      `https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions`.
    - GitHub Actions contexts/input semantics:
      `https://docs.github.com/actions/learn-github-actions/contexts`.
    - Existing repository workflow resolution logic in
      `.github/workflows/deploy-backend.yml`.
  - License/compatibility: official documentation only; no external code was
    copied.
  - Selected approach: add a dependency-free Node.js guard that mirrors the
    workflow's deployment target resolution and asserts the expected matrix.
    This keeps verification local and avoids adding `act` or another workflow
    runner dependency.
  - Rejected options: adding a new third-party local GitHub Actions runner,
    relying only on workflow string checks, or broadening the non-production
    lane beyond backend.
- Risks:
  - The guard proves local resolution rules, not a live GitHub Actions run.
  - If the workflow shell logic changes, the mirrored guard must be updated
    intentionally to keep the matrix meaningful.
- Acceptance criteria:
  - Add a local checker covering production dispatch targets, nonprod accepted
    targets, nonprod rejected targets, and push event default production
    behavior.
  - Wire the checker into deployment config checks.
  - Update docs/state with the new verification command.
  - Run focused deploy checks and commit once.
- Change summary:
  - Added `scripts/check_workflow_dispatch_lane_matrix.js`.
  - Wired the new checker into `scripts/check_deploy_config.sh`.
  - Updated deployment command indexes and project state with the new guard.
- Verification:
  - `node --check scripts/check_workflow_dispatch_lane_matrix.js`: passed.
  - `node scripts/check_workflow_dispatch_lane_matrix.js`: passed with 12
    checks covering production auto/backend rollback/nginx dispatch,
    nonprod auto/backend dispatch, nonprod rejected admin-web/nginx/all/bootstrap
    dispatches, and push-event production behavior.
  - `scripts/check_deploy_config.sh`: passed, including workflow YAML parse,
    compose rendering, shell syntax, nonprod lane example, runner deploy tests,
    workflow dispatch lane matrix, and deployment Node.js syntax.
  - `git diff --check`: passed.
- Goal correction:
  - The active MVP goal remains incomplete. This round improves confidence in
    the manual deployment lane, but it does not push, dispatch, deploy, prove
    current local `main` is live, or collect external/manual QA, HTTPS domain,
    real payment, or refund evidence.
- Next recommended round:
  - Rerun the clean-worktree deployment approval preflight after commit, then
    decide whether to push and manually dispatch the backend-only nonprod lane
    or provision real payment config for a production-lane deployment.

## Round 67: Manual Non-Production Mock-Payment Workflow Lane

- Date: 2026-06-02
- Status: completed
- Focus: wire the Round 66 non-production/mock-payment backend lane into
  GitHub Actions as an explicit manual dispatch option while preserving
  push-to-main and default manual dispatch as production validation.
- Start evidence:
  - Local `main` was clean and ahead of `origin/main` by 7 commits.
  - Round 66 added the non-production/mock-payment env template and local
    checker, but the GitHub Actions runner path still always called
    `scripts/validate_prod_env.sh`.
  - Production real-payment readiness remained blocked by missing ECS-2 WeChat
    Pay merchant config.
- Open-source reference check:
  - Task classification: common CI/CD workflow input and deployment-lane
    boundary.
  - Sources checked:
    - GitHub Actions workflow syntax and `workflow_dispatch` inputs:
      `https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions`.
    - GitHub Actions environments/deployment protection:
      `https://docs.github.com/actions/deployment/targeting-different-environments/using-environments-for-deployment`.
    - Existing repository workflow and runner scripts:
      `.github/workflows/deploy-backend.yml`,
      `scripts/execute_runner_deploy.sh`, and
      `scripts/sync_deploy_bundle.sh`.
  - License/compatibility: official documentation only; no external code was
    copied.
  - Selected approach: add a manual `deployment_lane` choice input with
    `production` as the default. Push-to-main remains production-only. The
    non-production lane is limited to backend deployment, with `auto` resolving
    to backend, so mock-payment validation cannot refresh web/nginx or masquerade
    as full production readiness.
  - Rejected options: changing push-to-main behavior, relaxing
    `validate_prod_env.sh`, or allowing non-production mock-payment to deploy
    web/nginx targets.
- Risks:
  - This creates a dispatchable backend lane but does not push, deploy, or prove
    current-branch deployment by itself.
  - Operators must still understand that mock payment is not real
    payment/refund evidence.
- Acceptance criteria:
  - Add `deployment_lane` to `workflow_dispatch` with production default.
  - Ensure push-triggered deploys always use production validation.
  - Ensure non-production/mock-payment manual dispatch is accepted only for
    `auto` or `backend`; `auto` resolves to backend.
  - Sync `.env.nonprod-mock.example` into the runner deploy bundle.
  - Teach `scripts/execute_runner_deploy.sh` to select production validation or
    backend non-production mock-payment validation by lane.
  - Update deployment docs/state and run focused CI/deploy checks.
- Change summary:
  - Added `deployment_lane` workflow input with `production` default and
    `nonprod-mock-payment` option.
  - Kept push-to-main production-only by leaving push events on the default
    `deployment_lane=production`.
  - Limited non-production/mock-payment dispatch to `target=auto/backend`;
    `auto` resolves to backend and only the backend host deploy job runs.
  - Synced `.env.nonprod-mock.example` in the runner deployment bundle.
  - Updated `scripts/execute_runner_deploy.sh` to run production validation or
    backend non-production mock-payment validation based on `DEPLOYMENT_LANE`.
  - Extended `scripts/test_execute_runner_deploy_release_env.sh` to prove
    failed production validation preserves release metadata and nonprod lane
    selects nonprod validation/env.
  - Updated deployment/readiness/state/decision docs.
- Verification:
  - `ruby -e 'require "yaml";
    YAML.load_file(".github/workflows/deploy-backend.yml")'`: passed.
  - `bash -n scripts/execute_runner_deploy.sh scripts/sync_deploy_bundle.sh
    scripts/check_deploy_config.sh`: passed.
  - `node --check scripts/check_deployment_approval_preflight.js`: passed.
  - `bash scripts/test_execute_runner_deploy_release_env.sh`: passed with both
    release metadata preservation and nonprod lane selection checks.
  - `scripts/check_deploy_config.sh`: passed, including workflow YAML parse,
    compose rendering, shell syntax, nonprod lane example, runner deploy tests,
    and Node syntax.
  - `node scripts/check_deployment_approval_preflight.js`: expected non-zero
    before commit because the worktree was dirty; workflow shape, launch
    evidence boundary, and deployment impact checks passed. It must be rerun
    after commit to satisfy the clean-worktree requirement.
- Goal correction:
  - The active MVP goal remains incomplete. This round makes a backend-only
    mock-payment deployment path dispatchable, but it does not push, deploy,
    prove current local `main` is live, or collect external/manual QA, HTTPS
    domain, real payment, or refund evidence.
- Next recommended round:
  - After committing, rerun deployment approval preflight on the clean worktree.
    Then either push/dispatch the backend-only nonprod lane with explicit risk
    recording, or provision real payment config for production-lane deployment.
