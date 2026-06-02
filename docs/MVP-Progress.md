# MVP Progress

> Compact round-by-round progress for the current MVP hardening goal. Keep this
> file factual and update it at the end of each committed round.
> This active file keeps only the latest operational rounds. Older rounds are
> archived in `docs/archive/mvp-progress/`.

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
