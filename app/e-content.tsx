import { SectionHeader } from '@/components/SectionHeader'
import { ThemedText } from '@/components/ThemedText'
import { IconSymbol } from '@/components/ui/IconSymbol'
import { useAuth } from '@/contexts/AuthContext'
import { useThemeColor } from '@/hooks/useThemeColor'
import { getMySubjects, type StaffSubjectItem } from '@/services/account'
import { triggerHaptic } from '@/utils/haptics'
import { useRouter } from 'expo-router'
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

const SUBJECT_ACCENTS = ['#8b5cf6', '#0ea5e9', '#059669', '#f59e0b', '#ef4444', '#ec4899']

export default function EContentScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const backgroundColor = useThemeColor({}, 'secondary')
  const cardBackground = useThemeColor({}, 'card')
  const textColor = useThemeColor({}, 'text')
  const mutedColor = useThemeColor({}, 'muted')
  const primaryColor = useThemeColor({}, 'primary')

  const [subjects, setSubjects] = useState<StaffSubjectItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchSubjects = useCallback(async () => {
    try {
      const list = await getMySubjects()
      setSubjects(list ?? [])
    } catch (e) {
      console.error(e)
      setSubjects([])
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchSubjects().finally(() => setLoading(false))
  }, [fetchSubjects])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchSubjects()
    setRefreshing(false)
  }

  const openSubject = (subject: StaffSubjectItem) => {
    if (Platform.OS !== 'web') triggerHaptic('selection')
    const courseId = subject.courseId ?? ''
    const year = subject.year ?? ''
    const subjectId = subject.subjectId ?? ''
    const section = subject.section?.trim()
    if (!courseId || !year || !subjectId) return
    router.push({
      pathname: '/e-content-chapters',
      params: {
        subjectId,
        subjectName: subject.subjectName ?? subjectId,
        courseId,
        courseName: subject.courseName ?? '',
        year,
        section: section ?? '',
      },
    })
  }

  return (
    <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />
        }
      >
        <SectionHeader title="Subjects" />
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={primaryColor} />
            <ThemedText style={[styles.loadingText, { color: mutedColor }]}>
              Loading subjects...
            </ThemedText>
          </View>
        ) : subjects.length > 0 ? (
          <View style={styles.grid}>
            {subjects.map((subject, index) => {
              const accent = SUBJECT_ACCENTS[index % SUBJECT_ACCENTS.length]
              const name = subject.subjectName ?? subject.subjectId ?? 'Subject'
              return (
                <Pressable
                  key={`${subject.courseId}-${subject.subjectId}-${index}`}
                  style={({ pressed }) => [
                    styles.card,
                    { backgroundColor: cardBackground },
                    pressed && styles.cardPressed,
                  ]}
                  onPress={() => openSubject(subject)}
                >
                  <View style={[styles.iconWrap, { backgroundColor: `${accent}20` }]}>
                    <IconSymbol name="book.fill" size={32} color={accent} />
                  </View>
                  <ThemedText style={[styles.cardTitle, { color: textColor }]} numberOfLines={2}>
                    {name}
                  </ThemedText>
                  {(subject.courseName || subject.year) && (
                    <ThemedText style={[styles.cardMeta, { color: mutedColor }]} numberOfLines={1}>
                      {[subject.courseName, subject.year].filter(Boolean).join(' · ')}
                    </ThemedText>
                  )}
                </Pressable>
              )
            })}
          </View>
        ) : (
          <View style={styles.empty}>
            <IconSymbol name="doc.text" size={48} color={mutedColor} />
            <ThemedText style={[styles.emptyTitle, { color: textColor }]}>No subjects</ThemedText>
            <ThemedText style={[styles.emptySub, { color: mutedColor }]}>
              Your assigned subjects will appear here. Content is organised by Chapter → Section → Content.
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 24 },
  loading: { alignItems: 'center', paddingVertical: 48 },
  loadingText: { marginTop: 12, fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '47%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'center',
  },
  cardPressed: { opacity: 0.85 },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardTitle: { fontSize: 15, fontWeight: '600', textAlign: 'center', marginBottom: 4 },
  cardMeta: { fontSize: 12, textAlign: 'center' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 14, textAlign: 'center', paddingHorizontal: 24 },
})
