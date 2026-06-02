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
| Architecture / deployment | `docs/Architecture.md`, `docs/CI-CD.md`, `docs/S19-Prod-Deployment-Config.md`, `docs/Production-Smoke.md`, compose files |
| Backend API / contracts | `docs/API.md`, `docs/API-Schemas.md`, `docs/Backend-MVP-QA.md`, `sunflower-backend/src/main/java/**`, backend tests |
| Database / persistence | `docs/DB-Design.md`, `docs/DataDictionary.md`, Flyway migrations, seed SQL |
| Admin web | `docs/Web-Admin-Plan.md`, `docs/Admin-Web-MVP-QA.md`, `sunflower-admin-web/src/**`, admin web tests |
| Miniapp | `docs/Miniapp-Frontend-MVP.md`, `docs/Miniapp-MVP-QA.md`, `docs/Miniapp-Manual-QA.md`, `sunflower-miniapp/pages/mvp/**`, `sunflower-miniapp/utils/mvp/**` |
| MVP hardening | Start with `docs/MVP-Handoff-Packet.md`, `docs/MVP-Readiness.md`, `docs/Project-State.md`, and the JSON ledgers (`docs/MVP-Launch-Evidence.json`, `docs/Miniapp-Manual-QA.json`, `docs/Admin-Web-Manual-QA.json`). Then load task-relevant docs such as `docs/MVP-Next-Approval-Request.md`, `docs/MVP-External-Approval-Packet.md`, `docs/MVP-Closeout-Audit.md`, or app QA docs only when needed. |
| New Codex MVP goal | `docs/MVP-Next-Goal-Prompt.md`, `docs/MVP-Handoff-Packet.md`, `docs/MVP-Readiness.md`, `docs/Project-State.md`, and task-relevant approval/evidence docs |
| Component handoff docs | `sunflower-miniapp/README.md`, `sunflower-admin-web/README.md`, `sunflower-backend/README.md`, plus the matching QA docs above |
| Process / decisions | `docs/Decision-Log.md`, then only relevant linked docs |
| Historical diagnosis | `docs/archive/**` only when explicitly needed |

## Do Not Load By Default

- `docs/archive/**`
- `docs/archive/mvp-progress/**`
- `sunflower-miniapp/miniprogram_npm/**`
- `sunflower-admin-web/node_modules/**`
- `sunflower-backend/target/**`
- generated build outputs

## Current Goal Prompt

- `docs/MVP-Next-Goal-Prompt.md`: finite Codex goal prompt for continuing the
  MVP closeout from the current baseline, including approval boundaries,
  per-round commit requirements, open-source reference-first rules, and final
  strict completion criteria.

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
RUN_INTERNAL=1 scripts/check_production_smoke.sh
RUN_INTERNAL=1 scripts/check_backend_8080_exposure.sh
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
