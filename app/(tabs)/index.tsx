import { SectionHeader } from '@/components/SectionHeader'
import { ThemedText } from '@/components/ThemedText'
import { IconSymbol, IconSymbolName } from '@/components/ui/IconSymbol'
import { useThemeColor } from '@/hooks/useThemeColor'
import { Href, router } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { getCardShadow } from '@/constants/Material'
import { useAuth } from '@/contexts/AuthContext'
import {
  getDashboardSummary,
  getMyTimetable,
  type Announcement,
  type NewsItem,
  type SubjectContentSummary,
  type TimetableSlotItem,
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

const DAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
}
function parseTime(t: string): number {
  const [h, m] = (t || '00:00').split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}
function getUpcomingSlot(slots: TimetableSlotItem[], todayKey: string, nowMinutes: number): TimetableSlotItem | null {
  const sorted = [...slots].sort((a, b) => {
    const dayA = DAY_ORDER.indexOf(a.dayOfWeek)
    const dayB = DAY_ORDER.indexOf(b.dayOfWeek)
    if (dayA !== dayB) return dayA - dayB
    return parseTime(a.startTime ?? '') - parseTime(b.startTime ?? '')
  })
  for (const slot of sorted) {
    const dayIdx = DAY_ORDER.indexOf(slot.dayOfWeek)
    const todayIdx = DAY_ORDER.indexOf(todayKey)
    const slotStart = parseTime(slot.startTime ?? '')
    if (dayIdx > todayIdx) return slot
    if (dayIdx === todayIdx && slotStart > nowMinutes) return slot
  }
  return null
}
function getSlotLabel(slot: TimetableSlotItem): string {
  if (slot.slotType === 'LUNCH_BREAK') return 'Lunch'
  if (slot.slotType === 'NO_LECTURE') return 'No lecture'
  return slot.subjectName ?? '–'
}
function getClassLabel(slot: TimetableSlotItem): string {
  const parts = [slot.courseName, slot.year, slot.section].filter(Boolean)
  return parts.join(' · ') || '–'
}
function getSubjectColor(_subject: string): string {
  return '#06b6d4'
}

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
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlotItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const batchId = user?.runningBatchId ?? ''

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
      const [summary, slots] = await Promise.all([
        getDashboardSummary(),
        batchId ? getMyTimetable(batchId).then((s) => s ?? []) : Promise.resolve([]),
      ])
      if (summary) {
        setAnnouncements(summary.recentAnnouncements ?? [])
        setNewsItems(summary.recentNews ?? [])
        setRecentContent(summary.recentContent ?? [])
      } else {
        setAnnouncements([])
        setNewsItems([])
        setRecentContent([])
      }
      setTimetableSlots(slots)
    } catch (error) {
      console.error('Error fetching dashboard:', error)
      setAnnouncements([])
      setNewsItems([])
      setRecentContent([])
      setTimetableSlots([])
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [user?.staffDetails?.institutionId, batchId])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  const { dayKey: todayKey, minutes: nowMinutes } = useMemo(() => {
    const d = new Date()
    const dayNum = d.getDay()
    const dayKey = dayNum === 0 ? 'SATURDAY' : DAY_ORDER[dayNum - 1]
    const minutes = d.getHours() * 60 + d.getMinutes()
    return { dayKey, minutes }
  }, [])
  const nextLectureSlot = useMemo(
    () => getUpcomingSlot(timetableSlots, todayKey, nowMinutes),
    [timetableSlots, todayKey, nowMinutes]
  )

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
              {user?.firstName || user?.staffDetails?.firstName || staffDisplayName(user?.staffDetails) || 'Staff'}
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

        {nextLectureSlot && (
          <TouchableOpacity
            style={[styles.nextLectureCard, { backgroundColor: primaryColor + '15', borderColor: primaryColor + '40' }]}
            onPress={() => router.push('/timetable')}
            activeOpacity={0.8}
          >
            <ThemedText style={[styles.nextLectureTitle, { color: primaryColor }]}>Next lecture</ThemedText>
            <View style={[styles.nextLectureInner, { backgroundColor: cardBackground }]}>
              <View style={[styles.nextLecturePeriod, { backgroundColor: getSubjectColor(getSlotLabel(nextLectureSlot)) }]}>
                <ThemedText style={styles.nextLecturePeriodText}>{nextLectureSlot.period}</ThemedText>
              </View>
              <View style={styles.nextLectureContent}>
                <ThemedText style={[styles.nextLectureSubject, { color: textColor }]}>{getSlotLabel(nextLectureSlot)}</ThemedText>
                <ThemedText style={[styles.nextLectureClass, { color: mutedColor }]}>{getClassLabel(nextLectureSlot)}</ThemedText>
                <ThemedText style={[styles.nextLectureMeta, { color: mutedColor }]}>
                  {nextLectureSlot.room ?? '–'} · {DAY_LABELS[nextLectureSlot.dayOfWeek]} · {nextLectureSlot.startTime} – {nextLectureSlot.endTime}
                </ThemedText>
              </View>
            </View>
          </TouchableOpacity>
        )}

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
            <View style={[styles.emptyStateCard, { backgroundColor: cardBackground }]}>
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
            <View style={[styles.emptyStateCard, { backgroundColor: cardBackground }]}>
              <ThemedText style={[styles.noDataText, { color: mutedColor }]}>
                No notices or announcements available
              </ThemedText>
            </View>
          )}
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
  nextLectureCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  nextLectureTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  nextLectureInner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: 12,
    gap: 12,
  },
  nextLecturePeriod: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextLecturePeriodText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  nextLectureContent: { flex: 1, minWidth: 0 },
  nextLectureSubject: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  nextLectureClass: { fontSize: 12, marginBottom: 2 },
  nextLectureMeta: { fontSize: 12 },
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
    ...getCardShadow(),
    width: (width - 52) / 2,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
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
    ...getCardShadow(),
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
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
    ...getCardShadow(),
    flexDirection: 'row',
    alignItems: 'stretch',
    padding: 0,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
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
  emptyStateCard: {
    ...getCardShadow(),
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 80,
    marginBottom: 12,
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
