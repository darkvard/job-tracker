package handler

import (
	"encoding/json"
	"net/http"
)

type successResponse struct {
	Success bool `json:"success"`
	Data    any  `json:"data"`
}

type errorBody struct { //nolint:unused // used by respondError in later PRs
	Code    string `json:"code"`
	Message string `json:"message"`
}

type errorResponse struct { //nolint:unused // used by respondError in later PRs
	Success bool      `json:"success"`
	Error   errorBody `json:"error"`
}

// respondJSON writes a JSON success response with the given HTTP status code.
func respondJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(successResponse{Success: true, Data: data})
}

// respondError writes a JSON error response with the given HTTP status code.
//
//nolint:unused // used by handlers in later PRs
func respondError(w http.ResponseWriter, status int, message, code string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(errorResponse{
		Success: false,
		Error:   errorBody{Code: code, Message: message},
	})
}
