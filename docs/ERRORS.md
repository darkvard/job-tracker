# ERRORS.md — Bug Log

> Append after every non-trivial bug fix.
> Format: `### YYYY-MM-DD — Short title`

---

### 2026-03-28 — golangci-lint v1 rejects go 1.25 modules
**Symptom:** CI backend lint step fails with `the Go language version (go1.24) used to build golangci-lint is lower than the targeted Go version (1.25)`
**Root cause:** `golangci/golangci-lint-action@v6` installs golangci-lint v1.64.8 which was built with Go 1.24 and refuses to run against a `go 1.25` module
**Fix:** Upgrade CI to `golangci/golangci-lint-action@v7` with `version: v2.11.4` — golangci-lint v2 is built with Go 1.25+
**Prevention:** Always use `golangci-lint-action@v7` (not v6) with an explicit v2.x.x version. Never use `version: latest` as it resolves to v1.

---

### 2026-03-28 — CI frontend/integration/e2e jobs fail when directories not yet scaffolded
**Symptom:** CI fails on `Frontend (React + TypeScript)` (missing `frontend/package-lock.json`) and `Integration tests` (`lstat ./tests/integration/: no such file or directory`) before those PRs are implemented
**Root cause:** CI workflow unconditionally runs steps that require directories created in later PRs (frontend in PR-12, tests in PR-19)
**Fix:** Added shell guards: frontend steps check `frontend/package.json` exists; integration/e2e steps check `backend/tests/integration` and `backend/tests/e2e` dirs exist before running
**Prevention:** Any new CI step that depends on a directory created in a later PR must have a conditional guard

---

### 2026-03-29 — Agent forgets to mark PLAN.md `[x]` after PR merges
**Symptom:** PR merges + CI green, but PLAN.md task header stays `[ ]`. A separate chore PR is needed every time to mark it done.
**Root cause:** The agent queues auto-merge (`gh pr merge --auto --squash`) and then the session ends (user runs `/clear` or context resets). When the PR actually merges (often minutes/hours later), no agent is running to do the marking. The merge event is asynchronous and unobserved.
**Fix:** After any PR merges, always create a follow-up chore commit on a new branch that marks `[x]` in PLAN.md before starting the next task. Alternatively, mark immediately after `gh pr merge --auto` fires (not waiting for CI) as a best-effort, then confirm after merge.
**Prevention:** The prompt for the next task should always start with `git pull` + verify PLAN.md is updated. Also mark sub-task checkboxes `[x]` at end of each session, not just the PR header — this makes it obvious which items were actually completed.

*(Add new entries below)*
