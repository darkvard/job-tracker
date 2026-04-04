package http

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	httpswagger "github.com/swaggo/http-swagger"

	_ "job-tracker/docs" // swagger generated docs
	"job-tracker/internal/infrastructure/http/handler"
	"job-tracker/internal/infrastructure/http/middleware"
)

// NewRouter creates and configures the Chi router with all routes.
// Middleware chain: Recovery → RequestID → Logger → CORS
func NewRouter(
	healthHandler *handler.HealthHandler,
	authHandler *handler.AuthHandler,
	jobHandler *handler.JobHandler,
	analyticsHandler *handler.AnalyticsHandler,
	authMiddleware func(http.Handler) http.Handler,
) http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.Recovery)
	r.Use(middleware.RequestID)
	r.Use(middleware.Logger)
	r.Use(middleware.CORS)

	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/health", healthHandler.GetHealth)
		r.Get("/swagger/*", httpswagger.Handler(
			httpswagger.URL("/api/v1/swagger/doc.json"),
		))

		// Auth routes (public)
		r.Route("/auth", func(r chi.Router) {
			r.Post("/register", authHandler.Register)
			r.Post("/login", authHandler.Login)
			// Protected auth routes
			r.Group(func(r chi.Router) {
				r.Use(authMiddleware)
				r.Get("/me", authHandler.Me)
				r.Put("/me", authHandler.UpdateMe)
			})
		})

		// Job routes (all protected)
		r.Route("/jobs", func(r chi.Router) {
			r.Use(authMiddleware)
			r.Post("/", jobHandler.Create)
			r.Get("/", jobHandler.List)
			r.Get("/{id}", jobHandler.Get)
			r.Put("/{id}", jobHandler.Update)
			r.Patch("/{id}/status", jobHandler.UpdateStatus)
			r.Delete("/{id}", jobHandler.Delete)
		})

		// Dashboard routes (all protected)
		r.Route("/dashboard", func(r chi.Router) {
			r.Use(authMiddleware)
			r.Get("/kpis", analyticsHandler.GetDashboard)
		})

		// Analytics routes (all protected)
		r.Route("/analytics", func(r chi.Router) {
			r.Use(authMiddleware)
			r.Get("/weekly", analyticsHandler.GetWeekly)
			r.Get("/funnel", analyticsHandler.GetFunnel)
			r.Get("/sources", analyticsHandler.GetSources)
			r.Get("/metrics", analyticsHandler.GetMetrics)
		})
	})

	return r
}
