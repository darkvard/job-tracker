// Package job contains use cases for managing job applications.
package job

import (
	"time"

	"job-tracker/internal/domain/entity"
	domainerrors "job-tracker/internal/domain/errors"
	"job-tracker/internal/domain/valueobject"
)

// CreateRequest is the input for the create use case.
type CreateRequest struct {
	UserID      int64
	Company     string
	Role        string
	Status      string
	DateApplied string
	Location    string
	Source      string
	Notes       string
}

// Validate checks required fields and formats.
func (r CreateRequest) Validate() error {
	if len(r.Company) == 0 || len(r.Company) > 100 {
		return domainerrors.InvalidInput("CreateRequest", "company is required and must be 1-100 chars")
	}
	if len(r.Role) == 0 || len(r.Role) > 200 {
		return domainerrors.InvalidInput("CreateRequest", "role is required and must be 1-200 chars")
	}
	if !valueobject.Status(r.Status).IsValid() {
		return domainerrors.InvalidInput("CreateRequest", "invalid status: "+r.Status)
	}
	if r.DateApplied == "" {
		return domainerrors.InvalidInput("CreateRequest", "dateApplied is required")
	}
	if _, err := time.Parse("2006-01-02", r.DateApplied); err != nil {
		return domainerrors.InvalidInput("CreateRequest", "dateApplied must be YYYY-MM-DD")
	}
	if !valueobject.Source(r.Source).IsValid() {
		return domainerrors.InvalidInput("CreateRequest", "invalid source: "+r.Source)
	}
	return nil
}

// ToEntity constructs an Application entity from the validated request.
func (r CreateRequest) ToEntity() (*entity.Application, error) {
	date, _ := time.Parse("2006-01-02", r.DateApplied)
	app, err := entity.NewApplication(
		r.UserID,
		r.Company, r.Role,
		valueobject.Source(r.Source),
		valueobject.Status(r.Status),
		date,
	)
	if err != nil {
		return nil, err
	}
	app.Location = r.Location
	app.Notes = r.Notes
	return app, nil
}

// UpdateRequest is the input for the update use case (full replace).
type UpdateRequest struct {
	ID          int64
	UserID      int64
	Company     string
	Role        string
	Status      string
	DateApplied string
	Location    string
	Source      string
	Notes       string
}

// Validate checks required fields and formats.
func (r UpdateRequest) Validate() error {
	if len(r.Company) == 0 || len(r.Company) > 100 {
		return domainerrors.InvalidInput("UpdateRequest", "company is required and must be 1-100 chars")
	}
	if len(r.Role) == 0 || len(r.Role) > 200 {
		return domainerrors.InvalidInput("UpdateRequest", "role is required and must be 1-200 chars")
	}
	if !valueobject.Status(r.Status).IsValid() {
		return domainerrors.InvalidInput("UpdateRequest", "invalid status: "+r.Status)
	}
	if r.DateApplied == "" {
		return domainerrors.InvalidInput("UpdateRequest", "dateApplied is required")
	}
	if _, err := time.Parse("2006-01-02", r.DateApplied); err != nil {
		return domainerrors.InvalidInput("UpdateRequest", "dateApplied must be YYYY-MM-DD")
	}
	if !valueobject.Source(r.Source).IsValid() {
		return domainerrors.InvalidInput("UpdateRequest", "invalid source: "+r.Source)
	}
	return nil
}

// UpdateStatusRequest is the input for the update-status use case.
type UpdateStatusRequest struct {
	ID     int64
	UserID int64
	Status string
	Note   string
}

// Validate checks that the status value is recognised.
func (r UpdateStatusRequest) Validate() error {
	if !valueobject.Status(r.Status).IsValid() {
		return domainerrors.InvalidInput("UpdateStatusRequest", "invalid status: "+r.Status)
	}
	return nil
}

// ListFilters holds optional query filters for the list use case.
type ListFilters struct {
	Status   string
	Search   string
	Page     int
	PageSize int
	SortBy   string
	Order    string
}

// Validate normalises and validates pagination defaults.
func (f *ListFilters) Validate() error {
	if f.Status != "" && !valueobject.Status(f.Status).IsValid() {
		return domainerrors.InvalidInput("ListFilters", "invalid status: "+f.Status)
	}
	if f.Page < 1 {
		f.Page = 1
	}
	if f.PageSize < 1 {
		f.PageSize = 20
	}
	if f.SortBy == "" {
		f.SortBy = "created_at"
	}
	if f.Order == "" {
		f.Order = "desc"
	}
	return nil
}

// StatusHistoryItem is a single entry in the status history timeline.
type StatusHistoryItem struct {
	ID         int64   `json:"id"`
	FromStatus *string `json:"fromStatus"`
	ToStatus   string  `json:"toStatus"`
	Note       string  `json:"note"`
	ChangedAt  string  `json:"changedAt"`
}

// JobResponse is the public view of a job application.
type JobResponse struct {
	ID            int64               `json:"id"`
	UserID        int64               `json:"userId"`
	Company       string              `json:"company"`
	Role          string              `json:"role"`
	Status        string              `json:"status"`
	DateApplied   string              `json:"dateApplied"`
	Location      string              `json:"location"`
	Source        string              `json:"source"`
	Notes         string              `json:"notes"`
	StatusHistory []StatusHistoryItem `json:"statusHistory,omitempty"`
	CreatedAt     string              `json:"createdAt"`
	UpdatedAt     string              `json:"updatedAt"`
}

// FromEntity maps an Application entity to a JobResponse DTO.
func FromEntity(app *entity.Application) *JobResponse {
	resp := &JobResponse{
		ID:          app.ID,
		UserID:      app.UserID,
		Company:     app.Company,
		Role:        app.Role,
		Status:      app.Status.String(),
		DateApplied: app.DateApplied.Format("2006-01-02"),
		Location:    app.Location,
		Source:      app.Source.String(),
		Notes:       app.Notes,
		CreatedAt:   app.CreatedAt.Format(time.RFC3339),
		UpdatedAt:   app.UpdatedAt.Format(time.RFC3339),
	}
	if len(app.StatusHistory) > 0 {
		resp.StatusHistory = make([]StatusHistoryItem, len(app.StatusHistory))
		for i, h := range app.StatusHistory {
			item := StatusHistoryItem{
				ID:        h.ID,
				ToStatus:  h.ToStatus.String(),
				Note:      h.Note,
				ChangedAt: h.ChangedAt.Format(time.RFC3339),
			}
			if h.FromStatus != "" {
				s := h.FromStatus.String()
				item.FromStatus = &s
			}
			resp.StatusHistory[i] = item
		}
	}
	return resp
}

// PaginatedJobsResponse wraps a slice of JobResponse with pagination metadata.
type PaginatedJobsResponse struct {
	Items      []JobResponse `json:"items"`
	Total      int64         `json:"total"`
	Page       int           `json:"page"`
	PageSize   int           `json:"pageSize"`
	TotalPages int           `json:"totalPages"`
}
