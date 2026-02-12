import { Tabs, useRouter } from 'expo-router'
import React, { useState } from 'react'
import { Image, Platform, Pressable, StyleSheet, View } from 'react-native'

import { AppHeader } from '@/components/AppHeader'
import { ThemedText } from '@/components/ThemedText'
import { HapticTab } from '@/components/HapticTab'
import { IconSymbol } from '@/components/ui/IconSymbol'
import { Colors } from '@/constants/Colors'
import { BOTTOM_NAV_HEIGHT, BOTTOM_NAV_ICON_SIZE, getElevation } from '@/constants/Material'
import { useColorScheme } from '@/hooks/useColorScheme'
import { useAuth } from '@/contexts/AuthContext'

const TAB_HEADER_TITLES: Record<string, string> = {
  index: 'Dashboard',
  profile: 'Profile',
  explore: 'More',
}

function HeaderAvatar() {
  const { user } = useAuth()
  const router = useRouter()
  const [imgError, setImgError] = useState(false)
  const imageUrl = user?.staffDetails?.imageUrl
  const firstLetter = (user?.staffDetails?.firstName || user?.firstName || '?')[0].toUpperCase()

  return (
    <Pressable onPress={() => router.push('/(tabs)/profile')} hitSlop={4} style={styles.avatarBtn}>
      {imageUrl && !imgError ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.headerAvatar}
          onError={() => setImgError(true)}
        />
      ) : (
        <View style={styles.headerAvatarFallback}>
          <ThemedText style={styles.headerAvatarLetter}>{firstLetter}</ThemedText>
        </View>
      )}
    </Pressable>
  )
}

export default function TabLayout() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']

  return (
    <Tabs
      screenOptions={({ route }) => ({
        header: () => (
          <AppHeader
            title={TAB_HEADER_TITLES[route.name] ?? 'Dashboard'}
            showBack={false}
            rightAction={<HeaderAvatar />}
          />
        ),
        headerShadowVisible: false,
        contentStyle: { flex: 1, minHeight: 0 },
        sceneContainerStyle: { flex: 1, minHeight: 0 },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
        tabBarIconStyle: { marginBottom: -2 },
        tabBarButton: HapticTab,
        tabBarStyle: [
          styles.tabBar,
          { backgroundColor: colors.card },
          getElevation(8),
        ],
        tabBarItemStyle: { paddingVertical: 8 },
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <IconSymbol size={BOTTOM_NAV_ICON_SIZE} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={BOTTOM_NAV_ICON_SIZE} name="person.circle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'More',
          tabBarIcon: ({ color }) => <IconSymbol size={BOTTOM_NAV_ICON_SIZE} name="ellipsis.circle.fill" color={color} />,
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    height: BOTTOM_NAV_HEIGHT + (Platform.OS === 'ios' ? 24 : 8),
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
    borderTopWidth: 0,
  },
  avatarBtn: {
    marginRight: 8,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  headerAvatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarLetter: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
})
