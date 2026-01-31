import { ThemedText } from '@/components/ThemedText'
import { IconSymbol } from '@/components/ui/IconSymbol'
import { useAuth } from '@/contexts/AuthContext'
import { useThemeColor } from '@/hooks/useThemeColor'
import {
  addStudentComment,
  getStudentComments,
  getStudentsForSection,
  type StudentForComment,
  type TeacherComment,
} from '@/services/account'
import { storage } from '@/services/storage'
import { Course, Section, Year } from '@/types/assignment'
import { api } from '@/services/axios'
import React, { useCallback, useEffect, useState } from 'react'
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

const COMMENT_TYPES = [
  { value: 'POSITIVE', label: 'Positive', color: '#22c55e' },
  { value: 'NEGATIVE', label: 'Needs improvement', color: '#ef4444' },
  { value: 'GENERAL', label: 'General', color: '#6b7280' },
]

function staffDisplayName(staff: { firstName?: string; lastNme?: string } | null): string {
  if (!staff) return 'Teacher'
  const first = staff.firstName ?? ''
  const last = staff.lastNme ?? ''
  return [first, last].filter(Boolean).join(' ') || 'Teacher'
}

export default function StudentCommentsScreen() {
  const { user } = useAuth()
  const backgroundColor = useThemeColor({}, 'secondary')
  const primaryColor = useThemeColor({}, 'primary')
  const cardBackground = useThemeColor({}, 'card')
  const textColor = useThemeColor({}, 'text')
  const mutedColor = useThemeColor({}, 'muted')
  const borderColor = useThemeColor({}, 'border')

  const [batchId, setBatchId] = useState('')
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseIndex, setSelectedCourseIndex] = useState(-1)
  const [selectedYearIndex, setSelectedYearIndex] = useState(-1)
  const [selectedSectionIndex, setSelectedSectionIndex] = useState(-1)
  const [students, setStudents] = useState<StudentForComment[]>([])
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)

  const [selectedStudent, setSelectedStudent] = useState<StudentForComment | null>(null)
  const [commentModalVisible, setCommentModalVisible] = useState(false)
  const [existingComments, setExistingComments] = useState<TeacherComment[]>([])
  const [remarks, setRemarks] = useState('')
  const [commentType, setCommentType] = useState('GENERAL')
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const getSelectedCourse = (): Course | null => {
    if (courses.length === 0 || selectedCourseIndex < 0 || selectedCourseIndex >= courses.length)
      return null
    return courses[selectedCourseIndex]
  }

  const getYears = (): Year[] => {
    const course = getSelectedCourse()
    if (!course?.years) return []
    return course.years
  }

  const getSections = (): Section[] => {
    const years = getYears()
    if (years.length === 0 || selectedYearIndex < 0 || selectedYearIndex >= years.length) return []
    return years[selectedYearIndex]?.sections || []
  }

  const selectedCourse = getSelectedCourse()
  const years = getYears()
  const sections = getSections()
  const selectedYear = selectedYearIndex >= 0 ? years[selectedYearIndex] : null
  const selectedSection = selectedSectionIndex >= 0 ? sections[selectedSectionIndex] : null

  useEffect(() => {
    let mounted = true
    const init = async () => {
      try {
        const userData = await storage.getUserData()
        const batch = userData?.runningBatchId
        if (!batch) {
          setLoading(false)
          return
        }
        setBatchId(batch)
        const res = await api.get(`/v1/course/batch/${batch}`)
        const courseList = res?.responseObject || res || []
        if (mounted && Array.isArray(courseList) && courseList.length > 0) {
          setCourses(courseList)
        }
      } catch (e) {
        console.error(e)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    init()
    return () => { mounted = false }
  }, [])

  const loadStudents = useCallback(async () => {
    if (!selectedCourse || selectedYearIndex < 0) {
      Alert.alert('Select filters', 'Please select Course and Year.')
      return
    }
    const yearName = years[selectedYearIndex]?.name ?? ''
    const sectionName = selectedSectionIndex >= 0 ? sections[selectedSectionIndex]?.name ?? '' : yearName
    setFetching(true)
    setStudents([])
    try {
      const list = await getStudentsForSection(
        selectedCourse.id,
        yearName,
        sectionName || yearName,
        batchId,
      )
      setStudents(list ?? [])
      if (!list?.length) Alert.alert('Info', 'No students found for this selection.')
    } catch (e) {
      console.error(e)
      Alert.alert('Error', 'Failed to load students.')
    } finally {
      setFetching(false)
    }
  }, [selectedCourse, selectedYearIndex, years, selectedSectionIndex, sections, batchId])

  const openCommentModal = useCallback(async (student: StudentForComment) => {
    setSelectedStudent(student)
    setRemarks('')
    setCommentType('GENERAL')
    setCommentModalVisible(true)
    setCommentsLoading(true)
    setExistingComments([])
    try {
      const list = await getStudentComments(student.studentId)
      setExistingComments(list ?? [])
    } catch (e) {
      console.error(e)
    } finally {
      setCommentsLoading(false)
    }
  }, [])

  const handleAddComment = useCallback(async () => {
    if (!selectedStudent || !remarks.trim()) {
      Alert.alert('Required', 'Please enter remarks.')
      return
    }
    setSubmitting(true)
    try {
      const teacherName = staffDisplayName(user?.staffDetails) || user?.firstName || 'Teacher'
      const updated = await addStudentComment({
        studentId: selectedStudent.studentId,
        remarks: remarks.trim(),
        teacherName,
        name: commentType,
      })
      if (updated) {
        setExistingComments(updated)
        setRemarks('')
      }
    } catch (e) {
      console.error(e)
      Alert.alert('Error', 'Failed to add comment.')
    } finally {
      setSubmitting(false)
    }
  }, [selectedStudent, remarks, commentType, user])

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  if (loading) {
    return (
      <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={primaryColor} />
          <ThemedText style={[styles.loadingText, { color: mutedColor }]}>Loading…</ThemedText>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <ThemedText style={[styles.title, { color: textColor }]}>Add comment for student</ThemedText>
        <ThemedText style={[styles.subtitle, { color: mutedColor }]}>
          Select course, year and section, then choose a student to add a comment. Students can see these in their app.
        </ThemedText>

        {/* Course */}
        <View style={styles.fieldRow}>
          <ThemedText style={[styles.label, { color: textColor }]}>Course</ThemedText>
          <View style={[styles.dropdown, { backgroundColor: cardBackground, borderColor }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {courses.map((c, i) => (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.chip,
                    selectedCourseIndex === i && { backgroundColor: primaryColor + '30', borderColor: primaryColor },
                  ]}
                  onPress={() => {
                    setSelectedCourseIndex(i)
                    setSelectedYearIndex(-1)
                    setSelectedSectionIndex(-1)
                    setStudents([])
                  }}
                >
                  <ThemedText style={[styles.chipText, { color: textColor }]}>{c.name}</ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Year */}
        <View style={styles.fieldRow}>
          <ThemedText style={[styles.label, { color: textColor }]}>Year</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {years.map((y, i) => (
              <TouchableOpacity
                key={y.name}
                style={[
                  styles.chip,
                  { backgroundColor: cardBackground, borderColor },
                  selectedYearIndex === i && { backgroundColor: primaryColor + '30', borderColor: primaryColor },
                ]}
                onPress={() => {
                  setSelectedYearIndex(i)
                  setSelectedSectionIndex(-1)
                  setStudents([])
                }}
              >
                <ThemedText style={[styles.chipText, { color: textColor }]}>{y.name}</ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Section */}
        {sections.length > 0 && (
          <View style={styles.fieldRow}>
            <ThemedText style={[styles.label, { color: textColor }]}>Section</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {sections.map((s, i) => (
                <TouchableOpacity
                  key={s.name}
                  style={[
                    styles.chip,
                    { backgroundColor: cardBackground, borderColor },
                    selectedSectionIndex === i && { backgroundColor: primaryColor + '30', borderColor: primaryColor },
                  ]}
                  onPress={() => {
                    setSelectedSectionIndex(i)
                    setStudents([])
                  }}
                >
                  <ThemedText style={[styles.chipText, { color: textColor }]}>{s.name}</ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <TouchableOpacity
          style={[styles.loadButton, { backgroundColor: primaryColor }]}
          onPress={loadStudents}
          disabled={fetching || !selectedCourse || selectedYearIndex < 0}
        >
          {fetching ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <ThemedText style={styles.loadButtonText}>Load students</ThemedText>
          )}
        </TouchableOpacity>

        {students.length > 0 && (
          <View style={[styles.card, { backgroundColor: cardBackground, borderColor }]}>
            <ThemedText style={[styles.cardTitle, { color: textColor }]}>Students</ThemedText>
            {students.map((s, i) => (
              <TouchableOpacity
                key={s.studentId}
                style={[styles.studentRow, { borderColor }, i === students.length - 1 && styles.studentRowLast]}
                onPress={() => openCommentModal(s)}
                activeOpacity={0.7}
              >
                <View style={styles.studentInfo}>
                  <ThemedText style={[styles.studentName, { color: textColor }]}>{s.studentName}</ThemedText>
                  {(s.rollNumber != null || s.admissionNumber) && (
                    <ThemedText style={[styles.studentMeta, { color: mutedColor }]}>
                      Roll {s.rollNumber ?? '–'} · Adm {s.admissionNumber ?? '–'}
                    </ThemedText>
                  )}
                </View>
                <IconSymbol name="chevron.right" size={18} color={mutedColor} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Comment Modal */}
      <Modal visible={commentModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBackground }]}>
            <View style={[styles.modalHeader, { borderColor }]}>
              <ThemedText style={[styles.modalTitle, { color: textColor }]}>
                Comment for {selectedStudent?.studentName ?? 'Student'}
              </ThemedText>
              <TouchableOpacity onPress={() => setCommentModalVisible(false)} hitSlop={12}>
                <ThemedText style={[styles.modalClose, { color: primaryColor }]}>Done</ThemedText>
              </TouchableOpacity>
            </View>
            <View style={styles.modalBodyWrap}>
              <ScrollView
                style={styles.modalBodyScroll}
                contentContainerStyle={styles.modalBodyContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator
              >
              {commentsLoading ? (
                <ActivityIndicator size="small" color={primaryColor} style={styles.modalLoader} />
              ) : existingComments.length > 0 ? (
                <View style={styles.commentsList}>
                  <ThemedText style={[styles.commentsListTitle, { color: mutedColor }]}>Previous comments</ThemedText>
                  {existingComments.map((c) => (
                    <View key={c.id} style={[styles.commentItem, { borderColor }]}>
                      <ThemedText style={[styles.commentRemarks, { color: textColor }]}>{c.remarks}</ThemedText>
                      <ThemedText style={[styles.commentMeta, { color: mutedColor }]}>
                        {c.teacherName ?? 'Teacher'} · {formatDate(c.date)}
                        {c.name ? ` · ${c.name}` : ''}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              ) : null}

              <ThemedText style={[styles.inputLabel, { color: textColor }]}>Comment type</ThemedText>
              <View style={styles.typeRow}>
                {COMMENT_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t.value}
                    style={[
                      styles.typeChip,
                      { borderColor: t.color },
                      commentType === t.value && { backgroundColor: t.color + '25' },
                    ]}
                    onPress={() => setCommentType(t.value)}
                  >
                    <ThemedText style={[styles.typeChipText, { color: textColor }]}>{t.label}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>

              <ThemedText style={[styles.inputLabel, { color: textColor }]}>Remarks</ThemedText>
              <TextInput
                style={[styles.remarksInput, { backgroundColor, borderColor, color: textColor }]}
                value={remarks}
                onChangeText={setRemarks}
                placeholder="Write your comment for the student..."
                placeholderTextColor={mutedColor}
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: primaryColor }]}
                onPress={handleAddComment}
                disabled={submitting || !remarks.trim()}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <ThemedText style={styles.addButtonText}>Add comment</ThemedText>
                )}
              </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, fontSize: 14 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, marginBottom: 20, lineHeight: 20 },
  fieldRow: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  dropdown: { padding: 12, borderRadius: 10, borderWidth: 1 },
  chipRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  chipText: { fontSize: 14 },
  loadButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 24,
  },
  loadButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  card: { borderRadius: 12, borderWidth: 1, overflow: 'hidden', padding: 4 },
  cardTitle: { fontSize: 16, fontWeight: '600', padding: 12 },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  studentRowLast: { borderBottomWidth: 0 },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 16, fontWeight: '600' },
  studentMeta: { fontSize: 12, marginTop: 2 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: '85%',
    maxHeight: '85%',
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: { fontSize: 18, fontWeight: '600', flex: 1 },
  modalClose: { fontSize: 16, fontWeight: '600' },
  modalBodyWrap: {
    flex: 1,
    minHeight: 0,
  },
  modalBodyScroll: {
    flex: 1,
  },
  modalBodyContent: {
    padding: 16,
    paddingBottom: 24,
  },
  modalLoader: { marginVertical: 24 },
  commentsList: { marginBottom: 20 },
  commentsListTitle: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  commentItem: { padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: 8 },
  commentRemarks: { fontSize: 14 },
  commentMeta: { fontSize: 12, marginTop: 4 },
  inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 8 },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  typeChipText: { fontSize: 13 },
  remarksInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    minHeight: 88,
    textAlignVertical: 'top',
  },
  addButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
