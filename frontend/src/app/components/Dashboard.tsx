import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Briefcase, Users, CircleCheck, X, TrendingUp, ArrowUpRight } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, type PieProps } from 'recharts'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/api'
import KPICard from '@/components/KPICard'
import StatusBadge from '@/components/StatusBadge'
import { useTheme } from '@/contexts/ThemeContext'

function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 h-32" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 h-80" />
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 h-80" />
      </div>
    </div>
  )
}

function EmptyDashboard() {
  const { t } = useTranslation()
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">{t('dashboard.title')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{t('dashboard.subtitle')}</p>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm text-center py-12">
        <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">{t('dashboard.noApplications')}</p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">{t('dashboard.startTracking')}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const { t } = useTranslation()
  const isDark = theme === 'dark'
  const tooltipProps = {
    contentStyle: {
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      border: isDark ? 'none' : '1px solid #e5e7eb',
      borderRadius: '8px',
    },
    labelStyle: { color: isDark ? '#ffffff' : '#111827' },
    itemStyle: { color: isDark ? '#d1d5db' : '#374151' },
  }
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.dashboard.getKPIs(),
  })

  if (isLoading) return <DashboardSkeleton />

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <p className="text-red-700 dark:text-red-400 mb-4">{t('dashboard.failedToLoad')}</p>
          <button
            onClick={() => refetch()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {t('common.retry')}
          </button>
        </div>
      </div>
    )
  }

  const kpis = data?.data
  if (!kpis || kpis.total === 0) return <EmptyDashboard />

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">{t('dashboard.title')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{t('dashboard.subtitle')}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title={t('dashboard.totalApplications')}
          value={kpis.total}
          icon={Briefcase}
          bgColor="bg-blue-100 dark:bg-blue-950/50"
          iconColor="text-blue-600 dark:text-blue-400"
          trend={kpis.trends.total}
          onClick={() => navigate('/jobs')}
        />
        <KPICard
          title={t('dashboard.interviews')}
          value={kpis.interview}
          icon={Users}
          bgColor="bg-orange-100 dark:bg-orange-950/50"
          iconColor="text-orange-600 dark:text-orange-400"
          trend={kpis.trends.interview}
          onClick={() => navigate('/jobs?status=Interview')}
        />
        <KPICard
          title={t('dashboard.offers')}
          value={kpis.offer}
          icon={CircleCheck}
          bgColor="bg-green-100 dark:bg-green-950/50"
          iconColor="text-green-600 dark:text-green-400"
          trend={kpis.trends.offer}
          onClick={() => navigate('/jobs?status=Offer')}
        />
        <KPICard
          title={t('dashboard.rejected')}
          value={kpis.rejected}
          icon={X}
          bgColor="bg-red-100 dark:bg-red-950/50"
          iconColor="text-red-600 dark:text-red-400"
          trend={kpis.trends.rejected}
          onClick={() => navigate('/jobs?status=Rejected')}
        />
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('dashboard.statusDistribution')}</h2>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={kpis.statusBreakdown}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  className="cursor-pointer"
                  onClick={((_data: { status: string }) => {
                    navigate(`/jobs?status=${_data.status}`)
                  }) as PieProps['onClick']}
                >
                  {kpis.statusBreakdown.map((entry) => (
                    <Cell key={entry.status} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...tooltipProps} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            {kpis.statusBreakdown.map((entry) => (
              <div key={entry.status} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-sm text-gray-600 dark:text-gray-400">{entry.status}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{entry.count}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Applications Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.recentApplications')}</h2>
            <button
              onClick={() => navigate('/jobs')}
              className="flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
            >
              {t('dashboard.viewAll')} <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                  <th className="pb-3 font-medium">{t('dashboard.company')}</th>
                  <th className="pb-3 font-medium">{t('dashboard.role')}</th>
                  <th className="pb-3 font-medium">{t('dashboard.status')}</th>
                  <th className="pb-3 font-medium">{t('dashboard.dateApplied')}</th>
                </tr>
              </thead>
              <tbody>
                {kpis.recentJobs.map((job) => (
                  <motion.tr
                    key={job.id}
                    whileHover={{ backgroundColor: 'rgba(99, 102, 241, 0.05)' }}
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    className="border-b border-gray-50 dark:border-gray-700/50 last:border-0 cursor-pointer"
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                          {job.company.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{job.company}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-sm text-gray-600 dark:text-gray-400">{job.role}</td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={job.status} size="sm" />
                    </td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(job.dateApplied).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
