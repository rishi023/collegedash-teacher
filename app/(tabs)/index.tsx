import { SectionHeader } from '@/components/SectionHeader'
import { ThemedText } from '@/components/ThemedText'
import { IconSymbol, IconSymbolName } from '@/components/ui/IconSymbol'
import { useThemeColor } from '@/hooks/useThemeColor'
import { Href, router } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/contexts/AuthContext'
import {
  getDashboardSummary,
  type Announcement,
  type NewsItem,
  type SubjectContentSummary,
} from '@/services/account'

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg']
function getFirstImageUrl(a: Announcement): string | null {
  const fromImages = a.imageUrls?.[0]
  if (fromImages) return fromImages
  const urls = a.contentUrls ?? []
  for (const url of urls) {
    const path = (url.split('?')[0] ?? '').toLowerCase()
    if (IMAGE_EXTENSIONS.some((ext) => path.endsWith(ext))) return url
  }
  return null
}

function getFirstNewsImageUrl(item: NewsItem): string | null {
  if (item.imageUrl) return item.imageUrl
  return item.imageUrls?.length ? item.imageUrls[0] : null
}

function stripNewsHtml(html: string | undefined, maxLength = 80): string {
  if (!html || typeof html !== 'string') return ''
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .trim()
  return text.length > maxLength ? text.slice(0, maxLength) + '…' : text
}

interface Action {
  title: string
  icon: IconSymbolName
  route: Href
  color: string
}

const { width } = Dimensions.get('window')

function staffDisplayName(staff: { firstName?: string; lastNme?: string } | null): string {
  if (!staff) return 'Staff'
  const first = staff.firstName ?? ''
  const last = staff.lastNme ?? ''
  return [first, last].filter(Boolean).join(' ') || 'Staff'
}

