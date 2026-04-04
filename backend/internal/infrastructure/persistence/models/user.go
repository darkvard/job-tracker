package models

import (
	"time"

	"job-tracker/internal/domain/entity"
)

// UserModel is the GORM persistence model for a user.
// Never expose outside the persistence package.
type UserModel struct {
	ID              int64     `gorm:"primaryKey;autoIncrement"`
	Email           string    `gorm:"uniqueIndex;not null"`
	PasswordHash    string    `gorm:"not null"`
	Name            string    `gorm:"not null"`
	CurrentLocation *string   `gorm:"column:current_location"`
	CurrentRole     *string   `gorm:"column:current_role"`
	CurrentCompany  *string   `gorm:"column:current_company"`
	CurrentSalary   *int64    `gorm:"column:current_salary"`
	SalaryCurrency  string    `gorm:"column:salary_currency;not null;default:'VND'"`
	CreatedAt       time.Time `gorm:"autoCreateTime"`
	UpdatedAt       time.Time `gorm:"autoUpdateTime"`
}

// TableName returns the database table name.
func (UserModel) TableName() string { return "users" }

// ToEntity converts the GORM model to a domain entity.
func (m *UserModel) ToEntity() *entity.User {
	return &entity.User{
		ID:              m.ID,
		Email:           m.Email,
		PasswordHash:    m.PasswordHash,
		Name:            m.Name,
		CurrentLocation: m.CurrentLocation,
		CurrentRole:     m.CurrentRole,
		CurrentCompany:  m.CurrentCompany,
		CurrentSalary:   m.CurrentSalary,
		SalaryCurrency:  m.SalaryCurrency,
		CreatedAt:       m.CreatedAt,
		UpdatedAt:       m.UpdatedAt,
	}
}

// FromUserEntity converts a domain entity to a GORM model.
func FromUserEntity(u *entity.User) *UserModel {
	return &UserModel{
		ID:              u.ID,
		Email:           u.Email,
		PasswordHash:    u.PasswordHash,
		Name:            u.Name,
		CurrentLocation: u.CurrentLocation,
		CurrentRole:     u.CurrentRole,
		CurrentCompany:  u.CurrentCompany,
		CurrentSalary:   u.CurrentSalary,
		SalaryCurrency:  u.SalaryCurrency,
	}
}
