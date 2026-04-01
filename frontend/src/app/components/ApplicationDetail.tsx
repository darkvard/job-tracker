import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { ChevronLeft, MapPin, Calendar, ExternalLink } from 'lucide-react'
import { api } from '@/lib/api'
import StatusBadge from '@/components/StatusBadge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

const VALID_TRANSITIONS: Record<string, string[]> = {
  Applied: ['Interview', 'Rejected'],
  Interview: ['Offer', 'Rejected'],
  Offer: [],
  Rejected: [],
}

const inputClass =
  'w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500'

function DetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-6" />
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="flex-1">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-3" />
            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded-full w-24" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6 h-48" />
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6 h-32" />
      <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
    </div>
  )
}

export default function ApplicationDetail() {
  const { id: idParam } = useParams<{ id: string }>()
  const id = Number(idParam)
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [statusNote, setStatusNote] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['job', id],
    queryFn: () => api.jobs.get(id),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ status, note }: { status: string; note: string }) =>
      api.jobs.updateStatus(id, { status, note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job', id] })
      qc.invalidateQueries({ queryKey: ['jobs'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      setShowStatusDialog(false)
      setStatusNote('')
      setSelectedStatus('')
      setStatusError(null)
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Failed to update status. Please try again.'
      setStatusError(msg)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.jobs.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      navigate('/jobs', { replace: true })
    },
  })

  if (isLoading) return <DetailSkeleton />

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <p className="text-red-700 dark:text-red-400 mb-4">Failed to load application</p>
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

  const job = data?.data
  if (!job) return null

  const availableTransitions = VALID_TRANSITIONS[job.status] ?? []

  // Build timeline
  const historyMap: Record<string, string> = {}
  job.statusHistory?.forEach((h) => {
    if (h.toStatus && h.changedAt) historyMap[h.toStatus] = h.changedAt
  })

  const timeline = [
    {
      status: 'Applied',
      date: job.dateApplied,
      active: true,
    },
    {
      status: 'Interview',
      date:
        job.status === 'Interview' || job.status === 'Offer'
          ? (historyMap['Interview'] ?? '')
          : '',
      active: job.status === 'Interview' || job.status === 'Offer',
    },
    {
      status: job.status === 'Rejected' ? 'Rejected' : 'Offer',
      date:
        job.status === 'Offer' || job.status === 'Rejected'
          ? (historyMap[job.status] ?? '')
          : '',
      active: job.status === 'Offer' || job.status === 'Rejected',
    },
  ]

  function formatDate(dateStr: string) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <button
        onClick={() => navigate('/jobs')}
        className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Applications
      </button>

      {/* Header card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6"
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold text-2xl flex-shrink-0">
            {job.company.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{job.role}</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-3">{job.company}</p>
            <StatusBadge status={job.status} size="md" />
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-500">Location</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {job.location || '—'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-500">Applied</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {formatDate(job.dateApplied)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-500">Source</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{job.source}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Timeline card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Application Timeline
        </h2>
        <div className="space-y-0">
          {timeline.map((item, idx) => (
            <div key={item.status} className="relative flex items-start">
              {/* Connector line */}
              {idx < timeline.length - 1 && (
                <div
                  className={`absolute top-10 left-5 w-0.5 h-12 ${
                    item.active ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              )}
              {/* Circle */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mr-4 z-10 ${
                  item.active
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}
              >
                <span className="text-xs font-medium">{idx + 1}</span>
              </div>
              <div className="pb-8 pt-1.5">
                <p
                  className={`text-sm font-medium ${
                    item.active ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {item.status}
                </p>
                {item.date && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                    {formatDate(item.date)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Notes card */}
      {job.notes && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Notes</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm whitespace-pre-wrap">{job.notes}</p>
        </motion.div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        {/* Update status button */}
        {availableTransitions.length > 0 && (
          <button
            onClick={() => {
              setSelectedStatus(availableTransitions[0])
              setStatusError(null)
              setShowStatusDialog(true)
            }}
            className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
          >
            Update Status
          </button>
        )}

        {/* Delete button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="px-6 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium">
              Delete
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Application</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete your application to{' '}
                <strong>{job.company}</strong> for <strong>{job.role}</strong>? This action cannot
                be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Status update dialog */}
      {showStatusDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowStatusDialog(false)}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-100 dark:border-gray-700 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Update Status
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  New Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className={inputClass}
                >
                  {availableTransitions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Note (optional)
                </label>
                <input
                  type="text"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="e.g. Phone screen scheduled"
                  className={inputClass}
                />
              </div>

              {statusError && (
                <p className="text-sm text-red-600 dark:text-red-400">{statusError}</p>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowStatusDialog(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  updateStatusMutation.mutate({ status: selectedStatus, note: statusNote })
                }
                disabled={updateStatusMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:bg-indigo-400 dark:disabled:bg-indigo-800 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {updateStatusMutation.isPending && (
                  <svg
                    className="w-4 h-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                )}
                {updateStatusMutation.isPending ? 'Updating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
