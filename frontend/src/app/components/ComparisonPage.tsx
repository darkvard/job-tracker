import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { ArrowLeft, Trophy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api, type CompareJob } from '@/lib/api'
import StatusBadge from '@/components/StatusBadge'

function formatCurrency(val: number): string {
  if (val === 0) return '—'
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`
  return String(val)
}

function SkeletonCol() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      ))}
    </div>
  )
}

export default function ComparisonPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const rawIds = searchParams.get('ids') ?? ''
  const ids = rawIds
    .split(',')
    .map((s) => parseInt(s.trim()))
    .filter((n) => !isNaN(n))

  const { data, isLoading, error } = useQuery({
    queryKey: ['compare', ids.join(',')],
    queryFn: () => api.jobs.compare(ids),
    enabled: ids.length >= 2,
  })

  const jobs: CompareJob[] = data?.data ?? []

  // Find best index for a numeric field (highest wins)
  function bestIdx(getter: (j: CompareJob) => number): number {
    if (jobs.length === 0) return -1
    let best = 0
    jobs.forEach((j, i) => { if (getter(j) > getter(jobs[best])) best = i })
    return best
  }

  const bestTotalComp = bestIdx((j) => j.totalComp)
  const bestBenefits = bestIdx((j) => j.benefitsScore)
  const bestOverall = bestIdx((j) => j.overallScore)

  const rows: { labelKey: string; render: (j: CompareJob, isBest: boolean) => React.ReactNode; bestIdx: number }[] = [
    {
      labelKey: 'compare.totalComp',
      bestIdx: bestTotalComp,
      render: (j, isBest) => (
        <span className={isBest ? 'font-semibold text-indigo-600 dark:text-indigo-400' : ''}>
          {formatCurrency(j.totalComp)}
        </span>
      ),
    },
    {
      labelKey: 'compare.salary',
      bestIdx: bestIdx((j) => j.salary ?? 0),
      render: (j, isBest) => (
        <span className={isBest ? 'font-semibold text-indigo-600 dark:text-indigo-400' : ''}>
          {j.salary ? formatCurrency(j.salary) : '—'}
        </span>
      ),
    },
    {
      labelKey: 'compare.benefitsScore',
      bestIdx: bestBenefits,
      render: (j, isBest) => (
        <span className={isBest ? 'font-semibold text-indigo-600 dark:text-indigo-400' : ''}>
          {j.benefitsScore}/6
        </span>
      ),
    },
    {
      labelKey: 'compare.overallScore',
      bestIdx: bestOverall,
      render: (j, isBest) => (
        <span className={isBest ? 'font-semibold text-indigo-600 dark:text-indigo-400' : ''}>
          {j.overallScore.toFixed(1)}
        </span>
      ),
    },
    {
      labelKey: 'compare.workType',
      bestIdx: -1,
      render: (j) => <span>{j.workType ?? 'Onsite'}</span>,
    },
    {
      labelKey: 'compare.noSaturday',
      bestIdx: -1,
      render: (j) => (
        <span className={j.noSaturday ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-400 dark:text-gray-600'}>
          {j.noSaturday ? '✓' : '✗'}
        </span>
      ),
    },
    {
      labelKey: 'compare.noForcedOt',
      bestIdx: -1,
      render: (j) => (
        <span className={j.noForcedOt ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-400 dark:text-gray-600'}>
          {j.noForcedOt ? '✓' : '✗'}
        </span>
      ),
    },
    {
      labelKey: 'compare.status',
      bestIdx: -1,
      render: (j) => <StatusBadge status={j.status} size="sm" />,
    },
  ]

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <button
          onClick={() => navigate('/jobs')}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('compare.backToJobs')}
        </button>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">{t('compare.title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{t('compare.subtitle')}</p>
      </motion.div>

      {/* Invalid state */}
      {ids.length < 2 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-6 text-center">
          <p className="text-amber-700 dark:text-amber-400">{t('compare.selectToCompare')}</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <p className="text-red-700 dark:text-red-400">{t('compare.failedToLoad')}</p>
        </div>
      )}

      {/* Loading */}
      {isLoading && ids.length >= 2 && (
        <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${ids.length}, 1fr)` }}>
          <div />
          {ids.map((id) => <SkeletonCol key={id} />)}
        </div>
      )}

      {/* Comparison table */}
      {!isLoading && !error && jobs.length >= 2 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          {/* Column headers */}
          <div
            className="grid gap-4 mb-4"
            style={{ gridTemplateColumns: `200px repeat(${jobs.length}, 1fr)` }}
          >
            <div />
            {jobs.map((job, i) => (
              <div
                key={job.id}
                className={`rounded-xl p-4 text-center ${
                  i === bestOverall
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border-2 border-indigo-400 dark:border-indigo-600'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {i === bestOverall && (
                  <div className="flex items-center justify-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
                    <Trophy className="w-3.5 h-3.5" />
                    {t('compare.bestValue')}
                  </div>
                )}
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-base mx-auto mb-2">
                  {job.company.charAt(0)}
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{job.company}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-3">{job.role}</p>
                <button
                  onClick={() => navigate(`/jobs?open=${job.id}`)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {t('compare.viewDetails')}
                </button>
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {rows.map((row, rowIdx) => (
              <div
                key={row.labelKey}
                className={`grid gap-4 px-4 py-3 ${
                  rowIdx % 2 === 0
                    ? 'bg-gray-50 dark:bg-gray-900/40'
                    : 'bg-white dark:bg-gray-800'
                }`}
                style={{ gridTemplateColumns: `200px repeat(${jobs.length}, 1fr)` }}
              >
                <span className="text-sm text-gray-500 dark:text-gray-400 self-center">
                  {t(row.labelKey)}
                </span>
                {jobs.map((job, colIdx) => (
                  <div key={job.id} className="flex justify-center items-center text-sm text-gray-900 dark:text-white">
                    {row.render(job, colIdx === row.bestIdx)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
