import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { CircleCheck, ChevronLeft } from 'lucide-react'
import { api } from '@/lib/api'

const SOURCES = ['LinkedIn', 'Company Site', 'Referral', 'Indeed', 'Glassdoor', 'Other']
const STATUSES = ['Applied', 'Interview', 'Offer', 'Rejected']

const today = new Date().toISOString().split('T')[0]

interface FormData {
  company: string
  role: string
  location: string
  dateApplied: string
  source: string
  status: string
  notes: string
}

interface Props {
  onBack?: () => void
}

const inputClass =
  'w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500'

const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'

export default function AddApplicationForm({ onBack }: Props) {
  const qc = useQueryClient()
  const [step, setStep] = useState(1)
  const [showSuccess, setShowSuccess] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>({
    company: '',
    role: '',
    location: '',
    dateApplied: today,
    source: 'LinkedIn',
    status: 'Applied',
    notes: '',
  })

  const mutation = useMutation({
    mutationFn: () =>
      api.jobs.create({
        company: form.company,
        role: form.role,
        location: form.location || undefined,
        dateApplied: form.dateApplied,
        source: form.source,
        status: form.status,
        notes: form.notes || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      setApiError(null)
      setShowSuccess(true)
      setTimeout(() => {
        onBack?.()
      }, 2000)
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? 'Something went wrong. Please try again.'
      setApiError(msg)
    },
  })

  function set(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setApiError(null)
  }

  const canNext = step === 1 ? form.company.trim() !== '' && form.role.trim() !== '' : true

  if (showSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-12 shadow-sm border border-gray-100 dark:border-gray-700 text-center w-full"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-16 h-16 bg-green-100 dark:bg-green-950/30 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CircleCheck className="w-8 h-8 text-green-600" />
          </motion.div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Application Added!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Your application has been successfully saved
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
        )}
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Add Application</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Track a new job application</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                step >= s
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}
            >
              {s}
            </div>
            {s < 3 && (
              <div
                className={`flex-1 h-1 mx-2 rounded ${
                  step > s ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step labels */}
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-6 -mt-4">
        <span>Basic Info</span>
        <span>Details</span>
        <span>Notes</span>
      </div>

      {/* Form card */}
      <motion.div
        key={step}
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6"
      >
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>
                Company <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Google"
                value={form.company}
                onChange={(e) => set('company', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                Role <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Senior Product Designer"
                value={form.role}
                onChange={(e) => set('role', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Location</label>
              <input
                type="text"
                placeholder="e.g. San Francisco, CA (optional)"
                value={form.location}
                onChange={(e) => set('location', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>
                Date Applied <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.dateApplied}
                onChange={(e) => set('dateApplied', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                Source <span className="text-red-500">*</span>
              </label>
              <select
                value={form.source}
                onChange={(e) => set('source', e.target.value)}
                className={inputClass}
              >
                {SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>
                Status <span className="text-red-500">*</span>
              </label>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                className={inputClass}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              rows={8}
              placeholder="Any notes about this application..."
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              className={`${inputClass} resize-none`}
            />
          </div>
        )}

        {/* API error */}
        {apiError && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">{apiError}</p>
        )}
      </motion.div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 1}
          className="px-6 py-3 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed disabled:border-gray-100 dark:disabled:border-gray-800 transition-colors"
        >
          Back
        </button>

        {step < 3 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canNext}
            className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        ) : (
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:bg-indigo-400 dark:disabled:bg-indigo-800 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {mutation.isPending && (
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
            {mutation.isPending ? 'Submitting...' : 'Submit'}
          </button>
        )}
      </div>
    </div>
  )
}
