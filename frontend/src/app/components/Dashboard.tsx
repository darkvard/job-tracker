import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Briefcase, Users, CircleCheck, X, TrendingUp, ArrowUpRight } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { api } from '@/lib/api'
import KPICard from '@/components/KPICard'
import StatusBadge from '@/components/StatusBadge'

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
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Track your job application progress</p>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm text-center py-12">
        <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">No applications yet</p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Start tracking your job applications</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.dashboard.getKPIs(),
  })

  if (isLoading) return <DashboardSkeleton />

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <p className="text-red-700 dark:text-red-400 mb-4">Failed to load dashboard data</p>
          <button
            onClick={() => refetch()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Retry
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
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Track your job application progress</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Total Applications"
          value={kpis.total}
          icon={Briefcase}
          bgColor="bg-blue-100 dark:bg-blue-950/50"
          iconColor="text-blue-600 dark:text-blue-400"
          trend={kpis.trends.total}
        />
        <KPICard
          title="Interviews"
          value={kpis.interview}
          icon={Users}
          bgColor="bg-orange-100 dark:bg-orange-950/50"
          iconColor="text-orange-600 dark:text-orange-400"
          trend={kpis.trends.interview}
        />
        <KPICard
          title="Offers"
          value={kpis.offer}
          icon={CircleCheck}
          bgColor="bg-green-100 dark:bg-green-950/50"
          iconColor="text-green-600 dark:text-green-400"
          trend={kpis.trends.offer}
        />
        <KPICard
          title="Rejected"
          value={kpis.rejected}
          icon={X}
          bgColor="bg-red-100 dark:bg-red-950/50"
          iconColor="text-red-600 dark:text-red-400"
          trend={kpis.trends.rejected}
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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Status Distribution</h2>
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
                >
                  {kpis.statusBreakdown.map((entry) => (
                    <Cell key={entry.status} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
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
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Applications</h2>
            <button className="flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
              View all <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                  <th className="pb-3 font-medium">Company</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Date Applied</th>
                </tr>
              </thead>
              <tbody>
                {kpis.recentJobs.map((job) => (
                  <motion.tr
                    key={job.id}
                    whileHover={{ backgroundColor: 'rgba(99, 102, 241, 0.05)' }}
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
