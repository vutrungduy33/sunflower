# Decision Log

Append durable decisions here. Keep entries short and include provenance.

## 2026-06-02: Remove Stage Gate as Active Workflow

- Decision: Stage-first workflow, pre/post stage guard, branch prefix, commit
  prefix, and GitHub PR gate are no longer active requirements.
- Rationale: The project moved from staged delivery governance to direct MVP
  hardening and deployment validation.
- Provenance: `AGENTS.md`, `docs/CI-CD.md`, `docs/archive/README.md`.

## 2026-06-02: Archive Historical Stage Materials

- Decision: Move historical stage plans, backlogs, reports, M1 checks, and S14
  gate docs under `docs/archive/`.
- Rationale: Preserve traceability without letting stale process docs mislead
  future agents.
- Provenance: `docs/archive/README.md`, `README.md`, `docs/README.md`.

## 2026-06-02: Adopt File-Based Agent Memory Harness

- Decision: Use `docs/Agent-Memory.md`, `docs/Context-Index.md`,
  `docs/Project-State.md`, and `docs/Decision-Log.md` as the active project
  memory system.
- Rationale: Keep future Codex turns focused on hot context and avoid loading
  noisy archived history by default.
- Provenance: User request on 2026-06-02; references linked in
  `docs/Agent-Memory.md`.

## 2026-06-02: Open-Source Reference First

- Decision: Add global Codex skill `open-source-reference-first` and require
  common feature work to check mature OSS/official examples before custom
  implementation.
- Rationale: Reduce reinvention and improve robustness for common engineering
  problems while respecting licenses.
- Provenance: `/Users/chenyao/.codex/skills/open-source-reference-first/SKILL.md`.

