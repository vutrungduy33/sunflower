# MVP Next Approval Request

> Current as of 2026-06-02 Round 55. This is the visible next-step approval
> request for MVP closeout. It is not proof that the MVP is complete.

## 1. Purpose

The automated and read-only production baseline is green, but final MVP
closeout still has 32 unresolved required evidence items. Future Codex work
should not keep refreshing the same local baseline unless the worktree or
production state changed. The next useful step is to get one explicit user
approval or waiver lane, then collect sanitized evidence for that lane.

Round 48 strict closeout audit confirmed the unresolved shape:

- Launch evidence strict checker: 9 required entries pending.
- Miniapp manual QA strict checker: 12 required checks pending.
- Admin-web manual QA strict checker: 12 required checks pending.
- Aggregate strict closeout checker: 33 required items unresolved.

Round 58 completed `BACKEND-8080-HARDENING`, reducing current unresolved
required items to 32.

Use this file with:

- `docs/MVP-Handoff-Packet.md`
- `docs/MVP-External-Approval-Packet.md`
- `docs/MVP-External-Evidence-Template.md`
- `docs/MVP-Launch-Evidence.json`
- `docs/Miniapp-Manual-QA.json`
- `docs/Admin-Web-Manual-QA.json`

Unresolved required items: 32

## 2. Latest Analysis

- Round 55 goal: refresh the current local `main` deployment approval preflight
  snapshot after the Round 54 origin/main freshness audit and the Round 54
  documentation commit.
- Evidence ids touched: no status changes; this document only organizes the
  approval path for all unresolved ids listed in section 5 and updates the
  `CURRENT-BRANCH-DEPLOYED` preflight boundary.
- Open-source reference check: not needed. This is repository-specific evidence
  and approval documentation, not common feature code or reusable
  infrastructure. The deployment preflight used the existing repository-native
  script.
- Risk: this document does not reduce the pending evidence count by itself.
- Acceptance: the request names approval lanes, safety boundaries, exact user
  reply fields, validation commands, strict unresolved counts, and the current
  deployment approval boundary without triggering deployment or production
  mutation.

## 3. Recommended User Decision

Choose exactly one lane for the next Codex round.

Recommended first choices:

1. `MINIAPP-PREVIEW-DOMAIN`: provide or confirm real AppID private config,
   legal HTTPS request domain, and allowed preview/real-device QA scope.
2. `CURRENT-BRANCH-DEPLOYED`: approve push/merge/workflow dispatch and
   post-deploy read-only audit if the current branch should become live.
   If there is still no production merchant config, the safer deploy choice is
   manual backend-only `deployment_lane=nonprod-mock-payment` with
   `target=auto` or `target=backend`; this is not real payment/refund evidence.
3. `ADMIN-PROD-QA`: provide a dedicated QA admin account and approved QA data
   scope for production or approved-staging manual checks.

Do not start `WECHAT-PAYMENT-REFUND` until the user explicitly approves a
low-value real payment/refund or gives itemized waivers.

## 4. Approval Reply Template

Ask the user to reply in this shape before executing an approval-gated lane:

```text
Approval lane:
Allowed actions:
Environment:
May mutate production data or configuration: yes/no
May run real payment or real refund: yes/no
May trigger GitHub Actions deployment: yes/no
QA resources or aliases to use:
Sensitive data boundaries:
Rollback/restoration plan:
Abort conditions:
Evidence ids to update:
```

No approval means no `push main`, no merge, no `workflow_dispatch`, no
production deploy, no security-group/firewall mutation, no real payment, no real
refund, and no live production data mutation.

## 5. Lane Coverage

