# Stage Reports

每个已完成 Stage 都应产出一个报告文件：

- 路径：`docs/stage-reports/Sx.md`
- 模板：`docs/stage-reports/_TEMPLATE.md`

推荐流程：

1. 开始前运行：`./scripts/stage_guard.sh pre Sx`
2. 完成开发与测试后，填写：`docs/stage-reports/Sx.md`
3. 勾选：`docs/Backlog.md` 对应 Stage
4. 结束前运行：`./scripts/stage_guard.sh post Sx`

注意：

- 报告必须包含 `## DoD Checklist` 章节（见模板）。