export default function DashboardScreen() {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [newsItems, setNewsItems] = useState<NewsItem[]>([])
  const [recentContent, setRecentContent] = useState<SubjectContentSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const backgroundColor = useThemeColor({}, 'secondary')
  const primaryColor = useThemeColor({}, 'primary')
  const cardBackground = useThemeColor({}, 'card')
  const textColor = useThemeColor({}, 'text')
  const mutedColor = useThemeColor({}, 'muted')
  const successColor = useThemeColor({}, 'success')
  const warningColor = useThemeColor({}, 'warning')
  const errorColor = useThemeColor({}, 'error')

  const fetchDashboard = useCallback(async () => {
    if (!user?.staffDetails?.institutionId) {
      setIsLoading(false)
      setRefreshing(false)
      return
    }
    try {
      setIsLoading(true)
      const summary = await getDashboardSummary()
      if (summary) {
        setAnnouncements(summary.recentAnnouncements ?? [])
        setNewsItems(summary.recentNews ?? [])
        setRecentContent(summary.recentContent ?? [])
      } else {
        setAnnouncements([])
        setNewsItems([])
        setRecentContent([])
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error)
      setAnnouncements([])
      setNewsItems([])
      setRecentContent([])
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [user?.staffDetails?.institutionId])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  const quickActions: Action[] = [
    {
      title: 'My Attendance',
      icon: 'checkmark.circle.fill',
      route: '/self-attendance',
      color: successColor,
    },
    { title: 'Attendance', icon: 'calendar', route: '/attendance', color: warningColor },
    { title: 'Timetable', icon: 'clock.fill', route: '/timetable', color: '#06b6d4' },
    { title: 'E-Content', icon: 'book.fill', route: '/e-content', color: errorColor },
    { title: 'Assignments', icon: 'book.fill', route: '/assignments', color: primaryColor },
  ]

  return (
    <SafeAreaView
      edges={{ top: 'additive', bottom: 'off' }}
      style={[styles.container, { backgroundColor }]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchDashboard} colors={[primaryColor]} />
        }
      >
        <View style={[styles.header, { backgroundColor: cardBackground }]}>
          <View style={styles.welcomeSection}>
            <ThemedText style={[styles.welcomeText, { color: mutedColor }]}>
              Welcome back,
            </ThemedText>
            <ThemedText style={[styles.staffName, { color: textColor }]}>
              {staffDisplayName(user?.staffDetails) || user?.firstName || 'Staff'}
            </ThemedText>
            <ThemedText style={[styles.roleInfo, { color: mutedColor }]}>
              {user?.staffDetails?.role || 'Staff'} {user?.staffDetails?.empCode ? `• ${user.staffDetails.empCode}` : ''}
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

        {(isLoading || recentContent.length > 0) && (
          <View style={styles.econtentContainer}>
            <SectionHeader
              title="Recent E-Content"
              style={{ paddingHorizontal: 20, marginBottom: 12 }}
              right={
                <TouchableOpacity onPress={() => router.push('/e-content')} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <ThemedText style={[styles.viewAllText, { color: primaryColor }]}>View all</ThemedText>
                </TouchableOpacity>
              }
            />
            {isLoading ? (
              <View style={[styles.recentContentCard, { backgroundColor: cardBackground }]}>
                <ActivityIndicator size="small" color={primaryColor} />
                <ThemedText style={[styles.loadingText, { color: mutedColor }]}>Loading content…</ThemedText>
              </View>
            ) : (
              <View style={styles.recentContentList}>
                {recentContent.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.recentContentCard, { backgroundColor: cardBackground }]}
                    onPress={() => {
                      if (item.sectionId) {
                        router.push({
                          pathname: '/e-content-viewer',
                          params: {
                            sectionId: item.sectionId,
                            contentId: item.id,
                            title: item.title ?? 'Content',
                          },
                        })
                      } else {
                        router.push('/e-content')
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <IconSymbol name="doc.text.fill" size={20} color={primaryColor} />
                    <ThemedText style={[styles.recentContentTitle, { color: textColor }]} numberOfLines={1}>
                      {item.title ?? 'Untitled'}
                    </ThemedText>
                    {item.subjectName ? (
                      <ThemedText style={[styles.recentContentMeta, { color: mutedColor }]} numberOfLines={1}>
                        {item.subjectName}
                      </ThemedText>
                    ) : null}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.announcementsContainer}>
          <SectionHeader
            title="News"
            right={
              newsItems.length > 0 ? (
                <TouchableOpacity onPress={() => router.push('/news')} hitSlop={12}>
                  <ThemedText style={[styles.viewAllText, { color: primaryColor }]}>View all</ThemedText>
                </TouchableOpacity>
              ) : undefined
            }
          />
          {isLoading ? (
            <View style={[styles.announcementCard, { backgroundColor: cardBackground }]}>
              <ActivityIndicator size="small" color={primaryColor} />
              <ThemedText style={[styles.loadingText, { color: mutedColor }]}>Loading news…</ThemedText>
            </View>
          ) : newsItems.length > 0 ? (
            <View style={styles.announcementList}>
              {newsItems.slice(0, 3).map(item => {
                const newsImageUrl = getFirstNewsImageUrl(item)
                const snippet = stripNewsHtml(item.content, 80)
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.announcementCard, { backgroundColor: cardBackground }]}
                    onPress={() =>
                      router.push({
                        pathname: '/news-detail',
                        params: {
                          id: item.id,
                          title: item.title ?? '',
                          content: item.content ?? '',
                          postedOn: item.postedOn ?? '',
                          author: item.author ?? '',
                          imageUrl: newsImageUrl ?? '',
                        },
                      })
                    }
                    activeOpacity={0.8}
                  >
                    {newsImageUrl ? (
                      <Image
                        source={{ uri: newsImageUrl }}
                        style={styles.announcementCardImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.announcementCardImagePlaceholder, { backgroundColor: `${mutedColor}18` }]}>
                        <IconSymbol name="doc.text.fill" size={28} color={mutedColor} />
                      </View>
                    )}
                    <View style={styles.announcementCardContent}>
                      <ThemedText style={[styles.announcementTitle, { color: textColor }]} numberOfLines={2}>
                        {item.title ?? 'Untitled'}
                      </ThemedText>
                      {snippet ? (
                        <ThemedText style={[styles.announcementMessage, { color: mutedColor }]} numberOfLines={1}>
                          {snippet}
                        </ThemedText>
                      ) : null}
                      <ThemedText style={[styles.announcementDate, { color: mutedColor }]}>
                        {item.postedOn ? new Date(item.postedOn).toLocaleDateString() : ''}
                      </ThemedText>
                    </View>
                  </TouchableOpacity>
                )
              })}
            </View>
          ) : (
            <View style={[styles.announcementCard, { backgroundColor: cardBackground }]}>
              <ThemedText style={[styles.noDataText, { color: mutedColor }]}>No news available</ThemedText>
            </View>
          )}
        </View>

        <View style={styles.announcementsContainer}>
          <SectionHeader
            title="Notices & Announcements"
            right={
              announcements.length > 0 ? (
                <TouchableOpacity onPress={() => router.push('/announcements')} hitSlop={12}>
                  <ThemedText style={[styles.viewAllText, { color: primaryColor }]}>View all</ThemedText>
                </TouchableOpacity>
              ) : undefined
            }
          />
          {isLoading ? (
            <View style={[styles.announcementCard, { backgroundColor: cardBackground }]}>
              <ActivityIndicator size="small" color={primaryColor} />
              <ThemedText style={[styles.loadingText, { color: mutedColor }]}>
                Loading…
              </ThemedText>
            </View>
          ) : announcements.length > 0 ? (
            <View style={styles.announcementList}>
              {announcements.slice(0, 3).map(announcement => {
                const imageUrl = getFirstImageUrl(announcement)
                return (
                  <TouchableOpacity
                    key={announcement.id}
                    style={[styles.announcementCard, { backgroundColor: cardBackground }]}
                    onPress={() =>
                      router.push({
                        pathname: '/announcement-detail',
                        params: {
                          id: announcement.id,
                          title: announcement.title ?? '',
                          description: announcement.description ?? '',
                          postedOn: announcement.postedOn ?? '',
                          type: announcement.type ?? 'NOTICE',
                          contentUrls: JSON.stringify(announcement.contentUrls ?? []),
                          imageUrls: JSON.stringify(announcement.imageUrls ?? []),
                        },
                      })
                    }
                    activeOpacity={0.8}
                  >
                    {imageUrl ? (
                      <Image
                        source={{ uri: imageUrl }}
                        style={styles.announcementCardImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.announcementCardImagePlaceholder, { backgroundColor: `${mutedColor}18` }]}>
                        <IconSymbol name="bell.fill" size={28} color={mutedColor} />
                      </View>
                    )}
                    <View style={styles.announcementCardContent}>
                      <View style={styles.announcementHeader}>
                        <ThemedText style={[styles.announcementTitle, { color: textColor }]} numberOfLines={2}>
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
                  </TouchableOpacity>
                )
              })}
            </View>
          ) : (
            <View style={[styles.announcementCard, { backgroundColor: cardBackground }]}>
              <ThemedText style={[styles.noDataText, { color: mutedColor }]}>
                No notices or announcements available
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
  staffName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  roleInfo: {
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
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
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
  econtentContainer: {
    paddingTop: 8,
    paddingBottom: 4,
    paddingHorizontal: 20,
  },
  recentContentList: {
    gap: 10,
  },
  recentContentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  recentContentTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  recentContentMeta: {
    fontSize: 12,
    maxWidth: 100,
  },
  announcementsContainer: {
    padding: 20,
  },
  announcementList: {
    gap: 12,
  },
  announcementCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    padding: 0,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  announcementCardImage: {
    width: 88,
    height: 88,
    minWidth: 88,
    backgroundColor: '#eee',
  },
  announcementCardImagePlaceholder: {
    width: 88,
    height: 88,
    minWidth: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  announcementCardContent: {
    flex: 1,
    minWidth: 0,
    padding: 14,
    justifyContent: 'center',
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
