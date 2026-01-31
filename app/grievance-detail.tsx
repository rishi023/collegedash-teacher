import { SectionHeader } from '@/components/SectionHeader'
import { ThemedText } from '@/components/ThemedText'
import { IconSymbol } from '@/components/ui/IconSymbol'
import { useThemeColor } from '@/hooks/useThemeColor'
import {
  getGrievanceDetail,
  type GrievanceResponse,
  type GrievanceCategory,
} from '@/services/account'
import { useLocalSearchParams } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const CATEGORIES: { value: GrievanceCategory; label: string }[] = [
  { value: 'ACADEMIC', label: 'Academic' },
  { value: 'EXAMINATION', label: 'Examination' },
  { value: 'FEES_FINANCE', label: 'Fees / Finance' },
  { value: 'INFRASTRUCTURE', label: 'Infrastructure' },
  { value: 'HARASSMENT_MISCONDUCT', label: 'Harassment / Misconduct' },
  { value: 'ADMINISTRATION', label: 'Administration' },
  { value: 'OTHER', label: 'Other' },
]

type TimelineStep = {
  key: string
  label: string
  date?: string
  icon: 'paperplane.fill' | 'checkmark.circle.fill' | 'person.fill' | 'checkmark.shield.fill' | 'xmark.circle.fill'
}

function buildTimeline(g: GrievanceResponse): TimelineStep[] {
  const steps: TimelineStep[] = [
    { key: 'submitted', label: 'Submitted', date: g.submittedAt, icon: 'paperplane.fill' },
    { key: 'acknowledged', label: 'Acknowledged', date: g.acknowledgedAt, icon: 'checkmark.circle.fill' },
    { key: 'assigned', label: 'Assigned', date: g.assignedAt, icon: 'person.fill' },
    { key: 'resolved', label: 'Resolved', date: g.resolvedAt, icon: 'checkmark.shield.fill' },
    { key: 'closed', label: 'Closed', date: g.closedAt, icon: 'xmark.circle.fill' },
  ]
  return steps.filter(s => s.date)
}

function formatDate(iso?: string): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

