# MVP Progress

> Compact round-by-round progress for the current MVP hardening goal. Keep this
> file factual and update it at the end of each committed round.
> This active file keeps only the latest operational rounds. Older rounds are
> archived in `docs/archive/mvp-progress/`.

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

## Round 66: Non-Production Mock-Payment Deploy Lane Boundary

- Date: 2026-06-02
- Status: completed
- Focus: make the user-approved "no production environment / mock payment"
  option explicit and verifiable without weakening production deployment
  validation.
- Start evidence:
  - Local `main` was clean and ahead of `origin/main` by 6 commits.
  - Push-to-main path rules would still trigger deployment, and runner deploy
    still calls `scripts/validate_prod_env.sh`.
  - Real-payment production readiness remained blocked by the 8 sanitized
    WeChat Pay config issues from Round 65.
- Open-source reference check:
  - Task classification: common deployment/configuration lane boundary.
  - Sources checked:
    - The Twelve-Factor App config guidance:
      `https://12factor.net/config`.
    - GitHub Actions environment/deployment protection documentation:
      `https://docs.github.com/actions/deployment/targeting-different-environments/using-environments-for-deployment`.
    - Docker Compose profiles documentation:
      `https://docs.docker.com/compose/how-tos/profiles/`.
    - Repository-native deployment validation:
      `scripts/validate_prod_env.sh`, `scripts/execute_runner_deploy.sh`,
      `.github/workflows/deploy-backend.yml`, and compose env loading.
  - License/compatibility: official documentation only; no external code was
    copied.
  - Selected approach: keep production validation strict and add a separate
    non-production/mock-payment backend lane checker and env template. This
    mirrors config-by-environment guidance while avoiding an accidental prod
    bypass.
  - Rejected options: relaxing `validate_prod_env.sh`, treating mock payment as
    production payment readiness, or wiring push-to-main to a non-production
    lane without a separate workflow approval/design pass.
- Risks:
  - The new lane validates configuration shape only; it does not prove a
    current branch deployment, real payment/refund, HTTPS domain, or manual QA.
  - Current GitHub Actions push-to-main deployment remains production-lane and
    will still fail until real payment config is provisioned or the workflow is
    explicitly changed.
- Acceptance criteria:
  - Add a committed non-production backend env template for mock-payment MVP
    validation.
  - Add a repeatable checker that requires
    `SUNFLOWER_DEPLOY_LANE=nonprod-mock-payment`,
    `DEPLOY_NODE_ROLE=backend`, private/local backend bind, real WeChat auth
    mode, and `WECHAT_PAY_MOCK_ENABLED=true`.
  - Wire the checker into deploy config static checks.
  - Document that production validation remains strict and this lane is not
    launch/payment evidence.
  - Run focused checks and commit once.
- Change summary:
  - Added `.env.nonprod-mock.example`.
  - Added `scripts/check_nonprod_mock_payment_deploy_lane.sh`.
  - Added the new checker to `scripts/check_deploy_config.sh`.
  - Updated deployment docs, readiness/state docs, and decision log.
- Verification:
  - `bash -n scripts/check_nonprod_mock_payment_deploy_lane.sh
    scripts/check_deploy_config.sh`: passed.
  - `bash scripts/check_nonprod_mock_payment_deploy_lane.sh`: passed for
    `.env.nonprod-mock.example`.
  - `PROD_ENV_FILE=.env.nonprod-mock.example bash
    scripts/validate_prod_env.sh`: expected non-zero; production validation
    rejected the non-production template because it contains placeholder
    production secrets and mock payment.
  - `scripts/check_deploy_config.sh`: passed, including compose rendering,
    shell syntax, non-production lane validation, release metadata failure
    behavior, and deployment Node.js syntax.
  - `RUN_BACKEND=0 RUN_ADMIN=0 RUN_MINIAPP=0 RUN_EVIDENCE=0
    RUN_DEPLOY_CONFIG=1 RUN_PRODUCTION=0 scripts/check_mvp_regression.sh`:
    passed with deploy config static checks enabled.
  - `git diff --check`: passed.
- Goal correction:
  - The active MVP goal remains incomplete. This round clarifies a deploy lane
    choice but does not deploy current local `main` or collect external/manual
    QA, domain, real payment, or refund evidence.
- Next recommended round:
  - If the operator wants cloud validation without real merchant config, add an
    explicit workflow/manual-dispatch path for the non-production mock-payment
    lane and record the risk acceptance. If the operator wants production
    readiness, provision real WeChat Pay config and rerun strict payment
    readiness before pushing.

## Round 65: Production Read-Only Smoke Refresh

- Date: 2026-06-02
- Status: completed
- Focus: refresh production read-only smoke, backend `8080` exposure, and
  payment configuration blocker evidence without pushing, deploying, reloading
  Nginx, or mutating ECS/firewall/security-group state.
- Start evidence:
  - Local `main` was clean and ahead of `origin/main` by 5 commits.
  - Round 64 proved the current local automated baseline but skipped production
    checks by default.
  - Round 62 was the latest full read-only production audit in the docs.
- Open-source reference check:
  - Task classification: repository-specific validation and documentation
    refresh.
  - Sources checked: not needed; no common engineering feature, reusable UI,
    auth/payment/deployment implementation, or OSS pattern was being built.
- Risks:
  - Read-only smoke proves the currently running cloud system is healthy, but
    it does not prove current local `main` has been deployed.
  - Strict payment readiness is expected to fail until real WeChat Pay config
    is provisioned or a non-production/mock-payment lane is explicitly chosen.
