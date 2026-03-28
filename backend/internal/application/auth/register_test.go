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

func TestRegisterUseCase_Execute_Success(t *testing.T) {
	ctx := context.Background()

	userRepo := mocks.NewMockUserRepository(t)
	hasher := mocks.NewMockPasswordHasher(t)
	tokens := mocks.NewMockTokenService(t)

	userRepo.On("ExistsByEmail", ctx, "new@example.com").Return(false, nil)
	hasher.On("Hash", "password123").Return("$2a$12$hash", nil)
	userRepo.On("Create", ctx, &entity.User{
		Email:        "new@example.com",
		PasswordHash: "$2a$12$hash",
		Name:         "Alice",
	}).Return(&entity.User{
		ID:        1,
		Email:     "new@example.com",
		Name:      "Alice",
		CreatedAt: time.Time{},
	}, nil)
	tokens.On("Generate", int64(1), "new@example.com").Return("tok.en.here", nil)

	uc := auth.NewRegisterUseCase(userRepo, hasher, tokens)
	resp, err := uc.Execute(ctx, auth.RegisterRequest{
		Email:    "new@example.com",
		Password: "password123",
		Name:     "Alice",
	})

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.Token != "tok.en.here" {
		t.Errorf("token mismatch: got %q", resp.Token)
	}
	if resp.User.Email != "new@example.com" {
		t.Errorf("email mismatch: got %q", resp.User.Email)
	}
}

func TestRegisterUseCase_Execute_DuplicateEmail(t *testing.T) {
	ctx := context.Background()

	userRepo := mocks.NewMockUserRepository(t)
	hasher := mocks.NewMockPasswordHasher(t)
	tokens := mocks.NewMockTokenService(t)

	userRepo.On("ExistsByEmail", ctx, "dup@example.com").Return(true, nil)

	uc := auth.NewRegisterUseCase(userRepo, hasher, tokens)
	_, err := uc.Execute(ctx, auth.RegisterRequest{
		Email:    "dup@example.com",
		Password: "password123",
		Name:     "Bob",
	})

	if err == nil {
		t.Fatal("expected error, got nil")
	}
	var de *domainerrors.DomainError
	if !errors.As(err, &de) || de.Code != domainerrors.ErrCodeAlreadyExists {
		t.Errorf("expected ALREADY_EXISTS error, got %v", err)
	}
}

func TestRegisterUseCase_Execute_InvalidInput(t *testing.T) {
	uc := auth.NewRegisterUseCase(nil, nil, nil)

	cases := []auth.RegisterRequest{
		{Email: "not-an-email", Password: "password123", Name: "A"},
		{Email: "a@b.com", Password: "short", Name: "A"},
		{Email: "a@b.com", Password: "password123", Name: ""},
	}

	for _, req := range cases {
		_, err := uc.Execute(context.Background(), req)
		if err == nil {
			t.Errorf("expected error for %+v", req)
			continue
		}
		var de *domainerrors.DomainError
		if !errors.As(err, &de) || de.Code != domainerrors.ErrCodeInvalidInput {
			t.Errorf("expected INVALID_INPUT error, got %v", err)
		}
	}
}
