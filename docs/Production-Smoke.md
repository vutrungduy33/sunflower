# Production Smoke

> Latest run: 2026-06-02 08:58 Asia/Shanghai. This records observed production
> health for the MVP hardening goal. It does not mean a new deployment was
> triggered.

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

Latest read-only production result:

- `RUN_PRODUCTION=1 scripts/check_mvp_regression.sh`: production smoke and
  backend `8080` read-only checks passed in Round 39 as part of the 6-step
  aggregate MVP regression at pre-commit HEAD `255558f001e9`.
- Deploy config static checks passed.
- 7 checks passed.
- 1 warning remained: ECS-2 backend still listens on `0.0.0.0:8080`.
- Backend `8080` exposure check passed with 3 checks and 2 warnings.
- No deployment, push, or production configuration change was performed.

Latest deployment approval preflight:

- `node scripts/check_deployment_approval_preflight.js`: passed 5 checks on
  2026-06-02 during Round 41.
- Current branch: `codex/s18-payment-hardening`.
- Current branch HEAD: `5376567d2d1c`.
- Comparison base: `origin/main` at `5a37a6788c21`.
- Changed files since base: 142.
- Predicted push-to-main deploy target from workflow path rules: `all`.
- Impact counts: backend 38 files, admin-web 5 files, ingress 1 file.
- Worktree was clean, branch was not `main`, and no deployment, push, or
  production configuration change was performed.

## 1. GitHub Actions

- Active workflow: `.github/workflows/deploy-backend.yml`
- Workflow name: `Deploy Services To ECS`
- Triggers:
  - `workflow_dispatch`
  - `push` to `main` for deployment-relevant paths
- Current branch during latest deployment preflight:
  `codex/s18-payment-hardening`
- Current branch HEAD during latest deployment preflight: `5376567d2d1c`
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
- This is useful, but it does not by itself prove the port is properly
  restricted, because ECS-2 still shows the backend container bound to
  `0.0.0.0:8080`.

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
- `sunflower-backend`: `Up About an hour (healthy)`,
  `0.0.0.0:8080->8080/tcp`
- `sunflower-mysql`: `Up About an hour (healthy)`,
  `127.0.0.1:3306->3306/tcp`
- `curl http://127.0.0.1:8080/api/health`: 200, backend status `UP`
- `ss -ltnp`: confirms MySQL local-only and backend listening on all interfaces
  through docker-proxy.

Latest 2026-06-02 08:58 production-enabled aggregate regression reconfirmed
the same health shape:

- ECS-1 Nginx/admin-web/private backend smoke passed.
- ECS-2 backend/MySQL/local health smoke passed.
- Public direct backend `8080` probe was not directly usable from this local
  network.
- ECS-2 still reports Docker proxy listening on `0.0.0.0:8080`, and local
  firewall output did not prove the restriction.

## 4. Current Production Risks

- HTTPS/domain validation is not proven in this smoke. Miniapp production still
  requires a legal HTTPS request domain.
- Backend container is bound to `0.0.0.0:8080`; security group or host firewall
  should restrict access to ECS-1.
- This branch has not been pushed to `main`; current committed MVP hardening
  work has not triggered deployment. The latest approval preflight predicts an
  `all` deployment target if these branch changes are merged/pushed to `main`.
- Real WeChat login, phone authorization, payment, refund, SMS, and callback
  delivery still require external-service production validation.

## 5. Next Deployment Decision

Do not trigger production deployment automatically from this branch. To deploy
the current branch state, first merge/push to `main` or manually run
`workflow_dispatch` with an explicit target after confirming production intent.
