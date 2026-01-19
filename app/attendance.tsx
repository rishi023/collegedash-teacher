import AttendanceCalendar from '@/components/AttendanceCalendar'
import { ThemedText } from '@/components/ThemedText'
import { useAuth } from '@/contexts/AuthContext'
import { useThemeColor } from '@/hooks/useThemeColor'
import { getStudentAttendance } from '@/services/account'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

interface Attendance {
  id: string
  date: string
  status: 'Present' | 'Absent' | 'Leave' | 'Holiday'
}

export default function AttendanceScreen() {
  const backgroundColor = useThemeColor({}, 'secondary')
  const cardBackground = useThemeColor({}, 'card')
  const textColor = useThemeColor({}, 'text')
  const mutedColor = useThemeColor({}, 'muted')
  const primaryColor = useThemeColor({}, 'primary')
  const { user } = useAuth()

  const [currentDate, setCurrentDate] = useState(new Date())
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (user?.studentDetails) {
      fetchAttendance()
    }
  }, [currentDate, user])

  const fetchAttendance = async () => {
    if (
      !user?.studentDetails?.classId ||
      !user?.studentDetails?.section ||
      !user?.studentDetails?.studentId
    ) {
      Alert.alert('Error', 'Student details not available')
      return
    }

    setIsLoading(true)
    try {
      const { startDate, endDate } = getMonthDateRange(currentDate)
      const response = await getStudentAttendance(
        user.studentDetails.classId,
        user.studentDetails.section,
        user.studentDetails.studentId,
        startDate,
        endDate
      )

      if (response?.responseObject) {
        // Transform API data to Attendance format
        const transformedData: Attendance[] = response.responseObject.map((record, index) => ({
          id: `${record.studentId}-${record.date}-${index}`,
          date: record.date,
          status: record.present ? 'Present' : 'Absent',
        }))
        setAttendanceRecords(transformedData)
      } else {
        setAttendanceRecords([])
      }
    } catch (error) {
      console.error('Error fetching attendance:', error)
      Alert.alert('Error', 'Failed to fetch attendance. Please try again.')
      setAttendanceRecords([])
    } finally {
      setIsLoading(false)
    }
  }

  const getMonthDateRange = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    const formatDate = (d: Date): string => {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }

    return {
      startDate: formatDate(firstDay),
      endDate: formatDate(lastDay),
    }
  }

  // Group attendance by date
  const attendanceByDate = attendanceRecords.reduce((acc, record) => {
    if (!acc[record.date]) {
      acc[record.date] = []
    }
    acc[record.date].push(record)
    return acc
  }, {} as Record<string, Attendance[]>)

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const calculateAttendanceStats = () => {
    const totalClasses = attendanceRecords.filter(a => a.status !== 'Holiday').length
    const presentClasses = attendanceRecords.filter(a => a.status === 'Present').length
    const absentClasses = attendanceRecords.filter(a => a.status === 'Absent').length
    const leaveClasses = attendanceRecords.filter(a => a.status === 'Leave').length
    const holidayClasses = attendanceRecords.filter(a => a.status === 'Holiday').length

    return {
      total: totalClasses,
      present: presentClasses,
      absent: absentClasses,
      leave: leaveClasses,
      holiday: holidayClasses,
      percentage: totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0,
    }
  }

  const stats = calculateAttendanceStats()

  return (
    <SafeAreaView
      edges={{ top: 'off', bottom: 'additive' }}
      style={[styles.container, { backgroundColor }]}
    >
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={primaryColor} />
            <ThemedText style={[styles.loadingText, { color: mutedColor }]}>
              Loading attendance...
            </ThemedText>
          </View>
        ) : (
          <>
            <View style={styles.statsContainer}>
              <View style={[styles.mainStatCard, { backgroundColor: cardBackground }]}>
                <ThemedText style={[styles.percentageText, { color: textColor }]}>
                  {stats.percentage}%
                </ThemedText>
                <ThemedText style={[styles.percentageLabel, { color: mutedColor }]}>
                  Overall Attendance
                </ThemedText>
              </View>

              <View style={styles.statsRow}>
                <View
                  style={[
                    styles.statCard,
                    { backgroundColor: cardBackground, borderLeftColor: '#10b981' },
                  ]}
                >
                  <ThemedText style={[styles.statNumber, { color: '#10b981' }]}>
                    {stats.present}
                  </ThemedText>
                  <ThemedText style={[styles.statLabel, { color: mutedColor }]}>Present</ThemedText>
                </View>

                <View
                  style={[
                    styles.statCard,
                    { backgroundColor: cardBackground, borderLeftColor: '#ef4444' },
                  ]}
                >
                  <ThemedText style={[styles.statNumber, { color: '#ef4444' }]}>
                    {stats.absent}
                  </ThemedText>
                  <ThemedText style={[styles.statLabel, { color: mutedColor }]}>Absent</ThemedText>
                </View>

                <View
                  style={[
                    styles.statCard,
                    { backgroundColor: cardBackground, borderLeftColor: '#8b5cf6' },
                  ]}
                >
                  <ThemedText style={[styles.statNumber, { color: '#8b5cf6' }]}>
                    {stats.leave}
                  </ThemedText>
                  <ThemedText style={[styles.statLabel, { color: mutedColor }]}>Leave</ThemedText>
                </View>

                <View
                  style={[
                    styles.statCard,
                    { backgroundColor: cardBackground, borderLeftColor: '#06b6d4' },
                  ]}
                >
                  <ThemedText style={[styles.statNumber, { color: '#06b6d4' }]}>
                    {stats.holiday}
                  </ThemedText>
                  <ThemedText style={[styles.statLabel, { color: mutedColor }]}>Holiday</ThemedText>
                </View>
              </View>
            </View>

            <AttendanceCalendar
              currentDate={currentDate}
              attendanceByDate={attendanceByDate}
              onMonthChange={navigateMonth}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 16,
  },
  mainStatCard: {
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
  percentageText: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  percentageLabel: {
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
  },
  scrollContainer: {
    flex: 1,
  },
})
