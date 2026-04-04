import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Briefcase, Plus, Bell, User, LogOut, UserCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import SettingsDropdown from '@/app/components/SettingsDropdown'

export default function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const { t } = useTranslation()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const NAV_LINKS = [
    { label: t('nav.dashboard'), to: '/' },
    { label: t('nav.applications'), to: '/jobs' },
    { label: t('nav.analytics'), to: '/analytics' },
  ]

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    if (showUserMenu) document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [showUserMenu])

  function isActive(to: string) {
    if (to === '/') return location.pathname === '/'
    return location.pathname.startsWith(to)
  }

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : null

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

        {/* Avatar / user dropdown */}
        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => setShowUserMenu((v) => !v)}
            title={t('nav.profile')}
            className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center hover:bg-indigo-700 transition-colors"
          >
            {initials ? (
              <span className="text-white text-xs font-bold">{initials}</span>
            ) : (
              <User className="w-4 h-4 text-white" />
            )}
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1.5 z-50">
              {user && (
                <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                </div>
              )}
              <button
                onClick={() => { setShowUserMenu(false); navigate('/profile') }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <UserCircle className="w-4 h-4" />
                {t('nav.profile')}
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                {t('nav.logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
