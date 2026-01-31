import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { signIn, getStaffProfile, type StaffProfile } from '@/services/account'
import { storage } from '@/services/storage'
import { setLogoutCallback } from '@/services/axios'

interface User {
  id: string
  institutionIds: string[]
  organisationId: string
  runningBatchId: string
  username: string
  firstName: string
  email: string
  activated: boolean
  roles: string[]
  permissions: string[]
  staffDetails?: StaffProfile
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuthStatus()

    setLogoutCallback(() => {
      setUser(null)
    })
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = await storage.getToken()
      const userData = await storage.getUserData()

      if (token && userData) {
        try {
          const staffProfile = await getStaffProfile()
          if (staffProfile) {
            userData.staffDetails = staffProfile
            await storage.setUserData(userData)
          }
        } catch (staffError) {
          console.error('Error fetching staff profile on reload:', staffError)
        }

        setUser(userData)
      }
    } catch (error) {
      console.error('Error checking auth status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (username: string, password: string) => {
    try {
      const response = await signIn({ username, password })

      if (!response) {
        throw new Error('Invalid credentials')
      }

      const { token, user: userData } = response.responseObject

      await storage.setToken(token)
      await storage.setUserData(userData)
      setUser(userData)

      try {
        const staffProfile = await getStaffProfile()
        if (staffProfile) {
          userData.staffDetails = staffProfile
          await storage.setUserData(userData)
          setUser({ ...userData })
        }
      } catch (staffError) {
        console.error('Error fetching staff profile after login:', staffError)
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const logout = async () => {
    setUser(null)
    try {
      await storage.clearAuthData()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