- Acceptance criteria:
  - Run the production read-only audit wrapper.
  - Run strict payment configuration readiness and record the expected non-zero
    result.
  - Update production/readiness/state/evidence docs without changing pending
    external/manual evidence to passed.
  - Run focused evidence/doc checks and commit once.
- Verification:
  - `CURL_CONNECT_TIMEOUT=15 scripts/check_production_readonly_audit.sh`:
    passed with 4 read-only steps. Deploy config static checks passed.
    Production public/ECS internal smoke passed with 7 passes and 0 warnings.
    Backend `8080` exposure checks passed with 5 passes and 0 warnings:
    public backend `8080` was not directly usable, ECS-1 private upstream
    worked, ECS-2 backend health was present, backend was bound to
    `172.25.121.83:8080`, and it was not listening on the public interface.
    Payment config readiness ran in non-strict read-only mode and reported the
    same 8 sanitized issues.
  - `RUN_INTERNAL=1 ENFORCE_PAYMENT_CONFIG=1
    scripts/check_backend_payment_config_readiness.sh`: expected non-zero; it
    reported missing `WECHAT_PAY_MCH_ID`,
    `WECHAT_PAY_MERCHANT_SERIAL_NO`, `WECHAT_PAY_PRIVATE_KEY_PATH`,
    `WECHAT_PAY_PUBLIC_KEY_ID`, `WECHAT_PAY_PUBLIC_KEY_PATH`,
    `WECHAT_PAY_API_V3_KEY`, and invalid `WECHAT_PAY_PAYMENT_NOTIFY_URL` /
    `WECHAT_PAY_REFUND_NOTIFY_URL`.
- Goal correction:
  - The active MVP goal remains incomplete. Production health and backend
    `8080` hardening remain green, but current local `main` is not deployed
    and real payment/domain/manual QA evidence remains pending.
- Next recommended round:
  - Choose the deployment/payment lane before pushing: provision the missing
    real-payment ECS-2 config and rerun strict payment readiness, or explicitly
    run a non-production/mock-payment deployment with risk acceptance.

## Round 64: Current HEAD Regression and Deploy Impact Refresh

- Date: 2026-06-02
- Status: completed
- Focus: refresh the current local `main` automated MVP baseline and
  deployment approval impact after the four local commits that are ahead of
  `origin/main`, without pushing or deploying.
- Start evidence:
  - Local `main` was clean and ahead of `origin/main` by 4 commits.
  - Current HEAD before edits was `4a3f630f30eb`.
  - `origin/main` was `d0af634314d0`.
  - `docs/MVP-Readiness.md`, `docs/Production-Smoke.md`, and
    `docs/MVP-Launch-Evidence.json` still pointed several headline automated
    or deployment-preflight facts at older Round 47/Round 53/Round 49
    snapshots.
- Open-source reference check:
  - Task classification: repository-specific validation and documentation
    refresh.
  - Sources checked: not needed; no common engineering feature, reusable UI,
    auth/payment/deployment implementation, or OSS pattern was being built.
- Risks:
  - Default regression does not prove production deployment, real WeChat
    domain, real payment/refund, or manual admin/miniapp QA.
  - Deployment preflight predicted `all`; pushing local `main` would trigger
    deployment-relevant workflow paths and still needs the payment lane
    decision before the current-branch deployment evidence can pass.
- Acceptance criteria:
  - Rerun default aggregate MVP regression on current local HEAD.
  - Rerun read-only deployment approval preflight on a clean worktree.
  - Update readiness/state/production/evidence docs with the current facts.
  - Keep unresolved external/manual evidence pending.
  - Run focused evidence/doc checks and commit once.
- Change summary:
  - Refreshed current automated baseline documentation to current local
    `main` HEAD `4a3f630f30eb`.
  - Refreshed deployment approval preflight documentation: comparison base
    `origin/main d0af634314d0`, 28 changed files, predicted push-to-main
    deploy target `all`, and backend/admin/ingress impact counts of 1 file
    each.
  - Kept `CURRENT-BRANCH-DEPLOYED`, WeChat domain, real payment/refund, and
    manual QA evidence pending.
- Verification:
  - `scripts/check_mvp_regression.sh`: passed with 5 enabled default steps.
    Backend `mvn -B test` passed with 57 tests, 0 failures, 0 errors, 0
    skipped. Admin-web lint, 24 Vitest tests across 5 files, production build,
    behavior wiring (97 checks), and external QA preflight (6 checks) passed.
    Miniapp smoke, behavior wiring (69 checks), user-flow replay (3
    scenarios), payment-flow replay (5 scenarios), external preflight, appid
    guard, and subpage nav guard passed. Evidence checks and deploy config
    static checks passed. Production checks were skipped by default.
  - `node scripts/check_deployment_approval_preflight.js`: passed with 4
    checks. Current branch `main`, HEAD `4a3f630f30eb`, comparison base
    `origin/main d0af634314d0`, changed files since base 28, predicted
    push-to-main deploy target `all`, backend-impact files 1, admin-web-impact
    files 1, ingress-impact files 1, and worktree clean. It did not push,
    dispatch, deploy, or mutate production.
- Goal correction:
  - The active MVP goal remains incomplete. This round proves the current
    local automated baseline, but does not prove external/manual QA, real
    payment/refund, HTTPS WeChat legal domain, or current-branch deployment.
- Next recommended round:
  - Decide the deployment/payment lane before pushing: provision real ECS-2
    WeChat Pay production config and rerun strict payment readiness, or choose
    an explicit non-production/mock-payment deployment with risk acceptance.

