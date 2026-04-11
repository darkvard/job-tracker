import { useState } from 'react'
import { ChevronLeft, ChevronRight, X, CalendarDays, Dot } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Job } from '@/lib/api'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function buildCalendarGrid(year: number, month: number): Date[] {
  const startDay = (new Date(year, month, 1).getDay() + 6) % 7 // 0=Mon
  return Array.from({ length: 42 }, (_, i) => new Date(year, month, 1 - startDay + i))
}

// ── Chip colors by status ────────────────────────────────────────────────────

/** Solid fill — for interviewDate chips */
const INTERVIEW_CHIP: Record<string, string> = {
  applied:   'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300',
  interview: 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300',
  offer:     'bg-green-100 text-green-700 dark:bg-green-950/70 dark:text-green-300',
  rejected:  'bg-red-100 text-red-600 dark:bg-red-950/70 dark:text-red-400',
}

/** Left-border only — for dateApplied chips */
const APPLIED_BORDER: Record<string, string> = {
  applied:   'border-blue-400 dark:border-blue-500',
  interview: 'border-amber-400 dark:border-amber-500',
  offer:     'border-green-400 dark:border-green-500',
  rejected:  'border-red-300 dark:border-red-400',
}

type CalEvent = { job: Job; type: 'interview' | 'applied' }

function toDateKey(d: string) {
  return d.split('T')[0]
}

interface CalendarViewProps {
  jobs: Job[]
  onView: (id: number) => void
}

