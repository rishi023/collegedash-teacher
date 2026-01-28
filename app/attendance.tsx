import { ThemedText } from '@/components/ThemedText'
import StudentAttendanceReport from '@/components/attendance/StudentAttendanceReport'
import ViewAttendance from '@/components/attendance/ViewAttendance'
import { useThemeColor } from '@/hooks/useThemeColor'
import { api } from '@/services/axios'
import { storage } from '@/services/storage'
import { AttendancePayload, Course, Section, StudentAttendance, Year } from '@/types/assignment'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type TabType = 'add' | 'view' | 'report'

export default function AttendanceScreen() {
  const backgroundColor = useThemeColor({}, 'secondary')
  const primaryColor = useThemeColor({}, 'primary')
  const cardBackground = useThemeColor({}, 'card')
  const textColor = useThemeColor({}, 'text')
  const mutedColor = useThemeColor({}, 'muted')
  const borderColor = useThemeColor({}, 'border')

  const [activeTab, setActiveTab] = useState<TabType>('add')
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [saving, setSaving] = useState(false)

  // Data
  const [batchId, setBatchId] = useState('')
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseIndex, setSelectedCourseIndex] = useState(-1)
  const [selectedYearIndex, setSelectedYearIndex] = useState(-1)
  const [selectedSectionIndex, setSelectedSectionIndex] = useState(-1)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  // Attendance data
  const [students, setStudents] = useState<StudentAttendance[]>([])
  const [attendanceId, setAttendanceId] = useState<string | null>(null)

  // Modals
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [showYearModal, setShowYearModal] = useState(false)
  const [showSectionModal, setShowSectionModal] = useState(false)

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
  const getYears = (): Year[] => {
    const course = getSelectedCourse()
    if (!course?.years) return []
    return course.years
  }

  // Get sections from selected year
  const getSections = (): Section[] => {
    const years = getYears()
    if (years.length === 0 || selectedYearIndex < 0 || selectedYearIndex >= years.length) return []
    return years[selectedYearIndex]?.sections || []
  }

  const handleCourseSelect = (index: number) => {
    setSelectedCourseIndex(index)
    setSelectedYearIndex(-1)
    setSelectedSectionIndex(-1)
    setStudents([])
    setAttendanceId(null)
    setShowCourseModal(false)
  }

  const handleYearSelect = (index: number) => {
    setSelectedYearIndex(index)
    setSelectedSectionIndex(-1)
    setStudents([])
    setAttendanceId(null)
    setShowYearModal(false)
  }

  const handleSectionSelect = (index: number) => {
    setSelectedSectionIndex(index)
    setStudents([])
    setAttendanceId(null)
    setShowSectionModal(false)
  }

  const clearSection = () => {
    setSelectedSectionIndex(-1)
    setStudents([])
    setAttendanceId(null)
  }

  const getStudentsForAttendance = async () => {
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
    setStudents([])
    setAttendanceId(null)

    const yearName = years[selectedYearIndex]?.name || ''
    const sections = getSections()
    const sectionName = selectedSectionIndex >= 0 ? sections[selectedSectionIndex]?.name : ''
    const encodedYear = encodeURIComponent(yearName)

    try {
      // 1. First try to get existing attendance for this date
      const attendanceUrl = `/v1/attendance/course/${course.id}/year/${encodedYear}?date=${selectedDate}${sectionName ? `&section=${sectionName}` : ''}`

      const attendanceRes = await api.get(attendanceUrl)
      const attendanceData = attendanceRes?.responseObject

      if (attendanceData?.id && attendanceData?.studentAttendance?.length > 0) {
        // Attendance already exists for this date
        setAttendanceId(attendanceData.id)
        setStudents(attendanceData.studentAttendance)
        setFetching(false)
        return
      }

      // 2. If no attendance, get student list
      const sectionParam = sectionName || yearName
      const studentUrl = `/v1/attendance/course/${course.id}/year/${encodedYear}/section/${encodeURIComponent(sectionParam)}?batchId=${batchId}`

      const studentRes = await api.get(studentUrl)
      const studentData = studentRes?.responseObject || []

      if (Array.isArray(studentData) && studentData.length > 0) {
        // Set all students as present by default
        const studentsWithAttendance = studentData.map((s: StudentAttendance) => ({
          ...s,
          present: s.present !== undefined ? s.present : true,
          remarks: s.remarks || '',
        }))
        setStudents(studentsWithAttendance)
      } else {
        Alert.alert('Info', 'No students found')
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch attendance data')
    }

    setFetching(false)
  }

  const toggleAttendance = (index: number, value: boolean) => {
    const updated = [...students]
    updated[index].present = value
    setStudents(updated)
  }

  const updateRemarks = (index: number, text: string) => {
    const updated = [...students]
    updated[index].remarks = text
    setStudents(updated)
  }

  const saveAttendance = async () => {
    const course = getSelectedCourse()
    const years = getYears()
    const sections = getSections()

    if (!course || selectedYearIndex < 0) {
      Alert.alert('Error', 'Please select course and year')
      return
    }

    if (students.length === 0) {
      Alert.alert('Error', 'No students to save')
      return
    }

    setSaving(true)

    const yearName = years[selectedYearIndex]?.name || ''
    const sectionName = selectedSectionIndex >= 0 ? sections[selectedSectionIndex]?.name : 'A'

    const payload: AttendancePayload = {
      batchId: batchId,
      courseId: course.id,
      courseName: course.name,
      year: yearName,
      section: sectionName,
      classId: course.id,
      grade: course.name,
      date: selectedDate,
      id: attendanceId,
      studentAttendance: students,
    }

    try {
      let res
      if (attendanceId) {
        // Update existing attendance
        res = await api.put('/v1/attendance', payload)
      } else {
        // Create new attendance
        res = await api.post('/v1/attendance', payload)
      }

      if (res) {
        Alert.alert(
          'Success',
          attendanceId ? 'Attendance updated successfully' : 'Attendance saved successfully',
        )
        // Reset form
        setStudents([])
        setAttendanceId(null)
        setSelectedCourseIndex(-1)
        setSelectedYearIndex(-1)
        setSelectedSectionIndex(-1)
      } else {
        Alert.alert('Error', 'Failed to save attendance')
      }
    } catch (error) {
      console.log('Error saving attendance:', error)
      Alert.alert('Error', 'Failed to save attendance')
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center, { backgroundColor }]}>
        <ActivityIndicator size="large" color={primaryColor} />
      </SafeAreaView>
    )
  }

  const selectedCourse = getSelectedCourse()
  const years = getYears()
  const sections = getSections()
  const selectedYear = selectedYearIndex >= 0 ? years[selectedYearIndex] : null
  const selectedSection = selectedSectionIndex >= 0 ? sections[selectedSectionIndex] : null

  const isSaveDisabled = students.length === 0 || selectedCourseIndex < 0 || selectedYearIndex < 0

  return (
    <SafeAreaView
      edges={{ top: 'off', bottom: 'additive' }}
      style={[styles.container, { backgroundColor }]}
    >
      {/* Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: cardBackground, borderBottomColor: borderColor }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'add' && { borderBottomColor: primaryColor, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveTab('add')}
        >
          <ThemedText
            style={[
              styles.tabText,
              { color: activeTab === 'add' ? primaryColor : mutedColor },
              activeTab === 'add' && styles.tabTextActive,
            ]}
          >
            Add / Edit
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'view' && { borderBottomColor: primaryColor, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveTab('view')}
        >
          <ThemedText
            style={[
              styles.tabText,
              { color: activeTab === 'view' ? primaryColor : mutedColor },
              activeTab === 'view' && styles.tabTextActive,
            ]}
          >
            View
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'report' && { borderBottomColor: primaryColor, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveTab('report')}
        >
          <ThemedText
            style={[
              styles.tabText,
              { color: activeTab === 'report' ? primaryColor : mutedColor },
              activeTab === 'report' && styles.tabTextActive,
            ]}
          >
            Register
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'view' ? (
        <ViewAttendance />
      ) : activeTab === 'report' ? (
        <StudentAttendanceReport />
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Filter Card */}
          <View style={[styles.card, { backgroundColor: cardBackground }]}>
            <ThemedText style={[styles.cardTitle, { color: textColor }]}>
              Add / Edit Attendance
            </ThemedText>

            {/* Course Dropdown */}
            <View style={styles.fieldContainer}>
              <ThemedText style={[styles.label, { color: textColor }]}>Course</ThemedText>
              <TouchableOpacity
                style={[styles.dropdown, { backgroundColor, borderColor }]}
                onPress={() => setShowCourseModal(true)}
              >
                <ThemedText
                  style={[styles.fieldText, { color: selectedCourse ? textColor : mutedColor }]}
                >
                  {selectedCourse?.name || 'Select Course'}
                </ThemedText>
                <ThemedText style={{ color: mutedColor }}>▼</ThemedText>
              </TouchableOpacity>
            </View>

            {/* Year Dropdown */}
            <View style={styles.fieldContainer}>
              <ThemedText style={[styles.label, { color: textColor }]}>Year</ThemedText>
              <TouchableOpacity
                style={[styles.dropdown, { backgroundColor, borderColor }]}
                onPress={() => setShowYearModal(true)}
                disabled={selectedCourseIndex < 0}
              >
                <ThemedText
                  style={[styles.fieldText, { color: selectedYear ? textColor : mutedColor }]}
                >
                  {selectedYear?.name || 'Select Year'}
                </ThemedText>
                <ThemedText style={{ color: mutedColor }}>▼</ThemedText>
              </TouchableOpacity>
            </View>

            {/* Section Dropdown with Clear */}
            <View style={styles.fieldContainer}>
              <ThemedText style={[styles.label, { color: textColor }]}>
                Section (Optional)
              </ThemedText>
              <View style={styles.sectionRow}>
                <TouchableOpacity
                  style={[styles.dropdown, styles.sectionDropdown, { backgroundColor, borderColor }]}
                  onPress={() => setShowSectionModal(true)}
                  disabled={selectedYearIndex < 0}
                >
                  <ThemedText
                    style={[styles.fieldText, { color: selectedSection ? textColor : mutedColor }]}
                  >
                    {selectedSection?.name || 'Select Section'}
                  </ThemedText>
                  <ThemedText style={{ color: mutedColor }}>▼</ThemedText>
                </TouchableOpacity>
                {selectedSectionIndex >= 0 && (
                  <TouchableOpacity
                    style={[styles.clearButton, { borderColor }]}
                    onPress={clearSection}
                  >
                    <ThemedText style={[styles.clearButtonText, { color: mutedColor }]}>
                      ✕
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Date Input */}
            <View style={styles.fieldContainer}>
              <ThemedText style={[styles.label, { color: textColor }]}>Date</ThemedText>
              <TextInput
                style={[styles.textInput, { backgroundColor, borderColor, color: textColor }]}
                value={selectedDate}
                onChangeText={setSelectedDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={mutedColor}
              />
            </View>

            {/* View Button */}
            <TouchableOpacity
              style={[styles.button, { backgroundColor: primaryColor }]}
              onPress={getStudentsForAttendance}
              disabled={fetching}
            >
              {fetching ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.buttonText}>View</ThemedText>
              )}
            </TouchableOpacity>
          </View>

          {/* Student List */}
          {students.length > 0 && (
            <View style={[styles.card, { backgroundColor: cardBackground }]}>
              {/* Table Header */}
              <View style={[styles.tableHeader, { borderBottomColor: borderColor }]}>
                <ThemedText style={[styles.tableHeaderCell, { color: textColor, flex: 0.5 }]}>
                  #
                </ThemedText>
                <ThemedText style={[styles.tableHeaderCell, { color: textColor, flex: 1.5 }]}>
                  Student
                </ThemedText>
                <ThemedText style={[styles.tableHeaderCell, { color: textColor, flex: 1.5 }]}>
                  Status
                </ThemedText>
                <ThemedText style={[styles.tableHeaderCell, { color: textColor, flex: 1 }]}>
                  Remarks
                </ThemedText>
              </View>

              {/* Student Rows */}
              {students.map((student, index) => (
                <View
                  key={`student-${index}`}
                  style={[styles.tableRow, { borderBottomColor: borderColor }]}
                >
                  <ThemedText style={[styles.tableCell, { color: mutedColor, flex: 0.5 }]}>
                    {student.rollNumber || index + 1}
                  </ThemedText>
                  <View style={{ flex: 1.5 }}>
                    <ThemedText style={[styles.studentName, { color: textColor }]}>
                      {student.studentName}
                    </ThemedText>
                    <ThemedText style={[styles.fatherName, { color: mutedColor }]}>
                      {student.fatherName}
                    </ThemedText>
                  </View>
                  <View style={[styles.attendanceToggle, { flex: 1.5 }]}>
                    <TouchableOpacity
                      style={[
                        styles.toggleButton,
                        { borderColor: '#10b981' },
                        student.present && { backgroundColor: '#10b981' },
                      ]}
                      onPress={() => toggleAttendance(index, true)}
                    >
                      <ThemedText
                        style={[styles.toggleText, { color: student.present ? '#fff' : '#10b981' }]}
                      >
                        P
                      </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.toggleButton,
                        { borderColor: '#ef4444' },
                        !student.present && { backgroundColor: '#ef4444' },
                      ]}
                      onPress={() => toggleAttendance(index, false)}
                    >
                      <ThemedText
                        style={[styles.toggleText, { color: !student.present ? '#fff' : '#ef4444' }]}
                      >
                        A
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={[
                      styles.remarksInput,
                      { borderColor, color: textColor, backgroundColor, flex: 1 },
                    ]}
                    value={student.remarks || ''}
                    onChangeText={text => updateRemarks(index, text)}
                    placeholder="..."
                    placeholderTextColor={mutedColor}
                  />
                </View>
              ))}

              {/* Save Button */}
              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: primaryColor, marginTop: 16 },
                  isSaveDisabled && styles.buttonDisabled,
                ]}
                onPress={saveAttendance}
                disabled={saving || isSaveDisabled}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={styles.buttonText}>Save Attendance</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
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
                  key={`course-${index}`}
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
                  key={`year-${index}`}
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
            <ThemedText style={[styles.modalTitle, { color: textColor }]}>
              Select Section
            </ThemedText>
            <ScrollView>
              {sections.length > 0 ? (
                sections.map((section, index) => (
                  <TouchableOpacity
                    key={`section-${index}`}
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
                        selectedSectionIndex === index && {
                          color: primaryColor,
                          fontWeight: '600',
                        },
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
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
  },
  tabTextActive: {
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
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
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
  },
  button: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  attendanceToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  remarksInput: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    fontSize: 12,
    minWidth: 60,
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
  noDataText: {
    padding: 16,
    textAlign: 'center',
  },
})
