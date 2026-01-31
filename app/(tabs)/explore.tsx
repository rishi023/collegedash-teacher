import { SectionHeader } from '@/components/SectionHeader'
import { ThemedText } from '@/components/ThemedText'
import { IconSymbol, IconSymbolName } from '@/components/ui/IconSymbol'
import { useAuth } from '@/contexts/AuthContext'
import { useBottomSheet } from '@/contexts/BottomSheetContext'
import { getCardShadow } from '@/constants/Material'
import { useThemeColor } from '@/hooks/useThemeColor'
import { APP_INFO } from '@/constants'
import * as Haptics from 'expo-haptics'
import { Href, router } from 'expo-router'
import React from 'react'
import {
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

function AboutBottomSheetContent() {
  const textColor = useThemeColor({}, 'text')
  const mutedColor = useThemeColor({}, 'muted')
  const primaryColor = useThemeColor({}, 'primary')
  return (
    <View style={aboutContentStyles.wrap}>
      <ThemedText style={[aboutContentStyles.appName, { color: textColor }]}>
        {APP_INFO.NAME} Staff App
      </ThemedText>
      <ThemedText style={[aboutContentStyles.version, { color: mutedColor }]}>
        Version 1.0.0
      </ThemedText>
      <ThemedText style={[aboutContentStyles.tagline, { color: textColor }]}>
        College Management System
      </ThemedText>
      <ThemedText style={[aboutContentStyles.body, { color: mutedColor }]}>
        Developed for staff and teachers. Mark attendance, view payslips, give assignments, and more.
      </ThemedText>
      <View style={aboutContentStyles.poweredByRow}>
        <ThemedText style={[aboutContentStyles.poweredBy, { color: mutedColor }]}>
          Powered by{' '}
        </ThemedText>
        <ThemedText style={[aboutContentStyles.brand, { color: primaryColor }]}>
          college
        </ThemedText>
        <ThemedText style={[aboutContentStyles.brandDash, { color: '#059669' }]}>
          dash
        </ThemedText>
      </View>
    </View>
  )
}

const aboutContentStyles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  appName: { fontSize: 18, fontWeight: '700', marginBottom: 4, textAlign: 'center' },
  version: { fontSize: 14, marginBottom: 12, textAlign: 'center' },
  tagline: { fontSize: 16, fontWeight: '600', marginBottom: 8, textAlign: 'center' },
  body: { fontSize: 15, lineHeight: 22, marginBottom: 16, textAlign: 'center' },
  poweredByRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  poweredBy: { fontSize: 15 },
  brand: { fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  brandDash: { fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
})

function HelpSupportBottomSheetContent() {
  const textColor = useThemeColor({}, 'text')
  const mutedColor = useThemeColor({}, 'muted')
  const primaryColor = useThemeColor({}, 'primary')
  return (
    <View style={helpContentStyles.wrap}>
      <ThemedText style={[helpContentStyles.intro, { color: mutedColor }]}>
        Get in touch with us
      </ThemedText>
      <View style={helpContentStyles.row}>
        <ThemedText style={[helpContentStyles.label, { color: mutedColor }]}>Email</ThemedText>
        <ThemedText style={[helpContentStyles.value, { color: textColor }]} selectable>
          {APP_INFO.contactEmail}
        </ThemedText>
      </View>
      <View style={helpContentStyles.row}>
        <ThemedText style={[helpContentStyles.label, { color: mutedColor }]}>Phone</ThemedText>
        <ThemedText style={[helpContentStyles.value, { color: primaryColor }]} selectable>
          {APP_INFO.contactPhone}
        </ThemedText>
      </View>
    </View>
  )
}

const helpContentStyles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  intro: { fontSize: 15, marginBottom: 16, textAlign: 'center' },
  row: { marginBottom: 12, alignItems: 'center' },
  label: { fontSize: 13, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 16, fontWeight: '600' },
})

interface MenuItem {
  title: string
  subtitle: string
  icon: IconSymbolName
  color: string
  action: () => void
}

interface Action {
  title: string
  icon: IconSymbolName
  route: Href
  color: string
}

