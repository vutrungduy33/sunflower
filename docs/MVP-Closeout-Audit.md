# MVP Closeout Audit

> Audit date: 2026-06-02. This is a requirement-by-requirement evidence check
> for the active MVP hardening goal.

## 1. Completion Summary

The repository is substantially closer to MVP readiness, but the full goal is
not complete yet because several explicit launch requirements depend on
external production/mobile validation that is not currently proven.

## 2. Evidence That Is Proven

Local automated checks:

- `scripts/check_mvp_regression.sh`: passed with backend/admin/miniapp/evidence
  checks enabled and production checks skipped by default.
- `RUN_PRODUCTION=1 scripts/check_mvp_regression.sh`: passed on 2026-06-02
  with backend/admin/miniapp/evidence/deploy-config/production checks enabled.
- `cd sunflower-backend && mvn -B test`: passed, 57 tests, 0 failures, 0
  errors, 0 skipped.
- `cd sunflower-admin-web && npm run lint`: passed.
- `cd sunflower-admin-web && npm run test`: passed, 23 tests.
- `cd sunflower-admin-web && npm run build`: passed.
- `node scripts/check_miniapp_mvp_smoke.js`: passed with expected warning that
  the default API base is bare HTTP and only suitable for local/devtools
  validation.
- `bash scripts/check_miniapp_project_config.sh`: passed.
- `bash scripts/check_mvp_subpage_nav.sh`: passed.

Production smoke:

- Production checks inside `RUN_PRODUCTION=1 scripts/check_mvp_regression.sh`:
  passed on 2026-06-02 07:33 Asia/Shanghai with production smoke and backend
  `8080` read-only exposure checks enabled.
- `RUN_INTERNAL=1 scripts/check_production_smoke.sh`: passed with 7 checks and
  1 known backend-bind warning.
- `RUN_INTERNAL=1 scripts/check_backend_8080_exposure.sh`: passed read-only
  checks with 3 passes and 2 warnings; this does not prove security group
  restriction.
- `http://47.113.223.248/api/health`: 200.
- `http://47.113.223.248/api/content/home`: 200.
- `http://47.113.223.248/healthz`: 200.
- `http://47.113.223.248/`: 200 admin web HTML.
- ECS-1 Nginx active; `sunflower-admin-web` healthy.
- ECS-2 `sunflower-backend` and `sunflower-mysql` healthy.
- ECS-1 can reach ECS-2 backend over private upstream.

Workflow and docs:

- Active workflow is `.github/workflows/deploy-backend.yml`.
- Workflow triggers are `workflow_dispatch` and `push` to `main` for
  deployment-relevant paths.
- GitHub CLI can access Actions and list deploy workflow runs.
- MVP trackers now exist:
  - `docs/MVP-Readiness.md`
  - `docs/MVP-Progress.md`
  - `docs/Miniapp-MVP-QA.md`
  - `docs/Miniapp-Manual-QA.md`
  - `docs/Backend-MVP-QA.md`
  - `docs/Admin-Web-MVP-QA.md`
  - `docs/Production-Smoke.md`
  - `docs/MVP-Launch-Evidence.md`
- `node scripts/check_mvp_closeout_readiness.js` now summarizes launch,
  miniapp manual QA, and admin-web manual QA closeout status in one place.
- `docs/MVP-Handoff-Packet.md` now gives the next operator a compact,
  machine-checked entry point for the 33 unresolved required closeout items.

## 3. Requirements Still Not Proven

- WeChat real-device or preview validation for login, phone authorization, and
  payment is not recorded as passed.
- `node scripts/check_miniapp_manual_qa.js --strict` currently fails because 12
  required miniapp manual QA checks remain pending.
- Low-value real WeChat payment and refund with merchant credentials is not
  recorded as passed.
- HTTPS legal request domain for miniapp production is not proven.
- Backend `8080` hardening is not proven. ECS-2 still shows Docker binding
  `0.0.0.0:8080->8080/tcp`; security group/firewall must restrict direct
  backend access to ECS-1. The read-only 8080 check confirms local public probe
  unavailable and ECS-1 private upstream works, but local firewall output did
  not prove restriction.
- Current branch `codex/s18-payment-hardening` has not been pushed/merged to
  `main`, so current repository commits have not triggered production deploy.
- Admin web production manual QA with a real admin account is not recorded as
  passed in this repository.
- `node scripts/check_admin_web_manual_qa.js --strict` currently fails because
  12 required admin manual QA checks remain pending.
- `node scripts/check_mvp_launch_evidence.js --strict` currently fails because
  9 required launch evidence entries remain pending.
- `node scripts/check_mvp_closeout_readiness.js --strict` currently fails
  because 33 required closeout items remain unresolved across launch, miniapp
  manual QA, and admin-web manual QA ledgers.

## 4. Goal Status

Keep the active goal open.

Do not call the MVP complete until:

1. Backend/admin/miniapp automated checks remain green.
2. WeChat preview/real-device miniapp checklist in `docs/Miniapp-MVP-QA.md` is
   executed and recorded.
3. Real payment/refund smoke is executed with production merchant configuration
   or explicitly waived by the user.
4. HTTPS/domain setup is verified for the miniapp request domain.
5. Backend direct `8080` exposure is restricted or explicitly accepted as a
   documented risk by the user.
6. Current code is deployed through the approved GitHub Actions path, or the
   user explicitly decides deployment is out of scope for MVP closeout.
7. `node scripts/check_mvp_launch_evidence.js --strict` passes.
8. `node scripts/check_miniapp_manual_qa.js --strict` passes or pending miniapp
   checks are explicitly waived by the user.
9. `node scripts/check_admin_web_manual_qa.js --strict` passes or pending admin
   checks are explicitly waived by the user.
10. `node scripts/check_mvp_closeout_readiness.js --strict` passes as the final
    aggregate completion guard.
11. `node scripts/check_mvp_handoff_packet.js` passes so the handoff entry stays
    synchronized with the unresolved evidence ledgers while the goal remains
    open.

## 5. Recommended Next Goal Prompt

Use `docs/MVP-Next-Goal-Prompt.md` as the current finite Codex goal prompt for
continuing MVP closeout from this baseline. It supersedes the older inline
prompt in this audit and keeps the per-round commit rule, open-source
reference-first rule, approval boundaries, and strict completion criteria in
one maintained place.
