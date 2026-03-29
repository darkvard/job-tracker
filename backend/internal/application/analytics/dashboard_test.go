package analytics_test

import (
	"context"
	"testing"
	"time"

	"job-tracker/internal/application/analytics"
	"job-tracker/internal/domain/entity"
	"job-tracker/internal/domain/repository"
	"job-tracker/internal/domain/valueobject"
	"job-tracker/mocks"
	"job-tracker/pkg/clock"
)

func TestGetDashboardUseCase_Execute(t *testing.T) {
	ctx := context.Background()
	now := time.Date(2026, 3, 15, 12, 0, 0, 0, time.UTC)
	thisMonthStart := time.Date(2026, 3, 1, 0, 0, 0, 0, time.UTC)
	lastMonthStart := time.Date(2026, 2, 1, 0, 0, 0, 0, time.UTC)
	tomorrow := now.AddDate(0, 0, 1)

	repo := mocks.NewMockDashboardRepository(t)

	repo.On("CountByStatus", ctx, int64(1)).Return([]repository.StatusCount{
		{Status: "Applied", Count: 4},
		{Status: "Interview", Count: 3},
		{Status: "Offer", Count: 1},
		{Status: "Rejected", Count: 1},
	}, nil)

	repo.On("CountCreatedBetween", ctx, int64(1), thisMonthStart, tomorrow).
		Return([]repository.StatusCount{
			{Status: "Applied", Count: 3},
			{Status: "Interview", Count: 2},
		}, nil).Once()

	repo.On("CountCreatedBetween", ctx, int64(1), lastMonthStart, thisMonthStart).
		Return([]repository.StatusCount{
			{Status: "Applied", Count: 2},
			{Status: "Interview", Count: 1},
		}, nil).Once()

	recentApp := entity.Application{
		ID:          1,
		Company:     "Google",
		Role:        "SDE",
		Status:      valueobject.StatusInterview,
		DateApplied: time.Date(2026, 3, 10, 0, 0, 0, 0, time.UTC),
	}
	repo.On("ListRecent", ctx, int64(1), 5).Return([]entity.Application{recentApp}, nil)

	uc := analytics.NewGetDashboardUseCase(repo, clock.MockClock{Fixed: now})
	result, err := uc.Execute(ctx, 1)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.Total != 9 {
		t.Errorf("expected total 9, got %d", result.Total)
	}
	if result.Applied != 4 {
		t.Errorf("expected applied 4, got %d", result.Applied)
	}
	if result.Interview != 3 {
		t.Errorf("expected interview 3, got %d", result.Interview)
	}
	if result.Offer != 1 {
		t.Errorf("expected offer 1, got %d", result.Offer)
	}
	if result.Rejected != 1 {
		t.Errorf("expected rejected 1, got %d", result.Rejected)
	}
	if len(result.StatusBreakdown) != 4 {
		t.Errorf("expected 4 status breakdown items, got %d", len(result.StatusBreakdown))
	}
	if len(result.RecentJobs) != 1 {
		t.Errorf("expected 1 recent job, got %d", len(result.RecentJobs))
	}
	if result.RecentJobs[0].Company != "Google" {
		t.Errorf("expected recent job company Google, got %s", result.RecentJobs[0].Company)
	}
	// Verify trend for total: (5-3)/3*100 = 66.67% positive (this month=5, last month=3)
	if !result.Trends.Total.IsPositive {
		t.Error("expected total trend to be positive")
	}
	// Verify trend for interview: (2-1)/1*100 = 100% positive
	if !result.Trends.Interview.IsPositive {
		t.Error("expected interview trend to be positive")
	}
}

func TestGetDashboardUseCase_EmptyData(t *testing.T) {
	ctx := context.Background()
	now := time.Date(2026, 3, 15, 12, 0, 0, 0, time.UTC)
	thisMonthStart := time.Date(2026, 3, 1, 0, 0, 0, 0, time.UTC)
	lastMonthStart := time.Date(2026, 2, 1, 0, 0, 0, 0, time.UTC)
	tomorrow := now.AddDate(0, 0, 1)

	repo := mocks.NewMockDashboardRepository(t)
	repo.On("CountByStatus", ctx, int64(1)).Return([]repository.StatusCount{}, nil)
	repo.On("CountCreatedBetween", ctx, int64(1), thisMonthStart, tomorrow).
		Return([]repository.StatusCount{}, nil).Once()
	repo.On("CountCreatedBetween", ctx, int64(1), lastMonthStart, thisMonthStart).
		Return([]repository.StatusCount{}, nil).Once()
	repo.On("ListRecent", ctx, int64(1), 5).Return([]entity.Application{}, nil)

	uc := analytics.NewGetDashboardUseCase(repo, clock.MockClock{Fixed: now})
	result, err := uc.Execute(ctx, 1)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.Total != 0 {
		t.Errorf("expected total 0, got %d", result.Total)
	}
	if len(result.RecentJobs) != 0 {
		t.Errorf("expected no recent jobs, got %d", len(result.RecentJobs))
	}
}