## Round 63: Active Documentation Compaction

- Date: 2026-06-02
- Status: completed
- Focus: reduce active documentation noise while preserving historical
  traceability and machine-checkable MVP evidence.
- Start evidence:
  - Local `main` was clean and ahead of `origin/main` by 3 commits.
  - `docs/MVP-Progress.md` still carried Rounds 48-62 in the active file.
  - Several early planning docs (`Analytics.md`, `Code-Conventions.md`,
    `Definition-of-Done.md`, `Flows.md`, `IA.md`, `Prototype.md`) lived at the
    top level of `docs/` even though they are historical context, not current
    default loading context.
- Open-source reference check:
  - Task classification: repository-specific documentation compaction.
  - Sources checked: not needed; no common engineering feature, UI component,
    auth/payment/deployment implementation, or reusable OSS pattern was being
    built.
- Risks:
  - Evidence and closeout guard scripts might depend on historical progress
    text.
  - Moving planning docs could leave stale active-document references.
  - Hard-deleting docs would lose useful project traceability.
- Acceptance criteria:
  - Keep current docs focused on active facts, readiness, handoff, API,
    architecture, deployment, and evidence ledgers.
  - Archive historical planning docs instead of deleting them.
  - Keep only latest operational rounds in `docs/MVP-Progress.md`; archive
    older active rounds.
  - Update context index, docs README, project state, decision log, and affected
    references.
  - Preserve machine-checkable evidence and closeout guards.
- Change summary:
  - Moved early planning docs into `docs/archive/planning/`.
  - Moved Rounds 48-57 from active `docs/MVP-Progress.md` to
    `docs/archive/mvp-progress/MVP-Progress-Rounds-48-57.md`; active progress
    now keeps Rounds 58-63.
  - Updated `docs/README.md` and `docs/Context-Index.md` so future work starts
    from fewer canonical docs.
  - Updated `docs/PRD.md` and `docs/Web-Admin-Plan.md` references to archived
    planning paths.
  - Updated `scripts/check_mvp_termination_audit.js` so it validates required
    historical Round 50 text across active and archived MVP progress logs.
- Verification:
  - `node scripts/check_mvp_launch_evidence.js`: passed in non-strict mode with
    13 required launch entries, 5 passed, and 8 pending.
  - `node scripts/check_mvp_closeout_readiness.js`: passed in non-strict mode
    with 32 unresolved required closeout items.
  - `node scripts/check_mvp_handoff_packet.js`,
    `node scripts/check_mvp_next_approval_request.js`,
    `node scripts/check_mvp_external_approval_packet.js`, and
    `node scripts/check_mvp_termination_audit.js`: passed.
  - `RUN_BACKEND=0 RUN_ADMIN=0 RUN_MINIAPP=0 RUN_EVIDENCE=1
    RUN_DEPLOY_CONFIG=1 RUN_PRODUCTION=0 scripts/check_mvp_regression.sh`:
    passed with evidence ledger checks and deploy config static checks enabled.
  - `git diff --check`: passed.
  - Active-doc stale path check for top-level archived planning docs returned
    no matches outside `docs/archive/**`.
- Goal correction:
  - The active MVP goal remains incomplete. This round reduced context bloat
    and preserved evidence checks, but did not collect external/manual QA,
    payment, domain, or current-branch deployment evidence.
- Next recommended round:
  - Resume MVP closeout from `docs/MVP-Handoff-Packet.md` and
    `docs/MVP-Readiness.md`. The next highest-leverage lane remains deciding
    real-payment production config vs explicit non-production/mock-payment
    deployment, or verifying HTTPS/WeChat legal domain under `xiangrikui.cloud`.

## Round 62: Payment Config Readiness Preflight

- Date: 2026-06-02
- Status: completed
- Focus: add a repeatable read-only preflight for the ECS-2 WeChat Pay
  production configuration blocker so future deployment decisions do not need
  to discover missing payment config only after a GitHub Actions deploy fails.
- Start evidence:
  - Local `main` was clean and ahead of `origin/main` by 2 commits.
  - Round 60 GitHub Actions run `26796607775` failed because
    `WECHAT_PAY_MCH_ID` was missing from ECS-2 production env while
    `WECHAT_PAY_MOCK_ENABLED=false`.
  - Round 61 fixed release metadata promotion but did not change the payment
    configuration blocker.
- Open-source reference check:
  - Task classification: common production configuration/readiness preflight
    for payment deployment.
  - Sources checked:
    - WeChat Pay API v3 merchant/Java SDK docs:
      `https://pay.wechatpay.cn/doc/v3/merchant/4012076506` and
      `https://github.com/wechatpay-apiv3/wechatpay-java`.
    - The Twelve-Factor App config guidance:
      `https://12factor.net/config`.
    - Existing repository deployment validation:
      `scripts/validate_prod_env.sh`, `.env.prod.example`, and
      `sunflower-backend/src/main/resources/application-prod.yml`.
  - Selected approach: add a read-only shell preflight that SSHes to ECS-2,
    sources `.env.prod` locally on the server, reports only presence/shape of
    required WeChat Pay variables and key files, and never prints secret values.
  - License/compatibility: no external code copied.
  - Reused/adapted: repository-native SSH/read-only check style from
    `scripts/check_backend_8080_exposure.sh` and the required variable list
    already enforced by `scripts/validate_prod_env.sh`.
  - Rejected options: committing payment credentials, weakening production
    payment validation, or making the normal read-only smoke fail by default
    before the user decides the payment lane.
