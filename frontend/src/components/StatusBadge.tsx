import { Clock, Users, CircleCheck, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md' | 'icon'
}

const STATUS_MAP: Record<string, { bg: string; text: string; Icon: typeof Clock }> = {
  applied:   { bg: 'bg-blue-50 dark:bg-blue-950/30',     text: 'text-blue-600 dark:text-blue-400',   Icon: Clock },
  interview: { bg: 'bg-amber-50 dark:bg-amber-950/30',   text: 'text-amber-600 dark:text-amber-400', Icon: Users },
  offer:     { bg: 'bg-green-50 dark:bg-green-950/30',   text: 'text-green-600 dark:text-green-400', Icon: CircleCheck },
  rejected:  { bg: 'bg-red-50 dark:bg-red-950/30',       text: 'text-red-600 dark:text-red-400',     Icon: X },
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const { t } = useTranslation()
  const key = status.toLowerCase()
  const config = STATUS_MAP[key] ?? STATUS_MAP['applied']
  const { bg, text, Icon } = config

  if (size === 'icon') {
    return (
      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0 ${bg}`}>
        <Icon className={`w-3 h-3 ${text}`} />
      </span>
    )
  }

  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${bg} ${text} ${textSize} font-medium`}>
      <Icon className={iconSize} />
      {t(`status.${key}`)}
    </span>
  )
}
