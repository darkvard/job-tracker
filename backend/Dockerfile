# ─── Builder stage ────────────────────────────────────────────────────────────
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Install golang-migrate
RUN go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest

# Download dependencies first (layer cache)
COPY go.mod go.sum ./
RUN go mod download

# Build binaries
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/server ./cmd/api
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/seed   ./cmd/seed

# ─── Runtime stage ────────────────────────────────────────────────────────────
FROM alpine:3.20

RUN apk --no-cache add ca-certificates

WORKDIR /app

# Copy migrate tool for migration commands
COPY --from=builder /go/bin/migrate /migrate

# Copy compiled binaries
COPY --from=builder /app/server /app/server
COPY --from=builder /app/seed   /app/seed

# Copy migrations (migrate needs them at runtime)
COPY migrations/ /migrations/

EXPOSE 3000

CMD ["/app/server"]
