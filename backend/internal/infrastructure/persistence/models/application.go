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

	// Extended fields
	Salary         *int64     `gorm:"column:salary"`
	BHXHPct        *float64   `gorm:"column:bhxh_pct"`
	BHYTPct        *float64   `gorm:"column:bhyt_pct"`
	LunchAllowance *int64     `gorm:"column:lunch_allowance"`
	BonusAnnual    *int64     `gorm:"column:bonus_annual"`
	NoSaturday     bool       `gorm:"column:no_saturday;not null;default:false"`
	NoForcedOT     bool       `gorm:"column:no_forced_ot;not null;default:false"`
	CommuteAddress string     `gorm:"column:commute_address;not null;default:''"`
	WorkType       string     `gorm:"column:work_type;not null;default:'Onsite'"`
	InterviewDate  *time.Time `gorm:"column:interview_date"`
}

// TableName returns the database table name.
func (ApplicationModel) TableName() string { return "applications" }

// ToEntity converts the GORM model to a domain entity.
func (m *ApplicationModel) ToEntity() *entity.Application {
	app := &entity.Application{
		ID:             m.ID,
		UserID:         m.UserID,
		Company:        m.Company,
		Role:           m.Role,
		Status:         valueobject.Status(m.Status),
		DateApplied:    m.DateApplied,
		Location:       m.Location,
		Source:         valueobject.Source(m.Source),
		Notes:          m.Notes,
		CreatedAt:      m.CreatedAt,
		UpdatedAt:      m.UpdatedAt,
		Salary:         m.Salary,
		BHXHPct:        m.BHXHPct,
		BHYTPct:        m.BHYTPct,
		LunchAllowance: m.LunchAllowance,
		BonusAnnual:    m.BonusAnnual,
		NoSaturday:     m.NoSaturday,
		NoForcedOT:     m.NoForcedOT,
		CommuteAddress: m.CommuteAddress,
		WorkType:       valueobject.WorkType(m.WorkType),
		InterviewDate:  m.InterviewDate,
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
	workType := app.WorkType.String()
	if workType == "" {
		workType = "Onsite"
	}
	return &ApplicationModel{
		ID:             app.ID,
		UserID:         app.UserID,
		Company:        app.Company,
		Role:           app.Role,
		Status:         app.Status.String(),
		DateApplied:    app.DateApplied,
		Location:       app.Location,
		Source:         app.Source.String(),
		Notes:          app.Notes,
		CreatedAt:      app.CreatedAt,
		Salary:         app.Salary,
		BHXHPct:        app.BHXHPct,
		BHYTPct:        app.BHYTPct,
		LunchAllowance: app.LunchAllowance,
		BonusAnnual:    app.BonusAnnual,
		NoSaturday:     app.NoSaturday,
		NoForcedOT:     app.NoForcedOT,
		CommuteAddress: app.CommuteAddress,
		WorkType:       workType,
		InterviewDate:  app.InterviewDate,
	}
}
