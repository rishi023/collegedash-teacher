import axios, { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { storage } from './storage'

// Standard API response wrapper from backend
export interface ApiResponseStatus {
  code: number
  message: string
}

export interface ApiResponse<T = unknown> {
  status: string
  timeStamp: string
  message: string
  debugMessage: string
  apiResponseStatus: ApiResponseStatus
  responseObject: T
  error?: boolean
  errorMessage?: string
  planActive?: boolean
  userDisabled?: boolean
}

// Global logout callback
let globalLogoutCallback: (() => void) | null = null

/** Token set immediately after login so first requests have it before storage persists. Cleared on logout. */
let latestToken: string | null = null

export const setLogoutCallback = (callback: () => void) => {
  globalLogoutCallback = callback
}

/** Set token so it is sent on every request. Updates in-memory cache and axios default headers (so every request gets it even if interceptor runs late). */
export const setLatestToken = (token: string | null) => {
  latestToken = token
  if (api.defaults?.headers) {
    const common = api.defaults.headers.common as Record<string, string>
    if (token) {
      common['Authorization'] = `Bearer ${token}`
    } else {
      delete common['Authorization']
    }
  }
}

/** Single source of truth for auth token: storage first, then in-memory (for use by interceptors and fetch() calls). */
export const getAuthToken = async (): Promise<string | null> => {
  const fromStorage = await storage.getToken()
  if (fromStorage) return fromStorage
  return latestToken
}

// axios custom instance
const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

const handleRequest = async (config: InternalAxiosRequestConfig) => {
  // So super-admin engagement metrics can attribute actions to Teacher App
  config.headers = config.headers ?? {}
  ;(config.headers as Record<string, string>)['X-Client-Type'] = 'TEACHER_APP'

  const existingAuth = config.headers?.Authorization ?? config.headers?.authorization
  if (existingAuth) return config
  const accessToken = await getAuthToken()
  if (accessToken) {
    const headers = { ...config.headers, Authorization: `Bearer ${accessToken}` }
    config.headers = headers as InternalAxiosRequestConfig['headers']
    const common = api.defaults?.headers?.common as Record<string, string>
    if (common) common['Authorization'] = `Bearer ${accessToken}`
    latestToken = accessToken
  }
  return config
}

const handleResponseSuccess = async (res: AxiosResponse) => {
  const data = res?.data
  if (!data) return null

  // User disabled by institution – clear session and redirect to login
  if (data.userDisabled === true) {
    await storage.clearAuthData()
    if (globalLogoutCallback) globalLogoutCallback()
    return null
  }

  if (!data.error) return data

  console.log('error in API nw')
  return null
}

api.interceptors.request.use(handleRequest, error => Promise.reject(error))

api.interceptors.response.use(handleResponseSuccess, async error => {
  const UNAUTHORIZED = 401
  if (error?.response?.status === UNAUTHORIZED) {
    const hadAuth = !!(
      error?.config?.headers?.Authorization ?? error?.config?.headers?.authorization
    )
    if (hadAuth) {
      setLatestToken(null)
      await storage.clearAuthData()
      if (globalLogoutCallback) {
        globalLogoutCallback()
      }
    }
    return null
  }

  //   const errorMessage = error?.response?.data?.errorMessage;
  console.log('error in api call', error)

  //   bus.emit('API_ERROR', { message: errorMessage });
  return null
})

// Typed API client that reflects the interceptor transformation
// The response interceptor returns res.data (ApiResponse) or null, not AxiosResponse
type TypedApiClient = {
  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T> | null>
  post<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T> | null>
  put<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T> | null>
  patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T> | null>
  delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T> | null>
  defaults: typeof api.defaults
}

const typedApi = api as unknown as TypedApiClient

// Hydrate token from storage as soon as this module loads so default header is set before any request
storage.getToken().then(t => {
  if (t) setLatestToken(t)
})

export { typedApi as api, axios }
