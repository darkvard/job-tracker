import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { User as UserIcon, MapPin, Briefcase, Building2, DollarSign, LogOut } from 'lucide-react'
import { api, type UpdateProfilePayload } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'

const CURRENCIES = ['VND', 'USD', 'EUR', 'SGD']

export default function ProfilePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { logout, updateUser } = useAuth()
  const toast = useToast()
  const qc = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.auth.me(),
  })

  const user = data?.data

  const [form, setForm] = useState<UpdateProfilePayload>({
    name: '',
    currentLocation: '',
    currentRole: '',
    currentCompany: '',
    currentSalary: undefined,
    salaryCurrency: 'VND',
  })

  // Sync form when user data loads
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name,
        currentLocation: user.currentLocation ?? '',
        currentRole: user.currentRole ?? '',
        currentCompany: user.currentCompany ?? '',
        currentSalary: user.currentSalary ?? undefined,
        salaryCurrency: user.salaryCurrency ?? 'VND',
      })
    }
  }, [user])

  const mutation = useMutation({
    mutationFn: (payload: UpdateProfilePayload) => api.auth.updateProfile(payload),
    onSuccess: (res) => {
      updateUser(res.data)
      qc.invalidateQueries({ queryKey: ['profile'] })
      toast(t('profile.saveSuccess'), 'success')
    },
    onError: () => {
      toast(t('profile.saveFailed'), 'error')
    },
  })

  function handleChange(field: keyof UpdateProfilePayload, value: string | number | undefined) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload: UpdateProfilePayload = {
      name: form.name,
      currentLocation: form.currentLocation || null,
      currentRole: form.currentRole || null,
      currentCompany: form.currentCompany || null,
      currentSalary: form.currentSalary ?? null,
      salaryCurrency: form.salaryCurrency || 'VND',
    }
    mutation.mutate(payload)
  }

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-red-600 dark:text-red-400">
          {t('detail.failedToLoad')}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('profile.title')}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('profile.subtitle')}</p>
        </div>

        {/* Avatar + identity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xl font-bold">{initials}</span>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{user?.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-indigo-500" />
              {t('profile.basicInfo')}
            </h2>

            <div>
              <label htmlFor="profile-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('profile.name')}
              </label>
              <input
                id="profile-name"
                type="text"
                required
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                disabled
                value={user?.email ?? ''}
                className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 dark:text-gray-400 text-sm cursor-not-allowed"
              />
            </div>
          </div>

          {/* Current Position */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-500" />
              {t('profile.currentPosition')}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('profile.currentRole')}
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={form.currentRole ?? ''}
                    onChange={(e) => handleChange('currentRole', e.target.value)}
                    placeholder={t('profile.rolePlaceholder')}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('profile.currentCompany')}
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={form.currentCompany ?? ''}
                    onChange={(e) => handleChange('currentCompany', e.target.value)}
                    placeholder={t('profile.companyPlaceholder')}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('profile.currentLocation')}
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={form.currentLocation ?? ''}
                    onChange={(e) => handleChange('currentLocation', e.target.value)}
                    placeholder={t('profile.locationPlaceholder')}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('profile.currentSalary')}
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      min={0}
                      value={form.currentSalary ?? ''}
                      onChange={(e) =>
                        handleChange('currentSalary', e.target.value ? Number(e.target.value) : undefined)
                      }
                      placeholder={t('profile.salaryPlaceholder')}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <select
                    value={form.salaryCurrency}
                    onChange={(e) => handleChange('salaryCurrency', e.target.value)}
                    className="px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              {t('profile.logout')}
            </button>

            <motion.button
              type="submit"
              disabled={mutation.isPending}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {mutation.isPending ? t('profile.saving') : t('profile.saveChanges')}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
