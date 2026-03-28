# Business Analysis Specification
# Job Application Tracker Dashboard

---

## 1. Project Context

**Business Problem:** Job seekers lose track of their applications scattered across LinkedIn, email, and memory. They miss follow-up windows, forget interview dates, and can't identify which sources get them the most responses.

**Solution:** A simple, single-user web app that centralizes all job application data with status tracking, timeline visualization, and application analytics.

**Success Metrics:**
- User can add an application in < 60 seconds
- User can see their full pipeline status in < 5 seconds
- Analytics help user identify best job sources

---

## 2. User Persona

**Primary Persona: Active Job Seeker**
- Name: Minh (25–35 years old, mid-level professional)
- Goal: Find a new job within 3 months
- Pain: Applying to 5–20 positions per week, losing track of statuses
- Tech level: Comfortable with web apps, not technical
- Device: Desktop browser primarily, occasional mobile

---

## 3. Feature List (MoSCoW)

### Must Have (MVP)
| ID | Feature | Description |
|----|---------|-------------|
| F01 | User Authentication | Register + Login + JWT session |
| F02 | Add Application | Multi-step form: company, role, location, source, status, notes |
| F03 | View Applications List | Grid view with search + status filter |
| F04 | Application Detail | Full detail with timeline, notes, edit/delete |
| F05 | Status Tracking | Applied → Interview → Offer/Rejected transitions |
| F06 | Dashboard KPIs | Total, Interviews, Offers, Rejected counts with trends |
| F07 | Analytics | Weekly activity, funnel, source performance, key metrics |
| F08 | Dark Mode | System preference + manual toggle |

### Should Have (v1.1)
| ID | Feature |
|----|---------|
| F09 | Edit Application (inline) |
| F10 | Pagination on Applications list |
| F11 | Status history timeline per application |
| F12 | Seed demo data |

### Could Have (v2)
| ID | Feature |
|----|---------|
| F13 | CSV export |
| F14 | Reminder / follow-up notifications |
| F15 | Company notes / contact tracking |
| F16 | Resume version tagging per application |

### Won't Have (out of scope)
- Multi-user / team collaboration
- Cloud file storage (resume upload)
- Email integration
- Mobile native app

---

## 4. User Stories + Acceptance Criteria

### US-01: Register & Login
**Story:** As a new user, I want to create an account so that my data is private to me.

**Acceptance Criteria:**
- [ ] Registration form: email, password (min 8 chars), name
- [ ] Email must be unique — duplicate shows error "Email already registered"
- [ ] Password stored as bcrypt hash (never plaintext)
- [ ] On success: receive JWT token, redirect to dashboard
- [ ] Session persists on page refresh (token in localStorage)
- [ ] Logout clears token and redirects to login

---

### US-02: Add Application
**Story:** As a job seeker, I want to log a new application so I can track it.

**Acceptance Criteria:**
- [ ] 3-step form: Basic Info → Details → Notes
- [ ] Step 1: Company (required), Role (required), Location (optional)
- [ ] Step 2: Application Date (default=today), Source (dropdown), Status (dropdown, default=Applied)
- [ ] Step 3: Notes (optional textarea, 8 rows)
- [ ] "Next" button disabled on Step 1 if Company or Role is empty
- [ ] Step transitions animate in from right (x: 20 → 0, opacity 0 → 1)
- [ ] On submit: success screen with green checkmark animation, auto-redirect after 2s
- [ ] New application appears at top of applications list

**Source options:** LinkedIn · Company Site · Referral · Indeed · Glassdoor · Other

**Status options:** Applied · Interview · Offer · Rejected

---

### US-03: View Applications List
**Story:** As a job seeker, I want to see all my applications in one place so I can get an overview.

**Acceptance Criteria:**
- [ ] Displays as card grid: 1 col mobile, 2 col tablet, 3 col desktop
- [ ] Each card shows: company avatar (gradient + first letter), company name, role, status badge, location, source, date applied
- [ ] Status badge: colored pill with icon (Clock=Applied, Users=Interview, CheckCircle=Offer, X=Rejected)
- [ ] Search input filters by company name OR role (case-insensitive)
- [ ] Search is debounced (300ms — no API call on every keystroke)
- [ ] Filter pills: All · Applied · Interview · Offer · Rejected
- [ ] Active filter pill: indigo background, white text
- [ ] Empty state: shows search icon + helpful message when no results
- [ ] Each card navigates to detail on click
- [ ] Card hover: lift 4px + shadow

---

### US-04: Application Detail
**Story:** As a job seeker, I want to see full details of an application so I can review my notes and track progress.

**Acceptance Criteria:**
- [ ] Header: large company avatar, job role (title), company name, status badge
- [ ] Info row: Location (MapPin icon) · Applied date (Calendar icon) · Source (ExternalLink icon)
- [ ] Timeline section: shows Applied → Interview → Offer/Rejected progression
  - Active stages: indigo circle with Clock icon + date
  - Inactive stages: gray circle, no date
  - Vertical connector line between stages
