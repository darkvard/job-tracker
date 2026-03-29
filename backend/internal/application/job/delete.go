package job

import (
	"context"

	domainerrors "job-tracker/internal/domain/errors"
	"job-tracker/internal/domain/repository"
)

// DeleteUseCase handles deleting a job application.
type DeleteUseCase struct {
	repo repository.ApplicationRepository
}

// NewDeleteUseCase constructs a DeleteUseCase.
func NewDeleteUseCase(repo repository.ApplicationRepository) *DeleteUseCase {
	return &DeleteUseCase{repo: repo}
}

// Execute verifies ownership then hard-deletes the application.
func (uc *DeleteUseCase) Execute(ctx context.Context, id, userID int64) error {
	app, err := uc.repo.FindByID(ctx, id)
	if err != nil {
		return err
	}

	if app.UserID != userID {
		return domainerrors.Unauthorized("Application", "not owner")
	}

	return uc.repo.Delete(ctx, id)
}
