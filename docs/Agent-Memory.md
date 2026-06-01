# Agent Memory and Context Management

> Purpose: keep Codex work on this repository fast, accurate, and resistant to
> context bloat from long histories, archived plans, stale docs, and dirty
> worktrees.

## 1. Design Principles

This project uses a small file-based memory harness inspired by current agent
context engineering patterns:

- Separate hot/warm/cold context instead of loading everything.
- Summarize durable state and decisions; do not replay every old conversation.
- Treat archived stage docs as cold historical evidence, not active rules.
- Prefer provenance: every durable memory should point to the source document,
  command, commit, or verification that supports it.
- Prune and overwrite stale facts instead of accumulating contradictions.

Reference ideas:

- LangGraph memory distinguishes short-term thread state from long-term
  cross-session memory and recommends persistent stores for production memory:
  https://docs.langchain.com/oss/python/langgraph/add-memory
- OpenAI's context engineering cookbook highlights trimming, summarization,
  context poisoning risk, and observability for long-running agents:
  https://developers.openai.com/cookbook/examples/agents_sdk/session_memory
- Microsoft's multi-agent context engineering guidance emphasizes filtering
  outdated/noisy context and maximizing relevant, timely information:
  https://microsoft.github.io/multi-agent-reference-architecture/docs/context-engineering/Context-Engineering.html

## 2. Memory Layers

### Hot Layer

Read at the start of every non-trivial task:

- `AGENTS.md`
- `docs/Context-Index.md`
- `docs/Project-State.md`
- `git status --short --untracked-files=all`

### Warm Layer

Read only when relevant to the task:

- `docs/Architecture.md`
- `docs/CI-CD.md`
- `docs/API.md`
- `docs/API-Schemas.md`
- `docs/DB-Design.md`
- `docs/DataDictionary.md`
- `docs/Web-Admin-Plan.md`
- `docs/S19-Prod-Deployment-Config.md`
- Recent entries from `docs/Decision-Log.md`

### Cold Layer

Do not load by default:

- `docs/archive/**`
- old stage plans
- old stage reports
- historical M1/S14 gate documents

Only read cold context when debugging historical behavior, migration ancestry,
or why a prior decision was made.

## 3. Per-Turn Context Protocol

1. Start with hot layer plus `git status`.
2. Identify the smallest warm docs needed for the task.
3. Ignore archived docs unless the user asks for history or a current doc points
   to a specific archived fact.
4. Before code changes, check whether the task is common enough to trigger
   `open-source-reference-first`.
5. After meaningful changes, update durable memory:
   - `docs/Project-State.md` for current facts, validation status, and risks.
   - `docs/Decision-Log.md` for durable decisions and rationale.
   - `docs/Context-Index.md` when docs, topology, commands, or entry points move.
6. Keep memory entries compact. Replace stale facts instead of appending
   duplicate versions.

## 4. Memory Write Rules

Write to memory when a fact is likely to matter across future turns:

- architecture or deployment topology changes
- workflow/process changes
- validated test status changes
- known production risks
- new canonical documents or retired documents
- external service assumptions
- non-obvious technical decisions

Do not write:

- raw command logs
- transient exploration notes
- secrets
- large diffs
- guesses without provenance

## 5. Dirty Worktree Hygiene

- Always inspect `git status` before editing.
- Preserve user changes; do not revert unrelated files.
- If a memory update describes uncommitted state, mark it as `uncommitted`.
- After commit, update `docs/Project-State.md` if the state changed materially.

## 6. Goal / Long-Run Hygiene

For long-running goals:

- End each round with a compact round summary document if substantial work was
  done.
- Commit each round separately.
- If the goal needs to change, write the proposed replacement goal in the round
  summary and stop for human approval when automatic goal mutation is not safe
  or unavailable.

