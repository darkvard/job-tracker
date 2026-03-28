package valueobject

import domainerrors "job-tracker/internal/domain/errors"

// Status represents the lifecycle stage of a job application.
type Status string

const (
	StatusApplied   Status = "Applied"
	StatusInterview Status = "Interview"
	StatusOffer     Status = "Offer"
	StatusRejected  Status = "Rejected"
)

// IsValid reports whether s is a recognised Status value.
func (s Status) IsValid() bool {
	switch s {
	case StatusApplied, StatusInterview, StatusOffer, StatusRejected:
		return true
	}
	return false
}

func (s Status) String() string { return string(s) }

// canTransitionMap defines legal (from → to) pairs.
var canTransitionMap = map[Status]map[Status]bool{
	StatusApplied: {
		StatusInterview: true,
		StatusRejected:  true,
	},
	StatusInterview: {
		StatusOffer:    true,
		StatusRejected: true,
	},
}

// CanTransition reports whether transitioning from → to is valid.
func CanTransition(from, to Status) bool {
	if targets, ok := canTransitionMap[from]; ok {
		return targets[to]
	}
	return false
}

// ValidateTransition returns an InvalidStatus error if the transition is illegal.
func ValidateTransition(from, to Status) error {
	if !CanTransition(from, to) {
		return domainerrors.InvalidStatus(
			"cannot transition from " + from.String() + " to " + to.String(),
		)
	}
	return nil
}
