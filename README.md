# Job Tracker

Vibe-coded job tracking web app with Go and React.

Track job applications, monitor status transitions, and visualize your pipeline with a dashboard and analytics.

---

## Stack

| Layer | Tech |
|---|---|
| Backend | Go 1.25 · Chi · GORM · PostgreSQL 15 |
| Cache | Redis 8 |
| Frontend | React 18 · Vite · Tailwind CSS · shadcn/ui |
| Auth | JWT (HS256) · bcrypt |
| Infra | Docker Compose · air hot reload · golang-migrate |

Architecture: Clean Architecture (domain ← application ← infrastructure)

---

## Prerequisites

- Docker + Docker Compose
- Go 1.25
- Node.js 24
- GitHub CLI (`gh`)

---

## Getting Started

```bash
# Clone
git clone git@github.com:darkvard/job-tracker.git or https://github.com/darkvard/job-tracker.git && cd job-tracker

# Setup (first time only)
cp .env.example .env        # edit JWT_SECRET → any 32+ char string
make init                   # builds Docker image, starts containers, runs migrations

# Demo data (optional)
make seed                   # login: demo@tracker.com / demo123
```

Open: http://localhost:5173

API docs: http://localhost:3001/api/v1/swagger/index.html

---

## Daily Workflow

```bash
make docker-up        # start
make docker-down      # stop
make migrate-up       # apply new migrations
make logs             # tail logs
make test             # run all tests
```

> Source is mounted as a volume — Go and React both hot-reload on save.
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
