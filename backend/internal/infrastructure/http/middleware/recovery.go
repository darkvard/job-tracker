package middleware

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"runtime/debug"

	"job-tracker/pkg/ctxkey"
)

// Recovery catches panics, logs the stack trace, and responds with 500.
func Recovery(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				requestID, _ := ctxkey.GetRequestID(r.Context())
				slog.Error("panic recovered",
					"request_id", requestID,
					"error", rec,
					"stack", string(debug.Stack()),
				)
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusInternalServerError)
				_ = json.NewEncoder(w).Encode(map[string]any{
					"success": false,
					"error":   map[string]string{"code": "INTERNAL", "message": "internal error"},
				})
			}
		}()
		next.ServeHTTP(w, r)
	})
}
