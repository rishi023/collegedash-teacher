import { ThemedText } from '@/components/ThemedText'
import { useThemeColor } from '@/hooks/useThemeColor'
import { api } from '@/services/axios'
import { storage } from '@/services/storage'
import { Course, StudentAttendance } from '@/types/assignment'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AttendanceFilter from './AttendanceFilter'

interface AttendanceResponse {
  id: string
  batchId: string
  classId: string
  courseId: string
  courseName: string
  date: string
  departmentId: string | null
  grade: string
  section: string
  year: string
  studentAttendance: StudentAttendance[]
}

export default function ViewAttendance() {
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

  // Data
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseIndex, setSelectedCourseIndex] = useState(-1)
  const [selectedYearIndex, setSelectedYearIndex] = useState(-1)
  const [selectedSectionIndex, setSelectedSectionIndex] = useState(-1)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  // Attendance data
  const [attendanceData, setAttendanceData] = useState<AttendanceResponse | null>(null)

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    try {
      const userData = await storage.getUserData()
      const batch = userData?.runningBatchId
      if (!batch) {
        setLoading(false)
        Alert.alert('Error', 'No batch found in user data')
        return
      }

      const res = await api.get(`/v1/course/batch/${batch}`)
      const courseList = res?.responseObject || res || []

      if (Array.isArray(courseList) && courseList.length > 0) {
        setCourses(courseList)
      } else {
        Alert.alert('Error', 'No courses found')
      }
    } catch (error) {
      console.log('Error:', error)
      Alert.alert('Error', 'Something went wrong')
    }
    setLoading(false)
  }

  // Get selected course
  const getSelectedCourse = (): Course | null => {
    if (courses.length === 0 || selectedCourseIndex < 0 || selectedCourseIndex >= courses.length)
      return null
    return courses[selectedCourseIndex]
  }

  // Get years from selected course
  const getYears = () => {
    const course = getSelectedCourse()
    if (!course?.years) return []
    return course.years
  }

  // Get sections from selected year
  const getSections = () => {
    const years = getYears()
    if (years.length === 0 || selectedYearIndex < 0 || selectedYearIndex >= years.length) return []
    return years[selectedYearIndex]?.sections || []
  }

  const handleCourseSelect = (index: number) => {
    setSelectedCourseIndex(index)
    setSelectedYearIndex(-1)
    setSelectedSectionIndex(-1)
    setAttendanceData(null)
  }

  const handleYearSelect = (index: number) => {
    setSelectedYearIndex(index)
    setSelectedSectionIndex(-1)
    setAttendanceData(null)
  }

  const handleSectionSelect = (index: number) => {
    setSelectedSectionIndex(index)
    setAttendanceData(null)
  }

  const clearSection = () => {
    setSelectedSectionIndex(-1)
    setAttendanceData(null)
  }

  const getStudentsAttendance = async () => {
    const course = getSelectedCourse()
    const years = getYears()

    if (!course || selectedYearIndex < 0) {
      Alert.alert('Error', 'Please select course and year')
      return
    }

    if (!selectedDate) {
      Alert.alert('Error', 'Please select date')
      return
    }

    setFetching(true)
    setAttendanceData(null)

    const yearName = years[selectedYearIndex]?.name || ''
    const sections = getSections()
    const sectionName = selectedSectionIndex >= 0 ? sections[selectedSectionIndex]?.name : ''
    const encodedYear = encodeURIComponent(yearName)

    try {
      // API: v1/attendance/course/{courseId}/year/{year}?section={section}&date={date}
      const url = `/v1/attendance/course/${course.id}/year/${encodedYear}?date=${selectedDate}${sectionName ? `&section=${sectionName}` : ''}`

      const res = await api.get(url)
      const data = res?.responseObject

      if (data?.id && data?.studentAttendance?.length > 0) {
        setAttendanceData(data)
      } else {
        Alert.alert('Info', 'No attendance record found for the selected date')
      }
    } catch (error) {
      console.log('Error:', error)
      Alert.alert('Error', 'Failed to fetch attendance data')
    }

    setFetching(false)
  }

  // Calculate attendance summary
  const getSummary = () => {
    if (!attendanceData?.studentAttendance) return { total: 0, present: 0, absent: 0 }
    const total = attendanceData.studentAttendance.length
    const present = attendanceData.studentAttendance.filter(s => s.present).length
    const absent = total - present
    return { total, present, absent }
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primaryColor} />
      </SafeAreaView>
    )
  }

  const summary = getSummary()

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} showsVerticalScrollIndicator={false}>
      {/* Filter Card */}
      <View style={[styles.card, { backgroundColor: cardBackground }]}>
        <ThemedText style={[styles.cardTitle, { color: textColor }]}>View Attendance</ThemedText>

        <AttendanceFilter
          courses={courses}
          selectedCourseIndex={selectedCourseIndex}
          selectedYearIndex={selectedYearIndex}
          selectedSectionIndex={selectedSectionIndex}
          selectedDate={selectedDate}
          onCourseSelect={handleCourseSelect}
          onYearSelect={handleYearSelect}
          onSectionSelect={handleSectionSelect}
          onDateChange={setSelectedDate}
          onClearSection={clearSection}
          onView={getStudentsAttendance}
          loading={fetching}
        />
      </View>

      {/* Attendance Data */}
      {attendanceData && (
        <View style={[styles.card, { backgroundColor: cardBackground }]}>
          {/* Attendance Info */}
          <View style={[styles.infoRow, { borderBottomColor: borderColor }]}>
            <ThemedText style={[styles.infoLabel, { color: mutedColor }]}>Course:</ThemedText>
            <ThemedText style={[styles.infoValue, { color: textColor }]}>
              {attendanceData.courseName}
            </ThemedText>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: borderColor }]}>
            <ThemedText style={[styles.infoLabel, { color: mutedColor }]}>Year:</ThemedText>
            <ThemedText style={[styles.infoValue, { color: textColor }]}>
              {attendanceData.year}
            </ThemedText>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: borderColor }]}>
            <ThemedText style={[styles.infoLabel, { color: mutedColor }]}>Section:</ThemedText>
            <ThemedText style={[styles.infoValue, { color: textColor }]}>
              {attendanceData.section || '-'}
            </ThemedText>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: borderColor }]}>
            <ThemedText style={[styles.infoLabel, { color: mutedColor }]}>Date:</ThemedText>
            <ThemedText style={[styles.infoValue, { color: textColor }]}>
              {attendanceData.date}
            </ThemedText>
          </View>

          {/* Summary */}
          <View style={styles.summaryContainer}>
            <View style={[styles.summaryItem, { backgroundColor: primaryColor + '20' }]}>
              <ThemedText style={[styles.summaryValue, { color: primaryColor }]}>
                {summary.total}
              </ThemedText>
              <ThemedText style={[styles.summaryLabel, { color: mutedColor }]}>Total</ThemedText>
            </View>
            <View style={[styles.summaryItem, { backgroundColor: successColor + '20' }]}>
              <ThemedText style={[styles.summaryValue, { color: successColor }]}>
                {summary.present}
              </ThemedText>
              <ThemedText style={[styles.summaryLabel, { color: mutedColor }]}>Present</ThemedText>
            </View>
            <View style={[styles.summaryItem, { backgroundColor: errorColor + '20' }]}>
              <ThemedText style={[styles.summaryValue, { color: errorColor }]}>
                {summary.absent}
              </ThemedText>
              <ThemedText style={[styles.summaryLabel, { color: mutedColor }]}>Absent</ThemedText>
            </View>
          </View>

          {/* Table Header */}
          <View style={[styles.tableHeader, { borderBottomColor: borderColor }]}>
            <ThemedText style={[styles.tableHeaderCell, { color: textColor, flex: 0.5 }]}>
              #
            </ThemedText>
            <ThemedText style={[styles.tableHeaderCell, { color: textColor, flex: 0.8 }]}>
              Roll No
            </ThemedText>
            <ThemedText style={[styles.tableHeaderCell, { color: textColor, flex: 2 }]}>
              Student Name
            </ThemedText>
            <ThemedText style={[styles.tableHeaderCell, { color: textColor, flex: 1 }]}>
              Status
            </ThemedText>
          </View>

          {/* Student Rows */}
          {attendanceData.studentAttendance.map((student, index) => (
            <View
              key={`student-${student.studentId}-${index}`}
              style={[styles.tableRow, { borderBottomColor: borderColor }]}
            >
              <ThemedText style={[styles.tableCell, { color: mutedColor, flex: 0.5 }]}>
                {index + 1}
              </ThemedText>
              <ThemedText style={[styles.tableCell, { color: textColor, flex: 0.8 }]}>
                {student.rollNumber || '-'}
              </ThemedText>
              <View style={{ flex: 2 }}>
                <ThemedText style={[styles.studentName, { color: textColor }]}>
                  {student.studentName}
                </ThemedText>
                {student.fatherName && (
                  <ThemedText style={[styles.fatherName, { color: mutedColor }]}>
                    {student.fatherName}
                  </ThemedText>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText
                  style={[
                    styles.statusText,
                    { color: student.present ? successColor : errorColor },
                  ]}
                >
                  {student.present ? 'PRESENT' : 'ABSENT'}
                </ThemedText>
              </View>
            </View>
          ))}
        </View>
      )}
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
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 14,
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  summaryContainer: {
    flexDirection: 'row',
    marginVertical: 16,
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 2,
    alignItems: 'center',
  },
  tableHeaderCell: {
    fontSize: 13,
    fontWeight: '600',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 14,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '500',
  },
  fatherName: {
    fontSize: 12,
    marginTop: 2,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
})
