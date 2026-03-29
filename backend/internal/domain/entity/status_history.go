package entity

import (
	"time"

	"job-tracker/internal/domain/valueobject"
)

// StatusHistoryEntry records a single status transition for an application.
type StatusHistoryEntry struct {
	ID            int64
	ApplicationID int64
	FromStatus    valueobject.Status // empty string for the initial "Applied" entry
	ToStatus      valueobject.Status
	Note          string
	ChangedAt     time.Time
}
