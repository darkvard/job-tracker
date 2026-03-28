// Package ctxkey defines typed context keys for the job-tracker application.
// Using unexported struct types prevents key collisions across packages.
package ctxkey

import (
	"context"

	"gorm.io/gorm"
)

type (
	userIDKey    struct{}
	requestIDKey struct{}
	txKey        struct{}
)

// WithUserID stores the authenticated user's ID in the context.
func WithUserID(ctx context.Context, id int64) context.Context {
	return context.WithValue(ctx, userIDKey{}, id)
}

// GetUserID retrieves the authenticated user's ID from the context.
func GetUserID(ctx context.Context) (int64, bool) {
	id, ok := ctx.Value(userIDKey{}).(int64)
	return id, ok
}

// WithRequestID stores the request ID in the context.
func WithRequestID(ctx context.Context, id string) context.Context {
	return context.WithValue(ctx, requestIDKey{}, id)
}

// GetRequestID retrieves the request ID from the context.
func GetRequestID(ctx context.Context) (string, bool) {
	id, ok := ctx.Value(requestIDKey{}).(string)
	return id, ok
}

// WithTx stores a GORM transaction in the context.
func WithTx(ctx context.Context, tx *gorm.DB) context.Context {
	return context.WithValue(ctx, txKey{}, tx)
}

// GetTx retrieves the GORM transaction from the context.
// Returns nil if no transaction is present.
func GetTx(ctx context.Context) *gorm.DB {
	tx, _ := ctx.Value(txKey{}).(*gorm.DB)
	return tx
}
