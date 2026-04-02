# WIP — Work in Progress

> This file is created when a session ends mid-task.
> Delete after resuming and completing the work.

---

## Branch: feat/ui/i18n-settings-dropdown

**Last completed step:** Step 13 — `ApplicationsList.tsx` fully translated (all hardcoded strings replaced with `t()`)

**Next step:** Step 14 — Translate `AddApplicationForm.tsx` (see exact changes below)

---

## Approved Plan (PR-23)

### What this PR does
- **Language support:** EN (default) + VI via `i18next` + `react-i18next`. All UI text moves from hardcoded strings to translation keys in JSON resource files (`src/i18n/locales/en.json` + `vi.json`). Easily extensible: add new language = add a new JSON file + one entry in `SUPPORTED_LANGUAGES`.
- **Settings Dropdown:** Replaces standalone `ThemeToggle` in Navbar with a gear icon (`Settings2`) that opens a dropdown grouping **Theme** (Light/Dark buttons) + **Language** (EN/VI buttons). Active state = `bg-indigo-600 text-white`. Closes on outside click.
- **Persistence:** Language stored in `localStorage('job-tracker-lang')`. Default = `'en'`.

### Key docs for this feature (READ BEFORE CODING)
- `docs/ARCHITECTURE_FRONTEND.md` — layer rules, context pattern
- `docs/DESIGN_SYSTEM.md` — colors, button styles (`bg-indigo-600` active, `hover:bg-gray-100 dark:hover:bg-gray-700` inactive)
- `docs/UI_SPEC.md` — Navbar spec (right-side layout), button icon style
- `.claude/skills/ui.md` — dark mode on every className, motion/react, 3 states
- `PLAN.md` PR-23 section — checklist (add after completing)

---

## Progress: ~65% complete

### ✅ Done (in stash)

| # | File | Status |
|---|------|--------|
| 1 | `frontend/package.json` + `package-lock.json` | i18next@23, react-i18next@15 installed |
| 2 | `frontend/src/i18n/locales/en.json` | **NEW** — 9 namespaces: nav, settings, auth, dashboard, jobs, detail, analytics, status, common |
| 3 | `frontend/src/i18n/locales/vi.json` | **NEW** — same keys, full Vietnamese translation |
| 4 | `frontend/src/i18n/index.ts` | **NEW** — i18next init with `initReactI18next`, reads `localStorage('job-tracker-lang')` |
| 5 | `frontend/src/contexts/LanguageContext.tsx` | **NEW** — exports `Language`, `SUPPORTED_LANGUAGES`, `LanguageProvider`, `useLanguage()` |
| 6 | `frontend/src/app/components/SettingsDropdown.tsx` | **NEW** — gear icon dropdown, Theme + Language sections, outside-click close |
| 7 | `frontend/src/main.tsx` | Added `import './i18n'` side-effect (line 3) |
| 8 | `frontend/src/app/App.tsx` | Added `LanguageProvider` wrapping `QueryClientProvider` |
| 9 | `frontend/src/app/components/Navbar.tsx` | **REWRITTEN** — `ThemeToggle` → `SettingsDropdown`; `NAV_LINKS` uses `t()`; "Add Application" uses `t('nav.addApplication')` |
| 10 | `frontend/src/app/components/LoginPage.tsx` | Fully translated — all labels, placeholders, buttons, errors |
| 11 | `frontend/src/app/components/Dashboard.tsx` | Fully translated — title, subtitle, KPI titles, table headers, empty state, error |
| 12 | `frontend/src/app/components/ApplicationsList.tsx` | Fully translated — header, search placeholder, filter pills, card labels, delete dialog, pagination, empty state |

### ⬜ Remaining (do in order)

