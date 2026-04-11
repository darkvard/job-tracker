import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Job } from '@/lib/api'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function buildCalendarGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1)
  const startDay = (first.getDay() + 6) % 7 // 0=Mon
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(year, month, 1 - startDay + i)
    return d
  })
}

const STATUS_CHIP: Record<string, string> = {
  applied:   'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400',
  interview: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400',
  offer:     'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400',
  rejected:  'bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400',
}

interface CalendarViewProps {
  jobs: Job[]
}

export default function CalendarView({ jobs }: CalendarViewProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const cells = buildCalendarGrid(viewYear, viewMonth)

  // Map dateStr (YYYY-MM-DD) → jobs with interviewDate on that day
  const interviewMap: Record<string, Job[]> = {}
  // Set of dateStr where any job was applied
  const appliedSet = new Set<string>()

  jobs.forEach((job) => {
    if (job.interviewDate) {
      const key = job.interviewDate.split('T')[0]
      if (!interviewMap[key]) interviewMap[key] = []
      interviewMap[key].push(job)
    }
    if (job.dateApplied) {
      appliedSet.add(job.dateApplied.split('T')[0])
    }
  })

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11) }
    else setViewMonth((m) => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0) }
    else setViewMonth((m) => m + 1)
  }
  function goToday() {
    setViewYear(today.getFullYear())
    setViewMonth(today.getMonth())
  }

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={prevMonth}
          className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white min-w-[160px] text-center">
          {monthLabel}
        </h2>
        <button
          onClick={nextMonth}
          className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={goToday}
          className="ml-1 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
        >
          {t('common.today')}
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-l border-t border-gray-200 dark:border-gray-700 rounded-t-lg overflow-hidden">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2 border-r border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 border-l border-gray-200 dark:border-gray-700 rounded-b-lg overflow-hidden">
        {cells.map((date, idx) => {
          const isCurrentMonth = date.getMonth() === viewMonth
          const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
          const isToday = dateKey === todayKey
          const interviewJobs = interviewMap[dateKey] ?? []
          const hasApplied = appliedSet.has(dateKey)

          return (
            <div
              key={idx}
              className={`min-h-[100px] border-r border-b border-gray-200 dark:border-gray-700 p-1.5 ${
                isCurrentMonth
                  ? 'bg-white dark:bg-gray-800'
                  : 'bg-gray-50/60 dark:bg-gray-900/40'
              }`}
            >
              {/* Day number */}
              <div
                className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium mb-1 ${
                  isToday
                    ? 'bg-indigo-600 text-white'
                    : isCurrentMonth
                      ? 'text-gray-700 dark:text-gray-300'
                      : 'text-gray-300 dark:text-gray-600'
                }`}
              >
                {date.getDate()}
              </div>

              {/* Interview chips */}
              <div className="space-y-0.5">
                {interviewJobs.slice(0, 3).map((job) => (
                  <button
                    key={job.id}
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    className={`w-full text-left text-xs px-1.5 py-0.5 rounded truncate font-medium hover:opacity-80 transition-opacity ${
                      STATUS_CHIP[job.status.toLowerCase()] ?? STATUS_CHIP.applied
                    }`}
                    title={`${job.company} — ${job.role}`}
                  >
                    {job.company}
                  </button>
                ))}
                {interviewJobs.length > 3 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 pl-1.5">
                    +{interviewJobs.length - 3}
                  </p>
                )}
              </div>

              {/* Applied dot */}
              {hasApplied && interviewJobs.length === 0 && (
                <div className="mt-1 flex">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700" />
          {t('jobs.interviewDate')}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
          {t('detail.appliedLabel')}
        </span>
      </div>
    </div>
  )
}