export default function MoreScreen() {
  const { user, logout } = useAuth()
  const { showConfirm, showAlert } = useBottomSheet()
  const backgroundColor = useThemeColor({}, 'secondary')
  const cardBackground = useThemeColor({}, 'card')
  const textColor = useThemeColor({}, 'text')
  const mutedColor = useThemeColor({}, 'muted')
  const borderColor = useThemeColor({}, 'border')

  const menuItems: MenuItem[] = [
    {
      title: 'Settings',
      subtitle: 'App preferences and theme settings',
      icon: 'gearshape.fill',
      color: '#6b7280',
      action: () => router.push('/settings'),
    },
    {
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      icon: 'questionmark.circle.fill',
      color: '#2563eb',
      action: () => showAlert('Help & Support', <HelpSupportBottomSheetContent />),
    },
    {
      title: 'About',
      subtitle: 'App version and information',
      icon: 'info.circle.fill',
      color: '#059669',
      action: () => showAlert('About', <AboutBottomSheetContent />),
    },
    {
      title: 'Privacy Policy',
      subtitle: 'Read our privacy policy',
      icon: 'shield.fill',
      color: '#7c3aed',
      action: () =>
        showAlert(
          'Privacy Policy',
          'Your privacy is important to us. We collect minimal data necessary for app functionality.',
        ),
    },
    {
      title: 'Terms of Service',
      subtitle: 'Terms and conditions',
      icon: 'doc.text.fill',
      color: '#dc2626',
      action: () =>
        showAlert(
          'Terms of Service',
          'By using this app, you agree to our terms and conditions.',
        ),
    },
  ]

  const quickActions: Action[] = [
    {
      title: 'Self Attendance',
      icon: 'checkmark.circle.fill',
      color: '#10b981',
      route: '/self-attendance',
    },
    {
      title: 'Attendance Report',
      icon: 'calendar',
      color: '#f59e0b',
      route: '/attendance-report',
    },
    {
      title: 'Payslips',
      icon: 'creditcard.fill',
      color: '#059669',
      route: '/payslips',
    },
    {
      title: 'Mark Attendance',
      icon: 'person.2.fill',
      color: '#8b5cf6',
      route: '/attendance',
    },
    {
      title: 'Student Comments',
      icon: 'bubble.left.and.bubble.right.fill',
      color: '#0ea5e9',
      route: '/student-comments',
    },
    {
      title: 'Assignments',
      icon: 'book.fill',
      color: '#6366f1',
      route: '/assignments',
    },
    {
      title: 'Homework',
      icon: 'doc.text.fill',
      color: '#3b82f6',
      route: '/homework',
    },
    {
      title: 'E-Content',
      icon: 'book.fill',
      color: '#8b5cf6',
      route: '/e-content',
    },
    {
      title: 'My Subjects',
      icon: 'book.fill',
      color: '#7c3aed',
      route: '/subjects',
    },
    {
      title: 'Notifications',
      icon: 'bell.fill',
      color: '#f59e0b',
      route: '/notifications',
    },
    {
      title: 'Timetable',
      icon: 'clock.fill',
      color: '#06b6d4',
      route: '/timetable',
    },
    {
      title: 'My Grievances',
      icon: 'exclamationmark.bubble.fill',
      color: '#f59e0b',
      route: '/grievances',
    },
  ]

  return (
    <SafeAreaView
      edges={{ top: 'additive', bottom: 'off' }}
      style={[styles.container, { backgroundColor }]}
    >
      <View
        style={[
          styles.scrollWrapper,
          Platform.OS === 'web' && styles.scrollWrapperWeb,
          Platform.OS === 'android' && styles.scrollWrapperAndroid,
        ]}
        collapsable={false}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={Platform.OS === 'android'}
          removeClippedSubviews={false}
        >
        <View style={styles.header}>
          <ThemedText style={[styles.headerTitle, { color: textColor }]}>More</ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: mutedColor }]}>
            Hello, {user?.staffDetails?.firstName || user?.firstName || 'Staff'}!
          </ThemedText>
        </View>

        <View style={styles.quickActionsContainer}>
          <SectionHeader title="Quick Access" />
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.quickActionCard, { backgroundColor: cardBackground }]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  }
                  router.push(action.route)
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}20` }]}>
                  <IconSymbol name={action.icon} size={24} color={action.color} />
                </View>
                <ThemedText style={[styles.quickActionTitle, { color: textColor }]}>
                  {action.title}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.menuContainer}>
          <SectionHeader title="Menu" />
          <View style={[styles.menuItems, { backgroundColor: cardBackground }]}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.menuItem,
                  { borderBottomColor: borderColor },
                  index === menuItems.length - 1 && styles.lastMenuItem,
                ]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  }
                  item.action()
                }}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuItemIcon, { backgroundColor: `${item.color}20` }]}>
                    <IconSymbol name={item.icon} size={20} color={item.color} />
                  </View>
                  <View style={styles.menuItemText}>
                    <ThemedText style={[styles.menuItemTitle, { color: textColor }]}>
                      {item.title}
                    </ThemedText>
                    <ThemedText style={[styles.menuItemSubtitle, { color: mutedColor }]}>
                      {item.subtitle}
                    </ThemedText>
                  </View>
                </View>
                <IconSymbol name="chevron.right" size={16} color={mutedColor} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.logoutButton,
              { backgroundColor: cardBackground, borderColor: 'transparent' },
            ]}
            onPress={() => {
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
            }}
          >
            <IconSymbol name="arrow.right.square.fill" size={20} color="#ef4444" />
            <ThemedText style={[styles.logoutText, { color: useThemeColor({}, 'error') }]}>
              Logout
            </ThemedText>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    ...(Platform.OS === 'web' ? { minHeight: '100vh' as unknown as number } : {}),
  },
  scrollWrapper: {
    flex: 1,
    minHeight: 0,
    flexBasis: 0,
  },
  scrollWrapperWeb: Platform.OS === 'web'
    ? { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' as const }
    : {},
  scrollWrapperAndroid: Platform.OS === 'android'
    ? { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 }
    : {},
  scrollView: {
    flex: 1,
    minHeight: 0,
    flexBasis: 0,
    ...(Platform.OS === 'web' ? { overflow: 'auto' as const } : {}),
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  quickActionsContainer: {
    padding: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    ...getCardShadow(),
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  menuContainer: {
    padding: 20,
  },
  menuItems: {
    borderRadius: 12,
    ...getCardShadow(),
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 12,
  },
  footer: {
    padding: 20,
    paddingTop: 0,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    ...getCardShadow(),
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
})
