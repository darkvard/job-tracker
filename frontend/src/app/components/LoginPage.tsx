import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Briefcase, AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'

function LoginForm() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : t('auth.invalidCredentials')
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="login-email">{t('auth.email')}</Label>
        <Input
          id="login-email"
          type="email"
          placeholder={t('auth.emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="login-password">{t('auth.password')}</Label>
        <Input
          id="login-password"
          type="password"
          placeholder={t('auth.passwordPlaceholder')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t('auth.signingIn') : t('auth.signIn')}
        </Button>
      </motion.div>
    </form>
  )
}

function RegisterForm() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(email, password, name)
      navigate('/', { replace: true })
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : t('auth.registrationFailed')
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="register-name">{t('auth.fullName')}</Label>
        <Input
          id="register-name"
          type="text"
          placeholder={t('common.namePlaceholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="register-email">{t('auth.email')}</Label>
        <Input
          id="register-email"
          type="email"
          placeholder={t('auth.emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="register-password">{t('auth.password')}</Label>
        <Input
          id="register-password"
          type="password"
          placeholder={t('auth.passwordHint')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t('auth.creatingAccount') : t('auth.createAccount')}
        </Button>
      </motion.div>
    </form>
  )
}

export default function LoginPage() {
  const { isAuthenticated } = useAuth()
  const { t } = useTranslation()
  if (isAuthenticated) return <Navigate to="/" replace />

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-semibold text-gray-900 dark:text-white">JobTracker</span>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <Tabs defaultValue="login">
            <TabsList className="w-full mb-6">
              <TabsTrigger value="login" className="flex-1">{t('auth.signIn')}</TabsTrigger>
              <TabsTrigger value="register" className="flex-1">{t('auth.createAccount')}</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <div className="mb-5">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t('auth.welcomeBack')}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('auth.signInToAccount')}</p>
              </div>
              <LoginForm />
            </TabsContent>

            <TabsContent value="register">
              <div className="mb-5">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t('auth.getStarted')}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('auth.createFreeAccount')}</p>
              </div>
              <RegisterForm />
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
    </div>
  )
}
