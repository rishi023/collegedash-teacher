import { ThemedText } from '@/components/ThemedText'
import { useThemeColor } from '@/hooks/useThemeColor'
import { getMyAttendanceReport, type StaffAttendance } from '@/services/account'
import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function AttendanceReportScreen() {
  const [list, setList] = useState<StaffAttendance[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const cardBackground = useThemeColor({}, 'card')
  const textColor = useThemeColor({}, 'text')
  const mutedColor = useThemeColor({}, 'muted')
  const primaryColor = useThemeColor({}, 'primary')

  const fetchReport = useCallback(async () => {
    try {
      const data = await getMyAttendanceReport()
      setList(data ?? [])
    } catch (e) {
      console.error(e)
      setList([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const onRefresh = () => {
    setRefreshing(true)
    fetchReport()
  }

  if (loading) {
    return (
      <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: cardBackground }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={primaryColor} />
          <ThemedText style={[styles.loadingText, { color: mutedColor }]}>Loading attendance...</ThemedText>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, styles.scrollContentGrow]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[primaryColor]} />
        }
      >
        <ThemedText style={[styles.title, { color: textColor }]}>My Attendance Report</ThemedText>
        <ThemedText style={[styles.subtitle, { color: mutedColor }]}>
          {list.length} record(s)
        </ThemedText>
        {list.length === 0 ? (
          <ThemedText style={[styles.empty, { color: mutedColor }]}>No attendance records yet.</ThemedText>
        ) : (
          list.map((row, idx) => (
            <View key={row.id ?? idx} style={[styles.card, { backgroundColor: cardBackground }]}>
              <ThemedText style={[styles.cardDate, { color: textColor }]}>
                {row.attendanceDate ?? '—'}
              </ThemedText>
              <View style={styles.row}>
                <ThemedText style={[styles.label, { color: mutedColor }]}>In</ThemedText>
                <ThemedText style={[styles.value, { color: textColor }]}>{row.inTime ?? '—'}</ThemedText>
              </View>
              <View style={styles.row}>
                <ThemedText style={[styles.label, { color: mutedColor }]}>Out</ThemedText>
                <ThemedText style={[styles.value, { color: textColor }]}>{row.outTime ?? '—'}</ThemedText>
              </View>
              {row.remarks ? (
                <ThemedText style={[styles.remarks, { color: mutedColor }]}>{row.remarks}</ThemedText>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: { flex: 1 },
  scrollContentGrow: { flexGrow: 1 },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  empty: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 24,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardDate: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
  remarks: {
    fontSize: 12,
    marginTop: 8,
  },
})
