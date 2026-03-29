package analytics

import (
	"context"
	"math"
	"time"

	"job-tracker/internal/domain/entity"
	"job-tracker/internal/domain/repository"
	"job-tracker/pkg/clock"
)

// DashboardExecutor is the interface satisfied by GetDashboardUseCase and its cache decorator.
type DashboardExecutor interface {
	Execute(ctx context.Context, userID int64) (*DashboardKPIs, error)
}

// GetDashboardUseCase queries the repository and computes dashboard KPIs.
// It contains ZERO cache logic — caching is applied by the infrastructure decorator.
type GetDashboardUseCase struct {
	repo  repository.DashboardRepository
	clock clock.Clock
}

// NewGetDashboardUseCase constructs the use case.
func NewGetDashboardUseCase(repo repository.DashboardRepository, clk clock.Clock) *GetDashboardUseCase {
	return &GetDashboardUseCase{repo: repo, clock: clk}
}

// Execute computes dashboard KPIs for the given user.
func (uc *GetDashboardUseCase) Execute(ctx context.Context, userID int64) (*DashboardKPIs, error) {
	now := uc.clock.Now().UTC()

	thisMonthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
	lastMonthStart := thisMonthStart.AddDate(0, -1, 0)
	tomorrow := now.AddDate(0, 0, 1)

	allTime, err := uc.repo.CountByStatus(ctx, userID)
	if err != nil {
		return nil, err
	}

	thisMonth, err := uc.repo.CountCreatedBetween(ctx, userID, thisMonthStart, tomorrow)
	if err != nil {
		return nil, err
	}

	lastMonth, err := uc.repo.CountCreatedBetween(ctx, userID, lastMonthStart, thisMonthStart)
	if err != nil {
		return nil, err
	}

	recent, err := uc.repo.ListRecent(ctx, userID, 5)
	if err != nil {
		return nil, err
	}

	return buildKPIs(allTime, thisMonth, lastMonth, recent), nil
}

// buildKPIs assembles the DashboardKPIs from raw repo data.
func buildKPIs(
	allTime, thisMonth, lastMonth []repository.StatusCount,
	recent []entity.Application,
) *DashboardKPIs {
	allTimeMap := toMap(allTime)
	thisMap := toMap(thisMonth)
	lastMap := toMap(lastMonth)

	applied := allTimeMap["Applied"]
	interview := allTimeMap["Interview"]
	offer := allTimeMap["Offer"]
	rejected := allTimeMap["Rejected"]
	total := applied + interview + offer + rejected

	thisTotal := sumMap(thisMap)
	lastTotal := sumMap(lastMap)

	kpis := &DashboardKPIs{
		Total:     total,
		Applied:   applied,
		Interview: interview,
		Offer:     offer,
		Rejected:  rejected,
		Trends: DashboardTrends{
			Total:     computeTrend(thisTotal, lastTotal),
			Interview: computeTrend(thisMap["Interview"], lastMap["Interview"]),
			Offer:     computeTrend(thisMap["Offer"], lastMap["Offer"]),
			Rejected:  computeTrend(thisMap["Rejected"], lastMap["Rejected"]),
		},
		StatusBreakdown: []StatusBreakdownItem{
			{Status: "Applied", Count: applied, Color: "#3b82f6"},
			{Status: "Interview", Count: interview, Color: "#f97316"},
			{Status: "Offer", Count: offer, Color: "#22c55e"},
			{Status: "Rejected", Count: rejected, Color: "#ef4444"},
		},
		RecentJobs: toRecentJobs(recent),
	}
	return kpis
}

func toMap(counts []repository.StatusCount) map[string]int64 {
	m := make(map[string]int64, len(counts))
	for _, c := range counts {
		m[c.Status] = c.Count
	}
	return m
}

func sumMap(m map[string]int64) int64 {
	var total int64
	for _, v := range m {
		total += v
	}
	return total
}

func computeTrend(current, previous int64) TrendValue {
	if previous == 0 {
		if current > 0 {
			return TrendValue{Value: 100, IsPositive: true}
		}
		return TrendValue{Value: 0, IsPositive: true}
	}
	change := float64(current-previous) / float64(previous) * 100
	return TrendValue{
		Value:      math.Round(math.Abs(change)),
		IsPositive: change >= 0,
	}
}

func toRecentJobs(apps []entity.Application) []RecentJob {
	jobs := make([]RecentJob, len(apps))
	for i, a := range apps {
		jobs[i] = RecentJob{
			ID:          a.ID,
			Company:     a.Company,
			Role:        a.Role,
			Status:      a.Status.String(),
			DateApplied: a.DateApplied.Format("2006-01-02"),
		}
	}
	return jobs
}
