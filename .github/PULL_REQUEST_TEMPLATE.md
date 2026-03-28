## What this PR does
<!-- One sentence summary -->

## Depends on
<!-- PR-N must be merged first, or "none" -->

## Changes
-

## Test
- [ ] `make lint` — 0 issues
- [ ] `make test` — green
- [ ] `make mock` ran (if interface changed)
- [ ] Swagger annotations added → `make swagger` ran (if handler added/changed)
- [ ] `docs/ERRORS.md` updated (if bug fixed)

## Clean Architecture check
- [ ] No business logic in handlers
- [ ] No infrastructure imports in domain or application layers
- [ ] Typed domain errors used (`domainerrors.*`) — no `errors.New` for domain conditions
- [ ] No raw string context keys — always `pkg/ctxkey`
