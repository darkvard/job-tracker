package repository

import (
	"context"

	"job-tracker/internal/domain/entity"
	"job-tracker/internal/domain/valueobject"
)

// ListFilters holds optional filters for listing applications.
type ListFilters struct {
	UserID string
	Status valueobject.Status
	Search string
}

// ApplicationRepository defines persistence operations for job applications.
type ApplicationRepository interface {
	Create(ctx context.Context, app *entity.Application) (*entity.Application, error)
	FindByID(ctx context.Context, id int64) (*entity.Application, error)
	List(ctx context.Context, userID int64, filters ListFilters, page valueobject.PageRequest) ([]entity.Application, int64, error)
	UpdateWithHistory(ctx context.Context, app *entity.Application, note string) error
	Delete(ctx context.Context, id int64) error
}
