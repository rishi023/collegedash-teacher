import { ThemedText } from '@/components/ThemedText'
import { IconSymbol, IconSymbolName } from '@/components/ui/IconSymbol'
import { APP_INFO } from '@/constants'
import { useAuth } from '@/contexts/AuthContext'
import { useBottomSheet } from '@/contexts/BottomSheetContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useThemeColor } from '@/hooks/useThemeColor'
import { router } from 'expo-router'
import React, { useState } from 'react'
import { Alert, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

interface SettingSection {
  title: string
  items: {
    title: string
    subtitle: string
    icon: IconSymbolName
    color: string
    type: 'action' | 'toggle'
    value?: boolean
    action?: () => void
    onToggle?: React.Dispatch<React.SetStateAction<boolean>>
  }[]
}

export default function SettingsScreen() {
  const backgroundColor = useThemeColor({}, 'secondary')
  const cardBackground = useThemeColor({}, 'card')
  const textColor = useThemeColor({}, 'text')
  const mutedColor = useThemeColor({}, 'muted')
  const borderColor = useThemeColor({}, 'border')
  const { theme, setTheme } = useTheme()
  const { logout } = useAuth()
  const { showConfirm, showAlert } = useBottomSheet()

  // Settings state
  const [notifications, setNotifications] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [vibrationEnabled, setVibrationEnabled] = useState(true)
  const [autoSync, setAutoSync] = useState(true)

  const showThemeSelector = () => {
    showConfirm({
      title: 'Choose Theme',
      message: 'Select your preferred theme',
      buttons: [
        { text: 'System', onPress: () => setTheme('system') },
        { text: 'Light', onPress: () => setTheme('light') },
        { text: 'Dark', onPress: () => setTheme('dark') },
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
      ],
    })
  }

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return 'sun.max'
      case 'dark':
        return 'moon'
      default:
        return 'iphone'
    }
  }

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light'
      case 'dark':
        return 'Dark'
      default:
        return 'System'
    }
  }

  const handleLogout = () => {
    showConfirm({
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      buttons: [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout()
              router.replace('/login')
            } catch (error) {
              console.error(error)
              showAlert('Error', 'Failed to logout. Please try again.')
            }
          },
        },
      ],
    })
  }

  const settingsSections: SettingSection[] = [
    {
      title: 'Appearance',
      items: [
        {
          title: 'Theme',
          subtitle: `Current: ${getThemeLabel()}`,
          icon: getThemeIcon(),
          color: '#8b5cf6',
          type: 'action',
          action: showThemeSelector,
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          title: 'Push Notifications',
          subtitle: 'Receive app notifications',
          icon: 'bell.fill',
          color: '#f59e0b',
          type: 'toggle',
          value: notifications,
          onToggle: setNotifications,
        },
        {
          title: 'Sound',
          subtitle: 'Play notification sounds',
          icon: 'speaker.wave.2.fill',
          color: '#10b981',
          type: 'toggle',
          value: soundEnabled,
          onToggle: setSoundEnabled,
        },
        {
          title: 'Vibration',
          subtitle: 'Vibrate on notifications',
          icon: 'iphone.radiowaves.left.and.right',
          color: '#6366f1',
          type: 'toggle',
          value: vibrationEnabled,
          onToggle: setVibrationEnabled,
        },
      ],
    },
    {
      title: 'Data & Sync',
      items: [
        {
          title: 'Auto Sync',
          subtitle: 'Automatically sync data',
          icon: 'arrow.clockwise.circle.fill',
          color: '#06b6d4',
          type: 'toggle',
          value: autoSync,
          onToggle: setAutoSync,
        },
        {
          title: 'Clear Cache',
          subtitle: 'Free up storage space',
          icon: 'trash.circle.fill',
          color: '#ef4444',
          type: 'action',
          action: () => Alert.alert('Clear Cache', 'Cache cleared successfully!'),
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          title: 'Change Password',
          subtitle: 'Update your password',
          icon: 'lock.fill',
          color: '#059669',
          type: 'action',
          action: () =>
            Alert.alert(
              'Change Password',
              'Password change functionality will be available once connected to the API.',
            ),
        },
        {
          title: 'Privacy Settings',
          subtitle: 'Manage your privacy',
          icon: 'shield.fill',
          color: '#7c3aed',
          type: 'action',
          action: () =>
            Alert.alert(
              'Privacy Settings',
              'Privacy settings will be available in the next update.',
            ),
        },
        {
          title: 'Logout',
          subtitle: 'Sign out of your account',
          icon: 'arrow.right.square.fill',
          color: '#ef4444',
          type: 'action',
          action: handleLogout,
        },
      ],
    },
  ]

  return (
    <SafeAreaView
      edges={{ top: 'off', bottom: 'additive' }}
      style={[styles.container, { backgroundColor }]}
    >
      <View style={styles.scrollWrapper}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
              {section.title}
            </ThemedText>
            <View style={[styles.sectionContent, { backgroundColor: cardBackground }]}>
              {section.items.map((item, itemIndex) => (
                <View
                  key={itemIndex}
                  style={[
                    styles.settingItem,
                    { borderBottomColor: borderColor },
                    itemIndex === section.items.length - 1 && styles.lastItem,
                  ]}
                >
                  <TouchableOpacity
                    style={styles.settingItemContent}
                    onPress={item.type === 'action' ? item.action : undefined}
                    disabled={item.type === 'toggle'}
                  >
                    <View style={styles.settingLeft}>
                      <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
                        <IconSymbol name={item.icon} size={20} color={item.color} />
                      </View>
                      <View style={styles.settingText}>
                        <ThemedText style={[styles.settingTitle, { color: textColor }]}>
                          {item.title}
                        </ThemedText>
                        <ThemedText style={[styles.settingSubtitle, { color: mutedColor }]}>
                          {item.subtitle}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.settingRight}>
                      {item.type === 'toggle' ? (
                        <Switch
                          value={item.value}
                          onValueChange={item.onToggle}
                          trackColor={{ false: borderColor, true: item.color }}
                          thumbColor={'#ffffff'}
                        />
                      ) : (
                        <IconSymbol name="chevron.right" size={16} color={mutedColor} />
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.footer}>
          <ThemedText style={[styles.footerText, { color: mutedColor }]}>
            {APP_INFO.NAME} Teacher App v1.0.0
          </ThemedText>
          <ThemedText style={[styles.footerSubtext, { color: mutedColor }]}>
            College Management System
          </ThemedText>
        </View>
      </ScrollView>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollWrapper: { flex: 1, minHeight: 0 },
  scrollContent: { flexGrow: 1, paddingBottom: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    paddingTop: 10,
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginHorizontal: 20,
  },
  sectionContent: {
    marginHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settingItem: {
    borderBottomWidth: 1,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  settingItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
  },
  settingRight: {
    marginLeft: 12,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 14,
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
  },
})
