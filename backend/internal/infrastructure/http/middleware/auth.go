package middleware

import (
	"encoding/json"
	"net/http"
	"strings"
)

// Auth is a stub middleware that extracts the Bearer token from the Authorization header.
// Full JWT validation is implemented in PR-07 once TokenService is wired.
// For now it rejects requests with no Authorization header on protected routes.
func Auth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		header := r.Header.Get("Authorization")
		if header == "" || !strings.HasPrefix(header, "Bearer ") {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			_ = json.NewEncoder(w).Encode(map[string]any{
				"success": false,
				"error":   map[string]string{"code": "UNAUTHORIZED", "message": "missing or invalid token"},
			})
			return
		}
		// TODO: PR-07 — validate JWT and inject userID via ctxkey.WithUserID
		next.ServeHTTP(w, r)
	})
}
