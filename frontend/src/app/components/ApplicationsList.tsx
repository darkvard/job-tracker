import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Search, Briefcase, ChevronLeft, ChevronRight, Trash2, LayoutGrid, List, Clock, CalendarDays } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api, type Job, type JobFilters } from '@/lib/api'
import StatusBadge from '@/components/StatusBadge'
import { useToast } from '@/contexts/ToastContext'
import KanbanView from '@/app/components/KanbanView'
import CalendarView from '@/app/components/CalendarView'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'

// Status filter values stay in English (API contract). 'Upcoming' is client-side only.
const STATUS_FILTER_VALUES = ['All', 'Applied', 'Interview', 'Offer', 'Rejected', 'Upcoming']
const PAGE_SIZE = 12
const KANBAN_PAGE_SIZE = 999
const UPCOMING_DAYS = 7

function daysUntil(dateStr: string): number {
  const d = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function ApplicationCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden animate-pulse">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-1.5" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
        <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />
      </div>
      <div className="px-4 pb-3 pt-2 border-t border-gray-100 dark:border-gray-700 space-y-1.5">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
      </div>
    </div>
  )
}

function ApplicationCard({
  job,
  index,
  onDelete,
  onView,
}: {
  job: Job
  index: number
  onDelete: (id: number) => void
  onView: (id: number) => void
}) {
  const { t } = useTranslation()
  const dateStr = new Date(job.dateApplied).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  // Days remaining until interview date
  const daysLeft =
    job.interviewDate
      ? (() => { const d = daysUntil(job.interviewDate); return d >= 0 && d <= UPCOMING_DAYS ? d : null })()
      : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ y: -2, boxShadow: '0 6px 20px rgba(0,0,0,0.08)' }}
      onClick={() => onView(job.id)}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer select-none overflow-hidden"
    >
      {/* Header: avatar + company/role + status icon */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-3">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-base flex-shrink-0">
          {job.company.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{job.company}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{job.role}</p>
        </div>
        <StatusBadge status={job.status} size="icon" />
      </div>

      {/* Footer: location + source/date + countdown + delete */}
      <div
        className="px-4 pb-3 pt-2 border-t border-gray-100 dark:border-gray-700 space-y-1"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {job.location && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{job.location}</p>
        )}
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1">{job.source}</p>
          {daysLeft !== null && (
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                daysLeft === 0
                  ? 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                  : daysLeft <= 2
                    ? 'bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400'
                    : 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
              }`}
            >
              <Clock className="w-2.5 h-2.5" />
              {daysLeft === 0 ? t('jobs.today') : `${daysLeft}d`}
            </span>
          )}
          <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{dateStr}</span>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className="p-1 rounded text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex-shrink-0"
                aria-label="Delete application"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('jobs.deleteTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('jobs.deleteConfirmMsg', { company: job.company, role: job.role })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(job.id)}>{t('common.delete')}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </motion.div>
  )
}

export default function ApplicationsList() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { t } = useTranslation()
  const toast = useToast()
  const [searchParams] = useSearchParams()
  // Initialize status filter from URL param (e.g. from Dashboard card click)
  const [statusFilter, setStatusFilter] = useState(() => {
    const s = searchParams.get('status')
    return s && STATUS_FILTER_VALUES.includes(s) ? s : 'All'
  })
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'calendar'>('list')

  const isUpcomingFilter = statusFilter === 'Upcoming'
  const isCalendarOrKanban = viewMode === 'kanban' || viewMode === 'calendar'

  // Debounce search 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Reset page when filter changes
  const handleStatusFilter = useCallback((status: string) => {
    setStatusFilter(status)
    setPage(1)
  }, [])

  const filters: JobFilters = {
    page: isCalendarOrKanban || isUpcomingFilter ? 1 : page,
    page_size: isCalendarOrKanban || isUpcomingFilter ? KANBAN_PAGE_SIZE : PAGE_SIZE,
    // Upcoming filter: fetch all, filter client-side by interviewDate
    ...(viewMode === 'list' && statusFilter !== 'All' && !isUpcomingFilter && { status: statusFilter }),
    ...(debouncedSearch && { search: debouncedSearch }),
  }

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => api.jobs.list(filters),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.jobs.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast(t('toast.deleteSuccess'), 'success')
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? t('jobs.somethingWentWrong')
      toast(msg, 'error')
    },
  })

  const allJobs = data?.data ?? []
  const meta = data?.meta
  const totalPages = meta?.totalPages ?? 1

  // Client-side filter for Upcoming: jobs with interviewDate within UPCOMING_DAYS
  const jobs = isUpcomingFilter
    ? allJobs.filter((j) => {
        if (!j.interviewDate) return false
        const d = daysUntil(j.interviewDate)
        return d >= 0 && d <= UPCOMING_DAYS
      })
    : allJobs

  function getFilterLabel(value: string) {
    if (value === 'All') return t('jobs.filterAll')
    if (value === 'Upcoming') return t('jobs.filterUpcoming')
    return t(`status.${value.toLowerCase()}`)
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">{t('jobs.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{t('jobs.subtitle')}</p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1 flex-shrink-0">
          <button
            onClick={() => setViewMode('list')}
            title={t('kanban.listView')}
            aria-label={t('kanban.listView')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'list'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            title={t('kanban.kanbanView')}
            aria-label={t('kanban.kanbanView')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'kanban'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            title={t('calendar.title')}
            aria-label={t('calendar.title')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'calendar'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('jobs.searchPlaceholder')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>

        {/* Status pills — only shown in list mode */}
        {viewMode === 'list' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 flex-shrink-0">
            {STATUS_FILTER_VALUES.map((status) => (
              <button
                key={status}
                onClick={() => handleStatusFilter(status)}
                className={
                  statusFilter === status
                    ? status === 'Upcoming'
                      ? 'px-4 py-2 rounded-lg text-sm font-medium bg-amber-500 text-white whitespace-nowrap'
                      : 'px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white whitespace-nowrap'
                    : 'px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 whitespace-nowrap transition-colors'
                }
              >
                {getFilterLabel(status)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      {viewMode === 'kanban' && !isLoading && !error ? (
        <KanbanView jobs={allJobs} />
      ) : viewMode === 'calendar' && !isLoading && !error ? (
        <CalendarView jobs={allJobs} />
      ) : isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <ApplicationCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <p className="text-red-700 dark:text-red-400 mb-4">{t('jobs.failedToLoad')}</p>
          <button
            onClick={() => refetch()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {t('common.retry')}
          </button>
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm text-center py-12">
          <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{t('jobs.noApplicationsFound')}</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            {debouncedSearch || statusFilter !== 'All'
              ? t('jobs.tryAdjustingFilters')
              : t('jobs.startTracking')}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {jobs.map((job, index) => (
              <ApplicationCard
                key={job.id}
                job={job}
                index={index}
                onDelete={(id) => deleteMutation.mutate(id)}
                onView={(id) => navigate(`/jobs/${id}`)}
              />
            ))}
          </div>

          {/* Pagination — hidden for Upcoming (all results shown) */}
          {!isUpcomingFilter && totalPages > 1 && (
            <div className="flex items-center justify-between mt-8">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {meta && t('jobs.showing', {
                  from: (page - 1) * PAGE_SIZE + 1,
                  to: Math.min(page * PAGE_SIZE, meta.total),
                  total: meta.total,
                })}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                      if (idx > 0 && (arr[idx - 1] as number) < p - 1) acc.push('...')
                      acc.push(p)
                      return acc
                    }, [])
                    .map((p, idx) =>
                      p === '...' ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 dark:text-gray-600">
                          …
                        </span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={
                            page === p
                              ? 'w-9 h-9 rounded-lg bg-indigo-600 text-white text-sm font-medium'
                              : 'w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm transition-colors'
                          }
                        >
                          {p}
                        </button>
                      ),
                    )}
                </div>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
