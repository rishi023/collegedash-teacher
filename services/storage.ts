import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  USER_DATA: 'userData',
  ONBOARDING_SEEN: 'onboardingSeen',
  THEME_PREFERENCE: 'themePreference',
} as const

export const storage = {
  // Token management
  async setToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token)
    } catch (error) {
      console.error('Error saving token:', error)
      throw error
    }
  },

  async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
    } catch (error) {
      console.error('Error getting token:', error)
      return null
    }
  },

  async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
    } catch (error) {
      console.error('Error removing token:', error)
      throw error
    }
  },

  // User data management
  async setUserData(userData: any): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData))
    } catch (error) {
      console.error('Error saving user data:', error)
      throw error
    }
  },

  async getUserData(): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Error getting user data:', error)
      return null
    }
  },

  async removeUserData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA)
    } catch (error) {
      console.error('Error removing user data:', error)
      throw error
    }
  },

  // Clear all auth data
  async clearAuthData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([STORAGE_KEYS.ACCESS_TOKEN, STORAGE_KEYS.USER_DATA])
    } catch (error) {
      console.error('Error clearing auth data:', error)
      throw error
    }
  },

  // Onboarding (first-time flow)
  async getOnboardingSeen(): Promise<boolean> {
    try {
      const v = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_SEEN)
      return v === 'true'
    } catch {
      return false
    }
  },

  async setOnboardingSeen(seen: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_SEEN, seen ? 'true' : 'false')
    } catch (error) {
      console.error('Error saving onboarding seen:', error)
      throw error
    }
  },

  // Theme preference (light | dark | system)
  async getThemePreference(): Promise<'light' | 'dark' | 'system' | null> {
    try {
      return (await AsyncStorage.getItem(STORAGE_KEYS.THEME_PREFERENCE)) as 'light' | 'dark' | 'system' | null
    } catch {
      return null
    }
  },

  async setThemePreference(pref: 'light' | 'dark' | 'system'): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME_PREFERENCE, pref)
    } catch (error) {
      console.error('Error saving theme preference:', error)
      throw error
    }
  },
}
