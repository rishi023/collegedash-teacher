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

export const setLogoutCallback = (callback: () => void) => {
  globalLogoutCallback = callback
}

// axios custom instance
const api = axios.create({
  baseURL: process.env.API_BASE ?? 'https://multi-prod-api.studyaid.in/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

const handleRequest = async (config: InternalAxiosRequestConfig) => {
  const accessToken = await storage.getToken()

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
}

const handleResponseSuccess = (res: AxiosResponse) => {
  if (res?.data && !res.data.error) {
    return res.data
  }

  console.log('error in API nw')
  //   const errorMessage = res?.data?.errorMessage;
  //   bus.emit('API_ERROR', { message: errorMessage });

  return null
}

api.interceptors.request.use(handleRequest, error => Promise.reject(error))

api.interceptors.response.use(handleResponseSuccess, async error => {
  const UNAUTHORIZED = 401
  if (error?.response?.status === UNAUTHORIZED) {
    // Clear auth data and trigger logout
    await storage.clearAuthData()
    if (globalLogoutCallback) {
      globalLogoutCallback()
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

export { typedApi as api, axios }
