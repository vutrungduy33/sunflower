# Backend 8080 Security Evidence

> Current as of 2026-06-02. This document tracks whether ECS-2 backend port
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

Latest read-only result:

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

## 3. Required Launch Evidence

To mark `BACKEND-8080-HARDENING` as `passed` in
`docs/MVP-Launch-Evidence.json`, record one of:

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

## 4. Open-Source Reference Check

- Task classification: common production port exposure and launch security
  evidence tracking.
- Sources checked:
  - Existing project docs/scripts:
    `scripts/check_production_smoke.sh`, `docker-compose.backend.yml`,
    `.env.prod.example`, `docs/Production-Smoke.md`,
    `docs/S19-Prod-Deployment-Config.md`.
  - Docker Compose port publishing reference:
    `https://docs.docker.com/reference/compose-file/services/#ports`.
  - UFW status/checking conventions:
    `https://help.ubuntu.com/community/UFW`.
- Selected approach: read-only Bash inspection using curl, ssh, Docker, `ss`,
  `ufw`, and `iptables`; no new dependency and no production mutation.
- License/compatibility: no external code copied.
- Reused/adapted: existing SSH/curl pattern from `scripts/check_production_smoke.sh`.
- Rejected options: changing security groups automatically, rewriting compose
  binding to `127.0.0.1` without deployment planning, or treating a single
  failed public curl as sufficient proof.
