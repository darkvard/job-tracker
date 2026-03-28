package repository

import "context"

// TxManager wraps multiple repository operations in a single atomic transaction.
// The injected context carries the active *gorm.DB transaction via ctxkey.WithTx.
type TxManager interface {
	WithTransaction(ctx context.Context, fn func(ctx context.Context) error) error
}
