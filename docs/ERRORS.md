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

*(Add new entries below)*
