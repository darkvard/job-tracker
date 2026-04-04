import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { api, type User } from '@/lib/api'

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  updateUser: (user: User) => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType>(null!)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('jwt'))
  const [user, setUser] = useState<User | null>(null)

  // Hydrate user on mount if a token already exists (e.g. after page refresh).
  useEffect(() => {
    if (token && !user) {
      api.auth.me().then((res) => setUser(res.data)).catch(() => {
        // Token is invalid or expired — clear it.
        localStorage.removeItem('jwt')
        setToken(null)
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (email: string, password: string) => {
    const res = await api.auth.login({ email, password })
    localStorage.setItem('jwt', res.data.token)
    setToken(res.data.token)
    setUser(res.data.user)
  }

  const register = async (email: string, password: string, name: string) => {
    const res = await api.auth.register({ email, password, name })
    localStorage.setItem('jwt', res.data.token)
    setToken(res.data.token)
    setUser(res.data.user)
  }

  const logout = () => {
    localStorage.removeItem('jwt')
    setToken(null)
    setUser(null)
  }

  const updateUser = (updated: User) => {
    setUser(updated)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, updateUser, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
