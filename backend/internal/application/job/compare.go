package job

import (
	"context"
	"strconv"

	domainerrors "job-tracker/internal/domain/errors"
	"job-tracker/internal/domain/repository"
)

// CompareRequest is the input for the compare use case.
type CompareRequest struct {
	UserID int64
	IDs    []int64
}

// Validate checks that IDs count is between 2 and 5.
func (r CompareRequest) Validate() error {
	if len(r.IDs) < 2 || len(r.IDs) > 5 {
		return domainerrors.InvalidInput("CompareRequest", "must provide between 2 and 5 job IDs")
	}
	return nil
}

// CompareResponse is a single job application enriched with its score.
type CompareResponse struct {
	*JobResponse
	TotalComp     int64   `json:"totalComp"`
	BenefitsScore int     `json:"benefitsScore"`
	OverallScore  float64 `json:"overallScore"`
}

// CompareUseCase computes comparison scores for a set of job applications.
type CompareUseCase struct {
	repo repository.ApplicationRepository
}

// NewCompareUseCase constructs a CompareUseCase.
func NewCompareUseCase(repo repository.ApplicationRepository) *CompareUseCase {
	return &CompareUseCase{repo: repo}
}

// Execute fetches the requested applications, verifies ownership, and returns scored results.
func (uc *CompareUseCase) Execute(ctx context.Context, req CompareRequest) ([]CompareResponse, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

	results := make([]CompareResponse, 0, len(req.IDs))
	for _, id := range req.IDs {
		app, err := uc.repo.FindByID(ctx, id)
		if err != nil {
			return nil, err
		}
		if app.UserID != req.UserID {
			return nil, domainerrors.Unauthorized("Application", "job "+strconv.FormatInt(id, 10)+" does not belong to user")
		}
		score := app.ComputeScore()
		results = append(results, CompareResponse{
			JobResponse:   FromEntity(app),
			TotalComp:     score.TotalComp,
			BenefitsScore: score.BenefitsScore,
			OverallScore:  score.OverallScore,
		})
	}
	return results, nil
}

