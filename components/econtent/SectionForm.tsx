import { ThemedText } from '@/components/ThemedText'
import { IconSymbol } from '@/components/ui/IconSymbol'
import { useThemeColor } from '@/hooks/useThemeColor'
import {
  Chapter,
  ContentSection,
  ContentStatus,
  SectionPayload,
  createSection,
  updateSection,
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

interface SectionFormProps {
  visible: boolean
  onClose: () => void
  onSuccess: () => void
  chapter: Chapter | null
  editingSection?: ContentSection | null
}

export default function SectionForm({
  visible,
  onClose,
  onSuccess,
  chapter,
  editingSection,
}: SectionFormProps) {
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

  // Populate form when editing
  useEffect(() => {
    if (editingSection && visible) {
      setTitle(editingSection.title)
      setDescription(editingSection.description || '')
      setStatus(editingSection.status)
    } else if (visible) {
      resetForm()
    }
  }, [editingSection, visible])

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setStatus(ContentStatus.DRAFT)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a section title')
      return false
    }
    if (!chapter) {
      Alert.alert('Validation Error', 'No chapter selected')
      return false
    }
    return true
  }

  const handleSubmit = async (saveAsPublished: boolean = false) => {
    if (!validateForm() || !chapter) return

    try {
      setIsSubmitting(true)

      const payload: SectionPayload = {
        chapterId: chapter.id,
        title: title.trim(),
        description: description.trim() || undefined,
        status: saveAsPublished ? ContentStatus.PUBLISHED : status,
      }

      let response
      if (editingSection) {
        response = await updateSection(editingSection.id, payload)
      } else {
        response = await createSection(payload)
      }

      if (response) {
        Alert.alert(
          'Success',
          editingSection ? 'Section updated successfully' : 'Section created successfully'
        )
        resetForm()
        onSuccess()
        onClose()
      } else {
        Alert.alert('Error', 'Failed to save section')
      }
    } catch (error) {
      console.error('Error saving section:', error)
      Alert.alert('Error', 'Failed to save section')
    } finally {
      setIsSubmitting(false)
    }
  }

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
            {editingSection ? 'Edit Section' : 'New Section'}
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
          {/* Chapter Info */}
          {chapter && (
            <View style={[styles.chapterInfo, { backgroundColor: `${primaryColor}10`, borderColor: `${primaryColor}30` }]}>
              <IconSymbol name="folder.fill" size={20} color={primaryColor} />
              <View style={styles.chapterDetails}>
                <ThemedText style={[styles.chapterLabel, { color: mutedColor }]}>
                  Adding to Chapter
                </ThemedText>
                <ThemedText style={[styles.chapterTitle, { color: textColor }]}>
                  {chapter.title}
                </ThemedText>
                <ThemedText style={[styles.chapterMeta, { color: mutedColor }]}>
                  {chapter.subjectName} - {chapter.courseName}
                </ThemedText>
              </View>
            </View>
          )}

          {/* Title */}
          <View style={styles.formGroup}>
            <ThemedText style={[styles.formLabel, { color: textColor }]}>
              Section Title <ThemedText style={{ color: errorColor }}>*</ThemedText>
            </ThemedText>
            <TextInput
              style={[
                styles.formInput,
                { backgroundColor: inputBackground, borderColor: inputBorder, color: textColor },
              ]}
              placeholder="e.g., Introduction to Basics"
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
              placeholder="Enter section description (optional)"
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
  chapterInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  chapterDetails: {
    flex: 1,
    marginLeft: 12,
  },
  chapterLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  chapterTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  chapterMeta: {
    fontSize: 13,
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
})
