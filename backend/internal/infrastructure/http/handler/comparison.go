package handler

import (
	"net/http"
	"strconv"
	"strings"

	"job-tracker/internal/application/job"
	"job-tracker/pkg/ctxkey"
)

// ComparisonHandler handles the job comparison endpoint.
type ComparisonHandler struct {
	uc *job.UseCases
}

// NewComparisonHandler constructs a ComparisonHandler.
func NewComparisonHandler(uc *job.UseCases) *ComparisonHandler {
	return &ComparisonHandler{uc: uc}
}

// Compare handles GET /applications/compare?ids=1,2,3.
//
//	@Summary		Compare job applications
//	@Description	Returns 2–5 job applications with computed compensation and benefits scores
//	@Tags			applications
//	@Produce		json
//	@Security		BearerAuth
//	@Param			ids	query		string	true	"Comma-separated job IDs (2–5)"
//	@Success		200	{array}		job.CompareResponse
//	@Failure		400	{object}	errorResponse
//	@Failure		401	{object}	errorResponse
//	@Failure		403	{object}	errorResponse
//	@Failure		422	{object}	errorResponse
//	@Router			/applications/compare [get]
func (h *ComparisonHandler) Compare(w http.ResponseWriter, r *http.Request) {
	userID, ok := ctxkey.GetUserID(r.Context())
	if !ok {
		respondError(w, http.StatusUnauthorized, "missing or invalid token", "UNAUTHORIZED")
		return
	}

	raw := r.URL.Query().Get("ids")
	if raw == "" {
		respondError(w, http.StatusBadRequest, "ids query parameter is required", "BAD_REQUEST")
		return
	}

	parts := strings.Split(raw, ",")
	ids := make([]int64, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p == "" {
			continue
		}
		id, err := strconv.ParseInt(p, 10, 64)
		if err != nil {
			respondError(w, http.StatusBadRequest, "invalid id: "+p, "BAD_REQUEST")
			return
		}
		ids = append(ids, id)
	}

	req := job.CompareRequest{UserID: userID, IDs: ids}
	results, err := h.uc.Compare.Execute(r.Context(), req)
	if err != nil {
		mapDomainError(w, err)
		return
	}

	respondJSON(w, http.StatusOK, results)
}
