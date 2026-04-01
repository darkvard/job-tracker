# PLAN.md — Job Tracker MVP

> **Rules:**
> - Each task = 1 PR (100–400 lines). Complete IN ORDER. Never skip.
> - Mark `[x]` only after PR merges + CI green.
> - Stuck 3×? → STOP, append `docs/ERRORS.md`, ask user.

---

## Phase 0: Project Skeleton

### [x] PR-01: Go project init + health endpoint
**Docs:** `docs/RULES.md` · `docs/ARCHITECTURE_BACKEND.md` (DI wiring section)
**Files:** `backend/go.mod` · `backend/cmd/api/main.go` · `backend/internal/infrastructure/config/config.go` · `backend/internal/infrastructure/http/server.go` · `backend/internal/infrastructure/http/router.go` · `backend/internal/infrastructure/http/handler/health.go`

- [x] `go mod init job-tracker`
- [x] Config struct with `envconfig`: PORT, DB_DSN, REDIS_ADDR, JWT_SECRET, JWT_EXPIRY — `Load()` panics on missing required fields
- [x] Chi router + `GET /api/v1/health` → `{"success":true,"data":{"status":"ok","version":"1.0.0"}}`
- [x] Graceful shutdown on `SIGINT`/`SIGTERM` with 10s timeout
- [x] Standardized response helpers: `respondJSON(w, status, data)` · `respondError(w, status, msg, code)`
- [x] Mount Swagger UI: `GET /api/v1/swagger/*` via `swaggo/http-swagger` (package: `github.com/swaggo/http-swagger`) — import blank `_ "job-tracker/docs"` in router.go

**Test:**
```bash
go run ./cmd/api              # local verify — "Server started on :3000"
curl localhost:3001/api/v1/health  # → 200 {"success":true,"data":{"status":"ok"}}
make docker-build             # build dev image ONCE (go.mod now exists)
make docker-up                # start all containers
make migrate-up               # apply migrations
make swagger                  # generate initial docs (runs once to create docs/ folder)
# → http://localhost:3001/api/v1/swagger/index.html shows health endpoint
```
> `make docker-build` only needs to be run once in PR-01 because `go.mod` has just been created.
> The following PRs only need to `make docker-up` — the source will automatically reload via air.
> `docs/` is removed from Air Watch → does not cause infinite loop.

---

### [x] PR-02: PostgreSQL + GORM + TxManager + migrations
**Docs:** `docs/RULES.md` · `.claude/skills/patterns-go.md` · `docs/ARCHITECTURE_BACKEND.md` (DB schema + TxManager pattern)
**Files:** `backend/internal/infrastructure/persistence/postgres.go` · `txmanager.go` · `backend/migrations/000001_init.up.sql` · `000001_init.down.sql` · `backend/pkg/ctxkey/ctxkey.go`

- [x] GORM PostgreSQL connection: `MaxOpenConns=25`, `MaxIdleConns=10`, `ConnMaxLifetime=5min`
- [x] `pkg/ctxkey`: typed keys + helpers `WithUserID/GetUserID · WithTx/GetTx · WithRequestID/GetRequestID`
- [x] `GORMTxManager` implements `domain/repository.TxManager`:
  - `WithTransaction(ctx, fn)` wraps `db.Transaction()`
  - Injects `*gorm.DB` into context via `ctxkey.WithTx`
- [x] All repo `db(ctx)` helper: detects tx from context, falls back to `r.gdb.WithContext(ctx)`
- [x] Migration 000001: `users`, `applications`, `status_history` tables (see `docs/ARCHITECTURE_BACKEND.md`)
- [x] Indexes: `(user_id, status)`, `(user_id, date_applied DESC)`, `(application_id, changed_at DESC)`
- [x] Wire postgres + txmanager in main.go: connect on startup, run migrations

**Test:** `make docker-up && make migrate-up` → logs "Connected to PostgreSQL" + "Migrations applied"

---

