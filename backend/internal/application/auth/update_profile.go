package auth

import (
	"context"

	"job-tracker/internal/domain/repository"
)

// UpdateProfileUseCase handles updating a user's profile information.
type UpdateProfileUseCase struct {
	userRepo repository.UserRepository
}

// NewUpdateProfileUseCase constructs an UpdateProfileUseCase.
func NewUpdateProfileUseCase(userRepo repository.UserRepository) *UpdateProfileUseCase {
	return &UpdateProfileUseCase{userRepo: userRepo}
}

// Execute updates the profile of the given user and returns the updated UserInfo.
func (uc *UpdateProfileUseCase) Execute(ctx context.Context, userID int64, req UpdateProfileRequest) (*UserInfo, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

	user, err := uc.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	user.Name = req.Name
	user.CurrentLocation = req.CurrentLocation
	user.CurrentRole = req.CurrentRole
	user.CurrentCompany = req.CurrentCompany
	user.CurrentSalary = req.CurrentSalary
	user.SalaryCurrency = req.SalaryCurrency

	updated, err := uc.userRepo.Update(ctx, user)
	if err != nil {
		return nil, err
	}

	info := userInfoFromEntity(updated)
	return &info, nil
}
