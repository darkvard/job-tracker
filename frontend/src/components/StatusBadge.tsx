import { Clock, Users, CircleCheck, X } from 'lucide-react'

interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md'
}

const STATUS_MAP: Record<string, { bg: string; text: string; Icon: typeof Clock }> = {
  applied:   { bg: 'bg-blue-50 dark:bg-blue-950/30',   text: 'text-blue-700 dark:text-blue-400',     Icon: Clock },
  interview: { bg: 'bg-orange-50 dark:bg-orange-950/30', text: 'text-orange-700 dark:text-orange-400', Icon: Users },
  offer:     { bg: 'bg-green-50 dark:bg-green-950/30', text: 'text-green-700 dark:text-green-400',   Icon: CircleCheck },
  rejected:  { bg: 'bg-red-50 dark:bg-red-950/30',    text: 'text-red-700 dark:text-red-400',       Icon: X },
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const key = status.toLowerCase()
  const config = STATUS_MAP[key] ?? STATUS_MAP['applied']
  const { bg, text, Icon } = config
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${bg} ${text} ${textSize} font-medium`}>
      <Icon className={iconSize} />
      {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
    </span>
  )
}