**Step 14 — `frontend/src/app/components/AddApplicationForm.tsx`**
Add `import { useTranslation } from 'react-i18next'` at top.
Add `const { t } = useTranslation()` inside `AddApplicationForm()`.
Replace:
- `'Back'` (back button) → `t('common.back')`
- `'Add Application'` (h1) → `t('jobs.addTitle')`
- `'Track a new job application'` (p) → `t('jobs.addSubtitle')`
- `'Basic Info'`, `'Details'`, `'Notes'` (step labels) → `t('jobs.basicInfo')`, `t('jobs.details')`, `t('jobs.notes')`
- `'Company'` label → `t('jobs.company')`
- `placeholder="e.g. Google"` → `placeholder={t('jobs.companyPlaceholder')}`
- `'Role'` label → `t('jobs.role')`
- `placeholder="e.g. Senior Product Designer"` → `placeholder={t('jobs.rolePlaceholder')}`
- `'Location'` label → `t('jobs.locationLabel')`
- `placeholder="e.g. San Francisco, CA (optional)"` → `placeholder={t('jobs.locationPlaceholder')}`
- `'Date Applied'` label → `t('jobs.dateApplied')`
- `'Source'` label → `t('jobs.sourceLabel')`
- `'Status'` label → `t('jobs.statusLabel')`
- `'Notes'` label (step 3) → `t('jobs.notesLabel')`
- `placeholder="Any notes about this application..."` → `placeholder={t('jobs.notesPlaceholder')}`
- `'Application Added!'` → `t('jobs.successTitle')`
- `'Your application has been successfully saved'` → `t('jobs.successSubtitle')`
- `'Back'` (nav button) → `t('common.back')`
- `'Next'` → `t('common.next')`
- `'Submitting...'` → `t('common.submitting')`
- `'Submit'` → `t('common.submit')`
- `'Something went wrong. Please try again.'` (default error) → `t('jobs.somethingWentWrong')`
Also translate select option display: `{STATUSES.map(s => <option key={s} value={s}>{t(`status.${s.toLowerCase()}`)}</option>)}` (value stays English for API)

**Step 15 — `frontend/src/app/components/ApplicationDetail.tsx`**
Add `import { useTranslation } from 'react-i18next'`. Add `const { t } = useTranslation()` at top of `ApplicationDetail()`.
Replace:
- `'Back to Applications'` → `t('detail.backToApplications')`
- `'Failed to load application'` → `t('detail.failedToLoad')`
- `'Retry'` → `t('common.retry')`
- `'Location'` (info grid label) → `t('detail.locationLabel')`
- `'Applied'` (info grid label) → `t('detail.appliedLabel')`
- `'Source'` (info grid label) → `t('detail.sourceLabel')`
- `'Application Timeline'` → `t('detail.applicationTimeline')`
- `'Notes'` (card title) → `t('detail.notesTitle')`
- `'Update Status'` (main button) → `t('detail.updateStatus')`
- `'Delete'` (outline button) → `t('detail.delete')`
- `'Delete Application'` (AlertDialog title) → `t('detail.deleteTitle')`
- AlertDialog description → `t('detail.deleteConfirmMsg', { company: job.company, role: job.role })`
- `'Cancel'` → `t('common.cancel')`
- `'Delete'` (action) → `t('common.delete')`
- `'Deleting...'` → `t('detail.deleting')`
- `'Update Status'` (dialog h3) → `t('detail.updateStatusTitle')`
- `'New Status'` (label) → `t('detail.newStatus')`
- `'Note (optional)'` (label) → `t('detail.noteOptional')`
- `'Cancel'` (dialog) → `t('common.cancel')`
- `'Updating...'` → `t('detail.updating')`
- `'Confirm'` → `t('detail.confirm')`
- `'Failed to update status. Please try again.'` (default error) → `t('detail.failedToUpdateStatus')`
Also translate status select options: `{availableTransitions.map(s => <option key={s} value={s}>{t(`status.${s.toLowerCase()}`)}</option>)}` (value stays English for API)

**Step 16 — `frontend/src/app/components/Analytics.tsx`**
Add `import { useTranslation } from 'react-i18next'`. Add `const { t } = useTranslation()` inside `Analytics()`.
Replace:
- `'Failed to load chart data'` in `ChartError` → needs `t()` — move `ChartError` to take `message` prop OR add `useTranslation()` inside it
- `'Retry'` in `ChartError` → `t('common.retry')`
- `'Analytics'` (h1) → `t('analytics.title')`
- `'Insights into your job search performance'` → `t('analytics.subtitle')`
- `'Applications per Week'` → `t('analytics.applicationsPerWeek')`
- `'Last 6 weeks'` → `t('analytics.last6Weeks')`
- `'Interview Conversion'` → `t('analytics.interviewConversion')`
- `'Applied → Interview → Offer'` → `t('analytics.conversionSubtitle')`
- `'Source Performance'` → `t('analytics.sourcePerformance')`
- `'Applications by source'` → `t('analytics.applicationsBySource')`
- `'Key Metrics'` → `t('analytics.keyMetrics')`
- `'Conversion rates'` → `t('analytics.conversionRates')`
- `'Interview Rate'`, `'Offer Rate'`, `'Rejection Rate'` (metrics array labels) → `t('analytics.interviewRate')`, etc.
- `'Avg. Response Time'` → `t('analytics.avgResponseTime')`
- `'{value} days'` → `t('analytics.days', { value: metrics.data.data.avgResponseDays.toFixed(1) })`
For `ChartError`: simplest approach — add `useTranslation()` inside `ChartError` component (it renders nothing complex).

