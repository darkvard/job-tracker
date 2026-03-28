package auth

import (
	"context"
	"errors"

	"job-tracker/internal/application/port"
	domainerrors "job-tracker/internal/domain/errors"
	"job-tracker/internal/domain/repository"
)

// LoginUseCase handles user authentication.
type LoginUseCase struct {
	userRepo repository.UserRepository
	hasher   port.PasswordHasher
	tokens   port.TokenService
}

// NewLoginUseCase constructs a LoginUseCase with its dependencies.
func NewLoginUseCase(
	userRepo repository.UserRepository,
	hasher port.PasswordHasher,
	tokens port.TokenService,
) *LoginUseCase {
	return &LoginUseCase{userRepo: userRepo, hasher: hasher, tokens: tokens}
}

// Execute authenticates a user and returns a token + user info.
func (uc *LoginUseCase) Execute(ctx context.Context, req LoginRequest) (*AuthResponse, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

	user, err := uc.userRepo.FindByEmail(ctx, req.Email)
	if err != nil {
		// Mask not-found as unauthorized to avoid user enumeration.
		var de *domainerrors.DomainError
		if errors.As(err, &de) && de.Code == domainerrors.ErrCodeNotFound {
			return nil, domainerrors.Unauthorized("User", "invalid credentials")
		}
		return nil, err
	}

	if err := uc.hasher.Compare(user.PasswordHash, req.Password); err != nil {
		return nil, domainerrors.Unauthorized("User", "invalid credentials")
	}

	token, err := uc.tokens.Generate(user.ID, user.Email)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		Token: token,
		User: UserInfo{
			ID:        user.ID,
			Email:     user.Email,
			Name:      user.Name,
			CreatedAt: user.CreatedAt,
		},
	}, nil
}
