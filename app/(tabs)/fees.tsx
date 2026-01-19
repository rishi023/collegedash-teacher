import { ThemedText } from '@/components/ThemedText'
import { IconSymbol, IconSymbolName } from '@/components/ui/IconSymbol'
import { useAuth } from '@/contexts/AuthContext'
import { useThemeColor } from '@/hooks/useThemeColor'
import { getStudentPaymentRecords, PaymentRecord } from '@/services/account'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function FeesScreen() {
  const { user } = useAuth()
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const backgroundColor = useThemeColor({}, 'secondary')
  const cardBackground = useThemeColor({}, 'card')
  const textColor = useThemeColor({}, 'text')
  const mutedColor = useThemeColor({}, 'muted')
  const borderColor = useThemeColor({}, 'border')
  const primaryColor = useThemeColor({}, 'primary')
  const successColor = useThemeColor({}, 'success')
  const warningColor = useThemeColor({}, 'warning')
  const errorColor = useThemeColor({}, 'error')

  useEffect(() => {
    const fetchPaymentRecords = async () => {
      try {
        const batchId = user?.studentDetails?.batchId
        const studentId = user?.studentDetails?.studentId

        if (batchId && studentId) {
          setIsLoading(true)
          const response = await getStudentPaymentRecords(batchId, studentId)
          if (response?.responseObject) {
            setPaymentRecords(response.responseObject)
          }
        }
      } catch (error) {
        console.error('Error fetching payment records:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPaymentRecords()
  }, [user?.studentDetails?.batchId, user?.studentDetails?.studentId])

  const calculateTotals = () => {
    let totalAmount = 0
    let totalPaid = 0
    let totalDues = 0

    paymentRecords.forEach(record => {
      record.payableList.forEach(item => {
        totalAmount += item.amount
        totalPaid += item.paid
        totalDues += item.dues
      })
    })

    return { totalAmount, totalPaid, totalDues }
  }

  const totals = calculateTotals()

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const getPaymentTypeIcon = (type: string): IconSymbolName => {
    switch (type) {
      case 'CASH':
        return 'creditcard.fill'
      case 'ONLINE':
        return 'creditcard.fill'
      case 'CHEQUE':
        return 'doc.text.fill'
      case 'DD':
        return 'doc.text.fill'
      default:
        return 'creditcard.fill'
    }
  }

  return (
    <SafeAreaView
      edges={{ top: 'additive', bottom: 'off' }}
      style={[styles.container, { backgroundColor }]}
    >
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.totalCard, { backgroundColor: cardBackground }]}>
            <ThemedText style={[styles.totalAmount, { color: textColor }]}>
              {formatCurrency(totals.totalAmount)}
            </ThemedText>
            <ThemedText style={[styles.totalLabel, { color: mutedColor }]}>
              Total Fee Amount
            </ThemedText>
          </View>

          <View style={styles.statsRow}>
            <View
              style={[
                styles.statCard,
                { backgroundColor: cardBackground, borderLeftColor: successColor },
              ]}
            >
              <ThemedText style={[styles.statNumber, { color: successColor }]}>
                {formatCurrency(totals.totalPaid)}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: mutedColor }]}>Paid</ThemedText>
            </View>

            <View
              style={[
                styles.statCard,
                { backgroundColor: cardBackground, borderLeftColor: errorColor },
              ]}
            >
              <ThemedText style={[styles.statNumber, { color: errorColor }]}>
                {formatCurrency(totals.totalDues)}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: mutedColor }]}>Dues</ThemedText>
            </View>
          </View>
        </View>

        {/* Payment Records */}
        <View style={styles.recordsContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={primaryColor} />
              <ThemedText style={[styles.loadingText, { color: mutedColor }]}>
                Loading payment records...
              </ThemedText>
            </View>
          ) : paymentRecords.length > 0 ? (
            paymentRecords.map((record, recordIndex) => (
              <View
                key={record.id}
                style={[styles.recordCard, { backgroundColor: cardBackground }]}
              >
                <View style={styles.recordHeader}>
                  <View style={styles.recordHeaderLeft}>
                    <View
                      style={[styles.paymentTypeIcon, { backgroundColor: `${primaryColor}20` }]}
                    >
                      <IconSymbol
                        name={getPaymentTypeIcon(record.paymentType)}
                        size={20}
                        color={primaryColor}
                      />
                    </View>
                    <View>
                      <ThemedText style={[styles.orderIdText, { color: textColor }]}>
                        {/* TODO: add orderId once it is fixed from backend currently orderId is null */}
                        Order #{record.id}
                      </ThemedText>
                      <View style={styles.paymentTypeContainer}>
                        <ThemedText style={[styles.paymentTypeText, { color: mutedColor }]}>
                          {record.paymentType}
                        </ThemedText>
                        {record.paidDate && (
                          <>
                            <ThemedText style={[styles.dotSeparator, { color: mutedColor }]}>
                              •
                            </ThemedText>
                            <ThemedText style={[styles.dateText, { color: mutedColor }]}>
                              {formatDate(record.paidDate)}
                            </ThemedText>
                          </>
                        )}
                      </View>
                    </View>
                  </View>
                </View>

                {record.remarks && (
                  <View style={[styles.remarksContainer, { backgroundColor: `${mutedColor}10` }]}>
                    <ThemedText style={[styles.remarksText, { color: mutedColor }]}>
                      {record.remarks}
                    </ThemedText>
                  </View>
                )}

                <View style={styles.payableItemsContainer}>
                  {record.payableList.map((item, itemIndex) => (
                    <View
                      key={item.payableId}
                      style={[
                        styles.payableItem,
                        { borderBottomColor: borderColor },
                        itemIndex === record.payableList.length - 1 && styles.lastPayableItem,
                      ]}
                    >
                      <View style={styles.payableItemHeader}>
                        <View style={styles.feeNameContainer}>
                          <IconSymbol name="book.fill" size={14} color={mutedColor} />
                          <ThemedText style={[styles.feeNameText, { color: textColor }]}>
                            {item.feeName}
                          </ThemedText>
                        </View>
                        {item.period && (
                          <View
                            style={[styles.periodBadge, { backgroundColor: `${primaryColor}15` }]}
                          >
                            <ThemedText style={[styles.periodText, { color: primaryColor }]}>
                              {item.period}
                            </ThemedText>
                          </View>
                        )}
                      </View>

                      <View style={styles.payableItemDetails}>
                        <View style={styles.amountRow}>
                          <ThemedText style={[styles.amountLabel, { color: mutedColor }]}>
                            Amount:
                          </ThemedText>
                          <ThemedText style={[styles.amountValue, { color: textColor }]}>
                            {formatCurrency(item.amount)}
                          </ThemedText>
                        </View>
                        <View style={styles.amountRow}>
                          <ThemedText style={[styles.amountLabel, { color: mutedColor }]}>
                            Paid:
                          </ThemedText>
                          <ThemedText style={[styles.amountValue, { color: successColor }]}>
                            {formatCurrency(item.paid)}
                          </ThemedText>
                        </View>
                        {item.dues > 0 && (
                          <View style={styles.amountRow}>
                            <ThemedText style={[styles.amountLabel, { color: mutedColor }]}>
                              Dues:
                            </ThemedText>
                            <ThemedText style={[styles.amountValue, { color: errorColor }]}>
                              {formatCurrency(item.dues)}
                            </ThemedText>
                          </View>
                        )}
                        {item.discount > 0 && (
                          <View style={styles.amountRow}>
                            <ThemedText style={[styles.amountLabel, { color: mutedColor }]}>
                              Discount:
                            </ThemedText>
                            <ThemedText style={[styles.amountValue, { color: successColor }]}>
                              -{formatCurrency(item.discount)}
                            </ThemedText>
                          </View>
                        )}
                        {item.fine > 0 && (
                          <View style={styles.amountRow}>
                            <ThemedText style={[styles.amountLabel, { color: mutedColor }]}>
                              Fine:
                            </ThemedText>
                            <ThemedText style={[styles.amountValue, { color: warningColor }]}>
                              +{formatCurrency(item.fine)}
                            </ThemedText>
                          </View>
                        )}
                      </View>

                      {item.paidFees && (
                        <View style={styles.paidBadgeContainer}>
                          <View
                            style={[styles.paidBadge, { backgroundColor: `${successColor}20` }]}
                          >
                            <IconSymbol
                              name="checkmark.circle.fill"
                              size={12}
                              color={successColor}
                            />
                            <ThemedText style={[styles.paidBadgeText, { color: successColor }]}>
                              Paid
                            </ThemedText>
                          </View>
                        </View>
                      )}
                    </View>
                  ))}
                </View>

                {record.collectedBy && (
                  <View style={styles.collectorInfo}>
                    <ThemedText style={[styles.collectorLabel, { color: mutedColor }]}>
                      Collected by:
                    </ThemedText>
                    <ThemedText style={[styles.collectorName, { color: textColor }]}>
                      {record.collectedBy}
                    </ThemedText>
                  </View>
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <IconSymbol name="creditcard.fill" size={48} color={mutedColor} />
              <ThemedText style={[styles.emptyStateText, { color: textColor }]}>
                No Payment Records
              </ThemedText>
              <ThemedText style={[styles.emptyStateSubtext, { color: mutedColor }]}>
                No payment records found for this student.
              </ThemedText>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 20,
  },
  totalCard: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  recordsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  recordCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recordHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  paymentTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderIdText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  paymentTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paymentTypeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  dotSeparator: {
    fontSize: 12,
  },
  dateText: {
    fontSize: 12,
  },
  remarksContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  remarksText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  payableItemsContainer: {
    gap: 0,
  },
  payableItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  lastPayableItem: {
    borderBottomWidth: 0,
  },
  payableItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  feeNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  feeNameText: {
    fontSize: 15,
    fontWeight: '600',
  },
  periodBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  periodText: {
    fontSize: 11,
    fontWeight: '600',
  },
  payableItemDetails: {
    gap: 4,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 13,
  },
  amountValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  paidBadgeContainer: {
    marginTop: 8,
    alignItems: 'flex-start',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paidBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  collectorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  collectorLabel: {
    fontSize: 12,
  },
  collectorName: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
})
