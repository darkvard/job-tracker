package models

import (
	"time"

	"job-tracker/internal/domain/entity"
	"job-tracker/internal/domain/valueobject"
)

// ApplicationModel is the GORM persistence model for a job application.
// Never expose outside the persistence package.
type ApplicationModel struct {
	ID            int64                `gorm:"primaryKey;autoIncrement"`
	UserID        int64                `gorm:"not null;index"`
	Company       string               `gorm:"not null;size:100"`
	Role          string               `gorm:"not null;size:200"`
	Status        string               `gorm:"not null;size:20"`
	DateApplied   time.Time            `gorm:"column:date_applied;not null"`
	Location      string               `gorm:"not null;default:''"`
	Source        string               `gorm:"not null;size:50"`
	Notes         string               `gorm:"not null;default:''"`
	CreatedAt     time.Time            `gorm:"autoCreateTime"`
	UpdatedAt     time.Time            `gorm:"autoUpdateTime"`
	StatusHistory []StatusHistoryModel `gorm:"foreignKey:ApplicationID"`
}

// TableName returns the database table name.
func (ApplicationModel) TableName() string { return "applications" }

// ToEntity converts the GORM model to a domain entity.
func (m *ApplicationModel) ToEntity() *entity.Application {
	app := &entity.Application{
		ID:          m.ID,
		UserID:      m.UserID,
		Company:     m.Company,
		Role:        m.Role,
		Status:      valueobject.Status(m.Status),
		DateApplied: m.DateApplied,
		Location:    m.Location,
		Source:      valueobject.Source(m.Source),
		Notes:       m.Notes,
		CreatedAt:   m.CreatedAt,
		UpdatedAt:   m.UpdatedAt,
	}
	if len(m.StatusHistory) > 0 {
		app.StatusHistory = make([]entity.StatusHistoryEntry, len(m.StatusHistory))
		for i := range m.StatusHistory {
			app.StatusHistory[i] = *m.StatusHistory[i].ToEntity()
		}
	}
	return app
}

// FromApplicationEntity converts a domain entity to a GORM model.
func FromApplicationEntity(app *entity.Application) *ApplicationModel {
	return &ApplicationModel{
		ID:          app.ID,
		UserID:      app.UserID,
		Company:     app.Company,
		Role:        app.Role,
		Status:      app.Status.String(),
		DateApplied: app.DateApplied,
		Location:    app.Location,
		Source:      app.Source.String(),
		Notes:       app.Notes,
		CreatedAt:   app.CreatedAt,
	}
}
