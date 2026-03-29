package repository

import (
	"context"
	"time"

	"job-tracker/internal/domain/entity"
)

// StatusCount holds an aggregated count for a single status value.
type StatusCount struct {
	Status string
	Count  int64
}

// DashboardRepository defines persistence queries needed by the dashboard use case.
// Kept separate from ApplicationRepository per ISP — analytics queries are read-only aggregates.
type DashboardRepository interface {
	// CountByStatus returns all-time application counts grouped by current status for the user.
	CountByStatus(ctx context.Context, userID int64) ([]StatusCount, error)
	// CountCreatedBetween returns application counts grouped by current status for apps
	// whose created_at falls in [from, to).
	CountCreatedBetween(ctx context.Context, userID int64, from, to time.Time) ([]StatusCount, error)
	// ListRecent returns the most recently created applications, up to limit.
	ListRecent(ctx context.Context, userID int64, limit int) ([]entity.Application, error)
}
