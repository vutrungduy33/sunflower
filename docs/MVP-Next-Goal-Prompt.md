# MVP Next Goal Prompt

> Current as of 2026-06-02. Use this prompt to continue the MVP hardening goal
> in a fresh Codex goal/thread. It is intentionally finite and keeps the current
> approval boundaries explicit.

## Current Baseline

- Local and production read-only baseline is green as of Round 32:
  `RUN_PRODUCTION=1 scripts/check_mvp_regression.sh` passed with backend 57
  tests, admin-web lint/test/build, miniapp smoke/wiring/replay checks,
  evidence non-strict checks, deploy config static checks, and production
  smoke/backend `8080` read-only checks.
- The MVP goal is still open because strict external evidence is incomplete:
  9 launch evidence items, 12 miniapp manual QA items, and 12 admin-web manual
  QA items remain unresolved.
- `BACKEND-8080-HARDENING` is not proven: direct public 8080 was not reachable
  from the current local network, but ECS-2 still listens on `0.0.0.0:8080`.
- `CURRENT-BRANCH-DEPLOYED` is not proven: the current MVP branch has not been
  pushed or merged to `main` for deployment.

## Prompt

```text
继续 /Users/chenyao/dev/miniapp/sunflower 的 MVP 收口目标，把项目推进到“主要功能真实可用、可验证、可交接”的有限终止状态；不要把 goal 变成无休止优化。

启动时先读取 AGENTS.md、docs/Agent-Memory.md、docs/Context-Index.md、docs/Project-State.md、docs/MVP-Readiness.md、docs/MVP-Handoff-Packet.md、docs/MVP-Closeout-Audit.md，并执行 git status --short --branch --untracked-files=all。不要默认读取 docs/archive/**。

当前已知基线：本地 + 生产只读总回归在 Round 32 通过 RUN_PRODUCTION=1 scripts/check_mvp_regression.sh；但最终 MVP 仍缺 33 项外部/人工证据，包括 9 项 launch evidence、12 项小程序人工 QA、12 项 admin-web 人工 QA。旧的 admin-web _refundId lint 或 3 个测试失败记录是过期信息。

每一轮都必须按这个顺序执行：1. 分析本轮最小目标和阻塞项；2. 若要开发通用能力，先使用 open-source-reference-first skill 查询成熟开源/官方实现，优先复用或参考，记录来源、许可证兼容性、采用/拒绝原因；3. 只做本轮最小必要改动或证据采集；4. 运行相关自动化验证；5. 更新 docs/MVP-Progress.md、docs/Project-State.md 以及受影响的 QA/上线证据文档；6. 做目标纠偏，明确下一轮是否继续、改 goal 或等待人工；7. 每轮结束必须提交一次代码。

硬边界：没有用户明确确认前，不允许 push 到 main、merge main、workflow_dispatch、触发生产部署、修改阿里云安全组/防火墙、执行真实支付/真实退款、修改生产数据或提交任何密钥/真实 AppID/令牌/手机号/支付流水/私钥。可以运行只读检查和本地验证。

优先推进顺序：1. 先用 RUN_PRODUCTION=1 scripts/check_mvp_regression.sh 刷新“本地 + 生产只读”总基线；2. 按 docs/MVP-External-Validation-Runbook.md 和 docs/MVP-External-Evidence-Template.md 组织小程序预览/真机、HTTPS 合法域名、真实支付/退款、admin-web 生产或批准 staging QA、backend 8080 安全组证明、当前分支部署证明；3. 对需要人工或真实外部操作的项，先输出清晰审批请求和回滚/证据脱敏方案，等待确认；4. 证据采集后更新 docs/MVP-Launch-Evidence.json、docs/Miniapp-Manual-QA.json、docs/Admin-Web-Manual-QA.json。

最终完成条件：scripts/check_mvp_regression.sh 通过；RUN_PRODUCTION=1 scripts/check_mvp_regression.sh 或部署后的 scripts/check_production_readonly_audit.sh 通过；node scripts/check_mvp_launch_evidence.js --strict、node scripts/check_miniapp_manual_qa.js --strict、node scripts/check_admin_web_manual_qa.js --strict、node scripts/check_mvp_closeout_readiness.js --strict 全部通过；node scripts/check_mvp_handoff_packet.js 通过；git status 干净且最后一轮已提交。只有满足这些条件，或用户明确豁免缺失外部证据并通过 strict 检查后，才能把 goal 标记 complete。

如果阶段性分析发现 goal 必须调整，先尝试用可用工具更新 goal；如果无法安全修改，停止当前 goal，输出不超过 4000 字的新 goal 提示词等待人工介入。等待人工介入等于停止当前 goal，不要继续假装推进。
```

## Next Round Recommendation

The production-enabled aggregate baseline has passed. Next, prepare the first
approved external evidence collection round:

- Choose one evidence lane from `docs/MVP-Handoff-Packet.md`: WeChat
  preview/real-device QA, HTTPS legal domain, admin-web production or approved
  staging QA, backend `8080` security-group proof, or approved current-branch
  deployment.
- Prepare the matching approval lane in
  `docs/MVP-External-Approval-Packet.md` and run
  `node scripts/check_mvp_external_approval_packet.js`.
- For any lane that mutates production, uses real payment/refund, changes
  security groups/firewall, or triggers GitHub Actions deployment, stop and ask
  for explicit user approval first.
- Record only sanitized evidence in the JSON ledgers and rerun the matching
  strict checker for that lane.