### [x] PR-03: Redis connection
**Docs:** `docs/RULES.md` · `docs/ARCHITECTURE_BACKEND.md` (cache section)
**Files:** `backend/internal/infrastructure/cache/redis.go`

- [x] `RedisCache` struct wrapping `go-redis/v9` client
- [x] Methods: `GetJSON(ctx, key, dest)` · `SetJSON(ctx, key, val, ttl)` · `Delete(ctx, key)` · `DeletePattern(ctx, pattern)` — DeletePattern uses `SCAN`, never `KEYS`
- [x] Cache interface defined in `infrastructure/cache/cache.go` (NOT in domain — cache is infra concept)
- [x] Graceful degradation: unavailable Redis → log warning, `GetJSON` returns error, decorators handle gracefully
- [x] Wire in main.go

**Test:** `make docker-up` → log "Redis connected" OR "Redis unavailable, continuing without cache"

---

### [x] PR-04: Middleware stack
**Docs:** `docs/RULES.md` · `docs/API_SPEC.md` (error response format)
**Files:** `backend/internal/infrastructure/http/middleware/recovery.go` · `requestid.go` · `logger.go` · `cors.go` · `auth.go` (stub)

- [x] Recovery: panic → log stack trace with slog → 500 `{"success":false,"error":{"code":"INTERNAL","message":"internal error"}}`
- [x] RequestID: read `X-Request-ID` header or generate UUID → inject via `ctxkey.WithRequestID` → set on response header
- [x] Logger: slog structured `{"method","path","status","duration","request_id"}` after response
- [x] CORS: allow `http://localhost:5173`, standard methods/headers
- [x] Auth (stub): reads `Authorization: Bearer <jwt>` → inject userID (full impl in PR-07)
- [x] Middleware chain: Recovery → RequestID → Logger → CORS

**Test:** `curl -v localhost:3001/api/v1/health` → see `X-Request-ID` header + JSON response + slog output

---

## Phase 1: Domain + Auth

### [x] PR-05: Domain layer
**Docs:** `docs/RULES.md` · `docs/BA_SPEC.md` (status transition rules + business constraints) · `docs/ARCHITECTURE_BACKEND.md` (domain layer structure)
**Files:** `backend/internal/domain/errors/errors.go` · `domain/entity/user.go` · `application.go` · `domain/valueobject/status.go` · `source.go` · `pagination.go` · `domain/repository/user.go` · `application.go` · `tx.go` · `backend/pkg/clock/clock.go`

- [x] `DomainError{Code, Entity, Message, Err}` + `Error()`, `Unwrap()` + constructors: `NotFound`, `AlreadyExists`, `InvalidStatus`, `Unauthorized`, `InvalidInput`
- [x] `User` entity: `NewUser(email, hash, name string) (*User, error)` — validates email format
- [x] `Application` entity: `NewApplication(userID, company, role, source, status, dateApplied)` + `TransitionStatus(newStatus Status) error` — encapsulates `CanTransition` logic
- [x] `Status` value object: enum + `CanTransition(from, to Status) bool` (Applied→Interview✓ · Applied→Rejected✓ · Interview→Offer✓ · Interview→Rejected✓ · Offer/Rejected→anything✗)
- [x] `Source` value object: enum + `IsValid() bool`
- [x] `PageRequest{Page, Size, SortBy, Order}` + `PageResponse[T any]{Items []T, Total int64, Page, Size int}`
- [x] `TxManager` interface in `domain/repository/tx.go`
- [x] `UserRepository` interface (4 methods max: Create, FindByID, FindByEmail, ExistsByEmail)
- [x] `ApplicationRepository` interface (Create, FindByID, List, UpdateWithHistory, Delete)
- [x] `pkg/clock`: `Clock` interface (`Now() time.Time`) + `RealClock` + `MockClock` (for tests)
- [x] Unit tests: `Status.CanTransition()` all transitions · `Application.TransitionStatus()` valid/invalid

**Test:** `make test` → all domain tests pass, **zero** external imports in `domain/`

