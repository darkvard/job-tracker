// Package decorator provides read-only cache decorators for use cases.
// Decorators implement the same executor interface as the wrapped use case,
// performing GET/SET only — never DELETE (deletion is handled by invalidators).
package decorator

import (
	"context"
	"fmt"
	"time"

	"job-tracker/internal/application/analytics"
	"job-tracker/internal/infrastructure/cache"
)

// cachedDashboard wraps a DashboardExecutor and caches results in Redis.
type cachedDashboard struct {
	inner analytics.DashboardExecutor
	rdb   *cache.RedisCache
	ttl   time.Duration
}

// NewDashboard returns a DashboardExecutor that serves from Redis cache when available.
// Cache key: dashboard:<userID>  TTL: ttl
// On cache miss it calls the inner use case and stores the result.
// Redis errors on read cause a cache miss (graceful degradation).
// Redis errors on write are ignored (fire-and-forget).
func NewDashboard(inner analytics.DashboardExecutor, rdb *cache.RedisCache, ttl time.Duration) analytics.DashboardExecutor {
	return &cachedDashboard{inner: inner, rdb: rdb, ttl: ttl}
}

func (c *cachedDashboard) Execute(ctx context.Context, userID int64) (*analytics.DashboardKPIs, error) {
	key := fmt.Sprintf("dashboard:%d", userID)

	var cached analytics.DashboardKPIs
	if err := c.rdb.GetJSON(ctx, key, &cached); err == nil {
		return &cached, nil
	}

	result, err := c.inner.Execute(ctx, userID)
	if err != nil {
		return nil, err
	}

	_ = c.rdb.SetJSON(ctx, key, result, c.ttl)
	return result, nil
}
