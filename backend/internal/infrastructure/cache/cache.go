package cache

import (
	"context"
	"time"
)

// Cache defines the interface for cache operations used by infrastructure decorators.
// This interface lives in infrastructure (not domain) — caching is an infrastructure concern.
type Cache interface {
	GetJSON(ctx context.Context, key string, dest any) error
	SetJSON(ctx context.Context, key string, val any, ttl time.Duration) error
	Delete(ctx context.Context, key string) error
	DeletePattern(ctx context.Context, pattern string) error
}
