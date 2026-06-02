# Context Index

> This is the loading map for future Codex work. Prefer this over scanning the
> whole repository at the start of every task.

## Always Read

- `AGENTS.md`: active agent entry point and workflow rules.
- `docs/Agent-Memory.md`: memory/context management rules.
- `docs/Project-State.md`: compact current project facts, validation status, and risks.
- `git status --short --untracked-files=all`: current worktree reality.

## Read By Task

| Task | Read |
| --- | --- |
| Architecture / deployment | `docs/Architecture.md`, `docs/CI-CD.md`, `docs/S19-Prod-Deployment-Config.md`, compose files, and deployment scripts. Load `docs/Production-Smoke.md` only for production-smoke evidence/history. |
| Backend API / contracts | `docs/API.md`, `docs/API-Schemas.md`, `sunflower-backend/src/main/java/**`, backend tests. Load `docs/Backend-MVP-QA.md` only for QA checklist updates. |
| Database / persistence | `docs/DB-Design.md`, `docs/DataDictionary.md`, Flyway migrations, seed SQL |
| Admin web | `sunflower-admin-web/src/**`, admin web tests, `docs/Web-Admin-Plan.md` only for architecture/scope, and `docs/Admin-Web-MVP-QA.md` only for QA checklist updates. |
| Miniapp | `sunflower-miniapp/pages/mvp/**`, `sunflower-miniapp/utils/mvp/**`, `docs/Miniapp-Frontend-MVP.md` only for frontend handoff, and miniapp QA docs only for evidence updates. |
| MVP hardening | Start with `docs/MVP-Handoff-Packet.md`, `docs/MVP-Readiness.md`, `docs/Project-State.md`, and the JSON ledgers (`docs/MVP-Launch-Evidence.json`, `docs/Miniapp-Manual-QA.json`, `docs/Admin-Web-Manual-QA.json`). Load approval packets, closeout audit, runbooks, or app QA docs only for the selected evidence lane. |
| New Codex MVP goal | `docs/MVP-Next-Goal-Prompt.md`, `docs/MVP-Handoff-Packet.md`, `docs/MVP-Readiness.md`, `docs/Project-State.md`, and only task-relevant approval/evidence docs |
| Component handoff docs | `sunflower-miniapp/README.md`, `sunflower-admin-web/README.md`, `sunflower-backend/README.md`, plus matching QA docs only when updating that component's QA scope |
| Product background / early planning | `docs/PRD.md`, then `docs/archive/planning/**` only when the task needs historical IA, flows, prototype, analytics, code convention, or definition-of-done context |
| Process / decisions | `docs/Decision-Log.md`, then only relevant linked docs |
| Historical diagnosis | `docs/archive/**` only when explicitly needed |

## Do Not Load By Default

- `docs/archive/**`
- `docs/archive/mvp-progress/**`
- `docs/archive/planning/**`
- `sunflower-miniapp/miniprogram_npm/**`
- `sunflower-admin-web/node_modules/**`
- `sunflower-backend/target/**`
- generated build outputs

## Current Goal Prompt

- `docs/MVP-Next-Goal-Prompt.md`: finite Codex goal prompt for continuing the
  MVP closeout from the current baseline, including approval boundaries,
  per-round commit requirements, open-source reference-first rules, and final
  strict completion criteria.

## Documentation Compaction Rule

- Keep active docs small. Prefer updating `docs/Project-State.md` with compact
  current facts and `docs/MVP-Progress.md` with only recent round summaries.
- Do not create new status/runbook docs unless an existing canonical doc cannot
  carry the information.
- Historical planning, old stage material, and old round detail are cold
  context under `docs/archive/` or git history.

## Current Verification Commands

Aggregate MVP regression:

```bash
scripts/check_mvp_regression.sh
RUN_PRODUCTION=1 scripts/check_mvp_regression.sh
```

Backend:

```bash
cd sunflower-backend && mvn -B test
```

Admin web:

```bash
(cd sunflower-admin-web && npm run lint && npm run test && npm run build)
node scripts/check_admin_web_behavior_wiring.js
node scripts/check_admin_web_external_qa_preflight.js
```

Miniapp syntax smoke:

```bash
cd sunflower-miniapp
node ../scripts/check_miniapp_mvp_smoke.js
node ../scripts/check_miniapp_behavior_wiring.js
node ../scripts/check_miniapp_user_flow_replay.js
node ../scripts/check_miniapp_payment_flow_replay.js
node ../scripts/check_miniapp_external_qa_preflight.js
node --check utils/mvp/api.js
node --check utils/mvp/payment.js
node --check pages/mvp/home/index.js
node --check pages/mvp/login/index.js
node --check pages/mvp/order-create/index.js
node --check pages/mvp/order-list/index.js
```

Production smoke:

```bash
node scripts/check_deployment_approval_preflight.js
scripts/check_production_readonly_audit.sh
scripts/check_deploy_config.sh
node scripts/check_workflow_dispatch_lane_matrix.js
RUN_INTERNAL=1 scripts/check_production_smoke.sh
RUN_INTERNAL=1 scripts/check_backend_8080_exposure.sh
RUN_INTERNAL=1 scripts/check_backend_payment_config_readiness.sh
RUN_INTERNAL=1 ENFORCE_PAYMENT_CONFIG=1 scripts/check_backend_payment_config_readiness.sh
bash scripts/check_nonprod_mock_payment_deploy_lane.sh
```

Launch evidence:

```bash
node scripts/check_mvp_external_runbook.js
node scripts/generate_mvp_external_evidence_template.js
node scripts/check_mvp_external_evidence_template.js
node scripts/check_mvp_external_approval_packet.js
node scripts/check_mvp_next_approval_request.js
node scripts/check_mvp_handoff_packet.js
node scripts/check_mvp_termination_audit.js
node scripts/check_mvp_closeout_readiness.js
node scripts/check_mvp_closeout_readiness.js --strict
node scripts/check_mvp_launch_evidence.js
node scripts/check_mvp_launch_evidence.js --strict
```

Miniapp manual QA evidence:

```bash
node scripts/check_miniapp_manual_qa.js
node scripts/check_miniapp_manual_qa.js --strict
```

Admin manual QA evidence:

```bash
node scripts/check_admin_web_manual_qa.js
node scripts/check_admin_web_manual_qa.js --strict
```

## Open-Source Reference Trigger

Use the `open-source-reference-first` skill before implementing common,
well-known features or infrastructure. Record the reference check in the
progress document or final summary.
