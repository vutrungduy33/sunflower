# Production Smoke

> Latest run: 2026-06-02 01:52 Asia/Shanghai. This records observed production
> health for the MVP hardening goal. It does not mean a new deployment was
> triggered.

## 1. GitHub Actions

- Active workflow: `.github/workflows/deploy-backend.yml`
- Workflow name: `Deploy Services To ECS`
- Triggers:
  - `workflow_dispatch`
  - `push` to `main` for deployment-relevant paths
- Current branch during this smoke: `codex/s18-payment-hardening`
- Deployment action taken in this round: none
- `gh auth status`: authenticated as `vutrungduy33` with `repo` and `workflow`
  scopes.
- Recent workflow history from `gh run list --workflow deploy-backend.yml`:
  - Latest listed run: success on `main` push, 2026-03-27T12:22:12Z.
  - Earlier S19 setup attempts include failures before the successful run.

## 2. Public Smoke

Commands run from local workspace:

```bash
curl -fsS http://47.113.223.248/api/health
curl -fsS http://47.113.223.248/api/content/home
curl -fsS http://47.113.223.248/healthz
curl -fsSI http://47.113.223.248/
```

Observed result:

- `http://47.113.223.248/api/health`: 200, backend status `UP`.
- `http://47.113.223.248/api/content/home`: 200, returned home content.
- `http://47.113.223.248/healthz`: 200, body `ok`.
- `http://47.113.223.248/`: 200, served admin web HTML through Nginx.

Direct backend public probe:

```bash
curl -fsS http://47.120.42.15:8080/api/health
```

Observed result:

- Empty reply after timeout window, HTTP code `000`.
- This does not prove the port is properly restricted, because ECS-2 still shows
  the backend container bound to `0.0.0.0:8080`.

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

## 4. Current Production Risks

- HTTPS/domain validation is not proven in this smoke. Miniapp production still
  requires a legal HTTPS request domain.
- Backend container is bound to `0.0.0.0:8080`; security group or host firewall
  should restrict access to ECS-1.
- This branch has not been pushed to `main`; current committed MVP hardening
  work has not triggered deployment.
- Real WeChat login, phone authorization, payment, refund, SMS, and callback
  delivery still require external-service production validation.

## 5. Next Deployment Decision

Do not trigger production deployment automatically from this branch. To deploy
the current branch state, first merge/push to `main` or manually run
`workflow_dispatch` with an explicit target after confirming production intent.
