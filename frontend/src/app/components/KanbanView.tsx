import { useState, useEffect } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'motion/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
    header: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-700',
    bg: 'bg-amber-50/50 dark:bg-amber-950/10',
    count: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400',
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

// ── Sortable Card ──────────────────────────────────────────────────────────────

interface SortableCardProps {
  job: Job
  isDragging: boolean
  onDelete: (id: number) => void
  onView: (id: number) => void
}

function SortableCard({ job, isDragging, onDelete, onView }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: String(job.id),
    data: { type: 'card', status: job.status },
  })
  const { t } = useTranslation()

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  }

  const dateStr = new Date(job.dateApplied).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div ref={setNodeRef} style={style} className="touch-none">
      <motion.div
        whileHover={{ y: -2, boxShadow: '0 6px 20px rgba(0,0,0,0.1)' }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 select-none overflow-hidden"
      >
        {/* Drag handle + identity */}
        <div
          {...listeners}
          {...attributes}
          className="flex items-start gap-3 px-4 pt-4 pb-3 cursor-grab active:cursor-grabbing"
          onClick={() => { if (!transform) onView(job.id) }}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-base flex-shrink-0">
            {job.company.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {job.company}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{job.role}</p>
          </div>
          <StatusBadge status={job.status} size="icon" />
        </div>

        {/* Footer: location + source + date + delete */}
        <div className="px-4 pb-3 pt-2 border-t border-gray-100 dark:border-gray-700 space-y-1">
          {job.location && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {job.location}
            </p>
          )}
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1">
              {job.source}
            </p>
            <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
              {dateStr}
            </span>
            <span onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    className="p-1 rounded text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex-shrink-0"
                    aria-label="Delete application"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ── Drag overlay card (shown while dragging) ───────────────────────────────────

function CardOverlay({ job }: { job: Job }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-indigo-300 dark:border-indigo-600 cursor-grabbing select-none w-[240px] rotate-2 opacity-95 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-base flex-shrink-0">
          {job.company.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{job.company}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{job.role}</p>
        </div>
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
  onView,
}: {
  status: Status
  jobs: Job[]
  activeId: string | null
  onDelete: (id: number) => void
  onView: (id: number) => void
}) {
  const { t } = useTranslation()
  const { isOver, setNodeRef } = useDroppable({
    id: status,
    data: { type: 'column', status },
  })
  const styles = COLUMN_STYLES[status]
  const jobIds = jobs.map((j) => String(j.id))

  return (
    <div
      className={`flex flex-col flex-1 min-w-[240px] rounded-xl border-2 ${styles.border} ${styles.bg} transition-shadow ${
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
        <SortableContext items={jobIds} strategy={verticalListSortingStrategy}>
          {jobs.map((job) => (
            <SortableCard
              key={job.id}
              job={job}
              isDragging={activeId === String(job.id)}
              onDelete={onDelete}
              onView={onView}
            />
          ))}
        </SortableContext>
        {jobs.length === 0 && !isOver && (
          <div className="flex items-center justify-center h-24 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
            <p className="text-xs text-gray-400 dark:text-gray-600">{t('kanban.dropHere')}</p>
          </div>
        )}
        {isOver && activeId && !jobIds.includes(activeId) && (
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
  onView: (id: number) => void
}

export default function KanbanView({ jobs, onView }: KanbanViewProps) {
  const qc = useQueryClient()
  const toast = useToast()
  const { t } = useTranslation()

  // columnMap: job.id → current status (for cross-column moves)
  const [columnMap, setColumnMap] = useState<Record<number, string>>(() => {
    const m: Record<number, string> = {}
    jobs.forEach((j) => { m[j.id] = j.status })
    return m
  })

  // columnOrder: status → ordered job IDs (for within-column sorting)
  const [columnOrder, setColumnOrder] = useState<Record<Status, number[]>>(() => {
    const o = { Applied: [], Interview: [], Offer: [], Rejected: [] } as Record<Status, number[]>
    jobs.forEach((j) => {
      if (STATUSES.includes(j.status as Status)) o[j.status as Status].push(j.id)
    })
    return o
  })

  // Sync state when jobs prop changes (after refetch)
  useEffect(() => {
    const m: Record<number, string> = {}
    jobs.forEach((j) => { m[j.id] = j.status })
    setColumnMap(m)
    const o = { Applied: [], Interview: [], Offer: [], Rejected: [] } as Record<Status, number[]>
    jobs.forEach((j) => {
      if (STATUSES.includes(j.status as Status)) o[j.status as Status].push(j.id)
    })
    setColumnOrder(o)
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
    if (!over || active.id === over.id) return

    const activeJobId = Number(active.id)
    const activeStatus = (columnMap[activeJobId] ?? '') as Status

    const overId = String(over.id)
    const isOverColumn = (STATUSES as readonly string[]).includes(overId)

    if (isOverColumn) {
      // ── Cross-column drop onto empty column or column droppable ──────────
      const newStatus = overId as Status
      if (newStatus === activeStatus) return

      setColumnMap((prev) => ({ ...prev, [activeJobId]: newStatus }))
      setColumnOrder((prev) => {
        const src = prev[activeStatus].filter((id) => id !== activeJobId)
        const dst = [...prev[newStatus], activeJobId]
        return { ...prev, [activeStatus]: src, [newStatus]: dst }
      })
      updateStatusMutation.mutate({ id: activeJobId, status: newStatus })
      autoSetInterviewDate(activeJobId, newStatus)
    } else {
      // ── Drop onto another card ───────────────────────────────────────────
      const overJobId = Number(overId)
      const overStatus = (columnMap[overJobId] ?? '') as Status

      if (activeStatus === overStatus) {
        // Within-column reorder
        setColumnOrder((prev) => {
          const col = prev[activeStatus]
          const oldIndex = col.indexOf(activeJobId)
          const newIndex = col.indexOf(overJobId)
          if (oldIndex === -1 || newIndex === -1) return prev
          return { ...prev, [activeStatus]: arrayMove(col, oldIndex, newIndex) }
        })
      } else {
        // Cross-column drop onto a card → insert at that card's position
        setColumnMap((prev) => ({ ...prev, [activeJobId]: overStatus }))
        setColumnOrder((prev) => {
          const src = prev[activeStatus].filter((id) => id !== activeJobId)
          const dst = [...prev[overStatus]]
          const insertAt = dst.indexOf(overJobId)
          if (insertAt === -1) dst.push(activeJobId)
          else dst.splice(insertAt, 0, activeJobId)
          return { ...prev, [activeStatus]: src, [overStatus]: dst }
        })
        updateStatusMutation.mutate({ id: activeJobId, status: overStatus })
        autoSetInterviewDate(activeJobId, overStatus)
      }
    }
  }

  function autoSetInterviewDate(jobId: number, newStatus: string) {
    if (newStatus !== 'Interview') return
    const job = jobs.find((j) => j.id === jobId)
    const today = new Date().toISOString().split('T')[0]
    if (job && (!job.interviewDate || job.interviewDate.split('T')[0] < today)) {
      api.jobs.update(jobId, {
        company: job.company,
        role: job.role,
        source: job.source,
        dateApplied: job.dateApplied,
        status: newStatus,
        interviewDate: today,
      }).then(() => {
        qc.invalidateQueries({ queryKey: ['jobs'] })
      }).catch(() => { /* status already updated — silent */ })
    }
  }

  // Build columns: use columnOrder for ordering, columnMap for status assignment
  const columns: Record<Status, Job[]> = {
    Applied: [],
    Interview: [],
    Offer: [],
    Rejected: [],
  }
  const jobMap: Record<number, Job> = {}
  jobs.forEach((j) => { jobMap[j.id] = j })

  STATUSES.forEach((status) => {
    columnOrder[status].forEach((jobId) => {
      const job = jobMap[jobId]
      const currentStatus = (columnMap[jobId] ?? job?.status) as Status
      if (job && currentStatus === status) {
        columns[status].push({ ...job, status })
      }
    })
    // Include any jobs in this status that aren't in columnOrder yet
    jobs.forEach((job) => {
      const currentStatus = (columnMap[job.id] ?? job.status) as Status
      if (currentStatus === status && !columnOrder[status].includes(job.id)) {
        columns[status].push({ ...job, status })
      }
    })
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
            onView={onView}
          />
        ))}
      </div>

      <DragOverlay>
        {activeJob ? <CardOverlay job={activeJob} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
