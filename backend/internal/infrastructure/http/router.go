package http

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	httpswagger "github.com/swaggo/http-swagger"

	_ "job-tracker/docs" // swagger generated docs
	"job-tracker/internal/infrastructure/http/handler"
)

// NewRouter creates and configures the Chi router with all routes.
func NewRouter(healthHandler *handler.HealthHandler) http.Handler {
	r := chi.NewRouter()

	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/health", healthHandler.GetHealth)
		r.Get("/swagger/*", httpswagger.Handler(
			httpswagger.URL("/api/v1/swagger/doc.json"),
		))
	})

	return r
}
