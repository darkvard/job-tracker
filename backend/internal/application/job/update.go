package job

import (
	"context"
	"time"

	domainerrors "job-tracker/internal/domain/errors"
	"job-tracker/internal/domain/repository"
	"job-tracker/internal/domain/valueobject"
)

// UpdateUseCase handles a full-replace update of a job application.
type UpdateUseCase struct {
	repo repository.ApplicationRepository
}

// NewUpdateUseCase constructs an UpdateUseCase.
func NewUpdateUseCase(repo repository.ApplicationRepository) *UpdateUseCase {
	return &UpdateUseCase{repo: repo}
}

// Execute validates the request, verifies ownership, applies the update, and returns the DTO.
func (uc *UpdateUseCase) Execute(ctx context.Context, req UpdateRequest) (*JobResponse, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

	app, err := uc.repo.FindByID(ctx, req.ID)
	if err != nil {
		return nil, err
	}

	if app.UserID != req.UserID {
		return nil, domainerrors.Unauthorized("Application", "not owner")
	}

	date, _ := time.Parse("2006-01-02", req.DateApplied)
	app.Company = req.Company
	app.Role = req.Role
	app.Status = valueobject.Status(req.Status)
	app.DateApplied = date
	app.Location = req.Location
	app.Source = valueobject.Source(req.Source)
	app.Notes = req.Notes

	if err := uc.repo.UpdateWithHistory(ctx, app, ""); err != nil {
		return nil, err
	}

	return FromEntity(app), nil
}
