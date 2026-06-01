# Project State

> Compact current state for future Codex runs. Update this file when durable
> project facts, validation status, risks, or canonical docs change.

## Last Updated

2026-06-02

## Current Workflow

- Stage-first workflow, stage guard, branch prefix, commit prefix, and GitHub PR
  gate have been removed.
- Active deployment workflow is `.github/workflows/deploy-backend.yml`.
- Historical stage and gate materials are archived under `docs/archive/`.
- Local secrets belong under `.secrets/`, which is ignored by Git.

## Current Architecture

- Miniapp: `sunflower-miniapp`, native WeChat mini program, MVP pages under
  `pages/mvp`.
- Admin web: `sunflower-admin-web`, React + TypeScript + Vite + TDesign React.
- Backend: `sunflower-backend`, Spring Boot monolith with MySQL + Flyway.
- Production topology:
  - ECS-1 `47.113.223.248` / `172.25.121.84`: host Nginx + admin-web + public API ingress.
  - ECS-2 `47.120.42.15` / `172.25.121.83`: backend + MySQL.
- Canonical architecture doc: `docs/Architecture.md`.

## Recent Validation Snapshot

Current snapshot after 2026-06-02 Round 1:

- Backend `mvn -B test`: passed, 56 tests in the prior baseline; not rerun in
  Round 1.
- Admin web `npm run lint`: passed in Round 1.
- Admin web `npm run test`: passed, 20 tests in Round 1.
- Admin web `npm run build`: passed in Round 1.
- Miniapp JS syntax smoke for MVP API/payment/core pages: passed in the prior
  baseline; not rerun in Round 1.
- Production `http://47.113.223.248/api/health`: returned 200 in the prior
  baseline; not rerun in Round 1.
- Production `http://47.113.223.248/api/content/home`: returned 200 in the prior
  baseline; not rerun in Round 1.

## Known MVP Risks

- Miniapp real-device validation for WeChat login, phone binding, and payment is
  not yet documented as passed.
- Miniapp default API base is still bare HTTP IP for devtools validation; final
  production requires HTTPS legal WeChat request domain.
- Backend container observed binding public `0.0.0.0:8080`; security group should
  restrict direct backend access to ECS-1 where possible.
- Some component README files still contain older MVP wording and should be
  refreshed before handoff.

## Current Dirty Worktree Note

After the Round 1 commit, no intended MVP Round 1 files should remain
uncommitted.
