# Notes cho Owner — Job Tracker Project

> Đọc file này khi cần nhớ lại cách vận hành project.
> Không cần đọc khi làm việc hàng ngày — đó là việc của agent.

---

## 0. Setup (chỉ làm 1 lần)

```bash
# Copy scaffold ra repo mới
mkdir ~/job-tracker && cd ~/job-tracker
cp -r "/path/to/result/." .
git init && git add . && git commit -m "chore: initial scaffold"

# Tạo GitHub repo + push
gh repo create job-tracker --private --source=. --remote=origin --push

# Đăng nhập GitHub CLI
gh auth login

# Setup local
cp .env.example .env        # bắt buộc đổi JWT_SECRET → random 32+ ký tự
make init                   # build Docker + start + migrate (chờ ~2 phút)
```

**GitHub Settings (làm tay 1 lần):**
```
Settings → General
  ✓ Allow auto-merge
  ✓ Automatically delete head branches

Settings → Branches → Add rule: main
  ✓ Require a pull request before merging
  ✓ Require status checks to pass
    → (để trống lần đầu — sau khi CI chạy xong 1 lần mới search được)
  ✓ Require branches to be up to date before merging
```

**Sau khi CI chạy lần đầu** (push bất kỳ commit lên):
```
Settings → Branches → Edit rule → Status checks
→ Search và add: "Backend (Go)" + "Frontend (React + TypeScript)"
```

---

## 1. Cách dùng hàng ngày