- Risks:
  - The script must not reveal merchant IDs, API v3 keys, private-key paths
    beyond variable names, or other secrets.
  - The default read-only audit should surface missing payment config as a
    warning/report while still allowing health smoke to complete; strict
    deployment-preflight use can set `ENFORCE_PAYMENT_CONFIG=1`.
- Acceptance criteria:
  - Add `scripts/check_backend_payment_config_readiness.sh` with
    `RUN_INTERNAL=1` ECS-2 inspection and `ENFORCE_PAYMENT_CONFIG=1` strict
    mode.
  - Wire the script into shell syntax/deploy config checks.
  - Wire it into `scripts/check_production_readonly_audit.sh`.
  - Add bounded retry to the read-only audit wrapper so transient public/SSH
    failures do not hide later read-only checks.
  - Update docs so operators know this is a read-only preflight and not proof
    of real payment/refund.
  - Run focused checks and commit once.
- Change summary:
  - Added `scripts/check_backend_payment_config_readiness.sh`.
  - Added the script to `scripts/check_deploy_config.sh` shell syntax coverage.
  - Added the script as a read-only production audit step.
  - Added `AUDIT_STEP_ATTEMPTS` / `AUDIT_STEP_RETRY_DELAY_SECONDS` bounded
    retries to `scripts/check_production_readonly_audit.sh`.
  - Updated deployment/readiness docs and project memory.
- Verification:
  - `bash -n scripts/deploy_lib.sh scripts/validate_prod_env.sh
    scripts/deploy_backend.sh scripts/deploy_admin_web.sh
    scripts/bootstrap_prod.sh scripts/deploy_prod.sh
    scripts/reload_host_nginx.sh scripts/sync_deploy_bundle.sh
    scripts/execute_runner_deploy.sh
    scripts/test_execute_runner_deploy_release_env.sh
    scripts/start_backend_with_mvp_seed.sh scripts/start_admin_web.sh
    scripts/check_backend_payment_config_readiness.sh
    scripts/check_production_readonly_audit.sh scripts/check_deploy_config.sh`:
    passed.
  - `scripts/check_deploy_config.sh`: passed, including workflow YAML parse,
    backend/web compose rendering, shell syntax, runner release metadata
    regression, and deployment Node.js syntax.
  - `node scripts/check_mvp_launch_evidence.js`,
    `node scripts/check_mvp_closeout_readiness.js`,
    `node scripts/check_mvp_handoff_packet.js`,
    `node scripts/check_mvp_next_approval_request.js`, and
    `node scripts/check_mvp_external_approval_packet.js`: passed in
    non-strict/handoff modes; unresolved closeout remains 32 required items.
  - `RUN_INTERNAL=1 scripts/check_backend_payment_config_readiness.sh`:
    completed with sanitized warnings only. It reported 8 payment config
    issues on ECS-2: missing `WECHAT_PAY_MCH_ID`,
    `WECHAT_PAY_MERCHANT_SERIAL_NO`, `WECHAT_PAY_PRIVATE_KEY_PATH`,
    `WECHAT_PAY_PUBLIC_KEY_ID`, `WECHAT_PAY_PUBLIC_KEY_PATH`,
    `WECHAT_PAY_API_V3_KEY`, and invalid `WECHAT_PAY_PAYMENT_NOTIFY_URL` /
    `WECHAT_PAY_REFUND_NOTIFY_URL`.
  - `RUN_INTERNAL=1 ENFORCE_PAYMENT_CONFIG=1
    scripts/check_backend_payment_config_readiness.sh`: expected non-zero;
    it reported the same 8 sanitized issues and exited 1, proving strict mode
    would block another invalid real-payment deployment attempt.
  - `CURL_CONNECT_TIMEOUT=15 scripts/check_production_readonly_audit.sh`:
    passed after bounded audit retry support was added; 4 read-only steps
    completed: deploy config static checks, production public/ECS internal
    smoke, backend `8080` exposure checks, and backend payment config readiness
    check. Production smoke had 7 passes/0 warnings, backend `8080` exposure
    had 5 passes/0 warnings, and payment readiness reported the same 8
    sanitized issues without printing secret values.
  - `git diff --check`: passed.
- Goal correction:
  - The active MVP goal remains incomplete. This round makes the current
    payment configuration blocker easier to verify and hand off, but does not
    provide real WeChat Pay credentials, perform real payment/refund QA, or
    prove current branch deployment.
- Next recommended round:
  - Decide real-payment config vs non-production/mock-payment deployment lane
    before the next push. If real-payment production mode is chosen, provision
    the 8 missing/invalid ECS-2 payment config items, rerun strict payment
    config preflight, then trigger deployment and smoke.

## Round 61: Atomic Release Metadata Guard

- Date: 2026-06-02
- Status: completed
- Focus: prevent failed self-hosted runner deployments from overwriting the
  committed `.release.env`/`.deploy-source-sha` metadata before validation and
  deployment succeed.
- Start evidence:
  - Local `main` was clean and ahead of `origin/main` by 1 commit
    (`4e2d62b`), which documents the Round 60 payment-config deployment
    blocker.
  - Round 60 follow-up run `26796607775` failed during
    `validate_prod_env.sh` because `WECHAT_PAY_MCH_ID` is missing, but ECS-2
    `.release.env` had already been overwritten to the new backend image tag.
    That made release metadata look newer than the actually running backend
    container.