**Step 17 — `frontend/src/components/StatusBadge.tsx`**
Add `import { useTranslation } from 'react-i18next'`. Add `const { t } = useTranslation()` inside `StatusBadge()`.
Replace:
```tsx
// Before:
{status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
// After:
{t(`status.${key}`)}  // key is already computed as status.toLowerCase()
```

**Step 18 — `frontend/src/components/KPICard.tsx`**
Add `import { useTranslation } from 'react-i18next'`. Add `const { t } = useTranslation()` inside `KPICard()`.
Replace the trend text:
```tsx
// Before:
{trend.isPositive ? '+' : ''}{trend.value}% from last month
// After:
{t('common.trendFromLastMonth', { sign: trend.isPositive ? '+' : '', value: trend.value })}
```

**Step 19 — Update `PLAN.md`**
Add PR-23 section BEFORE `## Summary` (after PR-22 `---` separator):

```markdown
### [ ] PR-23: i18n (EN/VI) + Settings dropdown
**Docs:** `docs/UI_SPEC.md` · `docs/DESIGN_SYSTEM.md` · `docs/ARCHITECTURE_FRONTEND.md` · `.claude/skills/ui.md`
**Files:** `frontend/src/i18n/index.ts` (new) · `frontend/src/i18n/locales/en.json` (new) · `frontend/src/i18n/locales/vi.json` (new) · `frontend/src/contexts/LanguageContext.tsx` (new) · `frontend/src/app/components/SettingsDropdown.tsx` (new) · `frontend/src/app/components/Navbar.tsx` · `frontend/src/app/App.tsx` · `frontend/src/main.tsx` · `frontend/src/app/components/LoginPage.tsx` · `frontend/src/app/components/Dashboard.tsx` · `frontend/src/app/components/ApplicationsList.tsx` · `frontend/src/app/components/AddApplicationForm.tsx` · `frontend/src/app/components/ApplicationDetail.tsx` · `frontend/src/app/components/Analytics.tsx` · `frontend/src/components/StatusBadge.tsx` · `frontend/src/components/KPICard.tsx` · `frontend/package.json`

- [ ] Install: `i18next` · `react-i18next`
- [ ] `src/i18n/locales/en.json` + `vi.json`: translation resource files grouped by feature (nav, settings, auth, dashboard, jobs, detail, analytics, status, common)
- [ ] `src/i18n/index.ts`: i18next init + `initReactI18next`, reads `localStorage('job-tracker-lang')` with `'en'` fallback
- [ ] `src/contexts/LanguageContext.tsx`: exports `Language = 'en'|'vi'` · `SUPPORTED_LANGUAGES` · `LanguageProvider` + `useLanguage()` — `changeLanguage()` calls `i18n.changeLanguage()` + saves to localStorage
- [ ] `src/app/components/SettingsDropdown.tsx`: gear icon (`Settings2`) opens dropdown — Theme section (Light/Dark toggle) + Language section (`SUPPORTED_LANGUAGES` buttons) — active = `bg-indigo-600 text-white` — closes on outside click
- [ ] `main.tsx`: add `import '@/i18n'` side-effect import
- [ ] `App.tsx`: wrap with `<LanguageProvider>` (inside `<ThemeProvider>`, outside `<QueryClientProvider>`)
- [ ] `Navbar.tsx`: replace `<ThemeToggle />` → `<SettingsDropdown />`; nav links + "Add Application" use `t()`
- [ ] All page components + `StatusBadge` + `KPICard`: replace hardcoded strings with `t('key')`; status filter/option **values** stay English (API contract), only display text translated

**Test:**
- Default = English; toggle to Vietnamese → all text switches immediately; reload → persists
- Click gear icon → dropdown shows Theme + Language sections
- Toggle theme inside dropdown → same behavior as before
- `make test-ui` green (Playwright tests use English selectors — default lang is EN so they still pass)
```

