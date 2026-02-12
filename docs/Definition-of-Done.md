# Stage Definition of Done（DoD）

> 适用范围：`docs/Agent-Stage-Plan.md` 的所有 Stage（S0-S14）

## 1. 必须满足项（每个 Stage）

- [ ] 范围单一：本次仅完成一个 Stage，不跨大模块
- [ ] 需求确认：已明确本 Stage 的目标、边界、验收标准
- [ ] 代码完成：实现达到该 Stage 目标
- [ ] 自动化测试：至少执行 1 条可运行测试命令并记录结果
- [ ] 人工复核：提供可复现的手工验证步骤
- [ ] API 契约：保持兼容，或已同步调用端与 API 文档
- [ ] 文档更新：`docs/Backlog.md` 勾选状态已更新
- [ ] Stage 报告：`docs/stage-reports/Sx.md` 已完整填写
- [ ] 守卫通过：`make stage-pre STAGE=Sx` 与 `make stage-post STAGE=Sx` 通过

## 2. PR 规范（强制）

- [ ] 分支命名：`codex/s<stage>-<slug>`（例：`codex/s1-db-migration`）
- [ ] 提交前缀：所有提交信息以 `[Sx]` 开头（例：`[S1] add flyway baseline`）
- [ ] PR 门禁通过：Stage Guard + 自动化测试通过

## 3. Stage 报告模板要求

`docs/stage-reports/Sx.md` 必须包含以下章节：

1. `## 需求确认`
2. `## 代码改动`
3. `## 自动化测试`
4. `## 人工复核步骤`
5. `## DoD Checklist`
6. `## API 契约影响`
7. `## 风险与后续`
