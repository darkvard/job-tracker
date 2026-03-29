package handler

import (
	"net/http"

	"job-tracker/internal/application/analytics"
	"job-tracker/pkg/ctxkey"
)

// AnalyticsHandler handles HTTP requests for dashboard and analytics endpoints.
type AnalyticsHandler struct {
	dashboard analytics.DashboardExecutor
}

// NewAnalyticsHandler constructs an AnalyticsHandler.
func NewAnalyticsHandler(dashboard analytics.DashboardExecutor) *AnalyticsHandler {
	return &AnalyticsHandler{dashboard: dashboard}
}

// GetDashboard handles GET /dashboard/kpis.
//
//	@Summary		Get dashboard KPIs
//	@Description	Returns aggregated KPI metrics for the authenticated user's job applications, cached per user (TTL 5 min)
//	@Tags			dashboard
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	analytics.DashboardKPIs
//	@Failure		401	{object}	errorResponse
//	@Failure		500	{object}	errorResponse
//	@Router			/dashboard/kpis [get]
func (h *AnalyticsHandler) GetDashboard(w http.ResponseWriter, r *http.Request) {
	userID, ok := ctxkey.GetUserID(r.Context())
	if !ok {
		respondError(w, http.StatusUnauthorized, "missing or invalid token", "UNAUTHORIZED")
		return
	}

	kpis, err := h.dashboard.Execute(r.Context(), userID)
	if err != nil {
		mapDomainError(w, err)
		return
	}

	respondJSON(w, http.StatusOK, kpis)
}
