# MVP Progress

> Compact round-by-round progress for the current MVP hardening goal. Keep this
> file factual and update it at the end of each committed round.
> This active file keeps only the latest operational rounds. Older rounds are
> archived in `docs/archive/mvp-progress/`.

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