- [ ] Notes section: shows notes or "No notes added yet."
- [ ] Action buttons: "Edit Application" (primary, full-width) + "Delete" (outline)
- [ ] "Delete" triggers confirmation dialog before deleting
- [ ] Back button → returns to Applications list

---

### US-05: Update Status
**Story:** As a job seeker, I want to update the status of an application so my pipeline reflects reality.

**Acceptance Criteria:**
- [ ] Status can be changed from detail page via dropdown/select
- [ ] Valid transitions only:
  - Applied → Interview ✓
  - Applied → Rejected ✓
  - Interview → Offer ✓
  - Interview → Rejected ✓
  - Offer → (nothing) ✗
  - Rejected → (nothing) ✗
- [ ] Invalid transition shows error message "Invalid status transition"
- [ ] Status change creates entry in status_history
- [ ] Dashboard KPIs refresh after status change

---

### US-06: Dashboard
**Story:** As a job seeker, I want to see my application pipeline summary so I can understand my progress at a glance.

**Acceptance Criteria:**
- [ ] 4 KPI cards: Total Applications · Interviews · Offers · Rejected
  - Each shows count + trend % vs previous month
  - Positive trend = green text, negative = red text
  - Card hover: lift 4px animation
- [ ] Status distribution donut chart: 4 sectors (Applied/Interview/Offer/Rejected)
  - Inner radius: 60, outer radius: 80, padding: 5
  - Legend below with colored dots + counts
- [ ] Recent Applications table: last 5, columns: Company | Role | Status | Date Applied
  - Row hover: subtle indigo background tint
  - Row click → navigate to detail
  - "View all →" link navigates to Applications list
- [ ] Empty state when no applications: icon + "No applications yet"

---

### US-07: Analytics
**Story:** As a job seeker, I want to see trends and patterns in my applications so I can improve my strategy.

**Acceptance Criteria:**
- [ ] Applications per Week bar chart (last 6 weeks)
  - Bars: indigo fill, rounded top corners (radius [8,8,0,0])
  - Trend badge: "+N%" in green with TrendingUp icon
- [ ] Interview Conversion Rate line chart
  - Shows Applied → Interview → Offer funnel counts
  - Line: indigo (#6366f1), strokeWidth=3, dot radius=6
- [ ] Source Performance pie chart
  - Labels inline: "LinkedIn 37%"
  - Colors: [indigo, orange, green, red, purple]
- [ ] Key Metrics card with progress bars:
  - Interview Rate (indigo bar)
  - Offer Rate (green bar)
  - Rejection Rate (red bar)
  - Avg. Response Time (static 5.2 days until real data)
- [ ] All charts: loading skeleton while fetching, error state with retry

---

### US-08: Dark Mode
**Story:** As a user, I want dark mode so I can use the app comfortably at night.

**Acceptance Criteria:**
- [ ] On first load: detect `prefers-color-scheme: dark` and apply automatically
- [ ] Toggle button in Navbar: Moon icon (light mode) / Sun icon (dark mode)
- [ ] Dark mode toggled via `.dark` class on `<html>` element
- [ ] All backgrounds, text, borders, inputs adapt correctly
- [ ] Toggle transition is smooth (`transition-colors` on root div)
- [ ] Preference NOT persisted (reverts to system preference on refresh — MVP simplification)

---

## 5. Navigation Flow

```
[Login Page]
     │
     ▼ (authenticate)
[Navbar always visible]
     │
     ├──► [Dashboard]  ←── default landing page
     │        │
     │        ├── Click row → [Application Detail]
     │        └── "View all" → [Applications List]
     │
     ├──► [Applications List]
     │        │
     │        ├── Click card → [Application Detail]
     │        └── "Add" button → [Add Application Form]
     │
     ├──► [Analytics]
     │
     └──► [Add Application] (from Navbar button)
              │
              └── Submit success → redirect to [Applications List]

[Application Detail]
     └── "Back to Applications" → [Applications List]
```

---

## 6. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| Performance | Page load < 2s. API response < 200ms (cached endpoints < 50ms). |
| Security | JWT expiry 24h. Passwords: bcrypt cost=12. SQL injection prevented via GORM parameterized queries. |
| Accessibility | All interactive elements keyboard-navigable. Color not the only differentiator (icons + text on badges). |
| Browser support | Chrome 100+, Firefox 100+, Safari 15+. No IE. |
| Responsive | Usable on 375px mobile width. Optimized for 1280px desktop. |
| Offline | No offline support (MVP). |
| Data | PostgreSQL 15 (Docker volume `job-tracker-postgres`). No backups in MVP. |

---

## 7. Glossary

| Term | Definition |
|------|-----------|
| Application | A single job application (company + role + status) |
| Status | Current stage of an application: Applied/Interview/Offer/Rejected |
| Source | Where the job was found: LinkedIn/Company Site/Referral/Indeed/Glassdoor/Other |
| Status History | Log of all status transitions for an application with timestamps |
| Dashboard | The main summary view with KPI cards + charts |
| KPI | Key Performance Indicator — a metric card (count + trend) |
| Pipeline | All applications in-progress (not Offer/Rejected) |
| Funnel | The Applied→Interview→Offer conversion visualization |
| Trend | Percentage change vs previous calendar month |