- Open-source reference check:
  - Task classification: common CI/CD deployment reliability and release
    metadata consistency.
  - Sources checked:
    - GitHub Actions deployment workflow docs:
      `https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions`.
    - The Twelve-Factor App config/release separation:
      `https://12factor.net/config`.
    - Existing repository scripts:
      `scripts/execute_runner_deploy.sh`, `scripts/deploy_lib.sh`,
      `scripts/deploy_prod.sh`, and `scripts/check_deploy_config.sh`.
  - Selected approach: write candidate release metadata to pending files,
    point the current deployment process at the pending release env, and only
    atomically move pending files to `.release.env`/`.deploy-source-sha` after
    validation and deployment complete successfully.
  - License/compatibility: no external code copied.
  - Reused/adapted: repository-native shell scripts and existing deploy config
    checker.
  - Rejected options: weakening `validate_prod_env.sh`, treating
    `.release.env` as merely desired-state metadata, or adding a new deployment
    dependency.
- Risks:
  - `deploy_prod.sh` and service scripts must still see the candidate image
    during the deploy attempt, even though the committed `.release.env` remains
    untouched until success.
  - Failed validation/deploy attempts must clean pending files and preserve
    prior release metadata.
- Acceptance criteria:
  - `scripts/execute_runner_deploy.sh` writes `.release.env.pending` and
    `.deploy-source-sha.pending`, exports `RELEASE_ENV_FILE` to the pending
    release env for the current process, and moves pending files into place
    only after successful validation and deployment.
  - A focused regression script proves failed validation preserves old
    `.release.env` and `.deploy-source-sha` and removes pending files.
  - `scripts/check_deploy_config.sh` includes the focused regression.
  - Deployment docs and project state explain that `.release.env` is committed
    release metadata, not pre-validation desired state.
  - Focused deployment checks pass and the round is committed once.
- Change summary:
  - Updated `scripts/execute_runner_deploy.sh` to generate pending release
    metadata, use it for the active deploy attempt, clean it on failure, and
    atomically promote it after success.
  - Added `scripts/test_execute_runner_deploy_release_env.sh` to simulate a
    failed validation and prove old release metadata is preserved.
  - Wired the focused regression into `scripts/check_deploy_config.sh`.
  - Updated deployment docs and project-state memory.
- Verification:
  - `bash -n scripts/deploy_lib.sh scripts/validate_prod_env.sh
    scripts/deploy_backend.sh scripts/deploy_admin_web.sh
    scripts/bootstrap_prod.sh scripts/deploy_prod.sh
    scripts/reload_host_nginx.sh scripts/sync_deploy_bundle.sh
    scripts/execute_runner_deploy.sh
    scripts/test_execute_runner_deploy_release_env.sh
    scripts/start_backend_with_mvp_seed.sh scripts/start_admin_web.sh
    scripts/check_deploy_config.sh`: passed.
  - `bash scripts/test_execute_runner_deploy_release_env.sh`: passed; failed
    validation preserved old `.release.env` and `.deploy-source-sha` and
    cleaned pending files.
  - `scripts/check_deploy_config.sh`: passed, including workflow YAML parse,
    backend/web compose rendering, deployment shell syntax, runner release
    metadata regression, and deployment Node.js syntax.
  - `node scripts/check_mvp_launch_evidence.js`: passed in non-strict mode
    with 13 required launch entries, 5 passed, and 8 pending.
  - `node scripts/check_mvp_closeout_readiness.js`: passed in non-strict mode
    with 32 unresolved required closeout items.
  - `node scripts/check_mvp_handoff_packet.js`,
    `node scripts/check_mvp_next_approval_request.js`, and
    `node scripts/check_mvp_external_approval_packet.js`: passed.
  - `git diff --check`: passed.
- Goal correction:
  - The active MVP goal remains incomplete. This round improves deployment
    evidence reliability, but `CURRENT-BRANCH-DEPLOYED` still requires a
    successful deploy and post-deploy smoke after the payment configuration
    lane is decided.
- Next recommended round:
  - Decide whether to provision real WeChat Pay production config on ECS-2 or
    explicitly run a non-production/mock-payment deployment lane, then rerun
    deployment and smoke.

## Round 60: Current Branch Deployment Attempt

- Date: 2026-06-02
- Status: completed with deployment blocker
- Focus: verify the approved push-to-`main` deployment path for current commit
  `98e68e0dd478`, then follow-up commit `d0af634314d0`, and collect enough
  evidence to decide whether
  `CURRENT-BRANCH-DEPLOYED` can pass.
- Start evidence:
  - User had explicitly stated there is currently no production environment and
    code merge/push is allowed.
  - Round 59 pushed commit `98e68e0dd478` to `origin/main`, triggering GitHub
    Actions run `26796051853` (`Deploy Services To ECS`).
  - Local worktree started clean on `main...origin/main`.
- Open-source reference check:
  - Task classification: common CI/CD deployment evidence and self-hosted
    runner recovery.
  - Sources checked:
    - GitHub Actions workflow syntax and runner/job status conventions:
      `https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions`.
    - GitHub Actions self-hosted runner registration/removal conventions:
      `https://docs.github.com/actions/hosting-your-own-runners/managing-self-hosted-runners`.
    - Existing repository deployment workflow and scripts:
      `.github/workflows/deploy-backend.yml`,
      `scripts/execute_runner_deploy.sh`, `scripts/deploy_backend.sh`, and
      `scripts/check_production_smoke.sh`.
    - WeChat Pay official Java SDK and merchant documentation:
      `https://pay.wechatpay.cn/doc/v3/merchant/4012076506` and
      `https://github.com/wechatpay-apiv3/wechatpay-java`.
  - Selected approach: use `gh run`/`gh api` for workflow evidence, restore the
    existing ECS-2 self-hosted runner registration, and patch repo deployment
    checks to respect the new private backend bind host. Preserve production
    WeChat Pay credential validation because real payment mode requires
    merchant identity, serial/key material, and API v3 key.
  - License/compatibility: no external code copied.
  - Reused/adapted: repository-native deployment scripts and GitHub Actions
    runner service layout already present on ECS hosts.
  - Rejected options: marking `CURRENT-BRANCH-DEPLOYED` passed without a
    completed workflow and smoke evidence, weakening production payment
    validation while `WECHAT_PAY_MOCK_ENABLED=false`, or committing runner
    tokens/secrets.
