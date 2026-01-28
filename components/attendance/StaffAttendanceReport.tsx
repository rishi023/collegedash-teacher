import { ThemedText } from '@/components/ThemedText'
import { useThemeColor } from '@/hooks/useThemeColor'
import {
  getStaffAttendanceReport,
  getStaffProfile,
  StaffAttendance,
  StaffProfile,
} from '@/services/account'
import { storage } from '@/services/storage'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i)

interface DayRegister {
  dayOfMonth: number
  status: 'P' | 'A' | 'H' | null
  inTime: string | null
  outTime: string | null
}

interface AttendanceRegisterRow {
  name: string
  code: string
  staffId: string
  dayRegisterList: DayRegister[]
  totalDays: number
  totalPresent: number
  totalAbsent: number
}

export default function StaffAttendanceReport() {
  const backgroundColor = useThemeColor({}, 'secondary')
  const primaryColor = useThemeColor({}, 'primary')
  const cardBackground = useThemeColor({}, 'card')
  const textColor = useThemeColor({}, 'text')
  const mutedColor = useThemeColor({}, 'muted')
  const borderColor = useThemeColor({}, 'border')
  const successColor = useThemeColor({}, 'success')
  const errorColor = useThemeColor({}, 'error')

  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [staffProfile, setStaffProfile] = useState<StaffProfile | null>(null)
  const [institutionId, setInstitutionId] = useState('')

  // Filters
  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth())
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())
  const [showMonthModal, setShowMonthModal] = useState(false)
  const [showYearModal, setShowYearModal] = useState(false)

  // Report data
  const [showReport, setShowReport] = useState(false)
  const [showTime, setShowTime] = useState(false)
  const [registerRow, setRegisterRow] = useState<AttendanceRegisterRow | null>(null)

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    try {
      const userData = await storage.getUserData()
      if (userData?.institutionIds?.[0]) {
        setInstitutionId(userData.institutionIds[0])
      }

      const res = await getStaffProfile()
      if (res?.responseObject) {
        setStaffProfile(res.responseObject)
      } else {
        Alert.alert('Error', 'Could not load staff profile')
      }
    } catch (error) {
      console.log('Error loading profile:', error)
      Alert.alert('Error', 'Failed to load profile')
    }
    setLoading(false)
  }

  const getDaysInMonth = () => {
    const date = new Date(selectedYear, selectedMonth + 1, 0)
    return date.getDate()
  }

  const formatDate = (year: number, month: number, day: number) => {
    const m = String(month + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    return `${year}-${m}-${d}`
  }

  const getMonthDateRange = () => {
    const startDate = formatDate(selectedYear, selectedMonth, 1)
    const endDay = getDaysInMonth()
    const endDate = formatDate(selectedYear, selectedMonth, endDay)
    return { startDate, endDate }
  }

  const buildAttendanceRegister = (attendanceData: StaffAttendance[]): AttendanceRegisterRow => {
    const daysInMonth = getDaysInMonth()
    const dayRegisterList: DayRegister[] = []

    // Initialize all days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDate(selectedYear, selectedMonth, day)
      const attendance = attendanceData.find(a => {
        const attDate = a.attendanceDate?.split('T')[0]
        return attDate === dateStr
      })

      if (attendance) {
        dayRegisterList.push({
          dayOfMonth: day,
          status: attendance.inTime || attendance.outTime ? 'P' : 'A',
          inTime: attendance.inTime || null,
          outTime: attendance.outTime || null,
        })
      } else {
        dayRegisterList.push({
          dayOfMonth: day,
          status: null,
          inTime: null,
          outTime: null,
        })
      }
    }

    const totalPresent = dayRegisterList.filter(d => d.status === 'P').length
    const totalAbsent = dayRegisterList.filter(d => d.status === 'A').length

    return {
      name: `${staffProfile?.firstName || ''} ${staffProfile?.lastNme || ''}`.trim(),
      code: staffProfile?.empCode || '-',
      staffId: staffProfile?.id || '',
      dayRegisterList,
      totalDays: daysInMonth,
      totalPresent,
      totalAbsent,
    }
  }

  const fetchAttendanceData = async (withTime: boolean) => {
    if (!staffProfile?.id) {
      Alert.alert('Error', 'Staff profile not loaded')
      return
    }

    setFetching(true)
    setShowReport(false)
    setShowTime(withTime)

    try {
      const { startDate, endDate } = getMonthDateRange()

      const res = await getStaffAttendanceReport(staffProfile.id, startDate, endDate)

      const attendanceData = res?.responseObject || []
      const register = buildAttendanceRegister(attendanceData)
      setRegisterRow(register)
      setShowReport(true)

      if (attendanceData.length === 0) {
        Alert.alert('Info', 'No attendance data found for the selected period')
      }
    } catch (error) {
      console.log('Error fetching attendance:', error)
      Alert.alert('Error', 'Failed to fetch attendance data')
    }

    setFetching(false)
  }

  const viewReport = () => fetchAttendanceData(false)
  const viewReportWithTime = () => fetchAttendanceData(true)

  const getDayStatus = (day: number): 'P' | 'A' | 'H' | null => {
    return registerRow?.dayRegisterList.find(d => d.dayOfMonth === day)?.status || null
  }

  const getDayTime = (day: number): string => {
    const dayData = registerRow?.dayRegisterList.find(d => d.dayOfMonth === day)
    if (!dayData || dayData.status !== 'P') return '-'
    const inTime = dayData.inTime ? dayData.inTime.substring(0, 5) : ''
    const outTime = dayData.outTime ? dayData.outTime.substring(0, 5) : ''
    if (inTime && outTime) {
      return `${inTime}-${outTime}`
    } else if (inTime) {
      return inTime
    }
    return 'P'
  }

  const getStatusColor = (status: 'P' | 'A' | 'H' | null) => {
    switch (status) {
      case 'P':
        return successColor
      case 'A':
        return errorColor
      case 'H':
        return '#f59e0b' // warning/amber
      default:
        return mutedColor
    }
  }

  const formattedMonthTitle = () => {
    const startDate = new Date(selectedYear, selectedMonth, 1)
    const endDate = new Date(selectedYear, selectedMonth + 1, 0)
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long', year: 'numeric' }
    return `From ${startDate.toLocaleDateString('en-IN', options)} To ${endDate.toLocaleDateString('en-IN', options)}`
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: backgroundColor }]}>
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    )
  }

  const daysArray = Array.from({ length: getDaysInMonth() }, (_, i) => i + 1)

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: backgroundColor }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Filter Card */}
      <View style={[styles.card, { backgroundColor: cardBackground }]}>
        <ThemedText style={[styles.cardTitle, { color: textColor }]}>
          Staff Attendance Register
        </ThemedText>

        {/* Staff Info (Pre-filled) */}
        <View style={styles.fieldContainer}>
          <ThemedText style={[styles.label, { color: textColor }]}>Staff</ThemedText>
          <View
            style={[styles.infoBox, { backgroundColor: backgroundColor, borderColor: borderColor }]}
          >
            <ThemedText style={[styles.fieldText, { color: textColor }]}>
              {`${staffProfile?.firstName || ''} ${staffProfile?.lastNme || ''}`.trim() ||
                'Loading...'}
            </ThemedText>
            {staffProfile?.empCode && (
              <ThemedText style={[styles.codeText, { color: mutedColor }]}>
                Code: {staffProfile.empCode}
              </ThemedText>
            )}
          </View>
        </View>

        {/* Month Dropdown */}
        <View style={styles.fieldContainer}>
          <ThemedText style={[styles.label, { color: textColor }]}>Month</ThemedText>
          <TouchableOpacity
            style={[
              styles.dropdown,
              { backgroundColor: backgroundColor, borderColor: borderColor },
            ]}
            onPress={() => setShowMonthModal(true)}
          >
            <ThemedText style={[styles.fieldText, { color: textColor }]}>
              {MONTHS[selectedMonth]}
            </ThemedText>
            <ThemedText style={{ color: mutedColor }}>▼</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Year Dropdown */}
        <View style={styles.fieldContainer}>
          <ThemedText style={[styles.label, { color: textColor }]}>Year</ThemedText>
          <TouchableOpacity
            style={[
              styles.dropdown,
              { backgroundColor: backgroundColor, borderColor: borderColor },
            ]}
            onPress={() => setShowYearModal(true)}
          >
            <ThemedText style={[styles.fieldText, { color: textColor }]}>{selectedYear}</ThemedText>
            <ThemedText style={{ color: mutedColor }}>▼</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonFlex,
              { backgroundColor: primaryColor, marginRight: 6 },
            ]}
            onPress={viewReport}
            disabled={fetching}
          >
            {fetching && !showTime ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <ThemedText style={styles.buttonText}>View Report</ThemedText>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonFlex,
              styles.outlineButton,
              { borderColor: primaryColor, marginLeft: 6 },
              !showReport && styles.buttonDisabled,
            ]}
            onPress={viewReportWithTime}
            disabled={fetching || !showReport}
          >
            {fetching && showTime ? (
              <ActivityIndicator color={primaryColor} size="small" />
            ) : (
              <ThemedText style={[styles.buttonText, { color: primaryColor }]}>
                With Time
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Attendance Register Table */}
      {showReport && registerRow && (
        <View style={[styles.card, { backgroundColor: cardBackground }]}>
          <ThemedText style={[styles.cardTitle, { color: textColor, textAlign: 'center' }]}>
            Staff Attendance Register
          </ThemedText>
          <ThemedText style={[styles.dateRange, { color: mutedColor }]}>
            {formattedMonthTitle()}
          </ThemedText>

          {/* Summary */}
          <View style={[styles.summaryRow, { borderColor: borderColor }]}>
            <View style={styles.summaryItem}>
              <ThemedText style={[styles.summaryLabel, { color: mutedColor }]}>Total</ThemedText>
              <ThemedText style={[styles.summaryValue, { color: textColor }]}>
                {registerRow.totalDays}
              </ThemedText>
            </View>
            <View style={styles.summaryItem}>
              <ThemedText style={[styles.summaryLabel, { color: mutedColor }]}>Present</ThemedText>
              <ThemedText style={[styles.summaryValue, { color: successColor }]}>
                {registerRow.totalPresent}
              </ThemedText>
            </View>
            <View style={styles.summaryItem}>
              <ThemedText style={[styles.summaryLabel, { color: mutedColor }]}>Absent</ThemedText>
              <ThemedText style={[styles.summaryValue, { color: errorColor }]}>
                {registerRow.totalAbsent}
              </ThemedText>
            </View>
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {daysArray.map(day => {
              const status = getDayStatus(day)
              const statusColor = getStatusColor(status)
              return (
                <View key={day} style={[styles.dayCell, { borderColor: borderColor }]}>
                  <ThemedText style={[styles.dayNumber, { color: mutedColor }]}>{day}</ThemedText>
                  {showTime && status === 'P' ? (
                    <ThemedText style={[styles.timeText, { color: statusColor }]}>
                      {getDayTime(day)}
                    </ThemedText>
                  ) : (
                    <ThemedText
                      style={[
                        styles.statusText,
                        { color: statusColor, fontWeight: status ? '700' : '400' },
                      ]}
                    >
                      {status || '-'}
                    </ThemedText>
                  )}
                </View>
              )
            })}
          </View>

          {/* Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: successColor }]}></View>
              <ThemedText style={[styles.legendText, { color: mutedColor, marginLeft: 6 }]}>
                Present
              </ThemedText>
            </View>
            <View style={[styles.legendItem, { marginLeft: 20 }]}>
              <View style={[styles.legendDot, { backgroundColor: errorColor }]}></View>
              <ThemedText style={[styles.legendText, { color: mutedColor, marginLeft: 6 }]}>
                Absent
              </ThemedText>
            </View>
            <View style={[styles.legendItem, { marginLeft: 20 }]}>
              <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]}></View>
              <ThemedText style={[styles.legendText, { color: mutedColor, marginLeft: 6 }]}>
                Holiday
              </ThemedText>
            </View>
          </View>
        </View>
      )}

      {/* Empty State */}
      {showReport && !registerRow && (
        <View style={[styles.card, { backgroundColor: cardBackground }]}>
          <ThemedText style={[styles.emptyText, { color: mutedColor }]}>
            No attendance data found for the selected filters.
          </ThemedText>
        </View>
      )}

      {/* Month Modal */}
      <Modal visible={showMonthModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMonthModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: cardBackground }]}>
            <ThemedText style={[styles.modalTitle, { color: textColor }]}>Select Month</ThemedText>
            <ScrollView>
              {MONTHS.map((month, index) => (
                <TouchableOpacity
                  key={month}
                  style={[
                    styles.modalOption,
                    { borderBottomColor: borderColor },
                    selectedMonth === index && { backgroundColor: primaryColor + '20' },
                  ]}
                  onPress={() => {
                    setSelectedMonth(index)
                    setShowMonthModal(false)
                  }}
                >
                  <ThemedText
                    style={[
                      styles.modalOptionText,
                      { color: textColor },
                      selectedMonth === index && { color: primaryColor, fontWeight: '600' },
                    ]}
                  >
                    {month}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Year Modal */}
      <Modal visible={showYearModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowYearModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: cardBackground }]}>
            <ThemedText style={[styles.modalTitle, { color: textColor }]}>Select Year</ThemedText>
            <ScrollView>
              {YEARS.map(year => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.modalOption,
                    { borderBottomColor: borderColor },
                    selectedYear === year && { backgroundColor: primaryColor + '20' },
                  ]}
                  onPress={() => {
                    setSelectedYear(year)
                    setShowYearModal(false)
                  }}
                >
                  <ThemedText
                    style={[
                      styles.modalOptionText,
                      { color: textColor },
                      selectedYear === year && { color: primaryColor, fontWeight: '600' },
                    ]}
                  >
                    {year}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
  },
  fieldText: {
    fontSize: 16,
  },
  codeText: {
    fontSize: 12,
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  button: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonFlex: {
    flex: 1,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  dateRange: {
    textAlign: 'center',
    fontSize: 13,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dayNumber: {
    fontSize: 15,
    marginBottom: 2,
  },
  statusText: {
    fontSize: 20,
  },
  timeText: {
    fontSize: 8,
    textAlign: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
  },
  emptyText: {
    textAlign: 'center',
    padding: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 12,
    padding: 20,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    padding: 16,
    borderBottomWidth: 1,
  },
  modalOptionText: {
    fontSize: 16,
  },
})
