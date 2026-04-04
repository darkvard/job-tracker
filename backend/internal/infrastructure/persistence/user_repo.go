package persistence

import (
	"context"
	"errors"
	"fmt"

	"gorm.io/gorm"

	"job-tracker/internal/domain/entity"
	domainerrors "job-tracker/internal/domain/errors"
	"job-tracker/internal/infrastructure/persistence/models"
	"job-tracker/pkg/ctxkey"
)

// PostgresUserRepo implements domain/repository.UserRepository via GORM.
type PostgresUserRepo struct {
	gdb *gorm.DB
}

// NewPostgresUserRepo returns a PostgresUserRepo.
func NewPostgresUserRepo(db *gorm.DB) *PostgresUserRepo {
	return &PostgresUserRepo{gdb: db}
}

func (r *PostgresUserRepo) db(ctx context.Context) *gorm.DB {
	if tx := ctxkey.GetTx(ctx); tx != nil {
		return tx
	}
	return r.gdb.WithContext(ctx)
}

// Create inserts a new user and returns it with its generated ID.
func (r *PostgresUserRepo) Create(ctx context.Context, user *entity.User) (*entity.User, error) {
	m := models.FromUserEntity(user)
	if err := r.db(ctx).Create(m).Error; err != nil {
		if isUniqueViolation(err) {
			return nil, domainerrors.AlreadyExists("User", "email already registered")
		}
		return nil, fmt.Errorf("userRepo.Create: %w", err)
	}
	return m.ToEntity(), nil
}

// FindByID returns the user with the given ID.
func (r *PostgresUserRepo) FindByID(ctx context.Context, id int64) (*entity.User, error) {
	var m models.UserModel
	err := r.db(ctx).First(&m, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domainerrors.NotFound("User", "user not found")
		}
		return nil, fmt.Errorf("userRepo.FindByID: %w", err)
	}
	return m.ToEntity(), nil
}

// FindByEmail returns the user with the given email.
func (r *PostgresUserRepo) FindByEmail(ctx context.Context, email string) (*entity.User, error) {
	var m models.UserModel
	err := r.db(ctx).Where("email = ?", email).First(&m).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domainerrors.NotFound("User", "user not found")
		}
		return nil, fmt.Errorf("userRepo.FindByEmail: %w", err)
	}
	return m.ToEntity(), nil
}

// ExistsByEmail reports whether a user with the given email exists.
func (r *PostgresUserRepo) ExistsByEmail(ctx context.Context, email string) (bool, error) {
	var count int64
	err := r.db(ctx).Model(&models.UserModel{}).Where("email = ?", email).Count(&count).Error
	if err != nil {
		return false, fmt.Errorf("userRepo.ExistsByEmail: %w", err)
	}
	return count > 0, nil
}

// Update saves all fields of an existing user and returns the updated entity.
func (r *PostgresUserRepo) Update(ctx context.Context, user *entity.User) (*entity.User, error) {
	m := models.FromUserEntity(user)
	if err := r.db(ctx).Save(m).Error; err != nil {
		if isUniqueViolation(err) {
			return nil, domainerrors.AlreadyExists("User", "email already registered")
		}
		return nil, fmt.Errorf("userRepo.Update: %w", err)
	}
	return m.ToEntity(), nil
}
