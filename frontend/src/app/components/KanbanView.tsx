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
import { Trash2 } from 'lucide-react'
import { api, type Job } from '@/lib/api'
import StatusBadge from '@/components/StatusBadge'
import { useToast } from '@/contexts/ToastContext'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'

const STATUSES = ['Applied', 'Interview', 'Offer', 'Rejected'] as const
type Status = (typeof STATUSES)[number]

const COLUMN_STYLES: Record<
  Status,
  { header: string; border: string; bg: string; count: string }
> = {
  Applied: {
    header: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
    bg: 'bg-blue-50/50 dark:bg-blue-950/10',
    count: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400',
  },
  Interview: {
    header: 'text-orange-700 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800',
    bg: 'bg-orange-50/50 dark:bg-orange-950/10',
    count: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400',
  },
  Offer: {
    header: 'text-green-700 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
    bg: 'bg-green-50/50 dark:bg-green-950/10',
    count: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400',
  },
  Rejected: {
    header: 'text-red-700 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
    bg: 'bg-red-50/50 dark:bg-red-950/10',
    count: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400',
  },
}

// ── Draggable Card — matches List card layout exactly ─────────────────────────

interface DraggableCardProps {
  job: Job
  isDragging: boolean
  onDelete: (id: number) => void
}

function DraggableCard({ job, isDragging, onDelete }: DraggableCardProps) {
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
    <div ref={setNodeRef} style={style} className="touch-none">
      <motion.div
        whileHover={{ y: -4, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 cursor-grab active:cursor-grabbing select-none"
      >
        {/* Header: avatar + status badge — drag handle area */}
        <div
          {...listeners}
          {...attributes}
          className="flex items-start justify-between mb-3"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
            {job.company.charAt(0)}
          </div>
          <StatusBadge status={job.status} size="sm" />
        </div>

        {/* Company + Role — click to navigate */}
        <div
          className="cursor-pointer"
          onClick={() => {
            if (!transform) navigate(`/jobs/${job.id}`)
          }}
        >
          <p className="font-semibold text-gray-900 dark:text-white mb-1">{job.company}</p>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{job.role}</p>
        </div>

        {/* Fields */}
        <div className="space-y-1.5 text-sm">
          {job.location && (
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-500">{t('jobs.location')}</span>
              <span className="text-gray-700 dark:text-gray-300 truncate ml-2 max-w-[60%] text-right">
                {job.location}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-gray-500 dark:text-gray-500">{t('jobs.source')}</span>
            <span className="text-gray-700 dark:text-gray-300">{job.source}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 dark:text-gray-500">{t('jobs.applied')}</span>
            <span className="text-gray-700 dark:text-gray-300">
              {new Date(job.dateApplied).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Delete — stop propagation so drag events don't interfere */}
        <div
          className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                aria-label="Delete application"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('jobs.deleteTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('jobs.deleteConfirmMsg', { company: job.company, role: job.role })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(job.id)}>
                  {t('common.delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </motion.div>
    </div>
  )
}

// ── Drag overlay card (shown while dragging) ───────────────────────────────────

function CardOverlay({ job }: { job: Job }) {
  const { t } = useTranslation()
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-2xl border border-indigo-300 dark:border-indigo-600 cursor-grabbing select-none w-[280px] rotate-2 opacity-95">
      <div className="flex items-start justify-between mb-3">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
          {job.company.charAt(0)}
        </div>
        <StatusBadge status={job.status} size="sm" />
      </div>
      <p className="font-semibold text-gray-900 dark:text-white mb-1">{job.company}</p>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{job.role}</p>
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {t('jobs.applied')}:{' '}
        <span className="text-gray-700 dark:text-gray-300">
          {new Date(job.dateApplied).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      </div>
    </div>
  )
}

// ── Droppable Column ───────────────────────────────────────────────────────────

function DroppableColumn({
  status,
  jobs,
  activeId,
  onDelete,
}: {
  status: Status
  jobs: Job[]
  activeId: string | null
  onDelete: (id: number) => void
}) {
  const { t } = useTranslation()
  const { isOver, setNodeRef } = useDroppable({ id: status })
  const styles = COLUMN_STYLES[status]

  return (
    <div
      className={`flex flex-col flex-1 min-w-[280px] rounded-xl border-2 ${styles.border} ${styles.bg} transition-shadow ${
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
      <div
        ref={setNodeRef}
        className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-240px)]"
      >
        {jobs.map((job) => (
          <DraggableCard
            key={job.id}
            job={job}
            isDragging={activeId === String(job.id)}
            onDelete={onDelete}
          />
        ))}
        {jobs.length === 0 && !isOver && (
          <div className="flex items-center justify-center h-24 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
            <p className="text-xs text-gray-400 dark:text-gray-600">{t('kanban.dropHere')}</p>
          </div>
        )}
        {isOver && (
          <div className="flex items-center justify-center h-16 border-2 border-dashed border-indigo-400 dark:border-indigo-500 rounded-xl bg-indigo-50 dark:bg-indigo-950/20">
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

  // Local columns: job.id → current status (optimistic updates)
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

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.jobs.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast(t('toast.deleteSuccess'), 'success')
    },
    onError: (err: unknown) => {
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

    setColumnMap((prev) => ({ ...prev, [jobId]: newStatus }))
    updateStatusMutation.mutate({ id: jobId, status: newStatus })
  }

  // Group jobs by column
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
      {/* Horizontal scroll when columns exceed viewport */}
      <div className="flex gap-4 overflow-x-auto pb-2 items-start">
        {STATUSES.map((status) => (
          <DroppableColumn
            key={status}
            status={status}
            jobs={columns[status]}
            activeId={activeJob ? String(activeJob.id) : null}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeJob ? <CardOverlay job={activeJob} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