**Mỗi lần muốn agent làm việc — mở session mới, paste:**

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
10. IMPORTANT: After each PR merges + CI green, tell the user: "✅ PR merged. Run /clear then re-paste this prompt to start the next task with a fresh context."
```

Agent sẽ tự chạy từ PR đang dở → hết.

> **Lưu ý token:** Agent không thể tự `/clear` — đó là lệnh phía client.
> Sau mỗi PR merge, agent sẽ nhắc bạn `/clear` + paste lại prompt trên.
> Làm vậy giúp mỗi task chạy trong context sạch, tiết kiệm token đáng kể.

---

## 2. Khi nào bạn cần can thiệp

| Tình huống | Dấu hiệu | Việc cần làm |
|---|---|---|
| **Status checks trống** | Lần đầu setup branch protection | Đợi CI chạy 1 lần → vào Settings thêm check names |
| **Circuit breaker** | Agent báo "STOP — same error 3×" | Đọc `docs/ERRORS.md` → hướng dẫn agent cách fix |
| **WIP state** | `docs/WIP.md` tồn tại | Paste SESSION_PROMPT → agent tự resume |
| **Port conflict** | `make init` fail | Kiểm tra port 3001/5173/5433/6380 bị chiếm (air-social?) |
| **CI đỏ liên tục** | PR không merge được | Xem `gh run view <id> --log-failed` → paste lỗi cho agent |
| **Muốn tạm dừng** | Bất kỳ lúc nào | Đóng tab. Agent dừng ở cuối PR hiện tại. WIP.md được ghi. |

**Thực tế:** PR-01→18 thường chạy hoàn toàn tự động. Bạn chỉ cần can thiệp nếu có lỗi bất ngờ.

---

## 3. Quick commands

```bash
make docker-up        # start containers (không rebuild image)
make docker-build     # rebuild image (chỉ khi go.mod / Dockerfile.dev thay đổi)
make docker-down      # tắt containers
make migrate-up       # chạy migrations còn thiếu
make seed             # tạo demo data (idempotent)
make swagger          # gen Swagger docs → docs/ folder
make test             # unit + integration tests
make mock             # regenerate mocks (sau khi đổi interface)
make lint             # golangci-lint
make logs             # xem log realtime
make shell            # vào trong container api
```

---

## 4. Ports

| Service | Local port | Trong Docker |
|---|---|---|
| Backend API | 3001 | 3000 |
| Frontend | 5173 | 5173 |
| PostgreSQL | 5433 | 5432 |
| Redis | 6380 | 6379 |
| Swagger UI | [localhost:3001/api/v1/swagger/index.html](http://localhost:3001/api/v1/swagger/index.html) | — |

Port 5433/6380 (không dùng 5432/6379 mặc định) để tránh xung đột với service khác trên máy.

---

## 5. Testing layers

| Level | Command | Covers |
|---|---|---|
| Unit | `make test` | Domain logic, use cases (mockery) |
| Integration | `make test-integration` | Repo queries vs real PostgreSQL (testcontainers) |
| API E2E | `make test-e2e` | Full API flow: register→CRUD→analytics (Go HTTP client) |
| Build check | `make test-ui` | API health ping + `npm run build` |
| Browser E2E | `make test-e2e-ui` | Full UI flow trong headless Chromium (Playwright) — PR-21 |

---

## 6. Tiến độ — 21 PRs

```
Phase 0: Skeleton     PR-01→04   Go init, PostgreSQL+GORM+TxManager, Redis, middleware
Phase 1: Auth         PR-05→07   Domain layer, auth use cases, JWT+bcrypt
Phase 2: CRUD         PR-08→09   Job use cases + REST API
Phase 3: Analytics    PR-10→11   Dashboard + Analytics (cache decorators)
Phase 4: Frontend     PR-12→17   React Query wiring, Router, 6 pages
Phase 5: Polish       PR-18→21   Seed data, API E2E, README, Playwright E2E
```

Theo dõi tiến độ: mở `PLAN.md` → xem `[x]` và `[ ]`.

---

## 7. Cấu trúc docs (để biết file nào làm gì)

| File | Dùng khi |
|---|---|
| `CLAUDE.md` | Agent đọc đầu tiên mỗi session |
| `AGENTS.md` | Agent đọc trước khi làm git/PR |
| `PLAN.md` | Source of truth tiến độ — 21 PRs |
| `docs/ERRORS.md` | Tra cứu khi gặp bug đã biết |
| `docs/WIP.md` | Ghi khi agent dừng giữa chừng |
| `docs/SESSION_PROMPT.md` | Lấy prompt paste vào session mới |
| `docs/ARCHITECTURE_BACKEND.md` | Agent đọc khi làm PR backend |
| `docs/ARCHITECTURE_FRONTEND.md` | Agent đọc khi làm PR frontend |
| `docs/API_SPEC.md` | Contract API — request/response chính xác |
| `docs/BA_SPEC.md` | Business requirements + user stories |
| `docs/RULES.md` | Coding rules (ngắn — agent đọc mỗi PR) |
| `docs/UI_SPEC.md` | Chi tiết từng trang UI |
| `docs/DESIGN_SYSTEM.md` | Colors, tokens, typography |
| `docs/ANIMATIONS_SPEC.md` | motion/react patterns |
| `.claude/skills/` | Checklist cho từng loại task |

---

## 8. Những thứ KHÔNG BAO GIỜ để agent làm

```
❌ git push --force
❌ git add -A  hoặc  git add .
❌ make generate  (dùng make mock)
❌ Viết code generator vào air pre_cmd  → infinite loop
❌ Import infrastructure vào domain hoặc application layer
❌ Dùng GORM model trực tiếp ngoài persistence/
❌ Cache logic trong use cases
❌ Raw string làm context key  (dùng pkg/ctxkey)
```

---

## 9. Khi project xong — checklist

- [ ] Tất cả 21 PR đã merge, CI green
- [ ] `make seed` → login `demo@tracker.com` / `demo123` → thấy 8 jobs
- [ ] `make test-e2e` pass
- [ ] `make test-e2e-ui` pass (Playwright)
- [ ] Swagger UI hiển thị đúng tất cả endpoints
- [ ] Dark mode hoạt động trên tất cả trang
- [ ] Fresh clone → `make init` → `make migrate-up` → `make seed` → app chạy bình thường
