# Codeup / Yunxiao Flow Migration Plan

> Target: migrate the current GitHub Actions deployment workflow to Alibaba
> Cloud Codeup + Yunxiao Flow + Alibaba Cloud ECS, using ECS-local release
> artifacts instead of a container image registry.
>
> Status: planning document. Do not disable GitHub Actions until the Yunxiao
> pipeline has produced successful non-production and production-equivalent
> evidence.

## 1. Decision Summary

- Selected control plane: Alibaba Cloud Codeup for source and Yunxiao Flow for
  CI/CD orchestration.
- Selected runtime targets: existing Alibaba Cloud ECS nodes.
  - ECS-2 backend/data: `47.120.42.15` / `172.25.121.83`
  - ECS-1 web/ingress: `47.113.223.248` / `172.25.121.84`
- Selected artifact model: ECS-local artifacts.
  - Build jobs produce `deploy-bundle.tar.gz`,
    `backend-image-<sha>.tar.gz`, and `admin-web-image-<sha>.tar.gz`.
  - Deploy jobs download artifacts to the target ECS host, run `docker load`,
    synchronize the deployment bundle, and call the existing deploy scripts.
- Out of scope for the first migration: ACR/GHCR/SWR image registry migration,
  business secret migration, schema/API changes, and production payment
  readiness remediation.

## 2. Current Evidence And Gaps

### Already Available

- Local Codeup SSH read access is verified:
  `git@codeup.aliyun.com:6a1e70a56ca3fad97ed1fbab/xiangrikui/sunflower.git`
  exposes `refs/heads/main` from this workstation.
- Yunxiao DevOps OpenAPI access is verified for organization
  `向日葵民宿开发部` / `6a1e70a56ca3fad97ed1fbab`.
- Yunxiao pipeline list is readable, and the current list is empty.
- Existing deploy scripts already separate release metadata from business
  runtime secrets:
  - `scripts/package_deploy_bundle.sh`
  - `scripts/sync_deploy_bundle.sh`
  - `scripts/execute_runner_deploy.sh`
  - `scripts/validate_prod_env.sh`
  - `scripts/check_nonprod_mock_payment_deploy_lane.sh`
- ECS-owned `.env.prod` files remain the source of truth for database, WeChat,
  SMS, token, domain, and Nginx settings.

### Still Missing

- A Yunxiao Flow pipeline does not exist yet.
- ECS-1 and ECS-2 are not yet proven as Yunxiao host-group runners.
- Codeup repository selection is not yet proven in the Yunxiao UI, even though
  SSH access works.
- Yunxiao artifact retention, artifact naming, and rerun-from-historical-run
  behavior are not yet validated.
- Production payment configuration is still incomplete. A push-to-main
  production lane is expected to fail at `WECHAT_PAY_MCH_ID is required` until
  the real payment configuration is provisioned.

## 3. Manual Yunxiao / ECS Configuration

### 3.1 Codeup And Flow

1. In Codeup, confirm the `sunflower` repository is visible under the
   `向日葵民宿开发部` organization and can be selected by Flow.
2. In Flow, create a pipeline named `sunflower-deploy-ecs-local-artifacts`.
3. Set the code source to Codeup:
   - Repository:
     `git@codeup.aliyun.com:6a1e70a56ca3fad97ed1fbab/xiangrikui/sunflower.git`
   - Default branch: `main`
4. Enable push trigger on `main` only after the manual dry-run deployment has
   passed. Keep the GitHub Actions workflow enabled during the observation
   period.
5. Add manual run variables:
   - `target`: `auto`, `backend`, `admin-web`, `nginx`, `all`, `bootstrap`
   - `deployment_lane`: `production`, `nonprod-mock-payment`
   - `run_seed`: `false`, `true`
   - `image_tag`: optional historical commit/artifact version; keep empty for
     normal builds.

### 3.2 Flow Variables

Configure these non-secret variables in Flow:

```text
BACKEND_DEPLOY_PATH=<ECS-2 deployment directory>
WEB_DEPLOY_PATH=<ECS-1 deployment directory>
BACKEND_MAVEN_MIRROR=central
BACKEND_IMAGE_NAME=sunflower-backend
ADMIN_WEB_IMAGE_NAME=sunflower-admin-web
```

