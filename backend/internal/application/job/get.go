package job

import (
	"context"

	domainerrors "job-tracker/internal/domain/errors"
	"job-tracker/internal/domain/repository"
)

// GetUseCase handles fetching a single job application by ID.
type GetUseCase struct {
	repo repository.ApplicationRepository
}

// NewGetUseCase constructs a GetUseCase.
func NewGetUseCase(repo repository.ApplicationRepository) *GetUseCase {
	return &GetUseCase{repo: repo}
}

// Execute fetches the application, verifies ownership, and returns the DTO.
func (uc *GetUseCase) Execute(ctx context.Context, id, userID int64) (*JobResponse, error) {
	app, err := uc.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if app.UserID != userID {
		return nil, domainerrors.Unauthorized("Application", "not owner")
	}

	return FromEntity(app), nil
}
