# Skill: Go Implementation Patterns

## db(ctx) — transaction detection (every repo MUST have this)
```go
func (r *appRepo) db(ctx context.Context) *gorm.DB {
    if tx := ctxkey.GetTx(ctx); tx != nil { return tx }
    return r.gdb.WithContext(ctx)
}
```

## TxManager — multi-table atomic operation
```go
// use case: clean, no GORM
func (uc *UpdateStatusUseCase) Execute(ctx context.Context, req UpdateStatusRequest) (*JobResponse, error) {
    var result *entity.Application
    err := uc.tx.WithTransaction(ctx, func(ctx context.Context) error {
        app, err := uc.repo.FindByID(ctx, req.ID)
        if err != nil { return err }
        if app.UserID != req.UserID { return domainerrors.Unauthorized("Application", "not owner") }
        if err := app.TransitionStatus(req.NewStatus); err != nil { return err }
        if err := uc.repo.UpdateWithHistory(ctx, app, req.Note); err != nil { return err }
        result = app
        return nil
    })
    if err != nil { return nil, err }
    return JobResponseFromEntity(result), nil
}
```

## UpdateWithHistory — repo (both writes share same tx via db(ctx))
```go
func (r *appRepo) UpdateWithHistory(ctx context.Context, app *entity.Application, note string) error {
    if err := r.db(ctx).Save(fromEntity(app)).Error; err != nil {
        return fmt.Errorf("appRepo.UpdateWithHistory: %w", err)
    }
    hist := &models.StatusHistoryModel{
        ApplicationID: app.ID, FromStatus: app.PreviousStatus.String(),
        ToStatus: app.Status.String(), Note: note, ChangedAt: time.Now(),
    }
    if err := r.db(ctx).Create(hist).Error; err != nil {
        return fmt.Errorf("appRepo.UpdateWithHistory hist: %w", err)
    }
    return nil
}
```

## Cache — read decorator + write invalidator
```go
// Read: decorator only does GET/SET, never DELETE
func (c *cachedDashboard) Execute(ctx context.Context, userID int64) (*dto.DashboardKPIs, error) {
    key := fmt.Sprintf("dashboard:%d", userID)
    var cached dto.DashboardKPIs
    if err := c.rdb.GetJSON(ctx, key, &cached); err == nil { return &cached, nil }
    result, err := c.inner.Execute(ctx, userID)
    if err != nil { return nil, err }
    c.rdb.SetJSON(ctx, key, result, c.ttl)
    return result, nil
}

// Write: invalidator in handler (infrastructure) — fire-and-forget
func (i *JobCacheInvalidator) InvalidateUser(ctx context.Context, userID int64) {
    _ = i.rdb.Delete(ctx, fmt.Sprintf("dashboard:%d", userID))
    _ = i.rdb.DeletePattern(ctx, fmt.Sprintf("analytics:*:%d", userID))
}
// Call after: Create ✓  Update ✓  UpdateStatus ✓  Delete ✓
```
