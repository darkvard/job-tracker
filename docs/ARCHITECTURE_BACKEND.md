# Backend Architecture Reference

## Layer Rules

```
┌──────────────────────────────────────────────────┐
│              cmd/api/main.go                     │  ← DI wiring ONLY
│             (imports everything)                  │
├──────────────────────────────────────────────────┤
│           infrastructure/                        │  ← DB, HTTP, Cache, JWT, bcrypt
│   (imports domain + application + any lib)       │
├──────────────────────────────────────────────────┤
│            application/                          │  ← Use cases, DTOs, ports
│         (imports domain + stdlib)                │
├──────────────────────────────────────────────────┤
│              domain/                             │  ← Entities, Interfaces, Errors
│              (stdlib ONLY)                       │
└──────────────────────────────────────────────────┘
```

**Arrows: inward only. Never outward.**
GORM, Redis, JWT — never imported by domain or application.

---

## Folder Structure

```
backend/
├── cmd/
│   └── api/
│       └── main.go                    ← DI wiring, fail-fast on bad config
│
├── internal/
│   ├── domain/                        ← stdlib ONLY, zero external deps
│   │   ├── entity/
│   │   │   ├── user.go               ← User struct + NewUser(email,hash,name) constructor
│   │   │   └── application.go        ← Application struct + NewApplication() + TransitionStatus(new) error
│   │   ├── repository/
│   │   │   ├── user.go               ← UserRepository interface (3-4 methods max)
│   │   │   ├── application.go        ← ApplicationRepository (includes history ops)
│   │   │   └── tx.go                 ← TxManager interface
│   │   ├── valueobject/
│   │   │   ├── status.go             ← Status enum + CanTransition(from,to) bool
│   │   │   ├── source.go             ← Source enum + IsValid() bool
│   │   │   └── pagination.go         ← PageRequest{Page,Size,Sort,Order} · PageResponse[T any]
│   │   └── errors/
│   │       └── errors.go             ← DomainError{Code,Entity,Message,Err} + constructors
│   │
│   ├── application/                   ← domain + stdlib ONLY
│   │   ├── port/                     ← interfaces for external services (auth only)
│   │   │   ├── hasher.go             ← PasswordHasher interface
│   │   │   └── token.go              ← TokenService interface
│   │   ├── auth/
│   │   │   ├── register.go           ← RegisterUseCase struct + Execute()
│   │   │   ├── login.go              ← LoginUseCase struct + Execute()
│   │   │   └── dto.go                ← RegisterRequest · LoginRequest · AuthResponse + Validate()
│   │   ├── job/
│   │   │   ├── create.go
│   │   │   ├── list.go
│   │   │   ├── get.go
│   │   │   ├── update.go
│   │   │   ├── update_status.go      ← uses TxManager (update app + insert history atomically)
│   │   │   ├── delete.go
│   │   │   ├── usecases.go           ← JobUseCases struct (groups all 6 for handler injection)
│   │   │   └── dto.go                ← All job DTOs + Validate() + ToEntity() + FromEntity()
│   │   └── analytics/
│   │       ├── dashboard.go          ← GetDashboardUseCase — pure, ZERO cache logic
│   │       ├── analytics.go          ← GetAnalyticsUseCase — pure, ZERO cache logic
│   │       └── dto.go
│   │
│   └── infrastructure/               ← implements all interfaces
│       ├── config/
│       │   └── config.go             ← Load() validates ALL required fields, panic on missing
│       ├── persistence/
│       │   ├── postgres.go           ← GORM connection + pool (MaxOpenConns, MaxIdleConns, ConnMaxLifetime)
│       │   ├── txmanager.go          ← GORMTxManager implements domain/repository.TxManager
│       │   ├── models/               ← GORM models (NEVER used outside persistence/)
│       │   │   ├── user.go           ← UserModel + TableName() + ToEntity() + fromEntity()
│       │   │   ├── application.go    ← ApplicationModel + mapping
│       │   │   └── status_history.go ← StatusHistoryModel + mapping
│       │   ├── user_repo.go          ← implements domain/repository.UserRepository via GORM
│       │   └── application_repo.go   ← implements domain/repository.ApplicationRepository via GORM
│       ├── cache/
│       │   ├── redis.go              ← RedisCache (Get/Set/Delete/DeletePattern via SCAN)
│       │   ├── invalidator.go        ← JobCacheInvalidator.InvalidateUser() — called by JobHandler after mutations
│       │   └── decorator/
│       │       ├── dashboard.go      ← read-only: wraps GetDashboardUseCase + Redis GET/SET (TTL 5min)
│       │       └── analytics.go      ← read-only: wraps analytics use cases + Redis GET/SET (TTL 10min)
│       ├── auth/
│       │   ├── jwt.go                ← implements application/port.TokenService
│       │   └── bcrypt.go             ← implements application/port.PasswordHasher
│       └── http/
│           ├── server.go             ← HTTP server + graceful shutdown
│           ├── router.go             ← Chi routes + middleware chain
│           ├── handler/
│           │   ├── auth.go           ← AuthHandler{register, login}
│           │   ├── job.go            ← JobHandler{*job.UseCases, *cache.JobCacheInvalidator}
│           │   ├── analytics.go      ← AnalyticsHandler
│           │   └── response.go       ← respondJSON/respondError + mapDomainError()
│           └── middleware/
│               ├── auth.go           ← JWT validate → ctxkey.WithUserID()
│               ├── requestid.go      ← X-Request-ID generate/propagate
│               ├── logger.go         ← slog structured logging + request ID
│               └── recovery.go       ← panic → 500 + log stack trace
│
├── pkg/
│   ├── ctxkey/
│   │   └── ctxkey.go                 ← Typed keys + WithUserID/GetUserID/WithTx/GetTx
│   └── clock/
│       └── clock.go                  ← Clock interface · RealClock · MockClock (for tests)
│
├── migrations/
│   ├── 000001_init.up.sql
│   └── 000001_init.down.sql
│
├── Dockerfile.dev
├── go.mod
└── .golangci.yml
```

