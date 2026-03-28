# Backend API Specification

**Base URL:** `http://localhost:3001/api/v1`
**Auth:** `Authorization: Bearer <jwt>` on all protected routes
**Content-Type:** `application/json`
**Date format:** `YYYY-MM-DD` for dates · ISO 8601 for timestamps

---

## Error Format (all errors)
```json
{
  "success": false,
  "error": { "code": "SNAKE_CASE_CODE", "message": "human-readable message" }
}
```

| HTTP | Code | Trigger |
|------|------|---------|
| 400 | `BAD_REQUEST` | Invalid JSON |
| 400 | `INVALID_INPUT` | Field validation failed |
| 401 | `UNAUTHORIZED` | Missing/invalid token (middleware) |
| 403 | `UNAUTHORIZED` | Token valid but wrong user (domain) |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `ALREADY_EXISTS` | Duplicate (email) |
| 422 | `INVALID_STATUS` | Invalid status transition |
| 500 | `INTERNAL` | Server error |

---

## Health

### GET /health
```json
{ "success": true, "data": { "status": "ok", "version": "1.0.0" } }
```
No auth required.

---

## Auth

### POST /auth/register
**Body:** `{ "email": "user@example.com", "password": "min8chars", "name": "John Doe" }`
**201:**
```json
{
  "success": true,
  "data": {
    "token": "eyJ...",
    "user": { "id": 1, "email": "user@example.com", "name": "John Doe", "createdAt": "2026-03-28T10:00:00Z" }
  }
}
```
**Errors:** 400 `INVALID_INPUT` (validation) · 409 `ALREADY_EXISTS` (email exists)

---

### POST /auth/login
**Body:** `{ "email": "...", "password": "..." }`
**200:** Same shape as register (`success` + `data.token` + `data.user`)
**Errors:** 400 `INVALID_INPUT` · 401 `UNAUTHORIZED` (wrong password)

---

### GET /auth/me `[protected]`
**200:**
```json
{ "success": true, "data": { "id": 1, "email": "user@example.com", "name": "John Doe", "createdAt": "..." } }
```

---

## Jobs

### POST /jobs `[protected]`
**Body:**
```json
{
  "company": "Google",
  "role": "Senior Product Designer",
  "status": "Applied",
  "dateApplied": "2026-03-28",
  "location": "San Francisco, CA",
  "source": "LinkedIn",
  "notes": "Applied through LinkedIn Easy Apply."
}
```
**Validation:**
- `company`: required, 1–100 chars
- `role`: required, 1–200 chars
- `status`: required, one of `Applied|Interview|Offer|Rejected`
- `dateApplied`: required, valid date
- `source`: required, one of `LinkedIn|Company Site|Referral|Indeed|Glassdoor|Other`
- `location`, `notes`: optional

**201:**
```json
{
  "success": true,
  "data": {
    "id": 1, "userId": 1, "company": "Google", "role": "Senior Product Designer",
    "status": "Applied", "dateApplied": "2026-03-28", "location": "San Francisco, CA",
    "source": "LinkedIn", "notes": "...", "createdAt": "...", "updatedAt": "..."
  }
}
```

---

### GET /jobs `[protected]`
**Query params:**
| Param | Type | Default | Example |
|-------|------|---------|---------|
| `status` | string | (all) | `Applied` |
| `search` | string | — | `Google` |
| `page` | int | `1` | `2` |
| `page_size` | int | `20` | `10` |
| `sort_by` | string | `created_at` | `date_applied` |
| `sort_order` | string | `desc` | `asc` |

**200:**
```json
{
  "success": true,
  "data": [{ /* job objects */ }],
  "meta": { "total": 8, "page": 1, "pageSize": 20, "totalPages": 1 }
}
```

---

### GET /jobs/:id `[protected]`
**200:**
```json
{
  "success": true,
  "data": {
    "id": 1, "company": "Google", "role": "...", "status": "Interview",
    "dateApplied": "2026-03-28", "location": "...", "source": "LinkedIn", "notes": "...",
    "statusHistory": [
      { "id": 1, "fromStatus": null, "toStatus": "Applied", "changedAt": "2026-03-28T10:00:00Z", "note": "" },
      { "id": 2, "fromStatus": "Applied", "toStatus": "Interview", "changedAt": "2026-04-01T14:00:00Z", "note": "Phone screen" }
    ],
    "createdAt": "...", "updatedAt": "..."
  }
}
```
**Errors:** 403 `UNAUTHORIZED` (not owner) · 404 `NOT_FOUND`

---

### PUT /jobs/:id `[protected]`
**Body:** All job fields (full replace). Same validation as POST.
**200:** `{ "success": true, "data": { /* updated job */ } }`

---

### PATCH /jobs/:id/status `[protected]`
**Body:**
```json
{ "status": "Interview", "note": "Phone screen scheduled" }
```
**Validation:** `status` must be a valid transition from current status.
**200:** `{ "success": true, "data": { /* updated job */ } }`
**Errors:** 422 `INVALID_STATUS` for invalid transitions