Update summary table:
```markdown
| 5: Polish | PR-18 → PR-22 | Seed, API E2E, README, Browser E2E (Playwright), Dark mode toggle |
| 6: i18n + UX | PR-23 | EN/VI language support + Settings dropdown (theme + language) |
```
Change `**Total: 21 PRs**` → `**Total: 23 PRs**`

**Step 20 — Build + commit + PR**
```bash
cd frontend && npm run build   # must pass (0 TypeScript errors)
cd ..

git add frontend/package.json frontend/package-lock.json \
  frontend/src/i18n/ \
  frontend/src/contexts/LanguageContext.tsx \
  frontend/src/app/components/SettingsDropdown.tsx \
  frontend/src/main.tsx \
  frontend/src/app/App.tsx \
  frontend/src/app/components/Navbar.tsx \
  frontend/src/app/components/LoginPage.tsx \
  frontend/src/app/components/Dashboard.tsx \
  frontend/src/app/components/ApplicationsList.tsx \
  frontend/src/app/components/AddApplicationForm.tsx \
  frontend/src/app/components/ApplicationDetail.tsx \
  frontend/src/app/components/Analytics.tsx \
  frontend/src/components/StatusBadge.tsx \
  frontend/src/components/KPICard.tsx \
  PLAN.md

git commit -m "feat(ui): i18n EN/VI support + Settings dropdown (#PR-23)"

git push origin HEAD

gh pr create --title "feat(ui): i18n EN/VI + Settings dropdown" \
  --body "$(cat <<'EOF'
Completes PLAN.md task PR-23.

## What this PR does
Adds EN/VI language support via i18next and groups theme toggle + language selector into a Settings dropdown (⚙ gear icon) in the Navbar.

## Depends on
none (frontend-only)

## Changes
- New: `src/i18n/locales/en.json` + `vi.json` — translation resource files (9 namespaces)
- New: `src/i18n/index.ts` — i18next initialization
- New: `src/contexts/LanguageContext.tsx` — language state + persistence
- New: `src/app/components/SettingsDropdown.tsx` — gear icon dropdown with theme + language
- Modified: Navbar, App, main, all page components, StatusBadge, KPICard

## Test
- [ ] `make lint` — 0 issues
- [ ] `make test-ui` — green (Playwright default lang = EN, selectors still match)
- [ ] Toggle to VI → all text switches; reload → persists
- [ ] Settings dropdown opens; theme and language controls work
EOF
)"

gh pr merge --auto --squash <PR_NUMBER>
gh pr checks <PR_NUMBER> --watch
```

After CI green + merge:
```bash
git checkout main && git pull
# Mark [ ] → [x] for PR-23 in PLAN.md via a chore PR
# Delete docs/WIP.md
```

---

## Architecture decisions (important for continuity)

1. **i18next init in `src/i18n/index.ts`**: initialized once as side-effect via `import './i18n'` in `main.tsx`. `localStorage('job-tracker-lang')` is read at startup to set the initial language.

2. **LanguageContext wraps i18next**: provides typed `changeLanguage(lang: Language)` + syncs localStorage. Follows existing ThemeContext pattern. `SUPPORTED_LANGUAGES` is exported from LanguageContext (not from i18n/index.ts) so SettingsDropdown has a single import.

3. **Status filter values = English always**: `STATUS_FILTER_VALUES = ['All', 'Applied', ...]` in ApplicationsList are API contract values. Only the display label is translated via `getFilterLabel(value)`. Same for select option `value` attributes in forms.

4. **No DropdownMenu from shadcn/ui**: not installed (would need `@radix-ui/react-dropdown-menu`). SettingsDropdown uses custom button + absolute div + `useEffect` outside-click detection.

5. **Playwright E2E tests**: unaffected because default language is English and tests start with clean localStorage. Selectors like `getByRole('button', { name: 'Next' })` will still match.

6. **Date formatting**: kept as `'en-US'` (not locale-aware) — out of scope for PR-23.

---

## How to resume

```bash
cd /home/dgtien/projects/job-tracker
git checkout feat/ui/i18n-settings-dropdown
git pull
git stash pop   # restores all code changes from the stash
```

Then continue from **Step 14** (AddApplicationForm.tsx) in the "Remaining" section above.
Check stash content first: `git stash show --stat`
