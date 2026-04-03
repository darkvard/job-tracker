import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Briefcase, Plus, Bell, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import SettingsDropdown from '@/app/components/SettingsDropdown'

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { t } = useTranslation()

  const NAV_LINKS = [
    { label: t('nav.dashboard'), to: '/' },
    { label: t('nav.applications'), to: '/jobs' },
    { label: t('nav.analytics'), to: '/analytics' },
  ]

  function isActive(to: string) {
    if (to === '/') return location.pathname === '/'
    return location.pathname.startsWith(to)
  }

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <nav className="sticky top-0 z-50 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 sm:px-6 lg:px-8">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 mr-8 flex-shrink-0">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
          <Briefcase className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-semibold text-gray-900 dark:text-white">JobTracker</span>
      </Link>

      {/* Nav links — hidden on mobile */}
      <div className="hidden md:flex items-center gap-1 flex-1">
        {NAV_LINKS.map(({ label, to }) => (
          <Link
            key={to}
            to={to}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive(to)
                ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Add Application */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/jobs/new')}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">{t('nav.addApplication')}</span>
        </motion.button>

        {/* Settings (theme + language) */}
        <SettingsDropdown />

        {/* Bell — decorative */}
        <button className="relative p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Avatar / logout */}
        <button
          onClick={handleLogout}
          title="Logout"
          className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center hover:bg-indigo-700 transition-colors"
        >
          <User className="w-4 h-4 text-white" />
        </button>
      </div>
    </nav>
  )
}
