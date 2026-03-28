# Skill: Fix a Bug

## Before starting
1. `docs/ERRORS.md` → known issue?
2. `gh pr diff <n> --name-only` → file overlap check
3. `docs/RULES.md` + `patterns-go.md` → relevant section

## Steps
1. Write **failing test first** that reproduces the bug
2. Identify layer: Domain / Application / Infrastructure / Frontend
3. Fix root cause only — do NOT touch unrelated code
4. `make lint && make test` → green
5. Branch → commit → PR → `gh pr merge --auto --squash <n>`
6. Append `docs/ERRORS.md` (symptom / root cause / fix / prevention)

## Circuit breaker
Same error 3× → STOP. Write ERRORS.md. Ask user.
5+ attempts → STOP. Revert. Ask user.

## Common traps
| Symptom | Likely cause |
|---------|-------------|
| Test pass, prod fail | Mock diverged from real impl — use testcontainers |
| Cache stale after mutation | Missing `InvalidateUser()` in handler |
| 500 instead of 422 | `mapDomainError` missing a case |
| Frontend shows old data | Missing `invalidateQueries` after mutation |
| Invalid transition not caught | `TransitionStatus()` not called — status set directly |
