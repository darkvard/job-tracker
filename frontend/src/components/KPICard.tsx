import { motion } from 'motion/react'
import type { LucideIcon } from 'lucide-react'

interface KPICardProps {
  title: string
  value: number
  icon: LucideIcon
  bgColor: string
  iconColor: string
  trend?: { value: number; isPositive: boolean }
}

export default function KPICard({ title, value, icon: Icon, bgColor, iconColor, trend }: KPICardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        {trend && (
          <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
      <p className="text-3xl font-semibold text-gray-900 dark:text-white mb-1">{value}</p>
      <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
      {trend && (
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          {trend.isPositive ? '+' : ''}{trend.value}% from last month
        </p>
      )}
    </motion.div>
  )
}
