import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react'
import { signIn, getStaffProfile, getRunningBatch, type StaffProfile } from '@/services/account'
import { storage } from '@/services/storage'
import { setLogoutCallback, setLatestToken } from '@/services/axios'

/** Thrown when a student-role user tries to log in to the teacher app. */
export class StudentUseAppError extends Error {
  readonly code = 'STUDENT_USE_APP'
  constructor() {
    super('Use the student app to sign in.')
    this.name = 'StudentUseAppError'
  }
}

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
  /** Set a callback to run when session expires (e.g. 401). Used by layout to redirect to login. */
  setRedirectToLoginOnSessionExpiry: (cb: (() => void) | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const redirectToLoginRef = useRef<(() => void) | null>(null)

  const setRedirectToLoginOnSessionExpiry = useCallback((cb: (() => void) | null) => {
    redirectToLoginRef.current = cb
  }, [])

  useEffect(() => {
    checkAuthStatus()

    setLogoutCallback(() => {
      setUser(null)
      redirectToLoginRef.current?.()
    })
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = await storage.getToken()
      const userData = await storage.getUserData()

      if (token && userData) {
        setLatestToken(token)
        try {
          const staffProfile = await getStaffProfile()
          if (staffProfile) {
            userData.staffDetails = staffProfile
          }
        } catch (staffError) {
          console.error('Error fetching staff profile on reload:', staffError)
        }

        try {
          const runningBatchId = await getRunningBatch()
          if (runningBatchId != null) {
            userData.runningBatchId = runningBatchId
            await storage.setUserData(userData)
          }
        } catch (batchError) {
          console.error('Error fetching running batch on reload:', batchError)
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

      const apiStatus = (response as { apiResponseStatus?: { code?: number; message?: string } | string })?.apiResponseStatus
      const statusCode = typeof apiStatus === 'object' ? apiStatus?.code : undefined
      const statusName = typeof apiStatus === 'string' ? apiStatus : undefined
      const isAccessDisabled =
        statusCode === 9010 || statusName === 'INSTITUTION_ACCESS_DISABLED'
      if (isAccessDisabled) {
        const msg =
          typeof apiStatus === 'object' && apiStatus?.message
            ? apiStatus.message
            : 'Reach out to administrator for the access'
        throw new Error(msg)
      }

      const { token, user: userData } = response.responseObject
      const rawRoles = userData?.roles
      const roleList = Array.isArray(rawRoles)
        ? rawRoles
        : rawRoles != null
          ? [rawRoles]
          : []
      const normalizedRoles = roleList.map((r: unknown) =>
        String(r ?? '')
          .toUpperCase()
          .replace(/^ROLE_/, '')
      )
      const isStudentOnly =
        normalizedRoles.length === 0 ||
        (normalizedRoles.length === 1 && normalizedRoles[0] === 'STUDENT')
      if (isStudentOnly) {
        throw new StudentUseAppError()
      }

      await storage.setToken(token)
      setLatestToken(token)
      await storage.setUserData(userData)
      setUser(userData)

      try {
        const staffProfile = await getStaffProfile()
        if (staffProfile) {
          userData.staffDetails = staffProfile
        }
      } catch (staffError) {
        console.error('Error fetching staff profile after login:', staffError)
      }

      try {
        const runningBatchId = await getRunningBatch(token)
        if (runningBatchId != null) userData.runningBatchId = runningBatchId
      } catch (batchError) {
        console.error('Error fetching running batch after login:', batchError)
      }

      await storage.setUserData(userData)
      setUser({ ...userData })
      // Keep token in setLatestToken so all subsequent API calls have it in axios defaults
    } catch (error) {
      console.error('Login error:', error)
      setLatestToken(null)
      throw error
    }
  }

  const logout = async () => {
    setUser(null)
    setLatestToken(null)
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
        setRedirectToLoginOnSessionExpiry,
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
