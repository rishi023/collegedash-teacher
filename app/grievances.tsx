import { SectionHeader } from '@/components/SectionHeader'
import { ThemedText } from '@/components/ThemedText'
import { IconSymbol } from '@/components/ui/IconSymbol'
import { useThemeColor } from '@/hooks/useThemeColor'
import { getMyGrievances, type GrievanceResponse } from '@/services/account'
import { router } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

function formatDate(iso?: string): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
  } catch {
    return iso
  }
}

function formatStatus(s: string): string {
  return s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

export default function GrievancesScreen() {
  const backgroundColor = useThemeColor({}, 'secondary')
  const primaryColor = useThemeColor({}, 'primary')
  const cardBackground = useThemeColor({}, 'card')
  const textColor = useThemeColor({}, 'text')
  const mutedColor = useThemeColor({}, 'muted')
  const borderColor = useThemeColor({}, 'border')

  const [list, setList] = useState<GrievanceResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchList = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const page = await getMyGrievances(0, 50)
      setList(page?.content ?? [])
    } catch (e) {
      console.error(e)
      setList([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  return (
    <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchList(true)} tintColor={primaryColor} />
        }
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader
          title="Grievances assigned to you"
          style={{ paddingHorizontal: 20, marginBottom: 12 }}
        />
        <ThemedText style={[styles.subtitle, { color: mutedColor }]}>
          Grievances assigned to you by admin appear here. Tap to view details.
        </ThemedText>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={primaryColor} />
            <ThemedText style={[styles.loadingText, { color: mutedColor }]}>Loading…</ThemedText>
          </View>
        ) : list.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: cardBackground, borderColor }]}>
            <IconSymbol name="tray.fill" size={40} color={mutedColor} />
            <ThemedText style={[styles.emptyTitle, { color: textColor }]}>No grievances assigned</ThemedText>
            <ThemedText style={[styles.emptySubtitle, { color: mutedColor }]}>
              When admin assigns grievances to you, they will appear here.
            </ThemedText>
          </View>
        ) : (
          <View style={styles.list}>
            {list.map((g) => (
              <TouchableOpacity
                key={g.id}
                style={[styles.card, { backgroundColor: cardBackground, borderColor }]}
                onPress={() => router.push({ pathname: '/grievance-detail', params: { id: g.id } })}
                activeOpacity={0.8}
              >
                <View style={styles.cardRow}>
                  <ThemedText style={[styles.ref, { color: primaryColor }]}>{g.grievanceId}</ThemedText>
                  <View style={[styles.statusBadge, { backgroundColor: primaryColor + '20' }]}>
                    <ThemedText style={[styles.statusText, { color: primaryColor }]}>
                      {formatStatus(g.status)}
                    </ThemedText>
                  </View>
                </View>
                <ThemedText style={[styles.subject, { color: textColor }]} numberOfLines={2}>
                  {g.subject}
                </ThemedText>
                <ThemedText style={[styles.meta, { color: mutedColor }]}>
                  {g.category?.replace(/_/g, ' ')} · Submitted {formatDate(g.submittedAt)}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  subtitle: { fontSize: 14, marginBottom: 20, lineHeight: 20 },
  centered: { paddingVertical: 40, alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14 },
  emptyCard: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', marginTop: 12 },
  emptySubtitle: { fontSize: 14, marginTop: 8, textAlign: 'center' },
  list: { gap: 12 },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  ref: { fontSize: 14, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  subject: { fontSize: 15, fontWeight: '500', marginBottom: 4 },
  meta: { fontSize: 12 },
})