---

### [x] PR-06: Auth use cases
**Docs:** `docs/RULES.md` · `docs/API_SPEC.md` (auth endpoints + request/response shape) · `docs/BA_SPEC.md` (auth requirements)
**Files:** `backend/internal/application/port/hasher.go` · `token.go` · `backend/internal/application/auth/dto.go` · `register.go` · `login.go`

- [x] `PasswordHasher` interface: `Hash(plain string) (string, error)` · `Compare(hash, plain string) error`
- [x] `TokenService` interface: `Generate(userID int64, email string) (string, error)` · `Validate(token string) (userID int64, email string, error)`
- [x] `RegisterRequest{Email, Password, Name}` + `Validate()` (email format, password ≥8 chars)
- [x] `LoginRequest{Email, Password}` + `Validate()`
- [x] `AuthResponse{Token string, User UserInfo}` + `FromEntity(user, token)`
- [x] `RegisterUseCase.Execute()`: validate → ExistsByEmail → hash → create user → generate token
- [x] `LoginUseCase.Execute()`: validate → FindByEmail → Compare → generate token
- [x] Unit tests with mockery mocks: duplicate email → `AlreadyExists` · wrong password → `Unauthorized`

**Test:** `make test` → auth use case tests pass, **zero** infrastructure imports

---

### [x] PR-07: Auth infrastructure
**Docs:** `docs/RULES.md` · `.claude/skills/patterns-go.md` · `docs/API_SPEC.md` (auth endpoints exact request/response)
**Files:** `backend/internal/infrastructure/auth/bcrypt.go` · `jwt.go` · `backend/internal/infrastructure/persistence/models/user.go` · `backend/internal/infrastructure/persistence/user_repo.go` · `backend/internal/infrastructure/http/handler/auth.go` · `backend/internal/infrastructure/http/middleware/auth.go` (full impl) · `backend/cmd/api/main.go` (update wiring)

- [x] `BcryptHasher` implements `application/port.PasswordHasher` (cost=12)
- [x] `JWTService` implements `application/port.TokenService` (HS256, claims: sub+email+iat+exp)
- [x] `UserModel` (GORM) + `ToEntity()` + `fromEntity()` mapping — NEVER leak model outside `persistence/`
- [x] `PostgresUserRepo` implements `domain/repository.UserRepository` via GORM
  - Wrap `gorm.ErrRecordNotFound` → `domainerrors.NotFound`
  - Wrap duplicate key → `domainerrors.AlreadyExists`
- [x] Auth handler: `POST /api/v1/auth/register` (201) · `POST /api/v1/auth/login` (200) · `GET /api/v1/auth/me` (200, protected)
- [x] Auth middleware (full): validate JWT → `ctxkey.WithUserID(ctx, id)` → next handler
- [x] Add `// @Summary` swagger annotations to all 3 auth handler methods → `make swagger` → commit `docs/`
- [x] Wire everything in main.go

**Test:**
```bash
curl -X POST localhost:3001/api/v1/auth/register -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123","name":"Test"}' # → 201
curl -X POST localhost:3001/api/v1/auth/login \
  -d '{"email":"test@test.com","password":"password123"}' # → 200 with token
curl -H "Authorization: Bearer <token>" localhost:3001/api/v1/auth/me # → 200
```

---

## Phase 2: Job Applications CRUD

### [x] PR-08: Job use cases
**Docs:** `docs/RULES.md` · `.claude/skills/patterns-go.md` · `docs/API_SPEC.md` (job endpoints + field names) · `docs/BA_SPEC.md` (status transitions + validation rules)
**Files:** `backend/internal/application/job/dto.go` · `create.go` · `list.go` · `get.go` · `update.go` · `update_status.go` · `delete.go` · `usecases.go`

