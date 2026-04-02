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

### 2026-04-02 — Playwright E2E: shared email + wrong analytics headings
**Symptom 1:** Tests 2-6 all timeout at `waitForURL('/')` after register.
**Root cause 1:** `email` was a module-level `const` using `Date.now()` evaluated once. All 6 tests shared the same email → test 1 registers OK; tests 2-6 get 409 AlreadyExists → no navigation → timeout.
**Fix 1:** Moved email generation inside `register()` using `uniqueEmail()` so every call gets a fresh email.
**Prevention:** Never use module-level `Date.now()` for test isolation values in Playwright specs — use a helper called at runtime.

**Symptom 2:** Test 4 (Analytics) fails with "element not found" for `getByText('Weekly Applications')`.
**Root cause 2:** Asserted wrong heading text. Actual `Analytics.tsx` headings: `Applications per Week`, `Interview Conversion`, `Source Performance`, `Key Metrics`.
**Fix 2:** Updated assertions to match actual component text.
**Prevention:** Always grep the component source for exact text before writing `getByText()` assertions.

### 2026-04-02 — `make docker-up` fails: `docker-compose: No such file or directory`
**Symptom:** All `make docker-*` and `make migrate-*` targets fail with `docker-compose: No such file or directory`.
**Root cause:** Makefile used `docker-compose` (Compose v1 standalone binary). Modern Docker installs only ship Compose v2 as a built-in plugin (`docker compose` with a space).
**Fix:** Replaced every `docker-compose` → `docker compose` in the Makefile.
**Prevention:** Always use `docker compose` (v2 syntax) in Makefiles and scripts. Never use `docker-compose` — v1 is end-of-life and not installed by default on Docker Desktop or current Docker Engine packages.

*(Add new entries below)*
