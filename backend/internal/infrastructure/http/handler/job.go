package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"job-tracker/internal/application/job"
	"job-tracker/internal/infrastructure/cache"
	"job-tracker/pkg/ctxkey"
)

// JobHandler handles HTTP requests for job application endpoints.
type JobHandler struct {
	uc          *job.UseCases
	invalidator *cache.JobCacheInvalidator
}

// NewJobHandler constructs a JobHandler.
func NewJobHandler(uc *job.UseCases, invalidator *cache.JobCacheInvalidator) *JobHandler {
	return &JobHandler{uc: uc, invalidator: invalidator}
}

// Create handles POST /jobs.
//
//	@Summary		Create a job application
//	@Description	Create a new job application for the authenticated user
//	@Tags			jobs
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			body	body		job.CreateRequest	true	"Create job payload"
//	@Success		201		{object}	job.JobResponse
//	@Failure		400		{object}	errorResponse
//	@Failure		401		{object}	errorResponse
//	@Router			/jobs [post]
func (h *JobHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req job.CreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid JSON body", "BAD_REQUEST")
		return
	}

	userID, ok := ctxkey.GetUserID(r.Context())
	if !ok {
		respondError(w, http.StatusUnauthorized, "missing or invalid token", "UNAUTHORIZED")
		return
	}
	req.UserID = userID

	result, err := h.uc.Create.Execute(r.Context(), req)
	if err != nil {
		mapDomainError(w, err)
		return
	}

	h.invalidator.InvalidateUser(r.Context(), userID)
	respondJSON(w, http.StatusCreated, result)
}

// List handles GET /jobs.
//
//	@Summary		List job applications
//	@Description	Return a paginated, filtered list of job applications for the authenticated user
//	@Tags			jobs
//	@Produce		json
//	@Security		BearerAuth
//	@Param			status		query	string	false	"Filter by status (Applied|Interview|Offer|Rejected)"
//	@Param			search		query	string	false	"Search by company or role (case-insensitive)"
//	@Param			page		query	int		false	"Page number (default 1)"
//	@Param			page_size	query	int		false	"Items per page (default 20)"
//	@Param			sort_by		query	string	false	"Sort column: company|date_applied|created_at (default created_at)"
//	@Param			sort_order	query	string	false	"Sort direction: asc|desc (default desc)"
//	@Success		200			{object}	paginatedResponse
//	@Failure		401			{object}	errorResponse
//	@Router			/jobs [get]
func (h *JobHandler) List(w http.ResponseWriter, r *http.Request) {
	userID, ok := ctxkey.GetUserID(r.Context())
	if !ok {
		respondError(w, http.StatusUnauthorized, "missing or invalid token", "UNAUTHORIZED")
		return
	}

	q := r.URL.Query()
	filters := job.ListFilters{
		Status: q.Get("status"),
		Search: q.Get("search"),
		SortBy: q.Get("sort_by"),
		Order:  q.Get("sort_order"),
	}
	if p, err := strconv.Atoi(q.Get("page")); err == nil {
		filters.Page = p
	}
	if ps, err := strconv.Atoi(q.Get("page_size")); err == nil {
		filters.PageSize = ps
	}

	result, err := h.uc.List.Execute(r.Context(), userID, filters)
	if err != nil {
		mapDomainError(w, err)
		return
	}

	respondPaginatedJSON(w, result.Items, paginationMeta{
		Total:      result.Total,
		Page:       result.Page,
		PageSize:   result.PageSize,
		TotalPages: result.TotalPages,
	})
}

// Get handles GET /jobs/:id.
//
//	@Summary		Get a job application
//	@Description	Return a single job application by ID with status history
//	@Tags			jobs
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path		int	true	"Application ID"
//	@Success		200	{object}	job.JobResponse
//	@Failure		401	{object}	errorResponse
//	@Failure		403	{object}	errorResponse
//	@Failure		404	{object}	errorResponse
//	@Router			/jobs/{id} [get]
func (h *JobHandler) Get(w http.ResponseWriter, r *http.Request) {
	userID, ok := ctxkey.GetUserID(r.Context())
	if !ok {
		respondError(w, http.StatusUnauthorized, "missing or invalid token", "UNAUTHORIZED")
		return
	}

	id, err := parseIDParam(r)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id", "BAD_REQUEST")
		return
	}

	result, err := h.uc.Get.Execute(r.Context(), id, userID)
	if err != nil {
		mapDomainError(w, err)
		return
	}

	respondJSON(w, http.StatusOK, result)
}

