# MVP Next Goal Prompt

> Current as of 2026-06-02. Use this prompt to continue the finite MVP
> closeout goal in a fresh Codex goal/thread. It intentionally separates
> automated work from approval-gated external evidence.

## Current Baseline

- Current branch: `codex/s18-payment-hardening`.
- Latest production-enabled aggregate baseline: Round 39,
  `RUN_PRODUCTION=1 scripts/check_mvp_regression.sh` passed on 2026-06-02
  08:58 Asia/Shanghai at pre-commit HEAD `255558f001e9`.
- The baseline covered backend 57 tests, admin-web lint/test/build and behavior
  wiring, miniapp smoke/wiring/user-flow replay, evidence/runbook non-strict
  checks, deploy config static checks, production smoke, and backend `8080`
  read-only inspection.
- Latest direct admin-web automated baseline: Round 42, `npm run lint`,
  `npm run test` (23 tests across 5 files), and `npm run build` passed on
  2026-06-02 09:21-09:22 Asia/Shanghai using Node `v20.20.1`.
- The MVP is not complete: strict closeout still has 33 unresolved required
  items: 9 launch evidence, 12 miniapp manual QA, and 12 admin-web manual QA.
- `BACKEND-8080-HARDENING` is pending because ECS-2 still listens on
  `0.0.0.0:8080`; current checks do not prove Alibaba Cloud security-group
  restriction.
- `CURRENT-BRANCH-DEPLOYED` is pending because this branch has not been pushed
  or merged to `main` to trigger the GitHub Actions deployment workflow.

## Goal Prompt

