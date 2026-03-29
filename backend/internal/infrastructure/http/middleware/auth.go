package middleware

import (
	"encoding/json"
	"net/http"
	"strings"

	"job-tracker/internal/application/port"
	"job-tracker/pkg/ctxkey"
)

// NewAuth returns a middleware that validates Bearer JWT tokens.
// It injects the authenticated userID into the request context via ctxkey.WithUserID.
func NewAuth(tokens port.TokenService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			header := r.Header.Get("Authorization")
			if header == "" || !strings.HasPrefix(header, "Bearer ") {
				writeUnauthorized(w, "missing or invalid token")
				return
			}

			tokenStr := strings.TrimPrefix(header, "Bearer ")
			userID, _, err := tokens.Validate(tokenStr)
			if err != nil {
				writeUnauthorized(w, "missing or invalid token")
				return
			}

			ctx := ctxkey.WithUserID(r.Context(), userID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func writeUnauthorized(w http.ResponseWriter, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"success": false,
		"error":   map[string]string{"code": "UNAUTHORIZED", "message": msg},
	})
}
