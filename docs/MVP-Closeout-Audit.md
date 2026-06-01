# MVP Closeout Audit

> Audit date: 2026-06-02. This is a requirement-by-requirement evidence check
> for the active MVP hardening goal.

## 1. Completion Summary

The repository is substantially closer to MVP readiness, but the full goal is
not complete yet because several explicit launch requirements depend on
external production/mobile validation that is not currently proven.

## 2. Evidence That Is Proven

Local automated checks:

- `cd sunflower-backend && mvn -B test`: passed, 56 tests, 0 failures, 0
  errors, 0 skipped.
- `cd sunflower-admin-web && npm run lint`: passed.
- `cd sunflower-admin-web && npm run test`: passed, 20 tests.
- `cd sunflower-admin-web && npm run build`: passed.
- `node scripts/check_miniapp_mvp_smoke.js`: passed with expected warning that
  the default API base is bare HTTP and only suitable for local/devtools
  validation.
- `bash scripts/check_miniapp_project_config.sh`: passed.
- `bash scripts/check_mvp_subpage_nav.sh`: passed.

Production smoke:

- `RUN_INTERNAL=1 scripts/check_production_smoke.sh`: passed with 7 checks and
  1 known backend-bind warning.
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
  - `docs/Backend-MVP-QA.md`
  - `docs/Admin-Web-MVP-QA.md`
  - `docs/Production-Smoke.md`
  - `docs/MVP-Launch-Evidence.md`

## 3. Requirements Still Not Proven

- WeChat real-device or preview validation for login, phone authorization, and
  payment is not recorded as passed.
- Low-value real WeChat payment and refund with merchant credentials is not
  recorded as passed.
- HTTPS legal request domain for miniapp production is not proven.
- Backend `8080` hardening is not proven. ECS-2 still shows Docker binding
  `0.0.0.0:8080->8080/tcp`; security group/firewall must restrict direct
  backend access to ECS-1.
- Current branch `codex/s18-payment-hardening` has not been pushed/merged to
  `main`, so current repository commits have not triggered production deploy.
- Admin web production manual QA with a real admin account is not recorded as
  passed in this repository.
- `node scripts/check_admin_web_manual_qa.js --strict` currently fails because
  12 required admin manual QA checks remain pending.
- `node scripts/check_mvp_launch_evidence.js --strict` currently fails because
  9 required launch evidence entries remain pending.

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
8. `node scripts/check_admin_web_manual_qa.js --strict` passes or pending admin
   checks are explicitly waived by the user.

## 5. Recommended Next Goal Prompt

```text
继续 /Users/chenyao/dev/miniapp/sunflower 的 MVP 收口，但不要自动推送或部署。
先读取 AGENTS.md、docs/Project-State.md、docs/MVP-Readiness.md、docs/MVP-Closeout-Audit.md、docs/Miniapp-MVP-QA.md、docs/Production-Smoke.md。
目标是补齐外部验证缺口：微信真机/预览登录、手机号授权、低额真实支付/退款、HTTPS 合法域名、admin-web 生产手工 QA、backend 8080 安全组收敛。
每轮必须先分析本轮目标并更新分析/验证文档，再执行最小必要操作，最后运行相关验证并提交一次代码。
常见工程能力开发前必须使用 open-source-reference-first skill，优先查成熟开源/官方实现；若未复用，记录原因、许可证兼容性和拒绝方案。
任何 push main、workflow_dispatch、生产配置修改、安全组修改、真实支付/退款操作前必须停止并请求人工确认。
生产 smoke 使用 RUN_INTERNAL=1 scripts/check_production_smoke.sh；保留 docs/Production-Smoke.md 的最新结果。
当且仅当所有自动化验证绿、生产 smoke 绿、外部验证有证据或用户明确豁免，并且工作区干净且最后一轮已提交时，才把 goal 标记完成。
```
