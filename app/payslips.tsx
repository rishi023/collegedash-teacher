import { ThemedText } from '@/components/ThemedText'
import { useThemeColor } from '@/hooks/useThemeColor'
import { getMyPayslips, getMyPayslip, type StaffPayrollSummary, type PayslipDetail } from '@/services/account'
import { useRouter } from 'expo-router'
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

export default function PayslipsScreen() {
  const router = useRouter()
  const [list, setList] = useState<StaffPayrollSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const cardBackground = useThemeColor({}, 'card')
  const textColor = useThemeColor({}, 'text')
  const mutedColor = useThemeColor({}, 'muted')
  const primaryColor = useThemeColor({}, 'primary')

  const fetchList = useCallback(async () => {
    try {
      const data = await getMyPayslips()
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
    fetchList()
  }, [fetchList])

  const onRefresh = () => {
    setRefreshing(true)
    fetchList()
  }

  const openPayslip = (id: string) => {
    router.push({ pathname: '/payslip-detail', params: { payrollId: id } })
  }

  if (loading) {
    return (
      <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: cardBackground }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={primaryColor} />
          <ThemedText style={[styles.loadingText, { color: mutedColor }]}>Loading payslips...</ThemedText>
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
        <ThemedText style={[styles.title, { color: textColor }]}>My Payslips</ThemedText>
        <ThemedText style={[styles.subtitle, { color: mutedColor }]}>
          {list.length} payslip(s)
        </ThemedText>
        {list.length === 0 ? (
          <ThemedText style={[styles.empty, { color: mutedColor }]}>No payslips yet.</ThemedText>
        ) : (
          list.map((row) => {
            const period =
              row.attendanceSnapshot?.year != null && row.attendanceSnapshot?.month != null
                ? `${row.attendanceSnapshot.year}-${String(row.attendanceSnapshot.month).padStart(2, '0')}`
                : row.id ?? '—'
            return (
              <TouchableOpacity
                key={row.id}
                style={[styles.card, { backgroundColor: cardBackground }]}
                onPress={() => openPayslip(row.id)}
                activeOpacity={0.7}
              >
                <ThemedText style={[styles.cardPeriod, { color: textColor }]}>{period}</ThemedText>
                <View style={styles.row}>
                  <ThemedText style={[styles.label, { color: mutedColor }]}>Net payable</ThemedText>
                  <ThemedText style={[styles.value, { color: textColor }]}>
                    ₹{row.netPayable ?? 0}
                  </ThemedText>
                </View>
                {row.status ? (
                  <ThemedText style={[styles.status, { color: mutedColor }]}>{row.status}</ThemedText>
                ) : null}
              </TouchableOpacity>
            )
          })
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
  cardPeriod: {
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
    fontWeight: '600',
  },
  status: {
    fontSize: 12,
    marginTop: 6,
  },
})
