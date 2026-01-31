import { ThemedText } from '@/components/ThemedText'
import { useThemeColor } from '@/hooks/useThemeColor'
import { getMyPayslip, type PayslipDetail } from '@/services/account'
import { useLocalSearchParams } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function PayslipDetailScreen() {
  const { payrollId } = useLocalSearchParams<{ payrollId: string }>()
  const [detail, setDetail] = useState<PayslipDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const cardBackground = useThemeColor({}, 'card')
  const textColor = useThemeColor({}, 'text')
  const mutedColor = useThemeColor({}, 'muted')
  const primaryColor = useThemeColor({}, 'primary')

  const fetchDetail = useCallback(async () => {
    if (!payrollId) {
      setLoading(false)
      return
    }
    try {
      const data = await getMyPayslip(payrollId)
      setDetail(data ?? null)
    } catch (e) {
      console.error(e)
      setDetail(null)
    } finally {
      setLoading(false)
    }
  }, [payrollId])

  useEffect(() => {
    fetchDetail()
  }, [fetchDetail])

  if (loading) {
    return (
      <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: cardBackground }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={primaryColor} />
          <ThemedText style={[styles.loadingText, { color: mutedColor }]}>Loading payslip...</ThemedText>
        </View>
      </SafeAreaView>
    )
  }

  if (!detail) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.container}>
        <View style={styles.centered}>
          <ThemedText style={[styles.empty, { color: mutedColor }]}>Payslip not found.</ThemedText>
        </View>
      </SafeAreaView>
    )
  }

  const period = detail.period ?? '—'
  const name = detail.staffSnapshot?.name ?? '—'
  const empCode = detail.staffSnapshot?.empCode ?? '—'

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, styles.scrollContentGrow]}>
        <ThemedText style={[styles.title, { color: textColor }]}>Payslip – {period}</ThemedText>
        <View style={[styles.card, { backgroundColor: cardBackground }]}>
          <ThemedText style={[styles.name, { color: textColor }]}>{name}</ThemedText>
          <ThemedText style={[styles.empCode, { color: mutedColor }]}>{empCode}</ThemedText>
        </View>
        <View style={[styles.card, { backgroundColor: cardBackground }]}>
          <View style={styles.row}>
            <ThemedText style={[styles.label, { color: mutedColor }]}>Gross earnings</ThemedText>
            <ThemedText style={[styles.value, { color: textColor }]}>₹{detail.grossEarnings ?? 0}</ThemedText>
          </View>
          <View style={styles.row}>
            <ThemedText style={[styles.label, { color: mutedColor }]}>Deductions</ThemedText>
            <ThemedText style={[styles.value, { color: textColor }]}>₹{detail.grossDeductions ?? 0}</ThemedText>
          </View>
          <View style={[styles.row, styles.netRow]}>
            <ThemedText style={[styles.netLabel, { color: textColor }]}>Net payable</ThemedText>
            <ThemedText style={[styles.netValue, { color: primaryColor }]}>₹{detail.netPayable ?? 0}</ThemedText>
          </View>
        </View>
        {detail.paymentInfo ? (
          <View style={[styles.card, { backgroundColor: cardBackground }]}>
            <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Payment</ThemedText>
            <ThemedText style={[styles.muted, { color: mutedColor }]}>
              {detail.paymentInfo.paymentMode ?? '—'} • Paid on {detail.paymentInfo.paidAt ?? '—'}
            </ThemedText>
          </View>
        ) : null}
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
  empty: {
    fontSize: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
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
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  empCode: {
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  netRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginBottom: 0,
  },
  label: {
    fontSize: 14,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
  netLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  netValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  muted: {
    fontSize: 14,
  },
})
