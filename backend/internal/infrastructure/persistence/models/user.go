package models

import (
	"time"

	"job-tracker/internal/domain/entity"
)

// UserModel is the GORM persistence model for a user.
// Never expose outside the persistence package.
type UserModel struct {
	ID           int64     `gorm:"primaryKey;autoIncrement"`
	Email        string    `gorm:"uniqueIndex;not null"`
	PasswordHash string    `gorm:"not null"`
	Name         string    `gorm:"not null"`
	CreatedAt    time.Time `gorm:"autoCreateTime"`
	UpdatedAt    time.Time `gorm:"autoUpdateTime"`
}

// TableName returns the database table name.
func (UserModel) TableName() string { return "users" }

// ToEntity converts the GORM model to a domain entity.
func (m *UserModel) ToEntity() *entity.User {
	return &entity.User{
		ID:           m.ID,
		Email:        m.Email,
		PasswordHash: m.PasswordHash,
		Name:         m.Name,
		CreatedAt:    m.CreatedAt,
		UpdatedAt:    m.UpdatedAt,
	}
}

// FromUserEntity converts a domain entity to a GORM model.
func FromUserEntity(u *entity.User) *UserModel {
	return &UserModel{
		ID:           u.ID,
		Email:        u.Email,
		PasswordHash: u.PasswordHash,
		Name:         u.Name,
	}
}