// Update handles PUT /jobs/:id.
//
//	@Summary		Update a job application
//	@Description	Full-replace update of a job application (all fields required)
//	@Tags			jobs
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id		path		int					true	"Application ID"
//	@Param			body	body		job.UpdateRequest	true	"Update job payload"
//	@Success		200		{object}	job.JobResponse
//	@Failure		400		{object}	errorResponse
//	@Failure		401		{object}	errorResponse
//	@Failure		403		{object}	errorResponse
//	@Failure		404		{object}	errorResponse
//	@Router			/jobs/{id} [put]
func (h *JobHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID, ok := ctxkey.GetUserID(r.Context())
	if !ok {
		respondError(w, http.StatusUnauthorized, "missing or invalid token", "UNAUTHORIZED")
		return
	}

	id, err := parseIDParam(r)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id", "BAD_REQUEST")
		return
	}

	var req job.UpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid JSON body", "BAD_REQUEST")
		return
	}
	req.ID = id
	req.UserID = userID

	result, err := h.uc.Update.Execute(r.Context(), req)
	if err != nil {
		mapDomainError(w, err)
		return
	}

	h.invalidator.InvalidateUser(r.Context(), userID)
	respondJSON(w, http.StatusOK, result)
}

// UpdateStatus handles PATCH /jobs/:id/status.
//
//	@Summary		Update job application status
//	@Description	Transition a job application to a new status (enforces valid transition rules)
//	@Tags			jobs
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id		path		int							true	"Application ID"
//	@Param			body	body		job.UpdateStatusRequest		true	"Update status payload"
//	@Success		200		{object}	job.JobResponse
//	@Failure		400		{object}	errorResponse
//	@Failure		401		{object}	errorResponse
//	@Failure		403		{object}	errorResponse
//	@Failure		404		{object}	errorResponse
//	@Failure		422		{object}	errorResponse
//	@Router			/jobs/{id}/status [patch]
func (h *JobHandler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	userID, ok := ctxkey.GetUserID(r.Context())
	if !ok {
		respondError(w, http.StatusUnauthorized, "missing or invalid token", "UNAUTHORIZED")
		return
	}

	id, err := parseIDParam(r)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id", "BAD_REQUEST")
		return
	}

	var req job.UpdateStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid JSON body", "BAD_REQUEST")
		return
	}
	req.ID = id
	req.UserID = userID

	result, err := h.uc.UpdateStatus.Execute(r.Context(), req)
	if err != nil {
		mapDomainError(w, err)
		return
	}

	h.invalidator.InvalidateUser(r.Context(), userID)
	respondJSON(w, http.StatusOK, result)
}

// Delete handles DELETE /jobs/:id.
//
//	@Summary		Delete a job application
//	@Description	Permanently delete a job application owned by the authenticated user
//	@Tags			jobs
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path		int	true	"Application ID"
//	@Success		200	{object}	map[string]string
//	@Failure		401	{object}	errorResponse
//	@Failure		403	{object}	errorResponse
//	@Failure		404	{object}	errorResponse
//	@Router			/jobs/{id} [delete]
func (h *JobHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID, ok := ctxkey.GetUserID(r.Context())
	if !ok {
		respondError(w, http.StatusUnauthorized, "missing or invalid token", "UNAUTHORIZED")
		return
	}

	id, err := parseIDParam(r)
	if err != nil {
		respondError(w, http.StatusBadRequest, "invalid id", "BAD_REQUEST")
		return
	}

	if err := h.uc.Delete.Execute(r.Context(), id, userID); err != nil {
		mapDomainError(w, err)
		return
	}

	h.invalidator.InvalidateUser(r.Context(), userID)
	respondJSON(w, http.StatusOK, map[string]string{"message": "deleted"})
}

// parseIDParam extracts and parses the "id" URL parameter as int64.
func parseIDParam(r *http.Request) (int64, error) {
	return strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
}
