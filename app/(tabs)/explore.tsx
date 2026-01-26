import { ThemedText } from '@/components/ThemedText'
import { IconSymbol, IconSymbolName } from '@/components/ui/IconSymbol'
import { useThemeColor } from '@/hooks/useThemeColor'
import { useAuth } from '@/contexts/AuthContext'
import { Href, router } from 'expo-router'
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { APP_INFO } from '@/constants'

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
      action: () =>
        Alert.alert(
          'Help & Support',
          `Contact: ${APP_INFO.contactEmail}\nPhone: ${APP_INFO.contactEmail}`,
        ),
    },
    {
      title: 'About',
      subtitle: 'App version and information',
      icon: 'info.circle.fill',
      color: '#059669',
      action: () =>
        Alert.alert(
          'About',
          `${APP_INFO.NAME} Teacher App v1.0.0\nSchool Management System\n\nDeveloped for modern education needs.`,
        ),
    },
    {
      title: 'Privacy Policy',
      subtitle: 'Read our privacy policy',
      icon: 'shield.fill',
      color: '#7c3aed',
      action: () =>
        Alert.alert(
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
        Alert.alert(
          'Terms of Service',
          'By using this app, you agree to our terms and conditions.',
        ),
    },
  ]

  const quickActions: Action[] = [
    {
      title: 'Grades',
      icon: 'chart.bar.fill',
      color: '#10b981',
      route: '/grades',
    },
    {
      title: 'Attendance',
      icon: 'calendar',
      color: '#f59e0b',
      route: '/attendance',
    },
    {
      title: 'Assignments',
      icon: 'book.fill',
      color: '#8b5cf6',
      route: '/assignments',
    },
    {
      title: 'Homework',
      icon: 'book.fill',
      color: '#3b82f6',
      route: '/homework',
    },
    // {
    //   title: 'Notifications',
    //   icon: 'bell.fill',
    //   color: '#f59e0b',
    //   route: '/notifications',
    // },
    // {
    //   title: 'Timetable',
    //   icon: 'clock.fill',
    //   color: '#06b6d4',
    //   route: '/timetable',
    // },
  ]

  return (
    <SafeAreaView
      edges={{ top: 'additive', bottom: 'off' }}
      style={[styles.container, { backgroundColor }]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText style={[styles.headerTitle, { color: textColor }]}>More</ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: mutedColor }]}>
            Hello, {user?.studentDetails?.name?.split(' ')[0] || user?.firstName || 'Student'}!
          </ThemedText>
        </View>

        <View style={styles.quickActionsContainer}>
          <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Quick Access</ThemedText>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.quickActionCard, { backgroundColor: cardBackground }]}
                onPress={() => router.push(action.route)}
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
          <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Menu</ThemedText>
          <View style={[styles.menuItems, { backgroundColor: cardBackground }]}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.menuItem,
                  { borderBottomColor: borderColor },
                  index === menuItems.length - 1 && styles.lastMenuItem,
                ]}
                onPress={item.action}
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
              Alert.alert('Logout', 'Are you sure you want to logout?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Logout',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await logout()
                      router.replace('/login')
                    } catch (error) {
                      console.error(error)
                      Alert.alert('Error', 'Failed to logout. Please try again.')
                    }
                  },
                },
              ])
            }}
          >
            <IconSymbol name="arrow.right.square.fill" size={20} color="#ef4444" />
            <ThemedText style={[styles.logoutText, { color: useThemeColor({}, 'error') }]}>
              Logout
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
})