- Risks:
  - ECS-2's old `ecs-2-backend` runner registration had been deleted by GitHub;
    the service could start locally but could not create a session until
    reconfigured.
  - After runner recovery, the first deployment job still depended on ECS-2
    outbound GitHub connectivity for `actions/checkout`; a follow-up push later
    proved checkout/artifact download could run and shifted the active blocker
    to missing ECS-2 production WeChat Pay environment variables.
  - Backend deploy and production-smoke scripts had stale `127.0.0.1:8080`
    assumptions that no longer match private-IP binding.
- Acceptance criteria:
  - GitHub Actions run status is checked and recorded.
  - ECS-2 runner state is restored or the blocker is documented with evidence.
  - Deployment scripts no longer hard-code loopback backend health after private
    binding.
  - `CURRENT-BRANCH-DEPLOYED` remains pending unless current commit deployment
    and post-deploy smoke are proven.
  - Focused script/document guards pass and the round is committed once.
- Change summary:
  - Re-registered ECS-2 self-hosted runner `ecs-2-backend` after its old
    registration had been deleted from GitHub. The runner became `online` and
    accepted the queued `deploy-backend-host` job.
  - Observed run `26796051853`: `detect-targets`, `build-admin-web`, and
    `build-backend` succeeded; `deploy-backend-host` then remained stuck in
    `Checkout backend deployment bundle source` while fetching commit
    `98e68e0dd478` from GitHub on ECS-2.
  - Confirmed ECS-2 outbound connectivity to GitHub was unhealthy in this
    window: `curl -I -L https://github.com/vutrungduy33/sunflower` timed out
    after 12 seconds.
  - Confirmed ECS-2 `.release.env` still pointed at older image tag
    `f9185fe257cee1b40850ea35c820afd7fdb82946`, so the current commit was not
    proven deployed.
  - Updated `scripts/deploy_backend.sh` so post-deploy HTTP health checks use
    `BACKEND_BIND_HOST` when set, falling back to `127.0.0.1` only for
    wildcard/empty binds.
  - Updated `scripts/check_production_smoke.sh` so ECS-2 internal smoke checks
    backend health through the configured private backend URL rather than
    loopback.
  - Updated launch evidence, readiness, production-smoke, architecture, and
    project-state docs to keep `CURRENT-BRANCH-DEPLOYED` pending.
  - Committed and pushed follow-up deployment-script/doc commits `9e8c087` and
    `d0af634` to `main`, triggering GitHub Actions run `26796607775`.
  - Observed run `26796607775`: `detect-targets` and `build-backend` passed,
    `build-admin-web` was skipped because the target was backend-only, and
    `deploy-backend-host` successfully checked out the deployment bundle,
    synchronized files, downloaded the backend image artifact, loaded the image,
    and confirmed image availability.
  - Run `26796607775` failed in `Deploy backend host locally` at production env
    validation with `[validate] ERROR: WECHAT_PAY_MCH_ID is required`.
    ECS-2 `.release.env` now references image
    `ghcr.io/vutrungduy33/sunflower-backend:d0af634314d01180fe061959beadc93c51a9e33e`,
    but the backend container was not recreated from that image because
    validation failed before deploy. Existing private backend health still
    returns `UP`.
- Verification:
  - `gh run view 26796051853`: head SHA `98e68e0dd478`; build jobs succeeded;
    deploy job reached ECS-2 only after runner re-registration and then stalled
    in checkout.
  - `gh api repos/vutrungduy33/sunflower/actions/runners`: showed
    `ecs-2-backend` online and busy with labels
    `self-hosted,Linux,X64,ecs-backend` after re-registration.
  - ECS-2 read-only probe: backend remained healthy and bound to
    `172.25.121.83:8080`; MySQL remained bound to `127.0.0.1:3306`.
  - `gh run view 26796051853`: final conclusion `cancelled`; deploy-backend
    checkout was cancelled, downstream deploy steps were skipped, and
    deploy-web-host was cancelled.
  - `bash -n scripts/deploy_backend.sh scripts/check_production_smoke.sh
    scripts/check_production_readonly_audit.sh
    scripts/check_backend_8080_exposure.sh`: passed.
  - `scripts/check_deploy_config.sh`: passed.
  - `node scripts/check_mvp_launch_evidence.js`: passed in non-strict mode
    with 13 required launch entries, 5 passed, and 8 pending.
  - `node scripts/check_mvp_closeout_readiness.js`: passed in non-strict mode
    with 32 unresolved required closeout items.
  - `node scripts/check_mvp_handoff_packet.js`,
    `node scripts/check_mvp_next_approval_request.js`,
    `node scripts/check_mvp_external_approval_packet.js`, and
    `node scripts/check_mvp_termination_audit.js`: passed.
  - `RUN_INTERNAL=1 ENFORCE_RESTRICTED=1 scripts/check_backend_8080_exposure.sh`:
    passed with 5 passes and 0 warnings.
  - `node scripts/check_deployment_approval_preflight.js`: passed after
    follow-up approval-boundary wording was restored. Current branch `main`,
    HEAD `d0af634314d0`, comparison base `origin/main` at `98e68e0dd478`,
    changed files since base 10, predicted target `backend`, backend-impact 1.
  - `git push origin main`: pushed `98e68e0..d0af634` to `main`, triggering
    GitHub Actions run `26796607775`.
  - `gh run view 26796607775 --json status,conclusion,name,headSha,createdAt,updatedAt,jobs`:
    completed with conclusion `failure`; backend build succeeded;
    deploy-backend-host failed at the production env validation step because
    `WECHAT_PAY_MCH_ID` is missing.
  - `git diff --check`: passed.