- [x] `dto.go`: `CreateRequest` · `UpdateRequest` · `UpdateStatusRequest` · `ListFilters` · `JobResponse` · `PaginatedJobsResponse` — all with `Validate()`, `ToEntity()`, `FromEntity()`
- [x] `CreateUseCase.Execute()`: validate → `entity.NewApplication(...)` → repo.Create → return DTO
- [x] `ListUseCase.Execute()`: validate filters → `repo.List(filters, page)` → return `PageResponse[JobResponse]`
- [x] `GetUseCase.Execute()`: `repo.FindByID` → verify `app.UserID == req.UserID` → return DTO
- [x] `UpdateUseCase.Execute()`: get → verify ownership → update fields → `repo.Update`
- [x] `UpdateStatusUseCase.Execute()`: uses `TxManager.WithTransaction` → `app.TransitionStatus()` → `repo.UpdateWithHistory(ctx, app, note)` (atomic)
- [x] `DeleteUseCase.Execute()`: get → verify ownership → `repo.Delete`
- [x] `usecases.go`: `JobUseCases` struct grouping all 6
- [x] Unit tests for all use cases with mockery mocks
- [x] Test cases: wrong userID → `Unauthorized` · invalid transition → `InvalidStatus`

**Test:** `make test` → all job use case tests pass

---

### [x] PR-09: Job infrastructure
**Docs:** `docs/RULES.md` · `.claude/skills/patterns-go.md` (UpdateWithHistory + cache invalidator) · `docs/API_SPEC.md` (job endpoints exact response shape) · `docs/ARCHITECTURE_BACKEND.md` (cache keys table)
**Files:** `backend/internal/infrastructure/persistence/models/application.go` · `status_history.go` · `backend/internal/infrastructure/persistence/application_repo.go` · `backend/internal/infrastructure/http/handler/job.go` · `backend/cmd/api/main.go` (update wiring)

- [x] `ApplicationModel` + `StatusHistoryModel` (GORM) — both with `ToEntity()` + `fromEntity()`
- [x] `PostgresApplicationRepo` implements `domain/repository.ApplicationRepository`:
  - `Create`: insert app + insert first status_history row (status = Applied, from_status = NULL)
  - `FindByID`: preload status_history ordered by changed_at ASC
  - `List`: dynamic WHERE with GORM scopes (status filter, search via ILIKE), pagination, sort whitelist
  - `UpdateWithHistory`: update app + insert status_history row — repo detects tx from context via `db(ctx)`
  - `Delete`: hard-delete
- [x] `infrastructure/cache/invalidator.go`: `JobCacheInvalidator.InvalidateUser(ctx, userID)` — deletes `dashboard:<userID>` + `analytics:*:<userID>` (fire-and-forget, never fail mutation)
- [x] `JobHandler` receives `*job.UseCases` + `*cache.JobCacheInvalidator`:
  - `POST /api/v1/jobs` (201) · `GET /api/v1/jobs` (200, paginated) · `GET /api/v1/jobs/:id` (200) · `PUT /api/v1/jobs/:id` (200) · `PATCH /api/v1/jobs/:id/status` (200) · `DELETE /api/v1/jobs/:id` (200)
  - Call `invalidator.InvalidateUser` after every successful Create / Update / UpdateStatus / Delete
  - All routes protected by auth middleware
- [x] Sort column whitelist: `map[string]string{"company":"company","date_applied":"date_applied","created_at":"created_at"}`
- [x] Add swagger annotations to all 6 job handler methods → `make swagger` → commit `docs/`
- [x] Wire in main.go: `invalidator := cache.NewJobCacheInvalidator(rdb)` → pass to `handler.NewJob(jobUCs, invalidator)`

**Test:**
```bash
TOKEN="<from PR-07>"
curl -X POST localhost:3001/api/v1/jobs -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"company":"Google","role":"SDE","dateApplied":"2026-03-28","source":"LinkedIn","status":"Applied"}'
# → 201 {"success":true,"data":{...}}
curl "localhost:3001/api/v1/jobs?status=Applied&page=1&page_size=10" -H "Authorization: Bearer $TOKEN"
# → 200 {"success":true,"data":[...],"meta":{"total":1,"page":1,"pageSize":10,"totalPages":1}}
curl -X PATCH localhost:3001/api/v1/jobs/1/status -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"status":"Interview","note":"Phone screen scheduled"}'
# → 200 (Applied→Interview valid)
# Interview→Applied → 422 {"success":false,"error":{"code":"INVALID_STATUS","message":"..."}}
```

