package auth

import "job-tracker/internal/domain/entity"

// userInfoFromEntity converts a domain User entity to a safe UserInfo DTO.
func userInfoFromEntity(u *entity.User) UserInfo {
	return UserInfo{
		ID:              u.ID,
		Email:           u.Email,
		Name:            u.Name,
		CreatedAt:       u.CreatedAt,
		CurrentLocation: u.CurrentLocation,
		CurrentRole:     u.CurrentRole,
		CurrentCompany:  u.CurrentCompany,
		CurrentSalary:   u.CurrentSalary,
		SalaryCurrency:  u.SalaryCurrency,
	}
}
