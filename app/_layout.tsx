import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native'
import { useFonts } from 'expo-font'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect } from 'react'
import 'react-native-reanimated'

import { AppHeader } from '@/components/AppHeader'
import { Colors } from '@/constants/Colors'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { BottomSheetProvider } from '@/contexts/BottomSheetContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { useColorScheme } from '@/hooks/useColorScheme'

function LayoutContent() {
  const colorScheme = useColorScheme()
  const { isAuthenticated, isLoading } = useAuth()
  const segments = useSegments()
  const router = useRouter()
  const [onboardingChecked, setOnboardingChecked] = React.useState(false)
  const [hasSeenOnboarding, setHasSeenOnboarding] = React.useState(true)

  React.useEffect(() => {
    import('@/services/storage').then(({ storage }) => {
      storage.getOnboardingSeen().then(seen => {
        setHasSeenOnboarding(seen)
        setOnboardingChecked(true)
      })
    })
  }, [])

  useEffect(() => {
    if (segments[0] === 'login' && onboardingChecked) {
      import('@/services/storage').then(({ storage }) => {
        storage.getOnboardingSeen().then(seen => {
          if (seen) setHasSeenOnboarding(true)
        })
      })
    }
  }, [segments[0], onboardingChecked])

  useEffect(() => {
    if (!onboardingChecked || isLoading) return

    if (!hasSeenOnboarding && segments[0] !== 'login') {
      router.replace('/onboarding')
      return
    }
    if (segments[0] === 'onboarding') return

    const onLoginScreen = segments[0] === 'login'
    const onIndexOrRoot = segments[0] === 'index' || segments.length <= 0

    if (onIndexOrRoot) {
      if (!isAuthenticated) router.replace('/login')
      else router.replace('/(tabs)')
      return
    }
    if (!isAuthenticated && !onLoginScreen) {
      router.replace('/login')
    } else if (isAuthenticated && onLoginScreen) {
      router.replace('/(tabs)')
    }
  }, [isAuthenticated, isLoading, segments, onboardingChecked, hasSeenOnboarding])

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

  const screenOptions = (title: string) => ({
    headerShown: true,
    header: () => <AppHeader title={title} showBack />,
    headerShadowVisible: false,
  })

  const stackScreenOptions = {
    animation: 'default' as const,
    gestureEnabled: true,
    fullScreenGestureEnabled: true,
    contentStyle: {
      backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
    },
  }

  return (
    <NavigationThemeProvider value={colorScheme === 'dark' ? customDarkTheme : customLightTheme}>
      <Stack screenOptions={stackScreenOptions}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="self-attendance" options={screenOptions('Self Attendance')} />
        <Stack.Screen name="staff-attendance" options={screenOptions('Staff Attendance')} />
        <Stack.Screen name="attendance" options={screenOptions('Attendance')} />
        <Stack.Screen name="e-content" options={screenOptions('E-Content')} />
        <Stack.Screen name="assignments" options={screenOptions('Assignments')} />
        <Stack.Screen name="homework" options={screenOptions('Homework')} />
        <Stack.Screen name="notifications" options={screenOptions('Notifications')} />
        <Stack.Screen name="news" options={screenOptions('News')} />
        <Stack.Screen name="news-detail" options={screenOptions('Article')} />
        <Stack.Screen name="announcements" options={screenOptions('Notices & Announcements')} />
        <Stack.Screen name="announcement-detail" options={screenOptions('Notice')} />
        <Stack.Screen name="image-viewer" options={screenOptions('Image')} />
        <Stack.Screen name="in-app-browser" options={screenOptions('Link')} />
        <Stack.Screen name="timetable" options={screenOptions('Time Table')} />
        <Stack.Screen name="subjects" options={screenOptions('My Subjects')} />
        <Stack.Screen name="settings" options={screenOptions('Settings')} />
        <Stack.Screen name="attendance-report" options={screenOptions('My Attendance Report')} />
        <Stack.Screen name="payslips" options={screenOptions('My Payslips')} />
        <Stack.Screen name="payslip-detail" options={screenOptions('Payslip')} />
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
        <BottomSheetProvider>
          <LayoutContent />
        </BottomSheetProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
