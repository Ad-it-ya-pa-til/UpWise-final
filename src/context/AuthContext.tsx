import React, { createContext, useContext, useState, useEffect } from 'react'
import { UserProfile } from '../types/navigation'
import { loginApi, registerApi, logoutApi, getAuthMeApi, getAuthToken } from '../services/api'

export interface AuthContextType {
  user: UserProfile | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: { email: string; password: string }) => Promise<UserProfile>
  register: (data: {
    name: string
    email: string
    password: string
    city?: string
    language?: string
    topics?: string[]
  }) => Promise<UserProfile>
  logout: () => Promise<void>
  checkAuth: () => Promise<UserProfile | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem('upwise_user_session')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [token, setToken] = useState<string | null>(() => getAuthToken())
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const checkAuth = async (): Promise<UserProfile | null> => {
    try {
      const verified = await getAuthMeApi()
      if (verified) {
        setUser(verified)
        setToken(getAuthToken())
        return verified
      } else {
        setUser(null)
        setToken(null)
        return null
      }
    } catch {
      return null
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const login = async (credentials: { email: string; password: string }): Promise<UserProfile> => {
    setIsLoading(true)
    try {
      const result = await loginApi(credentials)
      setUser(result.user)
      setToken(result.token)
      return result.user
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: {
    name: string
    email: string
    password: string
    city?: string
    language?: string
    topics?: string[]
  }): Promise<UserProfile> => {
    setIsLoading(true)
    try {
      const result = await registerApi(data)
      setUser(result.user)
      setToken(result.token)
      return result.user
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async (): Promise<void> => {
    setIsLoading(true)
    try {
      await logoutApi()
    } finally {
      setUser(null)
      setToken(null)
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isLoading,
        login,
        register,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
