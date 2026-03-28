# Animations Specification

**Library:** `motion/react` — import as `import { motion } from "motion/react"`
**NEVER** use `framer-motion` — wrong package name, will error.

---

## Named Patterns

### A: Page Entry (Fade + Slide Up)
```jsx
<motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} />
```
Used by: all dashboard/analytics/detail cards on mount.

### B: Staggered Page Entry (with delay)
```jsx
// delay increments per card: 0s, 0.1s, 0.2s, 0.3s
<motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            transition={{ delay: 0.1 }} />
```
Used by: Dashboard bottom row, ApplicationDetail sections (0, 0.1, 0.2), Analytics charts (0, 0.1, 0.2, 0.3).

### C: List Stagger (by index)
```jsx
{items.map((item, index) => (
  <motion.div
    key={item.id}
    initial={{ opacity:0, y:20 }}
    animate={{ opacity:1, y:0 }}
    transition={{ delay: index * 0.05 }}    // 50ms per item
  />
))}
```
Used by: Applications grid (each card).

### D: Card Hover Lift
```jsx
<motion.div whileHover={{ y:-4, boxShadow:"0 10px 25px rgba(0,0,0,0.1)" }} />
```
Used by: KPICard, Application grid cards.

### E: Button Scale (CTA)
```jsx
<motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }} />
```
Used by: "Add Application" button in Navbar.

### F: Table Row Hover Tint
```jsx
<motion.tr whileHover={{ backgroundColor:"rgba(99, 102, 241, 0.05)" }} />
```
Used by: Recent applications table rows in Dashboard.

### G: Modal Scale Pop
```jsx
<motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }} />
```
Used by: Success screen outer container.

### H: Spring Icon Bounce
```jsx
<motion.div initial={{ scale:0 }} animate={{ scale:1 }}
            transition={{ delay:0.2, type:"spring" }} />
```
Used by: Green checkmark circle in success screen.

### I: Form Step Slide-In (key-based)
```jsx
<motion.div
  key={step}                           // triggers re-animation on step change
  initial={{ x:20, opacity:0 }}
  animate={{ x:0, opacity:1 }}
/>
```
Used by: Form card container in AddApplicationForm.

---

## Usage Map

| Component | Element | Pattern |
|-----------|---------|---------|
| Navbar | "Add Application" button | E |
| Dashboard | Status Distribution card | A |
| Dashboard | Recent Applications card | B (delay 0.1s) |
| Dashboard | Table rows | F |
| ApplicationsList | Each application card | C + D |
| ApplicationDetail | Header card | A |
| ApplicationDetail | Timeline card | B (delay 0.1s) |
| ApplicationDetail | Notes card | B (delay 0.2s) |
| AddApplicationForm | Form card | I (key={step}) |
| AddApplicationForm | Success modal | G |
| AddApplicationForm | Success checkmark | H |
| Analytics | Bar chart card | A |
| Analytics | Line chart card | B (delay 0.1s) |
| Analytics | Pie chart card | B (delay 0.2s) |
| Analytics | Key Metrics card | B (delay 0.3s) |
| KPICard | Card | D |

---

## CSS Transitions (non-Motion)
```css
transition-colors   /* nav items, buttons, dark mode background */
transition-all      /* application cards, progress bar fill */
```

Root div: `transition-colors` for smooth dark/light mode switch.

---

## Common Mistakes
| Bug | Cause | Fix |
|-----|-------|-----|
| `motion` not working | Wrong import | Use `"motion/react"` not `"framer-motion"` |
| Form card not animating | Missing `key` | Add `key={step}` to motion container |
| Spring bounce not bouncing | Missing type | `transition={{ type:"spring" }}` |
| List not staggering | No delay | `transition={{ delay: index * 0.05 }}` |
