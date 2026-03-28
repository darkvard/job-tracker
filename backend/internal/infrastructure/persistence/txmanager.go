package persistence

import (
	"context"
	"fmt"

	"gorm.io/gorm"

	"job-tracker/pkg/ctxkey"
)

// gormTxManager implements domain/repository.TxManager using GORM transactions.
type gormTxManager struct {
	db *gorm.DB
}

// NewTxManager creates a new GORMTxManager.
func NewTxManager(db *gorm.DB) *gormTxManager { //nolint:revive
	return &gormTxManager{db: db}
}

// WithTransaction runs fn inside a database transaction.
// The transaction is injected into the context via ctxkey.WithTx so repositories
// can detect it with their db(ctx) helper.
func (t *gormTxManager) WithTransaction(ctx context.Context, fn func(ctx context.Context) error) error {
	return t.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		txCtx := ctxkey.WithTx(ctx, tx)
		if err := fn(txCtx); err != nil {
			return fmt.Errorf("transaction: %w", err)
		}
		return nil
	})
}
