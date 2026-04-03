import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { ChevronLeft, MapPin, Calendar, ExternalLink, Pencil, X as XIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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

const SOURCES = ['LinkedIn', 'Company Site', 'Referral', 'Indeed', 'Glassdoor', 'Other']

const inputClass =
  'w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-indigo-400 dark:border-indigo-500 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm'

const readonlyClass =
  'text-sm font-medium text-gray-900 dark:text-white'

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

interface EditForm {
  company: string
  role: string
  location: string
  source: string
  dateApplied: string
  notes: string
  status: string
}

export default function ApplicationDetail() {
  const { id: idParam } = useParams<{ id: string }>()
  const id = Number(idParam)
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { t } = useTranslation()

  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<EditForm>({
    company: '',
    role: '',
    location: '',
    source: '',
    dateApplied: '',
    notes: '',
    status: '',
  })
  const [editError, setEditError] = useState<string | null>(null)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['job', id],
    queryFn: () => api.jobs.get(id),
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const job = data!.data!
      // Status changed → call updateStatus first (validates transition)
      if (editForm.status !== job.status) {
        await api.jobs.updateStatus(id, { status: editForm.status })
      }
      // Update other fields — backend UpdateRequest requires status (validated),
      // so always include it (equals editForm.status which was already set via updateStatus if changed)
      await api.jobs.update(id, {
        company: editForm.company,
        role: editForm.role,
        location: editForm.location || undefined,
        source: editForm.source,
        dateApplied: editForm.dateApplied,
        notes: editForm.notes || undefined,
        status: editForm.status,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job', id] })
      qc.invalidateQueries({ queryKey: ['jobs'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      setIsEditing(false)
      setEditError(null)
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? t('detail.editError')
      setEditError(msg)
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
          <p className="text-red-700 dark:text-red-400 mb-4">{t('detail.failedToLoad')}</p>
          <button
            onClick={() => refetch()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {t('common.retry')}
          </button>
        </div>
      </div>
    )
  }

  const job = data?.data
  if (!job) return null

  const statusOptions = [job.status, ...VALID_TRANSITIONS[job.status]]

  function startEditing() {
    setEditForm({
      company: job!.company,
      role: job!.role,
      location: job!.location || '',
      source: job!.source,
      // Normalize to YYYY-MM-DD for <input type="date">
      dateApplied: job!.dateApplied ? job!.dateApplied.split('T')[0] : '',
      notes: job!.notes || '',
      status: job!.status,
    })
    setEditError(null)
    setIsEditing(true)
  }

  function cancelEditing() {
    setIsEditing(false)
    setEditError(null)
  }

  function setField(field: keyof EditForm, value: string) {
    setEditForm((prev) => ({ ...prev, [field]: value }))
    setEditError(null)
  }

  // Build timeline for view mode
  const historyMap: Record<string, string> = {}
  job.statusHistory?.forEach((h) => {
    if (h.toStatus && h.changedAt) historyMap[h.toStatus] = h.changedAt
  })

  const timeline = [
    { status: 'Applied', date: job.dateApplied, active: true },
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
        {t('detail.backToApplications')}
      </button>

      {/* Header card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6"
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold text-2xl flex-shrink-0">
            {(isEditing ? editForm.company : job.company).charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-2">
                <input
                  value={editForm.role}
                  onChange={(e) => setField('role', e.target.value)}
                  placeholder={t('jobs.rolePlaceholder')}
                  className={inputClass}
                />
                <input
                  value={editForm.company}
                  onChange={(e) => setField('company', e.target.value)}
                  placeholder={t('jobs.companyPlaceholder')}
                  className={inputClass}
                />
                <select
                  value={editForm.status}
                  onChange={(e) => setField('status', e.target.value)}
                  className={inputClass}
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>{t(`status.${s.toLowerCase()}`)}</option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{job.role}</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-3">{job.company}</p>
                <StatusBadge status={job.status} size="md" />
              </>
            )}
          </div>
          {/* Edit button (view mode only) */}
          {!isEditing && (
            <button
              onClick={startEditing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors border border-indigo-200 dark:border-indigo-800"
            >
              <Pencil className="w-3.5 h-3.5" />
              {t('detail.edit')}
            </button>
          )}
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Location */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-500">{t('detail.locationLabel')}</p>
              {isEditing ? (
                <input
                  value={editForm.location}
                  onChange={(e) => setField('location', e.target.value)}
                  placeholder={t('jobs.locationPlaceholder')}
                  className={inputClass + ' mt-0.5'}
                />
              ) : (
                <p className={readonlyClass}>{job.location || '—'}</p>
              )}
            </div>
          </div>

          {/* Date applied */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-500">{t('detail.appliedLabel')}</p>
              {isEditing ? (
                <input
                  type="date"
                  value={editForm.dateApplied}
                  onChange={(e) => setField('dateApplied', e.target.value)}
                  className={inputClass + ' mt-0.5'}
                />
              ) : (
                <p className={readonlyClass}>{formatDate(job.dateApplied)}</p>
              )}
            </div>
          </div>

          {/* Source */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500 dark:text-gray-500">{t('detail.sourceLabel')}</p>
              {isEditing ? (
                <select
                  value={editForm.source}
                  onChange={(e) => setField('source', e.target.value)}
                  className={inputClass + ' mt-0.5'}
                >
                  {SOURCES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              ) : (
                <p className={readonlyClass}>{job.source}</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Timeline card (view mode only) */}
      {!isEditing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            {t('detail.applicationTimeline')}
          </h2>
          <div className="space-y-0">
            {timeline.map((item, idx) => (
              <div key={item.status} className="relative flex items-start">
                {idx < timeline.length - 1 && (
                  <div
                    className={`absolute top-10 left-5 w-0.5 h-12 ${
                      item.active ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                )}
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
      )}

      {/* Notes card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t('detail.notesTitle')}</h2>
        {isEditing ? (
          <textarea
            value={editForm.notes}
            onChange={(e) => setField('notes', e.target.value)}
            placeholder={t('jobs.notesPlaceholder')}
            rows={4}
            className={inputClass + ' resize-none'}
          />
        ) : job.notes ? (
          <p className="text-gray-600 dark:text-gray-400 text-sm whitespace-pre-wrap">{job.notes}</p>
        ) : (
          <p className="text-gray-400 dark:text-gray-600 text-sm italic">{t('detail.noNotes')}</p>
        )}
      </motion.div>

      {/* Edit error */}
      {editError && (
        <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
          <XIcon className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-400">{editError}</p>
        </div>
      )}

      {/* Action buttons */}
      {isEditing ? (
        <div className="flex gap-3">
          <button
            onClick={cancelEditing}
            disabled={saveMutation.isPending}
            className="flex-1 px-6 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !editForm.company.trim() || !editForm.role.trim()}
            className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saveMutation.isPending && (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            )}
            {saveMutation.isPending ? t('detail.saving') : t('detail.saveChanges')}
          </button>
        </div>
      ) : (
        <div className="flex gap-3">
          {/* Delete button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="px-6 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium">
                {t('detail.delete')}
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('detail.deleteTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('detail.deleteConfirmMsg', { company: job.company, role: job.role })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? t('detail.deleting') : t('common.delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  )
}
