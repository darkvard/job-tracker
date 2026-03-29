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

// WeeklyAppRow holds the application count for a single week bucket.
type WeeklyAppRow struct {
	WeekStart time.Time
	Count     int64
}

// SourceBreakdownRow holds the application count for a single source value.
type SourceBreakdownRow struct {
	Source string
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

// AnalyticsRepository defines persistence queries needed by the analytics use case.
// Kept separate from DashboardRepository per ISP — these are aggregation-only queries.
type AnalyticsRepository interface {
	// CountByStatus returns all-time application counts grouped by current status for the user.
	CountByStatus(ctx context.Context, userID int64) ([]StatusCount, error)
	// GetWeeklyApplications returns application counts grouped by ISO week for the last numWeeks
	// weeks, starting from 'from'. Weeks with zero applications are omitted (caller fills gaps).
	GetWeeklyApplications(ctx context.Context, userID int64, from time.Time, numWeeks int) ([]WeeklyAppRow, error)
	// GetSourceBreakdown returns application counts grouped by source for the user.
	GetSourceBreakdown(ctx context.Context, userID int64) ([]SourceBreakdownRow, error)
	// GetAvgResponseDays returns the average number of days between date_applied and the first
	// non-initial status transition. Returns -1 if there is no data.
	GetAvgResponseDays(ctx context.Context, userID int64) (float64, error)
}
