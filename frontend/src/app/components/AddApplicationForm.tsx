import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { ChevronLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/api'
import { useToast } from '@/contexts/ToastContext'

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

const inputClass =
  'w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500'

const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'

function formatDateReadable(dateStr: string) {
  if (!dateStr) return ''
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function AddApplicationForm() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { t } = useTranslation()
  const toast = useToast()
  const [step, setStep] = useState(1)
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
      toast(t('toast.createSuccess'), 'success')
      navigate('/jobs', { replace: true })
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? t('jobs.somethingWentWrong')
      toast(msg, 'error')
    },
  })

  function set(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const canNext = step === 1 ? form.company.trim() !== '' && form.role.trim() !== '' : true

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/jobs')}
          className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          {t('common.back')}
        </button>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">{t('jobs.addTitle')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{t('jobs.addSubtitle')}</p>
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
        <span>{t('jobs.basicInfo')}</span>
        <span>{t('jobs.details')}</span>
        <span>{t('jobs.notes')}</span>
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
                {t('jobs.company')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder={t('jobs.companyPlaceholder')}
                value={form.company}
                onChange={(e) => set('company', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                {t('jobs.role')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder={t('jobs.rolePlaceholder')}
                value={form.role}
                onChange={(e) => set('role', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{t('jobs.locationLabel')}</label>
              <input
                type="text"
                placeholder={t('jobs.locationPlaceholder')}
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('jobs.dateApplied')} <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => set('dateApplied', today)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {t('common.today')}
                </button>
              </div>
              <input
                type="date"
                value={form.dateApplied}
                onChange={(e) => set('dateApplied', e.target.value)}
                className={inputClass}
              />
              {form.dateApplied && (
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-500">
                  {formatDateReadable(form.dateApplied)}
                </p>
              )}
            </div>
            <div>
              <label className={labelClass}>
                {t('jobs.sourceLabel')} <span className="text-red-500">*</span>
              </label>
              <select
                value={form.source}
                onChange={(e) => set('source', e.target.value)}
                className={inputClass}
              >
                {SOURCES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>
                {t('jobs.statusLabel')} <span className="text-red-500">*</span>
              </label>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                className={inputClass}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{t(`status.${s.toLowerCase()}`)}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <label className={labelClass}>{t('jobs.notesLabel')}</label>
            <textarea
              rows={8}
              placeholder={t('jobs.notesPlaceholder')}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              className={`${inputClass} resize-none`}
            />
          </div>
        )}
      </motion.div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 1}
          className="px-6 py-3 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed disabled:border-gray-100 dark:disabled:border-gray-800 transition-colors"
        >
          {t('common.back')}
        </button>

        {step < 3 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canNext}
            className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
          >
            {t('common.next')}
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
            {mutation.isPending ? t('common.submitting') : t('common.submit')}
          </button>
        )}
      </div>
    </div>
  )
}
