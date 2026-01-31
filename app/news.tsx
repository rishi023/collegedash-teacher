import { ThemedText } from '@/components/ThemedText'
import { IconSymbol } from '@/components/ui/IconSymbol'
import { useAuth } from '@/contexts/AuthContext'
import { useBottomSheet } from '@/contexts/BottomSheetContext'
import { useThemeColor } from '@/hooks/useThemeColor'
import { getNews, NewsItem } from '@/services/account'
import { SPACING, getElevation, MIN_TOUCH_TARGET } from '@/constants/Material'
import { useRouter } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Image,
  ListRenderItem,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { triggerHaptic } from '@/utils/haptics'

const PAGE_SIZE = 20

function stripHtml(html: string | undefined, maxLength = 120): string {
  if (!html || typeof html !== 'string') return ''
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim()
  return text.length > maxLength ? text.slice(0, maxLength) + '…' : text
}

function getFirstImageUrl(item: NewsItem): string | null {
  if (item.imageUrl) return item.imageUrl
  const urls = item.imageUrls
  return urls?.length ? urls[0] : null
}

export default function NewsScreen() {
  const router = useRouter()
  const backgroundColor = useThemeColor({}, 'secondary')
  const primaryColor = useThemeColor({}, 'primary')
  const cardBackground = useThemeColor({}, 'card')
  const textColor = useThemeColor({}, 'text')
  const mutedColor = useThemeColor({}, 'muted')
  const borderColor = useThemeColor({}, 'border')
  const { user } = useAuth()
  const { showAlert } = useBottomSheet()

  const [list, setList] = useState<NewsItem[]>([])
  const [page, setPage] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const institutionId = user?.staffDetails?.institutionId

  const fetchNews = useCallback(
    async (pageNum: number, append: boolean) => {
      if (!institutionId) return
      try {
        if (append) setLoadingMore(true)
        else setLoading(true)
        const res = await getNews(institutionId, pageNum, PAGE_SIZE)
        const content = res?.responseObject?.content ?? []
        const total = res?.responseObject?.totalElements ?? 0
        setTotalElements(total)
        if (append) {
          setList((prev) => (pageNum === 0 ? content : [...prev, ...content]))
        } else {
          setList(content)
        }
      } catch (e) {
        console.error(e)
        showAlert('Error', 'Could not load news.')
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [institutionId, showAlert]
  )

  useEffect(() => {
    if (institutionId) {
      fetchNews(0, false)
    } else {
      setLoading(false)
    }
  }, [institutionId, fetchNews])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    setPage(0)
    fetchNews(0, false).finally(() => setRefreshing(false))
  }, [fetchNews])

  const hasMore = (page + 1) * PAGE_SIZE < totalElements

  const onEndReached = useCallback(() => {
    if (!hasMore || loadingMore || loading) return
    const next = page + 1
    setPage(next)
    fetchNews(next, true)
  }, [page, hasMore, loadingMore, loading, fetchNews])

  const formatDate = (postedOn: string) => {
    if (!postedOn) return ''
    return new Date(postedOn).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const openDetail = (item: NewsItem) => {
    if (Platform.OS !== 'web') triggerHaptic('selection')
    router.push({
      pathname: '/news-detail',
      params: {
        id: item.id,
        title: item.title ?? '',
        content: item.content ?? '',
        postedOn: item.postedOn ?? '',
        author: item.author ?? '',
        imageUrl: getFirstImageUrl(item) ?? '',
      },
    })
  }

  const renderItem: ListRenderItem<NewsItem> = ({ item }) => {
    const imageUrl = getFirstImageUrl(item)
    const snippet = stripHtml(item.content, 100)
    return (
      <Pressable
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: cardBackground, borderColor },
          getElevation(1),
          pressed && styles.cardPressed,
        ]}
        onPress={() => openDetail(item)}
        android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.cardImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.cardImagePlaceholder, { backgroundColor: `${mutedColor}18` }]}>
            <IconSymbol name="doc.text.fill" size={28} color={mutedColor} />
          </View>
        )}
        <View style={styles.cardMain}>
          <ThemedText style={[styles.cardTitle, { color: textColor }]} numberOfLines={2}>
            {item.title}
          </ThemedText>
          {snippet ? (
            <ThemedText style={[styles.cardSnippet, { color: mutedColor }]} numberOfLines={2}>
              {snippet}
            </ThemedText>
          ) : null}
          <View style={styles.cardFooter}>
            {item.author ? (
              <ThemedText style={[styles.cardMeta, { color: mutedColor }]}>{item.author}</ThemedText>
            ) : null}
            <ThemedText style={[styles.cardDate, { color: mutedColor }]}>
              {formatDate(item.postedOn ?? '')}
            </ThemedText>
          </View>
        </View>
        <View style={styles.chevronWrap}>
          <IconSymbol name="chevron.right" size={20} color={mutedColor} />
        </View>
      </Pressable>
    )
  }

  const keyExtractor = (item: NewsItem) => item.id

  const ListFooter = () =>
    loadingMore ? (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={primaryColor} />
      </View>
    ) : null

  const ListEmpty = () =>
    !loading && list.length === 0 ? (
      <View style={[styles.empty, { backgroundColor: cardBackground, borderColor }]}>
        <IconSymbol name="doc.text.fill" size={40} color={mutedColor} />
        <ThemedText style={[styles.emptyTitle, { color: textColor }]}>No news yet</ThemedText>
        <ThemedText style={[styles.emptySubtitle, { color: mutedColor }]}>
          News will appear here when published.
        </ThemedText>
      </View>
    ) : null

  if (!institutionId) {
    return (
      <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor }]}>
        <View style={styles.centered}>
          <ThemedText style={[styles.emptySubtitle, { color: mutedColor }]}>
            Sign in to view news.
          </ThemedText>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor }]}>
      {loading && list.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={primaryColor} />
          <ThemedText style={[styles.loadingText, { color: mutedColor }]}>Loading news...</ThemedText>
        </View>
      ) : (
        <FlatList
          data={list}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={ListEmpty}
          ListFooterComponent={ListFooter}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },
  loadingText: { marginTop: SPACING.sm, fontSize: 14 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: SPACING.sm,
    minHeight: MIN_TOUCH_TARGET * 1.5,
  },
  cardPressed: { opacity: 0.9 },
  cardImage: {
    width: 88,
    height: 88,
    minWidth: 88,
    backgroundColor: '#eee',
  },
  cardImagePlaceholder: {
    width: 88,
    height: 88,
    minWidth: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMain: { flex: 1, minWidth: 0, padding: SPACING.md, marginRight: SPACING.xs },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 4,
  },
  cardSnippet: { fontSize: 14, lineHeight: 20, marginBottom: 4 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  cardMeta: { fontSize: 12 },
  cardDate: { fontSize: 12 },
  chevronWrap: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -SPACING.xs,
  },
  footer: { paddingVertical: SPACING.md, alignItems: 'center' },
  empty: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.xl,
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginTop: SPACING.sm },
  emptySubtitle: { fontSize: 14, textAlign: 'center', marginTop: SPACING.xs },
})