Do not put these in Yunxiao:

```text
.env.prod contents
database passwords
WeChat app secrets
WeChat Pay merchant secrets or certificates
Tencent SMS credentials
admin or auth token secrets
miniapp private AppID config
private SSH keys committed to the repository
```

### 3.3 Host Groups

Create two Yunxiao host groups:

| Host group | ECS | Role | Deploy path variable |
| --- | --- | --- | --- |
| `sunflower-backend-prod` | ECS-2 | backend + MySQL | `BACKEND_DEPLOY_PATH` |
| `sunflower-web-prod` | ECS-1 | admin-web + host Nginx | `WEB_DEPLOY_PATH` |

For each host:

- Install/connect the Yunxiao host runner according to the host-group guide.
- Ensure the host can reach Yunxiao for runner callback and task delivery.
- Use a dedicated deploy user or a restricted service account.
- Ensure the deploy user can run:
  - `bash`
  - `tar`
  - `gzip`
  - `docker`
  - `docker compose`
- Ensure the deploy user can write the deployment directory.
- Ensure the deployment directory keeps the host-owned `.env.prod` file.
- Do not replace ECS `.env.prod` from the pipeline.

## 4. Pipeline Design

The first Yunxiao pipeline should be behavior-compatible with the current
GitHub workflow, except that it should not push to GHCR and should not use a
container registry for normal deploys.

### 4.1 Stages

1. `detect-targets`
   - Checkout the triggering commit from Codeup.
   - Resolve:
     - `SOURCE_SHA`
     - `IMAGE_TAG`
     - `DEPLOY_TARGET`
     - `DEPLOYMENT_LANE`
     - `RUN_SEED`
     - `BACKEND_CHANGED`
     - `ADMIN_WEB_CHANGED`
     - `INGRESS_CHANGED`
     - `SHOULD_BUILD_BACKEND`
     - `SHOULD_BUILD_ADMIN_WEB`
     - `DEPLOY_BACKEND_HOST`
     - `DEPLOY_WEB_HOST`
   - Preserve current rules:
     - Push to `main` defaults to `production`.
     - Manual `nonprod-mock-payment` supports only `target=auto` or
       `target=backend`.
     - Manual `auto` resolves to `all` for production and `backend` for
       non-production/mock.
2. `package-deploy-bundle`
   - Run:
     ```bash
     scripts/package_deploy_bundle.sh "$PWD/artifacts/deploy-bundle.tar.gz"
     ```
   - Upload `deploy-bundle.tar.gz` as a Flow artifact.
3. `build-backend`
   - Run only when backend build is required.
   - Build image:
     ```bash
     docker build \
       --tag "sunflower-backend:${SOURCE_SHA}" \
       --build-arg "MAVEN_MIRROR=${BACKEND_MAVEN_MIRROR:-central}" \
       ./sunflower-backend
     ```
   - Export:
     ```bash
     docker save "sunflower-backend:${SOURCE_SHA}" | gzip -1 > \
       "artifacts/backend-image-${SOURCE_SHA}.tar.gz"
     ```
   - Upload the image tarball as a Flow artifact.
4. `build-admin-web`
   - Run only when admin-web build is required.
   - Build image:
     ```bash
     docker build \
       --tag "sunflower-admin-web:${SOURCE_SHA}" \
       --build-arg "VITE_APP_TITLE=Sunflower Admin Web" \
       --build-arg "VITE_API_BASE_URL=/api" \
       --build-arg "VITE_API_PROXY_TARGET=http://backend:8080" \
       ./sunflower-admin-web
     ```
   - Export:
     ```bash
     docker save "sunflower-admin-web:${SOURCE_SHA}" | gzip -1 > \
       "artifacts/admin-web-image-${SOURCE_SHA}.tar.gz"
     ```
   - Upload the image tarball as a Flow artifact.
