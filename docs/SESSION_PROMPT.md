# New Session Startup Prompt

Copy-paste this at the start of every new Claude Code session:

---

```
Read CLAUDE.md first, then:
1. Read AGENTS.md
2. Read docs/ERRORS.md (known bugs — don't repeat)
3. If docs/WIP.md exists → read it and resume from last step
4. Run: git checkout main && git pull
5. Run: gh pr list --state open → check file overlap
6. Open PLAN.md → find first unchecked [ ] task
7. Execute the task following .claude/skills/feat.md
8. After PR merges + CI green: mark [x] in PLAN.md → pull main → find next [ ] → repeat from step 5
9. Stop when: all [ ] tasks done · OR circuit breaker triggers (3× same error) · OR WIP state reached
```

---

## One-time GitHub setup (do this before first session)

```bash
# 1. Enable auto-merge in repo settings
# GitHub → Settings → General → Allow auto-merge ✓

# 2. Branch protection for main
# GitHub → Settings → Branches → Add rule:
#   Branch: main
#   ✓ Require status checks: "Backend (Go)" + "Frontend (React + TypeScript)"
#   ✓ Require branches to be up to date before merging

# 3. Authenticate GitHub CLI
gh auth login

# 4. First-time project setup
make init   # copies .env, starts Docker, runs migrations
```

---

## Verification (test your setup in a new session)

Ask Claude these 3 questions:

1. *"Describe the architecture"*
   → Expected: `domain ← application ← infrastructure`, DI in `cmd/api/main.go`, TxManager for multi-table ops

2. *"Fix a bug in the list endpoint"*
   → Expected: reads `fix.md` + `docs/ERRORS.md` first, writes failing test before fixing

3. *"Create a branch for next feature"*
   → Expected: runs `gh pr list` + `gh pr diff <n> --name-only` before branching

If Claude does all 3 without prompting → setup working.
