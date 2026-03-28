package handler

import "net/http"

// HealthHandler handles health check requests.
type HealthHandler struct{}

// NewHealth creates a new HealthHandler.
func NewHealth() *HealthHandler {
	return &HealthHandler{}
}

// GetHealth returns the API health status.
//
//	@Summary		Health check
//	@Description	Returns API health status
//	@Tags			health
//	@Produce		json
//	@Success		200	{object}	successResponse
//	@Router			/health [get]
func (h *HealthHandler) GetHealth(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]string{
		"status":  "ok",
		"version": "1.0.0",
	})
}
