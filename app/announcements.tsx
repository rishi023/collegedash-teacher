import { SectionHeader } from '@/components/SectionHeader'
import { ThemedText } from '@/components/ThemedText'
import { IconSymbol } from '@/components/ui/IconSymbol'
import { useAuth } from '@/contexts/AuthContext'
import { useBottomSheet } from '@/contexts/BottomSheetContext'
import { useThemeColor } from '@/hooks/useThemeColor'
import { getAnnouncements, Announcement } from '@/services/account'
import { triggerHaptic } from '@/utils/haptics'
import { useRouter } from 'expo-router'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SPACING, getElevation, MIN_TOUCH_TARGET } from '@/constants/Material'

const PAGE_SIZE = 15
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

export default function AnnouncementsScreen() {
  const backgroundColor = useThemeColor({}, 'secondary')
  const primaryColor = useThemeColor({}, 'primary')
  const cardBackground = useThemeColor({}, 'card')
  const textColor = useThemeColor({}, 'text')
  const mutedColor = useThemeColor({}, 'muted')
  const errorColor = useThemeColor({}, 'error')
  const warningColor = useThemeColor({}, 'warning')
  const successColor = useThemeColor({}, 'success')
  const borderColor = useThemeColor({}, 'border')
  const { user } = useAuth()
  const { showAlert } = useBottomSheet()
  const router = useRouter()
  const noticesRef = useRef<View>(null)
  const announcementsRef = useRef<View>(null)

  const [notices, setNotices] = useState<Announcement[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [noticesPage, setNoticesPage] = useState(0)
  const [announcementsPage, setAnnouncementsPage] = useState(0)
  const [noticesTotal, setNoticesTotal] = useState(0)
  const [announcementsApiTotal, setAnnouncementsApiTotal] = useState(0)
  const [loadingNotices, setLoadingNotices] = useState(true)
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true)
  const [loadingMoreNotices, setLoadingMoreNotices] = useState(false)
  const [loadingMoreAnnouncements, setLoadingMoreAnnouncements] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const institutionId = user?.staffDetails?.institutionId

  const fetchNotices = useCallback(
    async (page: number, append: boolean) => {
      if (!institutionId) return
      try {
        if (append) setLoadingMoreNotices(true)
        else setLoadingNotices(true)
        const res = await getAnnouncements(
          institutionId,
          page,
          PAGE_SIZE,
          'postedOn,desc',
          'NOTICE'
        )
        const content = res?.responseObject?.content ?? []
        const total = res?.responseObject?.totalElements ?? 0
        setNoticesTotal(total)
        if (append) {
          setNotices((prev) => (page === 0 ? content : [...prev, ...content]))
        } else {
          setNotices(content)
        }
      } catch (e) {
        console.error(e)
        showAlert('Error', 'Could not load notices.')
      } finally {
        setLoadingNotices(false)
        setLoadingMoreNotices(false)
      }
    },
    [institutionId, showAlert]
  )

  const fetchAnnouncements = useCallback(
    async (page: number, append: boolean) => {
      if (!institutionId) return
      try {
        if (append) setLoadingMoreAnnouncements(true)
        else setLoadingAnnouncements(true)
        const res = await getAnnouncements(institutionId, page, PAGE_SIZE, 'postedOn,desc')
        const all = res?.responseObject?.content ?? []
        const filtered = all.filter((a) => a.type !== 'NOTICE')
        const total = res?.responseObject?.totalElements ?? 0
        setAnnouncementsApiTotal(total)
        if (append) {
          setAnnouncements((prev) => (page === 0 ? filtered : [...prev, ...filtered]))
        } else {
          setAnnouncements(filtered)
        }
      } catch (e) {
        console.error(e)
        showAlert('Error', 'Could not load announcements.')
      } finally {
        setLoadingAnnouncements(false)
        setLoadingMoreAnnouncements(false)
      }
    },
    [institutionId, showAlert]
  )

  useEffect(() => {
    if (institutionId) {
      fetchNotices(0, false)
    } else {
      setLoadingNotices(false)
    }
  }, [institutionId, fetchNotices])

  useEffect(() => {
    if (institutionId) {
      fetchAnnouncements(0, false)
    } else {
      setLoadingAnnouncements(false)
    }
  }, [institutionId, fetchAnnouncements])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    setNoticesPage(0)
    setAnnouncementsPage(0)
    Promise.all([
      institutionId ? fetchNotices(0, false) : Promise.resolve(),
      institutionId ? fetchAnnouncements(0, false) : Promise.resolve(),
    ]).finally(() => setRefreshing(false))
  }, [institutionId, fetchNotices, fetchAnnouncements])

  const loadMoreNotices = () => {
    const next = noticesPage + 1
    if (notices.length >= noticesTotal || loadingMoreNotices) return
    setNoticesPage(next)
    fetchNotices(next, true)
  }

  const loadMoreAnnouncements = () => {
    const next = announcementsPage + 1
    if ((next + 1) * PAGE_SIZE > announcementsApiTotal || loadingMoreAnnouncements) return
    setAnnouncementsPage(next)
    fetchAnnouncements(next, true)
  }

  const noticesHasMore = notices.length < noticesTotal
  const announcementsHasMore = (announcementsPage + 1) * PAGE_SIZE < announcementsApiTotal

  const loadingMoreRef = useRef(false)
  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent
      const paddingToBottom = 300
      const isNearBottom =
        contentOffset.y + layoutMeasurement.height >= contentSize.height - paddingToBottom
      if (!isNearBottom || loadingMoreRef.current) return
      if (announcementsHasMore && !loadingMoreAnnouncements) {
        loadingMoreRef.current = true
        loadMoreAnnouncements()
        setTimeout(() => {
          loadingMoreRef.current = false
        }, 800)
      } else if (noticesHasMore && !loadingMoreNotices) {
        loadingMoreRef.current = true
        loadMoreNotices()
        setTimeout(() => {
          loadingMoreRef.current = false
        }, 800)
      }
    },
    [
      noticesHasMore,
      loadingMoreNotices,
      announcementsHasMore,
      loadingMoreAnnouncements,
      loadMoreNotices,
      loadMoreAnnouncements,
    ]
  )

  const openDetail = (a: Announcement) => {
    if (Platform.OS !== 'web') triggerHaptic('selection')
    router.push({
      pathname: '/announcement-detail',
      params: {
        id: a.id,
        title: a.title ?? '',
        description: a.description ?? '',
        postedOn: a.postedOn ?? '',
        type: a.type ?? 'NOTICE',
        contentUrls: JSON.stringify(a.contentUrls ?? []),
        imageUrls: JSON.stringify(a.imageUrls ?? []),
      },
    })
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ALERT':
        return errorColor
      case 'EVENT':
        return warningColor
      default:
        return successColor
    }
  }

  const formatDate = (postedOn: string) => {
    if (!postedOn) return ''
    return new Date(postedOn).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const renderCard = (a: Announcement, isNotice: boolean) => {
    const imageUrl = getFirstImageUrl(a)
    return (
      <Pressable
        key={a.id}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: cardBackground, borderColor },
          getElevation(1),
          pressed && styles.cardPressed,
        ]}
        onPress={() => openDetail(a)}
        android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.cardImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.cardImagePlaceholder, { backgroundColor: `${mutedColor}20` }]}>
            <IconSymbol
              name={isNotice ? 'doc.text.fill' : 'megaphone.fill'}
              size={28}
              color={mutedColor}
            />
          </View>
        )}
        <View style={styles.cardMain}>
          <View style={styles.cardTop}>
            <View style={[styles.typeBadge, { backgroundColor: `${getTypeColor(a.type)}20` }]}>
              <ThemedText style={[styles.typeText, { color: getTypeColor(a.type) }]}>
                {a.type}
              </ThemedText>
            </View>
            <ThemedText style={[styles.cardDate, { color: mutedColor }]}>
              {formatDate(a.postedOn ?? '')}
            </ThemedText>
          </View>
          <ThemedText style={[styles.cardTitle, { color: textColor }]} numberOfLines={2}>
            {a.title}
          </ThemedText>
          {a.description ? (
            <ThemedText
              style={[styles.cardSnippet, { color: mutedColor }]}
              numberOfLines={2}
            >
              {a.description}
            </ThemedText>
          ) : null}
        </View>
        <View style={styles.chevronWrap}>
          <IconSymbol name="chevron.right" size={20} color={mutedColor} />
        </View>
      </Pressable>
    )
  }

  const hasNotices = notices.length > 0
  const hasAnnouncements = announcements.length > 0

  return (
    <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        onScroll={onScroll}
        scrollEventThrottle={200}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View ref={noticesRef} style={styles.section}>
          <SectionHeader title="Notices" />
          {loadingNotices && notices.length === 0 ? (
            <View style={[styles.card, styles.loadingCard, { backgroundColor: cardBackground }]}>
              <ActivityIndicator size="small" color={primaryColor} />
              <ThemedText style={[styles.loadingText, { color: mutedColor }]}>
                Loading notices...
              </ThemedText>
            </View>
          ) : !hasNotices ? (
            <View style={[styles.emptyBlock, { backgroundColor: cardBackground, borderColor }]}>
              <IconSymbol name="doc.text" size={32} color={mutedColor} />
              <ThemedText style={[styles.emptyBlockText, { color: mutedColor }]}>
                No notices yet
              </ThemedText>
            </View>
          ) : (
            <>
              <View style={styles.list}>
                {notices.map((a) => renderCard(a, true))}
              </View>
              {noticesHasMore && (
                <Pressable
                  style={[styles.loadMoreBtn, { borderColor: primaryColor }]}
                  onPress={loadMoreNotices}
                  disabled={loadingMoreNotices}
                >
                  {loadingMoreNotices ? (
                    <ActivityIndicator size="small" color={primaryColor} />
                  ) : (
                    <ThemedText style={[styles.loadMoreText, { color: primaryColor }]}>
                      Load more notices
                    </ThemedText>
                  )}
                </Pressable>
              )}
            </>
          )}
        </View>

        <View ref={announcementsRef} style={styles.section}>
          <SectionHeader title="Announcements" />
          {loadingAnnouncements && announcements.length === 0 ? (
            <View style={[styles.card, styles.loadingCard, { backgroundColor: cardBackground }]}>
              <ActivityIndicator size="small" color={primaryColor} />
              <ThemedText style={[styles.loadingText, { color: mutedColor }]}>
                Loading announcements...
              </ThemedText>
            </View>
          ) : !hasAnnouncements ? (
            <View style={[styles.emptyBlock, { backgroundColor: cardBackground, borderColor }]}>
              <IconSymbol name="bell.fill" size={32} color={mutedColor} />
              <ThemedText style={[styles.emptyBlockText, { color: mutedColor }]}>
                No announcements yet
              </ThemedText>
            </View>
          ) : (
            <>
              <View style={styles.list}>
                {announcements.map((a) => renderCard(a, false))}
              </View>
              {announcementsHasMore && (
                <Pressable
                  style={[styles.loadMoreBtn, { borderColor: primaryColor }]}
                  onPress={loadMoreAnnouncements}
                  disabled={loadingMoreAnnouncements}
                >
                  {loadingMoreAnnouncements ? (
                    <ActivityIndicator size="small" color={primaryColor} />
                  ) : (
                    <ThemedText style={[styles.loadMoreText, { color: primaryColor }]}>
                      Load more announcements
                    </ThemedText>
                  )}
                </Pressable>
              )}
            </>
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
  scroll: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.lg,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyBlock: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  emptyBlockText: {
    fontSize: 14,
  },
  list: {
    gap: SPACING.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: MIN_TOUCH_TARGET * 2,
  },
  cardPressed: {
    opacity: 0.9,
  },
  cardImage: {
    width: 96,
    height: 96,
    backgroundColor: '#eee',
  },
  cardImagePlaceholder: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMain: {
    flex: 1,
    minWidth: 0,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xxs,
  },
  typeBadge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardDate: {
    fontSize: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 4,
  },
  cardSnippet: {
    fontSize: 14,
    lineHeight: 20,
  },
  chevronWrap: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -SPACING.xs,
  },
  loadMoreBtn: {
    marginTop: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  loadMoreText: {
    fontSize: 15,
    fontWeight: '600',
  },
})
