package entity

import (
	"time"

	domainerrors "job-tracker/internal/domain/errors"
	"job-tracker/internal/domain/valueobject"
)

// Application represents a single job application.
type Application struct {
	ID             int64
	UserID         int64
	Company        string
	Role           string
	Status         valueobject.Status
	PreviousStatus valueobject.Status
	DateApplied    time.Time
	Location       string
	Source         valueobject.Source
	Notes          string
	StatusHistory  []StatusHistoryEntry
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

// NewApplication constructs a validated Application entity.
func NewApplication(
	userID int64,
	company, role string,
	source valueobject.Source,
	status valueobject.Status,
	dateApplied time.Time,
) (*Application, error) {
	if company == "" {
		return nil, domainerrors.InvalidInput("Application", "company is required")
	}
	if role == "" {
		return nil, domainerrors.InvalidInput("Application", "role is required")
	}
	if !source.IsValid() {
		return nil, domainerrors.InvalidInput("Application", "invalid source: "+source.String())
	}
	if !status.IsValid() {
		return nil, domainerrors.InvalidInput("Application", "invalid status: "+status.String())
	}
	return &Application{
		UserID:      userID,
		Company:     company,
		Role:        role,
		Source:      source,
		Status:      status,
		DateApplied: dateApplied,
	}, nil
}

// TransitionStatus moves the application to a new status, enforcing transition rules.
func (a *Application) TransitionStatus(newStatus valueobject.Status) error {
	if err := valueobject.ValidateTransition(a.Status, newStatus); err != nil {
		return err
	}
	if !newStatus.IsValid() {
		return domainerrors.InvalidInput("Application", "invalid status: "+newStatus.String())
	}
	a.PreviousStatus = a.Status
	a.Status = newStatus
	return nil
}
