import { ThemedText } from '@/components/ThemedText'
import { IconSymbol } from '@/components/ui/IconSymbol'
import { useThemeColor } from '@/hooks/useThemeColor'
import { getChapters, type Chapter } from '@/services/eContentApi'
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

export default function EContentChaptersScreen() {
  const params = useLocalSearchParams<{
    subjectId: string
    subjectName: string
    courseId: string
    courseName: string
    year: string
    section: string
  }>()
  const router = useRouter()
  const backgroundColor = useThemeColor({}, 'secondary')
  const cardBackground = useThemeColor({}, 'card')
  const textColor = useThemeColor({}, 'text')
  const mutedColor = useThemeColor({}, 'muted')
  const primaryColor = useThemeColor({}, 'primary')
  const borderColor = useThemeColor({}, 'border')

  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchChapters = useCallback(async () => {
    const courseId = params.courseId?.trim()
    const year = params.year?.trim()
    const subjectId = params.subjectId?.trim()
    const section = params.section?.trim()
    if (!courseId || !year || !subjectId) {
      setChapters([])
      setLoading(false)
      return
    }
    try {
      const res = await getChapters({ courseId, year, subjectId, section: section || undefined })
      setChapters(res?.responseObject ?? [])
    } catch (e) {
      console.error(e)
      setChapters([])
    } finally {
      setLoading(false)
    }
  }, [params.courseId, params.year, params.subjectId, params.section])

  useEffect(() => {
    setLoading(true)
    fetchChapters()
  }, [fetchChapters])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchChapters()
    setRefreshing(false)
  }

  const openChapter = (chapter: Chapter) => {
    if (Platform.OS !== 'web') triggerHaptic('selection')
    router.push({
      pathname: '/e-content-sections',
      params: {
        chapterId: chapter.id,
        chapterTitle: chapter.title ?? 'Chapter',
        subjectName: params.subjectName ?? params.subjectId ?? 'Subject',
        courseId: params.courseId ?? '',
        year: params.year ?? '',
        subjectId: params.subjectId ?? '',
        section: params.section ?? '',
      },
    })
  }

  const subjectName = params.subjectName ?? params.subjectId ?? 'Subject'

  return (
    <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scroll, styles.scrollContent]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />
        }
      >
        <View style={[styles.headerCard, { backgroundColor: cardBackground, borderColor }]}>
          <ThemedText style={[styles.subjectLabel, { color: mutedColor }]}>Subject</ThemedText>
          <ThemedText style={[styles.subjectName, { color: textColor }]} numberOfLines={2}>
            {subjectName}
          </ThemedText>
        </View>

        <ThemedText style={[styles.listHeading, { color: textColor }]}>Chapters</ThemedText>
        <ThemedText style={[styles.listSubtext, { color: mutedColor }]}>
          {chapters.length === 0
            ? 'No chapters yet'
            : `${chapters.length} chapter${chapters.length !== 1 ? 's' : ''} · tap to view sections`}
        </ThemedText>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={primaryColor} />
          </View>
        ) : chapters.length === 0 ? (
          <View style={styles.empty}>
            <IconSymbol name="doc.text" size={40} color={mutedColor} />
            <ThemedText style={[styles.emptyText, { color: textColor }]}>No chapters yet</ThemedText>
          </View>
        ) : (
          <View style={styles.list}>
            {chapters.map((ch, index) => (
              <Pressable
                key={ch.id}
                style={({ pressed }) => [
                  styles.row,
                  { backgroundColor: cardBackground, borderColor },
                  pressed && styles.rowPressed,
                ]}
                onPress={() => openChapter(ch)}
              >
                <View style={[styles.numberWrap, { backgroundColor: `${primaryColor}20` }]}>
                  <ThemedText style={[styles.number, { color: primaryColor }]}>{index + 1}</ThemedText>
                </View>
                <View style={styles.rowContent}>
                  <ThemedText style={[styles.chapterTitle, { color: textColor }]} numberOfLines={2}>
                    {ch.title}
                  </ThemedText>
                  {ch.description ? (
                    <ThemedText style={[styles.chapterDesc, { color: mutedColor }]} numberOfLines={2}>
                      {ch.description}
                    </ThemedText>
                  ) : null}
                </View>
                <IconSymbol name="chevron.right" size={20} color={mutedColor} />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  scroll: { padding: 16, paddingBottom: 24 },
  headerCard: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  subjectLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 },
  subjectName: { fontSize: 20, fontWeight: '700', lineHeight: 26 },
  listHeading: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  listSubtext: { fontSize: 13, marginBottom: 16 },
  loading: { alignItems: 'center', paddingVertical: 32 },
  list: { gap: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 14,
  },
  rowPressed: { opacity: 0.85 },
  numberWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: { fontSize: 16, fontWeight: '700' },
  rowContent: { flex: 1, minWidth: 0 },
  chapterTitle: { fontSize: 16, fontWeight: '600', lineHeight: 22, marginBottom: 4 },
  chapterDesc: { fontSize: 13, lineHeight: 18 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, marginTop: 12 },
})
