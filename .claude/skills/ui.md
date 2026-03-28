# Skill: React UI Changes

## Before any change
1. `make test-ui` → baseline (must pass)
2. `docs/UI_SPEC.md` → component structure
3. `docs/DESIGN_SYSTEM.md` → colors/tokens

## Data fetching
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['applications', filters],
  queryFn: () => api.jobs.list(filters),
});
// Always handle 3 states:
if (isLoading) return <Skeleton className="h-32 w-full" />;
if (error) return <Alert variant="destructive">Failed — <Button onClick={() => refetch()}>Retry</Button></Alert>;
if (!data?.length) return <EmptyState message="No applications yet" />;
```

## Mutations — always invalidate
```typescript
const mutation = useMutation({
  mutationFn: api.jobs.create,
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['applications'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
  },
});
```

## Animation — motion/react only
```typescript
import { motion } from 'motion/react'; // NOT framer-motion
// Entry: initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
// List stagger: transition={{ delay: index * 0.05 }}
// Hover card: whileHover={{ y:-4 }}  Button: whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
```

## Dark mode — never skip
```typescript
className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700"
```

## Checklist
- [ ] `make test-ui` green before + after
- [ ] React Query — no direct fetch
- [ ] 3 states: loading / error / empty
- [ ] `dark:` on every className
- [ ] Responsive: 375px · 768px · 1280px
- [ ] `motion/react` (not framer-motion)
