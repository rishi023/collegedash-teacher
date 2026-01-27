import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native'
import { useFonts } from 'expo-font'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import 'react-native-reanimated'

import { Colors } from '@/constants/Colors'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { useColorScheme } from '@/hooks/useColorScheme'

function LayoutContent() {
  const colorScheme = useColorScheme()
  const { isAuthenticated, isLoading } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    const onLoginScreen = segments[0] === 'login' || segments.length <= 0

    if (!isAuthenticated && !onLoginScreen) {
      // User is not authenticated and trying to access protected content
      router.replace('/login')
    } else if (isAuthenticated && onLoginScreen) {
      // User is authenticated but on login screen, redirect to tabs
      router.replace('/(tabs)')
    }
    // Otherwise allow navigation to all other screens (grades, attendance, etc.)
  }, [isAuthenticated, isLoading, segments])

  const customDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: Colors.dark.background,
      card: Colors.dark.card,
      text: Colors.dark.text,
      border: Colors.dark.border,
      primary: Colors.dark.primary,
    },
  }

  const customLightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: Colors.light.background,
      card: Colors.light.card,
      text: Colors.light.text,
      border: Colors.light.border,
      primary: Colors.light.primary,
    },
  }

  return (
    <NavigationThemeProvider value={colorScheme === 'dark' ? customDarkTheme : customLightTheme}>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="self-attendance"
          options={{ headerShown: true, headerTitle: 'Self Attendance' }}
        />
        <Stack.Screen
          name="attendance"
          options={{ headerShown: true, headerTitle: 'Attendance' }}
        />
        <Stack.Screen
          name="assignments"
          options={{ headerShown: true, headerTitle: 'Assignments' }}
        />
        <Stack.Screen name="homework" options={{ headerShown: true, headerTitle: 'Homework' }} />
        <Stack.Screen
          name="notifications"
          options={{ headerShown: true, headerTitle: 'Notifications' }}
        />
        <Stack.Screen name="timetable" options={{ headerShown: true, headerTitle: 'Time Table' }} />
        <Stack.Screen name="subjects" options={{ headerShown: true, headerTitle: 'My Subjects' }} />
        <Stack.Screen name="settings" options={{ headerShown: true, headerTitle: 'Settings' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </NavigationThemeProvider>
  )
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  })

  if (!loaded) {
    // Async font loading only occurs in development.
    return null
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <LayoutContent />
      </AuthProvider>
    </ThemeProvider>
  )
}
