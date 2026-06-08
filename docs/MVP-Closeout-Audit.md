# MVP Closeout Audit

> Audit date: 2026-06-08. This is a requirement-by-requirement evidence check
> for the active MVP hardening goal.

## 1. Completion Summary

The repository is substantially closer to MVP readiness, but the full goal is
not complete yet because several explicit launch requirements depend on
external production/mobile validation that is not currently proven.

Current completion audit result: **not complete and local-only completion is
not enough**. The strict closeout evidence requirements are still unresolved:
8 launch evidence entries, 12 miniapp manual QA checks, and 12 admin-web manual
QA checks remain pending. This preserves the Round 50 conclusion as a
historical invariant: Round 50 completion audit result: **not complete**.

Round 58 update: `BACKEND-8080-HARDENING` passed after backend `8080` was
rebound to ECS-2 private IP `172.25.121.83` and
`RUN_INTERNAL=1 ENFORCE_RESTRICTED=1 scripts/check_backend_8080_exposure.sh`
passed with 5 passes and 0 warnings. Current strict closeout is still not
complete, but the unresolved total is now 32: 8 launch evidence entries, 12
miniapp manual QA checks, and 12 admin-web manual QA checks.

## 1.1 User Goal Termination Criteria Audit

| Termination criterion | Current evidence | Result |
| --- | --- | --- |
| Backend tests pass and core API health check is usable. | Round 99 default aggregate regression reran backend `mvn -B test`: 57 tests passed with 0 failures/errors/skips. Round 100 read-only production audit passed public/ECS internal smoke. | Proven locally and read-only production healthy. Keep green after future backend changes. |
| Admin-web lint/test/build pass and main operations are usable. | Round 96 direct admin-web validation passed `npm run lint`, `npm run test` with 24 Vitest tests across 5 files, `npm run build`, 97 behavior wiring checks, and 6 external QA preflight checks. Manual production or approved-staging admin QA remains pending. | Automated readiness proven; manual operational evidence not complete. |
| Miniapp main user path has explicit verification record and key JS has no syntax errors. | Round 97 direct miniapp validation passed smoke, behavior wiring, user-flow replay, payment-flow replay, external preflight, and key JavaScript syntax checks. WeChat preview/real-device login, phone binding, HTTPS domain, payment, refund, and order-path manual QA entries remain pending. | Local/replay readiness proven; real WeChat evidence not complete. |
| GitHub automatic deployment pipeline is preserved/explainable, and production smoke is recorded. | `docs/CI-CD.md` and `docs/Architecture.md` describe the single GitHub Actions deploy workflow. Round 100 production read-only audit passed, and Round 91 backend-only `deployment_lane=nonprod-mock-payment` proved reduced-scope backend deployment. Full current-branch production-like deployment evidence remains pending. | Pipeline and smoke are documented; current-branch deployment evidence not complete. |
| `docs/Project-State.md`, `docs/MVP-Readiness.md`, and `docs/Decision-Log.md` reflect current facts. | Project-state and readiness are maintained as current active state docs; decision log records durable process and evidence decisions. Round 103 refreshed architecture/CI-CD facts and Round 104/Round 105 aligned readiness and fresh-goal handoff facts. | Current docs are maintained; keep them synchronized after each round. |
| Worktree is clean and final round has committed code. | Each round must recheck `git status --short --branch --untracked-files=all` before closeout. The active goal cannot be complete while this round has uncommitted changes. | Must be rechecked after the final commit. |

Completion conclusion: the active MVP goal cannot be marked complete until the
manual/external evidence is collected or explicitly waived and the strict
closeout commands pass.

## 2. Evidence That Is Proven

Local automated checks:

- `scripts/check_mvp_regression.sh`: passed in Round 99 with backend/admin/miniapp/evidence checks enabled and production checks skipped by default.
- `RUN_PRODUCTION=1 scripts/check_mvp_regression.sh`: passed again in Round 39
  on 2026-06-02 08:58 Asia/Shanghai at pre-commit HEAD `255558f001e9` with
  backend/admin/miniapp/evidence/deploy-config/production checks enabled.
- `RUN_PRODUCTION=1 scripts/check_mvp_regression.sh`: passed again in Round 47
  on local `main` HEAD `8d9b11d` with production read-only checks enabled.
- `cd sunflower-backend && mvn -B test`: passed in the Round 99 aggregate baseline, 57 tests, 0 failures, 0 errors, 0 skipped.
- `cd sunflower-admin-web && npm run lint`: passed in Round 96.
- `cd sunflower-admin-web && npm run test`: passed in Round 96, 24 tests across 5 files.
- `cd sunflower-admin-web && npm run build`: passed in Round 96.
- `node scripts/check_miniapp_mvp_smoke.js`: passed in Round 97 with expected warning that the default API base is bare HTTP and only suitable for local/devtools validation.
- `bash scripts/check_miniapp_project_config.sh`: passed.
- `bash scripts/check_mvp_subpage_nav.sh`: passed.

Production smoke:

- Production checks inside `RUN_PRODUCTION=1 scripts/check_mvp_regression.sh`:
  passed again on 2026-06-02 08:58 Asia/Shanghai with production smoke and
  backend `8080` read-only exposure checks enabled.
- Production checks inside the Round 47
  `RUN_PRODUCTION=1 scripts/check_mvp_regression.sh` run passed again on
  local `main` HEAD `8d9b11d`.
