# Skill: Spec Before Code

Use for non-trivial tasks (new endpoint, complex use case, new component with multiple states).
Write spec in a comment or `docs/WIP.md` BEFORE touching any code.

## Spec template
```markdown
## What
One sentence deliverable: "Add PATCH /applications/:id/status endpoint"

## Why
Problem it solves: "Users need to update status without re-submitting all fields"

## Affected files
- NEW: `internal/application/usecase/update_status.go`
- NEW: `queries/status_history.sql`
- MODIFY: `internal/infrastructure/http/handler/application.go`
- MODIFY: `cmd/server/main.go`

## API contract (if HTTP)
Request:  PATCH /api/v1/applications/:id/status
Body:     { "status": "Interview", "note": "Phone screen" }
200:      { "data": { ...application... } }
422:      { "error": "invalid status transition", "code": "INVALID_STATUS" }

## Business rules
- CanTransition(current, new) must return true
- On success: insert status_history row
- Invalidate cache key: dashboard:<userID>

## Edge cases
- Same status as current → 422 or no-op? → 422 (invalid transition)
- Missing status field → 400 validation error
- Application belongs to other user → 403

## Dependencies
- Requires PR-05 (domain Status value object) to be merged first
- Blocks PR-09 (application handler wiring)
```

## When to skip spec
- Single file change (typo, rename, config tweak)
- < 50 lines of new code
- Already detailed in PLAN.md

## When spec is mandatory
- New API endpoint
- New use case
- New component with > 2 states
- Any change that touches > 3 files
