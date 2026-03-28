package entity

import (
	"regexp"
	"time"

	domainerrors "job-tracker/internal/domain/errors"
)

var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)

// User represents an authenticated account in the system.
type User struct {
	ID           int64
	Email        string
	PasswordHash string
	Name         string
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

// NewUser constructs a User, validating the email format.
func NewUser(email, passwordHash, name string) (*User, error) {
	if !emailRegex.MatchString(email) {
		return nil, domainerrors.InvalidInput("User", "invalid email format")
	}
	return &User{
		Email:        email,
		PasswordHash: passwordHash,
		Name:         name,
	}, nil
}