| Lane | Evidence ids it can unlock | Needs approval for |
| --- | --- | --- |
| `MINIAPP-PREVIEW-DOMAIN` | `WECHAT-DOMAIN`, `WECHAT-PREVIEW-LOGIN`, `WECHAT-PHONE`, `MINIAPP-BOOKING-PATH`, `MINIAPP-DOMAIN-HTTPS`, `MINIAPP-APPID-PREVIEW`, `MINIAPP-WX-LOGIN`, `MINIAPP-PHONE-BIND`, `MINIAPP-HOME-CONTENT`, `MINIAPP-ROOM-BROWSE`, `MINIAPP-ORDER-CREATE`, `MINIAPP-ORDER-LIST-ACTIONS`, `MINIAPP-ERROR-STATES` | Real AppID private config, HTTPS domain, preview/real-device QA, any order mutation |
| `WECHAT-PAYMENT-REFUND` | `WECHAT-REAL-PAYMENT`, `WECHAT-REAL-REFUND`, `MINIAPP-MOCK-PAYMENT`, `MINIAPP-REAL-PAYMENT`, `MINIAPP-REFUND` | Low-value real payment, real refund, merchant/callback evidence, or itemized waiver |
| `ADMIN-PROD-QA` | `ADMIN-PROD-QA`, `ADMIN-AUTH-LOGIN`, `ADMIN-AUTH-ACTIVATE`, `ADMIN-AUTH-RESET-CHANGE`, `ADMIN-WORKSPACE-HEALTH`, `ADMIN-ROOM-LIST-EDIT`, `ADMIN-ROOM-SHELF`, `ADMIN-PRICING-CALENDAR`, `ADMIN-PRICING-BATCH`, `ADMIN-ORDER-LIST-DETAIL`, `ADMIN-ORDER-OPS`, `ADMIN-AFTER-SALE`, `ADMIN-ERROR-STATES` | Dedicated QA admin account, approved QA data, rollback/restoration or final-state acceptance |
| `BACKEND-8080-HARDENING` | Already passed in Round 58; revalidates `BACKEND-8080-HARDENING` after backend redeploys or network changes | Preserve private-IP binding, host firewall/security-group evidence if topology changes, or explicit waiver if exposure is reintroduced |
| `CURRENT-BRANCH-DEPLOYED` | `CURRENT-BRANCH-DEPLOYED` | Push/merge/workflow dispatch/deploy approval, then post-deploy smoke. Production lane requires real WeChat Pay config; backend-only nonprod/mock-payment dispatch uses `deployment_lane=nonprod-mock-payment` with `target=auto/backend` and must be recorded as reduced-scope evidence, not production payment readiness |
| `EVIDENCE-WAIVER` | Any remaining unresolved id | Exact id, accepted risk, date, reason, and scope |

## 6. Current Deployment Preflight Snapshot

Latest clean read-only deployment approval preflight before an approved deploy:

- Command: `node scripts/check_deployment_approval_preflight.js`
- Branch: local `main`
- HEAD checked: `75987946b73b`
- Base: `origin/main` at `89f93d704719`
- Changed files since base: 146
- Predicted push-to-main deploy target: `all`
- Impact counts: backend 38 files, admin-web 5 files, ingress 1 file
- Result: passed 4 checks
- Actions taken: no push, no merge, no `workflow_dispatch`, no deploy, no ECS
  mutation
- Important boundary: the branch is `main`; pushing these deployment-relevant
  local commits can trigger production deployment.

Rerun `node scripts/check_deployment_approval_preflight.js` after any new commit
and before asking the user to approve `CURRENT-BRANCH-DEPLOYED`.

This snapshot was taken before the Round 55 documentation commit itself, so
rerun the preflight immediately before any approved deployment action.

Current deploy-lane options:

- Production lane: push to `main` or default `workflow_dispatch`; still blocked
  until real ECS-2 WeChat Pay config is provisioned.
- Backend-only nonprod/mock-payment lane: manual `workflow_dispatch` with
  `deployment_lane=nonprod-mock-payment` and `target=auto` or `target=backend`;
  validates `.env.nonprod-mock.example`, does not refresh admin-web/Nginx, and
  does not prove real payment/refund.
- Local guard before asking for nonprod dispatch approval:
  `node scripts/check_workflow_dispatch_lane_matrix.js`.

## 7. Evidence Rules

Record only sanitized proof:

- date, environment, route/API, QA alias, masked suffix, action result
- final rollback/restoration state, or explicit waiver text
- short operator note without secrets or personal data

Do not record or commit:

- real AppID values
- openId/unionId
- auth tokens or cookies
- SMS codes or passwords
- phone numbers
- merchant credentials
- private keys
- raw screenshots with personal data
- full order/payment/refund identifiers

## 8. Commands To Run

Before a lane:

```bash
node scripts/check_mvp_external_approval_packet.js
node scripts/check_mvp_next_approval_request.js
node scripts/check_mvp_closeout_readiness.js
```

Deployment approval preflight:

```bash
node scripts/check_deployment_approval_preflight.js
node scripts/check_workflow_dispatch_lane_matrix.js
bash scripts/check_nonprod_mock_payment_deploy_lane.sh
```

After approved production deploy:

```bash
scripts/check_production_readonly_audit.sh
```

Lane-specific strict checks:

```bash
node scripts/check_mvp_launch_evidence.js --strict
node scripts/check_miniapp_manual_qa.js --strict
node scripts/check_admin_web_manual_qa.js --strict
node scripts/check_mvp_closeout_readiness.js --strict
node scripts/check_mvp_handoff_packet.js
```

Until the strict commands pass or the user provides itemized waivers that pass
the same guards, keep the MVP goal open.
