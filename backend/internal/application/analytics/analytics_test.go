package analytics_test

import (
	"context"
	"testing"
	"time"

	"job-tracker/internal/application/analytics"
	"job-tracker/internal/domain/repository"
	"job-tracker/mocks"
	"job-tracker/pkg/clock"
)

func TestGetAnalyticsUseCase_GetFunnel(t *testing.T) {
	ctx := context.Background()
	repo := mocks.NewMockAnalyticsRepository(t)

	repo.On("CountByStatus", ctx, int64(1)).Return([]repository.StatusCount{
		{Status: "Applied", Count: 8},
		{Status: "Interview", Count: 3},
		{Status: "Offer", Count: 1},
		{Status: "Rejected", Count: 1},
	}, nil)

	uc := analytics.NewGetAnalyticsUseCase(repo, clock.MockClock{Fixed: time.Now()})
	result, err := uc.GetFunnel(ctx, 1)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(result) != 3 {
		t.Fatalf("expected 3 funnel stages, got %d", len(result))
	}
	if result[0].Name != "Applied" || result[0].Value != 8 || result[0].Rate != 100.0 {
		t.Errorf("unexpected Applied stage: %+v", result[0])
	}
	if result[1].Name != "Interview" || result[1].Value != 3 {
		t.Errorf("unexpected Interview stage: %+v", result[1])
	}
	if result[2].Name != "Offer" || result[2].Value != 1 {
		t.Errorf("unexpected Offer stage: %+v", result[2])
	}
}

func TestGetAnalyticsUseCase_GetFunnel_Empty(t *testing.T) {
	ctx := context.Background()
	repo := mocks.NewMockAnalyticsRepository(t)

	repo.On("CountByStatus", ctx, int64(1)).Return([]repository.StatusCount{}, nil)

	uc := analytics.NewGetAnalyticsUseCase(repo, clock.MockClock{Fixed: time.Now()})
	result, err := uc.GetFunnel(ctx, 1)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(result) != 3 {
		t.Fatalf("expected 3 funnel stages, got %d", len(result))
	}
	for _, stage := range result {
		if stage.Value != 0 || stage.Rate != 0.0 {
			t.Errorf("expected empty stage to have 0 count and 0 rate, got %+v", stage)
		}
	}
}

func TestGetAnalyticsUseCase_GetSources(t *testing.T) {
	ctx := context.Background()
	repo := mocks.NewMockAnalyticsRepository(t)

	repo.On("GetSourceBreakdown", ctx, int64(1)).Return([]repository.SourceBreakdownRow{
		{Source: "LinkedIn", Count: 4},
		{Source: "Referral", Count: 2},
		{Source: "Other", Count: 2},
	}, nil)

	uc := analytics.NewGetAnalyticsUseCase(repo, clock.MockClock{Fixed: time.Now()})
	result, err := uc.GetSources(ctx, 1)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	// All 6 canonical sources must appear.
	if len(result) != 6 {
		t.Fatalf("expected 6 source entries, got %d", len(result))
	}
	// LinkedIn: 4/8 = 50%
	if result[0].Source != "LinkedIn" || result[0].Count != 4 || result[0].Percentage != 50.0 {
		t.Errorf("unexpected LinkedIn source data: %+v", result[0])
	}
	// Company Site: 0/8 = 0%
	if result[1].Source != "Company Site" || result[1].Count != 0 || result[1].Percentage != 0.0 {
		t.Errorf("unexpected Company Site source data: %+v", result[1])
	}
}

func TestGetAnalyticsUseCase_GetMetrics(t *testing.T) {
	ctx := context.Background()
	repo := mocks.NewMockAnalyticsRepository(t)
	avgDays := 4.5

	repo.On("CountByStatus", ctx, int64(1)).Return([]repository.StatusCount{
		{Status: "Applied", Count: 8},
		{Status: "Interview", Count: 3},
		{Status: "Offer", Count: 1},
		{Status: "Rejected", Count: 1},
	}, nil)
	repo.On("GetAvgResponseDays", ctx, int64(1)).Return(avgDays, nil)

	uc := analytics.NewGetAnalyticsUseCase(repo, clock.MockClock{Fixed: time.Now()})
	result, err := uc.GetMetrics(ctx, 1)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	// total = 13; interview = 3; offer = 1; rejected = 1
	expectedInterviewRate := 23.1 // 3/13 * 100 rounded to 1 decimal
	if result.InterviewRate != expectedInterviewRate {
		t.Errorf("expected interview rate %.1f, got %.1f", expectedInterviewRate, result.InterviewRate)
	}
	if result.AvgResponseDays != 4.5 {
		t.Errorf("expected avg response days 4.5, got %.1f", result.AvgResponseDays)
	}
}

func TestGetAnalyticsUseCase_GetMetrics_NoData_DefaultAvgDays(t *testing.T) {
	ctx := context.Background()
	repo := mocks.NewMockAnalyticsRepository(t)

	repo.On("CountByStatus", ctx, int64(1)).Return([]repository.StatusCount{}, nil)
	repo.On("GetAvgResponseDays", ctx, int64(1)).Return(-1.0, nil)

	uc := analytics.NewGetAnalyticsUseCase(repo, clock.MockClock{Fixed: time.Now()})
	result, err := uc.GetMetrics(ctx, 1)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.AvgResponseDays != 5.2 {
		t.Errorf("expected default avg response days 5.2, got %.1f", result.AvgResponseDays)
	}
	if result.InterviewRate != 0 || result.OfferRate != 0 || result.RejectionRate != 0 {
		t.Errorf("expected all rates to be 0 with empty data, got %+v", result)
	}
}

func TestGetAnalyticsUseCase_GetWeekly(t *testing.T) {
	ctx := context.Background()
	repo := mocks.NewMockAnalyticsRepository(t)

	fixedNow := time.Date(2026, 3, 29, 12, 0, 0, 0, time.UTC)
	// Monday 6 weeks back from week of 2026-03-29 (which is a Sunday, so Monday is 2026-03-23)
	// truncToMonday(2026-03-23 - 5*7 days) = truncToMonday(2026-02-16) = 2026-02-16 (Monday)
	from := time.Date(2026, 2, 16, 0, 0, 0, 0, time.UTC)

	repo.On("GetWeeklyApplications", ctx, int64(1), from, 6).Return([]repository.WeeklyAppRow{
		{WeekStart: time.Date(2026, 2, 16, 0, 0, 0, 0, time.UTC), Count: 3},
		{WeekStart: time.Date(2026, 3, 9, 0, 0, 0, 0, time.UTC), Count: 5},
	}, nil)

	uc := analytics.NewGetAnalyticsUseCase(repo, clock.MockClock{Fixed: fixedNow})
	result, err := uc.GetWeekly(ctx, 1)

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(result.Data) != 6 {
		t.Fatalf("expected 6 weekly data points, got %d", len(result.Data))
	}
	if result.Data[0].Week != "Week 1" {
		t.Errorf("expected first week label 'Week 1', got %s", result.Data[0].Week)
	}
	// Week 1 has 3 apps
	if result.Data[0].Applications != 3 {
		t.Errorf("expected week 1 applications 3, got %d", result.Data[0].Applications)
	}
}
