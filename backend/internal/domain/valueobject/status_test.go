package valueobject_test

import (
	"testing"

	"job-tracker/internal/domain/valueobject"
)

func TestCanTransition(t *testing.T) {
	tests := []struct {
		from    valueobject.Status
		to      valueobject.Status
		allowed bool
	}{
		{valueobject.StatusApplied, valueobject.StatusInterview, true},
		{valueobject.StatusApplied, valueobject.StatusRejected, true},
		{valueobject.StatusApplied, valueobject.StatusOffer, false},
		{valueobject.StatusApplied, valueobject.StatusApplied, false},
		{valueobject.StatusInterview, valueobject.StatusOffer, true},
		{valueobject.StatusInterview, valueobject.StatusRejected, true},
		{valueobject.StatusInterview, valueobject.StatusApplied, false},
		{valueobject.StatusOffer, valueobject.StatusRejected, false},
		{valueobject.StatusOffer, valueobject.StatusInterview, false},
		{valueobject.StatusRejected, valueobject.StatusApplied, false},
		{valueobject.StatusRejected, valueobject.StatusInterview, false},
	}

	for _, tt := range tests {
		got := valueobject.CanTransition(tt.from, tt.to)
		if got != tt.allowed {
			t.Errorf("CanTransition(%s, %s) = %v, want %v", tt.from, tt.to, got, tt.allowed)
		}
	}
}
