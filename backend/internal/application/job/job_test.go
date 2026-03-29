package job_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/stretchr/testify/mock"

	"job-tracker/internal/application/job"
	"job-tracker/internal/domain/entity"
	domainerrors "job-tracker/internal/domain/errors"
	"job-tracker/internal/domain/valueobject"
	"job-tracker/mocks"
)

func validApp(id, userID int64) *entity.Application {
	return &entity.Application{
		ID:          id,
		UserID:      userID,
		Company:     "Google",
		Role:        "SDE",
		Status:      valueobject.StatusApplied,
		Source:      valueobject.SourceLinkedIn,
		DateApplied: time.Date(2026, 3, 28, 0, 0, 0, 0, time.UTC),
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
}

// ── CreateUseCase ─────────────────────────────────────────────────────────────

func TestCreateUseCase_Execute_Success(t *testing.T) {
	ctx := context.Background()
	repo := mocks.NewMockApplicationRepository(t)

	appEntity := validApp(1, 10)
	repo.On("Create", ctx, mock.MatchedBy(func(a *entity.Application) bool {
		return a.Company == "Google" && a.UserID == int64(10)
	})).Return(appEntity, nil)

	uc := job.NewCreateUseCase(repo)
	resp, err := uc.Execute(ctx, job.CreateRequest{
		UserID:      10,
		Company:     "Google",
		Role:        "SDE",
		Status:      "Applied",
		DateApplied: "2026-03-28",
		Source:      "LinkedIn",
	})

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.Company != "Google" {
		t.Errorf("expected company Google, got %s", resp.Company)
	}
}

func TestCreateUseCase_Execute_InvalidInput(t *testing.T) {
	uc := job.NewCreateUseCase(nil)

	cases := []job.CreateRequest{
		{UserID: 1, Company: "", Role: "SDE", Status: "Applied", DateApplied: "2026-03-28", Source: "LinkedIn"},
		{UserID: 1, Company: "Google", Role: "", Status: "Applied", DateApplied: "2026-03-28", Source: "LinkedIn"},
		{UserID: 1, Company: "Google", Role: "SDE", Status: "Bad", DateApplied: "2026-03-28", Source: "LinkedIn"},
		{UserID: 1, Company: "Google", Role: "SDE", Status: "Applied", DateApplied: "bad-date", Source: "LinkedIn"},
		{UserID: 1, Company: "Google", Role: "SDE", Status: "Applied", DateApplied: "2026-03-28", Source: "BadSource"},
	}

	for _, req := range cases {
		_, err := uc.Execute(context.Background(), req)
		if err == nil {
			t.Errorf("expected error for %+v", req)
			continue
		}
		var de *domainerrors.DomainError
		if !errors.As(err, &de) || de.Code != domainerrors.ErrCodeInvalidInput {
			t.Errorf("expected INVALID_INPUT, got %v", err)
		}
	}
}

// ── GetUseCase ────────────────────────────────────────────────────────────────

func TestGetUseCase_Execute_Success(t *testing.T) {
	ctx := context.Background()
	repo := mocks.NewMockApplicationRepository(t)

	repo.On("FindByID", ctx, int64(1)).Return(validApp(1, 10), nil)

	uc := job.NewGetUseCase(repo)
	resp, err := uc.Execute(ctx, 1, 10)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.ID != 1 {
		t.Errorf("expected ID 1, got %d", resp.ID)
	}
}

func TestGetUseCase_Execute_WrongUser(t *testing.T) {
	ctx := context.Background()
	repo := mocks.NewMockApplicationRepository(t)

	repo.On("FindByID", ctx, int64(1)).Return(validApp(1, 10), nil)

	uc := job.NewGetUseCase(repo)
	_, err := uc.Execute(ctx, 1, 99)

	var de *domainerrors.DomainError
	if !errors.As(err, &de) || de.Code != domainerrors.ErrCodeUnauthorized {
		t.Errorf("expected UNAUTHORIZED, got %v", err)
	}
}

func TestGetUseCase_Execute_NotFound(t *testing.T) {
	ctx := context.Background()
	repo := mocks.NewMockApplicationRepository(t)

	notFound := domainerrors.NotFound("Application", "not found")
	repo.On("FindByID", ctx, int64(99)).Return((*entity.Application)(nil), notFound)

	uc := job.NewGetUseCase(repo)
	_, err := uc.Execute(ctx, 99, 10)

	var de *domainerrors.DomainError
	if !errors.As(err, &de) || de.Code != domainerrors.ErrCodeNotFound {
		t.Errorf("expected NOT_FOUND, got %v", err)
	}
}

// ── DeleteUseCase ─────────────────────────────────────────────────────────────

func TestDeleteUseCase_Execute_Success(t *testing.T) {
	ctx := context.Background()
	repo := mocks.NewMockApplicationRepository(t)

	repo.On("FindByID", ctx, int64(1)).Return(validApp(1, 10), nil)
	repo.On("Delete", ctx, int64(1)).Return(nil)

	uc := job.NewDeleteUseCase(repo)
	if err := uc.Execute(ctx, 1, 10); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestDeleteUseCase_Execute_WrongUser(t *testing.T) {
	ctx := context.Background()
	repo := mocks.NewMockApplicationRepository(t)

	repo.On("FindByID", ctx, int64(1)).Return(validApp(1, 10), nil)

	uc := job.NewDeleteUseCase(repo)
	err := uc.Execute(ctx, 1, 99)

	var de *domainerrors.DomainError
	if !errors.As(err, &de) || de.Code != domainerrors.ErrCodeUnauthorized {
		t.Errorf("expected UNAUTHORIZED, got %v", err)
	}
}

// ── UpdateUseCase ─────────────────────────────────────────────────────────────

func TestUpdateUseCase_Execute_Success(t *testing.T) {
	ctx := context.Background()
	repo := mocks.NewMockApplicationRepository(t)

	repo.On("FindByID", ctx, int64(1)).Return(validApp(1, 10), nil)
	repo.On("UpdateWithHistory", ctx, mock.Anything, "").Return(nil)

	uc := job.NewUpdateUseCase(repo)
	resp, err := uc.Execute(ctx, job.UpdateRequest{
		ID:          1,
		UserID:      10,
		Company:     "Meta",
		Role:        "Engineer",
		Status:      "Applied",
		DateApplied: "2026-03-28",
		Source:      "LinkedIn",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.Company != "Meta" {
		t.Errorf("expected Meta, got %s", resp.Company)
	}
}

func TestUpdateUseCase_Execute_WrongUser(t *testing.T) {
	ctx := context.Background()
	repo := mocks.NewMockApplicationRepository(t)

	repo.On("FindByID", ctx, int64(1)).Return(validApp(1, 10), nil)

	uc := job.NewUpdateUseCase(repo)
	_, err := uc.Execute(ctx, job.UpdateRequest{
		ID:          1,
		UserID:      99,
		Company:     "Meta",
		Role:        "Engineer",
		Status:      "Applied",
		DateApplied: "2026-03-28",
		Source:      "LinkedIn",
	})

	var de *domainerrors.DomainError
	if !errors.As(err, &de) || de.Code != domainerrors.ErrCodeUnauthorized {
		t.Errorf("expected UNAUTHORIZED, got %v", err)
	}
}

// ── UpdateStatusUseCase ───────────────────────────────────────────────────────

func TestUpdateStatusUseCase_Execute_Success(t *testing.T) {
	ctx := context.Background()
	repo := mocks.NewMockApplicationRepository(t)
	tx := mocks.NewMockTxManager(t)

	app := validApp(1, 10)

	tx.On("WithTransaction", ctx, mock.Anything).
		Run(func(args mock.Arguments) {
			fn := args.Get(1).(func(context.Context) error)
			_ = fn(ctx)
		}).
		Return(nil)

	repo.On("FindByID", ctx, int64(1)).Return(app, nil)
	repo.On("UpdateWithHistory", ctx, mock.Anything, "Phone screen").Return(nil)

	uc := job.NewUpdateStatusUseCase(repo, tx)
	resp, err := uc.Execute(ctx, job.UpdateStatusRequest{
		ID:     1,
		UserID: 10,
		Status: "Interview",
		Note:   "Phone screen",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.Status != "Interview" {
		t.Errorf("expected Interview, got %s", resp.Status)
	}
}

func TestUpdateStatusUseCase_Execute_InvalidTransition(t *testing.T) {
	ctx := context.Background()
	repo := mocks.NewMockApplicationRepository(t)
	tx := mocks.NewMockTxManager(t)

	// Offer → Interview is invalid
	app := validApp(1, 10)
	app.Status = valueobject.StatusOffer

	tx.On("WithTransaction", ctx, mock.Anything).
		Run(func(args mock.Arguments) {
			fn := args.Get(1).(func(context.Context) error)
			_ = fn(ctx)
		}).
		Return(domainerrors.InvalidStatus("cannot transition from Offer to Interview"))

	repo.On("FindByID", ctx, int64(1)).Return(app, nil)

	uc := job.NewUpdateStatusUseCase(repo, tx)
	_, err := uc.Execute(ctx, job.UpdateStatusRequest{
		ID:     1,
		UserID: 10,
		Status: "Interview",
	})

	var de *domainerrors.DomainError
	if !errors.As(err, &de) || de.Code != domainerrors.ErrCodeInvalidStatus {
		t.Errorf("expected INVALID_STATUS, got %v", err)
	}
}

func TestUpdateStatusUseCase_Execute_WrongUser(t *testing.T) {
	ctx := context.Background()
	repo := mocks.NewMockApplicationRepository(t)
	tx := mocks.NewMockTxManager(t)

	app := validApp(1, 10)

	tx.On("WithTransaction", ctx, mock.Anything).
		Run(func(args mock.Arguments) {
			fn := args.Get(1).(func(context.Context) error)
			_ = fn(ctx)
		}).
		Return(domainerrors.Unauthorized("Application", "not owner"))

	repo.On("FindByID", ctx, int64(1)).Return(app, nil)

	uc := job.NewUpdateStatusUseCase(repo, tx)
	_, err := uc.Execute(ctx, job.UpdateStatusRequest{
		ID:     1,
		UserID: 99,
		Status: "Interview",
	})

	var de *domainerrors.DomainError
	if !errors.As(err, &de) || de.Code != domainerrors.ErrCodeUnauthorized {
		t.Errorf("expected UNAUTHORIZED, got %v", err)
	}
}

// ── ListUseCase ───────────────────────────────────────────────────────────────

func TestListUseCase_Execute_Success(t *testing.T) {
	ctx := context.Background()
	repo := mocks.NewMockApplicationRepository(t)

	apps := []entity.Application{*validApp(1, 10), *validApp(2, 10)}
	repo.On("List", ctx, int64(10), mock.Anything, mock.Anything).Return(apps, int64(2), nil)

	uc := job.NewListUseCase(repo)
	resp, err := uc.Execute(ctx, 10, job.ListFilters{Page: 1, PageSize: 20})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(resp.Items) != 2 {
		t.Errorf("expected 2 items, got %d", len(resp.Items))
	}
	if resp.Total != 2 {
		t.Errorf("expected total 2, got %d", resp.Total)
	}
}

func TestListUseCase_Execute_InvalidStatus(t *testing.T) {
	uc := job.NewListUseCase(nil)
	_, err := uc.Execute(context.Background(), 10, job.ListFilters{Status: "BadStatus"})

	var de *domainerrors.DomainError
	if !errors.As(err, &de) || de.Code != domainerrors.ErrCodeInvalidInput {
		t.Errorf("expected INVALID_INPUT, got %v", err)
	}
}
