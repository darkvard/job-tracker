package entity

import "job-tracker/internal/domain/valueobject"

// ComparisonScore holds computed scoring fields for a job application.
type ComparisonScore struct {
	TotalComp     int64
	BenefitsScore int
	OverallScore  float64
}

// ApplicationWithScore pairs an Application with its computed ComparisonScore.
type ApplicationWithScore struct {
	Application *Application
	Score       ComparisonScore
}

// ComputeScore derives a ComparisonScore from the application's compensation fields.
//
// Formula:
//
//	TotalComp     = salary + lunchAllowance*12 + bonusAnnual - salary*(bhxh+bhyt)/100
//	BenefitsScore = noSaturday(+2) + noForcedOT(+2) + Remote(+2)/Hybrid(+1)
//	OverallScore  = TotalComp/1_000_000*0.7 + BenefitsScore*0.3  (normalised 0–100)
func (a *Application) ComputeScore() ComparisonScore {
	var totalComp int64
	if a.Salary != nil {
		salary := *a.Salary
		var bhxh, bhyt float64
		if a.BHXHPct != nil {
			bhxh = *a.BHXHPct
		}
		if a.BHYTPct != nil {
			bhyt = *a.BHYTPct
		}
		var lunch, bonus int64
		if a.LunchAllowance != nil {
			lunch = *a.LunchAllowance
		}
		if a.BonusAnnual != nil {
			bonus = *a.BonusAnnual
		}
		deductions := int64(float64(salary) * (bhxh + bhyt) / 100)
		totalComp = salary + lunch*12 + bonus - deductions
	}

	benefits := 0
	if a.NoSaturday {
		benefits += 2
	}
	if a.NoForcedOT {
		benefits += 2
	}
	switch a.WorkType {
	case valueobject.WorkTypeRemote:
		benefits += 2
	case valueobject.WorkTypeHybrid:
		benefits += 1
	}

	overall := float64(totalComp)/1_000_000*0.7 + float64(benefits)*0.3

	return ComparisonScore{
		TotalComp:     totalComp,
		BenefitsScore: benefits,
		OverallScore:  overall,
	}
}
