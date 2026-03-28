# Coding Rules

## Go Backend

### Layer imports (enforced by linter)
```
domain/     → stdlib only
application/ → domain + stdlib
infrastructure/ → domain + application + any library
cmd/api/    → everything (DI only)
pkg/        → stdlib only
```

### Use case structure
- `Execute(ctx, req)`: 1. `req.Validate()` · 2. domain constructor · 3. repo call · 4. map to DTO
- Multi-table mutations: wrap in `TxManager.WithTransaction` (never GORM directly in UC)
- Cache: NEVER in use cases — use infrastructure decorators (see `.claude/skills/patterns-go.md`)

### DTOs
- All request DTOs: `Validate() error` + `ToEntity()` + response DTOs: `FromEntity()`
- `Validate()` uses `go-playground/validator` → return `domainerrors.InvalidInput` on failure

### Errors
- Domain conditions: `domainerrors.NotFound / AlreadyExists / InvalidStatus / Unauthorized / InvalidInput`
- Infra wrapping: `fmt.Errorf("appRepo.FindByID: %w", err)` — never naked `errors.New` for domain

### Handlers
- Parse JSON → set UserID from ctx → call UC → `mapDomainError` or `respondJSON`. Zero logic.
- Response: `{"success":true,"data":{...}}` / `{"success":false,"error":{"code":"...","message":"..."}}`

### Repositories
- Always return entity, never GORM model: `return m.ToEntity(), nil`
- Wrap `gorm.ErrRecordNotFound` → `domainerrors.NotFound`
- `db(ctx)` helper: detects `ctxkey.GetTx(ctx)`, fallback to `r.gdb.WithContext(ctx)`

### No-go list
- ❌ GORM model in domain or application layer
- ❌ Cache / log logic inside use cases
- ❌ `errors.New` / `fmt.Errorf` for domain conditions
- ❌ Raw string context keys — always `pkg/ctxkey`
- ❌ Business logic in handlers or repositories
- ❌ `init()` · global mutable state · `git add -A`
- ❌ Fat interfaces (> 5 methods) — split by ISP

**Code patterns with examples → `.claude/skills/patterns-go.md`**

---

## React Frontend

### API calls — always through api.ts
### Mutations — always `invalidateQueries(['jobs'], ['dashboard'])`
### Always handle 3 states: `isLoading` → Skeleton · `error` → Alert+Retry · `!data` → EmptyState
### Animations: `import { motion } from 'motion/react'` — NOT framer-motion
### Dark mode: every className needs `dark:` variant
