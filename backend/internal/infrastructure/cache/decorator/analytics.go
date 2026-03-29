package decorator

import (
	"context"
	"fmt"
	"time"

	"job-tracker/internal/application/analytics"
	"job-tracker/internal/infrastructure/cache"
)

// cachedAnalytics wraps an AnalyticsExecutor and caches results in Redis.
// Cache keys: analytics:<method>:<userID>  TTL: ttl
// GET/SET only — DELETE is handled by JobCacheInvalidator via analytics:*:<userID> pattern.
type cachedAnalytics struct {
	inner analytics.AnalyticsExecutor
	rdb   *cache.RedisCache
	ttl   time.Duration
}

// NewAnalytics returns an AnalyticsExecutor that serves from Redis cache when available.
func NewAnalytics(inner analytics.AnalyticsExecutor, rdb *cache.RedisCache, ttl time.Duration) analytics.AnalyticsExecutor {
	return &cachedAnalytics{inner: inner, rdb: rdb, ttl: ttl}
}

func (c *cachedAnalytics) GetWeekly(ctx context.Context, userID int64) (*analytics.WeeklyAnalytics, error) {
	key := fmt.Sprintf("analytics:weekly:%d", userID)
	var cached analytics.WeeklyAnalytics
	if err := c.rdb.GetJSON(ctx, key, &cached); err == nil {
		return &cached, nil
	}
	result, err := c.inner.GetWeekly(ctx, userID)
	if err != nil {
		return nil, err
	}
	_ = c.rdb.SetJSON(ctx, key, result, c.ttl)
	return result, nil
}

func (c *cachedAnalytics) GetFunnel(ctx context.Context, userID int64) ([]analytics.FunnelData, error) {
	key := fmt.Sprintf("analytics:funnel:%d", userID)
	var cached []analytics.FunnelData
	if err := c.rdb.GetJSON(ctx, key, &cached); err == nil {
		return cached, nil
	}
	result, err := c.inner.GetFunnel(ctx, userID)
	if err != nil {
		return nil, err
	}
	_ = c.rdb.SetJSON(ctx, key, result, c.ttl)
	return result, nil
}

func (c *cachedAnalytics) GetSources(ctx context.Context, userID int64) ([]analytics.SourceData, error) {
	key := fmt.Sprintf("analytics:sources:%d", userID)
	var cached []analytics.SourceData
	if err := c.rdb.GetJSON(ctx, key, &cached); err == nil {
		return cached, nil
	}
	result, err := c.inner.GetSources(ctx, userID)
	if err != nil {
		return nil, err
	}
	_ = c.rdb.SetJSON(ctx, key, result, c.ttl)
	return result, nil
}

func (c *cachedAnalytics) GetMetrics(ctx context.Context, userID int64) (*analytics.KeyMetrics, error) {
	key := fmt.Sprintf("analytics:metrics:%d", userID)
	var cached analytics.KeyMetrics
	if err := c.rdb.GetJSON(ctx, key, &cached); err == nil {
		return &cached, nil
	}
	result, err := c.inner.GetMetrics(ctx, userID)
	if err != nil {
		return nil, err
	}
	_ = c.rdb.SetJSON(ctx, key, result, c.ttl)
	return result, nil
}
