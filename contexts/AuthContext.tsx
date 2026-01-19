import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { signIn, getStudentProfile } from '@/services/account'
import { storage } from '@/services/storage'
import { setLogoutCallback } from '@/services/axios'

interface StudentDetails {
  studentId: string
  name: string
  imageUrl: string
  className: string
  classId: string
  section: string
  rollNo: number
  batchName: string
  batchId: string
  institutionId: string
  fatherName: string
  motherName: string | null
  mobile: string
  dob: string
  admissionNo: number
  admissionDate: string
  gender: string
  bloodGroup: string | null
  address: string | null
  houseName: string | null
  state: string | null
  country: string | null
  district: string | null
  pinCode: string | null
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
  studentDetails?: StudentDetails
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

    // Register logout callback for automatic logout on 401 responses
    setLogoutCallback(() => {
      setUser(null)
    })
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = await storage.getToken()
      const userData = await storage.getUserData()

      if (token && userData) {
        // Fetch fresh student details on every reload
        try {
          const studentDetailsResponse = await getStudentProfile(userData.username)
          if (studentDetailsResponse) {
            userData.studentDetails = studentDetailsResponse
            // Update storage with fresh student details
            await storage.setUserData(userData)
          }
        } catch (studentError) {
          console.error('Error fetching student details on reload:', studentError)
          // Continue with cached user data even if student details fetch fails
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

      checkAuthStatus()

      await storage.setUserData(userData)
      setUser(userData)
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await storage.clearAuthData()
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
      throw error
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
