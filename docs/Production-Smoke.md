# Production Smoke

> Latest deployment attempt: 2026-06-02 Round 60. This records observed
> deployment/smoke facts for the MVP hardening goal. It does not prove current
> `main` is deployed until the workflow and post-deploy smoke complete.

## 0. Repeatable Script

Canonical read-only production audit command:

```bash
scripts/check_production_readonly_audit.sh
```

Production smoke sub-command:

```bash
RUN_INTERNAL=1 scripts/check_production_smoke.sh
```

The audit wrapper runs deploy config static checks, public production smoke, ECS
internal smoke, and backend `8080` exposure inspection. It uses the ignored local
SSH key at `.secrets/aliyun_mba_codex.pem` for ECS checks. It does not push,
deploy, reload Nginx, or change ECS/firewall/security-group state.

Latest deployment attempt:

- GitHub Actions run `26796051853` was triggered by push to `main` at commit
  `98e68e0dd478`.
- `detect-targets`, `build-admin-web`, and `build-backend` completed
  successfully.
- ECS-2 self-hosted runner `ecs-2-backend` had a deleted GitHub registration;
  it was re-registered and became online/busy with labels
  `self-hosted,Linux,X64,ecs-backend`.
- The deployment then stalled in `Checkout backend deployment bundle source`
  while ECS-2 fetched `98e68e0` from GitHub. A 12-second ECS-2 curl probe to
  `https://github.com/vutrungduy33/sunflower` timed out.
- ECS-2 `.release.env` still pointed at older image tag
  `f9185fe257cee1b40850ea35c820afd7fdb82946`; therefore current commit
  deployment is not proven and `CURRENT-BRANCH-DEPLOYED` remains pending.
- Follow-up commits `9e8c087` and `d0af634` were pushed to `main`, triggering
  GitHub Actions run `26796607775` for commit `d0af634314d0`.
- Run `26796607775` passed `detect-targets` and `build-backend`; `build-admin-web`
  was skipped because the detected target was backend-only.
- `deploy-backend-host` successfully checked out the deployment bundle,
  synchronized files, downloaded the backend image artifact, loaded the image,
  and confirmed image availability on ECS-2.
- The run failed in `Deploy backend host locally` during production env
  validation: `WECHAT_PAY_MCH_ID is required`.
- ECS-2 `.release.env` now references backend image
  `ghcr.io/vutrungduy33/sunflower-backend:d0af634314d01180fe061959beadc93c51a9e33e`,
  but the backend container was not recreated from that image because
  validation failed before deployment. Existing private backend health remains
  `UP`.

Latest read-only production result:

- `scripts/check_production_readonly_audit.sh`: last full wrapper pass was in
  Round 46 on local `main` at HEAD `758729091785`.
- Deploy config static checks passed.
- Production public/ECS internal smoke passed with 7 checks and 1 warning:
  ECS-2 backend still listens on `0.0.0.0:8080`.
- Backend `8080` exposure check passed with 3 checks and 2 warnings: public
  `8080` was not directly usable from this local network, ECS-1 private
  upstream worked, ECS-2 backend health was present, but local firewall output
  did not prove restriction.
- No deployment, push, workflow dispatch, Nginx reload, ECS mutation, firewall
  mutation, security-group mutation, or production configuration change was
  performed.

Previous read-only production result:

- `RUN_PRODUCTION=1 scripts/check_mvp_regression.sh`: production smoke and
  backend `8080` read-only checks passed in Round 39 as part of the 6-step
  aggregate MVP regression at pre-commit HEAD `255558f001e9`.
- Deploy config static checks passed.
- 7 checks passed.
- 1 warning remained: ECS-2 backend still listens on `0.0.0.0:8080`.
- Backend `8080` exposure check passed with 3 checks and 2 warnings.
- No deployment, push, or production configuration change was performed.

Latest deployment approval preflight:

- `node scripts/check_deployment_approval_preflight.js`: passed 4 checks in
  Round 49.
- Current branch: local `main`.
- Current branch HEAD: `a072612b94a6`.
- Comparison base: `origin/main` at `89f93d704719`.
- Changed files since base: 145.
- Predicted push-to-main deploy target from workflow path rules: `all`.
- Impact counts: backend 38 files, admin-web 5 files, ingress 1 file.
- Worktree was clean for the preflight run. The current branch is `main`, so
  pushing deployment-relevant changes can trigger production deployment. No
  deployment, push, workflow dispatch, or production configuration change was
  performed.