---

## Phase 3: Dashboard + Analytics

### [x] PR-10: Dashboard use case + cache decorator
**Docs:** `docs/RULES.md` · `.claude/skills/patterns-go.md` (cache decorator pattern) · `docs/API_SPEC.md` (dashboard endpoint + KPI field names) · `docs/BA_SPEC.md` (dashboard KPI definitions)
**Files:** `backend/internal/application/analytics/dto.go` · `dashboard.go` · `backend/internal/infrastructure/cache/decorator/dashboard.go` · `backend/internal/infrastructure/http/handler/analytics.go` (partial) · `backend/cmd/api/main.go` (update wiring)

- [x] `DashboardKPIs` DTO: total, applied, interview, offer, rejected, trends (vs prev month), statusBreakdown, recentJobs (last 5)
- [x] `GetDashboardUseCase.Execute(ctx, userID)`: queries repo — **ZERO** cache logic inside
- [x] Cache decorator `cachedDashboard`: wraps `GetDashboardUseCase`, checks Redis `dashboard:<userID>` (TTL 5min), falls back gracefully if Redis down
- [x] Invalidation handled by `JobCacheInvalidator` in `JobHandler` (PR-09) — decorator does GET/SET only, never DELETE
- [x] Handler: `GET /api/v1/dashboard/kpis` (protected) — add swagger annotation → `make swagger`
- [x] Unit test: assert use case never calls cache (mock shows zero cache calls)

**Test:** `curl localhost:3001/api/v1/dashboard/kpis -H "Authorization: Bearer $TOKEN"` → 200 with all fields

---

### [x] PR-11: Analytics use cases + cache decorators
**Docs:** `docs/RULES.md` · `.claude/skills/patterns-go.md` · `docs/API_SPEC.md` (analytics endpoints + response shapes) · `docs/BA_SPEC.md` (analytics metric definitions)
**Files:** `backend/internal/application/analytics/analytics.go` · `backend/internal/infrastructure/cache/decorator/analytics.go` · `backend/internal/infrastructure/http/handler/analytics.go` (complete) · `backend/cmd/api/main.go` (update wiring)

- [x] 4 analytics DTOs: `WeeklyData` · `FunnelData` · `SourceData` · `KeyMetrics`
- [x] `GetAnalyticsUseCase`: 4 methods (Weekly, Funnel, Sources, Metrics) — pure, no cache
- [x] Cache decorator wraps each method (TTL 10min each)
- [x] 4 endpoints: `GET /api/v1/analytics/weekly` · `/funnel` · `/sources` · `/metrics`
- [x] Add swagger annotations to all 4 analytics handlers → `make swagger` → commit `docs/`
- [x] Unit tests for use cases

**Test:** All 4 endpoints return 200 with correct structure

---

## Phase 4: Frontend Wiring

### [x] PR-12: API client + Auth context + Login page
**Docs:** `docs/RULES.md` · `.claude/skills/ui.md` · `docs/ARCHITECTURE_FRONTEND.md` · `docs/UI_SPEC.md` (Login page spec) · `docs/API_SPEC.md` (auth endpoints) · `docs/DESIGN_SYSTEM.md` (colors + tokens)
**Files:** `frontend/src/lib/api.ts` · `frontend/src/contexts/AuthContext.tsx` · `frontend/src/app/components/LoginPage.tsx` · `frontend/src/app/App.tsx` (modify) · `frontend/package.json`

