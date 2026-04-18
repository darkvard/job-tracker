import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { ToastProvider } from '@/contexts/ToastContext'
import LoginPage from '@/app/components/LoginPage'
import ProtectedLayout from '@/app/ProtectedLayout'
import Dashboard from '@/app/components/Dashboard'
import ApplicationsList from '@/app/components/ApplicationsList'
import Analytics from '@/app/components/Analytics'
import ProfilePage from '@/app/components/ProfilePage'
import ComparisonPage from '@/app/components/ComparisonPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

// Redirect /jobs/:id → /jobs?open={id} so bookmarked URLs still work
function JobDetailRedirect() {
  const { id } = useParams<{ id: string }>()
  return <Navigate to={`/jobs?open=${id}`} replace />
}

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
              {/* Legacy routes → redirect to sheet-based URLs */}
              <Route path="/jobs/new" element={<Navigate to="/jobs?open=new" replace />} />
              <Route path="/jobs/:id" element={<JobDetailRedirect />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/compare" element={<ComparisonPage />} />
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
