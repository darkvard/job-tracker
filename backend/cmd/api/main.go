// Package main is the entry point for the Job Tracker API.
//
//	@title			Job Tracker API
//	@version		1.0.0
//	@description	Single-user job application tracker API.
//	@host			localhost:3001
//	@BasePath		/api/v1
//
//	@securityDefinitions.apikey	BearerAuth
//	@in							header
//	@name						Authorization
package main

import (
	"time"

	"job-tracker/internal/application/analytics"
	"job-tracker/internal/application/auth"
	"job-tracker/internal/application/job"
	infraauth "job-tracker/internal/infrastructure/auth"
	"job-tracker/internal/infrastructure/cache"
	cachedecorator "job-tracker/internal/infrastructure/cache/decorator"
	"job-tracker/internal/infrastructure/config"
	httpinfra "job-tracker/internal/infrastructure/http"
	"job-tracker/internal/infrastructure/http/handler"
	"job-tracker/internal/infrastructure/http/middleware"
	"job-tracker/internal/infrastructure/persistence"
	"job-tracker/pkg/clock"
)

func main() {
	cfg := config.Load()

	db := persistence.NewPostgres(cfg.DBDSN)
	txMgr := persistence.NewTxManager(db)
	rdb := cache.NewRedis(cfg.RedisAddr)

	// Infrastructure services
	hasher := infraauth.NewBcryptHasher()
	tokens := infraauth.NewJWTService(cfg.JWTSecret, cfg.JWTExpiry)

	// Repositories
	userRepo := persistence.NewPostgresUserRepo(db)
	appRepo := persistence.NewPostgresApplicationRepo(db)

	// Auth use cases
	registerUC := auth.NewRegisterUseCase(userRepo, hasher, tokens)
	loginUC := auth.NewLoginUseCase(userRepo, hasher, tokens)

	// Job use cases
	jobUCs := job.NewUseCases(appRepo, txMgr)

	// Cache invalidator
	jobInvalidator := cache.NewJobCacheInvalidator(rdb)

	// Analytics use cases + cache decorators
	rawDashboardUC := analytics.NewGetDashboardUseCase(appRepo, clock.RealClock{})
	dashboardUC := cachedecorator.NewDashboard(rawDashboardUC, rdb, 5*time.Minute)

	rawAnalyticsUC := analytics.NewGetAnalyticsUseCase(appRepo, clock.RealClock{})
	analyticsUC := cachedecorator.NewAnalytics(rawAnalyticsUC, rdb, 10*time.Minute)

	// Handlers
	healthHandler := handler.NewHealth()
	authHandler := handler.NewAuthHandler(registerUC, loginUC, userRepo)
	jobHandler := handler.NewJobHandler(jobUCs, jobInvalidator)
	analyticsHandler := handler.NewAnalyticsHandler(dashboardUC, analyticsUC)

	// Middleware
	authMiddleware := middleware.NewAuth(tokens)

	router := httpinfra.NewRouter(healthHandler, authHandler, jobHandler, analyticsHandler, authMiddleware)
	server := httpinfra.NewServer(cfg.Port, router)
	server.Start()
}