---

## Key Patterns

### 1. TxManager — atomic multi-table operations

```go
// domain/repository/tx.go
type TxManager interface {
    WithTransaction(ctx context.Context, fn func(ctx context.Context) error) error
}

// infrastructure/persistence/txmanager.go
type gormTxManager struct{ db *gorm.DB }

func (t *gormTxManager) WithTransaction(ctx context.Context, fn func(ctx context.Context) error) error {
    return t.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
        return fn(ctxkey.WithTx(ctx, tx))    // inject tx into context
    })
}

// All repos detect tx from context
func (r *applicationRepo) db(ctx context.Context) *gorm.DB {
    if tx := ctxkey.GetTx(ctx); tx != nil {
        return tx
    }
    return r.gdb.WithContext(ctx)
}

// application/job/update_status.go — use case stays clean
func (uc *UpdateStatusUseCase) Execute(ctx context.Context, req dto.UpdateStatusRequest) (*dto.JobResponse, error) {
    var result *entity.Application
    err := uc.tx.WithTransaction(ctx, func(ctx context.Context) error {
        app, err := uc.repo.FindByID(ctx, req.ID)
        if err != nil { return err }
        if app.UserID != req.UserID { return domainerrors.Unauthorized("Application", "not owner") }
        if err := app.TransitionStatus(req.Status); err != nil { return err }
        if err := uc.repo.UpdateWithHistory(ctx, app, req.Note); err != nil { return err }
        result = app
        return nil
    })
    if err != nil { return nil, err }
    return JobResponseFromEntity(result), nil
}
```

### 2. Cache Decorator — use cases stay pure

```go
// infrastructure/cache/decorator/dashboard.go
type cachedDashboard struct {
    inner analytics.GetDashboardExecutor   // interface wrapping real use case
    cache *redis.Client
    ttl   time.Duration
}

func (c *cachedDashboard) Execute(ctx context.Context, userID int64) (*dto.DashboardKPIs, error) {
    key := fmt.Sprintf("dashboard:%d", userID)
    var cached dto.DashboardKPIs
    if err := c.cache.GetJSON(ctx, key, &cached); err == nil { return &cached, nil }

    result, err := c.inner.Execute(ctx, userID)
    if err != nil { return nil, err }
    c.cache.SetJSON(ctx, key, result, c.ttl)    // fire-and-forget, no error propagation
    return result, nil
}

// cmd/api/main.go — wrap at DI time
rawDashboardUC := analytics.NewGetDashboard(appRepo)
dashboardUC    := cachedecorator.NewDashboard(rawDashboardUC, rdb, 5*time.Minute)
analyticsHandler := handler.NewAnalytics(dashboardUC, ...)
```

### 3. Typed Domain Errors

