// Package e2e contains end-to-end smoke tests that spin up a real HTTP server
// backed by live PostgreSQL and Redis instances (provided via env vars).
// If DB_DSN is not set the entire suite exits 0 (graceful skip).
//
// Flow: register → login → create job → list (filter) → update status
// (Applied→Interview) → reject invalid transition → dashboard KPIs →
// all analytics endpoints → delete → verify gone.
package e2e

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"gorm.io/gorm"

	"job-tracker/internal/application/analytics"
	"job-tracker/internal/application/auth"
	"job-tracker/internal/application/job"
	infraauth "job-tracker/internal/infrastructure/auth"
	"job-tracker/internal/infrastructure/cache"
	cachedecorator "job-tracker/internal/infrastructure/cache/decorator"
	httpinfra "job-tracker/internal/infrastructure/http"
	"job-tracker/internal/infrastructure/http/handler"
	"job-tracker/internal/infrastructure/http/middleware"
	"job-tracker/internal/infrastructure/persistence"
	"job-tracker/pkg/clock"
)

var (
	testSrv    *httptest.Server
	testClient = &http.Client{Timeout: 10 * time.Second}
)

func TestMain(m *testing.M) {
	dbDSN := os.Getenv("DB_DSN")
	if dbDSN == "" {
		fmt.Println("E2E: DB_DSN not set — skipping")
		os.Exit(0)
	}

	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "localhost:6379"
	}
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "e2e-smoke-test-secret-key-for-testing"
	}
	jwtExpiry := 24 * time.Hour
	if v := os.Getenv("JWT_EXPIRY"); v != "" {
		if d, err := time.ParseDuration(v); err == nil {
			jwtExpiry = d
		}
	}

	db := persistence.NewPostgres(dbDSN)
	resetSchema(db)

	rdb := cache.NewRedis(redisAddr)
	hasher := infraauth.NewBcryptHasher()
	tokens := infraauth.NewJWTService(jwtSecret, jwtExpiry)
	txMgr := persistence.NewTxManager(db)

	userRepo := persistence.NewPostgresUserRepo(db)
	appRepo := persistence.NewPostgresApplicationRepo(db)

	registerUC := auth.NewRegisterUseCase(userRepo, hasher, tokens)
	loginUC := auth.NewLoginUseCase(userRepo, hasher, tokens)
	updateProfileUC := auth.NewUpdateProfileUseCase(userRepo)
	jobUCs := job.NewUseCases(appRepo, txMgr)
	jobInvalidator := cache.NewJobCacheInvalidator(rdb)

	rawDashboardUC := analytics.NewGetDashboardUseCase(appRepo, clock.RealClock{})
	dashboardUC := cachedecorator.NewDashboard(rawDashboardUC, rdb, 5*time.Minute)
	rawAnalyticsUC := analytics.NewGetAnalyticsUseCase(appRepo, clock.RealClock{})
	analyticsUC := cachedecorator.NewAnalytics(rawAnalyticsUC, rdb, 10*time.Minute)

	healthHandler := handler.NewHealth()
	authHandler := handler.NewAuthHandler(registerUC, loginUC, updateProfileUC, userRepo)
	jobHandler := handler.NewJobHandler(jobUCs, jobInvalidator)
	analyticsHandler := handler.NewAnalyticsHandler(dashboardUC, analyticsUC)
	authMiddleware := middleware.NewAuth(tokens)

	router := httpinfra.NewRouter(healthHandler, authHandler, jobHandler, analyticsHandler, authMiddleware)
	testSrv = httptest.NewServer(router)

	code := m.Run()

	testSrv.Close()
	os.Exit(code)
}

// resetSchema drops and recreates all tables so every run starts clean.
func resetSchema(db *gorm.DB) {
	stmts := []string{
		`DROP TABLE IF EXISTS status_history CASCADE`,
		`DROP TABLE IF EXISTS applications CASCADE`,
		`DROP TABLE IF EXISTS users CASCADE`,
		`CREATE TABLE users (
			id            BIGSERIAL   PRIMARY KEY,
			email         TEXT        NOT NULL UNIQUE,
			password_hash TEXT        NOT NULL,
			name          TEXT        NOT NULL,
			created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE TABLE applications (
			id           BIGSERIAL   PRIMARY KEY,
			user_id      BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			company      TEXT        NOT NULL CHECK (length(company) <= 100),
			role         TEXT        NOT NULL CHECK (length(role) <= 200),
			status       TEXT        NOT NULL CHECK (status IN ('Applied','Interview','Offer','Rejected')),
			date_applied DATE        NOT NULL,
			location     TEXT        NOT NULL DEFAULT '',
			source       TEXT        NOT NULL CHECK (source IN ('LinkedIn','Company Site','Referral','Indeed','Glassdoor','Other')),
			notes        TEXT        NOT NULL DEFAULT '',
			created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE TABLE status_history (
			id             BIGSERIAL   PRIMARY KEY,
			application_id BIGINT      NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
			from_status    TEXT,
			to_status      TEXT        NOT NULL,
			note           TEXT        NOT NULL DEFAULT '',
			changed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`,
		`CREATE INDEX idx_applications_user_status ON applications(user_id, status)`,
		`CREATE INDEX idx_applications_user_date   ON applications(user_id, date_applied DESC)`,
		`CREATE INDEX idx_status_history_app       ON status_history(application_id, changed_at DESC)`,
	}
	for _, s := range stmts {
		if err := db.Exec(s).Error; err != nil {
			panic("e2e: schema reset failed: " + err.Error())
		}
	}
}

