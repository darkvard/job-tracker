# Design System — Tokens, Typography, Spacing

---

## Colors (CSS Variables in `src/styles/theme.css`)

### Light Mode (`:root`)
| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#f9fafb` | Page background |
| `--foreground` | `oklch(0.145 0 0)` | Default text |
| `--card` | `#ffffff` | Card backgrounds |
| `--primary` | `#6366f1` | Buttons, active states, highlights |
| `--primary-foreground` | `oklch(1 0 0)` | Text on primary |
| `--muted` | `#ececf0` | Muted backgrounds |
| `--muted-foreground` | `#717182` | Subdued text |
| `--accent` | `#e9ebef` | Hover bg, accents |
| `--destructive` | `#ef4444` | Errors, delete, rejected |
| `--border` | `rgba(0,0,0,0.1)` | Borders |
| `--input-background` | `#f3f3f5` | Input backgrounds |
| `--radius` | `0.625rem` (10px) | Base border radius |

### Dark Mode (`.dark`)
| Token | Value |
|-------|-------|
| `--background` | `oklch(0.145 0 0)` — near black |
| `--foreground` | `oklch(0.985 0 0)` — near white |
| `--card` | `oklch(0.145 0 0)` — same as background |
| `--border` | `oklch(0.269 0 0)` |
| `--muted` | `oklch(0.269 0 0)` |
| `--accent` | `oklch(0.269 0 0)` |

### Status Colors (hardcoded in components)
| Status | Hex | Tailwind bg-light | Tailwind text-light |
|--------|-----|-------------------|---------------------|
| Applied | `#3b82f6` | `bg-blue-50` | `text-blue-700` |
| Interview | `#f97316` | `bg-orange-50` | `text-orange-700` |
| Offer | `#22c55e` | `bg-green-50` | `text-green-700` |
| Rejected | `#ef4444` | `bg-red-50` | `text-red-700` |

Dark suffixes: `dark:bg-*-950/30` · `dark:text-*-400`

### Chart Colors (hex, hardcoded)
| Usage | Colors |
|-------|--------|
| Status pie (dashboard) | Applied=`#3b82f6` · Interview=`#f97316` · Offer=`#22c55e` · Rejected=`#ef4444` |
| Source pie (analytics) | `["#6366f1","#f97316","#22c55e","#ef4444","#8b5cf6"]` |
| Bar/Line charts | Fill: `#6366f1` (indigo) |

### KPI Card Icon Colors
| KPI | `bgColor` | `iconColor` |
|-----|-----------|-------------|
| Total | `bg-blue-100 dark:bg-blue-950/50` | `text-blue-600 dark:text-blue-400` |
| Interview | `bg-orange-100 dark:bg-orange-950/50` | `text-orange-600 dark:text-orange-400` |
| Offer | `bg-green-100 dark:bg-green-950/50` | `text-green-600 dark:text-green-400` |
| Rejected | `bg-red-100 dark:bg-red-950/50` | `text-red-600 dark:text-red-400` |

---

## Typography

**Font:** Inter (Google Fonts, weights 300–700)
```css
body { font-family: 'Inter', sans-serif; }
```

| Class | Size | Weight | Usage |
|-------|------|--------|-------|
| `text-3xl font-semibold` | 30px | 600 | Page titles |
| `text-2xl font-semibold` | 24px | 600 | Detail page role |
| `text-xl font-semibold` | 20px | 600 | Section headers |
| `text-lg font-semibold` | 18px | 600 | Card titles |
| `text-base font-medium` | 16px | 500 | Labels, buttons |
| `text-sm` | 14px | 400 | Secondary text |
| `text-xs` | 12px | 400 | Sub-labels, tiny |

**KPI metric value:** `text-3xl font-semibold text-gray-900 dark:text-white`

---

## Spacing & Layout

**Container:** `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
**Page padding:** `py-8` (32px)

**Card padding:**
- Standard: `p-6` (24px)
- Detail page: `p-8` (32px)
- Success modal: `p-12` (48px)

**Grid layouts:**
| Layout | Mobile | Tablet | Desktop |
|--------|--------|--------|---------|
| KPI Cards | 1 col | `sm:grid-cols-2` | `lg:grid-cols-4` |
| Dashboard bottom | 1 col | 1 col | `lg:grid-cols-3` |
| Applications | 1 col | `md:grid-cols-2` | `lg:grid-cols-3` |
| Analytics | 1 col | 1 col | `lg:grid-cols-2` |
| Detail info | 1 col | `sm:grid-cols-3` | 3 cols |

**Gaps:** `gap-6` (24px) standard · `gap-4` (16px) info grid · `gap-2` (8px) icon+text

---

## Border Radius
| Scale | Value | Usage |
|-------|-------|-------|
| `rounded-lg` | 8px | Buttons, inputs |
| `rounded-xl` | 12px | Cards |
| `rounded-full` | 9999px | Badges, avatar circles |

---

## Shadows
| Class | Context |
|-------|---------|
| `shadow-sm` | Default card shadow |
| `shadow-lg` | Success modal |
| `0 10px 25px rgba(0,0,0,0.1)` | Card hover (via Motion) |

---

## Company Avatar Gradient
```jsx
bg-gradient-to-br from-indigo-500 to-purple-600
```
Always shows first letter of company name in white, font-semibold.

| Size | Classes | Used in |
|------|---------|---------|
| sm | `w-10 h-10 rounded-lg text-sm` | Dashboard table |
| md | `w-12 h-12 rounded-lg text-lg` | Applications grid |
| lg | `w-16 h-16 rounded-xl text-2xl` | Application detail |

---

## Input Style (standard)
```
w-full px-4 py-3 bg-gray-50 dark:bg-gray-900
border border-gray-200 dark:border-gray-700 rounded-lg
focus:ring-2 focus:ring-indigo-500 focus:border-transparent
outline-none text-gray-900 dark:text-white
```

---

## Button Styles

**Primary CTA:** `bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors`
**Primary Large:** `px-6 py-3` version of above
**Disabled:** `disabled:bg-gray-300 disabled:cursor-not-allowed`
**Ghost:** `text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white`
**Outline:** `border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg`
**Icon:** `p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`

**Filter pill active:** `bg-indigo-600 text-white px-4 py-2 rounded-lg`
**Filter pill inactive:** outlined style above + `px-4 py-2`

**Nav item active:** `bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-lg`
**Nav item inactive:** `text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 px-4 py-2 rounded-lg`
