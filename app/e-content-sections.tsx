import { ThemedText } from '@/components/ThemedText'
import { IconSymbol } from '@/components/ui/IconSymbol'
import { useThemeColor } from '@/hooks/useThemeColor'
import { getSections, type ContentSection } from '@/services/eContentApi'
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

export default function EContentSectionsScreen() {
  const params = useLocalSearchParams<{
    chapterId: string
    chapterTitle: string
    subjectName: string
    courseId: string
    year: string
    subjectId: string
    section: string
  }>()
  const router = useRouter()
  const backgroundColor = useThemeColor({}, 'secondary')
  const cardBackground = useThemeColor({}, 'card')
  const textColor = useThemeColor({}, 'text')
  const mutedColor = useThemeColor({}, 'muted')
  const primaryColor = useThemeColor({}, 'primary')
  const borderColor = useThemeColor({}, 'border')

  const [sections, setSections] = useState<ContentSection[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchSections = useCallback(async () => {
    const chapterId = params.chapterId?.trim()
    if (!chapterId) {
      setSections([])
      setLoading(false)
      return
    }
    try {
      const res = await getSections(chapterId)
      setSections(res?.responseObject ?? [])
    } catch (e) {
      console.error(e)
      setSections([])
    } finally {
      setLoading(false)
    }
  }, [params.chapterId])

  useEffect(() => {
    setLoading(true)
    fetchSections()
  }, [fetchSections])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchSections()
    setRefreshing(false)
  }

  const openSection = (sec: ContentSection) => {
    if (Platform.OS !== 'web') triggerHaptic('selection')
    router.push({
      pathname: '/e-content-content',
      params: {
        sectionId: sec.id,
        sectionTitle: sec.title ?? 'Section',
        chapterTitle: params.chapterTitle ?? 'Chapter',
        subjectName: params.subjectName ?? 'Subject',
      },
    })
  }

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
        <ThemedText style={[styles.sectionLabel, { color: mutedColor }]}>
          {params.subjectName ?? 'Subject'}
        </ThemedText>
        <ThemedText style={[styles.screenTitle, { color: textColor }]}>{chapterTitle}</ThemedText>
        <ThemedText style={[styles.subtitle, { color: mutedColor }]}>
          Sections (topics) · tap to view content
        </ThemedText>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={primaryColor} />
          </View>
        ) : sections.length === 0 ? (
          <View style={styles.empty}>
            <IconSymbol name="doc.text" size={40} color={mutedColor} />
            <ThemedText style={[styles.emptyText, { color: textColor }]}>
              No sections in this chapter yet.
            </ThemedText>
          </View>
        ) : (
          <View style={styles.list}>
            {sections.map((sec, index) => (
              <Pressable
                key={sec.id}
                style={({ pressed }) => [
                  styles.row,
                  { backgroundColor: cardBackground, borderColor },
                  pressed && styles.rowPressed,
                ]}
                onPress={() => openSection(sec)}
              >
                <View style={[styles.numberWrap, { backgroundColor: `${primaryColor}20` }]}>
                  <ThemedText style={[styles.number, { color: primaryColor }]}>{index + 1}</ThemedText>
                </View>
                <View style={styles.rowContent}>
                  <ThemedText style={[styles.sectionTitle, { color: textColor }]} numberOfLines={2}>
                    {sec.title ?? 'Section'}
                  </ThemedText>
                  {sec.description ? (
                    <ThemedText style={[styles.sectionDesc, { color: mutedColor }]} numberOfLines={2}>
                      {sec.description}
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
  scroll: { padding: 16, paddingBottom: 24 },
  sectionLabel: { fontSize: 13, marginBottom: 4 },
  screenTitle: { fontSize: 22, fontWeight: '600', marginBottom: 8 },
  subtitle: { fontSize: 14, marginBottom: 20 },
  loading: { alignItems: 'center', paddingVertical: 32 },
  list: { gap: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  rowPressed: { opacity: 0.85 },
  numberWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: { fontSize: 15, fontWeight: '700' },
  rowContent: { flex: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  sectionDesc: { fontSize: 13, marginTop: 4 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, marginTop: 12 },
})
