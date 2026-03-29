package job

import (
	"context"

	"job-tracker/internal/domain/repository"
)

// CreateUseCase handles creating a new job application.
type CreateUseCase struct {
	repo repository.ApplicationRepository
}

// NewCreateUseCase constructs a CreateUseCase.
func NewCreateUseCase(repo repository.ApplicationRepository) *CreateUseCase {
	return &CreateUseCase{repo: repo}
}

// Execute validates the request, creates an entity, persists it, and returns the DTO.
func (uc *CreateUseCase) Execute(ctx context.Context, req CreateRequest) (*JobResponse, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

	app, err := req.ToEntity()
	if err != nil {
		return nil, err
	}

	created, err := uc.repo.Create(ctx, app)
	if err != nil {
		return nil, err
	}

	return FromEntity(created), nil
}
