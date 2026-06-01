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
在 /Users/chenyao/dev/miniapp/sunflower 继续 MVP 收口目标：把小程序、admin-web、后端和部署链路推进到“主要功能真实可用、证据可验证、交接可复现”的有限终止状态。不要做无休止优化；只围绕剩余 MVP 证据和必要修复推进。

启动上下文：
1. 先读取 AGENTS.md、docs/Agent-Memory.md、docs/Context-Index.md、docs/Project-State.md、docs/MVP-Readiness.md、docs/MVP-Handoff-Packet.md、docs/MVP-External-Approval-Packet.md、docs/MVP-Closeout-Audit.md、docs/MVP-Next-Goal-Prompt.md。
2. 执行 git status --short --branch --untracked-files=all。
3. 不要默认读取 docs/archive/**；除非当前文档明确指向历史材料。
4. 记住当前基线：Round 32 的 RUN_PRODUCTION=1 scripts/check_mvp_regression.sh 已通过；旧的 admin-web _refundId lint 或 3 个测试失败记录是过期信息。MVP 仍缺 33 项外部/人工证据：9 项 launch、12 项小程序手工 QA、12 项 admin-web 手工 QA。

每一轮执行闭环：
1. 先写出本轮最小目标、会触及的证据 ID、阻塞项、是否需要用户审批。
2. 若要开发通用能力或修复常见工程问题，必须使用 open-source-reference-first skill：优先查官方示例、成熟 GitHub/Gitee 实现或框架推荐；记录来源、许可证兼容性、采用/拒绝原因；能复用就复用，不重复造轮子。若只是项目内证据/文档维护，说明无需外部代码。
3. 只做本轮最小必要改动或证据采集；保持 API 兼容；不碰无关重构。
4. 运行相关自动化验证；如果改了通用链路，优先跑 scripts/check_mvp_regression.sh；涉及生产只读证据时再跑 RUN_PRODUCTION=1 scripts/check_mvp_regression.sh 或 scripts/check_production_readonly_audit.sh。
5. 更新 docs/MVP-Progress.md、docs/Project-State.md，以及受影响的 docs/MVP-Launch-Evidence.json、docs/Miniapp-Manual-QA.json、docs/Admin-Web-Manual-QA.json、docs/Backend-8080-Security.md、docs/Production-Smoke.md 或其他证据文档。
6. 做目标纠偏：明确本轮已解决什么、剩余什么、下一轮应选择哪条 approval lane、是否需要调整 goal。
7. 每轮结束必须提交一次本地 commit；不要自动 push、merge 或触发部署。

硬边界：
- 没有用户明确确认前，不允许 push 到 main、merge main、workflow_dispatch、触发生产部署、修改阿里云安全组/防火墙、执行真实支付/真实退款、修改生产数据。
- 不提交密钥、真实 AppID、token、cookie、短信码、密码、手机号、openid/unionid、商户凭据、完整订单号/支付号/退款号、私钥或含个人信息的截图。
- 可以做本地验证、只读生产检查、只读 SSH/HTTP 探测和文档证据整理；所有生产变更类动作先输出审批请求、风险、回滚方案并等待用户确认。

优先推进路径：
1. 首先确认本地与只读生产基线仍绿：scripts/check_mvp_regression.sh；必要时 RUN_PRODUCTION=1 scripts/check_mvp_regression.sh。
2. 选择一个最小 approval lane 推进，不要一轮混做多条：MINIAPP-PREVIEW-DOMAIN、WECHAT-PAYMENT-REFUND、ADMIN-PROD-QA、BACKEND-8080-HARDENING、CURRENT-BRANCH-DEPLOYED、EVIDENCE-WAIVER。
3. 开始任何 lane 前，阅读 docs/MVP-External-Approval-Packet.md，运行 node scripts/check_mvp_external_approval_packet.js，并按其中模板向用户申请必要批准。
4. 证据只能写脱敏摘要；写入后运行对应 strict 检查，例如 node scripts/check_miniapp_manual_qa.js --strict、node scripts/check_admin_web_manual_qa.js --strict 或 node scripts/check_mvp_launch_evidence.js --strict。
5. 如果发现代码缺陷阻塞某条证据，先用最小修复解除阻塞，再重新跑相关验证并提交。

最终完成条件：
- scripts/check_mvp_regression.sh 通过。
- RUN_PRODUCTION=1 scripts/check_mvp_regression.sh 或部署后的 scripts/check_production_readonly_audit.sh 通过。
- node scripts/check_mvp_launch_evidence.js --strict 通过。
- node scripts/check_miniapp_manual_qa.js --strict 通过。
- node scripts/check_admin_web_manual_qa.js --strict 通过。
- node scripts/check_mvp_closeout_readiness.js --strict 通过。
- node scripts/check_mvp_handoff_packet.js 通过。
- git status --short --branch --untracked-files=all 干净，且最后一轮已提交。
只有这些条件全部满足，或用户对缺失外部证据做出明确逐项豁免且 strict 检查通过，才能把 goal 标记 complete。

停止/人工介入条件：
- 需要真实支付/退款、生产数据变更、安全组/防火墙变更、push/merge/deploy，而用户尚未批准。
- 缺少真实 AppID、微信后台合法域名、商户号、QA 账号、可安全操作的 QA 订单/房源/价格数据等外部条件。
- 阶段性分析发现 goal 必须调整但无法安全自动修改。此时停止当前 goal，输出不超过 4000 字的新 goal 提示词等待人工介入；等待人工介入等于停止当前 goal，不要继续假装推进。
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
