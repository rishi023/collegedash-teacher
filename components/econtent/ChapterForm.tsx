import { ThemedText } from '@/components/ThemedText'
import { IconSymbol } from '@/components/ui/IconSymbol'
import { useThemeColor } from '@/hooks/useThemeColor'
import {
  Chapter,
  ChapterPayload,
  ContentStatus,
  CourseOption,
  SubjectByCourseOption,
  YearOption,
  createChapter,
  getCourseYears,
  getCourses,
  getSubjectsByCourseYear,
  updateChapter,
} from '@/services/eContentApi'
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

interface ChapterFormProps {
  visible: boolean
  onClose: () => void
  onSuccess: () => void
  editingChapter?: Chapter | null
}

export default function ChapterForm({
  visible,
  onClose,
  onSuccess,
  editingChapter,
}: ChapterFormProps) {
  // Theme colors
  const backgroundColor = useThemeColor({}, 'secondary')
  const cardBackground = useThemeColor({}, 'card')
  const textColor = useThemeColor({}, 'text')
  const mutedColor = useThemeColor({}, 'muted')
  const borderColor = useThemeColor({}, 'border')
  const inputBackground = useThemeColor({}, 'inputBackground')
  const inputBorder = useThemeColor({}, 'inputBorder')
  const errorColor = useThemeColor({}, 'error')
  const primaryColor = useThemeColor({}, 'primary')
  const successColor = useThemeColor({}, 'success')

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<ContentStatus>(ContentStatus.DRAFT)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Selection state
  const [courses, setCourses] = useState<CourseOption[]>([])
  const [years, setYears] = useState<YearOption[]>([])
  const [subjects, setSubjects] = useState<SubjectByCourseOption[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [selectedCourseName, setSelectedCourseName] = useState('')
  const [selectedYearId, setSelectedYearId] = useState('')
  const [selectedYearName, setSelectedYearName] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [selectedSubjectName, setSelectedSubjectName] = useState('')

  // Picker modals
  const [showCoursePicker, setShowCoursePicker] = useState(false)
  const [showYearPicker, setShowYearPicker] = useState(false)
  const [showSubjectPicker, setShowSubjectPicker] = useState(false)

  // Load courses on mount
  useEffect(() => {
    if (visible) {
      fetchCourses()
    }
  }, [visible])

  // Populate form when editing
  useEffect(() => {
    if (editingChapter && visible) {
      setTitle(editingChapter.title)
      setDescription(editingChapter.description || '')
      setStatus(editingChapter.status)
      setSelectedCourseId(editingChapter.courseId)
      setSelectedCourseName(editingChapter.courseName)
      setSelectedYearName(editingChapter.year)
      setSelectedSubjectId(editingChapter.subjectId)
      setSelectedSubjectName(editingChapter.subjectName)
    }
  }, [editingChapter, visible])

  // Fetch years when course changes
  useEffect(() => {
    if (selectedCourseId && !editingChapter) {
      fetchYears(selectedCourseId)
    }
  }, [selectedCourseId])

  // Fetch subjects when year changes
  useEffect(() => {
    if (selectedCourseId && selectedYearName && !editingChapter) {
      fetchSubjects(selectedCourseId, selectedYearName)
    }
  }, [selectedCourseId, selectedYearName])

  const fetchCourses = async () => {
    const res = await getCourses()
    if (res?.responseObject) {
      setCourses(res.responseObject)
    }
  }

  const fetchYears = async (courseId: string) => {
    const res = await getCourseYears(courseId)
    if (res?.responseObject) {
      setYears(res.responseObject)
    }
  }

  const fetchSubjects = async (courseId: string, year: string) => {
    const res = await getSubjectsByCourseYear(courseId, year)
    if (res?.responseObject) {
      setSubjects(res.responseObject)
    }
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setStatus(ContentStatus.DRAFT)
    setSelectedCourseId('')
    setSelectedCourseName('')
    setSelectedYearId('')
    setSelectedYearName('')
    setSelectedSubjectId('')
    setSelectedSubjectName('')
    setYears([])
    setSubjects([])
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a chapter title')
      return false
    }
    if (!selectedCourseId) {
      Alert.alert('Validation Error', 'Please select a course')
      return false
    }
    if (!selectedYearName) {
      Alert.alert('Validation Error', 'Please select a year')
      return false
    }
    if (!selectedSubjectId) {
      Alert.alert('Validation Error', 'Please select a subject')
      return false
    }
    return true
  }

  const handleSubmit = async (saveAsPublished: boolean = false) => {
    if (!validateForm()) return

    try {
      setIsSubmitting(true)

      const payload: ChapterPayload = {
        title: title.trim(),
        description: description.trim() || undefined,
        courseId: selectedCourseId,
        courseName: selectedCourseName,
        year: selectedYearName,
        subjectId: selectedSubjectId,
        subjectName: selectedSubjectName,
        status: saveAsPublished ? ContentStatus.PUBLISHED : status,
      }

      let response
      if (editingChapter) {
        response = await updateChapter(editingChapter.id, payload)
      } else {
        response = await createChapter(payload)
      }

      if (response) {
        Alert.alert(
          'Success',
          editingChapter ? 'Chapter updated successfully' : 'Chapter created successfully'
        )
        resetForm()
        onSuccess()
        onClose()
      } else {
        Alert.alert('Error', 'Failed to save chapter')
      }
    } catch (error) {
      console.error('Error saving chapter:', error)
      Alert.alert('Error', 'Failed to save chapter')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderPickerModal = (
    pickerVisible: boolean,
    onPickerClose: () => void,
    pickerTitle: string,
    options: { id: string; name: string }[],
    selectedId: string,
    onSelect: (id: string, name: string) => void
  ) => (
    <Modal visible={pickerVisible} transparent animationType="slide">
      <View style={styles.pickerModalOverlay}>
        <View style={[styles.pickerModalContent, { backgroundColor: cardBackground }]}>
          <View style={[styles.pickerModalHeader, { borderBottomColor: borderColor }]}>
            <ThemedText style={[styles.pickerModalTitle, { color: textColor }]}>
              {pickerTitle}
            </ThemedText>
            <TouchableOpacity onPress={onPickerClose}>
              <IconSymbol name="xmark.circle.fill" size={24} color={mutedColor} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.pickerOptions}>
            {options.length === 0 ? (
              <View style={[styles.pickerOption, { borderBottomColor: borderColor }]}>
                <ThemedText style={[styles.pickerOptionText, { color: mutedColor }]}>
                  No options available
                </ThemedText>
              </View>
            ) : (
              options.map(option => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.pickerOption,
                    { borderBottomColor: borderColor },
                    selectedId === option.id && { backgroundColor: `${primaryColor}10` },
                  ]}
                  onPress={() => {
                    onSelect(option.id, option.name)
                    onPickerClose()
                  }}
                >
                  <ThemedText
                    style={[
                      styles.pickerOptionText,
                      { color: selectedId === option.id ? primaryColor : textColor },
                    ]}
                  >
                    {option.name}
                  </ThemedText>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        {/* Header */}
        <View
          style={[styles.header, { backgroundColor: cardBackground, borderBottomColor: borderColor }]}
        >
          <TouchableOpacity onPress={handleClose} disabled={isSubmitting}>
            <ThemedText style={[styles.cancelText, { color: errorColor }]}>Cancel</ThemedText>
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: textColor }]}>
            {editingChapter ? 'Edit Chapter' : 'New Chapter'}
          </ThemedText>
          <TouchableOpacity onPress={() => handleSubmit(false)} disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator size="small" color={primaryColor} />
            ) : (
              <ThemedText style={[styles.saveText, { color: primaryColor }]}>Save</ThemedText>
            )}
          </TouchableOpacity>
        </View>

        {/* Form */}
        <ScrollView style={styles.form} contentContainerStyle={styles.formContent}>
          {/* Course Selection */}
          <View style={styles.formGroup}>
            <ThemedText style={[styles.formLabel, { color: textColor }]}>
              Course <ThemedText style={{ color: errorColor }}>*</ThemedText>
            </ThemedText>
            <TouchableOpacity
              style={[
                styles.formSelect,
                { backgroundColor: inputBackground, borderColor: inputBorder },
                editingChapter && styles.formSelectDisabled,
              ]}
              onPress={() => !editingChapter && setShowCoursePicker(true)}
              disabled={!!editingChapter}
            >
              <ThemedText
                style={[styles.formSelectText, { color: selectedCourseId ? textColor : mutedColor }]}
              >
                {selectedCourseName || 'Select a course'}
              </ThemedText>
              <IconSymbol name="chevron.down" size={16} color={mutedColor} />
            </TouchableOpacity>
          </View>

          {/* Year Selection */}
          <View style={styles.formGroup}>
            <ThemedText style={[styles.formLabel, { color: textColor }]}>
              Year <ThemedText style={{ color: errorColor }}>*</ThemedText>
            </ThemedText>
            <TouchableOpacity
              style={[
                styles.formSelect,
                { backgroundColor: inputBackground, borderColor: inputBorder },
                (!selectedCourseId || editingChapter) && styles.formSelectDisabled,
              ]}
              onPress={() => selectedCourseId && !editingChapter && setShowYearPicker(true)}
              disabled={!selectedCourseId || !!editingChapter}
            >
              <ThemedText
                style={[
                  styles.formSelectText,
                  { color: selectedYearName ? textColor : mutedColor },
                  !selectedCourseId && { color: borderColor },
                ]}
              >
                {selectedYearName || 'Select a year'}
              </ThemedText>
              <IconSymbol
                name="chevron.down"
                size={16}
                color={selectedCourseId ? mutedColor : borderColor}
              />
            </TouchableOpacity>
          </View>

          {/* Subject Selection */}
          <View style={styles.formGroup}>
            <ThemedText style={[styles.formLabel, { color: textColor }]}>
              Subject <ThemedText style={{ color: errorColor }}>*</ThemedText>
            </ThemedText>
            <TouchableOpacity
              style={[
                styles.formSelect,
                { backgroundColor: inputBackground, borderColor: inputBorder },
                (!selectedYearName || editingChapter) && styles.formSelectDisabled,
              ]}
              onPress={() => selectedYearName && !editingChapter && setShowSubjectPicker(true)}
              disabled={!selectedYearName || !!editingChapter}
            >
              <ThemedText
                style={[
                  styles.formSelectText,
                  { color: selectedSubjectId ? textColor : mutedColor },
                  !selectedYearName && { color: borderColor },
                ]}
              >
                {selectedSubjectName || 'Select a subject'}
              </ThemedText>
              <IconSymbol
                name="chevron.down"
                size={16}
                color={selectedYearName ? mutedColor : borderColor}
              />
            </TouchableOpacity>
          </View>

          {/* Title */}
          <View style={styles.formGroup}>
            <ThemedText style={[styles.formLabel, { color: textColor }]}>
              Chapter Title <ThemedText style={{ color: errorColor }}>*</ThemedText>
            </ThemedText>
            <TextInput
              style={[
                styles.formInput,
                { backgroundColor: inputBackground, borderColor: inputBorder, color: textColor },
              ]}
              placeholder="e.g., Chapter 1: Introduction"
              placeholderTextColor={mutedColor}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Description */}
          <View style={styles.formGroup}>
            <ThemedText style={[styles.formLabel, { color: textColor }]}>Description</ThemedText>
            <TextInput
              style={[
                styles.formInput,
                styles.formTextarea,
                { backgroundColor: inputBackground, borderColor: inputBorder, color: textColor },
              ]}
              placeholder="Enter chapter description (optional)"
              placeholderTextColor={mutedColor}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Status Selection */}
          <View style={styles.formGroup}>
            <ThemedText style={[styles.formLabel, { color: textColor }]}>Status</ThemedText>
            <View style={styles.statusContainer}>
              <TouchableOpacity
                style={[
                  styles.statusOption,
                  { borderColor: status === ContentStatus.DRAFT ? mutedColor : borderColor },
                  status === ContentStatus.DRAFT && { backgroundColor: `${mutedColor}20` },
                ]}
                onPress={() => setStatus(ContentStatus.DRAFT)}
              >
                <View
                  style={[
                    styles.statusRadio,
                    { borderColor: mutedColor },
                    status === ContentStatus.DRAFT && {
                      borderColor: mutedColor,
                      backgroundColor: mutedColor,
                    },
                  ]}
                />
                <ThemedText style={[styles.statusLabel, { color: textColor }]}>Draft</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.statusOption,
                  styles.statusOptionLast,
                  { borderColor: status === ContentStatus.PUBLISHED ? successColor : borderColor },
                  status === ContentStatus.PUBLISHED && { backgroundColor: `${successColor}20` },
                ]}
                onPress={() => setStatus(ContentStatus.PUBLISHED)}
              >
                <View
                  style={[
                    styles.statusRadio,
                    { borderColor: successColor },
                    status === ContentStatus.PUBLISHED && {
                      borderColor: successColor,
                      backgroundColor: successColor,
                    },
                  ]}
                />
                <ThemedText style={[styles.statusLabel, { color: textColor }]}>Published</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.draftButton, styles.actionButtonFirst, { borderColor: mutedColor }]}
              onPress={() => handleSubmit(false)}
              disabled={isSubmitting}
            >
              <ThemedText style={[styles.actionButtonText, { color: mutedColor }]}>
                Save as Draft
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.publishButton, { backgroundColor: successColor }]}
              onPress={() => handleSubmit(true)}
              disabled={isSubmitting}
            >
              <ThemedText style={[styles.actionButtonText, { color: '#fff' }]}>
                Save & Publish
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Picker Modals */}
        {renderPickerModal(
          showCoursePicker,
          () => setShowCoursePicker(false),
          'Select Course',
          courses.map(c => ({ id: c.id, name: c.name })),
          selectedCourseId,
          (id, name) => {
            setSelectedCourseId(id)
            setSelectedCourseName(name)
            setSelectedYearId('')
            setSelectedYearName('')
            setSelectedSubjectId('')
            setSelectedSubjectName('')
            setSubjects([])
          }
        )}

        {renderPickerModal(
          showYearPicker,
          () => setShowYearPicker(false),
          'Select Year',
          years.map(y => ({ id: y.id, name: y.name })),
          selectedYearId,
          (id, name) => {
            setSelectedYearId(id)
            setSelectedYearName(name)
            setSelectedSubjectId('')
            setSelectedSubjectName('')
          }
        )}

        {renderPickerModal(
          showSubjectPicker,
          () => setShowSubjectPicker(false),
          'Select Subject',
          subjects.map(s => ({ id: s.id, name: s.name })),
          selectedSubjectId,
          (id, name) => {
            setSelectedSubjectId(id)
            setSelectedSubjectName(name)
          }
        )}
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cancelText: {
    fontSize: 16,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    flex: 1,
  },
  formContent: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  formTextarea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  formSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  formSelectText: {
    fontSize: 16,
    flex: 1,
  },
  formSelectDisabled: {
    opacity: 0.5,
  },
  statusContainer: {
    flexDirection: 'row',
  },
  statusOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 12,
  },
  statusOptionLast: {
    marginRight: 0,
  },
  statusRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 20,
  },
  actionButtonFirst: {
    marginRight: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  draftButton: {
    borderWidth: 1,
  },
  publishButton: {},
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  pickerOptions: {
    paddingHorizontal: 20,
  },
  pickerOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  pickerOptionText: {
    fontSize: 16,
  },
})
