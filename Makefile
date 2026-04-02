.PHONY: run build docker-up docker-down docker-build docker-rebuild ps shell logs \
        migrate-up migrate-down migrate-status mock test test-integration test-e2e test-e2e-ui test-ui \
        lint lint-fe seed clean help

# ─── Local dev (no Docker) ────────────────────────────────────────────────────

run: ## Run backend locally (requires Postgres + Redis running)
	cd backend && go run ./cmd/api

build: ## Compile backend binary
	cd backend && CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o bin/server ./cmd/api

# ─── Docker lifecycle ─────────────────────────────────────────────────────────

docker-up: ## Start all containers (NO rebuild — use existing images)
	docker-compose up -d

docker-down: ## Stop all containers
	docker-compose down

docker-build: ## Build images (run when: go.mod changes · Dockerfile.dev changes · first time)
	docker-compose build

docker-rebuild: ## Build + restart everything + re-migrate
	docker-compose down
	docker-compose build
	docker-compose up -d
	@sleep 5
	$(MAKE) migrate-up

# ─── First-time setup ─────────────────────────────────────────────────────────

init: ## First-time only: copy .env, build image, start, migrate
	@if [ ! -f .env ]; then cp .env.example .env; echo "Created .env — edit JWT_SECRET before running"; fi
	$(MAKE) docker-build
	$(MAKE) docker-up
	@echo "Waiting for postgres..."
	@sleep 5
	$(MAKE) migrate-up
	@echo "\n✅ Setup complete. Frontend: http://localhost:5173 | API: http://localhost:3001"

# ─── Container management ─────────────────────────────────────────────────────

ps: ## Show container status
	docker-compose ps

shell: ## Open shell in backend container
	docker-compose exec api sh

logs: ## Follow all logs
	docker-compose logs -f

logs-api: ## Follow backend logs only
	docker-compose logs -f api

# ─── Database migrations ──────────────────────────────────────────────────────

migrate-up: ## Apply pending migrations (inside container)
	docker-compose exec api sh -c '/go/bin/migrate -path /app/migrations -database "$$DB_DSN" up'

migrate-down: ## Roll back one migration (inside container)
	docker-compose exec api sh -c '/go/bin/migrate -path /app/migrations -database "$$DB_DSN" down 1'

migrate-status: ## Show current migration version (inside container)
	docker-compose exec api sh -c '/go/bin/migrate -path /app/migrations -database "$$DB_DSN" version'

# ─── Code generation ──────────────────────────────────────────────────────────

mock: ## Regenerate mockery mocks (run after any interface change)
	cd backend && mockery

swagger: ## Generate Swagger docs from annotations (run after adding/changing handler comments)
	cd backend && swag init -g cmd/api/main.go -o docs --parseDependency
	@echo "✅ Swagger docs updated → backend/docs/"
	@echo "   View at: http://localhost:3001/api/v1/swagger/index.html"

# ─── Testing ──────────────────────────────────────────────────────────────────

test: ## Run all tests (unit + integration via testcontainers)
	cd backend && go test ./... -count=1 -race

test-integration: ## Run integration tests only (spawns testcontainers — needs Docker)
	cd backend && go test ./tests/integration/... -count=1 -v

test-e2e: ## Run E2E smoke test against live server
	cd backend && go test ./tests/e2e/... -count=1

test-e2e-ui: ## Run Playwright browser E2E tests (requires running frontend + backend)
	cd frontend && npx playwright test

test-ui: ## Smoke check: API health + frontend build
	@echo "→ Checking API health..."
	@curl -sf http://localhost:3001/api/v1/health | grep -q "ok" && echo "✅ API healthy" || (echo "❌ API not responding" && exit 1)
	@echo "→ Building frontend..."
	@cd frontend && npm run build 2>&1 | tail -5 && echo "✅ Frontend builds"

# ─── Linting ──────────────────────────────────────────────────────────────────

lint: ## Run golangci-lint on backend
	cd backend && golangci-lint run ./...

lint-fe: ## Run TypeScript type check on frontend
	cd frontend && npx tsc --noEmit

# ─── Utilities ────────────────────────────────────────────────────────────────

seed: ## Insert demo data (idempotent)
	cd backend && go run ./cmd/seed

clean: ## Destroy all containers and volumes (DESTRUCTIVE)
	@read -p "This will delete all data. Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ]
	docker-compose down -v

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
