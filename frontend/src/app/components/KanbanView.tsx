import { useState, useEffect } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'motion/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api, type Job } from '@/lib/api'
import StatusBadge from '@/components/StatusBadge'
import { useToast } from '@/contexts/ToastContext'

const STATUSES = ['Applied', 'Interview', 'Offer', 'Rejected'] as const
type Status = (typeof STATUSES)[number]

const COLUMN_STYLES: Record<
  Status,
  { header: string; border: string; bg: string; count: string }
> = {
  Applied: {
    header: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    count: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400',
  },
  Interview: {
    header: 'text-orange-700 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800',
    bg: 'bg-orange-50 dark:bg-orange-950/20',
    count: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400',
  },
  Offer: {
    header: 'text-green-700 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
    bg: 'bg-green-50 dark:bg-green-950/20',
    count: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400',
  },
  Rejected: {
    header: 'text-red-700 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
    bg: 'bg-red-50 dark:bg-red-950/20',
    count: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400',
  },
}

// ── Draggable Card ─────────────────────────────────────────────────────────────

function DraggableCard({ job, isDragging }: { job: Job; isDragging: boolean }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: String(job.id),
    data: { status: job.status },
  })
  const navigate = useNavigate()
  const { t } = useTranslation()

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.35 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="touch-none"
    >
      <motion.div
        whileHover={{ y: -2, boxShadow: '0 6px 20px rgba(0,0,0,0.08)' }}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 cursor-grab active:cursor-grabbing select-none"
        onClick={(e) => {
          // Only navigate on click (not drag)
          if (!transform) {
            e.stopPropagation()
            navigate(`/jobs/${job.id}`)
          }
        }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            {job.company.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
              {job.company}
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-xs truncate">{job.role}</p>
          </div>
        </div>

        <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
          {job.location && (
            <p className="truncate">
              📍 <span className="text-gray-700 dark:text-gray-300">{job.location}</span>
            </p>
          )}
          <p>
            {t('jobs.applied')}:{' '}
            <span className="text-gray-700 dark:text-gray-300">
              {new Date(job.dateApplied).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

// ── Card Overlay (shown while dragging) ───────────────────────────────────────

function CardOverlay({ job }: { job: Job }) {
  const { t } = useTranslation()
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-xl border border-indigo-300 dark:border-indigo-600 cursor-grabbing select-none w-[220px] rotate-2 opacity-90">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
          {job.company.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
            {job.company}
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-xs truncate">{job.role}</p>
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {t('jobs.applied')}:{' '}
        <span className="text-gray-700 dark:text-gray-300">
          {new Date(job.dateApplied).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </p>
    </div>
  )
}

// ── Droppable Column ───────────────────────────────────────────────────────────

function DroppableColumn({
  status,
  jobs,
  activeId,
}: {
  status: Status
  jobs: Job[]
  activeId: string | null
}) {
  const { t } = useTranslation()
  const { isOver, setNodeRef } = useDroppable({ id: status })
  const styles = COLUMN_STYLES[status]

  return (
    <div
      className={`flex flex-col rounded-xl border-2 ${styles.border} ${styles.bg} min-h-[400px] transition-shadow ${
        isOver ? 'ring-2 ring-indigo-400 dark:ring-indigo-500 shadow-lg' : ''
      }`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <span className={`font-semibold text-sm ${styles.header}`}>
          {t(`status.${status.toLowerCase()}`)}
        </span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles.count}`}>
          {jobs.length}
        </span>
      </div>

      {/* Cards */}
      <div ref={setNodeRef} className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)]">
        {jobs.map((job) => (
          <DraggableCard key={job.id} job={job} isDragging={activeId === String(job.id)} />
        ))}
        {jobs.length === 0 && !isOver && (
          <div className="flex items-center justify-center h-24 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
            <p className="text-xs text-gray-400 dark:text-gray-600">
              {t('kanban.dropHere')}
            </p>
          </div>
        )}
        {isOver && (
          <div className="flex items-center justify-center h-16 border-2 border-dashed border-indigo-400 dark:border-indigo-500 rounded-lg bg-indigo-50 dark:bg-indigo-950/20">
            <p className="text-xs text-indigo-500 dark:text-indigo-400 font-medium">
              {t('kanban.moveHere')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── KanbanView (main export) ───────────────────────────────────────────────────

interface KanbanViewProps {
  jobs: Job[]
}

export default function KanbanView({ jobs }: KanbanViewProps) {
  const qc = useQueryClient()
  const toast = useToast()
  const { t } = useTranslation()

  // Local columns: job.id → current status (for optimistic updates)
  const [columnMap, setColumnMap] = useState<Record<number, string>>(() => {
    const m: Record<number, string> = {}
    jobs.forEach((j) => { m[j.id] = j.status })
    return m
  })

  // Sync columnMap when jobs prop changes (e.g. after refetch following a successful mutation)
  useEffect(() => {
    const m: Record<number, string> = {}
    jobs.forEach((j) => { m[j.id] = j.status })
    setColumnMap(m)
  }, [jobs])

  const [activeJob, setActiveJob] = useState<Job | null>(null)

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.jobs.updateStatus(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (err: unknown, variables) => {
      // Revert optimistic update
      const original = jobs.find((j) => j.id === variables.id)
      if (original) {
        setColumnMap((prev) => ({ ...prev, [variables.id]: original.status }))
      }
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? t('jobs.somethingWentWrong')
      toast(msg, 'error')
    },
  })

  function handleDragStart(event: DragStartEvent) {
    const job = jobs.find((j) => String(j.id) === event.active.id)
    setActiveJob(job ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveJob(null)
    const { active, over } = event
    if (!over) return

    const jobId = Number(active.id)
    const newStatus = String(over.id) as Status
    const currentStatus = columnMap[jobId]

    if (!STATUSES.includes(newStatus) || newStatus === currentStatus) return

    // Optimistic update
    setColumnMap((prev) => ({ ...prev, [jobId]: newStatus }))
    updateStatusMutation.mutate({ id: jobId, status: newStatus })
  }

  // Group jobs by current column status
  const columns: Record<Status, Job[]> = {
    Applied: [],
    Interview: [],
    Offer: [],
    Rejected: [],
  }
  jobs.forEach((job) => {
    const status = (columnMap[job.id] ?? job.status) as Status
    if (STATUSES.includes(status)) {
      columns[status].push({ ...job, status })
    }
  })

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATUSES.map((status) => (
          <DroppableColumn
            key={status}
            status={status}
            jobs={columns[status]}
            activeId={activeJob ? String(activeJob.id) : null}
          />
        ))}
      </div>

      <DragOverlay>
        {activeJob ? <CardOverlay job={activeJob} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
