package persistence

import (
	"context"
	"fmt"
	"time"

	"job-tracker/internal/domain/entity"
	"job-tracker/internal/domain/repository"
	"job-tracker/internal/infrastructure/persistence/models"
)

// weeklyRow is a scan target for the weekly aggregation query.
type weeklyRow struct {
	WeekStart time.Time
	Count     int64
}

// sourceRow is a scan target for the source breakdown aggregation query.
type sourceRow struct {
	Source string
	Count  int64
}

// avgRow is a scan target for the average response days query.
type avgRow struct {
	AvgDays *float64
}

// statusCountRow is an intermediate scan target for aggregate status queries.
type statusCountRow struct {
	Status string
	Count  int64
}

// CountByStatus returns all-time application counts grouped by current status for the user.
func (r *PostgresApplicationRepo) CountByStatus(ctx context.Context, userID int64) ([]repository.StatusCount, error) {
	var rows []statusCountRow
	if err := r.db(ctx).Model(&models.ApplicationModel{}).
		Select("status, COUNT(*) as count").
		Where("user_id = ?", userID).
		Group("status").
		Scan(&rows).Error; err != nil {
		return nil, fmt.Errorf("analyticsRepo.CountByStatus: %w", err)
	}
	result := make([]repository.StatusCount, len(rows))
	for i, row := range rows {
		result[i] = repository.StatusCount{Status: row.Status, Count: row.Count}
	}
	return result, nil
}

// CountCreatedBetween returns application counts grouped by current status for apps
// whose created_at falls in [from, to).
func (r *PostgresApplicationRepo) CountCreatedBetween(ctx context.Context, userID int64, from, to time.Time) ([]repository.StatusCount, error) {
	var rows []statusCountRow
	if err := r.db(ctx).Model(&models.ApplicationModel{}).
		Select("status, COUNT(*) as count").
		Where("user_id = ? AND created_at >= ? AND created_at < ?", userID, from, to).
		Group("status").
		Scan(&rows).Error; err != nil {
		return nil, fmt.Errorf("analyticsRepo.CountCreatedBetween: %w", err)
	}
	result := make([]repository.StatusCount, len(rows))
	for i, row := range rows {
		result[i] = repository.StatusCount{Status: row.Status, Count: row.Count}
	}
	return result, nil
}

// ListRecent returns the most recently created applications, up to limit.
func (r *PostgresApplicationRepo) ListRecent(ctx context.Context, userID int64, limit int) ([]entity.Application, error) {
	var ms []models.ApplicationModel
	if err := r.db(ctx).
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).
		Find(&ms).Error; err != nil {
		return nil, fmt.Errorf("analyticsRepo.ListRecent: %w", err)
	}
	apps := make([]entity.Application, len(ms))
	for i := range ms {
		apps[i] = *ms[i].ToEntity()
	}
	return apps, nil
}

// GetWeeklyApplications returns application counts grouped by ISO week for the last numWeeks
// weeks starting from 'from'. Weeks with no applications are omitted.
func (r *PostgresApplicationRepo) GetWeeklyApplications(ctx context.Context, userID int64, from time.Time, numWeeks int) ([]repository.WeeklyAppRow, error) {
	to := from.AddDate(0, 0, numWeeks*7)
	var rows []weeklyRow
	if err := r.db(ctx).Raw(`
		SELECT DATE_TRUNC('week', created_at) AS week_start, COUNT(*) AS count
		FROM applications
		WHERE user_id = ? AND created_at >= ? AND created_at < ?
		GROUP BY DATE_TRUNC('week', created_at)
		ORDER BY week_start
	`, userID, from, to).Scan(&rows).Error; err != nil {
		return nil, fmt.Errorf("analyticsRepo.GetWeeklyApplications: %w", err)
	}
	result := make([]repository.WeeklyAppRow, len(rows))
	for i, row := range rows {
		result[i] = repository.WeeklyAppRow{WeekStart: row.WeekStart.UTC(), Count: row.Count}
	}
	return result, nil
}

// GetSourceBreakdown returns application counts grouped by source for the user.
func (r *PostgresApplicationRepo) GetSourceBreakdown(ctx context.Context, userID int64) ([]repository.SourceBreakdownRow, error) {
	var rows []sourceRow
	if err := r.db(ctx).Model(&models.ApplicationModel{}).
		Select("source, COUNT(*) AS count").
		Where("user_id = ?", userID).
		Group("source").
		Scan(&rows).Error; err != nil {
		return nil, fmt.Errorf("analyticsRepo.GetSourceBreakdown: %w", err)
	}
	result := make([]repository.SourceBreakdownRow, len(rows))
	for i, row := range rows {
		result[i] = repository.SourceBreakdownRow{Source: row.Source, Count: row.Count}
	}
	return result, nil
}

// GetAvgResponseDays returns the average number of days between date_applied and the first
// non-initial status transition. Returns -1 if there is no data.
func (r *PostgresApplicationRepo) GetAvgResponseDays(ctx context.Context, userID int64) (float64, error) {
	var row avgRow
	if err := r.db(ctx).Raw(`
		SELECT AVG(
			EXTRACT(EPOCH FROM (sh.changed_at - a.date_applied)) / 86400.0
		) AS avg_days
		FROM applications a
		JOIN status_history sh ON sh.application_id = a.id
		WHERE a.user_id = ? AND sh.from_status = 'Applied'
	`, userID).Scan(&row).Error; err != nil {
		return -1, fmt.Errorf("analyticsRepo.GetAvgResponseDays: %w", err)
	}
	if row.AvgDays == nil {
		return -1, nil
	}
	return *row.AvgDays, nil
}
