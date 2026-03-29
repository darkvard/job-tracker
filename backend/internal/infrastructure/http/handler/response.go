package handler

import (
	"encoding/json"
	"net/http"
)

type successResponse struct {
	Success bool `json:"success"`
	Data    any  `json:"data"`
}

type errorBody struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

type errorResponse struct {
	Success bool      `json:"success"`
	Error   errorBody `json:"error"`
}

type paginationMeta struct {
	Total      int64 `json:"total"`
	Page       int   `json:"page"`
	PageSize   int   `json:"pageSize"`
	TotalPages int   `json:"totalPages"`
}

type paginatedResponse struct {
	Success bool           `json:"success"`
	Data    any            `json:"data"`
	Meta    paginationMeta `json:"meta"`
}

// respondJSON writes a JSON success response with the given HTTP status code.
func respondJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(successResponse{Success: true, Data: data})
}

// respondError writes a JSON error response with the given HTTP status code.
func respondError(w http.ResponseWriter, status int, message, code string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(errorResponse{
		Success: false,
		Error:   errorBody{Code: code, Message: message},
	})
}

// respondPaginatedJSON writes a paginated JSON success response.
func respondPaginatedJSON(w http.ResponseWriter, data any, meta paginationMeta) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(paginatedResponse{Success: true, Data: data, Meta: meta})
}
