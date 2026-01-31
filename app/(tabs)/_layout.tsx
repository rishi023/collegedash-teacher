import { Tabs } from 'expo-router'
import React from 'react'
import { Platform, StyleSheet } from 'react-native'

import { AppHeader } from '@/components/AppHeader'
import { HapticTab } from '@/components/HapticTab'
import { IconSymbol } from '@/components/ui/IconSymbol'
import { Colors } from '@/constants/Colors'
import { BOTTOM_NAV_HEIGHT, BOTTOM_NAV_ICON_SIZE, getElevation } from '@/constants/Material'
import { useColorScheme } from '@/hooks/useColorScheme'

const TAB_HEADER_TITLES: Record<string, string> = {
  index: 'Dashboard',
  profile: 'Profile',
  explore: 'More',
}

export default function TabLayout() {
  const colorScheme = useColorScheme()
  const colors = Colors[colorScheme ?? 'light']

  return (
    <Tabs
      screenOptions={({ route }) => ({
        header: () => (
          <AppHeader title={TAB_HEADER_TITLES[route.name] ?? 'Dashboard'} showBack={false} />
        ),
        headerShadowVisible: false,
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
})
