import { ThemedText } from '@/components/ThemedText'
import { useThemeColor } from '@/hooks/useThemeColor'
import { api } from '@/services/axios'
import { storage } from '@/services/storage'
import { Course, Year, Section } from '@/types/assignment'
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
}

interface StudentAttendanceRow {
  name: string
  rollNumber?: number
  dayRegisterList: DayRegister[]
  totalClass: number
  totalPresent: number
  totalAbsent: number
}

export default function StudentAttendanceReport() {
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
  const [batchId, setBatchId] = useState('')

  // Course/Year/Section data
  const [courses, setCourses] = useState<Course[]>([])
  const [years, setYears] = useState<Year[]>([])
  const [sections, setSections] = useState<Section[]>([])

  // Selected filters
  const [selectedCourseIndex, setSelectedCourseIndex] = useState(-1)
  const [selectedYearIndex, setSelectedYearIndex] = useState(-1)
  const [selectedSectionIndex, setSelectedSectionIndex] = useState(-1)
  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth())
  const [selectedCalendarYear, setSelectedCalendarYear] = useState(currentDate.getFullYear())

  // Modals
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [showYearModal, setShowYearModal] = useState(false)
  const [showSectionModal, setShowSectionModal] = useState(false)
  const [showMonthModal, setShowMonthModal] = useState(false)
  const [showCalendarYearModal, setShowCalendarYearModal] = useState(false)

  // Report data
  const [showReport, setShowReport] = useState(false)
  const [rows, setRows] = useState<StudentAttendanceRow[]>([])

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
      setBatchId(batch)

      const res = await api.get(`/v1/course/batch/${batch}`)
      const courseList = res?.responseObject || []

      if (Array.isArray(courseList) && courseList.length > 0) {
        setCourses(courseList)
      }
    } catch (error) {
      console.log('Error:', error)
      Alert.alert('Error', 'Failed to load courses')
    }
    setLoading(false)
  }

  const getSelectedCourse = (): Course | null => {
    if (courses.length === 0 || selectedCourseIndex < 0) return null
    return courses[selectedCourseIndex]
  }

  const handleCourseSelect = (index: number) => {
    setSelectedCourseIndex(index)
    setSelectedYearIndex(-1)
    setSelectedSectionIndex(-1)
    setSections([])
    setShowReport(false)
    setRows([])
    setShowCourseModal(false)

    // Load years for selected course
    const course = courses[index]
    if (course?.years) {
      setYears(course.years)
    } else {
      setYears([])
    }
  }

  const handleYearSelect = (index: number) => {
    setSelectedYearIndex(index)
    setSelectedSectionIndex(-1)
    setShowReport(false)
    setRows([])
    setShowYearModal(false)

    // Load sections for selected year
    const year = years[index]
    if (year?.sections) {
      setSections(year.sections)
    } else {
      setSections([])
    }
  }

  const handleSectionSelect = (index: number) => {
    setSelectedSectionIndex(index)
    setShowReport(false)
    setRows([])
    setShowSectionModal(false)
  }

  const clearSection = () => {
    setSelectedSectionIndex(-1)
    setShowReport(false)
    setRows([])
  }

  const getDaysInMonth = () => {
    const date = new Date(selectedCalendarYear, selectedMonth + 1, 0)
    return date.getDate()
  }

  const formattedMonthTitle = () => {
    const startDate = new Date(selectedCalendarYear, selectedMonth, 1)
    const endDate = new Date(selectedCalendarYear, selectedMonth + 1, 0)
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long', year: 'numeric' }
    return `From ${startDate.toLocaleDateString('en-IN', options)} To ${endDate.toLocaleDateString('en-IN', options)}`
  }

  const fetchAttendanceData = async () => {
    const course = getSelectedCourse()
    if (!course || selectedYearIndex < 0) {
      Alert.alert('Error', 'Please select course and year')
      return
    }

    setFetching(true)
    setShowReport(false)

    try {
      const yearName = years[selectedYearIndex]?.name || ''
      const sectionName = selectedSectionIndex >= 0 ? sections[selectedSectionIndex]?.name : ''
      const monthName = MONTHS[selectedMonth]

      const params: Record<string, string> = {
        courseId: course.id,
        year: yearName,
        month: monthName,
        yearStr: selectedCalendarYear.toString(),
        calendarYear: selectedCalendarYear.toString(),
      }

      if (sectionName) {
        params.section = sectionName
      }

      const res = await api.get('/v1/attendance/register', { params })
      const attendanceData = res?.responseObject || []

      if (Array.isArray(attendanceData) && attendanceData.length > 0) {
        setRows(attendanceData)
        setShowReport(true)
      } else {
        setRows([])
        setShowReport(true)
        Alert.alert('Info', 'No attendance data found for the selected filters')
      }
    } catch (error) {
      console.log('Error fetching attendance:', error)
      Alert.alert('Error', 'Failed to fetch attendance data')
    }

    setFetching(false)
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'P':
        return successColor
      case 'A':
        return errorColor
      case 'H':
        return '#f59e0b'
      default:
        return mutedColor
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: backgroundColor }]}>
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    )
  }

  const selectedCourse = getSelectedCourse()
  const selectedYear = selectedYearIndex >= 0 ? years[selectedYearIndex] : null
  const selectedSection = selectedSectionIndex >= 0 ? sections[selectedSectionIndex] : null
  const daysArray = rows.length > 0 && rows[0].dayRegisterList
    ? rows[0].dayRegisterList.map(d => d.dayOfMonth)
    : Array.from({ length: getDaysInMonth() }, (_, i) => i + 1)

  return (
    <ScrollView style={[styles.container, { backgroundColor: backgroundColor }]} showsVerticalScrollIndicator={false}>
      {/* Filter Card */}
      <View style={[styles.card, { backgroundColor: cardBackground }]}>
        <ThemedText style={[styles.cardTitle, { color: textColor }]}>
          Student Attendance Register
        </ThemedText>

        {/* Course Dropdown */}
        <View style={styles.fieldContainer}>
          <ThemedText style={[styles.label, { color: textColor }]}>Course *</ThemedText>
          <TouchableOpacity
            style={[styles.dropdown, { backgroundColor: backgroundColor, borderColor: borderColor }]}
            onPress={() => setShowCourseModal(true)}
          >
            <ThemedText style={[styles.fieldText, { color: selectedCourse ? textColor : mutedColor }]}>
              {selectedCourse?.name || 'Select Course'}
            </ThemedText>
            <ThemedText style={{ color: mutedColor }}>▼</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Year Dropdown */}
        <View style={styles.fieldContainer}>
          <ThemedText style={[styles.label, { color: textColor }]}>Year *</ThemedText>
          <TouchableOpacity
            style={[styles.dropdown, { backgroundColor: backgroundColor, borderColor: borderColor }]}
            onPress={() => setShowYearModal(true)}
            disabled={selectedCourseIndex < 0}
          >
            <ThemedText style={[styles.fieldText, { color: selectedYear ? textColor : mutedColor }]}>
              {selectedYear?.name || 'Select Year'}
            </ThemedText>
            <ThemedText style={{ color: mutedColor }}>▼</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Section Dropdown (Optional) */}
        <View style={styles.fieldContainer}>
          <ThemedText style={[styles.label, { color: textColor }]}>Section (Optional)</ThemedText>
          <View style={styles.sectionRow}>
            <TouchableOpacity
              style={[styles.dropdown, styles.sectionDropdown, { backgroundColor: backgroundColor, borderColor: borderColor }]}
              onPress={() => setShowSectionModal(true)}
              disabled={selectedYearIndex < 0}
            >
              <ThemedText style={[styles.fieldText, { color: selectedSection ? textColor : mutedColor }]}>
                {selectedSection?.name || 'Select Section'}
              </ThemedText>
              <ThemedText style={{ color: mutedColor }}>▼</ThemedText>
            </TouchableOpacity>
            {selectedSectionIndex >= 0 && (
              <TouchableOpacity
                style={[styles.clearButton, { borderColor: borderColor }]}
                onPress={clearSection}
              >
                <ThemedText style={[styles.clearButtonText, { color: mutedColor }]}>✕</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Month and Year Row */}
        <View style={styles.rowContainer}>
          <View style={[styles.fieldContainer, { flex: 1, marginRight: 8 }]}>
            <ThemedText style={[styles.label, { color: textColor }]}>Month *</ThemedText>
            <TouchableOpacity
              style={[styles.dropdown, { backgroundColor: backgroundColor, borderColor: borderColor }]}
              onPress={() => setShowMonthModal(true)}
            >
              <ThemedText style={[styles.fieldText, { color: textColor }]}>
                {MONTHS[selectedMonth]}
              </ThemedText>
              <ThemedText style={{ color: mutedColor }}>▼</ThemedText>
            </TouchableOpacity>
          </View>
          <View style={[styles.fieldContainer, { flex: 1, marginLeft: 8 }]}>
            <ThemedText style={[styles.label, { color: textColor }]}>Year *</ThemedText>
            <TouchableOpacity
              style={[styles.dropdown, { backgroundColor: backgroundColor, borderColor: borderColor }]}
              onPress={() => setShowCalendarYearModal(true)}
            >
              <ThemedText style={[styles.fieldText, { color: textColor }]}>
                {selectedCalendarYear}
              </ThemedText>
              <ThemedText style={{ color: mutedColor }}>▼</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* View Button */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: primaryColor }]}
          onPress={fetchAttendanceData}
          disabled={fetching || selectedCourseIndex < 0 || selectedYearIndex < 0}
        >
          {fetching ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <ThemedText style={styles.buttonText}>View Report</ThemedText>
          )}
        </TouchableOpacity>
      </View>

      {/* Attendance Register Table */}
      {showReport && rows.length > 0 && (
        <View style={[styles.card, { backgroundColor: cardBackground }]}>
          <ThemedText style={[styles.cardTitle, { color: textColor, textAlign: 'center' }]}>
            Attendance Register
          </ThemedText>
          <ThemedText style={[styles.dateRange, { color: mutedColor }]}>
            {formattedMonthTitle()}
          </ThemedText>
          <ThemedText style={[styles.courseInfo, { color: mutedColor }]}>
            {selectedCourse?.name} - {selectedYear?.name}
            {selectedSection ? ` - Section ${selectedSection.name}` : ''}
          </ThemedText>

          {/* Horizontal scroll for the table */}
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View>
              {/* Table Header */}
              <View style={[styles.tableRow, styles.tableHeader, { borderColor: borderColor }]}>
                <View style={[styles.nameCell, { borderColor: borderColor }]}>
                  <ThemedText style={[styles.headerText, { color: textColor }]}>Name</ThemedText>
                </View>
                {daysArray.map(day => (
                  <View key={day} style={[styles.dayCell, { borderColor: borderColor }]}>
                    <ThemedText style={[styles.headerText, { color: textColor }]}>{day}</ThemedText>
                  </View>
                ))}
                <View style={[styles.summaryCell, { borderColor: borderColor }]}>
                  <ThemedText style={[styles.headerText, { color: textColor }]}>Total</ThemedText>
                </View>
                <View style={[styles.summaryCell, { borderColor: borderColor }]}>
                  <ThemedText style={[styles.headerText, { color: textColor }]}>P</ThemedText>
                </View>
                <View style={[styles.summaryCell, { borderColor: borderColor }]}>
                  <ThemedText style={[styles.headerText, { color: textColor }]}>A</ThemedText>
                </View>
              </View>

              {/* Table Body */}
              {rows.map((row, index) => (
                <View key={index} style={[styles.tableRow, { borderColor: borderColor }]}>
                  <View style={[styles.nameCell, { borderColor: borderColor }]}>
                    <ThemedText style={[styles.cellText, { color: textColor }]} numberOfLines={1}>
                      {row.name}
                    </ThemedText>
                  </View>
                  {row.dayRegisterList.map((day, dayIndex) => (
                    <View key={dayIndex} style={[styles.dayCell, { borderColor: borderColor }]}>
                      <ThemedText
                        style={[
                          styles.statusText,
                          { color: getStatusColor(day.status), fontWeight: day.status ? '600' : '400' },
                        ]}
                      >
                        {day.status || '-'}
                      </ThemedText>
                    </View>
                  ))}
                  <View style={[styles.summaryCell, { borderColor: borderColor }]}>
                    <ThemedText style={[styles.cellText, { color: textColor }]}>{row.totalClass}</ThemedText>
                  </View>
                  <View style={[styles.summaryCell, { borderColor: borderColor }]}>
                    <ThemedText style={[styles.cellText, { color: successColor, fontWeight: '600' }]}>
                      {row.totalPresent}
                    </ThemedText>
                  </View>
                  <View style={[styles.summaryCell, { borderColor: borderColor }]}>
                    <ThemedText style={[styles.cellText, { color: errorColor, fontWeight: '600' }]}>
                      {row.totalAbsent}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: successColor }]}></View>
              <ThemedText style={[styles.legendText, { color: mutedColor, marginLeft: 6 }]}>Present</ThemedText>
            </View>
            <View style={[styles.legendItem, { marginLeft: 20 }]}>
              <View style={[styles.legendDot, { backgroundColor: errorColor }]}></View>
              <ThemedText style={[styles.legendText, { color: mutedColor, marginLeft: 6 }]}>Absent</ThemedText>
            </View>
            <View style={[styles.legendItem, { marginLeft: 20 }]}>
              <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]}></View>
              <ThemedText style={[styles.legendText, { color: mutedColor, marginLeft: 6 }]}>Holiday</ThemedText>
            </View>
          </View>
        </View>
      )}

      {/* Empty State */}
      {showReport && rows.length === 0 && (
        <View style={[styles.card, { backgroundColor: cardBackground }]}>
          <ThemedText style={[styles.emptyText, { color: mutedColor }]}>
            No attendance data found for the selected filters.
          </ThemedText>
        </View>
      )}

      {/* Course Modal */}
      <Modal visible={showCourseModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCourseModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: cardBackground }]}>
            <ThemedText style={[styles.modalTitle, { color: textColor }]}>Select Course</ThemedText>
            <ScrollView>
              {courses.map((course, index) => (
                <TouchableOpacity
                  key={course.id}
                  style={[
                    styles.modalOption,
                    { borderBottomColor: borderColor },
                    selectedCourseIndex === index && { backgroundColor: primaryColor + '20' },
                  ]}
                  onPress={() => handleCourseSelect(index)}
                >
                  <ThemedText
                    style={[
                      styles.modalOptionText,
                      { color: textColor },
                      selectedCourseIndex === index && { color: primaryColor, fontWeight: '600' },
                    ]}
                  >
                    {course.name}
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
              {years.map((year, index) => (
                <TouchableOpacity
                  key={year.name}
                  style={[
                    styles.modalOption,
                    { borderBottomColor: borderColor },
                    selectedYearIndex === index && { backgroundColor: primaryColor + '20' },
                  ]}
                  onPress={() => handleYearSelect(index)}
                >
                  <ThemedText
                    style={[
                      styles.modalOptionText,
                      { color: textColor },
                      selectedYearIndex === index && { color: primaryColor, fontWeight: '600' },
                    ]}
                  >
                    {year.name}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Section Modal */}
      <Modal visible={showSectionModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSectionModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: cardBackground }]}>
            <ThemedText style={[styles.modalTitle, { color: textColor }]}>Select Section</ThemedText>
            <ScrollView>
              {sections.length > 0 ? (
                sections.map((section, index) => (
                  <TouchableOpacity
                    key={section.name}
                    style={[
                      styles.modalOption,
                      { borderBottomColor: borderColor },
                      selectedSectionIndex === index && { backgroundColor: primaryColor + '20' },
                    ]}
                    onPress={() => handleSectionSelect(index)}
                  >
                    <ThemedText
                      style={[
                        styles.modalOptionText,
                        { color: textColor },
                        selectedSectionIndex === index && { color: primaryColor, fontWeight: '600' },
                      ]}
                    >
                      {section.name}
                    </ThemedText>
                  </TouchableOpacity>
                ))
              ) : (
                <ThemedText style={[styles.noDataText, { color: mutedColor }]}>
                  No sections available
                </ThemedText>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

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

      {/* Calendar Year Modal */}
      <Modal visible={showCalendarYearModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCalendarYearModal(false)}
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
                    selectedCalendarYear === year && { backgroundColor: primaryColor + '20' },
                  ]}
                  onPress={() => {
                    setSelectedCalendarYear(year)
                    setShowCalendarYearModal(false)
                  }}
                >
                  <ThemedText
                    style={[
                      styles.modalOptionText,
                      { color: textColor },
                      selectedCalendarYear === year && { color: primaryColor, fontWeight: '600' },
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
  rowContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionDropdown: {
    flex: 1,
  },
  clearButton: {
    marginLeft: 8,
    padding: 14,
    borderWidth: 1,
    borderRadius: 8,
  },
  clearButtonText: {
    fontSize: 16,
  },
  fieldText: {
    fontSize: 16,
  },
  button: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dateRange: {
    textAlign: 'center',
    fontSize: 13,
    marginBottom: 8,
  },
  courseInfo: {
    textAlign: 'center',
    fontSize: 12,
    marginBottom: 16,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tableHeader: {
    borderTopWidth: 1,
  },
  nameCell: {
    width: 120,
    padding: 8,
    borderRightWidth: 1,
    justifyContent: 'center',
  },
  dayCell: {
    width: 32,
    padding: 4,
    borderRightWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCell: {
    width: 40,
    padding: 4,
    borderRightWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  cellText: {
    fontSize: 12,
  },
  statusText: {
    fontSize: 11,
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
  noDataText: {
    padding: 16,
    textAlign: 'center',
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
