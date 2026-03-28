# job-tracker
Single-user job application tracker. React SPA + Go API + Docker Compose. No cloud auth.

## Stack
Go 1.25 · Chi v5 · GORM · React 18 + Vite + Tailwind + shadcn/ui · PostgreSQL 15 · Redis 8 · golang-migrate · mockery · slog

## Architecture
domain ← application ← infrastructure (never reversed)
DI wiring ONLY in `cmd/api/main.go`

## Dev commands
```
make run          # go run (local, no Docker)
make docker-up    # start containers — NO rebuild (fast)
make docker-build # rebuild image — ONLY when: go.mod changes · Dockerfile.dev changes · first time
make migrate-up   # apply pending migrations (inside container)
make swagger      # generate Swagger docs — run after adding/changing handler annotations
make test         # unit + integration tests
make mock         # regenerate mocks (after interface changes)
make lint         # golangci-lint
make seed         # insert demo data
```
Ports: backend=3001 · frontend=5173 · postgres=5433 · redis=6380
Swagger UI: http://localhost:3001/api/v1/swagger/index.html
Docker: source mounted as volume → air hot reload. air chỉ watch cmd/ internal/ pkg/ — KHÔNG watch docs/ mocks/ để tránh infinite loop.

## Non-negotiable rules
- Handler: parse → validate DTO → call use case → respond. Zero business logic.
- Status change: `TransitionStatus()` on entity → TxManager wraps update+history.
- GORM models live in `infrastructure/persistence/models/` — NEVER use as domain entity.
- No cache/log logic inside use cases — use infrastructure decorators.
- Typed domain errors: `domainerrors.NotFound("Application", msg)` — never `errors.New`.
- Use raw string context keys: NEVER. Always `pkg/ctxkey` typed keys.
- Config: all required fields validated on startup — app panics with clear message if missing.
- Use case tests: `mockery` mocks. Repo tests: real PostgreSQL via `testcontainers`.
- Before new branch: `gh pr diff <n> --name-only` for every open PR — wait if overlap.
- After any bug fix: append `docs/ERRORS.md`.
- After each task: mark `[x]` in `PLAN.md`.

## Read when relevant
| When | Read |
|------|------|
| Before git/PR | `AGENTS.md` |
| Before any Go code | `docs/RULES.md` |
| Implementing patterns (TxManager/cache/repo) | `.claude/skills/patterns-go.md` |
| Before any React code | `.claude/skills/ui.md` |
| Adding a feature | `.claude/skills/feat.md` |
| Fixing a bug | `.claude/skills/fix.md` |
| Non-trivial task | `.claude/skills/spec.md` |
| Known bugs/pitfalls | `docs/ERRORS.md` |
| Next task | `PLAN.md` (first `[ ]`) |
| Backend: folder map + DI wiring | `docs/ARCHITECTURE_BACKEND.md` |
| Frontend: folder map + patterns | `docs/ARCHITECTURE_FRONTEND.md` |
| API contracts | `docs/API_SPEC.md` |
| UI / components | `docs/UI_SPEC.md` |
| Business requirements | `docs/BA_SPEC.md` |