function formatStatus(s: string): string {
  return s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

export default function GrievanceDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>()
  const grievanceId = params.id ?? ''
  const backgroundColor = useThemeColor({}, 'secondary')
  const primaryColor = useThemeColor({}, 'primary')
  const cardBackground = useThemeColor({}, 'card')
  const textColor = useThemeColor({}, 'text')
  const mutedColor = useThemeColor({}, 'muted')
  const borderColor = useThemeColor({}, 'border')
  const successColor = useThemeColor({}, 'success')

  const [grievance, setGrievance] = useState<GrievanceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchGrievance = useCallback(async (isRefresh = false) => {
    if (!grievanceId) {
      setError('No grievance specified.')
      setLoading(false)
      return
    }
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const data = await getGrievanceDetail(grievanceId)
      setGrievance(data ?? null)
      if (!data) setError('Grievance not found or not assigned to you.')
    } catch {
      setGrievance(null)
      setError('Could not load grievance.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [grievanceId])

  useEffect(() => {
    fetchGrievance()
  }, [fetchGrievance])

  if (loading && !grievance) {
    return (
      <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={primaryColor} />
          <ThemedText style={[styles.loadingText, { color: mutedColor }]}>Loading…</ThemedText>
        </View>
      </SafeAreaView>
    )
  }

  if (error && !grievance) {
    return (
      <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor }]}>
        <View style={styles.centered}>
          <IconSymbol name="exclamationmark.triangle.fill" size={48} color={mutedColor} />
          <ThemedText style={[styles.errorText, { color: textColor }]}>{error}</ThemedText>
        </View>
      </SafeAreaView>
    )
  }

  const g = grievance!
  const timeline = buildTimeline(g)
  const categoryLabel = CATEGORIES.find(c => c.value === g.category)?.label ?? g.category

  return (
    <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor }]}>
      <View style={styles.scrollWrapper}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scroll, styles.scrollContent]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchGrievance(true)}
            tintColor={primaryColor}
          />
        }
      >
        <View style={[styles.section, { backgroundColor: cardBackground }]}>
          <View style={styles.headerRow}>
            <ThemedText style={[styles.ref, { color: primaryColor }]}>{g.grievanceId}</ThemedText>
            <View style={[styles.statusBadge, { backgroundColor: primaryColor + '20' }]}>
              <ThemedText style={[styles.statusBadgeText, { color: primaryColor }]}>
                {formatStatus(g.status)}
              </ThemedText>
            </View>
          </View>
          <ThemedText style={[styles.subject, { color: textColor }]}>{g.subject}</ThemedText>
          <ThemedText style={[styles.meta, { color: mutedColor }]}>
            {categoryLabel} · Priority: {formatStatus(g.priority)}
          </ThemedText>
        </View>

        <View style={[styles.section, { backgroundColor: cardBackground }]}>
          <SectionHeader title="Description" />
          <ThemedText style={[styles.body, { color: textColor }]}>{g.description}</ThemedText>
        </View>

        {!g.isAnonymous && (g.submittedByName || g.submittedByEmail) && (
          <View style={[styles.section, { backgroundColor: cardBackground }]}>
            <SectionHeader title="Submitted by" />
            {g.submittedByName && (
              <ThemedText style={[styles.body, { color: textColor }]}>Name: {g.submittedByName}</ThemedText>
            )}
            {g.submittedByEmail && (
              <ThemedText style={[styles.meta, { color: mutedColor }]}>Email: {g.submittedByEmail}</ThemedText>
            )}
          </View>
        )}

        {timeline.length > 0 && (
          <View style={[styles.section, { backgroundColor: cardBackground }]}>
            <SectionHeader title="Timeline" />
            {timeline.map((step, index) => (
              <View key={step.key} style={styles.timelineRow}>
                <View style={styles.timelineLeft}>
                  <View style={[styles.timelineDot, { backgroundColor: primaryColor }]} />
                  {index < timeline.length - 1 && (
                    <View style={[styles.timelineLine, { backgroundColor: borderColor }]} />
                  )}
                </View>
                <View style={styles.timelineContent}>
                  <View style={styles.timelineTitleRow}>
                    <IconSymbol
                      name={step.icon}
                      size={18}
                      color={index === timeline.length - 1 ? successColor : primaryColor}
                    />
                    <ThemedText style={[styles.timelineLabel, { color: textColor }]}>
                      {step.label}
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.timelineDate, { color: mutedColor }]}>
                    {formatDate(step.date)}
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>
        )}

        {g.resolutionSummary ? (
          <View style={[styles.section, { backgroundColor: cardBackground }]}>
            <SectionHeader title="Resolution" />
            <ThemedText style={[styles.body, { color: textColor }]}>
              {g.resolutionSummary}
            </ThemedText>
          </View>
        ) : null}

        {g.internalNotes && g.internalNotes.length > 0 && (
          <View style={[styles.section, { backgroundColor: cardBackground }]}>
            <SectionHeader title="Internal notes" />
            {g.internalNotes.map((note, i) => (
              <View key={i} style={[styles.noteItem, { borderColor }]}>
                <ThemedText style={[styles.body, { color: textColor }]}>{note.note}</ThemedText>
                <ThemedText style={[styles.noteMeta, { color: mutedColor }]}>
                  {note.addedByUserName} · {formatDate(note.addedAt)}
                </ThemedText>
              </View>
            ))}
          </View>
        )}
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollWrapper: { flex: 1, minHeight: 0 },
  scrollView: { flex: 1, minHeight: 0 },
  scrollContent: { flexGrow: 1 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: { marginTop: 12, fontSize: 15 },
  errorText: { marginTop: 12, fontSize: 15, textAlign: 'center' },
  scroll: { padding: 20, paddingBottom: 40 },
  section: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ref: { fontSize: 16, fontWeight: '700' },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: { fontSize: 12, fontWeight: '600' },
  subject: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  meta: { fontSize: 13 },
  body: { fontSize: 15, lineHeight: 22 },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  timelineLeft: {
    width: 28,
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineLine: {
    position: 'absolute',
    top: 14,
    width: 2,
    bottom: -8,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 16,
  },
  timelineTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  timelineLabel: { fontSize: 15, fontWeight: '600' },
  timelineDate: { fontSize: 13, marginLeft: 26 },
  noteItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  noteMeta: { fontSize: 12, marginTop: 4 },
})