- Goal correction:
  - The active MVP goal remains incomplete. Current branch deployment is not
    proven; unresolved required closeout evidence remains 32 items.
- Next recommended round:
  - Decide the payment configuration lane before rerunning deployment: either
    provision real ECS-2 WeChat Pay production variables and key files for
    `WECHAT_PAY_MOCK_ENABLED=false`, or explicitly change this to a
    non-production/mock-payment deployment with matching risk acceptance. Then
    rerun deployment and post-deploy smoke.

## Round 58: Backend 8080 Hardening

- Date: 2026-06-02
- Status: completed
- Focus: complete the `BACKEND-8080-HARDENING` approval lane by closing direct
  public backend `8080` while preserving ECS-1 private upstream access.
- Start evidence:
  - User explicitly approved the `BACKEND-8080-HARDENING` lane and said backend
    `8080` can be closed.
  - User also said there is currently no production environment and code
    merge/push is allowed; the running ECS services were still treated as live
    infrastructure and changed with verification/rollback.
  - `git status --short --branch --untracked-files=all`: local `main` was ahead
    of `origin/main` by 61 after the Round 57 commit.
  - ECS-2 docker/listener state showed `sunflower-backend` publishing
    `0.0.0.0:8080->8080/tcp`.
- Open-source reference check:
  - Task classification: common production port exposure hardening and
    evidence tracking.
  - Sources checked:
    - Docker Compose service ports reference:
      `https://docs.docker.com/reference/compose-file/services/#ports`.
    - Docker Engine packet filtering/firewall reference:
      `https://docs.docker.com/engine/network/packet-filtering-firewalls/`.
    - Alibaba Cloud ECS security group documentation:
      `https://www.alibabacloud.com/help/en/ecs/user-guide/security-groups`.
    - Ubuntu UFW conventions:
      `https://help.ubuntu.com/community/UFW`.
  - Selected approach: use existing compose support for
    `${BACKEND_BIND_HOST}:${BACKEND_HOST_PORT}:8080` and set the production
    backend bind host to ECS-2 private IP `172.25.121.83`.
  - License/compatibility: no external code copied.
  - Reused/adapted: existing `scripts/check_backend_8080_exposure.sh`,
    `docker-compose.backend.yml`, and production smoke SSH/curl patterns.
  - Rejected options: binding to `127.0.0.1` because ECS-1 would lose private
    upstream access, changing Alibaba Cloud security groups unnecessarily, or
    marking hardening passed while the service still listened on `0.0.0.0`.
- Risks:
  - Recreating `sunflower-backend` briefly restarts the backend service.
  - Binding to the ECS-2 private IP intentionally closes `127.0.0.1:8080` on
    ECS-2; Docker container health and private IP health remain the supported
    checks.
  - Future deploys must preserve `BACKEND_BIND_HOST=172.25.121.83` in the ECS-2
    local `.env.prod`.
- Acceptance criteria:
  - ECS-2 backend published port no longer listens on `0.0.0.0:8080`.
  - ECS-1 can still reach `http://172.25.121.83:8080/api/health`.
  - Public ingress `/api/health` remains healthy.
  - Direct public backend `8080` probe is not usable.
  - `RUN_INTERNAL=1 ENFORCE_RESTRICTED=1 scripts/check_backend_8080_exposure.sh`
    passes without warnings.
  - `BACKEND-8080-HARDENING` is marked passed in
    `docs/MVP-Launch-Evidence.json`.
  - The round is committed once and, after local verification, pushed to `main`
    under the user's approval.
- Change summary:
  - Backed up ECS-2 `/home/chenyao/sunflower/.env.prod` as
    `.env.prod.pre-backend-8080-hardening-20260602`.
  - Changed ECS-2 production `BACKEND_BIND_HOST` from `0.0.0.0` to
    `172.25.121.83` and force-recreated `sunflower-backend`.
  - Updated `.env.prod.example` so future backend host configuration defaults to
    private-IP binding rather than public binding.
  - Updated `scripts/check_backend_8080_exposure.sh` to treat private-IP
    backend binding as valid hardening evidence and to use Docker/private-IP
    health instead of requiring ECS-2 loopback `127.0.0.1:8080`.
  - Marked `BACKEND-8080-HARDENING` passed in
    `docs/MVP-Launch-Evidence.json`.
  - Recorded user-provided miniapp备案 domain `xiangrikui.cloud` as domain
    context only; HTTPS API host and WeChat legal request-domain verification
    remain pending.