```text
在 /Users/chenyao/dev/miniapp/sunflower 继续有限 MVP 收口目标：把小程序、admin-web、后端和部署链路推进到“主要功能真实可用、证据可验证、交接可复现”的上线可用状态。不要无休止优化；只围绕剩余 MVP 证据、必要缺陷修复和安全交接推进。

启动动作：
1. 读取 AGENTS.md、docs/Agent-Memory.md、docs/Context-Index.md、docs/Project-State.md、docs/MVP-Handoff-Packet.md、docs/MVP-Readiness.md、docs/MVP-Closeout-Audit.md、docs/MVP-Next-Goal-Prompt.md。
2. 执行 git status --short --branch --untracked-files=all。
3. 不默认读取 docs/archive/**，除非当前文档明确需要历史材料。
4. 记住当前事实：Round 39 的 RUN_PRODUCTION=1 scripts/check_mvp_regression.sh 已通过；Round 42 的 admin-web npm run lint/test/build 直接复核已通过；旧的 admin-web _refundId lint 或 3 个测试失败记录已经过期；MVP 仍缺 33 项外部/人工证据。

每一轮必须形成闭环：
1. 先输出本轮最小目标、会影响的证据 ID、风险、是否需要用户审批。
2. 开发前判断任务是否属于常见工程能力。如果是 auth/RBAC/支付/订单/日历/CRUD/上传/CI/CD/部署/监控/表单/校验/UI 通用模式等，必须使用 open-source-reference-first skill，优先查官方示例、成熟 GitHub/Gitee 项目或框架 recipe；记录来源、许可证兼容性、采用/拒绝原因。只有许可证兼容且适配本项目时才复制或改写代码；不要重复造轮子。若只是项目内证据、文档或脚本校验，说明无需外部代码。
3. 只处理一个最小 lane 或一个必要缺陷，不跨多条 lane 混做；保持 API 向后兼容。若 API 必须变化，同步调用方和 docs/API.md、docs/API-Schemas.md。
4. 完成本轮代码或证据后，更新 docs/MVP-Progress.md，必要时同步 docs/Project-State.md、docs/Decision-Log.md、docs/Context-Index.md、证据 JSON 和对应 QA/安全/生产文档。
5. 做目标纠偏：说明本轮解决了什么、剩余什么、下一轮推荐 lane、goal 是否需要修改。
6. 运行与改动匹配的自动验证。普通代码优先 scripts/check_mvp_regression.sh；生产只读证据可用 RUN_PRODUCTION=1 scripts/check_mvp_regression.sh 或 scripts/check_production_readonly_audit.sh；证据收口运行对应 strict checker。
7. 每轮结束必须 git add 并本地 commit 一次。不要自动 push、merge、workflow_dispatch 或部署。

安全边界：
- 未经用户明确批准，不允许 push 到 main、merge main、workflow_dispatch、触发生产部署、修改阿里云安全组/防火墙、执行真实支付/真实退款、修改生产数据。
- 不提交密钥、真实 AppID、token、cookie、短信码、密码、手机号、openid/unionid、商户凭据、完整订单号/支付号/退款号、私钥或含个人信息的截图。
- 真实 AppID 只能放在忽略跟踪的 sunflower-miniapp/project.private.config.json；提交态 sunflower-miniapp/project.config.json 必须保持 touristappid。

推荐推进顺序：
1. 若本轮刚启动，先确认自动基线：scripts/check_mvp_regression.sh；必要时再跑 RUN_PRODUCTION=1 scripts/check_mvp_regression.sh。
2. 之后每轮只选一个 approval lane：
   - MINIAPP-PREVIEW-DOMAIN：微信合法 HTTPS 域名、真实 AppID 私有配置、预览/真机登录、手机号、下单路径。
   - ADMIN-PROD-QA：生产或批准的 staging 管理后台账号、房态/价格/订单/售后人工 QA。
   - BACKEND-8080-HARDENING：只读获取阿里云安全组/防火墙证据，或拿到明确风险豁免。
   - CURRENT-BRANCH-DEPLOYED：经用户批准后 push/merge/workflow_dispatch，随后跑部署后只读审计。
   - WECHAT-PAYMENT-REFUND：经用户批准后做低金额真实支付/退款或记录逐项豁免。
   - EVIDENCE-WAIVER：用户对无法执行的外部证据逐项书面豁免。
3. 开始任何 lane 前，阅读 docs/MVP-External-Approval-Packet.md 并运行 node scripts/check_mvp_external_approval_packet.js；涉及生产变更、真实支付、真实退款、安全组、防火墙或部署时，先输出审批请求、风险、回滚方案并停止等待确认。
4. 证据只写脱敏摘要，写入 JSON 后运行对应 strict checker。

精确终止条件：
- scripts/check_mvp_regression.sh 通过。
- RUN_PRODUCTION=1 scripts/check_mvp_regression.sh 或部署后的 scripts/check_production_readonly_audit.sh 通过。
- node scripts/check_mvp_launch_evidence.js --strict 通过。
- node scripts/check_miniapp_manual_qa.js --strict 通过。
- node scripts/check_admin_web_manual_qa.js --strict 通过。
- node scripts/check_mvp_closeout_readiness.js --strict 通过。
- node scripts/check_mvp_handoff_packet.js 通过。
- git status --short --branch --untracked-files=all 干净，最后一轮已提交。
只有全部满足，或用户对缺失项逐项明确豁免并使 strict 检查通过，才能把 goal 标记 complete。

停止并等待人工介入：
- 需要真实支付/退款、生产数据变更、安全组/防火墙变更、push/merge/deploy，但用户尚未批准。
- 缺少真实 AppID、微信合法域名、商户号、QA 账号、可安全操作的 QA 数据等外部条件。
- 阶段性分析发现 goal 必须调整。若 Codex 暴露了明确、可审计、可安全修改的 goal 存储/API，可先读取确认 schema 后修改；不要盲改未知内部数据库。若无法安全修改，就停止当前 goal，并在对话中输出不超过 4000 字的新 goal 提示词等待人工介入。
```

## Next Round Recommendation

The next round should avoid another baseline-only refresh unless the working
tree or production state has changed. Choose one approval lane and collect
sanitized external evidence or an explicit waiver. The lowest-risk useful next
step is usually to prepare and request approval for either:

- `MINIAPP-PREVIEW-DOMAIN`: WeChat preview/domain evidence, if the operator can
  provide real AppID/private config and legal HTTPS domain context.
- `BACKEND-8080-HARDENING`: Alibaba Cloud security-group evidence or an explicit
  risk waiver, because current read-only checks cannot prove restriction.
- `CURRENT-BRANCH-DEPLOYED`: approved push/merge/deploy plus read-only
  post-deploy audit, if the user wants the current branch live.
