# Job Tracker

Single-user job application tracker. Track applications, monitor status transitions, and visualize your pipeline with a dashboard and analytics.

---

## Stack

| Layer | Tech |
|---|---|
| Backend | Go 1.25 · Chi v5 · GORM · PostgreSQL 15 |
| Cache | Redis 8 |
| Frontend | React 18 · Vite · Tailwind CSS · shadcn/ui · Recharts |
| Auth | JWT (HS256) · bcrypt |
| Infra | Docker Compose · air hot reload · golang-migrate · mockery |

---

## Architecture

```
┌─────────────────────────────────────────────┐
│              Browser (React SPA)            │
│  Vite · React Query · React Router · Axios  │
└──────────────────┬──────────────────────────┘
                   │ HTTP/REST
┌──────────────────▼──────────────────────────┐
│              Go API (Chi)                   │
│  ┌─────────┐  ┌─────────────┐  ┌─────────┐ │
│  │ Handler │→ │  Use Cases  │→ │  Domain │ │
│  │ (infra) │  │  (app layer)│  │ (pure)  │ │
│  └────┬────┘  └──────┬──────┘  └─────────┘ │
│       │              │ TxManager             │
│  ┌────▼──────────────▼──────────────────┐   │
│  │   Infrastructure (GORM · Redis)      │   │
│  └──────────┬──────────────┬────────────┘   │
└─────────────┼──────────────┼────────────────┘
              │              │
   ┌──────────▼──┐    ┌──────▼──────┐
   │ PostgreSQL  │    │   Redis 8   │
   │  (port 5433)│    │ (port 6380) │
   └─────────────┘    └─────────────┘

Clean Architecture: domain ← application ← infrastructure
Arrows never reverse. GORM/Redis never imported by domain or application.
```

---

## Prerequisites

- Docker with Compose v2 plugin (`docker compose` — ships with Docker Desktop and Docker Engine ≥ 23)
- Go 1.25
- Node.js 24

---

## Getting Started

```bash
# 1. Clone
git clone https://github.com/darkvard/job-tracker.git && cd job-tracker

# 2. Configure
cp .env.example .env
# Edit .env — set JWT_SECRET to any 32+ character random string

# 3. Build image (first time only)
make docker-build

# 4. Start containers
make docker-up

# 5. Apply migrations
make migrate-up

# 6. (Optional) Load demo data
make seed   # login: demo@tracker.com / demo123
```

Open: http://localhost:5173

API docs: http://localhost:3001/api/v1/swagger/index.html

---

## Daily Workflow

```bash
make docker-up        # start all containers
make docker-down      # stop all containers
make migrate-up       # apply pending migrations
make logs             # tail all logs
make logs-api         # tail backend logs only
make test             # unit + integration tests
make lint             # golangci-lint
make seed             # reload demo data (idempotent)
```

> Source is mounted as a volume — Go (air) and React (Vite) both hot-reload on save.
> Only run `make docker-build` when `go.mod` or `Dockerfile.dev` changes.

---

## Ports

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3001 |
| Swagger UI | http://localhost:3001/api/v1/swagger/index.html |
| PostgreSQL | localhost:5433 |
| Redis | localhost:6380 |

---

## License

MIT
