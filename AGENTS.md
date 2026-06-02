# Repository Agent Notes

## Workflow

This repository no longer requires stage-locked development, stage guard commands,
stage reports, branch-name prefixes, or stage-prefixed commit messages.

For coding tasks:

1. Read the hot context first:
   - `docs/Agent-Memory.md`
   - `docs/Context-Index.md`
   - `docs/Project-State.md`
   - `git status --short --untracked-files=all`
2. Load only task-relevant warm docs from `docs/Context-Index.md`.
3. Do not read `docs/archive/**` by default; it is cold historical context only.
4. Keep API contracts backward-compatible by default.
5. If an API contract must change, update affected callers and the API docs.
6. Run focused automated checks for the touched area when practical.
7. Keep changes scoped and explain any manual verification steps.

## Memory and context hygiene

- Maintain `docs/Project-State.md` when durable facts, validation status, risks, or active topology change.
- Maintain `docs/Decision-Log.md` for durable architecture, workflow, dependency, deployment, or product decisions.
- Maintain `docs/Context-Index.md` when canonical docs, commands, or entry points move.
- Keep memory compact: replace stale facts instead of appending duplicates.
- Never write secrets or raw command logs into memory docs.

## Open-source reference first

For common, non-novel engineering features, use the `open-source-reference-first`
skill before implementation. This applies especially to auth, RBAC, payment
flows, booking calendars, admin CRUD, uploads, CI/CD, deployment scripts,
observability, validation, form flows, and reusable UI patterns.

Record the reference check in a progress document or final summary:

- sources checked
- license/compatibility
- selected approach
- what was copied, adapted, or rejected

## Frontend component policy

1. Prefer TDesign components:
   - In miniapp frontend work, prioritize official `tdesign-miniprogram` components and patterns.

2. Minimize new custom components:
   - Do not introduce new custom components unless there is a clear functional gap that TDesign cannot cover.

3. Ask before introducing new components:
   - Before adding any new custom component, explicitly ask for user confirmation and explain why TDesign is insufficient for this case.

4. Keep custom components thin when approved:
   - If a custom component is approved, keep it focused on business behavior/composition and reuse TDesign primitives for UI as much as possible.

## Documentation

Historical stage plans and reports remain in `docs/archive/` for reference only.
They are not active process requirements.
