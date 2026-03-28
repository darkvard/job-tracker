# Agent Instructions

## End-of-session checklist
- New CI/build error? → append `docs/ERRORS.md`
- Fixed non-obvious bug? → append `docs/ERRORS.md`
- Completed PR? → confirm CI green + auto-merge fired
- Unfinished work? → stub with `// TODO: resume here`, write `docs/WIP.md`, commit `wip:`

**ERRORS.md format:** `### YYYY-MM-DD — title` · Symptom · Root cause · Fix · Prevention

---

## Git workflow
```bash
git checkout main && git pull
git checkout -b <type>/<scope>/<desc>
# code → make mock (if interface changed) → make test → make test-ui (if UI)
git add <specific-files>          # NEVER git add -A or git add .
git commit -m "type(scope): description"
git push origin HEAD
gh pr create --title "type(scope): description" \
  --body "Completes PLAN.md task PR-XX. \n\n## Changes\n- ...\n\n## Test\n- ..."
gh pr merge --auto --squash <n>   # queue auto-merge when CI passes
gh pr checks <n> --watch          # monitor — do NOT start next task until merged
```

## Branch naming
`feat/` · `fix/` · `refactor/` · `chore/` · `docs/` + `<scope>/<short-desc>`

Examples: `feat/domain/application-entity` · `fix/api/pagination-offset` · `chore/ci/add-lint`

## Commit types
`feat` · `fix` · `refactor` · `test` · `chore` · `docs` · `perf`

## PR rules
- 1 PR = 1 atomic unit (100–400 lines). Tests always in same PR as code.
- Never open PR if prerequisite PR is not yet merged.
- Never bundle unrelated changes.
- PR body MUST reference PLAN.md: `Completes PLAN.md task PR-XX`

## ⛔ FILE OVERLAP RULE (before EVERY new branch)
```bash
gh pr list --state open
gh pr diff <n> --name-only    # for each open PR
```
If any open PR touches a file you need → **wait for it to merge first**.
Parallel branches only if file sets are 100% disjoint.

## ⛔ SQUASH-MERGE RULE
After a PR merges its squash hash changes → any branch forked from it WILL conflict.
**Always:** `git checkout main && git pull` before creating any new branch.
**Recovery:** `git checkout origin/main -b fix/clean` → `git cherry-pick <your-commits-only>`

## When CI fails
1. `gh run view <run-id> --log-failed`
2. Fix root cause, not symptom. If new bug class → append `docs/ERRORS.md` first.
3. Push fix. Never force-push.

## Circuit breaker
Same error 3× → STOP. 5+ attempts on same issue → STOP. Revert, document, ask user.

## Clean Architecture import rules
`domain/` → stdlib only · `application/` → domain + stdlib · `infrastructure/` → anything · `cmd/` → wiring only.
NEVER import infrastructure from domain or application.

## Definition of done
- [ ] `make mock` ran (if interface changed)
- [ ] `make lint` clean
- [ ] `make test` green
- [ ] `make test-ui` green (if UI touched)
- [ ] PR created with PLAN.md reference
- [ ] CI green
- [ ] PLAN.md task marked `[x]`
