package middleware

import (
	"net/http"

	"github.com/google/uuid"

	"job-tracker/pkg/ctxkey"
)

const headerRequestID = "X-Request-ID"

// RequestID reads X-Request-ID from the request header (or generates a UUID),
// injects it into the context via ctxkey, and echoes it in the response header.
func RequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := r.Header.Get(headerRequestID)
		if id == "" {
			id = uuid.NewString()
		}
		w.Header().Set(headerRequestID, id)
		next.ServeHTTP(w, r.WithContext(ctxkey.WithRequestID(r.Context(), id)))
	})
}
