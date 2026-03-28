// Package clock provides a mockable time source.
package clock

import "time"

// Clock is a time source that can be replaced in tests.
type Clock interface {
	Now() time.Time
}

// RealClock returns the current wall-clock time.
type RealClock struct{}

func (RealClock) Now() time.Time { return time.Now() }

// MockClock returns a fixed instant, useful for deterministic tests.
type MockClock struct {
	Fixed time.Time
}

func (m MockClock) Now() time.Time { return m.Fixed }
