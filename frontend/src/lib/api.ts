import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL as string,
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export interface User {
  id: number
  email: string
  name: string
  createdAt: string
  currentLocation?: string
  currentRole?: string
  currentCompany?: string
  currentSalary?: number
  salaryCurrency: string
}

export interface UpdateProfilePayload {
  name: string
  currentLocation?: string | null
  currentRole?: string | null
  currentCompany?: string | null
  currentSalary?: number | null
  salaryCurrency: string
}

export interface Job {
  id: number
  userId: number
  company: string
  role: string
  status: string
  dateApplied: string
  location?: string
  source: string
  notes?: string
  statusHistory?: StatusHistory[]
  createdAt: string
  updatedAt: string
}

export interface StatusHistory {
  id: number
  fromStatus: string | null
  toStatus: string
  changedAt: string
  note: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  meta: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

export interface ApiResponse<T> {
  success: boolean
  data: T
}

export interface JobFilters {
  status?: string
  search?: string
  page?: number
  page_size?: number
  sort_by?: string
  sort_order?: string
}

export interface DashboardKPIs {
  total: number
  applied: number
  interview: number
  offer: number
  rejected: number
  trends: {
    total: { value: number; isPositive: boolean }
    interview: { value: number; isPositive: boolean }
    offer: { value: number; isPositive: boolean }
    rejected: { value: number; isPositive: boolean }
  }
  statusBreakdown: { status: string; count: number; color: string }[]
  recentJobs: { id: number; company: string; role: string; status: string; dateApplied: string }[]
}

export interface WeeklyData {
  week: string
  applications: number
  startDate: string
}

// WeeklyApiResponse matches the non-standard backend shape:
// { success, data: [...], trend: {...} } — trend is at the root, not nested inside data
export interface WeeklyApiResponse {
  success: boolean
  data: WeeklyData[]
  trend: { value: number; isPositive: boolean }
}

export interface FunnelData {
  name: string
  value: number
  rate: number
}

export interface SourceData {
  source: string
  count: number
  percentage: number
}

export interface KeyMetrics {
  interviewRate: number
  offerRate: number
  rejectionRate: number
  avgResponseDays: number
}

export const api = {
  auth: {
    register: (data: { email: string; password: string; name: string }) =>
      client.post<ApiResponse<{ token: string; user: User }>>('/auth/register', data).then((r) => r.data),
    login: (data: { email: string; password: string }) =>
      client.post<ApiResponse<{ token: string; user: User }>>('/auth/login', data).then((r) => r.data),
    me: () => client.get<ApiResponse<User>>('/auth/me').then((r) => r.data),
    updateProfile: (data: UpdateProfilePayload) =>
      client.put<ApiResponse<User>>('/auth/me', data).then((r) => r.data),
  },
  jobs: {
    list: (params?: JobFilters) =>
      client.get<PaginatedResponse<Job>>('/jobs', { params }).then((r) => r.data),
    get: (id: number) =>
      client.get<ApiResponse<Job>>(`/jobs/${id}`).then((r) => r.data),
    create: (data: Partial<Job>) =>
      client.post<ApiResponse<Job>>('/jobs', data).then((r) => r.data),
    update: (id: number, data: Partial<Job>) =>
      client.put<ApiResponse<Job>>(`/jobs/${id}`, data).then((r) => r.data),
    updateStatus: (id: number, data: { status: string; note?: string }) =>
      client.patch<ApiResponse<Job>>(`/jobs/${id}/status`, data).then((r) => r.data),
    delete: (id: number) =>
      client.delete<ApiResponse<{ message: string }>>(`/jobs/${id}`).then((r) => r.data),
  },
  dashboard: {
    getKPIs: () =>
      client.get<ApiResponse<DashboardKPIs>>('/dashboard/kpis').then((r) => r.data),
  },
  analytics: {
    weekly: () =>
      client.get<WeeklyApiResponse>('/analytics/weekly').then((r) => r.data),
    funnel: () =>
      client.get<ApiResponse<FunnelData[]>>('/analytics/funnel').then((r) => r.data),
    sources: () =>
      client.get<ApiResponse<SourceData[]>>('/analytics/sources').then((r) => r.data),
    metrics: () =>
      client.get<ApiResponse<KeyMetrics>>('/analytics/metrics').then((r) => r.data),
  },
}
