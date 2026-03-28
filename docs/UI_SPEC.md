# UI Specification — Pages, Components, Behavior

> Reference: Figma https://www.figma.com/design/1aXiUvZ674uC6jEvUQU8Cl/Job-Application-Tracker-Dashboard--Community-

---

## Global Layout

```
<html class="dark?">
  <body>
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Navbar />                    ← sticky top-0 z-50
      <main>
        {currentView}               ← one of 5 page components
      </main>
    </div>
  </body>
</html>
```

All pages share container: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8`

---

## Navbar

**Height:** 64px (`h-16`) · **Bg:** `bg-white dark:bg-gray-800` · **Border-bottom:** `border-gray-200 dark:border-gray-700`

```
[LEFT]  Logo (gradient icon + "JobTracker") | Nav links (hidden on mobile)
[RIGHT] Search bar (hidden on mobile) | "+ Add Application" btn | Theme toggle | Bell | Avatar
```

**Logo:**
```jsx
<div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
  <BriefcaseSVG className="w-5 h-5 text-white" />
</div>
<span className="text-xl font-semibold text-gray-900 dark:text-white">JobTracker</span>
```

**Nav links** (hidden on mobile `hidden md:flex`):
- Active: `bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400`
- Inactive: `text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700`
- Items: Dashboard · Applications · Analytics

**"+ Add Application" button:**
```jsx
<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg">
  <Plus className="w-4 h-4" />
  <span className="hidden sm:inline">Add Application</span>
</motion.button>
```

**Bell notification:** red dot `absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full` (always shown, decorative)

**User avatar:** `w-8 h-8 bg-indigo-600 rounded-full` with User icon (no dropdown in MVP)

---

## Page 1: Dashboard

**Layout:**
```
[Header: title + subtitle]
[Grid 1col/2col/4col: 4 KPI Cards]
[Grid 1col/3col: Pie Chart (1) | Recent Table (2)]
```

**KPI Cards** (`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8`):

| Card | Icon | BgColor | Trend |
|------|------|---------|-------|
| Total Applications | Briefcase | `bg-blue-100 dark:bg-blue-950/50` | +12% positive |
| Interviews | Users | `bg-orange-100 dark:bg-orange-950/50` | +8% positive |
| Offers | CircleCheck | `bg-green-100 dark:bg-green-950/50` | +25% positive |
| Rejected | X | `bg-red-100 dark:bg-red-950/50` | -5% negative |

**Status Distribution card** (col-span-1 of 3):
- Recharts `<PieChart>` · `<Pie innerRadius={60} outerRadius={80} paddingAngle={5}>`
- Colors: Applied=#3b82f6 · Interview=#f97316 · Offer=#22c55e · Rejected=#ef4444
- Legend below: colored dot + status name + count

**Recent Applications table** (col-span-2 of 3):
- Cols: Company (avatar+name) | Role | Status | Date Applied
- Last 5 applications · Row click → detail view
- Row hover: `whileHover={{ backgroundColor: "rgba(99, 102, 241, 0.05)" }}`
- "View all →" (`ArrowUpRight` icon) → Applications list

**Empty state** (0 apps):
```jsx
<TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
<p>No applications yet</p>
<p className="text-sm">Start tracking your job applications</p>
```

---

## Page 2: Applications List

**Layout:**
```
[Header: title + subtitle]
[Filters: Search input (flex-1) | Status pills (overflow-x-auto)]
[Grid 1/2/3 cols: Application Cards]
[Empty state (conditional)]
```

**Search input:** `pl-10 pr-4 py-3` with Search icon absolute left. Filters company+role (case-insensitive).

**Filter pills:** `["All", "Applied", "Interview", "Offer", "Rejected"]`
- Active: `bg-indigo-600 text-white`
- Inactive: `bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50`

**Application Card:**
```
bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700
```
```
[Company avatar w-12 h-12 gradient]   [StatusBadge (sm)]
[Company name: font-semibold]
[Job role: text-gray-600 mb-4]
[Location: label | value]
[Source: label | value]
[Applied: label | date]
```
Motion: `initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: index*0.05 }}`
Hover: `whileHover={{ y:-4, boxShadow:"0 10px 25px rgba(0,0,0,0.1)" }}`

---

## Page 3: Application Detail

**Max-width:** `max-w-4xl`

**Layout:**
```
[Back button: ChevronLeft "Back to Applications"]
[Header card: Avatar (w-16) | Role/Company | StatusBadge | Info grid]
[Timeline card]
[Notes card]
[Action buttons: Edit (flex-1) | Delete]
```

**Info grid** (`grid-cols-1 sm:grid-cols-3 gap-4`):
- MapPin + "Location" label + value
- Calendar + "Applied" label + date
- ExternalLink + "Source" label + value

**Timeline data logic:**
```typescript
const timeline = [
  { status: "Applied",   date: app.dateApplied, active: true },
  {
    status: "Interview",
    date: (status === "Interview" || status === "Offer") ? historyDate : "",
    active: status === "Interview" || status === "Offer",
  },
  {
    status: status === "Rejected" ? "Rejected" : "Offer",
    date: status === "Offer" || status === "Rejected" ? historyDate : "",
    active: status === "Offer" || status === "Rejected",
  },
];
```

**Timeline item:**
- Active: `bg-indigo-600 text-white` circle
- Inactive: `bg-gray-200 dark:bg-gray-700 text-gray-500` circle
- Connector: `absolute top-10 left-5 w-0.5 h-12` (indigo if active, gray if not)

**Action buttons:**
```jsx
<button className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
  Edit Application
