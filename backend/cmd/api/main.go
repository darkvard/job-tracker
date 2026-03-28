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
	"job-tracker/internal/infrastructure/config"
	httpinfra "job-tracker/internal/infrastructure/http"
	"job-tracker/internal/infrastructure/http/handler"
)

func main() {
	cfg := config.Load()

	healthHandler := handler.NewHealth()

	router := httpinfra.NewRouter(healthHandler)
	server := httpinfra.NewServer(cfg.Port, router)
	server.Start()
}
