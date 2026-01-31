import { ThemedText } from '@/components/ThemedText'
import { IconSymbol } from '@/components/ui/IconSymbol'
import { useThemeColor } from '@/hooks/useThemeColor'
import {
  Chapter,
  ContentSection,
  ContentStatus,
  ContentType,
  CONTENT_TYPE_OPTIONS,
  EContent,
  createContent,
  getFileColor,
  getFileIcon,
  getFileTypeLabel,
  updateEContent,
  uploadEContent,
} from '@/services/eContentApi'
import * as DocumentPicker from 'expo-document-picker'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

interface ContentFormProps {
  visible: boolean
  onClose: () => void
  onSuccess: () => void
  chapter: Chapter | null
  section: ContentSection | null
  editingContent?: EContent | null
}

export default function ContentForm({
  visible,
  onClose,
  onSuccess,
  chapter,
  section,
  editingContent,
}: ContentFormProps) {
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
  const [content, setContent] = useState('')
  const [contentType, setContentType] = useState<ContentType>(ContentType.NOTES)
  const [status, setStatus] = useState<ContentStatus>(ContentStatus.DRAFT)
  const [contentUrl, setContentUrl] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [maxMarks, setMaxMarks] = useState('')
  const [assignmentInstructions, setAssignmentInstructions] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // File state
  const [selectedFile, setSelectedFile] = useState<{
    uri: string
    name: string
    type: string
  } | null>(null)

  // Picker modals
  const [showContentTypePicker, setShowContentTypePicker] = useState(false)

  // Populate form when editing
  useEffect(() => {
    if (editingContent && visible) {
      setTitle(editingContent.title)
      setDescription(editingContent.description || '')
      setContent(editingContent.content || '')
      setContentType(editingContent.contentType || ContentType.NOTES)
      setStatus(editingContent.status)
      setContentUrl(editingContent.contentUrl || '')
      setDueDate(editingContent.dueDate || '')
      setMaxMarks(editingContent.maxMarks?.toString() || '')
      setAssignmentInstructions(editingContent.assignmentInstructions || '')
    } else if (visible) {
      resetForm()
    }
  }, [editingContent, visible])

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setContent('')
    setContentType(ContentType.NOTES)
    setStatus(ContentStatus.DRAFT)
    setContentUrl('')
    setDueDate('')
    setMaxMarks('')
    setAssignmentInstructions('')
    setSelectedFile(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: getAcceptedFileTypes(),
        copyToCacheDirectory: true,
      })

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0]
        setSelectedFile({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'application/octet-stream',
        })
      }
    } catch (error) {
      console.error('Error picking file:', error)
      Alert.alert('Error', 'Failed to pick file')
    }
  }

  const getAcceptedFileTypes = (): string[] => {
    switch (contentType) {
      case ContentType.DOCUMENT:
        return [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]
      case ContentType.VIDEO:
        return ['video/*']
      case ContentType.IMAGE:
        return ['image/*']
      case ContentType.AUDIO:
        return ['audio/*']
      default:
        return ['*/*']
    }
  }

  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a content title')
      return false
    }
    if (!chapter || !section) {
      Alert.alert('Validation Error', 'No chapter or section selected')
      return false
    }

    // Type-specific validation
    if (
      [ContentType.DOCUMENT, ContentType.VIDEO, ContentType.IMAGE, ContentType.AUDIO].includes(
        contentType
      ) &&
      !selectedFile &&
      !editingContent?.fileUrl
    ) {
      Alert.alert('Validation Error', 'Please select a file to upload')
      return false
    }

    if (contentType === ContentType.LINK && !contentUrl.trim()) {
      Alert.alert('Validation Error', 'Please enter a URL')
      return false
    }

    if (contentType === ContentType.NOTES && !content.trim() && !description.trim()) {
      Alert.alert('Validation Error', 'Please enter some content or description')
      return false
    }

    return true
  }

  const handleSubmit = async (saveAsPublished: boolean = false) => {
    if (!validateForm() || !chapter || !section) return

    try {
      setIsSubmitting(true)

      const finalStatus = saveAsPublished ? ContentStatus.PUBLISHED : status

      // If we have a file to upload
      if (selectedFile) {
        const response = await uploadEContent(selectedFile, {
          courseId: chapter.courseId,
          courseName: chapter.courseName,
          year: chapter.year,
          subjectId: chapter.subjectId,
          subjectName: chapter.subjectName,
          title: title.trim(),
          description: description.trim() || undefined,
          chapterId: chapter.id,
          sectionId: section.id,
          contentType,
          status: finalStatus,
          content: content.trim() || undefined,
          dueDate: dueDate || undefined,
          maxMarks: maxMarks ? parseInt(maxMarks) : undefined,
          assignmentInstructions: assignmentInstructions.trim() || undefined,
        })

        if (response) {
          Alert.alert('Success', 'Content uploaded successfully')
          resetForm()
          onSuccess()
          onClose()
        } else {
          Alert.alert('Error', 'Failed to upload content')
        }
      } else {
        // For content without file (NOTES, LINK)
        const payload = {
          chapterId: chapter.id,
          sectionId: section.id,
          classId: chapter.courseId,
          className: chapter.courseName,
          subjectId: chapter.subjectId,
          subjectName: chapter.subjectName,
          courseId: chapter.courseId,
          courseName: chapter.courseName,
          year: chapter.year,
          title: title.trim(),
          description: description.trim() || undefined,
          content: content.trim() || undefined,
          contentType,
          contentUrl: contentUrl.trim() || undefined,
          status: finalStatus,
          dueDate: dueDate || undefined,
          maxMarks: maxMarks ? parseInt(maxMarks) : undefined,
          assignmentInstructions: assignmentInstructions.trim() || undefined,
        }

        let response
        if (editingContent) {
          response = await updateEContent(editingContent.id, payload)
        } else {
          response = await createContent(payload)
        }

        if (response) {
          Alert.alert(
            'Success',
            editingContent ? 'Content updated successfully' : 'Content created successfully'
          )
          resetForm()
          onSuccess()
          onClose()
        } else {
          Alert.alert('Error', 'Failed to save content')
        }
      }
    } catch (error) {
      console.error('Error saving content:', error)
      Alert.alert('Error', 'Failed to save content')
    } finally {
      setIsSubmitting(false)
    }
  }

  const requiresFile = [
    ContentType.DOCUMENT,
    ContentType.VIDEO,
    ContentType.IMAGE,
    ContentType.AUDIO,
  ].includes(contentType)

  const isLinkType = contentType === ContentType.LINK
  const isNotesType = contentType === ContentType.NOTES
  const isAssignmentType = contentType === ContentType.ASSIGNMENT

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            { backgroundColor: cardBackground, borderBottomColor: borderColor },
          ]}
        >
          <TouchableOpacity onPress={handleClose} disabled={isSubmitting}>
            <ThemedText style={[styles.cancelText, { color: errorColor }]}>Cancel</ThemedText>
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: textColor }]}>
            {editingContent ? 'Edit Content' : 'Add Content'}
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
          {/* Section Info */}
          {chapter && section && (
            <View
              style={[
                styles.locationInfo,
                { backgroundColor: `${primaryColor}10`, borderColor: `${primaryColor}30` },
              ]}
            >
              <IconSymbol name="doc.text.fill" size={20} color={primaryColor} />
              <View style={styles.locationDetails}>
                <ThemedText style={[styles.locationLabel, { color: mutedColor }]}>
                  Adding to Section
                </ThemedText>
                <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                  {section.title}
                </ThemedText>
                <ThemedText style={[styles.chapterPath, { color: mutedColor }]}>
                  {chapter.title} - {chapter.subjectName}
                </ThemedText>
              </View>
            </View>
          )}

          {/* Content Type Selection */}
          <View style={styles.formGroup}>
            <ThemedText style={[styles.formLabel, { color: textColor }]}>
              Content Type <ThemedText style={{ color: errorColor }}>*</ThemedText>
            </ThemedText>
            <TouchableOpacity
              style={[
                styles.formSelect,
                { backgroundColor: inputBackground, borderColor: inputBorder },
                editingContent && styles.formSelectDisabled,
              ]}
              onPress={() => !editingContent && setShowContentTypePicker(true)}
              disabled={!!editingContent}
            >
              <View style={styles.contentTypeSelected}>
                <View
                  style={[
                    styles.contentTypeIcon,
                    {
                      backgroundColor: `${
                        CONTENT_TYPE_OPTIONS.find(o => o.value === contentType)?.color || '#6b7280'
                      }20`,
                    },
                  ]}
                >
                  <IconSymbol
                    name={
                      (CONTENT_TYPE_OPTIONS.find(o => o.value === contentType)?.icon ||
                        'doc.fill') as any
                    }
                    size={18}
                    color={
                      CONTENT_TYPE_OPTIONS.find(o => o.value === contentType)?.color || '#6b7280'
                    }
                  />
                </View>
                <ThemedText style={[styles.formSelectText, { color: textColor }]}>
                  {CONTENT_TYPE_OPTIONS.find(o => o.value === contentType)?.label || 'Select Type'}
                </ThemedText>
              </View>
              <IconSymbol name="chevron.down" size={16} color={mutedColor} />
            </TouchableOpacity>
          </View>

          {/* Title */}
          <View style={styles.formGroup}>
            <ThemedText style={[styles.formLabel, { color: textColor }]}>
              Title <ThemedText style={{ color: errorColor }}>*</ThemedText>
            </ThemedText>
            <TextInput
              style={[
                styles.formInput,
                { backgroundColor: inputBackground, borderColor: inputBorder, color: textColor },
              ]}
              placeholder="Enter content title"
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
              placeholder="Enter description"
              placeholderTextColor={mutedColor}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Notes Content (Rich Text) */}
          {(isNotesType || isAssignmentType) && (
            <View style={styles.formGroup}>
              <ThemedText style={[styles.formLabel, { color: textColor }]}>
                {isAssignmentType ? 'Assignment Details' : 'Content'}
              </ThemedText>
              <TextInput
                style={[
                  styles.formInput,
                  styles.formContentArea,
                  { backgroundColor: inputBackground, borderColor: inputBorder, color: textColor },
                ]}
                placeholder={
                  isAssignmentType
                    ? 'Enter assignment details and instructions...'
                    : 'Enter your notes content here...'
                }
                placeholderTextColor={mutedColor}
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={8}
              />
            </View>
          )}

          {/* Link URL */}
          {isLinkType && (
            <View style={styles.formGroup}>
              <ThemedText style={[styles.formLabel, { color: textColor }]}>
                URL <ThemedText style={{ color: errorColor }}>*</ThemedText>
              </ThemedText>
              <TextInput
                style={[
                  styles.formInput,
                  { backgroundColor: inputBackground, borderColor: inputBorder, color: textColor },
                ]}
                placeholder="https://example.com"
                placeholderTextColor={mutedColor}
                value={contentUrl}
                onChangeText={setContentUrl}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>
          )}

          {/* File Upload */}
          {requiresFile && (
            <View style={styles.formGroup}>
              <ThemedText style={[styles.formLabel, { color: textColor }]}>
                File <ThemedText style={{ color: errorColor }}>*</ThemedText>
              </ThemedText>
              <Pressable
                style={[
                  styles.filePickerArea,
                  { backgroundColor: inputBackground, borderColor: inputBorder },
                ]}
                onPress={handlePickFile}
              >
                {selectedFile ? (
                  <View style={styles.selectedFileInfo}>
                    <IconSymbol
                      name={getFileIcon(selectedFile.type) as any}
                      size={32}
                      color={getFileColor(selectedFile.type)}
                    />
                    <View style={styles.selectedFileDetails}>
                      <ThemedText
                        style={[styles.selectedFileName, { color: textColor }]}
                        numberOfLines={1}
                      >
                        {selectedFile.name}
                      </ThemedText>
                      <ThemedText style={[styles.selectedFileType, { color: mutedColor }]}>
                        {getFileTypeLabel(selectedFile.type)}
                      </ThemedText>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedFile(null)}>
                      <IconSymbol name="xmark.circle.fill" size={24} color={errorColor} />
                    </TouchableOpacity>
                  </View>
                ) : editingContent?.fileUrl ? (
                  <View style={styles.existingFileInfo}>
                    <IconSymbol name="checkmark.circle.fill" size={24} color={successColor} />
                    <ThemedText style={[styles.existingFileText, { color: textColor }]}>
                      File already uploaded
                    </ThemedText>
                    <ThemedText style={[styles.existingFileHint, { color: mutedColor }]}>
                      Tap to replace
                    </ThemedText>
                  </View>
                ) : (
                  <View style={styles.filePickerPlaceholder}>
                    <IconSymbol name="arrow.up.doc.fill" size={32} color={mutedColor} />
                    <ThemedText style={[styles.filePickerText, { color: mutedColor }]}>
                      Tap to select a file
                    </ThemedText>
                    <ThemedText style={[styles.filePickerHint, { color: borderColor }]}>
                      {contentType === ContentType.VIDEO
                        ? 'Video files only'
                        : contentType === ContentType.IMAGE
                        ? 'Image files only'
                        : contentType === ContentType.AUDIO
                        ? 'Audio files only'
                        : 'PDF, Word, PowerPoint, Excel'}
                    </ThemedText>
                  </View>
                )}
              </Pressable>
            </View>
          )}

          {/* Assignment-specific fields */}
          {isAssignmentType && (
            <>
              <View style={styles.formGroup}>
                <ThemedText style={[styles.formLabel, { color: textColor }]}>Due Date</ThemedText>
                <TextInput
                  style={[
                    styles.formInput,
                    { backgroundColor: inputBackground, borderColor: inputBorder, color: textColor },
                  ]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={mutedColor}
                  value={dueDate}
                  onChangeText={setDueDate}
                />
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={[styles.formLabel, { color: textColor }]}>
                  Maximum Marks
                </ThemedText>
                <TextInput
                  style={[
                    styles.formInput,
                    { backgroundColor: inputBackground, borderColor: inputBorder, color: textColor },
                  ]}
                  placeholder="e.g., 100"
                  placeholderTextColor={mutedColor}
                  value={maxMarks}
                  onChangeText={setMaxMarks}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formGroup}>
                <ThemedText style={[styles.formLabel, { color: textColor }]}>
                  Instructions for Students
                </ThemedText>
                <TextInput
                  style={[
                    styles.formInput,
                    styles.formTextarea,
                    { backgroundColor: inputBackground, borderColor: inputBorder, color: textColor },
                  ]}
                  placeholder="Enter submission instructions..."
                  placeholderTextColor={mutedColor}
                  value={assignmentInstructions}
                  onChangeText={setAssignmentInstructions}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </>
          )}

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
                <ThemedText style={[styles.statusLabel, { color: textColor }]}>
                  Published
                </ThemedText>
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
              style={[
                styles.actionButton,
                styles.publishButton,
                { backgroundColor: successColor },
              ]}
              onPress={() => handleSubmit(true)}
              disabled={isSubmitting}
            >
              <ThemedText style={[styles.actionButtonText, { color: '#fff' }]}>
                Save & Publish
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Content Type Picker Modal */}
        <Modal visible={showContentTypePicker} transparent animationType="slide">
          <View style={styles.pickerModalOverlay}>
            <View style={[styles.pickerModalContent, { backgroundColor: cardBackground }]}>
              <View style={[styles.pickerModalHeader, { borderBottomColor: borderColor }]}>
                <ThemedText style={[styles.pickerModalTitle, { color: textColor }]}>
                  Select Content Type
                </ThemedText>
                <TouchableOpacity onPress={() => setShowContentTypePicker(false)}>
                  <IconSymbol name="xmark.circle.fill" size={24} color={mutedColor} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.pickerOptions}>
                {CONTENT_TYPE_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.pickerOption,
                      { borderBottomColor: borderColor },
                      contentType === option.value && { backgroundColor: `${option.color}10` },
                    ]}
                    onPress={() => {
                      setContentType(option.value)
                      setSelectedFile(null) // Reset file when changing type
                      setShowContentTypePicker(false)
                    }}
                  >
                    <View style={styles.contentTypeOptionRow}>
                      <View
                        style={[
                          styles.contentTypeOptionIcon,
                          { backgroundColor: `${option.color}20` },
                        ]}
                      >
                        <IconSymbol name={option.icon as any} size={20} color={option.color} />
                      </View>
                      <ThemedText
                        style={[
                          styles.pickerOptionText,
                          { color: contentType === option.value ? option.color : textColor },
                        ]}
                      >
                        {option.label}
                      </ThemedText>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
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
    paddingBottom: 40,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  locationDetails: {
    flex: 1,
    marginLeft: 12,
  },
  locationLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  chapterPath: {
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
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formContentArea: {
    minHeight: 150,
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
  contentTypeSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contentTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  filePickerArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  filePickerPlaceholder: {
    alignItems: 'center',
  },
  filePickerText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 8,
  },
  filePickerHint: {
    fontSize: 12,
    marginTop: 8,
  },
  selectedFileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  selectedFileDetails: {
    flex: 1,
    marginHorizontal: 12,
  },
  selectedFileName: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedFileType: {
    fontSize: 12,
    marginTop: 2,
  },
  existingFileInfo: {
    alignItems: 'center',
  },
  existingFileText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  existingFileHint: {
    fontSize: 12,
    marginTop: 4,
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
    maxHeight: '70%',
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
  contentTypeOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contentTypeOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
})
