import { ThemedText } from '@/components/ThemedText'
import { useThemeColor } from '@/hooks/useThemeColor'
import { api } from '@/services/axios'
import { storage } from '@/services/storage'
import { uploadAssignmentAttachment } from '@/services/account'
import { Course, HomeworkItem, HomeworkPayload, Section, Year } from '@/types/assignment'
import * as DocumentPicker from 'expo-document-picker'
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

// Report item for table
interface ReportItem {
  subjectName: string
  homework: string
  date: string
}

export default function AssignmentsScreen() {
  const backgroundColor = useThemeColor({}, 'secondary')
  const primaryColor = useThemeColor({}, 'primary')
  const cardBackground = useThemeColor({}, 'card')
  const textColor = useThemeColor({}, 'text')
  const mutedColor = useThemeColor({}, 'muted')
  const borderColor = useThemeColor({}, 'border')

  // Tab state
  const [activeTab, setActiveTab] = useState<'create' | 'report'>('create')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Data
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseIndex, setSelectedCourseIndex] = useState(0)
  const [selectedYearIndex, setSelectedYearIndex] = useState(0)
  const [selectedSectionIndex, setSelectedSectionIndex] = useState(0)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  // Homework entries for create
  const [homeworkList, setHomeworkList] = useState<HomeworkItem[]>([])

  // Report tab state
  const [reportCourseIndex, setReportCourseIndex] = useState(0)
  const [reportYearIndex, setReportYearIndex] = useState(0)
  const [reportSectionIndex, setReportSectionIndex] = useState(0)
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [reportData, setReportData] = useState<ReportItem[]>([])
  const [fetchingReport, setFetchingReport] = useState(false)

  // Modals
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [showYearModal, setShowYearModal] = useState(false)
  const [showSectionModal, setShowSectionModal] = useState(false)

  // Report modals
  const [showReportCourseModal, setShowReportCourseModal] = useState(false)
  const [showReportYearModal, setShowReportYearModal] = useState(false)
  const [showReportSectionModal, setShowReportSectionModal] = useState(false)

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    try {
      const userData = await storage.getUserData()
      const batchId = userData?.runningBatchId
      if (!batchId) {
        setLoading(false)
        Alert.alert('Error', 'No batch found in user data')
        return
      }

      const res = await api.get(`/v1/course/batch/${batchId}`)
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

  // ===== CREATE TAB FUNCTIONS =====
  const getSelectedCourse = (): Course | null => {
    if (courses.length === 0 || selectedCourseIndex >= courses.length) return null
    return courses[selectedCourseIndex]
  }

  const getYears = (): Year[] => {
    const course = getSelectedCourse()
    if (!course?.years) return []
    return course.years
  }

  const getSections = (): Section[] => {
    const years = getYears()
    if (years.length === 0 || selectedYearIndex >= years.length) return []
    return years[selectedYearIndex]?.sections || []
  }

  const getSubjects = () => {
    const years = getYears()
    if (years.length === 0 || selectedYearIndex >= years.length) return []
    return years[selectedYearIndex]?.subjects || []
  }

  const handleCourseSelect = (index: number) => {
    setSelectedCourseIndex(index)
    setSelectedYearIndex(0)
    setSelectedSectionIndex(0)
    setHomeworkList([])
    setShowCourseModal(false)
  }

  const handleYearSelect = (index: number) => {
    setSelectedYearIndex(index)
    setSelectedSectionIndex(0)
    setHomeworkList([])
    setShowYearModal(false)
  }

  const handleSectionSelect = (index: number) => {
    setSelectedSectionIndex(index)
    setHomeworkList([])
    setShowSectionModal(false)
  }

  const handleGetSubjects = () => {
    const subjects = getSubjects()
    if (subjects.length === 0) {
      Alert.alert('Info', 'No subjects found for this year')
      return
    }

    const list: HomeworkItem[] = subjects.map(sub => ({
      subjectName: sub.name,
      homework: '',
      attachmentUrls: [],
    }))
    setHomeworkList(list)
  }

  const updateHomework = (index: number, text: string) => {
    const updated = [...homeworkList]
    updated[index].homework = text
    setHomeworkList(updated)
  }

  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)

  const addAttachment = async (index: number) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      })
      if (result.canceled) return
      const file = result.assets[0]
      setUploadingIndex(index)
      const url = await uploadAssignmentAttachment({
        uri: file.uri,
        name: file.name || 'attachment',
        type: file.mimeType || 'application/octet-stream',
      })
      setUploadingIndex(null)
      if (url) {
        const updated = [...homeworkList]
        const urls = updated[index].attachmentUrls ?? []
        updated[index] = { ...updated[index], attachmentUrls: [...urls, url] }
        setHomeworkList(updated)
      } else {
        Alert.alert('Error', 'Failed to upload file')
      }
    } catch (e) {
      setUploadingIndex(null)
      console.error(e)
      Alert.alert('Error', 'Failed to upload file')
    }
  }

  const removeAttachment = (index: number, urlIndex: number) => {
    const updated = [...homeworkList]
    const urls = [...(updated[index].attachmentUrls ?? [])]
    urls.splice(urlIndex, 1)
    updated[index] = { ...updated[index], attachmentUrls: urls }
    setHomeworkList(updated)
  }

  const resetCreateForm = () => {
    setSelectedCourseIndex(0)
    setSelectedYearIndex(0)
    setSelectedSectionIndex(0)
    setSelectedDate(new Date().toISOString().split('T')[0])
    setHomeworkList([])
  }

  const saveAssignment = async () => {
    const course = getSelectedCourse()
    const years = getYears()
    const sections = getSections()

    if (!course || years.length === 0) {
      Alert.alert('Error', 'Please select course and year')
      return
    }

    const filledList = homeworkList.filter(h => h.homework.trim() !== '')
    if (filledList.length === 0) {
      Alert.alert('Error', 'Please enter at least one assignment')
      return
    }

    setSaving(true)

    const yearName = years[selectedYearIndex]?.name || ''
    const sectionName = sections[selectedSectionIndex]?.name || 'A'

    const payload: HomeworkPayload = {
      date: selectedDate,
      courseId: course.id,
      year: yearName,
      section: sectionName,
      courseName: course.name,
      classId: course.id,
      grade: course.name,
      id: null,
      published: false,
      subjectHomeworkList: filledList.map(h => ({
        subjectName: h.subjectName,
        homework: h.homework,
        attachmentUrls: h.attachmentUrls?.length ? h.attachmentUrls : undefined,
      })),
    }

    const res = await api.post('/v1/homework', payload)
    if (res) {
      Alert.alert('Success', 'Assignment saved successfully')
      resetCreateForm()
    } else {
      Alert.alert('Error', 'Failed to save assignment')
    }
    setSaving(false)
  }

  // ===== REPORT TAB FUNCTIONS =====
  const getReportCourse = (): Course | null => {
    if (courses.length === 0 || reportCourseIndex >= courses.length) return null
    return courses[reportCourseIndex]
  }

  const getReportYears = (): Year[] => {
    const course = getReportCourse()
    if (!course?.years) return []
    return course.years
  }

  const getReportSections = (): Section[] => {
    const years = getReportYears()
    if (years.length === 0 || reportYearIndex >= years.length) return []
    return years[reportYearIndex]?.sections || []
  }

  const handleReportCourseSelect = (index: number) => {
    setReportCourseIndex(index)
    setReportYearIndex(0)
    setReportSectionIndex(0)
    setReportData([])
    setShowReportCourseModal(false)
  }

  const handleReportYearSelect = (index: number) => {
    setReportYearIndex(index)
    setReportSectionIndex(0)
    setReportData([])
    setShowReportYearModal(false)
  }

  const handleReportSectionSelect = (index: number) => {
    setReportSectionIndex(index)
    setReportData([])
    setShowReportSectionModal(false)
  }

  const fetchHomeworkReport = async () => {
    const course = getReportCourse()
    const years = getReportYears()
    const sections = getReportSections()

    if (!course) {
      Alert.alert('Error', 'Please select a course')
      return
    }

    const yearName = years[reportYearIndex]?.name || ''
    if (!yearName) {
      Alert.alert('Error', 'Please select a year')
      return
    }

    setFetchingReport(true)
    setReportData([])

    const sectionName = sections[reportSectionIndex]?.name || ''
    const encodedYear = encodeURIComponent(yearName)

    // Build query params
    const params = new URLSearchParams()
    if (sectionName) params.append('section', sectionName)
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)

    try {
      // API: /v1/homework/course/{courseId}/year/{year}?section=A&startDate=...&endDate=...
      const url = `/v1/homework/course/${course.id}/year/${encodedYear}?${params.toString()}`
      console.log('Fetching report:', url)

      const res = await api.get(url)
      const data = res?.responseObject || res || []

      console.log('Report response:', data)

      if (Array.isArray(data) && data.length > 0) {
        const items: ReportItem[] = []
        data.forEach((obj: any) => {
          if (obj.subjectHomeworkList && Array.isArray(obj.subjectHomeworkList)) {
            obj.subjectHomeworkList.forEach((hw: any) => {
              items.push({
                subjectName: hw.subjectName,
                homework: hw.homework || '---',
                date: obj.date,
              })
            })
          }
        })
        setReportData(items)

        if (items.length === 0) {
          Alert.alert('Info', 'No assignments found for the selected filters')
        }
      } else {
        Alert.alert('Info', 'No assignments found for the selected filters')
      }
    } catch (error) {
      console.log('Error fetching report:', error)
      Alert.alert('Error', 'Failed to fetch report')
    }

    setFetchingReport(false)
  }

  // ===== RENDER =====
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
  const selectedYear = years[selectedYearIndex]
  const selectedSection = sections[selectedSectionIndex]

  const reportCourse = getReportCourse()
  const reportYears = getReportYears()
  const reportSections = getReportSections()
  const reportYear = reportYears[reportYearIndex]
  const reportSection = reportSections[reportSectionIndex]

  return (
    <SafeAreaView edges={{ top: 'off', bottom: 'additive' }} style={[styles.container, { backgroundColor }]}>
      {/* Tab Header */}
      <View style={[styles.tabContainer, { backgroundColor: cardBackground }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'create' && { borderBottomColor: primaryColor, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('create')}
        >
          <ThemedText
            style={[styles.tabText, { color: activeTab === 'create' ? primaryColor : mutedColor }]}
          >
            Create Assignment
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'report' && { borderBottomColor: primaryColor, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('report')}
        >
          <ThemedText
            style={[styles.tabText, { color: activeTab === 'report' ? primaryColor : mutedColor }]}
          >
            View Report
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* CREATE TAB */}
      {activeTab === 'create' && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.card, { backgroundColor: cardBackground }]}>
            {/* Course Dropdown */}
            <View style={styles.fieldContainer}>
              <ThemedText style={[styles.label, { color: textColor }]}>Course</ThemedText>
              <TouchableOpacity
                style={[styles.dropdown, { backgroundColor, borderColor }]}
                onPress={() => setShowCourseModal(true)}
              >
                <ThemedText style={[styles.fieldText, { color: textColor }]}>
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
              >
                <ThemedText style={[styles.fieldText, { color: textColor }]}>
                  {selectedYear?.name || 'Select Year'}
                </ThemedText>
                <ThemedText style={{ color: mutedColor }}>▼</ThemedText>
              </TouchableOpacity>
            </View>

            {/* Section Dropdown */}
            <View style={styles.fieldContainer}>
              <ThemedText style={[styles.label, { color: textColor }]}>Section (Optional)</ThemedText>
              <TouchableOpacity
                style={[styles.dropdown, { backgroundColor, borderColor }]}
                onPress={() => setShowSectionModal(true)}
              >
                <ThemedText style={[styles.fieldText, { color: textColor }]}>
                  {selectedSection?.name || 'Select Section'}
                </ThemedText>
                <ThemedText style={{ color: mutedColor }}>▼</ThemedText>
              </TouchableOpacity>
            </View>

            {/* Date Input */}
            <View style={styles.fieldContainer}>
              <ThemedText style={[styles.label, { color: textColor }]}>Assign Date</ThemedText>
              <TextInput
                style={[styles.textInput, { backgroundColor, borderColor, color: textColor }]}
                value={selectedDate}
                onChangeText={setSelectedDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={mutedColor}
              />
            </View>

            {/* Get Subjects Button */}
            <TouchableOpacity
              style={[styles.button, { backgroundColor: primaryColor }]}
              onPress={handleGetSubjects}
            >
              <ThemedText style={styles.buttonText}>Get Subjects</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Subjects & Homework */}
          {homeworkList.length > 0 && (
            <View style={[styles.card, { backgroundColor: cardBackground }]}>
              <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                Subjects & Assignments
              </ThemedText>

              {homeworkList.map((item, index) => (
                <View key={`subject-${index}`} style={[styles.subjectItem, { borderTopColor: borderColor }]}>
                  <ThemedText style={[styles.subjectName, { color: textColor }]}>
                    {item.subjectName}
                  </ThemedText>
                  <TextInput
                    style={[styles.homeworkInput, { backgroundColor, borderColor, color: textColor }]}
                    value={item.homework}
                    onChangeText={text => updateHomework(index, text)}
                    placeholder="Enter assignment details..."
                    placeholderTextColor={mutedColor}
                    multiline
                  />
                  <View style={styles.attachmentRow}>
                    <TouchableOpacity
                      style={[styles.attachButton, { backgroundColor: primaryColor + '20', borderColor: primaryColor }]}
                      onPress={() => addAttachment(index)}
                      disabled={uploadingIndex !== null}
                    >
                      {uploadingIndex === index ? (
                        <ActivityIndicator size="small" color={primaryColor} />
                      ) : (
                        <ThemedText style={[styles.attachButtonText, { color: primaryColor }]}>
                          + Add image or PDF
                        </ThemedText>
                      )}
                    </TouchableOpacity>
                    {(item.attachmentUrls?.length ?? 0) > 0 && (
                      <View style={styles.attachmentChips}>
                        {(item.attachmentUrls ?? []).map((url, urlIndex) => {
                          const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/i.test(url) || url.includes('image')
                          const label = isImage ? 'Image' : 'PDF'
                          return (
                            <View key={urlIndex} style={[styles.attachmentChip, { backgroundColor: cardBackground, borderColor }]}>
                              <ThemedText style={[styles.attachmentChipText, { color: textColor }]} numberOfLines={1}>
                                {label} {urlIndex + 1}
                              </ThemedText>
                              <TouchableOpacity
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                onPress={() => removeAttachment(index, urlIndex)}
                              >
                                <ThemedText style={{ color: mutedColor, fontSize: 14 }}>✕</ThemedText>
                              </TouchableOpacity>
                            </View>
                          )
                        })}
                      </View>
                    )}
                  </View>
                </View>
              ))}

              <TouchableOpacity
                style={[styles.button, { backgroundColor: primaryColor }]}
                onPress={saveAssignment}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={styles.buttonText}>Save Assignment</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      {/* REPORT TAB */}
      {activeTab === 'report' && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.card, { backgroundColor: cardBackground }]}>
            {/* Course Dropdown */}
            <View style={styles.fieldContainer}>
              <ThemedText style={[styles.label, { color: textColor }]}>Course</ThemedText>
              <TouchableOpacity
                style={[styles.dropdown, { backgroundColor, borderColor }]}
                onPress={() => setShowReportCourseModal(true)}
              >
                <ThemedText style={[styles.fieldText, { color: textColor }]}>
                  {reportCourse?.name || 'Select Course'}
                </ThemedText>
                <ThemedText style={{ color: mutedColor }}>▼</ThemedText>
              </TouchableOpacity>
            </View>

            {/* Year Dropdown */}
            <View style={styles.fieldContainer}>
              <ThemedText style={[styles.label, { color: textColor }]}>Year</ThemedText>
              <TouchableOpacity
                style={[styles.dropdown, { backgroundColor, borderColor }]}
                onPress={() => setShowReportYearModal(true)}
              >
                <ThemedText style={[styles.fieldText, { color: textColor }]}>
                  {reportYear?.name || 'Select Year'}
                </ThemedText>
                <ThemedText style={{ color: mutedColor }}>▼</ThemedText>
              </TouchableOpacity>
            </View>

            {/* Section Dropdown */}
            <View style={styles.fieldContainer}>
              <ThemedText style={[styles.label, { color: textColor }]}>Section (Optional)</ThemedText>
              <TouchableOpacity
                style={[styles.dropdown, { backgroundColor, borderColor }]}
                onPress={() => setShowReportSectionModal(true)}
              >
                <ThemedText style={[styles.fieldText, { color: textColor }]}>
                  {reportSection?.name || 'Select Section'}
                </ThemedText>
                <ThemedText style={{ color: mutedColor }}>▼</ThemedText>
              </TouchableOpacity>
            </View>

            {/* Date Range */}
            <View style={styles.row}>
              <View style={[styles.fieldContainer, { flex: 1, marginRight: 8 }]}>
                <ThemedText style={[styles.label, { color: textColor }]}>Start Date</ThemedText>
                <TextInput
                  style={[styles.textInput, { backgroundColor, borderColor, color: textColor }]}
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={mutedColor}
                />
              </View>
              <View style={[styles.fieldContainer, { flex: 1, marginLeft: 8 }]}>
                <ThemedText style={[styles.label, { color: textColor }]}>End Date</ThemedText>
                <TextInput
                  style={[styles.textInput, { backgroundColor, borderColor, color: textColor }]}
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={mutedColor}
                />
              </View>
            </View>

            {/* View Button */}
            <TouchableOpacity
              style={[styles.button, { backgroundColor: primaryColor }]}
              onPress={fetchHomeworkReport}
              disabled={fetchingReport}
            >
              {fetchingReport ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.buttonText}>View Report</ThemedText>
              )}
            </TouchableOpacity>
          </View>

          {/* Report Table */}
          {reportData.length > 0 && (
            <View style={[styles.card, { backgroundColor: cardBackground }]}>
              <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                Assignment Report
              </ThemedText>

              {/* Table Header */}
              <View style={[styles.tableHeader, { borderBottomColor: borderColor }]}>
                <ThemedText style={[styles.tableHeaderCell, { color: textColor, flex: 1 }]}>
                  Subject
                </ThemedText>
                <ThemedText style={[styles.tableHeaderCell, { color: textColor, flex: 2 }]}>
                  Assignment
                </ThemedText>
                <ThemedText style={[styles.tableHeaderCell, { color: textColor, flex: 1 }]}>
                  Date
                </ThemedText>
              </View>

              {/* Table Rows */}
              {reportData.map((item, index) => (
                <View
                  key={`report-${index}`}
                  style={[styles.tableRow, { borderBottomColor: borderColor }]}
                >
                  <ThemedText style={[styles.tableCell, { color: textColor, flex: 1 }]}>
                    {item.subjectName}
                  </ThemedText>
                  <ThemedText style={[styles.tableCell, { color: mutedColor, flex: 2 }]}>
                    {item.homework}
                  </ThemedText>
                  <ThemedText style={[styles.tableCell, { color: mutedColor, flex: 1 }]}>
                    {item.date}
                  </ThemedText>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* CREATE TAB MODALS */}
      <Modal visible={showCourseModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCourseModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: cardBackground }]}>
            <ThemedText style={[styles.modalTitle, { color: textColor }]}>Select Course</ThemedText>
            <ScrollView>
              {courses.map((course, index) => (
                <TouchableOpacity
                  key={`course-${index}`}
                  style={[styles.modalOption, { borderBottomColor: borderColor }, selectedCourseIndex === index && { backgroundColor: primaryColor + '20' }]}
                  onPress={() => handleCourseSelect(index)}
                >
                  <ThemedText style={[styles.modalOptionText, { color: textColor }, selectedCourseIndex === index && { color: primaryColor, fontWeight: '600' }]}>
                    {course.name}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showYearModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowYearModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: cardBackground }]}>
            <ThemedText style={[styles.modalTitle, { color: textColor }]}>Select Year</ThemedText>
            <ScrollView>
              {years.map((year, index) => (
                <TouchableOpacity
                  key={`year-${index}`}
                  style={[styles.modalOption, { borderBottomColor: borderColor }, selectedYearIndex === index && { backgroundColor: primaryColor + '20' }]}
                  onPress={() => handleYearSelect(index)}
                >
                  <ThemedText style={[styles.modalOptionText, { color: textColor }, selectedYearIndex === index && { color: primaryColor, fontWeight: '600' }]}>
                    {year.name}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showSectionModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowSectionModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: cardBackground }]}>
            <ThemedText style={[styles.modalTitle, { color: textColor }]}>Select Section</ThemedText>
            <ScrollView>
              {sections.length > 0 ? (
                sections.map((section, index) => (
                  <TouchableOpacity
                    key={`section-${index}`}
                    style={[styles.modalOption, { borderBottomColor: borderColor }, selectedSectionIndex === index && { backgroundColor: primaryColor + '20' }]}
                    onPress={() => handleSectionSelect(index)}
                  >
                    <ThemedText style={[styles.modalOptionText, { color: textColor }, selectedSectionIndex === index && { color: primaryColor, fontWeight: '600' }]}>
                      {section.name}
                    </ThemedText>
                  </TouchableOpacity>
                ))
              ) : (
                <ThemedText style={[styles.noDataText, { color: mutedColor }]}>No sections available</ThemedText>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* REPORT TAB MODALS */}
      <Modal visible={showReportCourseModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowReportCourseModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: cardBackground }]}>
            <ThemedText style={[styles.modalTitle, { color: textColor }]}>Select Course</ThemedText>
            <ScrollView>
              {courses.map((course, index) => (
                <TouchableOpacity
                  key={`rcourse-${index}`}
                  style={[styles.modalOption, { borderBottomColor: borderColor }, reportCourseIndex === index && { backgroundColor: primaryColor + '20' }]}
                  onPress={() => handleReportCourseSelect(index)}
                >
                  <ThemedText style={[styles.modalOptionText, { color: textColor }, reportCourseIndex === index && { color: primaryColor, fontWeight: '600' }]}>
                    {course.name}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showReportYearModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowReportYearModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: cardBackground }]}>
            <ThemedText style={[styles.modalTitle, { color: textColor }]}>Select Year</ThemedText>
            <ScrollView>
              {reportYears.map((year, index) => (
                <TouchableOpacity
                  key={`ryear-${index}`}
                  style={[styles.modalOption, { borderBottomColor: borderColor }, reportYearIndex === index && { backgroundColor: primaryColor + '20' }]}
                  onPress={() => handleReportYearSelect(index)}
                >
                  <ThemedText style={[styles.modalOptionText, { color: textColor }, reportYearIndex === index && { color: primaryColor, fontWeight: '600' }]}>
                    {year.name}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showReportSectionModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowReportSectionModal(false)}>
          <View style={[styles.modalContent, { backgroundColor: cardBackground }]}>
            <ThemedText style={[styles.modalTitle, { color: textColor }]}>Select Section</ThemedText>
            <ScrollView>
              {reportSections.length > 0 ? (
                reportSections.map((section, index) => (
                  <TouchableOpacity
                    key={`rsection-${index}`}
                    style={[styles.modalOption, { borderBottomColor: borderColor }, reportSectionIndex === index && { backgroundColor: primaryColor + '20' }]}
                    onPress={() => handleReportSectionSelect(index)}
                  >
                    <ThemedText style={[styles.modalOptionText, { color: textColor }, reportSectionIndex === index && { color: primaryColor, fontWeight: '600' }]}>
                      {section.name}
                    </ThemedText>
                  </TouchableOpacity>
                ))
              ) : (
                <ThemedText style={[styles.noDataText, { color: mutedColor }]}>No sections available</ThemedText>
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
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
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
  fieldText: {
    fontSize: 16,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  subjectItem: {
    paddingTop: 16,
    borderTopWidth: 1,
    marginBottom: 16,
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 8,
  },
  homeworkInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  attachmentRow: {
    marginTop: 8,
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  attachButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  attachmentChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  attachmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: '100%',
  },
  attachmentChipText: {
    fontSize: 12,
    maxWidth: 120,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 2,
  },
  tableHeaderCell: {
    fontSize: 14,
    fontWeight: '600',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  tableCell: {
    fontSize: 14,
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