5. `deploy-backend-host`
   - Run on host group `sunflower-backend-prod` when
     `DEPLOY_BACKEND_HOST=true`.
   - Download `deploy-bundle.tar.gz`.
   - Download `backend-image-${SOURCE_SHA}.tar.gz` when backend was built.
   - Execute:
     ```bash
     tar -xzf deploy-bundle.tar.gz
     bash scripts/sync_deploy_bundle.sh "$BACKEND_DEPLOY_PATH"
     if [ -f "backend-image-${SOURCE_SHA}.tar.gz" ]; then
       gzip -dc "backend-image-${SOURCE_SHA}.tar.gz" | docker load
     fi
     BACKEND_IMAGE="sunflower-backend:${SOURCE_SHA}" \
     ADMIN_WEB_IMAGE="sunflower-admin-web:${SOURCE_SHA}" \
     SOURCE_SHA="$SOURCE_SHA" \
     DEPLOY_TARGET="$DEPLOY_TARGET" \
     DEPLOYMENT_LANE="$DEPLOYMENT_LANE" \
     RUN_SEED="$RUN_SEED" \
     DEPLOY_NODE_ROLE="backend" \
     ECS_DEPLOY_PATH="$BACKEND_DEPLOY_PATH" \
       bash scripts/execute_runner_deploy.sh
     ```
6. `deploy-web-host`
   - Run on host group `sunflower-web-prod` when `DEPLOY_WEB_HOST=true`.
   - Depend on successful backend deploy when backend deploy is part of the
     same run.
   - Download `deploy-bundle.tar.gz`.
   - Download `admin-web-image-${SOURCE_SHA}.tar.gz` when admin-web was built.
   - Execute the same sync/load/deploy flow with:
     ```text
     DEPLOY_NODE_ROLE=web
     ECS_DEPLOY_PATH=$WEB_DEPLOY_PATH
     ```

### 4.2 Rollback Model

Because the first migration intentionally avoids an image registry, rollback
must use Yunxiao historical run artifacts rather than GHCR tags.

- Normal deploy:
  - Build image tarballs from current commit.
  - Load tarballs on ECS.
  - Write `.release.env` with local image refs.
- Rollback deploy:
  - Select a previous successful Yunxiao run.
  - Rerun the deploy stages with its preserved `deploy-bundle.tar.gz` and image
    tarballs.
  - Keep `SOURCE_SHA` and image names aligned with the artifact version being
    redeployed.
- Do not implement `image_tag` rollback against GHCR in the Yunxiao v1 path.
  Preserve the input name only for operator familiarity and document that it
  maps to a historical Yunxiao artifact version.

## 5. Migration Phases

### Phase 0: Readiness

- Confirm Codeup UI can select the `sunflower` repository.
- Confirm both ECS hosts are connected to Yunxiao host groups.
- On each host group, run a harmless command:
  ```bash
  hostname
  whoami
  docker --version
  docker compose version
  test -f "$BACKEND_DEPLOY_PATH/.env.prod" || true
  test -f "$WEB_DEPLOY_PATH/.env.prod" || true
  ```
- Keep GitHub Actions as the active deploy path.

### Phase 1: Backend Non-Production Mock Lane

- Manually trigger Yunxiao with:
  ```text
  target=backend
  deployment_lane=nonprod-mock-payment
  run_seed=false
  image_tag=
  ```
- Expected evidence:
  - deployment bundle artifact was produced and downloaded on ECS-2
  - backend image tarball was produced and loaded on ECS-2
  - `scripts/check_nonprod_mock_payment_deploy_lane.sh` passed on ECS-2
  - `scripts/execute_runner_deploy.sh` completed
  - `RUN_INTERNAL=1 scripts/check_production_smoke.sh` passed
  - `RUN_INTERNAL=1 scripts/check_backend_8080_exposure.sh` passed

### Phase 2: Web And Ingress Dry Run

- Manually trigger:
  ```text
  target=admin-web
  deployment_lane=production
  run_seed=false
  image_tag=
  ```
- Then trigger `target=nginx` only if certificate/domain configuration is ready.
- Expected evidence:
  - admin-web image tarball loaded on ECS-1
  - web deploy script completed
  - host Nginx config test passed before reload
  - admin health endpoint remains healthy

