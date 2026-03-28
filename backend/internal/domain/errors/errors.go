package domainerrors

import "fmt"

// ErrorCode represents the type of domain error.
type ErrorCode string

const (
	ErrCodeNotFound      ErrorCode = "NOT_FOUND"
	ErrCodeAlreadyExists ErrorCode = "ALREADY_EXISTS"
	ErrCodeInvalidStatus ErrorCode = "INVALID_STATUS"
	ErrCodeUnauthorized  ErrorCode = "UNAUTHORIZED"
	ErrCodeInvalidInput  ErrorCode = "INVALID_INPUT"
)

// DomainError is a structured error from the domain layer.
type DomainError struct {
	Code    ErrorCode
	Entity  string
	Message string
	Err     error
}

func (e *DomainError) Error() string {
	return fmt.Sprintf("[%s] %s: %s", e.Code, e.Entity, e.Message)
}

func (e *DomainError) Unwrap() error { return e.Err }

// NotFound returns a DomainError for a missing entity.
func NotFound(entity, msg string) *DomainError {
	return &DomainError{Code: ErrCodeNotFound, Entity: entity, Message: msg}
}

// AlreadyExists returns a DomainError for a duplicate entity.
func AlreadyExists(entity, msg string) *DomainError {
	return &DomainError{Code: ErrCodeAlreadyExists, Entity: entity, Message: msg}
}

// InvalidStatus returns a DomainError for an illegal status transition.
func InvalidStatus(msg string) *DomainError {
	return &DomainError{Code: ErrCodeInvalidStatus, Entity: "Application", Message: msg}
}

// Unauthorized returns a DomainError for a forbidden operation.
func Unauthorized(entity, msg string) *DomainError {
	return &DomainError{Code: ErrCodeUnauthorized, Entity: entity, Message: msg}
}

// InvalidInput returns a DomainError for invalid request data.
func InvalidInput(entity, msg string) *DomainError {
	return &DomainError{Code: ErrCodeInvalidInput, Entity: entity, Message: msg}
}
