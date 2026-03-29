package job

import (
	"context"

	"job-tracker/internal/domain/repository"
	"job-tracker/internal/domain/valueobject"
)

// ListUseCase handles listing job applications with filters and pagination.
type ListUseCase struct {
	repo repository.ApplicationRepository
}

// NewListUseCase constructs a ListUseCase.
func NewListUseCase(repo repository.ApplicationRepository) *ListUseCase {
	return &ListUseCase{repo: repo}
}

// Execute validates filters, queries the repo, and returns a paginated DTO.
func (uc *ListUseCase) Execute(ctx context.Context, userID int64, filters ListFilters) (*PaginatedJobsResponse, error) {
	if err := filters.Validate(); err != nil {
		return nil, err
	}

	repoFilters := repository.ListFilters{
		Status: valueobject.Status(filters.Status),
		Search: filters.Search,
	}

	page := valueobject.PageRequest{
		Page:   filters.Page,
		Size:   filters.PageSize,
		SortBy: filters.SortBy,
		Order:  filters.Order,
	}

	apps, total, err := uc.repo.List(ctx, userID, repoFilters, page)
	if err != nil {
		return nil, err
	}

	items := make([]JobResponse, len(apps))
	for i := range apps {
		items[i] = *FromEntity(&apps[i])
	}

	totalPages := 0
	if filters.PageSize > 0 {
		totalPages = int((total + int64(filters.PageSize) - 1) / int64(filters.PageSize))
	}

	return &PaginatedJobsResponse{
		Items:      items,
		Total:      total,
		Page:       filters.Page,
		PageSize:   filters.PageSize,
		TotalPages: totalPages,
	}, nil
}
