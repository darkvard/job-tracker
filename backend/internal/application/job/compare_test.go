package job_test

import (
	"context"
	"testing"

	"job-tracker/internal/application/job"
	domainerrors "job-tracker/internal/domain/errors"
	"job-tracker/mocks"
)

func TestCompareUseCase_Execute_Success(t *testing.T) {
	ctx := context.Background()
	repo := mocks.NewMockApplicationRepository(t)

	app1 := validApp(1, 10)
	app2 := validApp(2, 10)
	repo.On("FindByID", ctx, int64(1)).Return(app1, nil)
	repo.On("FindByID", ctx, int64(2)).Return(app2, nil)

	uc := job.NewCompareUseCase(repo)
	results, err := uc.Execute(ctx, job.CompareRequest{UserID: 10, IDs: []int64{1, 2}})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(results) != 2 {
		t.Fatalf("expected 2 results, got %d", len(results))
	}
}

func TestCompareUseCase_Execute_TooFewIDs(t *testing.T) {
	ctx := context.Background()
	repo := mocks.NewMockApplicationRepository(t)

	uc := job.NewCompareUseCase(repo)
	_, err := uc.Execute(ctx, job.CompareRequest{UserID: 10, IDs: []int64{1}})
	if err == nil {
		t.Fatal("expected error for < 2 IDs")
	}
	de, ok := err.(*domainerrors.DomainError)
	if !ok || de.Code != domainerrors.ErrCodeInvalidInput {
		t.Errorf("expected INVALID_INPUT, got %v", err)
	}
}

func TestCompareUseCase_Execute_TooManyIDs(t *testing.T) {
	ctx := context.Background()
	repo := mocks.NewMockApplicationRepository(t)

	uc := job.NewCompareUseCase(repo)
	_, err := uc.Execute(ctx, job.CompareRequest{UserID: 10, IDs: []int64{1, 2, 3, 4, 5, 6}})
	if err == nil {
		t.Fatal("expected error for > 5 IDs")
	}
	de, ok := err.(*domainerrors.DomainError)
	if !ok || de.Code != domainerrors.ErrCodeInvalidInput {
		t.Errorf("expected INVALID_INPUT, got %v", err)
	}
}

func TestCompareUseCase_Execute_WrongOwner(t *testing.T) {
	ctx := context.Background()
	repo := mocks.NewMockApplicationRepository(t)

	app1 := validApp(1, 10)
	appOther := validApp(2, 99) // belongs to different user
	repo.On("FindByID", ctx, int64(1)).Return(app1, nil)
	repo.On("FindByID", ctx, int64(2)).Return(appOther, nil)

	uc := job.NewCompareUseCase(repo)
	_, err := uc.Execute(ctx, job.CompareRequest{UserID: 10, IDs: []int64{1, 2}})
	if err == nil {
		t.Fatal("expected unauthorized error")
	}
	de, ok := err.(*domainerrors.DomainError)
	if !ok || de.Code != domainerrors.ErrCodeUnauthorized {
		t.Errorf("expected UNAUTHORIZED, got %v", err)
	}
}
