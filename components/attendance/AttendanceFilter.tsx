import { ThemedText } from '@/components/ThemedText'
import { useThemeColor } from '@/hooks/useThemeColor'
import { Course, Section, Year } from '@/types/assignment'
import React from 'react'
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

export interface AttendanceFilterValues {
  courseId: string
  courseName: string
  year: string
  section: string
  date: string
}

interface AttendanceFilterProps {
  courses: Course[]
  selectedCourseIndex: number
  selectedYearIndex: number
  selectedSectionIndex: number
  selectedDate: string
  onCourseSelect: (index: number) => void
  onYearSelect: (index: number) => void
  onSectionSelect: (index: number) => void
  onDateChange: (date: string) => void
  onClearSection: () => void
  onView: () => void
  loading?: boolean
  showClearSection?: boolean
}

export default function AttendanceFilter({
  courses,
  selectedCourseIndex,
  selectedYearIndex,
  selectedSectionIndex,
  selectedDate,
  onCourseSelect,
  onYearSelect,
  onSectionSelect,
  onDateChange,
  onClearSection,
  onView,
  loading = false,
  showClearSection = true,
}: AttendanceFilterProps) {
  const backgroundColor = useThemeColor({}, 'secondary')
  const primaryColor = useThemeColor({}, 'primary')
  const cardBackground = useThemeColor({}, 'card')
  const textColor = useThemeColor({}, 'text')
  const mutedColor = useThemeColor({}, 'muted')
  const borderColor = useThemeColor({}, 'border')

  const [showCourseModal, setShowCourseModal] = React.useState(false)
  const [showYearModal, setShowYearModal] = React.useState(false)
  const [showSectionModal, setShowSectionModal] = React.useState(false)

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
    onCourseSelect(index)
    setShowCourseModal(false)
  }

  const handleYearSelect = (index: number) => {
    onYearSelect(index)
    setShowYearModal(false)
  }

  const handleSectionSelect = (index: number) => {
    onSectionSelect(index)
    setShowSectionModal(false)
  }

  const selectedCourse = getSelectedCourse()
  const years = getYears()
  const sections = getSections()
  const selectedYear = selectedYearIndex >= 0 ? years[selectedYearIndex] : null
  const selectedSection = selectedSectionIndex >= 0 ? sections[selectedSectionIndex] : null

  return (
    <>
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
          <ThemedText style={[styles.fieldText, { color: selectedYear ? textColor : mutedColor }]}>
            {selectedYear?.name || 'Select Year'}
          </ThemedText>
          <ThemedText style={{ color: mutedColor }}>▼</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Section Dropdown with Clear */}
      <View style={styles.fieldContainer}>
        <ThemedText style={[styles.label, { color: textColor }]}>Section (Optional)</ThemedText>
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
          {showClearSection && selectedSectionIndex >= 0 && (
            <TouchableOpacity style={[styles.clearButton, { borderColor }]} onPress={onClearSection}>
              <ThemedText style={[styles.clearButtonText, { color: mutedColor }]}>✕</ThemedText>
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
          onChangeText={onDateChange}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={mutedColor}
        />
      </View>

      {/* View Button */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: primaryColor }]}
        onPress={onView}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <ThemedText style={styles.buttonText}>View</ThemedText>
        )}
      </TouchableOpacity>

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
            <ThemedText style={[styles.modalTitle, { color: textColor }]}>Select Section</ThemedText>
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
    </>
  )
}

const styles = StyleSheet.create({
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
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