**Valid transitions:**
- Applied → Interview ✓
- Applied → Rejected ✓
- Interview → Offer ✓
- Interview → Rejected ✓
- Offer → anything ✗
- Rejected → anything ✗

---

### DELETE /jobs/:id `[protected]`
**200:** `{ "success": true, "data": { "message": "deleted" } }`
**Errors:** 403 `UNAUTHORIZED` · 404 `NOT_FOUND`

---

## Dashboard

### GET /dashboard/kpis `[protected]`
Cached per user, TTL 5 minutes (Redis key: `dashboard:<userID>`).

**200:**
```json
{
  "success": true,
  "data": {
    "total": 8, "applied": 4, "interview": 3, "offer": 1, "rejected": 1,
    "trends": {
      "total":     { "value": 12, "isPositive": true },
      "interview": { "value": 8,  "isPositive": true },
      "offer":     { "value": 25, "isPositive": true },
      "rejected":  { "value": 5,  "isPositive": false }
    },
    "statusBreakdown": [
      { "status": "Applied",   "count": 4, "color": "#3b82f6" },
      { "status": "Interview", "count": 3, "color": "#f97316" },
      { "status": "Offer",     "count": 1, "color": "#22c55e" },
      { "status": "Rejected",  "count": 1, "color": "#ef4444" }
    ],
    "recentJobs": [
      { "id": 1, "company": "Google", "role": "...", "status": "Interview", "dateApplied": "2026-03-28" }
    ]
  }
}
```
`trends` = percentage change vs same metrics in the previous calendar month.

---

## Analytics

All analytics endpoints: cached per user, TTL 10 minutes.

### GET /analytics/weekly `[protected]`
```json
{
  "success": true,
  "data": [
    { "week": "Week 1", "applications": 5,  "startDate": "2026-03-01" },
    { "week": "Week 2", "applications": 8,  "startDate": "2026-03-08" },
    { "week": "Week 3", "applications": 12, "startDate": "2026-03-15" },
    { "week": "Week 4", "applications": 7,  "startDate": "2026-03-22" },
    { "week": "Week 5", "applications": 15, "startDate": "2026-03-29" },
    { "week": "Week 6", "applications": 10, "startDate": "2026-04-05" }
  ],
  "trend": { "value": 23, "isPositive": true }
}
```

### GET /analytics/funnel `[protected]`
```json
{
  "success": true,
  "data": [
    { "name": "Applied",   "value": 8,  "rate": 100.0 },
    { "name": "Interview", "value": 3,  "rate": 37.5  },
    { "name": "Offer",     "value": 1,  "rate": 12.5  }
  ]
}
```

### GET /analytics/sources `[protected]`
```json
{
  "success": true,
  "data": [
    { "source": "LinkedIn",     "count": 3, "percentage": 37.5 },
    { "source": "Company Site", "count": 2, "percentage": 25.0 },
    { "source": "Referral",     "count": 2, "percentage": 25.0 },
    { "source": "Indeed",       "count": 1, "percentage": 12.5 },
    { "source": "Glassdoor",    "count": 0, "percentage": 0    },
    { "source": "Other",        "count": 0, "percentage": 0    }
  ]
}
```

### GET /analytics/metrics `[protected]`
```json
{
  "success": true,
  "data": {
    "interviewRate":   37.5,
    "offerRate":       12.5,
    "rejectionRate":   12.5,
    "avgResponseDays": 5.2
  }
}
```
`avgResponseDays`: average days from `dateApplied` to first status change. Returns 5.2 if no data.

---

## Pagination pattern
```json
// Request: GET /jobs?page=2&page_size=10
// Response:
{
  "success": true,
  "data": [...],
  "meta": {
    "total": 35,
    "page": 2,
    "pageSize": 10,
    "totalPages": 4
  }
}
```

---

## Frontend API Client (src/lib/api.ts)
```typescript
import axios from 'axios';

const client = axios.create({ baseURL: import.meta.env.VITE_API_URL });

client.interceptors.request.use(config => {
  const token = localStorage.getItem('jwt');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const api = {
  auth: {
    register: (data) => client.post('/auth/register', data).then(r => r.data),
    login: (data) => client.post('/auth/login', data).then(r => r.data),
    me: () => client.get('/auth/me').then(r => r.data),
  },
  jobs: {
    list: (params?) => client.get('/jobs', { params }).then(r => r.data),
    get: (id) => client.get(`/jobs/${id}`).then(r => r.data),
    create: (data) => client.post('/jobs', data).then(r => r.data),
    update: (id, data) => client.put(`/jobs/${id}`, data).then(r => r.data),
    updateStatus: (id, data) => client.patch(`/jobs/${id}/status`, data).then(r => r.data),
    delete: (id) => client.delete(`/jobs/${id}`).then(r => r.data),
  },
  dashboard: {
    getKPIs: () => client.get('/dashboard/kpis').then(r => r.data),
  },
  analytics: {
    weekly: () => client.get('/analytics/weekly').then(r => r.data),
    funnel: () => client.get('/analytics/funnel').then(r => r.data),
    sources: () => client.get('/analytics/sources').then(r => r.data),
    metrics: () => client.get('/analytics/metrics').then(r => r.data),
  },
};
```