// apiDo sends a JSON request to the test server and returns the decoded body + HTTP status.
func apiDo(t *testing.T, method, path string, body any, token string) (map[string]any, int) {
	t.Helper()

	var bodyReader io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		require.NoError(t, err)
		bodyReader = bytes.NewReader(b)
	}

	req, err := http.NewRequest(method, testSrv.URL+path, bodyReader)
	require.NoError(t, err)
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	resp, err := testClient.Do(req)
	require.NoError(t, err)
	defer resp.Body.Close() //nolint:errcheck

	var result map[string]any
	require.NoError(t, json.NewDecoder(resp.Body).Decode(&result))

	return result, resp.StatusCode
}

func TestSmokeFullFlow(t *testing.T) {
	// 1. Register
	body, status := apiDo(t, http.MethodPost, "/api/v1/auth/register", map[string]any{
		"email": "smoke@e2e.test", "password": "password123", "name": "Smoke Tester",
	}, "")
	require.Equal(t, http.StatusCreated, status, "register: want 201, got body=%v", body)
	data := body["data"].(map[string]any)
	token := data["token"].(string)
	require.NotEmpty(t, token)

	// 2. Login
	body, status = apiDo(t, http.MethodPost, "/api/v1/auth/login", map[string]any{
		"email": "smoke@e2e.test", "password": "password123",
	}, "")
	require.Equal(t, http.StatusOK, status, "login: want 200, got body=%v", body)
	data = body["data"].(map[string]any)
	token = data["token"].(string)
	require.NotEmpty(t, token)

	// 3. Create job (status = Applied)
	body, status = apiDo(t, http.MethodPost, "/api/v1/jobs", map[string]any{
		"company":     "Google",
		"role":        "Software Engineer",
		"status":      "Applied",
		"dateApplied": "2026-04-01",
		"source":      "LinkedIn",
		"location":    "Mountain View, CA",
		"notes":       "E2E smoke test",
	}, token)
	require.Equal(t, http.StatusCreated, status, "create job: want 201, got body=%v", body)
	jobID := int(body["data"].(map[string]any)["id"].(float64))
	require.Greater(t, jobID, 0)

	// 4. List jobs with status filter — expect >= 1 result
	body, status = apiDo(t, http.MethodGet, "/api/v1/jobs?status=Applied&page=1&page_size=10", nil, token)
	require.Equal(t, http.StatusOK, status, "list jobs: want 200, got body=%v", body)
	require.GreaterOrEqual(t, len(body["data"].([]any)), 1)
	require.GreaterOrEqual(t, body["meta"].(map[string]any)["total"].(float64), float64(1))

	// 5. Update status: Applied → Interview (valid)
	jobPath := fmt.Sprintf("/api/v1/jobs/%d", jobID)
	body, status = apiDo(t, http.MethodPatch, jobPath+"/status", map[string]any{
		"status": "Interview", "note": "Phone screen scheduled",
	}, token)
	require.Equal(t, http.StatusOK, status, "Applied→Interview: want 200, got body=%v", body)
	require.Equal(t, "Interview", body["data"].(map[string]any)["status"])

	// 6. Invalid transition: Interview → Applied (422)
	body, status = apiDo(t, http.MethodPatch, jobPath+"/status", map[string]any{
		"status": "Applied", "note": "trying to revert",
	}, token)
	require.Equal(t, http.StatusUnprocessableEntity, status, "Interview→Applied: want 422, got body=%v", body)
	require.Equal(t, "INVALID_STATUS", body["error"].(map[string]any)["code"])

	// 7. Dashboard KPIs
	body, status = apiDo(t, http.MethodGet, "/api/v1/dashboard/kpis", nil, token)
	require.Equal(t, http.StatusOK, status, "dashboard: want 200, got body=%v", body)
	kpis := body["data"].(map[string]any)
	require.Contains(t, kpis, "total")
	require.Contains(t, kpis, "statusBreakdown")
	require.Contains(t, kpis, "recentJobs")

	// 8–11. Analytics endpoints
	for _, endpoint := range []string{"/weekly", "/funnel", "/sources", "/metrics"} {
		_, status = apiDo(t, http.MethodGet, "/api/v1/analytics"+endpoint, nil, token)
		require.Equal(t, http.StatusOK, status, "analytics%s: want 200", endpoint)
	}

	// 12. Delete job
	body, status = apiDo(t, http.MethodDelete, jobPath, nil, token)
	require.Equal(t, http.StatusOK, status, "delete job: want 200, got body=%v", body)

	// 13. Verify gone — GET deleted job must return 404
	_, status = apiDo(t, http.MethodGet, jobPath, nil, token)
	require.Equal(t, http.StatusNotFound, status, "deleted job: want 404")
}
