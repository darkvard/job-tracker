import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { TrendingUp } from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { api } from '@/lib/api'

const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: '#1f2937',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
  },
}

const SOURCE_COLORS = ['#6366f1', '#f97316', '#22c55e', '#ef4444', '#8b5cf6']

function ChartSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse">
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-1" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-6" />
      <div className="h-64 bg-gray-100 dark:bg-gray-700/50 rounded-lg" />
    </div>
  )
}

function ChartError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="h-64 flex flex-col items-center justify-center gap-3">
        <p className="text-gray-500 dark:text-gray-400 text-sm">Failed to load chart data</p>
        <button
          onClick={onRetry}
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Retry
        </button>
      </div>
    </div>
  )
}

export default function Analytics() {
  const weekly = useQuery({
    queryKey: ['analytics', 'weekly'],
    queryFn: () => api.analytics.weekly(),
  })

  const funnel = useQuery({
    queryKey: ['analytics', 'funnel'],
    queryFn: () => api.analytics.funnel(),
  })

  const sources = useQuery({
    queryKey: ['analytics', 'sources'],
    queryFn: () => api.analytics.sources(),
  })

  const metrics = useQuery({
    queryKey: ['analytics', 'metrics'],
    queryFn: () => api.analytics.metrics(),
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Analytics</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Insights into your job search performance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1 — Applications per Week (BarChart) */}
        {weekly.isLoading ? (
          <ChartSkeleton />
        ) : weekly.error ? (
          <ChartError onRetry={() => weekly.refetch()} />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Applications per Week
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Last 6 weeks</p>
              </div>
              {weekly.data?.trend && (
                <span
                  className={`flex items-center gap-1 text-sm font-medium px-2.5 py-1 rounded-full ${
                    weekly.data.trend.isPositive
                      ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400'
                      : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  {weekly.data.trend.isPositive ? '+' : ''}
                  {weekly.data.trend.value}%
                </span>
              )}
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekly.data?.data ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Bar dataKey="applications" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Chart 2 — Interview Conversion (LineChart) */}
        {funnel.isLoading ? (
          <ChartSkeleton />
        ) : funnel.error ? (
          <ChartError onRetry={() => funnel.refetch()} />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Interview Conversion
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Applied → Interview → Offer</p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={funnel.data?.data ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={{ fill: '#6366f1', r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Chart 3 — Source Performance (PieChart) */}
        {sources.isLoading ? (
          <ChartSkeleton />
        ) : sources.error ? (
          <ChartError onRetry={() => sources.refetch()} />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Source Performance
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Applications by source
              </p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={(sources.data?.data ?? []).filter((s) => s.count > 0)}
                    dataKey="count"
                    nameKey="source"
                    outerRadius={80}
                    label={({ source, percent }: { source: string; percent: number }) =>
                      `${source} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {(sources.data?.data ?? [])
                      .filter((s) => s.count > 0)
                      .map((_, idx) => (
                        <Cell key={idx} fill={SOURCE_COLORS[idx % SOURCE_COLORS.length]} />
                      ))}
                  </Pie>
                  <Tooltip {...TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Chart 4 — Key Metrics */}
        {metrics.isLoading ? (
          <ChartSkeleton />
        ) : metrics.error ? (
          <ChartError onRetry={() => metrics.refetch()} />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Key Metrics</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Conversion rates</p>
            </div>
            <div className="space-y-5">
              {[
                {
                  label: 'Interview Rate',
                  value: metrics.data?.data?.interviewRate ?? 0,
                  color: 'bg-indigo-600',
                },
                {
                  label: 'Offer Rate',
                  value: metrics.data?.data?.offerRate ?? 0,
                  color: 'bg-green-500',
                },
                {
                  label: 'Rejection Rate',
                  value: metrics.data?.data?.rejectionRate ?? 0,
                  color: 'bg-red-500',
                },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {label}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {value.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className={`h-2 rounded-full ${color} transition-all`}
                      style={{ width: `${Math.min(value, 100)}%` }}
                    />
                  </div>
                </div>
              ))}

              {metrics.data?.data && (
                <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Avg. Response Time
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {metrics.data.data.avgResponseDays.toFixed(1)} days
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