export default function CalendarView({ jobs, onView }: CalendarViewProps) {
  const { t } = useTranslation()
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const cells = buildCalendarGrid(viewYear, viewMonth)

  // Build event maps
  const interviewMap: Record<string, Job[]> = {}
  const appliedMap: Record<string, Job[]> = {}

  jobs.forEach((job) => {
    if (job.interviewDate) {
      const k = toDateKey(job.interviewDate)
      ;(interviewMap[k] ??= []).push(job)
    }
    if (job.dateApplied) {
      const k = toDateKey(job.dateApplied)
      ;(appliedMap[k] ??= []).push(job)
    }
  })

  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11) }
    else setViewMonth((m) => m - 1)
    setSelectedDay(null)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0) }
    else setViewMonth((m) => m + 1)
    setSelectedDay(null)
  }

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', {
    month: 'long', year: 'numeric',
  })

  // Events for selected day panel
  const selectedEvents: CalEvent[] = selectedDay ? [
    ...(interviewMap[selectedDay] ?? []).map((job): CalEvent => ({ job, type: 'interview' })),
    ...(appliedMap[selectedDay] ?? []).map((job): CalEvent => ({ job, type: 'applied' })),
  ] : []

  const selectedDateLabel = selectedDay
    ? new Date(selectedDay + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : ''

  return (
    <div className="flex gap-4 items-start">
      {/* ── Calendar grid ── */}
      <div className="flex-1 min-w-0">
        {/* Month nav */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={prevMonth} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" aria-label="Previous month">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white min-w-[160px] text-center">{monthLabel}</h2>
          <button onClick={nextMonth} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" aria-label="Next month">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); setSelectedDay(null) }}
            className="ml-1 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
          >
            {t('common.today')}
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-l border-t border-gray-200 dark:border-gray-700 rounded-tl-lg rounded-tr-lg overflow-hidden">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 py-2 border-r border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 border-l border-gray-200 dark:border-gray-700">
          {cells.map((date, idx) => {
            const isCurrentMonth = date.getMonth() === viewMonth
            const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
            const isToday = dateKey === todayKey
            const isSelected = dateKey === selectedDay

            const interviewJobs = interviewMap[dateKey] ?? []
            const appliedJobs = appliedMap[dateKey] ?? []

            const allEvents: CalEvent[] = [
              ...interviewJobs.map((job): CalEvent => ({ job, type: 'interview' })),
              ...appliedJobs.map((job): CalEvent => ({ job, type: 'applied' })),
            ]
            const visible = allEvents.slice(0, 3)
            const overflow = allEvents.length - 3

            return (
              <div
                key={idx}
                className={`min-h-[90px] border-r border-b border-gray-200 dark:border-gray-700 p-1 flex flex-col ${
                  isCurrentMonth ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/40 dark:bg-gray-900/30'
                } ${isSelected ? 'ring-2 ring-inset ring-indigo-500 dark:ring-indigo-400' : ''}`}
              >
                {/* Day number */}
                <button
                  onClick={() => setSelectedDay(isSelected ? null : dateKey)}
                  className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold mb-1 flex-shrink-0 transition-colors ${
                    isToday
                      ? 'bg-indigo-600 text-white'
                      : isCurrentMonth
                        ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        : 'text-gray-300 dark:text-gray-600'
                  }`}
                >
                  {date.getDate()}
                </button>

                {/* Event chips */}
                <div className="flex-1 space-y-0.5 min-w-0">
                  {visible.map(({ job, type }, i) => {
                    const statusKey = job.status.toLowerCase()
                    if (type === 'interview') {
                      return (
                        <button
                          key={`i-${job.id}-${i}`}
                          onClick={() => onView(job.id)}
                          title={`Interview: ${job.company} — ${job.role}`}
                          className={`w-full text-left flex items-center gap-0.5 text-xs px-1 py-0.5 rounded truncate font-medium hover:opacity-80 transition-opacity ${INTERVIEW_CHIP[statusKey] ?? INTERVIEW_CHIP.interview}`}
                        >
                          <CalendarDays className="w-2.5 h-2.5 flex-shrink-0" />
                          <span className="truncate">{job.company}</span>
                        </button>
                      )
                    } else {
                      return (
                        <button
                          key={`a-${job.id}-${i}`}
                          onClick={() => onView(job.id)}
                          title={`Applied: ${job.company} — ${job.role}`}
                          className={`w-full text-left flex items-center gap-0.5 text-xs px-1 py-0.5 rounded truncate border-l-2 bg-gray-100/60 dark:bg-gray-700/40 text-gray-600 dark:text-gray-400 hover:opacity-80 transition-opacity ${APPLIED_BORDER[statusKey] ?? APPLIED_BORDER.applied}`}
                        >
                          <Dot className="w-2.5 h-2.5 flex-shrink-0 opacity-60" />
                          <span className="truncate">{job.company}</span>
                        </button>
                      )
                    }
                  })}

                  {overflow > 0 && (
                    <button
                      onClick={() => setSelectedDay(isSelected ? null : dateKey)}
                      className="w-full text-left text-xs text-indigo-500 dark:text-indigo-400 px-1 hover:underline font-medium"
                    >
                      +{overflow} more
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-100 dark:bg-amber-950/70 flex items-center justify-center">
              <CalendarDays className="w-2 h-2 text-amber-700 dark:text-amber-300" />
            </span>
            {t('jobs.interviewDate')}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded border-l-2 border-blue-400 bg-gray-100/60 dark:bg-gray-700/40" />
            {t('detail.appliedLabel')}
          </span>
        </div>
      </div>

      {/* ── Day detail panel ── */}
      {selectedDay && (
        <div className="w-72 flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {selectedDateLabel}
              </span>
            </div>
            <button
              onClick={() => setSelectedDay(null)}
              className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Events list */}
          <div className="p-3 space-y-3 max-h-[500px] overflow-y-auto">
            {/* Interview events */}
            {selectedEvents.filter(e => e.type === 'interview').length > 0 && (
              <div>
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-1.5">
                  {t('jobs.interviewDate')}
                </p>
                <div className="space-y-1.5">
                  {selectedEvents.filter(e => e.type === 'interview').map(({ job }) => (
                    <button
                      key={`panel-i-${job.id}`}
                      onClick={() => onView(job.id)}
                      className="w-full text-left p-2 rounded-lg border border-amber-100 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors group"
                    >
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-amber-700 dark:group-hover:text-amber-300">{job.company}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{job.role}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Applied events */}
            {selectedEvents.filter(e => e.type === 'applied').length > 0 && (
              <div>
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1.5">
                  {t('detail.appliedLabel')}
                </p>
                <div className="space-y-1.5">
                  {selectedEvents.filter(e => e.type === 'applied').map(({ job }) => (
                    <button
                      key={`panel-a-${job.id}`}
                      onClick={() => onView(job.id)}
                      className="w-full text-left p-2 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                    >
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{job.company}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{job.role}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedEvents.length === 0 && (
              <p className="text-sm text-gray-400 dark:text-gray-600 text-center py-4">
                Không có sự kiện
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
