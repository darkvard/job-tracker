# Frontend Architecture Reference

## Layer Rules

```
api.ts (axios + JWT interceptor)
  ↓
useQuery / useMutation (React Query — server state ONLY)
  ↓
Components (render only — no fetch, no business logic)

AuthContext → auth state only (token, user, login/logout)
NO Redux · NO Zustand · NO global state beyond AuthContext
```

---

## Folder Structure

```
frontend/src/
├── lib/
│   └── api.ts                    ← ALL axios calls here, nowhere else
│                                    api.auth.{register,login,me}
│                                    api.jobs.{list,get,create,update,updateStatus,delete}
│                                    api.dashboard.getKPIs
│                                    api.analytics.{weekly,funnel,sources,metrics}
├── contexts/
│   └── AuthContext.tsx            ← { user, token, login(), register(), logout(), isAuthenticated }
├── hooks/                         ← custom hooks wrapping useQuery/useMutation
│   ├── useJobs.ts                 ← useJobList(filters), useJob(id), useCreateJob(), ...
│   └── useDashboard.ts            ← useDashboardKPIs(), useAnalytics()
├── components/                    ← shared/reusable (Button, Badge, EmptyState, etc.)
├── app/
│   ├── App.tsx                    ← QueryClientProvider + AuthProvider + Router root
│   ├── ProtectedLayout.tsx        ← auth guard + Navbar + <Outlet>
│   └── pages/                     ← one file per route
│       ├── LoginPage.tsx          ← /login
│       ├── Dashboard.tsx          ← /
│       ├── ApplicationsList.tsx   ← /jobs
│       ├── AddApplicationForm.tsx ← /jobs/new
│       ├── ApplicationDetail.tsx  ← /jobs/:id
│       └── Analytics.tsx          ← /analytics
├── styles/
│   └── theme.css                  ← CSS variables (see DESIGN_SYSTEM.md)
└── main.tsx
```

---

## Component Rules

- **No direct fetch** — always through `api.ts`, never `fetch()`/`axios` in components
- **3 states mandatory** — `isLoading` → `<Skeleton>` · `error` → `<Alert>+Retry` · empty → `<EmptyState>`
- **After every mutation** → `invalidateQueries(['jobs'])` + `invalidateQueries(['dashboard'])`
- **Dark mode** — every `className` needs `dark:` variant (see `DESIGN_SYSTEM.md`)
- **Animations** — `import { motion } from 'motion/react'` (NOT `framer-motion`)
- **UI components** — shadcn/ui for all form elements (`<Input>`, `<Button>`, `<Select>`, `<Dialog>`, `<Tabs>`)

---

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Pages / Components | PascalCase `.tsx` | `ApplicationDetail.tsx` |
| Hooks | `use` prefix, camelCase | `useJobList.ts` |
| API functions | `api.<resource>.<verb>` | `api.jobs.updateStatus` |
| Query keys | `['resource', id?, filters?]` | `['jobs', { status: 'Applied' }]` |

---

## Data Fetching Pattern

```typescript
// hooks/useJobs.ts
export function useJobList(filters: JobFilters) {
  return useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => api.jobs.list(filters),
  });
}

// In component — always handle 3 states
const { data, isLoading, error, refetch } = useJobList(filters);
if (isLoading) return <Skeleton className="h-32 w-full" />;
if (error) return <Alert variant="destructive">Failed — <Button onClick={() => refetch()}>Retry</Button></Alert>;
if (!data?.length) return <EmptyState message="No applications yet" />;
```

## Mutation Pattern

```typescript
// hooks/useJobs.ts
export function useCreateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.jobs.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
```

## AuthContext Pattern

```typescript
// contexts/AuthContext.tsx
const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() => localStorage.getItem('jwt'));
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    const res = await api.auth.login({ email, password });
    localStorage.setItem('jwt', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
  };

  const logout = () => {
    localStorage.removeItem('jwt');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}
```

---

## Stack Versions

| Package | Version | Notes |
|---------|---------|-------|
| React | 18 | |
| Vite | latest | |
| Tailwind CSS | latest | |
| shadcn/ui | latest | `npx shadcn@latest init` |
| @tanstack/react-query | v5 | `useQuery`, `useMutation` |
| axios | latest | single instance in `api.ts` |
| react-router-dom | v6 | `<Outlet>`, `useNavigate`, `useLocation` |
| motion/react | latest | NOT `framer-motion` |
| recharts | latest | Bar, Line, Pie charts |
| Node.js | 24 | (docker-compose + CI) |
