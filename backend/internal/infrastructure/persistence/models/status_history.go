package models

import (
	"time"

	"job-tracker/internal/domain/entity"
	"job-tracker/internal/domain/valueobject"
)

// StatusHistoryModel is the GORM persistence model for a status transition record.
// Never expose outside the persistence package.
type StatusHistoryModel struct {
	ID            int64     `gorm:"primaryKey;autoIncrement"`
	ApplicationID int64     `gorm:"not null;index"`
	FromStatus    *string   `gorm:"column:from_status"` // NULL for the initial Applied entry
	ToStatus      string    `gorm:"not null;size:20"`
	Note          string    `gorm:"not null;default:''"`
	ChangedAt     time.Time `gorm:"not null"`
}

// TableName returns the database table name.
func (StatusHistoryModel) TableName() string { return "status_history" }

// ToEntity converts the GORM model to a domain entity.
func (m *StatusHistoryModel) ToEntity() *entity.StatusHistoryEntry {
	entry := &entity.StatusHistoryEntry{
		ID:            m.ID,
		ApplicationID: m.ApplicationID,
		ToStatus:      valueobject.Status(m.ToStatus),
		Note:          m.Note,
		ChangedAt:     m.ChangedAt,
	}
	if m.FromStatus != nil {
		entry.FromStatus = valueobject.Status(*m.FromStatus)
	}
	return entry
}