- Round 100 `scripts/check_production_readonly_audit.sh` passed production
  smoke with 7 passes and 0 warnings.
- Round 100 backend `8080` exposure checks passed with 5 passes and 0 warnings,
  confirming the backend is bound to `172.25.121.83:8080` rather than the
  public interface.
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
  machine-checked entry point for the 32 unresolved required closeout items.

## 3. Latest Strict Closeout Result

Historical pre-hardening baseline: Round 48 reran the strict closeout commands
after the Round 47 automated baseline:

- `node scripts/check_mvp_launch_evidence.js --strict`: expected non-zero,
  because 9 required launch evidence entries remain pending.
- `node scripts/check_miniapp_manual_qa.js --strict`: expected non-zero,
  because 12 required miniapp manual QA checks remain pending.
- `node scripts/check_admin_web_manual_qa.js --strict`: expected non-zero,
  because 12 required admin-web manual QA checks remain pending.
- `node scripts/check_mvp_closeout_readiness.js --strict`: expected non-zero,
  because 33 required closeout items remain unresolved.

These historical strict failures were not automated-regression failures. They
showed the same evidence-gated completion boundary before backend `8080`
hardening reduced the current launch-evidence blocker count.

Round 50 reran the non-strict closeout/evidence summaries and confirmed the
same historical unresolved shape:

- Launch evidence: 13 required entries, 4 passed, 9 pending.
- Miniapp manual QA: 12 required checks, 0 passed, 12 pending.
- Admin-web manual QA: 12 required checks, 0 passed, 12 pending.
- Aggregate closeout: 33 unresolved required items.

Round 56 reran the strict closeout commands on local `main` HEAD
`d9db23166dba` and confirmed the same historical unresolved shape still blocked
completion at that time:

- `node scripts/check_mvp_launch_evidence.js --strict`: failed because 9
  required launch entries remain pending.
- `node scripts/check_miniapp_manual_qa.js --strict`: failed because 12
  required miniapp manual QA checks remain pending.
- `node scripts/check_admin_web_manual_qa.js --strict`: failed because 12
  required admin-web manual QA checks remain pending.
- `node scripts/check_mvp_closeout_readiness.js --strict`: failed because 33
  required closeout items remain unresolved.

These failures are approval/evidence blockers, not new local automated code
regressions. Further local-only reruns of already-green automated baselines will
not make the strict closeout commands pass.

Round 58 changed the launch-evidence shape:

- Launch evidence: 13 required entries, 5 passed, 8 pending.
- Miniapp manual QA: 12 required checks, 0 passed, 12 pending.
- Admin-web manual QA: 12 required checks, 0 passed, 12 pending.
- Aggregate closeout: 32 unresolved required items.

Round 106 keeps the current closeout shape machine-checked by deriving the
termination-audit guard from the three active ledgers instead of hardcoding the
older pre-8080-hardening 33-item count.

## 4. Requirements Still Not Proven

- WeChat real-device or preview validation for login, phone authorization, and
  payment is not recorded as passed.
- `node scripts/check_miniapp_manual_qa.js --strict` currently fails because 12
  required miniapp manual QA checks remain pending.
- Low-value real WeChat payment and refund with merchant credentials is not
  recorded as passed.
- HTTPS legal request domain for miniapp production is not proven.
- Backend `8080` hardening passed in Round 58. ECS-2 now publishes backend only
  on private IP `172.25.121.83:8080`, ECS-1 private upstream remains healthy,
  and public direct backend `8080` is not usable.
- Current-branch deployment evidence remains pending until an approved push,
  merge, or workflow dispatch is verified with clean deployment preflight and
  post-deploy smoke.
- Admin web production manual QA with a real admin account is not recorded as
  passed in this repository.
- `node scripts/check_admin_web_manual_qa.js --strict` currently fails because
  12 required admin manual QA checks remain pending.
- `node scripts/check_mvp_launch_evidence.js --strict` currently fails because
  8 required launch evidence entries remain pending.
- `node scripts/check_mvp_closeout_readiness.js --strict` currently fails
  because 32 required closeout items remain unresolved across launch, miniapp
  manual QA, and admin-web manual QA ledgers.

## 5. Goal Status

Keep the active goal open until the blocker policy permits marking it blocked,
or until the user provides the required approval/evidence/waiver inputs. Do not
continue infinite local-only refresh rounds after Round 56; the next meaningful
step must be one explicit approval lane from `docs/MVP-Next-Approval-Request.md`
or an itemized evidence/waiver packet.

Do not call the MVP complete until:

1. Backend/admin/miniapp automated checks remain green.
2. WeChat preview/real-device miniapp checklist in `docs/Miniapp-MVP-QA.md` is
   executed and recorded.
3. Real payment/refund smoke is executed with production merchant configuration
   or explicitly waived by the user.
4. HTTPS/domain setup is verified for the miniapp request domain.
5. Backend direct `8080` exposure remains restricted after future backend
   redeploys or production network changes.
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

## 6. Recommended Next Goal Prompt

Use `docs/MVP-Next-Goal-Prompt.md` as the current finite Codex goal prompt for
continuing MVP closeout from this baseline. It supersedes the older inline
prompt in this audit and keeps the per-round commit rule, open-source
reference-first rule, approval boundaries, and strict completion criteria in
one maintained place.
