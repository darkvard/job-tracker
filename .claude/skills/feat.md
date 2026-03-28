# Skill: Implement a Feature

## Before starting
1. `PLAN.md` → first `[ ]` task → **read every file listed in that task's `Docs:` line**
2. `AGENTS.md` → git rules
3. `gh pr list --state open` + `gh pr diff <n> --name-only` → no file overlap

## Steps
1. `git checkout main && git pull` → `git checkout -b feat/<scope>/<desc>`
2. **Domain** — entity + interface + typed errors (stdlib only, zero external imports)
3. **Application** — DTO with `Validate()`/`ToEntity()` + use case `Execute()` + mockery unit tests
4. **Infrastructure** — GORM model + `ToEntity()`/`fromEntity()` + repo + handler + cache decorator/invalidator + wire `cmd/api/main.go`
   - Add `// @Summary` swagger annotations to new handler methods → `make swagger` → commit `docs/`
5. **Frontend** — `api.ts` endpoint + component (useQuery/useMutation + 3 states + dark mode)
6. `make lint && make test` → green
7. `git add <specific-files>` → `git commit -m "feat(<scope>): ..."` → `git push origin HEAD`
8. `gh pr create ...` → `gh pr merge --auto --squash <n>` → `gh pr checks <n> --watch`
9. Mark `[x]` in `PLAN.md` → start next `[ ]` task

## Checklist
- [ ] No file overlap with open PRs
- [ ] Domain: zero external imports
- [ ] Application: mockery mocks, no infra imports
- [ ] Infrastructure: GORM model ≠ entity, cache invalidation on mutations
- [ ] Swagger: annotations on every new handler → `make swagger` → `docs/` committed
- [ ] Frontend: 3 states + dark mode + `motion/react`
- [ ] `make lint` + `make test` green · PR references PLAN.md PR-XX
