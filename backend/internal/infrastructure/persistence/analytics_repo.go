package persistence

import (
	"context"
	"fmt"
	"time"

	"job-tracker/internal/domain/entity"
	"job-tracker/internal/domain/repository"
	"job-tracker/internal/infrastructure/persistence/models"
)

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
