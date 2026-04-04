package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"job-tracker/internal/application/auth"
	domainerrors "job-tracker/internal/domain/errors"
	"job-tracker/internal/domain/repository"
	"job-tracker/pkg/ctxkey"
)

// AuthHandler handles HTTP requests for authentication endpoints.
type AuthHandler struct {
	register      *auth.RegisterUseCase
	login         *auth.LoginUseCase
	updateProfile *auth.UpdateProfileUseCase
	userRepo      repository.UserRepository
}

// NewAuthHandler constructs an AuthHandler.
func NewAuthHandler(
	register *auth.RegisterUseCase,
	login *auth.LoginUseCase,
	updateProfile *auth.UpdateProfileUseCase,
	userRepo repository.UserRepository,
) *AuthHandler {
	return &AuthHandler{register: register, login: login, updateProfile: updateProfile, userRepo: userRepo}
}

// Register handles POST /auth/register.
//
//	@Summary		Register a new user
//	@Description	Create a new account and receive a JWT token
//	@Tags			auth
//	@Accept			json
//	@Produce		json
//	@Param			body	body		auth.RegisterRequest	true	"Register payload"
//	@Success		201		{object}	auth.AuthResponse
//	@Failure		400		{object}	errorResponse
//	@Failure		409		{object}	errorResponse
//	@Router			/auth/register [post]
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req auth.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid JSON body", "BAD_REQUEST")
		return
	}

	resp, err := h.register.Execute(r.Context(), req)
	if err != nil {
		mapDomainError(w, err)
		return
	}

	respondJSON(w, http.StatusCreated, resp)
}

// Login handles POST /auth/login.
//
//	@Summary		Login
//	@Description	Authenticate with email and password, receive a JWT token
//	@Tags			auth
//	@Accept			json
//	@Produce		json
//	@Param			body	body		auth.LoginRequest	true	"Login payload"
//	@Success		200		{object}	auth.AuthResponse
//	@Failure		400		{object}	errorResponse
//	@Failure		401		{object}	errorResponse
//	@Router			/auth/login [post]
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req auth.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid JSON body", "BAD_REQUEST")
		return
	}

	resp, err := h.login.Execute(r.Context(), req)
	if err != nil {
		mapDomainError(w, err)
		return
	}

	respondJSON(w, http.StatusOK, resp)
}

// Me handles GET /auth/me.
//
//	@Summary		Get current user
//	@Description	Returns the profile of the authenticated user
//	@Tags			auth
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	auth.UserInfo
//	@Failure		401	{object}	errorResponse
//	@Router			/auth/me [get]
func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	userID, ok := ctxkey.GetUserID(r.Context())
	if !ok {
		respondError(w, http.StatusUnauthorized, "missing or invalid token", "UNAUTHORIZED")
		return
	}

	user, err := h.userRepo.FindByID(r.Context(), userID)
	if err != nil {
		mapDomainError(w, err)
		return
	}

	respondJSON(w, http.StatusOK, auth.UserInfo{
		ID:              user.ID,
		Email:           user.Email,
		Name:            user.Name,
		CreatedAt:       user.CreatedAt,
		CurrentLocation: user.CurrentLocation,
		CurrentRole:     user.CurrentRole,
		CurrentCompany:  user.CurrentCompany,
		CurrentSalary:   user.CurrentSalary,
		SalaryCurrency:  user.SalaryCurrency,
	})
}

// UpdateMe handles PUT /auth/me.
//
//	@Summary		Update current user profile
//	@Description	Updates the profile fields of the authenticated user
//	@Tags			auth
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			body	body		auth.UpdateProfileRequest	true	"Update profile payload"
//	@Success		200		{object}	auth.UserInfo
//	@Failure		400		{object}	errorResponse
//	@Failure		401		{object}	errorResponse
//	@Router			/auth/me [put]
func (h *AuthHandler) UpdateMe(w http.ResponseWriter, r *http.Request) {
	userID, ok := ctxkey.GetUserID(r.Context())
	if !ok {
		respondError(w, http.StatusUnauthorized, "missing or invalid token", "UNAUTHORIZED")
		return
	}

	var req auth.UpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid JSON body", "BAD_REQUEST")
		return
	}

	info, err := h.updateProfile.Execute(r.Context(), userID, req)
	if err != nil {
		mapDomainError(w, err)
		return
	}

	respondJSON(w, http.StatusOK, info)
}

// mapDomainError translates a domain error to an HTTP response.
func mapDomainError(w http.ResponseWriter, err error) {
	var de *domainerrors.DomainError
	if !errors.As(err, &de) {
		respondError(w, http.StatusInternalServerError, "internal error", "INTERNAL")
		return
	}

	switch de.Code {
	case domainerrors.ErrCodeNotFound:
		respondError(w, http.StatusNotFound, de.Message, string(de.Code))
	case domainerrors.ErrCodeAlreadyExists:
		respondError(w, http.StatusConflict, de.Message, string(de.Code))
	case domainerrors.ErrCodeInvalidInput:
		respondError(w, http.StatusBadRequest, de.Message, string(de.Code))
	case domainerrors.ErrCodeUnauthorized:
		respondError(w, http.StatusUnauthorized, de.Message, string(de.Code))
	case domainerrors.ErrCodeInvalidStatus:
		respondError(w, http.StatusUnprocessableEntity, de.Message, string(de.Code))
	default:
		respondError(w, http.StatusInternalServerError, "internal error", "INTERNAL")
	}
}