- [x] Install: `@tanstack/react-query` · `axios` · `react-router-dom`
- [x] `api.ts`: axios instance + `VITE_API_URL` base + JWT interceptor + all endpoint functions (endpoint is `/api/v1/jobs` not `/applications`)
- [x] `AuthContext`: `{ user, token, login(), register(), logout(), isAuthenticated }`
- [x] `LoginPage`: tab-based login/register with shadcn `<Tabs>` + `<Input>` + `<Button>`
- [x] `App.tsx`: `<QueryClientProvider>` + `<AuthProvider>` — unauthenticated → `LoginPage`

**Test:** Login with test user → see dashboard

---

### [x] PR-13: Dashboard wiring
**Docs:** `.claude/skills/ui.md` · `docs/UI_SPEC.md` (Dashboard page spec) · `docs/API_SPEC.md` (dashboard endpoint response) · `docs/DESIGN_SYSTEM.md` · `docs/ANIMATIONS_SPEC.md` (KPI card + chart animations)
**Files:** `frontend/src/app/components/Dashboard.tsx` (modify)

- [x] Replace mock data with `useQuery(['dashboard'], api.dashboard.getKPIs)`
- [x] Loading: `<Skeleton>` · Error: `<Alert>` retry · Empty: CTA when total=0
- [x] Pie chart from `statusBreakdown` · Recent table from `recentJobs`
- [x] Trend values from `trends` object → KPICard props

**Test:** Real data from API, add job → KPIs reflect change

---

### [x] PR-14: ApplicationsList wiring
**Docs:** `.claude/skills/ui.md` · `docs/UI_SPEC.md` (ApplicationsList page spec) · `docs/API_SPEC.md` (list endpoint + query params) · `docs/DESIGN_SYSTEM.md`
**Files:** `frontend/src/app/components/ApplicationsList.tsx` (modify)

- [x] `useQuery(['jobs', filters])` — re-fetches on filter/search change
- [x] Debounced search (300ms)
- [x] Delete: `<AlertDialog>` confirm → `useMutation(api.jobs.delete)` → `invalidateQueries(['jobs','dashboard'])`
- [x] Pagination controls

**Test:** Filter, search, paginate, delete with confirm dialog

---

### [x] PR-15: AddApplicationForm wiring
**Docs:** `.claude/skills/ui.md` · `docs/UI_SPEC.md` (AddApplicationForm spec) · `docs/API_SPEC.md` (create job endpoint + validation errors) · `docs/ANIMATIONS_SPEC.md` (form submit animation)
**Files:** `frontend/src/app/components/AddApplicationForm.tsx` (modify)

- [x] `useMutation(api.jobs.create)` → on success: invalidate + show animation + redirect
- [x] Inline API validation errors from `error.error.message`
- [x] Spinner + disabled on submit button while loading

**Test:** Create job → appears in list

---

### [x] PR-16: ApplicationDetail + Analytics wiring
**Docs:** `.claude/skills/ui.md` · `docs/UI_SPEC.md` (ApplicationDetail + Analytics page spec) · `docs/API_SPEC.md` (detail + analytics endpoints) · `docs/ANIMATIONS_SPEC.md` · `docs/DESIGN_SYSTEM.md`
**Files:** `frontend/src/app/components/ApplicationDetail.tsx` (modify) · `Analytics.tsx` (modify)

- [x] Detail: `useQuery(['job', id])` → real data + status history timeline
- [x] Status update: `useMutation(api.jobs.updateStatus)` + confirm
- [x] Delete: `AlertDialog` → `useMutation` → navigate back
- [x] Analytics: 4 parallel `useQuery` calls → real Recharts data

**Test:** View/update/delete detail; analytics charts show real data

---

### [ ] PR-17: React Router
**Docs:** `.claude/skills/ui.md` · `docs/UI_SPEC.md` (routing + page structure)
**Files:** `frontend/src/app/App.tsx` · `ProtectedLayout.tsx` (new) · `Navbar.tsx` (modify)

