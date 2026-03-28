package auth_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"job-tracker/internal/application/auth"
	"job-tracker/internal/domain/entity"
	domainerrors "job-tracker/internal/domain/errors"
	"job-tracker/mocks"
)

func TestLoginUseCase_Execute_Success(t *testing.T) {
	ctx := context.Background()

	userRepo := mocks.NewMockUserRepository(t)
	hasher := mocks.NewMockPasswordHasher(t)
	tokens := mocks.NewMockTokenService(t)

	storedUser := &entity.User{
		ID:           1,
		Email:        "user@example.com",
		PasswordHash: "$2a$12$hash",
		Name:         "Alice",
		CreatedAt:    time.Time{},
	}
	userRepo.On("FindByEmail", ctx, "user@example.com").Return(storedUser, nil)
	hasher.On("Compare", "$2a$12$hash", "password123").Return(nil)
	tokens.On("Generate", int64(1), "user@example.com").Return("jwt.token", nil)

	uc := auth.NewLoginUseCase(userRepo, hasher, tokens)
	resp, err := uc.Execute(ctx, auth.LoginRequest{
		Email:    "user@example.com",
		Password: "password123",
	})

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.Token != "jwt.token" {
		t.Errorf("token mismatch: got %q", resp.Token)
	}
}

func TestLoginUseCase_Execute_WrongPassword(t *testing.T) {
	ctx := context.Background()

	userRepo := mocks.NewMockUserRepository(t)
	hasher := mocks.NewMockPasswordHasher(t)
	tokens := mocks.NewMockTokenService(t)

	storedUser := &entity.User{
		ID:           1,
		Email:        "user@example.com",
		PasswordHash: "$2a$12$hash",
	}
	userRepo.On("FindByEmail", ctx, "user@example.com").Return(storedUser, nil)
	hasher.On("Compare", "$2a$12$hash", "wrongpass").Return(errors.New("mismatch"))

	uc := auth.NewLoginUseCase(userRepo, hasher, tokens)
	_, err := uc.Execute(ctx, auth.LoginRequest{
		Email:    "user@example.com",
		Password: "wrongpass",
	})

	if err == nil {
		t.Fatal("expected error, got nil")
	}
	var de *domainerrors.DomainError
	if !errors.As(err, &de) || de.Code != domainerrors.ErrCodeUnauthorized {
		t.Errorf("expected UNAUTHORIZED error, got %v", err)
	}
}

func TestLoginUseCase_Execute_EmailNotFound(t *testing.T) {
	ctx := context.Background()

	userRepo := mocks.NewMockUserRepository(t)
	hasher := mocks.NewMockPasswordHasher(t)
	tokens := mocks.NewMockTokenService(t)

	userRepo.On("FindByEmail", ctx, "ghost@example.com").
		Return((*entity.User)(nil), domainerrors.NotFound("User", "not found"))

	uc := auth.NewLoginUseCase(userRepo, hasher, tokens)
	_, err := uc.Execute(ctx, auth.LoginRequest{
		Email:    "ghost@example.com",
		Password: "password123",
	})

	if err == nil {
		t.Fatal("expected error, got nil")
	}
	var de *domainerrors.DomainError
	if !errors.As(err, &de) || de.Code != domainerrors.ErrCodeUnauthorized {
		t.Errorf("expected UNAUTHORIZED error (user enumeration masked), got %v", err)
	}
}

func TestLoginUseCase_Execute_InvalidInput(t *testing.T) {
	uc := auth.NewLoginUseCase(nil, nil, nil)

	cases := []auth.LoginRequest{
		{Email: "not-email", Password: "pass"},
		{Email: "a@b.com", Password: ""},
	}

	for _, req := range cases {
		_, err := uc.Execute(context.Background(), req)
		if err == nil {
			t.Errorf("expected error for %+v", req)
			continue
		}
		var de *domainerrors.DomainError
		if !errors.As(err, &de) || de.Code != domainerrors.ErrCodeInvalidInput {
			t.Errorf("expected INVALID_INPUT, got %v", err)
		}
	}
}
