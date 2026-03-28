package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"time"

	"github.com/redis/go-redis/v9"
)

// RedisCache wraps go-redis/v9 and implements the Cache interface.
// Unavailable Redis is handled gracefully: GetJSON returns an error (cache miss),
// SetJSON/Delete/DeletePattern log a warning and continue.
type RedisCache struct {
	client *redis.Client
}

// NewRedis creates a RedisCache and verifies connectivity.
// On failure it logs a warning and returns the cache anyway — callers degrade gracefully.
func NewRedis(addr string) *RedisCache {
	client := redis.NewClient(&redis.Options{
		Addr: addr,
	})

	ctx := context.Background()
	if err := client.Ping(ctx).Err(); err != nil {
		slog.Warn("Redis unavailable, continuing without cache", "addr", addr, "error", err)
	} else {
		slog.Info("Redis connected", "addr", addr)
	}

	return &RedisCache{client: client}
}

// GetJSON retrieves a JSON-encoded value and unmarshals it into dest.
// Returns an error on cache miss or Redis unavailability.
func (r *RedisCache) GetJSON(ctx context.Context, key string, dest any) error {
	data, err := r.client.Get(ctx, key).Bytes()
	if err != nil {
		return fmt.Errorf("cache.GetJSON %q: %w", key, err)
	}
	if err := json.Unmarshal(data, dest); err != nil {
		return fmt.Errorf("cache.GetJSON unmarshal %q: %w", key, err)
	}
	return nil
}

// SetJSON marshals val to JSON and stores it with the given TTL.
// Errors are logged but not returned — cache write failures must never fail mutations.
func (r *RedisCache) SetJSON(ctx context.Context, key string, val any, ttl time.Duration) error {
	data, err := json.Marshal(val)
	if err != nil {
		slog.Warn("cache.SetJSON marshal failed", "key", key, "error", err)
		return fmt.Errorf("cache.SetJSON marshal %q: %w", key, err)
	}
	if err := r.client.Set(ctx, key, data, ttl).Err(); err != nil {
		slog.Warn("cache.SetJSON write failed", "key", key, "error", err)
		return fmt.Errorf("cache.SetJSON write %q: %w", key, err)
	}
	return nil
}

// Delete removes a single key. Errors are returned so callers decide how to handle them.
func (r *RedisCache) Delete(ctx context.Context, key string) error {
	if err := r.client.Del(ctx, key).Err(); err != nil {
		return fmt.Errorf("cache.Delete %q: %w", key, err)
	}
	return nil
}

// DeletePattern removes all keys matching pattern using SCAN (never KEYS).
// Errors are returned so callers decide how to handle them.
func (r *RedisCache) DeletePattern(ctx context.Context, pattern string) error {
	var cursor uint64
	for {
		keys, next, err := r.client.Scan(ctx, cursor, pattern, 100).Result()
		if err != nil {
			return fmt.Errorf("cache.DeletePattern scan %q: %w", pattern, err)
		}
		if len(keys) > 0 {
			if err := r.client.Del(ctx, keys...).Err(); err != nil {
				return fmt.Errorf("cache.DeletePattern del %q: %w", pattern, err)
			}
		}
		cursor = next
		if cursor == 0 {
			break
		}
	}
	return nil
}