```go
// domain/errors/errors.go
type ErrorCode string
const (
    ErrCodeNotFound      ErrorCode = "NOT_FOUND"
    ErrCodeAlreadyExists ErrorCode = "ALREADY_EXISTS"
    ErrCodeInvalidStatus ErrorCode = "INVALID_STATUS"
    ErrCodeUnauthorized  ErrorCode = "UNAUTHORIZED"
    ErrCodeInvalidInput  ErrorCode = "INVALID_INPUT"
)

type DomainError struct {
    Code    ErrorCode
    Entity  string
    Message string
    Err     error
}

func (e *DomainError) Error() string { return fmt.Sprintf("[%s] %s: %s", e.Code, e.Entity, e.Message) }
func (e *DomainError) Unwrap() error { return e.Err }

// Constructors
func NotFound(entity, msg string) *DomainError      { return &DomainError{Code: ErrCodeNotFound, Entity: entity, Message: msg} }
func AlreadyExists(entity, msg string) *DomainError { return &DomainError{Code: ErrCodeAlreadyExists, Entity: entity, Message: msg} }
func InvalidStatus(msg string) *DomainError         { return &DomainError{Code: ErrCodeInvalidStatus, Entity: "Application", Message: msg} }
func Unauthorized(entity, msg string) *DomainError  { return &DomainError{Code: ErrCodeUnauthorized, Entity: entity, Message: msg} }
func InvalidInput(entity, msg string) *DomainError  { return &DomainError{Code: ErrCodeInvalidInput, Entity: entity, Message: msg} }

// Handler maps via errors.As
func mapDomainError(w http.ResponseWriter, err error) {
    var de *domainerrors.DomainError
    if errors.As(err, &de) {
        status := map[domainerrors.ErrorCode]int{
            domainerrors.ErrCodeNotFound:      404,
            domainerrors.ErrCodeAlreadyExists: 409,
            domainerrors.ErrCodeInvalidStatus: 422,
            domainerrors.ErrCodeUnauthorized:  403,
            domainerrors.ErrCodeInvalidInput:  400,
        }[de.Code]
        respondError(w, status, de.Message, string(de.Code))
        return
    }
    respondError(w, 500, "internal error", "INTERNAL")
}
```

### 4. GORM Model ≠ Domain Entity

```go
// infrastructure/persistence/models/application.go
type ApplicationModel struct {
    ID          int64     `gorm:"primaryKey;autoIncrement"`
    UserID      int64     `gorm:"not null;index"`
    Company     string    `gorm:"not null;size:100"`
    Role        string    `gorm:"not null;size:200"`
    Status      string    `gorm:"not null;size:20"`
    DateApplied time.Time `gorm:"not null"`
    Location    string    `gorm:"size:200"`
    Source      string    `gorm:"not null;size:50"`
    Notes       string
    CreatedAt   time.Time
    UpdatedAt   time.Time
}
func (ApplicationModel) TableName() string { return "applications" }

func (m *ApplicationModel) ToEntity() *entity.Application {
    return &entity.Application{ ID: m.ID, UserID: m.UserID, Company: m.Company, /* ... all fields */ }
}

// NEVER return ApplicationModel from repository — always map to entity first
func (r *applicationRepo) FindByID(ctx context.Context, id int64) (*entity.Application, error) {
    var model models.ApplicationModel
    if err := r.db(ctx).First(&model, id).Error; err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return nil, domainerrors.NotFound("Application", fmt.Sprintf("id=%d", id))
        }
        return nil, fmt.Errorf("applicationRepo.FindByID: %w", err)
    }
    return model.ToEntity(), nil
}
```

### 5. Grouped UseCases for Handler

```go
// application/job/usecases.go
type UseCases struct {
    Create       *CreateUseCase
    List         *ListUseCase
    Get          *GetUseCase
    Update       *UpdateUseCase
    UpdateStatus *UpdateStatusUseCase
    Delete       *DeleteUseCase
}

// infrastructure/http/handler/job.go — handler pattern
func (h *JobHandler) Create(w http.ResponseWriter, r *http.Request) {
    var req job.CreateRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        respondError(w, 400, "invalid JSON", "BAD_REQUEST"); return
    }
    if err := req.Validate(); err != nil { mapDomainError(w, err); return }
    req.UserID, _ = ctxkey.GetUserID(r.Context())
    result, err := h.uc.Create.Execute(r.Context(), req)
    if err != nil { mapDomainError(w, err); return }
    respondJSON(w, 201, result)
}
```

### 6. pkg/ctxkey — typed context keys

```go
// pkg/ctxkey/ctxkey.go
type ( userIDKey struct{}; requestIDKey struct{}; txKey struct{} )

func WithUserID(ctx context.Context, id int64) context.Context { return context.WithValue(ctx, userIDKey{}, id) }
func GetUserID(ctx context.Context) (int64, bool)              { id, ok := ctx.Value(userIDKey{}).(int64); return id, ok }
func WithTx(ctx context.Context, tx *gorm.DB) context.Context { return context.WithValue(ctx, txKey{}, tx) }
func GetTx(ctx context.Context) *gorm.DB                      { tx, _ := ctx.Value(txKey{}).(*gorm.DB); return tx }
```

### 7. Config — fail fast

```go
type Config struct {
    Port      string        `env:"PORT,required"`
    DBDSN     string        `env:"DB_DSN,required"`
    RedisAddr string        `env:"REDIS_ADDR,required"`
    JWTSecret string        `env:"JWT_SECRET,required"`
    JWTExpiry time.Duration `env:"JWT_EXPIRY" envDefault:"24h"`
}

func Load() *Config {
    var cfg Config
    if err := envconfig.Process("", &cfg); err != nil { log.Fatalf("config: missing required env vars: %v", err) }
    if len(cfg.JWTSecret) < 32 { log.Fatal("config: JWT_SECRET must be at least 32 characters") }
    return &cfg
}
```

