// Package auth contains use cases for user registration and authentication.
package auth

import (
	"regexp"
	"time"

	domainerrors "job-tracker/internal/domain/errors"
)

var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)

// RegisterRequest carries data for the register use case.
type RegisterRequest struct {
	Email    string
	Password string
	Name     string
}

// Validate checks that the request fields meet business constraints.
func (r RegisterRequest) Validate() error {
	if !emailRegex.MatchString(r.Email) {
		return domainerrors.InvalidInput("RegisterRequest", "invalid email format")
	}
	if len(r.Password) < 8 {
		return domainerrors.InvalidInput("RegisterRequest", "password must be at least 8 characters")
	}
	if r.Name == "" {
		return domainerrors.InvalidInput("RegisterRequest", "name is required")
	}
	return nil
}

// LoginRequest carries data for the login use case.
type LoginRequest struct {
	Email    string
	Password string
}

// Validate checks that the request fields are non-empty and well-formed.
func (r LoginRequest) Validate() error {
	if !emailRegex.MatchString(r.Email) {
		return domainerrors.InvalidInput("LoginRequest", "invalid email format")
	}
	if r.Password == "" {
		return domainerrors.InvalidInput("LoginRequest", "password is required")
	}
	return nil
}

// UserInfo is a safe public view of a user (no password hash).
type UserInfo struct {
	ID        int64     `json:"id"`
	Email     string    `json:"email"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"createdAt"`
}

// AuthResponse is the payload returned by register and login.
type AuthResponse struct {
	Token string   `json:"token"`
	User  UserInfo `json:"user"`
}