</button>
<button className="px-6 py-3 border border-gray-200 dark:border-gray-700 ...">
  Delete
</button>
```

---

## Page 4: Add Application Form

**Max-width:** `max-w-2xl`

**Progress Steps:**
```
[Circle 1] ─── [Circle 2] ─── [Circle 3]
Basic Info      Details         Notes
```
- Active (step >= s): `bg-indigo-600 text-white w-10 h-10 rounded-full`
- Inactive: `bg-gray-200 dark:bg-gray-700 text-gray-500`
- Connector: `flex-1 h-1 mx-2` (indigo if completed, gray if not)

**Form card** (white, `rounded-xl p-6`):

Step 1 — Company* + Role* + Location (optional)
Step 2 — Date (date input, default=today) + Source (select) + Status (select)
Step 3 — Notes (textarea 8 rows, `resize-none`)

**Input style:**
```
w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700
rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none
text-gray-900 dark:text-white
```

**Form card animation** (step change):
```jsx
<motion.div key={step} initial={{ x:20, opacity:0 }} animate={{ x:0, opacity:1 }}>
```

**Navigation:**
- Back: disabled on step 1 (`text-gray-400 cursor-not-allowed`)
- Next: disabled on step 1 if `!company || !role` (`disabled:bg-gray-300`)
- Submit: step 3, no validation gate

**Success screen:**
```jsx
<motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }}>
  <motion.div initial={{ scale:0 }} animate={{ scale:1 }}
              transition={{ delay:0.2, type:"spring" }}>
    <CircleCheck className="w-8 h-8 text-green-600" />
  </motion.div>
  <h2>Application Added!</h2>
  <p>Your application has been successfully saved</p>
</motion.div>
```
Auto-redirect after 2000ms.

---

## Page 5: Analytics

**Layout:** `grid grid-cols-1 lg:grid-cols-2 gap-6`

**Chart 1 — Applications per Week (BarChart):**
- `<Bar dataKey="applications" fill="#6366f1" radius={[8,8,0,0]} />`
- Trend badge: `<TrendingUp /> +23%` in green (top right of card header)

**Chart 2 — Interview Conversion (LineChart):**
- Data: Applied count → Interview count → Offer count
- `<Line type="monotone" stroke="#6366f1" strokeWidth={3} dot={{ fill:"#6366f1", r:6 }} />`

**Chart 3 — Source Performance (PieChart):**
- `outerRadius={80}` · `label={({ source, percent }) => source + " " + (percent*100).toFixed(0) + "%"}`
- Colors: `["#6366f1","#f97316","#22c55e","#ef4444","#8b5cf6"]`

**Chart 4 — Key Metrics:**
- 3 progress bars: Interview Rate (indigo) · Offer Rate (green) · Rejection Rate (red)
- Pattern: label + % value + `h-2 rounded-full bg-gray-200` track + colored fill

**Tooltip style for all charts:**
```js
contentStyle={{ backgroundColor:"#1f2937", border:"none", borderRadius:"8px", color:"#fff" }}
```

**All chart containers:** `h-64 w-full` → `<ResponsiveContainer width="100%" height="100%">`

---

## Reusable Components

### KPICard
```typescript
interface KPICardProps {
  title: string; value: number; icon: LucideIcon;
  bgColor: string; iconColor: string;
  trend?: { value: number; isPositive: boolean };
}
```
- `whileHover={{ y:-4, boxShadow:"0 10px 25px rgba(0,0,0,0.1)" }}`
- Trend: green if positive (`text-green-600`), red if negative (`text-red-600`)
- Format: `{isPositive ? '+' : ''}{value}% from last month`

### StatusBadge
```typescript
interface StatusBadgeProps { status: string; size?: "sm" | "md"; }
```
- Lookup is case-insensitive: `status.toLowerCase()`
- Renders: `inline-flex items-center gap-1.5 px-3 py-1 rounded-full`
- sm: `text-xs` + icons `w-3 h-3` / md: `text-sm` + icons `w-4 h-4`

| Status | Bg | Text | Icon |
|--------|----|----|------|
| applied | `bg-blue-50 dark:bg-blue-950/30` | `text-blue-700 dark:text-blue-400` | Clock |
| interview | `bg-orange-50 dark:bg-orange-950/30` | `text-orange-700 dark:text-orange-400` | Users |
| offer | `bg-green-50 dark:bg-green-950/30` | `text-green-700 dark:text-green-400` | CircleCheck |
| rejected | `bg-red-50 dark:bg-red-950/30` | `text-red-700 dark:text-red-400` | X |

### Company Avatar Pattern
```jsx
// sm (cards): w-12 h-12 text-lg rounded-lg
// md (table): w-10 h-10 text-sm rounded-lg
// lg (detail): w-16 h-16 text-2xl rounded-xl
<div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600
                rounded-lg flex items-center justify-center text-white font-semibold text-lg">
  {company.charAt(0)}
</div>
```

### Empty State Pattern
```jsx
<div className="text-center py-12 [bg-white dark:bg-gray-800 rounded-xl border ... (if standalone)]">
  <IconName className="w-12 h-12 text-gray-400 mx-auto mb-4" />
  <p className="text-gray-600 dark:text-gray-400">Primary message</p>
  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Secondary hint</p>
</div>
```
