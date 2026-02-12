# Repository Agent Rules

## Stage-first workflow (mandatory)

These rules apply to all coding tasks in this repository.

1. Before any code changes:
   - Read `/Users/chenyao/dev/miniapp/sunflower/docs/Agent-Stage-Plan.md`.
   - Read `/Users/chenyao/dev/miniapp/sunflower/docs/Backlog.md`.
   - Lock work to exactly one stage (`Sx`).

2. Scope control:
   - Do not implement multiple stages in one turn.
   - If user request spans multiple stages, execute only the current stage and list deferred items.

3. API contract guard:
   - Keep API contract backward-compatible by default.
   - If contract changes are required, update:
     - caller side (miniapp/admin web as applicable)
     - `/Users/chenyao/dev/miniapp/sunflower/docs/API.md`
     - `/Users/chenyao/dev/miniapp/sunflower/docs/API-Schemas.md`

4. Verification guard:
   - Run at least one executable automated test command for the touched stage.
   - Provide manual verification steps for QA replay.

5. Stage completion guard:
   - Update `/Users/chenyao/dev/miniapp/sunflower/docs/Backlog.md` stage checkbox.
   - Create or update `/Users/chenyao/dev/miniapp/sunflower/docs/stage-reports/Sx.md`.
   - Run:
     - `./scripts/stage_guard.sh pre Sx` before development
     - `./scripts/stage_guard.sh post Sx` before final response

6. Git conventions:
   - Branch naming must follow `codex/s<stage>-<slug>` (example: `codex/s1-db-migration`).
   - Commit subject must start with stage prefix (example: `[S1] add flyway baseline`).

## Stage report format

Use `/Users/chenyao/dev/miniapp/sunflower/docs/stage-reports/_TEMPLATE.md` and keep all required headings.
Also follow `/Users/chenyao/dev/miniapp/sunflower/docs/Definition-of-Done.md`.

## Skill shortcuts (recommended)

When relevant, explicitly invoke these skills:

- `$stage-executor`: Use for complete single-stage delivery (`Sx`) with guard commands and reporting.
- `$api-contract-guard`: Use when controller/DTO/API behavior may change.
- `$spring-persistence-stage`: Use for Spring Boot in-memory to MySQL persistence migration stages.
