import { ThemedText } from '@/components/ThemedText'
import { IconSymbol } from '@/components/ui/IconSymbol'
// Commented out - complex components not needed for simple view
// import { ChapterForm, ContentForm, ContentTreeView, SectionForm } from '@/components/econtent'
import { useThemeColor } from '@/hooks/useThemeColor'
import {
  ContentStatus,
  ContentType,
  EContent,
  getAllEContent,
  uploadEContent,
  SubjectByCourseOption,
} from '@/services/eContentApi'
import { api } from '@/services/axios'
import { storage } from '@/services/storage'
import { Course, Year } from '@/types/assignment'
import * as DocumentPicker from 'expo-document-picker'
import * as Linking from 'expo-linking'
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

export default function EContentScreen() {
  // Theme colors
  const backgroundColor = useThemeColor({}, 'secondary')
  const primaryColor = useThemeColor({}, 'primary')
  const cardBackground = useThemeColor({}, 'card')
  const textColor = useThemeColor({}, 'text')
  const mutedColor = useThemeColor({}, 'muted')
  const borderColor = useThemeColor({}, 'border')
  const errorColor = useThemeColor({}, 'error')
  const successColor = useThemeColor({}, 'success')

  // Loading states
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [fetching, setFetching] = useState(false)

  // Data
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseIndex, setSelectedCourseIndex] = useState(0)
  const [selectedYearIndex, setSelectedYearIndex] = useState(0)

  // Subjects for upload
  const [subjects, setSubjects] = useState<SubjectByCourseOption[]>([])
  const [selectedSubjectIndex, setSelectedSubjectIndex] = useState(0)
  const [loadingSubjects, setLoadingSubjects] = useState(false)

  // Content data
  const [contentList, setContentList] = useState<EContent[]>([])

  // Upload form
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedFile, setSelectedFile] = useState<{
    uri: string
    name: string
    type: string
  } | null>(null)

  // Modals
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [showYearModal, setShowYearModal] = useState(false)
  const [showSubjectModal, setShowSubjectModal] = useState(false)

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
        // Load subjects for the first course and year
        if (courseList[0]?.years?.length > 0) {
          const firstCourse = courseList[0]
          const firstYear = firstCourse.years[0]
          setLoadingSubjects(true)
          try {
            const subjectRes = await api.get(
              `/v1/subject/course/${firstCourse.id}/year/${firstYear.name}`,
            )
            const subjectList = subjectRes?.responseObject || []
            setSubjects(subjectList)
          } catch (error) {
            console.log('Error loading initial subjects:', error)
          }
          setLoadingSubjects(false)
        }
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
    if (courses.length === 0 || selectedCourseIndex >= courses.length) return null
    return courses[selectedCourseIndex]
  }

  // Get years from selected course
  const getYears = (): Year[] => {
    const course = getSelectedCourse()
    if (!course?.years) return []
    return course.years
  }

  // Load subjects based on selected course and year
  const loadSubjects = async (courseIndex: number, yearIndex: number) => {
    const course = courses[courseIndex]
    if (!course?.years || course.years.length === 0) {
      setSubjects([])
      setSelectedSubjectIndex(0)
      return
    }

    const year = course.years[yearIndex]
    if (!year?.name) {
      setSubjects([])
      setSelectedSubjectIndex(0)
      return
    }

    setLoadingSubjects(true)
    try {
      const res = await api.get(`/v1/subject/course/${course.id}/year/${year.name}`)
      const subjectList = res?.responseObject || []
      setSubjects(subjectList)
      setSelectedSubjectIndex(0)
    } catch (error) {
      console.log('Error loading subjects:', error)
      setSubjects([])
    }
    setLoadingSubjects(false)
  }

  const handleCourseSelect = (index: number) => {
    setSelectedCourseIndex(index)
    setSelectedYearIndex(0)
    setContentList([])
    setSubjects([])
    setSelectedSubjectIndex(0)
    setShowCourseModal(false)
    // Load subjects for the new course
    loadSubjects(index, 0)
  }

  const handleYearSelect = (index: number) => {
    setSelectedYearIndex(index)
    setContentList([])
    setSubjects([])
    setSelectedSubjectIndex(0)
    setShowYearModal(false)
    // Load subjects for the new year
    loadSubjects(selectedCourseIndex, index)
  }

  const handleSubjectSelect = (index: number) => {
    setSelectedSubjectIndex(index)
    setShowSubjectModal(false)
  }

  // Pick file
  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0]
        setSelectedFile({
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'application/octet-stream',
        })
      }
    } catch (error) {
      console.log('Error picking file:', error)
      Alert.alert('Error', 'Failed to pick file')
    }
  }

  // Upload content
  const handleUpload = async () => {
    const course = getSelectedCourse()

    if (!course) {
      Alert.alert('Error', 'Please select a course')
      return
    }

    if (subjects.length === 0) {
      Alert.alert('Error', 'No subjects available. Please select a course and year first.')
      return
    }

    const selectedSubject = subjects[selectedSubjectIndex]
    if (!selectedSubject) {
      Alert.alert('Error', 'Please select a subject')
      return
    }

    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title')
      return
    }

    if (!selectedFile) {
      Alert.alert('Error', 'Please select a file')
      return
    }

    setUploading(true)

    try {
      const response = await uploadEContent(selectedFile, {
        classId: course.id,
        className: course.name,
        subjectId: selectedSubject.id,
        subjectName: selectedSubject.name,
        title: title.trim(),
        description: description.trim() || undefined,
        contentType: ContentType.DOCUMENT,
        status: ContentStatus.PUBLISHED,
      })

      if (response?.responseObject) {
        Alert.alert('Success', 'Content uploaded successfully')
        resetForm()
        fetchContent()
      } else {
        Alert.alert('Error', 'Failed to upload content')
      }
    } catch (error) {
      console.log('Upload error:', error)
      Alert.alert('Error', 'Failed to upload content')
    }

    setUploading(false)
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setSelectedFile(null)
  }

  // Fetch content list
  const fetchContent = async () => {
    const course = getSelectedCourse()
    if (!course) {
      Alert.alert('Info', 'Please select a course first')
      return
    }

    setFetching(true)
    setContentList([])

    try {
      const response = await getAllEContent({
        classId: course.id,
        page: 0,
        limit: 50,
      })

      if (response?.responseObject?.content) {
        setContentList(response.responseObject.content)
        if (response.responseObject.content.length === 0) {
          Alert.alert('Info', 'No content found for this course')
        }
      } else {
        setContentList([])
      }
    } catch (error) {
      console.log('Fetch error:', error)
      Alert.alert('Error', 'Failed to fetch content')
    }

    setFetching(false)
  }

  // View content
  const handleViewContent = (item: EContent) => {
    if (item.fileUrl || item.contentUrl) {
      Linking.openURL(item.fileUrl || item.contentUrl || '')
    } else {
      Alert.alert('Info', 'No file URL available')
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
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
  const selectedYear = years[selectedYearIndex]

  return (
    <SafeAreaView
      edges={{ top: 'off', bottom: 'additive' }}
      style={[styles.container, { backgroundColor }]}
    >
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Filter Card */}
        <View style={[styles.card, { backgroundColor: cardBackground }]}>
          <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
            Select Course, Year & Subject
          </ThemedText>

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

          {/* Subject Dropdown */}
          <View style={styles.fieldContainer}>
            <ThemedText style={[styles.label, { color: textColor }]}>Subject *</ThemedText>
            <TouchableOpacity
              style={[styles.dropdown, { backgroundColor, borderColor }]}
              onPress={() => setShowSubjectModal(true)}
              disabled={loadingSubjects || subjects.length === 0}
            >
              {loadingSubjects ? (
                <ActivityIndicator size="small" color={primaryColor} />
              ) : (
                <ThemedText
                  style={[
                    styles.fieldText,
                    { color: subjects.length > 0 ? textColor : mutedColor },
                  ]}
                >
                  {subjects.length > 0
                    ? subjects[selectedSubjectIndex]?.name || 'Select Subject'
                    : 'Select Course & Year first'}
                </ThemedText>
              )}
              <ThemedText style={{ color: mutedColor }}>▼</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Upload Card */}
        <View style={[styles.card, { backgroundColor: cardBackground }]}>
          <ThemedText style={[styles.sectionTitle, { color: textColor }]}>Upload Content</ThemedText>

          {/* Title */}
          <View style={styles.fieldContainer}>
            <ThemedText style={[styles.label, { color: textColor }]}>Title *</ThemedText>
            <TextInput
              style={[styles.textInput, { backgroundColor, borderColor, color: textColor }]}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter content title"
              placeholderTextColor={mutedColor}
            />
          </View>

          {/* Description */}
          <View style={styles.fieldContainer}>
            <ThemedText style={[styles.label, { color: textColor }]}>
              Description (Optional)
            </ThemedText>
            <TextInput
              style={[
                styles.textInput,
                styles.textArea,
                { backgroundColor, borderColor, color: textColor },
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter description"
              placeholderTextColor={mutedColor}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* File Picker */}
          <View style={styles.fieldContainer}>
            <ThemedText style={[styles.label, { color: textColor }]}>File *</ThemedText>
            <TouchableOpacity
              style={[styles.filePicker, { backgroundColor, borderColor }]}
              onPress={handlePickFile}
            >
              <IconSymbol name="doc.fill" size={24} color={primaryColor} />
              <ThemedText
                style={[styles.filePickerText, { color: selectedFile ? textColor : mutedColor }]}
              >
                {selectedFile ? selectedFile.name : 'Tap to select file'}
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Upload Button */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: primaryColor }]}
            onPress={handleUpload}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.buttonText}>Upload Content</ThemedText>
            )}
          </TouchableOpacity>
        </View>

        {/* View Content Card */}
        <View style={[styles.card, { backgroundColor: cardBackground }]}>
          <View style={styles.cardHeader}>
            <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
              View Content
            </ThemedText>
            <TouchableOpacity
              style={[styles.fetchButton, { backgroundColor: primaryColor }]}
              onPress={fetchContent}
              disabled={fetching}
            >
              {fetching ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <ThemedText style={styles.fetchButtonText}>Fetch</ThemedText>
              )}
            </TouchableOpacity>
          </View>

          {/* Content Table */}
          {contentList.length > 0 && (
            <View style={styles.tableContainer}>
              {/* Table Header */}
              <View style={[styles.tableHeader, { borderBottomColor: borderColor }]}>
                <ThemedText style={[styles.tableHeaderCell, styles.cellTitle, { color: textColor }]}>
                  Title
                </ThemedText>
                <ThemedText style={[styles.tableHeaderCell, styles.cellType, { color: textColor }]}>
                  Type
                </ThemedText>
                <ThemedText style={[styles.tableHeaderCell, styles.cellDate, { color: textColor }]}>
                  Date
                </ThemedText>
                <ThemedText
                  style={[styles.tableHeaderCell, styles.cellAction, { color: textColor }]}
                >
                  Action
                </ThemedText>
              </View>

              {/* Table Rows */}
              {contentList.map((item, index) => (
                <View
                  key={item.id || index}
                  style={[styles.tableRow, { borderBottomColor: borderColor }]}
                >
                  <ThemedText
                    style={[styles.tableCell, styles.cellTitle, { color: textColor }]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </ThemedText>
                  <ThemedText style={[styles.tableCell, styles.cellType, { color: mutedColor }]}>
                    {item.contentType || 'File'}
                  </ThemedText>
                  <ThemedText style={[styles.tableCell, styles.cellDate, { color: mutedColor }]}>
                    {formatDate(item.createdAt)}
                  </ThemedText>
                  <TouchableOpacity
                    style={[styles.viewButton, { backgroundColor: `${primaryColor}20` }]}
                    onPress={() => handleViewContent(item)}
                  >
                    <ThemedText style={[styles.viewButtonText, { color: primaryColor }]}>
                      View
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {contentList.length === 0 && !fetching && (
            <View style={styles.emptyState}>
              <IconSymbol name="doc.fill" size={32} color={mutedColor} />
              <ThemedText style={[styles.emptyText, { color: mutedColor }]}>
                No content found. Select a course and tap Fetch.
              </ThemedText>
            </View>
          )}
        </View>
      </ScrollView>

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

      {/* Subject Modal */}
      <Modal visible={showSubjectModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSubjectModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: cardBackground }]}>
            <ThemedText style={[styles.modalTitle, { color: textColor }]}>Select Subject</ThemedText>
            <ScrollView>
              {subjects.map((subject, index) => (
                <TouchableOpacity
                  key={`subject-${subject.id || index}`}
                  style={[
                    styles.modalOption,
                    { borderBottomColor: borderColor },
                    selectedSubjectIndex === index && { backgroundColor: primaryColor + '20' },
                  ]}
                  onPress={() => handleSubjectSelect(index)}
                >
                  <ThemedText
                    style={[
                      styles.modalOptionText,
                      { color: textColor },
                      selectedSubjectIndex === index && { color: primaryColor, fontWeight: '600' },
                    ]}
                  >
                    {subject.name}
                  </ThemedText>
                </TouchableOpacity>
              ))}
              {subjects.length === 0 && (
                <View style={styles.emptyState}>
                  <ThemedText style={[styles.emptyText, { color: mutedColor }]}>
                    No subjects found. Select a course and year first.
                  </ThemedText>
                </View>
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
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
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
  fieldText: {
    fontSize: 16,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  filePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: 'dashed',
    padding: 16,
  },
  filePickerText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
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
  fetchButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  fetchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tableContainer: {
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 2,
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
    fontSize: 13,
  },
  cellTitle: {
    flex: 2,
    paddingRight: 8,
  },
  cellType: {
    flex: 1,
    paddingRight: 8,
  },
  cellDate: {
    flex: 1,
    paddingRight: 8,
  },
  cellAction: {
    width: 60,
    textAlign: 'center',
  },
  viewButton: {
    width: 60,
    paddingVertical: 6,
    borderRadius: 4,
    alignItems: 'center',
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
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

/*
// ==================== COMMENTED OUT - COMPLEX FEATURES ====================
// These were part of the original implementation with tree view, list view, etc.
// Kept for reference if needed later.

// Old imports:
// import { ChapterForm, ContentForm, ContentTreeView, SectionForm } from '@/components/econtent'
// import {
//   Chapter,
//   ContentSection,
//   CourseOption,
//   YearOption,
//   SubjectByCourseOption,
//   getChapters,
//   getCourseYears,
//   getCourses,
//   getSubjectsByCourseYear,
//   getFileIcon,
//   getFileColor,
//   getFileTypeLabel,
//   getContentTypeIcon,
//   getContentTypeColor,
//   getContentTypeLabel,
//   formatFileSize,
//   deleteEContent,
// } from '@/services/eContentApi'

// Old state for tree view:
// type ViewMode = 'tree' | 'list'
// const [viewMode, setViewMode] = useState<ViewMode>('tree')
// const [chapters, setChapters] = useState<Chapter[]>([])
// const [showChapterForm, setShowChapterForm] = useState(false)
// const [showSectionForm, setShowSectionForm] = useState(false)
// const [showContentForm, setShowContentForm] = useState(false)
// const [editingChapter, setEditingChapter] = useState<Chapter | null>(null)
// const [editingSection, setEditingSection] = useState<ContentSection | null>(null)
// const [editingContent, setEditingContent] = useState<EContent | null>(null)
// const [selectedChapterForSection, setSelectedChapterForSection] = useState<Chapter | null>(null)
// const [selectedChapterForContent, setSelectedChapterForContent] = useState<Chapter | null>(null)
// const [selectedSectionForContent, setSelectedSectionForContent] = useState<ContentSection | null>(null)

// Old form modals:
// <ChapterForm
//   visible={showChapterForm}
//   onClose={() => {
//     setShowChapterForm(false)
//     setEditingChapter(null)
//   }}
//   onSuccess={fetchChapters}
//   editingChapter={editingChapter}
// />
// <SectionForm
//   visible={showSectionForm}
//   onClose={() => {
//     setShowSectionForm(false)
//     setEditingSection(null)
//     setSelectedChapterForSection(null)
//   }}
//   onSuccess={fetchChapters}
//   chapter={selectedChapterForSection}
//   editingSection={editingSection}
// />
// <ContentForm
//   visible={showContentForm}
//   onClose={() => {
//     setShowContentForm(false)
//     setEditingContent(null)
//     setSelectedChapterForContent(null)
//     setSelectedSectionForContent(null)
//   }}
//   onSuccess={() => {
//     if (viewMode === 'tree') {
//       fetchChapters()
//     } else {
//       fetchContent(currentPage)
//     }
//   }}
//   chapter={selectedChapterForContent}
//   section={selectedSectionForContent}
//   editingContent={editingContent}
// />

// Old tree view:
// <ContentTreeView
//   chapters={chapters}
//   onRefresh={handleRefresh}
//   onEditChapter={handleEditChapter}
//   onAddSection={handleAddSection}
//   onEditSection={handleEditSection}
//   onAddContent={handleAddContent}
//   onEditContent={handleEditContent}
//   isLoading={isLoading && !isRefreshing}
// />
*/