- Verification:
  - ECS-2 `docker ps` and `ss`: backend is published as
    `172.25.121.83:8080->8080/tcp`, not `0.0.0.0:8080`.
  - ECS-1 `curl http://172.25.121.83:8080/api/health`: returned backend status
    `UP`.
  - ECS-1 public ingress `/api/health`: returned backend status `UP`.
  - Local public direct probe `http://47.120.42.15:8080/api/health`: not usable.
  - ECS-2 `curl http://172.25.121.83:8080/api/health`: returned backend status
    `UP`; `127.0.0.1:8080` is closed as expected after private binding.
  - `RUN_INTERNAL=1 ENFORCE_RESTRICTED=1 scripts/check_backend_8080_exposure.sh`:
    passed with 5 passes and 0 warnings.
  - Focused repository guards were rerun in Round 59 before the combined commit.
- Goal correction:
  - The active MVP goal remains incomplete, but launch evidence improved from
    13 required entries with 4 passed / 9 pending to 5 passed / 8 pending.
- Next recommended round:
  - Continue with `MINIAPP-PREVIEW-DOMAIN` by verifying HTTPS API host under
    `xiangrikui.cloud`, certificate, and WeChat legal request-domain
    configuration, or proceed with approved current-branch deployment evidence.

## Round 59: Documentation Simplification

- Date: 2026-06-02
- Status: in progress
- Focus: reduce redundant MVP/documentation surface while preserving the
  source-of-truth evidence ledgers and handoff/readiness entry points.
- Start evidence:
  - User requested a documentation simplification round because the repository
    had accumulated too many overlapping documents.
  - Round 58 backend `8080` hardening changes were complete but not yet
    committed, so this cleanup is being verified and committed together with
    that completed hardening lane.
  - Root README and docs README both contained long document lists, and
    `docs/MVP-Progress.md` contained early historical rounds that were no
    longer needed in the active working context.
- Open-source reference check:
  - Task classification: repository-specific documentation pruning.
  - Sources checked: not needed; no common feature, reusable implementation,
    deployment code, payment/auth flow, or UI pattern is being introduced.
  - Selected approach: keep canonical entry documents and machine-readable
    evidence ledgers, archive early progress history, and compact generated
    approval/evidence packets.
  - License/compatibility: no external code copied.
  - Reused/adapted: existing local document guard scripts and evidence ledgers.
  - Rejected options: deleting historical evidence outright, weakening guard
    scripts, or marking external/manual evidence passed during a docs cleanup.
- Risks:
  - Over-pruning could remove handoff context needed by the next Codex run, so
    `Context-Index`, `Project-State`, `MVP-Readiness`, `MVP-Handoff-Packet`,
    and the JSON ledgers remain canonical.
  - Generated compact docs must still include every unresolved evidence ID and
    approval boundary required by the checkers.
- Acceptance criteria:
  - Early MVP progress history is moved to archive while the active progress doc
    keeps recent rounds only.
  - Root README, docs README, and context index point to a smaller set of
    canonical docs instead of duplicating the full document tree.
  - External approval/evidence docs remain guard-valid after compaction.
  - `docs/Project-State.md` records both backend `8080` hardening and the
    documentation simplification result.
  - Focused documentation/evidence/backend-8080 guards and `git diff --check`
    pass.
- Change summary:
  - Moved MVP progress Rounds 1-47 into
    `docs/archive/mvp-progress/MVP-Progress-Rounds-1-47.md` and kept the active
    `docs/MVP-Progress.md` focused on recent rounds.
  - Regenerated `docs/MVP-External-Evidence-Template.md` in a compact reusable
    template form instead of repeating every ledger field for every pending
    item.
  - Replaced `docs/MVP-External-Approval-Packet.md` with a shorter approval
    boundary packet that still includes all approval lanes, unresolved IDs,
    safety text, and validation commands.
  - Compressed root `README.md`, `docs/README.md`, and
    `docs/Context-Index.md` around canonical entry points and ledgers.
  - Preserved evidence ledgers and did not change any external/manual QA status
    beyond the already completed Round 58 backend `8080` hardening result.
- Verification:
  - `node scripts/check_mvp_external_approval_packet.js`: passed; compact
    packet covers 6 approval lanes, 32 unresolved items, 14 safety text items,
    and 8 validation commands.
  - `node scripts/check_mvp_external_evidence_template.js`: passed; compact
    evidence template covers 32 unresolved required items.
  - `node scripts/check_mvp_next_approval_request.js`: passed; next approval
    request covers 6 lanes, 32 unresolved items, 15 safety text items, and 10
    commands.
  - `node scripts/check_mvp_handoff_packet.js`: passed; handoff packet covers
    32 unresolved items, 12 commands, and 8 safety boundaries.
  - `node scripts/check_mvp_termination_audit.js`: passed; closeout audit still
    covers all 6 original termination criteria and the incomplete-evidence
    boundary.
  - `node scripts/check_mvp_launch_evidence.js`: passed in non-strict mode with
    13 required launch entries, 5 passed, and 8 pending.
  - `node scripts/check_mvp_closeout_readiness.js`: passed in non-strict mode
    with 32 unresolved required closeout items.
  - `RUN_INTERNAL=1 ENFORCE_RESTRICTED=1 scripts/check_backend_8080_exposure.sh`:
    passed with 5 passes and 0 warnings.
  - `git diff --check`: passed.
- Goal correction:
  - The active MVP goal remains incomplete. Current unresolved required
    closeout evidence is 32 items: 8 launch evidence entries, 12 miniapp manual
    QA checks, and 12 admin-web manual QA checks.
- Next recommended round:
  - Continue with `MINIAPP-PREVIEW-DOMAIN` by verifying HTTPS API host under
    `xiangrikui.cloud`, certificate, and WeChat legal request-domain
    configuration, or proceed with current-branch deployment evidence after a
    post-push workflow/smoke check.
