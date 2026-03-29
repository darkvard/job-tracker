package handler

import (
	"encoding/json"
	"net/http"

	"job-tracker/internal/application/analytics"
	"job-tracker/pkg/ctxkey"
)

// AnalyticsHandler handles HTTP requests for dashboard and analytics endpoints.
type AnalyticsHandler struct {
	dashboard analytics.DashboardExecutor
	analytics analytics.AnalyticsExecutor
}

// NewAnalyticsHandler constructs an AnalyticsHandler.
func NewAnalyticsHandler(dashboard analytics.DashboardExecutor, analyticsUC analytics.AnalyticsExecutor) *AnalyticsHandler {
	return &AnalyticsHandler{dashboard: dashboard, analytics: analyticsUC}
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

// weeklyResponse is the non-standard envelope for GET /analytics/weekly that matches the API spec.
// The spec places "trend" alongside "data" at the top level of the response body.
type weeklyResponse struct {
	Success bool                   `json:"success"`
	Data    []analytics.WeeklyData `json:"data"`
	Trend   analytics.TrendValue   `json:"trend"`
}

// GetWeekly handles GET /analytics/weekly.
//
//	@Summary		Get weekly application counts
//	@Description	Returns application counts per week for the last 6 weeks with a trend, cached per user (TTL 10 min)
//	@Tags			analytics
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	weeklyResponse
//	@Failure		401	{object}	errorResponse
//	@Failure		500	{object}	errorResponse
//	@Router			/analytics/weekly [get]
func (h *AnalyticsHandler) GetWeekly(w http.ResponseWriter, r *http.Request) {
	userID, ok := ctxkey.GetUserID(r.Context())
	if !ok {
		respondError(w, http.StatusUnauthorized, "missing or invalid token", "UNAUTHORIZED")
		return
	}

	result, err := h.analytics.GetWeekly(r.Context(), userID)
	if err != nil {
		mapDomainError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(weeklyResponse{
		Success: true,
		Data:    result.Data,
		Trend:   result.Trend,
	})
}

// GetFunnel handles GET /analytics/funnel.
//
//	@Summary		Get interview conversion funnel
//	@Description	Returns Applied → Interview → Offer conversion funnel data, cached per user (TTL 10 min)
//	@Tags			analytics
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	[]analytics.FunnelData
//	@Failure		401	{object}	errorResponse
//	@Failure		500	{object}	errorResponse
//	@Router			/analytics/funnel [get]
func (h *AnalyticsHandler) GetFunnel(w http.ResponseWriter, r *http.Request) {
	userID, ok := ctxkey.GetUserID(r.Context())
	if !ok {
		respondError(w, http.StatusUnauthorized, "missing or invalid token", "UNAUTHORIZED")
		return
	}

	result, err := h.analytics.GetFunnel(r.Context(), userID)
	if err != nil {
		mapDomainError(w, err)
		return
	}

	respondJSON(w, http.StatusOK, result)
}

// GetSources handles GET /analytics/sources.
//
//	@Summary		Get source performance breakdown
//	@Description	Returns application counts and percentages grouped by source, cached per user (TTL 10 min)
//	@Tags			analytics
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	[]analytics.SourceData
//	@Failure		401	{object}	errorResponse
//	@Failure		500	{object}	errorResponse
//	@Router			/analytics/sources [get]
func (h *AnalyticsHandler) GetSources(w http.ResponseWriter, r *http.Request) {
	userID, ok := ctxkey.GetUserID(r.Context())
	if !ok {
		respondError(w, http.StatusUnauthorized, "missing or invalid token", "UNAUTHORIZED")
		return
	}

	result, err := h.analytics.GetSources(r.Context(), userID)
	if err != nil {
		mapDomainError(w, err)
		return
	}

	respondJSON(w, http.StatusOK, result)
}

// GetMetrics handles GET /analytics/metrics.
//
//	@Summary		Get key metrics
//	@Description	Returns interview rate, offer rate, rejection rate and average response time, cached per user (TTL 10 min)
//	@Tags			analytics
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	analytics.KeyMetrics
//	@Failure		401	{object}	errorResponse
//	@Failure		500	{object}	errorResponse
//	@Router			/analytics/metrics [get]
func (h *AnalyticsHandler) GetMetrics(w http.ResponseWriter, r *http.Request) {
	userID, ok := ctxkey.GetUserID(r.Context())
	if !ok {
		respondError(w, http.StatusUnauthorized, "missing or invalid token", "UNAUTHORIZED")
		return
	}

	result, err := h.analytics.GetMetrics(r.Context(), userID)
	if err != nil {
		mapDomainError(w, err)
		return
	}

	respondJSON(w, http.StatusOK, result)
}
