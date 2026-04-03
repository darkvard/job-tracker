import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Search, Briefcase, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api, type Job, type JobFilters } from '@/lib/api'
import StatusBadge from '@/components/StatusBadge'
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

// Status filter values stay in English (API contract)
const STATUS_FILTER_VALUES = ['All', 'Applied', 'Interview', 'Offer', 'Rejected']
const PAGE_SIZE = 12

function ApplicationCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
      </div>
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4" />
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
      </div>
    </div>
  )
}

function ApplicationCard({ job, index, onDelete, onView }: { job: Job; index: number; onDelete: (id: number) => void; onView: (id: number) => void }) {
  const { t } = useTranslation()
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
      onClick={() => onView(job.id)}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
          {job.company.charAt(0)}
        </div>
        <StatusBadge status={job.status} size="sm" />
      </div>

      <p className="font-semibold text-gray-900 dark:text-white mb-1">{job.company}</p>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{job.role}</p>

      <div className="space-y-1.5 text-sm">
        {job.location && (
          <div className="flex items-center justify-between">
            <span className="text-gray-500 dark:text-gray-500">{t('jobs.location')}</span>
            <span className="text-gray-700 dark:text-gray-300 truncate ml-2 max-w-[60%] text-right">{job.location}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-gray-500 dark:text-gray-500">{t('jobs.source')}</span>
          <span className="text-gray-700 dark:text-gray-300">{job.source}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500 dark:text-gray-500">{t('jobs.applied')}</span>
          <span className="text-gray-700 dark:text-gray-300">
            {new Date(job.dateApplied).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              aria-label="Delete application"
            >
              <Trash2 className="w-4 h-4" />
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
    </motion.div>
  )
}

export default function ApplicationsList() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { t } = useTranslation()
  const [statusFilter, setStatusFilter] = useState('All')
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)

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
    page,
    page_size: PAGE_SIZE,
    ...(statusFilter !== 'All' && { status: statusFilter }),
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
    },
  })

  const jobs = data?.data ?? []
  const meta = data?.meta
  const totalPages = meta?.totalPages ?? 1

  // Map filter value → display label
  function getFilterLabel(value: string) {
    if (value === 'All') return t('jobs.filterAll')
    return t(`status.${value.toLowerCase()}`)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">{t('jobs.title')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{t('jobs.subtitle')}</p>
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

        {/* Status pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 flex-shrink-0">
          {STATUS_FILTER_VALUES.map((status) => (
            <button
              key={status}
              onClick={() => handleStatusFilter(status)}
              className={
                statusFilter === status
                  ? 'px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white whitespace-nowrap'
                  : 'px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 whitespace-nowrap transition-colors'
              }
            >
              {getFilterLabel(status)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

          {/* Pagination */}
          {totalPages > 1 && (
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
