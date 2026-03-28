package auth

import (
	"context"

	"job-tracker/internal/application/port"
	"job-tracker/internal/domain/entity"
	domainerrors "job-tracker/internal/domain/errors"
	"job-tracker/internal/domain/repository"
)

// RegisterUseCase handles new user registration.
type RegisterUseCase struct {
	userRepo repository.UserRepository
	hasher   port.PasswordHasher
	tokens   port.TokenService
}

// NewRegisterUseCase constructs a RegisterUseCase with its dependencies.
func NewRegisterUseCase(
	userRepo repository.UserRepository,
	hasher port.PasswordHasher,
	tokens port.TokenService,
) *RegisterUseCase {
	return &RegisterUseCase{userRepo: userRepo, hasher: hasher, tokens: tokens}
}

// Execute registers a new user and returns a token + user info.
func (uc *RegisterUseCase) Execute(ctx context.Context, req RegisterRequest) (*AuthResponse, error) {
	if err := req.Validate(); err != nil {
		return nil, err
	}

	exists, err := uc.userRepo.ExistsByEmail(ctx, req.Email)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, domainerrors.AlreadyExists("User", "email already registered")
	}

	hash, err := uc.hasher.Hash(req.Password)
	if err != nil {
		return nil, err
	}

	user, err := entity.NewUser(req.Email, hash, req.Name)
	if err != nil {
		return nil, err
	}

	created, err := uc.userRepo.Create(ctx, user)
	if err != nil {
		return nil, err
	}

	token, err := uc.tokens.Generate(created.ID, created.Email)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		Token: token,
		User: UserInfo{
			ID:        created.ID,
			Email:     created.Email,
			Name:      created.Name,
			CreatedAt: created.CreatedAt,
		},
	}, nil
}
