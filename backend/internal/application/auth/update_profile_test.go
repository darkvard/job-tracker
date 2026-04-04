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

func ptr[T any](v T) *T { return &v }

func TestUpdateProfileUseCase_Execute_Success(t *testing.T) {
	ctx := context.Background()
	userRepo := mocks.NewMockUserRepository(t)

	existing := &entity.User{
		ID:             1,
		Email:          "user@example.com",
		PasswordHash:   "$2a$12$hash",
		Name:           "Old Name",
		SalaryCurrency: "VND",
		CreatedAt:      time.Time{},
	}
	updated := &entity.User{
		ID:              1,
		Email:           "user@example.com",
		PasswordHash:    "$2a$12$hash",
		Name:            "New Name",
		CurrentRole:     ptr("Senior Engineer"),
		CurrentCompany:  ptr("VNPAY"),
		CurrentLocation: ptr("Hanoi, Vietnam"),
		CurrentSalary:   ptr(int64(30_000_000)),
		SalaryCurrency:  "VND",
		CreatedAt:       time.Time{},
	}

	userRepo.On("FindByID", ctx, int64(1)).Return(existing, nil)
	userRepo.On("Update", ctx, updated).Return(updated, nil)

	uc := auth.NewUpdateProfileUseCase(userRepo)
	info, err := uc.Execute(ctx, 1, auth.UpdateProfileRequest{
		Name:            "New Name",
		CurrentRole:     ptr("Senior Engineer"),
		CurrentCompany:  ptr("VNPAY"),
		CurrentLocation: ptr("Hanoi, Vietnam"),
		CurrentSalary:   ptr(int64(30_000_000)),
		SalaryCurrency:  "VND",
	})

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if info.Name != "New Name" {
		t.Errorf("expected name %q, got %q", "New Name", info.Name)
	}
	if info.CurrentRole == nil || *info.CurrentRole != "Senior Engineer" {
		t.Errorf("expected currentRole %q, got %v", "Senior Engineer", info.CurrentRole)
	}
}

func TestUpdateProfileUseCase_Execute_ValidationError(t *testing.T) {
	uc := auth.NewUpdateProfileUseCase(nil)

	cases := []auth.UpdateProfileRequest{
		{Name: "", SalaryCurrency: "VND"},
		{Name: "Alice", SalaryCurrency: ""},
	}

	for _, req := range cases {
		_, err := uc.Execute(context.Background(), 1, req)
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

func TestUpdateProfileUseCase_Execute_UserNotFound(t *testing.T) {
	ctx := context.Background()
	userRepo := mocks.NewMockUserRepository(t)
	userRepo.On("FindByID", ctx, int64(99)).
		Return((*entity.User)(nil), domainerrors.NotFound("User", "user not found"))

	uc := auth.NewUpdateProfileUseCase(userRepo)
	_, err := uc.Execute(ctx, 99, auth.UpdateProfileRequest{
		Name:           "Alice",
		SalaryCurrency: "VND",
	})

	if err == nil {
		t.Fatal("expected error, got nil")
	}
	var de *domainerrors.DomainError
	if !errors.As(err, &de) || de.Code != domainerrors.ErrCodeNotFound {
		t.Errorf("expected NOT_FOUND, got %v", err)
	}
}
