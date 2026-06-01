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
| MVP hardening | `docs/MVP-Readiness.md`, `docs/MVP-Launch-Evidence.md`, `docs/MVP-Progress.md`, `docs/MVP-Closeout-Audit.md`, `docs/Project-State.md`, task-relevant app docs |
| Process / decisions | `docs/Decision-Log.md`, then only relevant linked docs |
| Historical diagnosis | `docs/archive/**` only when explicitly needed |

## Do Not Load By Default

- `docs/archive/**`
- `sunflower-miniapp/miniprogram_npm/**`
- `sunflower-admin-web/node_modules/**`
- `sunflower-backend/target/**`
- generated build outputs

## Current Verification Commands

Backend:

```bash
cd sunflower-backend && mvn -B test
```

Admin web:

```bash
cd sunflower-admin-web && npm run lint && npm run test && npm run build
```

Miniapp syntax smoke:

```bash
cd sunflower-miniapp
node ../scripts/check_miniapp_mvp_smoke.js
node --check utils/mvp/api.js
node --check utils/mvp/payment.js
node --check pages/mvp/home/index.js
node --check pages/mvp/login/index.js
node --check pages/mvp/order-create/index.js
node --check pages/mvp/order-list/index.js
```

Production smoke:

```bash
RUN_INTERNAL=1 scripts/check_production_smoke.sh
RUN_INTERNAL=1 scripts/check_backend_8080_exposure.sh
```

Launch evidence:

```bash
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
