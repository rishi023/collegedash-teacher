import { ThemedText } from '@/components/ThemedText'
import { IconSymbol } from '@/components/ui/IconSymbol'
import { useThemeColor } from '@/hooks/useThemeColor'
import { getContentBySection, type EContent } from '@/services/eContentApi'
import { triggerHaptic } from '@/utils/haptics'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

function getContentTypeIcon(contentType: string): string {
  switch (String(contentType || '').toUpperCase()) {
    case 'PDF':
    case 'DOCUMENT':
      return 'doc.text.fill'
    case 'VIDEO':
      return 'play.circle.fill'
    case 'IMAGE':
      return 'photo.fill'
    case 'LINK':
      return 'link'
    case 'ASSIGNMENT':
      return 'checkmark.circle.fill'
    case 'AUDIO':
      return 'waveform'
    case 'NOTES':
      return 'note.text'
    default:
      return 'doc.fill'
  }
}

function getContentTypeColor(contentType: string, primary: string): string {
  switch (String(contentType || '').toUpperCase()) {
    case 'DOCUMENT':
      return '#ef4444'
    case 'VIDEO':
      return '#3b82f6'
    case 'IMAGE':
      return '#10b981'
    case 'LINK':
      return '#f59e0b'
    case 'ASSIGNMENT':
      return '#8b5cf6'
    case 'AUDIO':
      return '#ec4899'
    case 'NOTES':
      return '#06b6d4'
    default:
      return primary
  }
}

function getContentTypeLabel(contentType: string): string {
  const t = String(contentType || '').toUpperCase()
  if (!t) return 'Content'
  if (t === 'DOCUMENT') return 'Doc'
  return t.charAt(0) + t.slice(1).toLowerCase()
}

function formatDate(dateString: string | undefined): string {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function EContentContentScreen() {
  const params = useLocalSearchParams<{
    sectionId: string
    sectionTitle: string
    chapterTitle: string
    subjectName: string
  }>()
  const router = useRouter()
  const backgroundColor = useThemeColor({}, 'secondary')
  const cardBackground = useThemeColor({}, 'card')
  const textColor = useThemeColor({}, 'text')
  const mutedColor = useThemeColor({}, 'muted')
  const primaryColor = useThemeColor({}, 'primary')
  const borderColor = useThemeColor({}, 'border')

  const [items, setItems] = useState<EContent[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchContent = useCallback(async () => {
    const sectionId = params.sectionId?.trim()
    if (!sectionId) {
      setItems([])
      setLoading(false)
      return
    }
    try {
      const res = await getContentBySection(sectionId)
      setItems(res?.responseObject ?? [])
    } catch (e) {
      console.error(e)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [params.sectionId])

  useEffect(() => {
    setLoading(true)
    fetchContent()
  }, [fetchContent])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchContent()
    setRefreshing(false)
  }

  const handleContentPress = (content: EContent) => {
    if (Platform.OS !== 'web') triggerHaptic('selection')
    const hasUrl = !!content.contentUrl?.trim() || !!content.fileUrl?.trim()
    const hasHtml = !!content.content?.trim()
    if (hasUrl || hasHtml) {
      router.push({
        pathname: '/e-content-viewer',
        params: {
          contentId: content.id,
          sectionId: params.sectionId ?? '',
          title: content.title ?? 'Content',
        },
      })
    }
  }

  const sectionTitle = params.sectionTitle ?? 'Section'
  const chapterTitle = params.chapterTitle ?? 'Chapter'

  return (
    <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />
        }
      >
        <ThemedText style={[styles.sectionLabel, { color: mutedColor }]}>{chapterTitle}</ThemedText>
        <ThemedText style={[styles.screenTitle, { color: textColor }]}>{sectionTitle}</ThemedText>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={primaryColor} />
            <ThemedText style={[styles.loadingText, { color: mutedColor }]}>
              Loading content...
            </ThemedText>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.empty}>
            <IconSymbol name="doc.text" size={40} color={mutedColor} />
            <ThemedText style={[styles.emptyText, { color: textColor }]}>
              No content in this section yet.
            </ThemedText>
          </View>
        ) : (
          <View style={styles.list}>
            {items.map(item => {
              const typeColor = getContentTypeColor(item.contentType ?? '', primaryColor)
              return (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [
                    styles.card,
                    { backgroundColor: cardBackground, borderColor },
                    pressed && styles.cardPressed,
                  ]}
                  onPress={() => handleContentPress(item)}
                >
                  <View style={[styles.iconWrap, { backgroundColor: `${typeColor}20` }]}>
                    <IconSymbol
                      name={getContentTypeIcon(item.contentType ?? '') as any}
                      size={22}
                      color={typeColor}
                    />
                  </View>
                  <View style={styles.body}>
                    <ThemedText style={[styles.title, { color: textColor }]} numberOfLines={2}>
                      {item.title}
                    </ThemedText>
                    <View style={styles.metaRow}>
                      <View style={[styles.typeBadge, { backgroundColor: `${typeColor}30` }]}>
                        <ThemedText style={[styles.typeLabel, { color: typeColor }]} numberOfLines={1}>
                          {getContentTypeLabel(item.contentType ?? '')}
                        </ThemedText>
                      </View>
                      {item.postedDate && (
                        <ThemedText style={[styles.date, { color: mutedColor }]}>
                          {formatDate(item.postedDate)}
                        </ThemedText>
                      )}
                    </View>
                    {item.teacherName && (
                      <ThemedText style={[styles.teacher, { color: mutedColor }]} numberOfLines={1}>
                        {item.teacherName}
                      </ThemedText>
                    )}
                  </View>
                  <IconSymbol name="chevron.right" size={18} color={mutedColor} />
                </Pressable>
              )
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 24 },
  sectionLabel: { fontSize: 13, marginBottom: 4 },
  screenTitle: { fontSize: 22, fontWeight: '600', marginBottom: 20 },
  loading: { alignItems: 'center', paddingVertical: 48 },
  loadingText: { marginTop: 12, fontSize: 14 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, marginTop: 12 },
  list: { gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 12,
  },
  cardPressed: { opacity: 0.85 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0 },
  title: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' },
  typeLabel: { fontSize: 11, fontWeight: '600' },
  date: { fontSize: 11 },
  teacher: { fontSize: 12 },
})
