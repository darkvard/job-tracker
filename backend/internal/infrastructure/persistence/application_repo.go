package persistence

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"

	"job-tracker/internal/domain/entity"
	domainerrors "job-tracker/internal/domain/errors"
	"job-tracker/internal/domain/repository"
	"job-tracker/internal/domain/valueobject"
	"job-tracker/internal/infrastructure/persistence/models"
	"job-tracker/pkg/ctxkey"
)

// sortWhitelist maps allowed sort_by param values to their SQL column names.
var sortWhitelist = map[string]string{
	"company":      "company",
	"date_applied": "date_applied",
	"created_at":   "created_at",
}

// PostgresApplicationRepo implements domain/repository.ApplicationRepository via GORM.
type PostgresApplicationRepo struct {
	gdb *gorm.DB
}

// NewPostgresApplicationRepo returns a PostgresApplicationRepo.
func NewPostgresApplicationRepo(db *gorm.DB) *PostgresApplicationRepo {
	return &PostgresApplicationRepo{gdb: db}
}

func (r *PostgresApplicationRepo) db(ctx context.Context) *gorm.DB {
	if tx := ctxkey.GetTx(ctx); tx != nil {
		return tx
	}
	return r.gdb.WithContext(ctx)
}

// Create inserts a new application and its initial status_history row, then returns the entity.
func (r *PostgresApplicationRepo) Create(ctx context.Context, app *entity.Application) (*entity.Application, error) {
	m := models.FromApplicationEntity(app)
	if err := r.db(ctx).Create(m).Error; err != nil {
		return nil, fmt.Errorf("applicationRepo.Create: %w", err)
	}

	hist := &models.StatusHistoryModel{
		ApplicationID: m.ID,
		FromStatus:    nil,
		ToStatus:      m.Status,
		Note:          "",
		ChangedAt:     time.Now(),
	}
	if err := r.db(ctx).Create(hist).Error; err != nil {
		return nil, fmt.Errorf("applicationRepo.Create hist: %w", err)
	}

	result := m.ToEntity()
	result.StatusHistory = []entity.StatusHistoryEntry{*hist.ToEntity()}
	return result, nil
}

// FindByID returns the application with the given ID, preloading status_history ordered by changed_at ASC.
func (r *PostgresApplicationRepo) FindByID(ctx context.Context, id int64) (*entity.Application, error) {
	var m models.ApplicationModel
	err := r.db(ctx).Preload("StatusHistory", func(db *gorm.DB) *gorm.DB {
		return db.Order("changed_at ASC")
	}).First(&m, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domainerrors.NotFound("Application", fmt.Sprintf("id=%d", id))
		}
		return nil, fmt.Errorf("applicationRepo.FindByID: %w", err)
	}
	return m.ToEntity(), nil
}

// List returns a paginated, filtered slice of applications for the given user.
func (r *PostgresApplicationRepo) List(ctx context.Context, userID int64, filters repository.ListFilters, page valueobject.PageRequest) ([]entity.Application, int64, error) {
	query := r.db(ctx).Model(&models.ApplicationModel{}).Where("user_id = ?", userID)

	if filters.Status != "" {
		query = query.Where("status = ?", filters.Status.String())
	}
	if filters.Search != "" {
		search := "%" + filters.Search + "%"
		query = query.Where("(company ILIKE ? OR role ILIKE ?)", search, search)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("applicationRepo.List count: %w", err)
	}

	col, ok := sortWhitelist[page.SortBy]
	if !ok {
		col = "created_at"
	}
	order := "DESC"
	if strings.ToLower(page.Order) == "asc" {
		order = "ASC"
	}

	offset := (page.Page - 1) * page.Size

	var ms []models.ApplicationModel
	if err := query.Order(col + " " + order).Offset(offset).Limit(page.Size).Find(&ms).Error; err != nil {
		return nil, 0, fmt.Errorf("applicationRepo.List: %w", err)
	}

	apps := make([]entity.Application, len(ms))
	for i := range ms {
		apps[i] = *ms[i].ToEntity()
	}
	return apps, total, nil
}

// UpdateWithHistory saves the updated application fields and, when a status transition occurred,
// inserts a status_history row. Both writes share the same transaction via db(ctx).
func (r *PostgresApplicationRepo) UpdateWithHistory(ctx context.Context, app *entity.Application, note string) error {
	m := models.FromApplicationEntity(app)
	if err := r.db(ctx).Save(m).Error; err != nil {
		return fmt.Errorf("applicationRepo.UpdateWithHistory: %w", err)
	}

	// Only insert a history row when a real status transition was recorded
	if app.PreviousStatus != "" {
		from := app.PreviousStatus.String()
		hist := &models.StatusHistoryModel{
			ApplicationID: app.ID,
			FromStatus:    &from,
			ToStatus:      app.Status.String(),
			Note:          note,
			ChangedAt:     time.Now(),
		}
		if err := r.db(ctx).Create(hist).Error; err != nil {
			return fmt.Errorf("applicationRepo.UpdateWithHistory hist: %w", err)
		}
	}
	return nil
}

// Delete hard-deletes the application with the given ID.
func (r *PostgresApplicationRepo) Delete(ctx context.Context, id int64) error {
	result := r.db(ctx).Delete(&models.ApplicationModel{}, id)
	if result.Error != nil {
		return fmt.Errorf("applicationRepo.Delete: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return domainerrors.NotFound("Application", fmt.Sprintf("id=%d", id))
	}
	return nil
}