- [ ] Routes: `/login` · `/` · `/jobs` · `/jobs/new` · `/jobs/:id` · `/analytics`
- [ ] `ProtectedLayout`: auth check → redirect `/login` + renders Navbar + Outlet
- [ ] Navbar: `useNavigate()` + `useLocation()` for active state

**Test:** URL navigation, back/forward, refresh on detail page

---

## Phase 5: Polish

### [ ] PR-18: Seed data
**Docs:** `docs/BA_SPEC.md` (demo data requirements) · `docs/API_SPEC.md` (field constraints)
**Files:** `backend/cmd/seed/main.go`

- [ ] Create demo user: `demo@tracker.com` / `demo123`
- [ ] Create 8 jobs (Google/Meta/Apple/Amazon/Microsoft/Netflix/Airbnb/Spotify) matching Figma mock
- [ ] Create status_history entries for each
- [ ] Idempotent: skip if demo user exists

**Test:** `make seed` → login as demo → see 8 jobs + analytics

---

### [ ] PR-19: E2E smoke test
**Docs:** `docs/API_SPEC.md` (full endpoint list + expected responses)
**Files:** `backend/tests/e2e/smoke_test.go`

Full flow: register → login → create job → list (filter) → update status (Applied→Interview) → get dashboard KPIs → all analytics → delete → verify gone

**Test:** `make test-e2e` → all assertions pass against live server

---

### [ ] PR-20: README + final cleanup
**Docs:** (none — write from what's already in CLAUDE.md + ARCHITECTURE_BACKEND.md + ARCHITECTURE_FRONTEND.md)
**Files:** `README.md`

- [ ] Stack table · prerequisites · `make docker-up && make migrate-up` getting started · daily workflow · ASCII architecture diagram
- [ ] Verify `make docker-up` → `make migrate-up` → `make seed` works on clean clone
- [ ] CI green on main

**Test:** Fresh clone → full flow works

---

### [ ] PR-21: Playwright E2E — full browser automation
**Docs:** `docs/ARCHITECTURE_FRONTEND.md` · `docs/UI_SPEC.md` · `docs/API_SPEC.md`
**Files:** `frontend/e2e/smoke.spec.ts` · `frontend/playwright.config.ts` · `frontend/package.json` (add `@playwright/test`) · `.github/workflows/ci.yml` (add e2e job)

- [ ] Install: `npm install -D @playwright/test && npx playwright install chromium`
- [ ] `playwright.config.ts`: baseURL=`http://localhost:5173`, timeout=30s, retries=1
- [ ] `smoke.spec.ts` — full user journey:
  - Register new account → redirected to Dashboard → KPI cards visible
  - Add job (Google/SDE/LinkedIn) → appears in ApplicationsList
  - Click card → ApplicationDetail → change status Applied→Interview → status badge updates
  - Navigate to Analytics → 4 charts render (not empty)
  - Delete job → confirm dialog → job gone from list
  - Logout → redirected to Login page
- [ ] Add to `ci.yml`: job `e2e` (needs `backend` + `frontend`) — starts both services, runs `npx playwright test`
- [ ] Add `make test-e2e-ui` to Makefile: `cd frontend && npx playwright test`

**Test:** `make test-e2e-ui` → all 6 scenarios pass in headless Chromium

---

## Summary

| Phase | PRs | Scope |
|-------|-----|-------|
| 0: Skeleton | PR-01 → PR-04 | Go project, PostgreSQL+GORM+TxManager, Redis, middleware |
| 1: Auth | PR-05 → PR-07 | Domain (typed errors, pagination, clock), auth use cases, JWT+bcrypt |
| 2: CRUD | PR-08 → PR-09 | Job use cases (grouped, TxManager) + REST API |
| 3: Analytics | PR-10 → PR-11 | Dashboard+Analytics (pure UCs + cache decorators) |
| 4: Frontend | PR-12 → PR-17 | React Query wiring + Router |
| 5: Polish | PR-18 → PR-21 | Seed, API E2E, README, Browser E2E (Playwright) |

**Total: 21 PRs** · each 100–400 lines · strictly ordered
