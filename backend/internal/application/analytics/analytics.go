package analytics

import (
	"context"
	"fmt"
	"math"
	"time"

	"job-tracker/internal/domain/repository"
	"job-tracker/pkg/clock"
)

const defaultAvgResponseDays = 5.2

// AnalyticsExecutor is the interface satisfied by GetAnalyticsUseCase and its cache decorator.
type AnalyticsExecutor interface {
	GetWeekly(ctx context.Context, userID int64) (*WeeklyAnalytics, error)
	GetFunnel(ctx context.Context, userID int64) ([]FunnelData, error)
	GetSources(ctx context.Context, userID int64) ([]SourceData, error)
	GetMetrics(ctx context.Context, userID int64) (*KeyMetrics, error)
}

// GetAnalyticsUseCase handles all analytics queries.
// It contains ZERO cache logic — caching is applied by the infrastructure decorator.
type GetAnalyticsUseCase struct {
	repo  repository.AnalyticsRepository
	clock clock.Clock
}

// NewGetAnalyticsUseCase constructs the analytics use case.
func NewGetAnalyticsUseCase(repo repository.AnalyticsRepository, clk clock.Clock) *GetAnalyticsUseCase {
	return &GetAnalyticsUseCase{repo: repo, clock: clk}
}

// GetWeekly returns application counts for each of the last 6 weeks plus a trend.
func (uc *GetAnalyticsUseCase) GetWeekly(ctx context.Context, userID int64) (*WeeklyAnalytics, error) {
	const numWeeks = 6
	now := uc.clock.Now().UTC()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	// Start from the Monday of the week 6 weeks ago.
	from := truncToMonday(today.AddDate(0, 0, -(numWeeks-1)*7))

	rows, err := uc.repo.GetWeeklyApplications(ctx, userID, from, numWeeks)
	if err != nil {
		return nil, err
	}

	rowMap := make(map[time.Time]int64, len(rows))
	for _, r := range rows {
		rowMap[r.WeekStart] = r.Count
	}

	weeks := make([]WeeklyData, numWeeks)
	var firstHalf, secondHalf int64
	for i := range numWeeks {
		weekStart := from.AddDate(0, 0, i*7)
		count := rowMap[weekStart]
		weeks[i] = WeeklyData{
			Week:         fmt.Sprintf("Week %d", i+1),
			Applications: count,
			StartDate:    weekStart.Format("2006-01-02"),
		}
		if i < numWeeks/2 {
			firstHalf += count
		} else {
			secondHalf += count
		}
	}

	return &WeeklyAnalytics{
		Data:  weeks,
		Trend: computeTrend(secondHalf, firstHalf),
	}, nil
}

// GetFunnel returns the Applied → Interview → Offer conversion funnel.
func (uc *GetAnalyticsUseCase) GetFunnel(ctx context.Context, userID int64) ([]FunnelData, error) {
	counts, err := uc.repo.CountByStatus(ctx, userID)
	if err != nil {
		return nil, err
	}
	m := toMap(counts)
	applied := m["Applied"]
	interview := m["Interview"]
	offer := m["Offer"]

	return []FunnelData{
		{Name: "Applied", Value: applied, Rate: ratePercent(applied, applied)},
		{Name: "Interview", Value: interview, Rate: ratePercent(interview, applied)},
		{Name: "Offer", Value: offer, Rate: ratePercent(offer, applied)},
	}, nil
}

// GetSources returns application counts and percentages grouped by source.
func (uc *GetAnalyticsUseCase) GetSources(ctx context.Context, userID int64) ([]SourceData, error) {
	rows, err := uc.repo.GetSourceBreakdown(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Ensure all canonical sources appear, even with zero count.
	order := []string{"LinkedIn", "Company Site", "Referral", "Indeed", "Glassdoor", "Other"}
	rowMap := make(map[string]int64, len(rows))
	var total int64
	for _, r := range rows {
		rowMap[r.Source] = r.Count
		total += r.Count
	}

	data := make([]SourceData, len(order))
	for i, src := range order {
		count := rowMap[src]
		data[i] = SourceData{
			Source:     src,
			Count:      count,
			Percentage: ratePercent(count, total),
		}
	}
	return data, nil
}

// GetMetrics returns aggregated rate metrics for the authenticated user.
func (uc *GetAnalyticsUseCase) GetMetrics(ctx context.Context, userID int64) (*KeyMetrics, error) {
	counts, err := uc.repo.CountByStatus(ctx, userID)
	if err != nil {
		return nil, err
	}
	m := toMap(counts)
	var total int64
	for _, v := range m {
		total += v
	}

	avgDays, err := uc.repo.GetAvgResponseDays(ctx, userID)
	if err != nil {
		return nil, err
	}
	if avgDays < 0 {
		avgDays = defaultAvgResponseDays
	}

	return &KeyMetrics{
		InterviewRate:   ratePercent(m["Interview"], total),
		OfferRate:       ratePercent(m["Offer"], total),
		RejectionRate:   ratePercent(m["Rejected"], total),
		AvgResponseDays: math.Round(avgDays*10) / 10,
	}, nil
}

// truncToMonday normalises t to the Monday of its ISO week (matching Postgres DATE_TRUNC('week',...)).
func truncToMonday(t time.Time) time.Time {
	weekday := int(t.Weekday())
	if weekday == 0 { // Sunday → 7 in ISO
		weekday = 7
	}
	return t.AddDate(0, 0, -(weekday - 1))
}

// ratePercent computes part/total*100 rounded to 1 decimal place, returning 0 when total=0.
func ratePercent(part, total int64) float64 {
	if total == 0 {
		return 0
	}
	return math.Round(float64(part)/float64(total)*1000) / 10
}