---

## DI Wiring (cmd/api/main.go) — linear, top-to-bottom

```go
func main() {
    cfg     := config.Load()
    db      := persistence.NewPostgres(cfg.DBDSN)
    rdb     := cache.NewRedis(cfg.RedisAddr)
    txMgr   := persistence.NewTxManager(db)
    hasher  := auth.NewBcrypt()
    tokenSvc := auth.NewJWT(cfg.JWTSecret, cfg.JWTExpiry)

    userRepo := persistence.NewUserRepo(db)
    appRepo  := persistence.NewApplicationRepo(db)

    registerUC := authuc.NewRegister(userRepo, hasher, tokenSvc)
    loginUC    := authuc.NewLogin(userRepo, hasher, tokenSvc)

    jobUCs := &job.UseCases{
        Create:       job.NewCreate(appRepo),
        List:         job.NewList(appRepo),
        Get:          job.NewGet(appRepo),
        Update:       job.NewUpdate(appRepo),
        UpdateStatus: job.NewUpdateStatus(appRepo, txMgr),
        Delete:       job.NewDelete(appRepo),
    }

    rawDashboardUC := analytics.NewGetDashboard(appRepo)
    rawAnalyticsUC := analytics.NewGetAnalytics(appRepo)

    // Cache decorators (read-only: GET/SET only)
    dashboardUC := cachedecorator.NewDashboard(rawDashboardUC, rdb, 5*time.Minute)
    analyticsUC := cachedecorator.NewAnalytics(rawAnalyticsUC, rdb, 10*time.Minute)

    // Cache invalidator (mutation side: DELETE after write)
    jobInvalidator := cache.NewJobCacheInvalidator(rdb)

    authHandler      := handler.NewAuth(registerUC, loginUC)
    jobHandler       := handler.NewJob(jobUCs, jobInvalidator)
    analyticsHandler := handler.NewAnalytics(dashboardUC, analyticsUC)

    router := httpinfra.NewRouter(authHandler, jobHandler, analyticsHandler, tokenSvc)
    server := httpinfra.NewServer(cfg.Port, router)
    server.Start()
}
```

---

## Database Schema (PostgreSQL)

```sql
-- migrations/000001_init.up.sql

CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    email         TEXT      NOT NULL UNIQUE,
    password_hash TEXT      NOT NULL,
    name          TEXT      NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE applications (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company      TEXT      NOT NULL CHECK (length(company) <= 100),
    role         TEXT      NOT NULL CHECK (length(role) <= 200),
    status       TEXT      NOT NULL CHECK (status IN ('Applied','Interview','Offer','Rejected')),
    date_applied DATE      NOT NULL,
    location     TEXT      NOT NULL DEFAULT '',
    source       TEXT      NOT NULL CHECK (source IN ('LinkedIn','Company Site','Referral','Indeed','Glassdoor','Other')),
    notes        TEXT      NOT NULL DEFAULT '',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE status_history (
    id             BIGSERIAL PRIMARY KEY,
    application_id BIGINT   NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    from_status    TEXT,
    to_status      TEXT     NOT NULL,
    note           TEXT     NOT NULL DEFAULT '',
    changed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_applications_user_status  ON applications(user_id, status);
CREATE INDEX idx_applications_user_date    ON applications(user_id, date_applied DESC);
CREATE INDEX idx_status_history_app        ON status_history(application_id, changed_at DESC);
```

---

## Cache Keys & Invalidation

| Redis key | TTL | Set by | Deleted by |
|-----------|-----|--------|------------|
| `dashboard:<userID>` | 5m | `cachedDashboard` decorator | `JobCacheInvalidator` |
| `analytics:weekly:<userID>` | 10m | `cachedAnalytics` decorator | `JobCacheInvalidator` |
| `analytics:funnel:<userID>` | 10m | `cachedAnalytics` decorator | `JobCacheInvalidator` |
| `analytics:sources:<userID>` | 10m | `cachedAnalytics` decorator | `JobCacheInvalidator` |
| `analytics:metrics:<userID>` | 10m | `cachedAnalytics` decorator | `JobCacheInvalidator` |

**Rule:** Read decorators do GET/SET only. `JobCacheInvalidator.InvalidateUser(ctx, userID)` does DELETE — called from `JobHandler` after every successful mutation. Invalidation is fire-and-forget: Redis failure must never fail the HTTP response.

---

## Middleware Chain Order

```
Recovery → RequestID → Logger → CORS → Auth (protected routes only)
```
