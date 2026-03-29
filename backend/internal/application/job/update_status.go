package job

import (
	"context"

	domainerrors "job-tracker/internal/domain/errors"
	"job-tracker/internal/domain/repository"
	"job-tracker/internal/domain/valueobject"
)

// UpdateStatusUseCase handles a status transition for a job application.
type UpdateStatusUseCase struct {
	repo repository.ApplicationRepository
	tx   repository.TxManager
}

// NewUpdateStatusUseCase constructs an UpdateStatusUseCase.
func NewUpdateStatusUseCase(repo repository.ApplicationRepository, tx repository.TxManager) *UpdateStatusUseCase {
	return &UpdateStatusUseCase{repo: repo, tx: tx}
}

// Execute validates the request, runs the transition atomically, and returns the DTO.
func (uc *UpdateStatusUseCase) Execute(ctx context.Context, req UpdateStatusRequest) (*JobResponse, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

	var result *JobResponse
	err := uc.tx.WithTransaction(ctx, func(ctx context.Context) error {
		app, err := uc.repo.FindByID(ctx, req.ID)
		if err != nil {
			return err
		}

		if app.UserID != req.UserID {
			return domainerrors.Unauthorized("Application", "not owner")
		}

		if err := app.TransitionStatus(valueobject.Status(req.Status)); err != nil {
			return err
		}

		if err := uc.repo.UpdateWithHistory(ctx, app, req.Note); err != nil {
			return err
		}

		result = FromEntity(app)
		return nil
	})
	if err != nil {
		return nil, err
	}

	return result, nil
}
