package job

import (
	"job-tracker/internal/domain/repository"
)

// UseCases groups all job application use cases.
type UseCases struct {
	Create       *CreateUseCase
	List         *ListUseCase
	Get          *GetUseCase
	Update       *UpdateUseCase
	UpdateStatus *UpdateStatusUseCase
	Delete       *DeleteUseCase
}

// NewUseCases constructs all job use cases with their shared dependencies.
func NewUseCases(repo repository.ApplicationRepository, tx repository.TxManager) *UseCases {
	return &UseCases{
		Create:       NewCreateUseCase(repo),
		List:         NewListUseCase(repo),
		Get:          NewGetUseCase(repo),
		Update:       NewUpdateUseCase(repo),
		UpdateStatus: NewUpdateStatusUseCase(repo, tx),
		Delete:       NewDeleteUseCase(repo),
	}
}
