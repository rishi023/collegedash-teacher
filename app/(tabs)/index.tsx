import { ThemedText } from '@/components/ThemedText'
import { IconSymbol, IconSymbolName } from '@/components/ui/IconSymbol'
import { useThemeColor } from '@/hooks/useThemeColor'
import { Href, router } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/contexts/AuthContext'
import { getAnnouncements, Announcement } from '@/services/account'

interface Action {
  title: string
  icon: IconSymbolName
  route: Href
  color: string
}

const { width } = Dimensions.get('window')

export default function DashboardScreen() {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(true)

  // const attendancePercentage = getAttendancePercentage()
  // const averageGrade = getAverageGrade()

  const backgroundColor = useThemeColor({}, 'secondary')
  const primaryColor = useThemeColor({}, 'primary')
  const cardBackground = useThemeColor({}, 'card')
  const textColor = useThemeColor({}, 'text')
  const mutedColor = useThemeColor({}, 'muted')
  const successColor = useThemeColor({}, 'success')
  const warningColor = useThemeColor({}, 'warning')
  const errorColor = useThemeColor({}, 'error')

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const institutionId = user?.studentDetails?.institutionId
        if (institutionId) {
          setIsLoadingAnnouncements(true)
          const response = await getAnnouncements(institutionId)
          if (response?.responseObject?.content) {
            setAnnouncements(response.responseObject.content)
          }
        }
      } catch (error) {
        console.error('Error fetching announcements:', error)
      } finally {
        setIsLoadingAnnouncements(false)
      }
    }

    fetchAnnouncements()
  }, [user?.studentDetails?.institutionId])

  const quickActions: Action[] = [
    { title: 'Grades', icon: 'chart.bar.fill', route: '/grades', color: successColor },
    { title: 'Attendance', icon: 'calendar', route: '/attendance', color: warningColor },
    { title: 'Homework', icon: 'book.fill', route: '/homework', color: errorColor },
    { title: 'Assignments', icon: 'book.fill', route: '/assignments', color: primaryColor },
  ]

  return (
    <SafeAreaView
      edges={{ top: 'additive', bottom: 'off' }}
      style={[styles.container, { backgroundColor }]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { backgroundColor: cardBackground }]}>
          <View style={styles.welcomeSection}>
            <ThemedText style={[styles.welcomeText, { color: mutedColor }]}>
              Welcome back,
            </ThemedText>
            <ThemedText style={[styles.studentName, { color: textColor }]}>
              {user?.studentDetails?.name || user?.firstName || 'Student'}
            </ThemedText>
            <ThemedText style={[styles.classInfo, { color: mutedColor }]}>
              {user?.studentDetails?.className || 'N/A'} - Section{' '}
              {user?.studentDetails?.section || 'N/A'}
            </ThemedText>
          </View>
        </View>

        {/* <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: cardBackground }]}>
            <View style={styles.statHeader}>
              <IconSymbol name="percent" size={24} color={successColor} />
              <ThemedText style={[styles.statValue, { color: textColor }]}>{attendancePercentage}%</ThemedText>
            </View>
            <ThemedText style={[styles.statLabel, { color: mutedColor }]}>Attendance</ThemedText>
          </View>

          <View style={[styles.statCard, { backgroundColor: cardBackground }]}>
            <View style={styles.statHeader}>
              <IconSymbol name="star.fill" size={24} color={warningColor} />
              <ThemedText style={[styles.statValue, { color: textColor }]}>{averageGrade}%</ThemedText>
            </View>
            <ThemedText style={[styles.statLabel, { color: mutedColor }]}>Average Grade</ThemedText>
          </View>
        </View> */}

        <View style={styles.quickActionsContainer}>
          <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Quick Actions</ThemedText>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.actionCard,
                  { backgroundColor: cardBackground, borderLeftColor: action.color },
                ]}
                onPress={() => router.push(action.route)}
              >
                <View style={styles.actionIconContainer}>
                  <IconSymbol name={action.icon} size={28} color={action.color} />
                </View>
                <ThemedText style={[styles.actionTitle, { color: textColor }]}>
                  {action.title}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.announcementsContainer}>
          <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
            Recent Announcements
          </ThemedText>
          {isLoadingAnnouncements ? (
            <View style={[styles.announcementCard, { backgroundColor: cardBackground }]}>
              <ActivityIndicator size="small" color={primaryColor} />
              <ThemedText style={[styles.loadingText, { color: mutedColor }]}>
                Loading announcements...
              </ThemedText>
            </View>
          ) : announcements.length > 0 ? (
            announcements.slice(0, 3).map(announcement => (
              <View
                key={announcement.id}
                style={[styles.announcementCard, { backgroundColor: cardBackground }]}
              >
                <View style={styles.announcementHeader}>
                  <ThemedText style={[styles.announcementTitle, { color: textColor }]}>
                    {announcement.title}
                  </ThemedText>
                  <View
                    style={[
                      styles.typeBadge,
                      {
                        backgroundColor:
                          announcement.type === 'ALERT'
                            ? errorColor
                            : announcement.type === 'EVENT'
                              ? warningColor
                              : successColor,
                      },
                    ]}
                  >
                    <ThemedText style={styles.typeText}>{announcement.type}</ThemedText>
                  </View>
                </View>
                <ThemedText
                  style={[styles.announcementMessage, { color: mutedColor }]}
                  numberOfLines={2}
                >
                  {announcement.description}
                </ThemedText>
                <ThemedText style={[styles.announcementDate, { color: mutedColor }]}>
                  {new Date(announcement.postedOn).toLocaleDateString()}
                </ThemedText>
              </View>
            ))
          ) : (
            <View style={[styles.announcementCard, { backgroundColor: cardBackground }]}>
              <ThemedText style={[styles.noDataText, { color: mutedColor }]}>
                No announcements available
              </ThemedText>
            </View>
          )}
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
    paddingTop: 0,
  },
  welcomeSection: {
    paddingTop: 20,
  },
  welcomeText: {
    fontSize: 16,
    marginBottom: 4,
  },
  studentName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  classInfo: {
    fontSize: 14,
  },
  // statsContainer: {
  //   flexDirection: 'row',
  //   paddingHorizontal: 20,
  //   paddingTop: 20,
  //   gap: 12,
  // },
  // statCard: {
  //   flex: 1,
  //   padding: 16,
  //   borderRadius: 12,
  //   shadowColor: '#000',
  //   shadowOffset: { width: 0, height: 2 },
  //   shadowOpacity: 0.1,
  //   shadowRadius: 4,
  //   elevation: 2,
  // },
  // statHeader: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   justifyContent: 'space-between',
  //   marginBottom: 8,
  // },
  // statValue: {
  //   fontSize: 20,
  //   fontWeight: 'bold',
  // },
  // statLabel: {
  //   fontSize: 12,
  // },
  quickActionsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: (width - 52) / 2,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIconContainer: {
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  announcementsContainer: {
    padding: 20,
  },
  announcementCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  announcementTitle: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  loadingText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  noDataText: {
    fontSize: 14,
    textAlign: 'center',
  },
  announcementMessage: {
    fontSize: 12,
    marginBottom: 8,
    lineHeight: 16,
  },
  announcementDate: {
    fontSize: 10,
  },
})
