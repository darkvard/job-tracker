package entity_test

import (
	"testing"
	"time"

	"job-tracker/internal/domain/entity"
	"job-tracker/internal/domain/valueobject"
)

func int64Ptr(v int64) *int64       { return &v }
func float64Ptr(v float64) *float64 { return &v }

func TestComputeScore_AllFields(t *testing.T) {
	app := &entity.Application{
		UserID:         1,
		Company:        "Acme",
		Role:           "SDE",
		Status:         valueobject.StatusApplied,
		Source:         valueobject.SourceLinkedIn,
		DateApplied:    time.Now(),
		Salary:         int64Ptr(20_000_000),
		BHXHPct:        float64Ptr(8),
		BHYTPct:        float64Ptr(1.5),
		LunchAllowance: int64Ptr(500_000),
		BonusAnnual:    int64Ptr(5_000_000),
		NoSaturday:     true,
		NoForcedOT:     true,
		WorkType:       valueobject.WorkTypeRemote,
	}

	score := app.ComputeScore()

	// TotalComp = 20M + 500K*12 + 5M - 20M*9.5/100 = 20M + 6M + 5M - 1.9M = 29.1M
	expectedTC := 20_000_000 + 500_000*12 + 5_000_000 - int64(float64(20_000_000)*9.5/100)
	if score.TotalComp != expectedTC {
		t.Errorf("TotalComp: want %d, got %d", expectedTC, score.TotalComp)
	}

	// BenefitsScore = 2 + 2 + 2 = 6
	if score.BenefitsScore != 6 {
		t.Errorf("BenefitsScore: want 6, got %d", score.BenefitsScore)
	}

	if score.OverallScore <= 0 {
		t.Errorf("OverallScore should be positive, got %f", score.OverallScore)
	}
}

func TestComputeScore_NoSalary(t *testing.T) {
	app := &entity.Application{
		UserID:      1,
		Company:     "Startup",
		Role:        "Dev",
		Status:      valueobject.StatusApplied,
		Source:      valueobject.SourceLinkedIn,
		DateApplied: time.Now(),
		NoSaturday:  true,
		WorkType:    valueobject.WorkTypeHybrid,
	}

	score := app.ComputeScore()

	if score.TotalComp != 0 {
		t.Errorf("TotalComp should be 0 with no salary, got %d", score.TotalComp)
	}
	// BenefitsScore = 2 + 1 = 3
	if score.BenefitsScore != 3 {
		t.Errorf("BenefitsScore: want 3, got %d", score.BenefitsScore)
	}
}
