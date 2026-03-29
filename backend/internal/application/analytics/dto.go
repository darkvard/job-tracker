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
