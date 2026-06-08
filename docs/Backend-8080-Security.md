# Backend 8080 Security Evidence

> Current as of 2026-06-08 Round 115. This document tracks whether ECS-2 backend port
> `8080` is restricted to ECS-1 or accepted as a launch risk. The checks here
> are read-only and do not change Alibaba Cloud security groups, host firewall,
> Docker, or deployment configuration.

## 1. Repeatable Check

Script:

```bash
RUN_INTERNAL=1 scripts/check_backend_8080_exposure.sh
```

Modes:

- Default mode probes `http://47.120.42.15:8080/api/health` from the local
  network.
- `RUN_INTERNAL=1` additionally uses SSH to check ECS-1 private upstream access,
  ECS-2 Docker/listener state, and local firewall hints.
- `ENFORCE_RESTRICTED=1` makes the script fail if public `8080` is directly
  reachable from the current network.

## 2. Current Result

Latest read-only recheck from Round 115 on 2026-06-08:

- `RUN_INTERNAL=1 scripts/check_production_readonly_audit.sh` ran the backend
  `8080` exposure step and passed with 5 checks and 0 warnings.
- Public direct probe `http://47.120.42.15:8080/api/health` was not directly
  usable from the local network.
- ECS-1 can reach ECS-2 backend through private upstream
  `http://172.25.121.83:8080/api/health`.
- ECS-2 backend container and private health are present.
- Listener output shows backend `8080` bound to private address
  `172.25.121.83` and not listening on the public interface.
- No Alibaba Cloud security group, host firewall, Docker, or deployment
  configuration was changed.

Hardening result from Round 58 on 2026-06-02:

- User explicitly approved closing backend `8080`.
- ECS-2 deployment directory: `/home/chenyao/sunflower`.
- ECS-2 `.env.prod` was backed up as
  `.env.prod.pre-backend-8080-hardening-20260602`.
- ECS-2 `.env.prod` changed `BACKEND_BIND_HOST` from `0.0.0.0` to
  `172.25.121.83`.
- `sunflower-backend` was force-recreated through
  `docker compose -f docker-compose.backend.yml --env-file .env.prod up -d
  --no-deps --force-recreate backend`.
- `docker ps` and `ss` show backend port publishing as
  `172.25.121.83:8080->8080/tcp`, not `0.0.0.0:8080`.
- ECS-1 can still reach ECS-2 backend through private upstream
  `http://172.25.121.83:8080/api/health`.
- Public ingress `/api/health` remains `UP`.
- ECS-2 `127.0.0.1:8080` is no longer reachable, which is expected after
  binding the host port to the ECS-2 private address.
- Public direct probe `http://47.120.42.15:8080/api/health` is not usable from
  the local network.
- `RUN_INTERNAL=1 ENFORCE_RESTRICTED=1 scripts/check_backend_8080_exposure.sh`
  passed with 5 passes and 0 warnings.
- No Alibaba Cloud security group change was made.

Conclusion:

- `BACKEND-8080-HARDENING` is now passed because backend `8080` no longer
  listens on the public interface and ECS-1 private upstream still works.
- Re-run the check after backend redeploys or production network changes.

Rollback if needed:

```bash
cd /home/chenyao/sunflower
cp .env.prod.pre-backend-8080-hardening-20260602 .env.prod
docker compose -f docker-compose.backend.yml --env-file .env.prod up -d --no-deps --force-recreate backend
```

## 3. Previous Result

Latest direct read-only result from the backend `8080` step inside
`RUN_PRODUCTION=1 scripts/check_mvp_regression.sh` at 2026-06-02 08:58
Asia/Shanghai on pre-commit HEAD `255558f001e9`:

- Public `http://47.120.42.15:8080/api/health` was not directly usable from the
  local network.
- ECS-1 can reach ECS-2 backend through private upstream
  `http://172.25.121.83:8080/api/health`.
- ECS-2 backend container and local health are present.
- ECS-2 still shows backend listening on `0.0.0.0:8080`.
- Local firewall output did not prove `8080` is restricted to ECS-1.
- No production configuration was changed.

Interpretation:

- This improves evidence but does not close the `BACKEND-8080-HARDENING`
  launch requirement.
- A local public probe returning unavailable is not enough proof, because source
  IP, network path, or transient behavior can hide exposure.
- Final MVP closeout still needs Alibaba Cloud security group evidence or an
  explicit user waiver accepting direct backend exposure as a launch risk.

Previous aggregate result:

- `RUN_PRODUCTION=1 scripts/check_mvp_regression.sh` also ran this check at
  2026-06-02 07:33 Asia/Shanghai with the same 3 pass / 2 warning shape.
- `RUN_INTERNAL=1 scripts/check_backend_8080_exposure.sh` also ran this check
  directly at 2026-06-02 08:49 Asia/Shanghai on HEAD `9c9d242` with the same 3
  pass / 2 warning shape.

## 4. Required Launch Evidence

To mark `BACKEND-8080-HARDENING` as `passed` in
`docs/MVP-Launch-Evidence.json`, record one of:

- Backend host port is bound only to the ECS-2 private address and public
  direct probe is denied while ECS-1 private upstream still works.
- Alibaba Cloud security group rule allows backend `8080` only from ECS-1
  private/public source as intended, plus a successful public denial probe.
- Host firewall rule restricts `8080` to ECS-1 and the rule survives reboot or
  deployment, plus a successful public denial probe.

To mark it as `waived`, record explicit user acceptance of the risk.

Do not commit:

- Alibaba Cloud credentials
- screenshots containing account identifiers or tokens
- full firewall dumps with secrets or unrelated private topology
- raw logs beyond compact non-secret evidence summaries

## 5. Open-Source Reference Check

- Task classification: common production port exposure and launch security
  evidence tracking.
- Sources checked:
  - Existing project docs/scripts:
    `scripts/check_production_smoke.sh`, `docker-compose.backend.yml`,
    `.env.prod.example`, `docs/Production-Smoke.md`,
    `docs/S19-Prod-Deployment-Config.md`.
  - Docker Compose port publishing reference:
    `https://docs.docker.com/reference/compose-file/services/#ports`.
  - Docker Engine packet filtering/firewall reference:
    `https://docs.docker.com/engine/network/packet-filtering-firewalls/`.
  - Alibaba Cloud ECS security group documentation:
    `https://www.alibabacloud.com/help/en/ecs/user-guide/security-groups`.
  - UFW status/checking conventions:
    `https://help.ubuntu.com/community/UFW`.
- Selected approach: after explicit user approval, bind the backend published
  port to ECS-2 private IP `172.25.121.83` instead of `0.0.0.0`, then verify
  public denial and ECS-1 private upstream health.
- License/compatibility: no external code copied.
- Reused/adapted: existing SSH/curl pattern from
  `scripts/check_production_smoke.sh` and existing compose
  `${BACKEND_BIND_HOST}:${BACKEND_HOST_PORT}:8080` support.
- Rejected options: changing Alibaba Cloud security groups without needing to,
  binding to `127.0.0.1` because ECS-1 would lose private upstream access, or
  treating a single failed public curl as sufficient proof while still
  listening on `0.0.0.0`.
