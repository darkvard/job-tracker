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
	"job-tracker/internal/application/auth"
	infraauth "job-tracker/internal/infrastructure/auth"
	"job-tracker/internal/infrastructure/cache"
	"job-tracker/internal/infrastructure/config"
	httpinfra "job-tracker/internal/infrastructure/http"
	"job-tracker/internal/infrastructure/http/handler"
	"job-tracker/internal/infrastructure/http/middleware"
	"job-tracker/internal/infrastructure/persistence"
)

func main() {
	cfg := config.Load()

	db := persistence.NewPostgres(cfg.DBDSN)
	_ = persistence.NewTxManager(db)
	_ = cache.NewRedis(cfg.RedisAddr)

	// Infrastructure services
	hasher := infraauth.NewBcryptHasher()
	tokens := infraauth.NewJWTService(cfg.JWTSecret, cfg.JWTExpiry)

	// Repositories
	userRepo := persistence.NewPostgresUserRepo(db)

	// Use cases
	registerUC := auth.NewRegisterUseCase(userRepo, hasher, tokens)
	loginUC := auth.NewLoginUseCase(userRepo, hasher, tokens)

	// Handlers
	healthHandler := handler.NewHealth()
	authHandler := handler.NewAuthHandler(registerUC, loginUC, userRepo)

	// Middleware
	authMiddleware := middleware.NewAuth(tokens)

	router := httpinfra.NewRouter(healthHandler, authHandler, authMiddleware)
	server := httpinfra.NewServer(cfg.Port, router)
	server.Start()
}