### Phase 3: Controlled Full Deploy

- Manually trigger:
  ```text
  target=all
  deployment_lane=production
  run_seed=false
  image_tag=
  ```
- If real payment configuration is still incomplete, expect production env
  validation to fail before backend recreation. This is acceptable as a
  migration-control test but is not production readiness evidence.

### Phase 4: Push Trigger Cutover

- Enable Codeup `main` push trigger only after Phase 1 and at least one
  production-equivalent manual run prove the pipeline wiring.
- Keep GitHub Actions enabled but stop using it as the primary deploy path for
  an observation window.
- After at least two successful Yunxiao deploy runs, change GitHub Actions to
  manual-only or archive it as fallback documentation.

## 6. Validation And Guards

Add or update repo-side checks before declaring migration complete:

- Add a Yunxiao migration static guard that checks:
  - the migration plan exists and names the selected control plane
  - no production business secret is listed as a Yunxiao variable
  - the plan keeps ECS `.env.prod` ownership on ECS
  - the plan preserves `production` and `nonprod-mock-payment` lane boundaries
- Keep existing checks:
  ```bash
  bash -n scripts/deploy_lib.sh scripts/package_deploy_bundle.sh scripts/sync_deploy_bundle.sh scripts/execute_runner_deploy.sh
  tmp_bundle="$(mktemp -t sunflower-deploy-bundle.XXXXXX).tar.gz"; scripts/package_deploy_bundle.sh "$tmp_bundle"; tar -tzf "$tmp_bundle" >/dev/null; rm -f "$tmp_bundle"
  bash scripts/check_nonprod_mock_payment_deploy_lane.sh
  node scripts/check_workflow_dispatch_lane_matrix.js
  scripts/check_deploy_config.sh
  ```
- Record every Yunxiao run with:
  - source commit
  - selected target
  - selected lane
  - artifact names
  - host group names
  - smoke result
  - whether it changed production runtime

## 7. Risks And Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| No image registry | Large tarballs make deploy slower and rollback depends on artifact retention | Keep artifacts compressed, define retention, and move to ACR if tarball transfer becomes painful |
| Push-to-main production trigger | Current real payment config can block production deploys | Enable push trigger only after manual proof; keep a clear off switch |
| Host runner permissions | Deploy task can fail after build | Verify `docker`, compose, deploy path write access in Phase 0 |
| ECS `.env.prod` accidental overwrite | Could leak or break production secrets | Pipeline must never upload `.env.prod`; only sync committed templates and scripts |
| Codeup UI repository mismatch | Pipeline cannot be created from the expected source | Confirm repository selection in Flow UI before implementing YAML |
| Yunxiao artifact retention too short | Rollback evidence may disappear | Set retention long enough for the release window or adopt ACR later |

## 8. Open-Source Reference Check

- Task classification: common CI/CD migration and deployment-control work;
  reference check required.
- Sources checked:
  - Alibaba Cloud Yunxiao product overview:
    <https://help.aliyun.com/zh/yunxiao/>
  - Codeup association with Flow pipeline:
    <https://help.aliyun.com/zh/yunxiao/user-guide/how-to-associate-flow-pipeline>
  - Flow YAML artifacts:
    <https://help.aliyun.com/zh/yunxiao/user-guide/step-product-artifacts>
  - Flow host deployment:
    <https://help.aliyun.com/zh/yunxiao/user-guide/host-deployment/>
  - Flow host group management:
    <https://help.aliyun.com/zh/yunxiao/user-guide/host-group-management>
- Selected approach: adapt official Flow concepts for Codeup source,
  artifacts, and host groups while reusing repository-native deploy scripts.
- License/compatibility: official product documentation; no code copied.
- Reused/adapted: design pattern only. No third-party source files or snippets
  were copied.
- Rejected options:
  - ACR-backed image deploy: more standard long-term, but outside the user's
    selected no-registry/ECS-local artifact route.
  - Huawei CodeArts: viable, but cross-cloud network/security complexity is
    unnecessary while ECS remains on Alibaba Cloud.
