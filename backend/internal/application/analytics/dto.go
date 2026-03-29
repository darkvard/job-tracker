// Package analytics contains use cases and DTOs for dashboard and analytics features.
package analytics

// TrendValue represents a percentage change with direction indicator.
type TrendValue struct {
	Value      float64 `json:"value"`
	IsPositive bool    `json:"isPositive"`
}

// DashboardTrends holds trend percentages vs the previous calendar month.
type DashboardTrends struct {
	Total     TrendValue `json:"total"`
	Interview TrendValue `json:"interview"`
	Offer     TrendValue `json:"offer"`
	Rejected  TrendValue `json:"rejected"`
}

// StatusBreakdownItem is one slice of the status distribution for charting.
type StatusBreakdownItem struct {
	Status string `json:"status"`
	Count  int64  `json:"count"`
	Color  string `json:"color"`
}

// RecentJob is the abbreviated view of a job application used in the dashboard table.
type RecentJob struct {
	ID          int64  `json:"id"`
	Company     string `json:"company"`
	Role        string `json:"role"`
	Status      string `json:"status"`
	DateApplied string `json:"dateApplied"`
}

// WeeklyData is one data point in the weekly applications bar chart.
type WeeklyData struct {
	Week         string `json:"week"`
	Applications int64  `json:"applications"`
	StartDate    string `json:"startDate"`
}

// WeeklyAnalytics is the response DTO for GET /analytics/weekly.
type WeeklyAnalytics struct {
	Data  []WeeklyData `json:"data"`
	Trend TrendValue   `json:"trend"`
}

// FunnelData is one stage in the interview conversion funnel.
type FunnelData struct {
	Name  string  `json:"name"`
	Value int64   `json:"value"`
	Rate  float64 `json:"rate"`
}

// SourceData is the count and percentage for a single application source.
type SourceData struct {
	Source     string  `json:"source"`
	Count      int64   `json:"count"`
	Percentage float64 `json:"percentage"`
}

// KeyMetrics holds aggregated rate metrics for GET /analytics/metrics.
type KeyMetrics struct {
	InterviewRate   float64 `json:"interviewRate"`
	OfferRate       float64 `json:"offerRate"`
	RejectionRate   float64 `json:"rejectionRate"`
	AvgResponseDays float64 `json:"avgResponseDays"`
}

// DashboardKPIs is the full response DTO for GET /dashboard/kpis.
type DashboardKPIs struct {
	Total           int64                 `json:"total"`
	Applied         int64                 `json:"applied"`
	Interview       int64                 `json:"interview"`
	Offer           int64                 `json:"offer"`
	Rejected        int64                 `json:"rejected"`
	Trends          DashboardTrends       `json:"trends"`
	StatusBreakdown []StatusBreakdownItem `json:"statusBreakdown"`
	RecentJobs      []RecentJob           `json:"recentJobs"`
}
