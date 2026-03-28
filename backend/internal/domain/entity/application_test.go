package entity_test

import (
	"errors"
	"testing"
	"time"

	"job-tracker/internal/domain/entity"
	domainerrors "job-tracker/internal/domain/errors"
	"job-tracker/internal/domain/valueobject"
)

func newTestApp(t *testing.T, status valueobject.Status) *entity.Application {
	t.Helper()
	app, err := entity.NewApplication(
		1, "Acme", "Engineer",
		valueobject.SourceLinkedIn,
		status,
		time.Now(),
	)
	if err != nil {
		t.Fatalf("NewApplication: %v", err)
	}
	return app
}

func TestTransitionStatus_Valid(t *testing.T) {
	cases := []struct {
		from valueobject.Status
		to   valueobject.Status
	}{
		{valueobject.StatusApplied, valueobject.StatusInterview},
		{valueobject.StatusApplied, valueobject.StatusRejected},
		{valueobject.StatusInterview, valueobject.StatusOffer},
		{valueobject.StatusInterview, valueobject.StatusRejected},
	}
	for _, c := range cases {
		app := newTestApp(t, c.from)
		if err := app.TransitionStatus(c.to); err != nil {
			t.Errorf("TransitionStatus(%s→%s) unexpected error: %v", c.from, c.to, err)
		}
		if app.Status != c.to {
			t.Errorf("expected status %s, got %s", c.to, app.Status)
		}
		if app.PreviousStatus != c.from {
			t.Errorf("expected previous %s, got %s", c.from, app.PreviousStatus)
		}
	}
}

func TestTransitionStatus_Invalid(t *testing.T) {
	cases := []struct {
		from valueobject.Status
		to   valueobject.Status
	}{
		{valueobject.StatusApplied, valueobject.StatusOffer},
		{valueobject.StatusOffer, valueobject.StatusInterview},
		{valueobject.StatusRejected, valueobject.StatusApplied},
	}
	for _, c := range cases {
		app := newTestApp(t, c.from)
		err := app.TransitionStatus(c.to)
		if err == nil {
			t.Errorf("TransitionStatus(%s→%s) expected error, got nil", c.from, c.to)
			continue
		}
		var de *domainerrors.DomainError
		if !errors.As(err, &de) || de.Code != domainerrors.ErrCodeInvalidStatus {
			t.Errorf("expected INVALID_STATUS error, got %v", err)
		}
	}
}

func TestNewApplication_Validation(t *testing.T) {
	_, err := entity.NewApplication(1, "", "role", valueobject.SourceLinkedIn, valueobject.StatusApplied, time.Now())
	if err == nil {
		t.Error("expected error for empty company")
	}
	_, err = entity.NewApplication(1, "Acme", "", valueobject.SourceLinkedIn, valueobject.StatusApplied, time.Now())
	if err == nil {
		t.Error("expected error for empty role")
	}
	_, err = entity.NewApplication(1, "Acme", "role", "Unknown", valueobject.StatusApplied, time.Now())
	if err == nil {
		t.Error("expected error for invalid source")
	}
}