## 1. GitHub Actions

- Active workflow: `.github/workflows/deploy-backend.yml`
- Workflow name: `Deploy Services To ECS`
- Triggers:
  - `workflow_dispatch`
  - `push` to `main` for deployment-relevant paths
- Current branch during latest deployment preflight:
  `main`
- Current branch HEAD during latest deployment preflight: `a072612b94a6`
- Deployment action taken in this round: none
- `gh auth status`: authenticated as `vutrungduy33` with `repo` and `workflow`
  scopes.
- Recent workflow history from `gh run list --workflow deploy-backend.yml`:
  - Latest listed run: success on `main` push, 2026-03-27T12:22:12Z.
  - Earlier S19 setup attempts include failures before the successful run.

## 2. Public Smoke

Equivalent public commands:

```bash
curl -fsS http://47.113.223.248/api/health
curl -fsS http://47.113.223.248/api/content/home
curl -fsS http://47.113.223.248/healthz
curl -fsSI http://47.113.223.248/
```

Latest scripted/manual result:

- `http://47.113.223.248/api/health`: 200, backend status `UP`.
- `http://47.113.223.248/api/content/home`: 200, returned home content.
- `http://47.113.223.248/healthz`: 200, body `ok`.
- `http://47.113.223.248/`: 200, served admin web HTML through Nginx.

Direct backend public probe:

```bash
curl -fsS http://47.120.42.15:8080/api/health
```

Observed result:

- Not directly usable from this local network during the scripted smoke.
- Round 58 hardened backend `8080`; ECS-2 now shows the backend host port bound
  to `172.25.121.83:8080`, not `0.0.0.0:8080`.

## 3. ECS Internal Smoke

ECS-1 web/ingress host `47.113.223.248`:

- Hostname: `iZf8z7qgoqeas4i6miivydZ`
- `systemctl is-active nginx`: `active`
- `sunflower-admin-web`: `Up 2 months (healthy)`, bound to
  `127.0.0.1:18080->80/tcp`
- `curl http://127.0.0.1:18080/healthz`: `ok`
- `curl http://172.25.121.83:8080/api/health`: 200, backend status `UP`

ECS-2 backend/data host `47.120.42.15`:

- Hostname: `iZf8z1jk7at5emkxytu7d2Z`
- `sunflower-backend`: healthy, bound to `172.25.121.83:8080->8080/tcp`
- `sunflower-mysql`: `Up About an hour (healthy)`,
  `127.0.0.1:3306->3306/tcp`
- `curl http://172.25.121.83:8080/api/health`: 200, backend status `UP`
- `ss -ltnp`: confirms MySQL local-only and backend listening on all interfaces
  through docker-proxy.

Latest Round 46 production read-only audit reconfirmed the same health shape:

- ECS-1 Nginx/admin-web/private backend smoke passed.
- ECS-2 backend/MySQL/local health smoke passed.
- Public direct backend `8080` probe was not directly usable from this local
  network.
- Round 58 later changed ECS-2 backend binding to private IP
  `172.25.121.83:8080`; backend `8080` hardening is now tracked in
  `docs/Backend-8080-Security.md`.

## 4. Current Production Risks

- HTTPS/domain validation is not proven in this smoke. Miniapp production still
  requires a legal HTTPS request domain.
- Current `main` commit `d0af634314d0` is pushed, but deployment is not proven
  because GitHub Actions run `26796607775` failed production env validation
  before recreating the backend container.
- ECS-2 self-hosted runner checkout/artifact download recovered in run
  `26796607775`; the active blocker is missing/undocumented real WeChat Pay
  production configuration on ECS-2 while `WECHAT_PAY_MOCK_ENABLED=false`.
- Real WeChat login, phone authorization, payment, refund, SMS, and callback
  delivery still require external-service production validation.

## 5. Next Deployment Decision

To complete current-branch deployment evidence, first decide and provision the
payment configuration lane: real WeChat Pay merchant variables/key files for
production mode, or an explicit non-production/mock-payment deployment decision.
Then rerun the GitHub Actions deployment and follow it with the read-only audit.
