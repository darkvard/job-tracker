import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { ToastProvider } from '@/contexts/ToastContext'
import LoginPage from '@/app/components/LoginPage'
import ProtectedLayout from '@/app/ProtectedLayout'
import Dashboard from '@/app/components/Dashboard'
import ApplicationsList from '@/app/components/ApplicationsList'
import AddApplicationForm from '@/app/components/AddApplicationForm'
import ApplicationDetail from '@/app/components/ApplicationDetail'
import Analytics from '@/app/components/Analytics'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

export default function App() {
  return (
    <ThemeProvider>
    <LanguageProvider>
    <ToastProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/jobs" element={<ApplicationsList />} />
              <Route path="/jobs/new" element={<AddApplicationForm />} />
              <Route path="/jobs/:id" element={<ApplicationDetail />} />
              <Route path="/analytics" element={<Analytics />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
    </ToastProvider>
    </LanguageProvider>
    </ThemeProvider>
  )
}
