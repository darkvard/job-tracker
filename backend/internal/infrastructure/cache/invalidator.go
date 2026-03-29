package cache

import (
	"context"
	"fmt"
)

// JobCacheInvalidator deletes cached data for a user after job mutations.
// All deletions are fire-and-forget: Redis failure must never fail an HTTP response.
type JobCacheInvalidator struct {
	rdb Cache
}

// NewJobCacheInvalidator returns a JobCacheInvalidator backed by the given cache.
func NewJobCacheInvalidator(rdb Cache) *JobCacheInvalidator {
	return &JobCacheInvalidator{rdb: rdb}
}

// InvalidateUser removes dashboard and all analytics cache entries for the given user.
// Call this after every successful Create, Update, UpdateStatus, or Delete.
func (i *JobCacheInvalidator) InvalidateUser(ctx context.Context, userID int64) {
	_ = i.rdb.Delete(ctx, fmt.Sprintf("dashboard:%d", userID))
	_ = i.rdb.DeletePattern(ctx, fmt.Sprintf("analytics:*:%d", userID))
}
