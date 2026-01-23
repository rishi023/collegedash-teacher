import { ThemedText } from '@/components/ThemedText'
import { IconSymbol } from '@/components/ui/IconSymbol'
import { ChapterForm, ContentForm, ContentTreeView, SectionForm } from '@/components/econtent'
import { useAuth } from '@/contexts/AuthContext'
import { useThemeColor } from '@/hooks/useThemeColor'
import {
  Chapter,
  ContentSection,
  ContentStatus,
  CourseOption,
  EContent,
  SubjectByCourseOption,
  YearOption,
  getAllEContent,
  getChapters,
  getCourseYears,
  getCourses,
  getSubjectsByCourseYear,
  getFileIcon,
  getFileColor,
  getFileTypeLabel,
  getContentTypeIcon,
  getContentTypeColor,
  getContentTypeLabel,
  formatFileSize,
  deleteEContent,
} from '@/services/eContentApi'
import * as Linking from 'expo-linking'
import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type ViewMode = 'tree' | 'list'

const ITEMS_PER_PAGE = 10

export default function EContentScreen() {
  const { user } = useAuth()

  // Theme colors
  const backgroundColor = useThemeColor({}, 'secondary')
  const primaryColor = useThemeColor({}, 'primary')
  const cardBackground = useThemeColor({}, 'card')
  const textColor = useThemeColor({}, 'text')
  const mutedColor = useThemeColor({}, 'muted')
  const borderColor = useThemeColor({}, 'border')
  const inputBackground = useThemeColor({}, 'inputBackground')
  const inputBorder = useThemeColor({}, 'inputBorder')
  const errorColor = useThemeColor({}, 'error')
  const successColor = useThemeColor({}, 'success')
  const warningColor = useThemeColor({}, 'warning')

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('tree')

  // Data state
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [contentList, setContentList] = useState<EContent[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Filter state - using single objects to prevent desync between id and name
  type SelectOption = { id: string; name: string } | null
  const [courses, setCourses] = useState<CourseOption[]>([])
  const [years, setYears] = useState<YearOption[]>([])
  const [subjects, setSubjects] = useState<SubjectByCourseOption[]>([])
  const [selectedCourse, setSelectedCourse] = useState<SelectOption>(null)
  const [selectedYear, setSelectedYear] = useState<SelectOption>(null)
  const [selectedSubject, setSelectedSubject] = useState<SelectOption>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Picker modals
  const [showCoursePicker, setShowCoursePicker] = useState(false)
  const [showYearPicker, setShowYearPicker] = useState(false)
  const [showSubjectPicker, setShowSubjectPicker] = useState(false)

  // Form modals
  const [showChapterForm, setShowChapterForm] = useState(false)
  const [showSectionForm, setShowSectionForm] = useState(false)
  const [showContentForm, setShowContentForm] = useState(false)

  // Editing state
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null)
  const [editingSection, setEditingSection] = useState<ContentSection | null>(null)
  const [editingContent, setEditingContent] = useState<EContent | null>(null)
  const [selectedChapterForSection, setSelectedChapterForSection] = useState<Chapter | null>(null)
  const [selectedChapterForContent, setSelectedChapterForContent] = useState<Chapter | null>(null)
  const [selectedSectionForContent, setSelectedSectionForContent] = useState<ContentSection | null>(
    null,
  )

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch courses on mount
  useEffect(() => {
    fetchCourses()
  }, [])

  // Fetch content when filters change
  useEffect(() => {
    if (viewMode === 'list') {
      setCurrentPage(0)
      fetchContent()
    }
  }, [selectedCourse, selectedYear, selectedSubject, debouncedSearch, viewMode])

  // Fetch chapters when subject changes (for tree view)
  useEffect(() => {
    if (viewMode === 'tree') {
      if (selectedSubject?.id) {
        fetchChapters()
      } else {
        // No subject selected, stop loading and clear chapters
        setChapters([])
        setIsLoading(false)
      }
    }
  }, [selectedSubject, viewMode])

  // Fetch years when course changes
  useEffect(() => {
    if (selectedCourse?.id) {
      fetchYears(selectedCourse.id)
    } else {
      setYears([])
      setSelectedYear(null)
      setSubjects([])
      setSelectedSubject(null)
    }
  }, [selectedCourse])

  // Fetch subjects when year changes
  useEffect(() => {
    if (selectedCourse?.id && selectedYear?.name) {
      fetchSubjects(selectedCourse.id, selectedYear.name)
    } else {
      setSubjects([])
      setSelectedSubject(null)
    }
  }, [selectedCourse, selectedYear])

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

  const fetchSubjects = async (courseId: string, yearName: string) => {
    const res = await getSubjectsByCourseYear(courseId, yearName)
    if (res?.responseObject) {
      setSubjects(res.responseObject)
    }
  }

  const fetchChapters = async () => {
    if (!selectedSubject?.id) {
      setChapters([])
      return
    }
    setIsLoading(true)
    const res = await getChapters(selectedSubject.id)
    if (res?.responseObject) {
      setChapters(res.responseObject)
    } else {
      setChapters([])
    }
    setIsLoading(false)
    setIsRefreshing(false)
  }

  const fetchContent = async (page: number = 0) => {
    try {
      setIsLoading(true)
      const response = await getAllEContent({
        page,
        limit: ITEMS_PER_PAGE,
        classId: selectedCourse?.id || undefined,
        subjectId: selectedSubject?.id || undefined,
        search: debouncedSearch || undefined,
      })
      if (response?.responseObject) {
        setContentList(response.responseObject.content || [])
        setTotalElements(response.responseObject.totalElements || 0)
      } else {
        setContentList([])
        setTotalElements(0)
      }
    } catch (error) {
      console.error('Error fetching content:', error)
      setContentList([])
      setTotalElements(0)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    if (viewMode === 'tree') {
      fetchChapters()
    } else {
      fetchContent(currentPage)
    }
  }, [currentPage, viewMode, selectedSubject])

  const handleLoadMore = () => {
    if (viewMode === 'list') {
      const totalPages = Math.ceil(totalElements / ITEMS_PER_PAGE)
      if (currentPage < totalPages - 1) {
        const nextPage = currentPage + 1
        setCurrentPage(nextPage)
        fetchContent(nextPage)
      }
    }
  }

  // Chapter handlers
  const handleAddChapter = () => {
    setEditingChapter(null)
    setShowChapterForm(true)
  }

  const handleEditChapter = (chapter: Chapter) => {
    setEditingChapter(chapter)
    setShowChapterForm(true)
  }

  // Section handlers
  const handleAddSection = (chapter: Chapter) => {
    setSelectedChapterForSection(chapter)
    setEditingSection(null)
    setShowSectionForm(true)
  }

  const handleEditSection = (chapter: Chapter, section: ContentSection) => {
    setSelectedChapterForSection(chapter)
    setEditingSection(section)
    setShowSectionForm(true)
  }

  // Content handlers
  const handleAddContent = (chapter: Chapter, section: ContentSection) => {
    setSelectedChapterForContent(chapter)
    setSelectedSectionForContent(section)
    setEditingContent(null)
    setShowContentForm(true)
  }

  const handleEditContent = (chapter: Chapter, section: ContentSection, content: EContent) => {
    setSelectedChapterForContent(chapter)
    setSelectedSectionForContent(section)
    setEditingContent(content)
    setShowContentForm(true)
  }

  const handleDeleteListItem = (item: EContent) => {
    Alert.alert('Delete Content', `Are you sure you want to delete "${item.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteEContent(item.id)
            fetchContent(currentPage)
          } catch (error) {
            console.error('Error deleting content:', error)
            Alert.alert('Error', 'Failed to delete content')
          }
        },
      },
    ])
  }

  const handleViewContent = (item: EContent) => {
    if (item.fileUrl || item.contentUrl) {
      Linking.openURL(item.fileUrl || item.contentUrl || '')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const renderContentItem = ({ item }: { item: EContent }) => {
    const typeColor = item.contentType
      ? getContentTypeColor(item.contentType)
      : getFileColor(item.mimeType)
    const typeIcon = item.contentType
      ? getContentTypeIcon(item.contentType)
      : getFileIcon(item.mimeType)
    const typeLabel = item.contentType
      ? getContentTypeLabel(item.contentType)
      : getFileTypeLabel(item.mimeType)

    return (
      <View style={[styles.contentCard, { backgroundColor: cardBackground }]}>
        <View style={styles.contentHeader}>
          <View style={[styles.fileIconContainer, { backgroundColor: `${typeColor}20` }]}>
            <IconSymbol name={typeIcon as any} size={24} color={typeColor} />
          </View>
          <View style={styles.contentInfo}>
            <ThemedText style={[styles.contentTitle, { color: textColor }]} numberOfLines={1}>
              {item.title}
            </ThemedText>
            <View style={styles.contentMeta}>
              <ThemedText style={[styles.contentMetaText, { color: mutedColor }]}>
                {item.className} - {item.subjectName}
              </ThemedText>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  item.status === ContentStatus.PUBLISHED ? `${successColor}20` : `${mutedColor}20`,
              },
            ]}
          >
            <ThemedText
              style={[
                styles.statusBadgeText,
                { color: item.status === ContentStatus.PUBLISHED ? successColor : mutedColor },
              ]}
            >
              {item.status === ContentStatus.PUBLISHED ? 'Published' : 'Draft'}
            </ThemedText>
          </View>
        </View>

        {item.description && (
          <ThemedText style={[styles.contentDescription, { color: mutedColor }]} numberOfLines={2}>
            {item.description}
          </ThemedText>
        )}

        <View style={styles.contentDetails}>
          <View style={styles.detailRow}>
            {item.chapter && (
              <View style={[styles.detailBadge, { backgroundColor: `${primaryColor}20` }]}>
                <ThemedText style={[styles.detailBadgeText, { color: primaryColor }]}>
                  {item.chapter}
                </ThemedText>
              </View>
            )}
            <View style={[styles.detailBadge, { backgroundColor: `${typeColor}20` }]}>
              <ThemedText style={[styles.detailBadgeText, { color: typeColor }]}>
                {typeLabel}
              </ThemedText>
            </View>
            {item.fileSize && (
              <ThemedText style={[styles.fileSize, { color: mutedColor }]}>
                {formatFileSize(item.fileSize)}
              </ThemedText>
            )}
          </View>
          <ThemedText style={[styles.dateText, { color: mutedColor }]}>
            {formatDate(item.createdAt)}
          </ThemedText>
        </View>

        <View style={[styles.actionRow, { borderTopColor: borderColor }]}>
          {(item.fileUrl || item.contentUrl) && (
            <TouchableOpacity style={styles.actionButton} onPress={() => handleViewContent(item)}>
              <IconSymbol name="eye.fill" size={18} color={primaryColor} />
              <ThemedText style={[styles.actionText, { color: primaryColor }]}>View</ThemedText>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionButton} onPress={() => handleDeleteListItem(item)}>
            <IconSymbol name="trash.fill" size={18} color={errorColor} />
            <ThemedText style={[styles.actionText, { color: errorColor }]}>Delete</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <IconSymbol
        name={viewMode === 'tree' ? 'folder.fill' : 'doc.fill'}
        size={48}
        color={mutedColor}
      />
      <ThemedText style={[styles.emptyStateText, { color: textColor }]}>
        {viewMode === 'tree' ? 'No Chapters Found' : 'No Content Found'}
      </ThemedText>
      <ThemedText style={[styles.emptyStateSubtext, { color: mutedColor }]}>
        {viewMode === 'tree'
          ? selectedSubject?.id
            ? 'Create your first chapter to start organizing content.'
            : 'Please select a subject to view chapters.'
          : searchQuery || selectedCourse?.id || selectedYear?.id || selectedSubject?.id
            ? 'Try adjusting your filters or search query.'
            : 'Upload your first educational content to get started.'}
      </ThemedText>
      {viewMode === 'tree' && selectedSubject?.id && (
        <TouchableOpacity
          style={[styles.emptyStateButton, { backgroundColor: primaryColor }]}
          onPress={handleAddChapter}
        >
          <IconSymbol name="plus" size={20} color="#fff" />
          <ThemedText style={styles.emptyStateButtonText}>Add Chapter</ThemedText>
        </TouchableOpacity>
      )}
    </View>
  )

  const renderPickerModal = (
    visible: boolean,
    onClose: () => void,
    title: string,
    options: { id: string; name: string }[],
    selected: { id: string; name: string } | null,
    onSelect: (option: { id: string; name: string } | null) => void,
    showAllOption: boolean = true,
  ) => (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.pickerModalOverlay}>
        <View style={[styles.pickerModalContent, { backgroundColor: cardBackground }]}>
          <View style={[styles.pickerModalHeader, { borderBottomColor: borderColor }]}>
            <ThemedText style={[styles.pickerModalTitle, { color: textColor }]}>{title}</ThemedText>
            <TouchableOpacity onPress={onClose}>
              <IconSymbol name="xmark.circle.fill" size={24} color={mutedColor} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.pickerOptions}>
            {showAllOption && (
              <TouchableOpacity
                key="all-option"
                style={[
                  styles.pickerOption,
                  { borderBottomColor: borderColor },
                  !selected?.id && { backgroundColor: `${primaryColor}10` },
                ]}
                onPress={() => {
                  onSelect(null)
                  onClose()
                }}
              >
                <ThemedText
                  style={[
                    styles.pickerOptionText,
                    { color: !selected?.id ? primaryColor : textColor },
                  ]}
                >
                  All
                </ThemedText>
              </TouchableOpacity>
            )}
            {options.length === 0 ? (
              <View
                key="no-options"
                style={[styles.pickerOption, { borderBottomColor: borderColor }]}
              >
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
                    selected?.id === option.id && { backgroundColor: `${primaryColor}10` },
                  ]}
                  onPress={() => {
                    onSelect(option)
                    onClose()
                  }}
                >
                  <ThemedText
                    style={[
                      styles.pickerOptionText,
                      { color: selected?.id === option.id ? primaryColor : textColor },
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
    <SafeAreaView
      edges={{ top: 'off', bottom: 'additive' }}
      style={[styles.container, { backgroundColor }]}
    >
      {/* Summary Card */}
      <View style={[styles.summaryCard, { backgroundColor: cardBackground }]}>
        <View style={styles.summaryLeft}>
          <ThemedText style={[styles.summaryValue, { color: textColor }]}>
            {viewMode === 'tree' ? chapters.length : totalElements}
          </ThemedText>
          <ThemedText style={[styles.summaryLabel, { color: mutedColor }]}>
            {viewMode === 'tree' ? 'Chapters' : 'Total Content'}
          </ThemedText>
        </View>
        <View style={styles.summaryActions}>
          {/* View Mode Toggle */}
          <View style={[styles.viewModeToggle, { backgroundColor: inputBackground }]}>
            <TouchableOpacity
              style={[
                styles.viewModeButton,
                viewMode === 'tree' && { backgroundColor: primaryColor },
              ]}
              onPress={() => setViewMode('tree')}
            >
              <IconSymbol
                name="list.bullet.indent"
                size={18}
                color={viewMode === 'tree' ? '#fff' : mutedColor}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewModeButton,
                viewMode === 'list' && { backgroundColor: primaryColor },
              ]}
              onPress={() => setViewMode('list')}
            >
              <IconSymbol
                name="square.grid.2x2.fill"
                size={18}
                color={viewMode === 'list' ? '#fff' : mutedColor}
              />
            </TouchableOpacity>
          </View>
          {viewMode === 'tree' && selectedSubject?.id && (
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: primaryColor }]}
              onPress={handleAddChapter}
            >
              <IconSymbol name="plus" size={20} color="#fff" />
              <ThemedText style={styles.addButtonText}>Chapter</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Section */}
      <View style={styles.filterSection}>
        {/* Course Dropdown */}
        <TouchableOpacity
          style={[
            styles.filterDropdown,
            { backgroundColor: inputBackground, borderColor: inputBorder },
          ]}
          onPress={() => setShowCoursePicker(true)}
        >
          <ThemedText
            style={[
              styles.filterDropdownText,
              { color: selectedCourse?.id ? textColor : mutedColor },
            ]}
            numberOfLines={1}
          >
            {selectedCourse?.name || 'Select Course'}
          </ThemedText>
          <IconSymbol name="chevron.down" size={16} color={mutedColor} />
        </TouchableOpacity>

        <View style={styles.filterRow}>
          {/* Year Dropdown */}
          <TouchableOpacity
            style={[
              styles.filterDropdown,
              styles.filterDropdownFirst,
              { backgroundColor: inputBackground, borderColor: inputBorder },
              !selectedCourse?.id && styles.filterDisabled,
            ]}
            onPress={() => selectedCourse?.id && setShowYearPicker(true)}
            disabled={!selectedCourse?.id}
          >
            <ThemedText
              style={[
                styles.filterDropdownText,
                { color: selectedYear?.id ? textColor : mutedColor },
                !selectedCourse?.id && { color: borderColor },
              ]}
              numberOfLines={1}
            >
              {selectedYear?.name || 'Select Year'}
            </ThemedText>
            <IconSymbol
              name="chevron.down"
              size={16}
              color={selectedCourse?.id ? mutedColor : borderColor}
            />
          </TouchableOpacity>

          {/* Subject Dropdown */}
          <TouchableOpacity
            style={[
              styles.filterDropdown,
              styles.filterDropdownInRow,
              { backgroundColor: inputBackground, borderColor: inputBorder },
              !selectedYear?.id && styles.filterDisabled,
            ]}
            onPress={() => selectedYear?.id && setShowSubjectPicker(true)}
            disabled={!selectedYear?.id}
          >
            <ThemedText
              style={[
                styles.filterDropdownText,
                { color: selectedSubject?.id ? textColor : mutedColor },
                !selectedYear?.id && { color: borderColor },
              ]}
              numberOfLines={1}
            >
              {selectedSubject?.name || 'Select Subject'}
            </ThemedText>
            <IconSymbol
              name="chevron.down"
              size={16}
              color={selectedYear?.id ? mutedColor : borderColor}
            />
          </TouchableOpacity>
        </View>

        {viewMode === 'list' && (
          <View
            style={[
              styles.searchContainer,
              { backgroundColor: inputBackground, borderColor: inputBorder },
            ]}
          >
            <IconSymbol name="magnifyingglass" size={18} color={mutedColor} />
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder="Search by title..."
              placeholderTextColor={mutedColor}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <IconSymbol name="xmark.circle.fill" size={18} color={mutedColor} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Content Area */}
      {viewMode === 'tree' ? (
        <ContentTreeView
          chapters={chapters}
          onRefresh={handleRefresh}
          onEditChapter={handleEditChapter}
          onAddSection={handleAddSection}
          onEditSection={handleEditSection}
          onAddContent={handleAddContent}
          onEditContent={handleEditContent}
          isLoading={isLoading && !isRefreshing}
        />
      ) : isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <ThemedText style={[styles.loadingText, { color: mutedColor }]}>
            Loading content...
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={contentList}
          renderItem={renderContentItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={primaryColor}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={
            contentList.length > 0 &&
            currentPage < Math.ceil(totalElements / ITEMS_PER_PAGE) - 1 ? (
              <ActivityIndicator style={styles.footerLoader} size="small" color={primaryColor} />
            ) : null
          }
        />
      )}

      {/* Picker Modals */}
      {renderPickerModal(
        showCoursePicker,
        () => setShowCoursePicker(false),
        'Select Course',
        courses.map(c => ({ id: c.id, name: c.name })),
        selectedCourse,
        option => {
          setSelectedCourse(option)
          setSelectedYear(null)
          setSelectedSubject(null)
        },
      )}

      {renderPickerModal(
        showYearPicker,
        () => setShowYearPicker(false),
        'Select Year',
        years.map(y => ({ id: y.id, name: y.name })),
        selectedYear,
        option => {
          setSelectedYear(option)
          setSelectedSubject(null)
        },
      )}

      {renderPickerModal(
        showSubjectPicker,
        () => setShowSubjectPicker(false),
        'Select Subject',
        subjects.map(s => ({ id: s.id, name: s.name })),
        selectedSubject,
        option => {
          setSelectedSubject(option)
        },
      )}

      {/* Form Modals */}
      <ChapterForm
        visible={showChapterForm}
        onClose={() => {
          setShowChapterForm(false)
          setEditingChapter(null)
        }}
        onSuccess={fetchChapters}
        editingChapter={editingChapter}
      />

      <SectionForm
        visible={showSectionForm}
        onClose={() => {
          setShowSectionForm(false)
          setEditingSection(null)
          setSelectedChapterForSection(null)
        }}
        onSuccess={fetchChapters}
        chapter={selectedChapterForSection}
        editingSection={editingSection}
      />

      <ContentForm
        visible={showContentForm}
        onClose={() => {
          setShowContentForm(false)
          setEditingContent(null)
          setSelectedChapterForContent(null)
          setSelectedSectionForContent(null)
        }}
        onSuccess={() => {
          if (viewMode === 'tree') {
            fetchChapters()
          } else {
            fetchContent(currentPage)
          }
        }}
        chapter={selectedChapterForContent}
        section={selectedSectionForContent}
        editingContent={editingContent}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryLeft: {
    alignItems: 'flex-start',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
  },
  summaryActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewModeToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 4,
  },
  viewModeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 12,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  filterSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  filterRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  filterDropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
  },
  filterDropdownInRow: {
    marginTop: 0,
    marginLeft: 12,
  },
  filterDropdownFirst: {
    marginTop: 0,
    marginLeft: 0,
  },
  filterDropdownText: {
    fontSize: 14,
    flex: 1,
  },
  filterDisabled: {
    opacity: 0.5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
    marginHorizontal: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  contentCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  contentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentInfo: {
    flex: 1,
    marginRight: 12,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  contentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contentMetaText: {
    fontSize: 13,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  contentDescription: {
    fontSize: 14,
    marginTop: 12,
    lineHeight: 20,
  },
  contentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 1,
  },
  detailBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 4,
  },
  detailBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  fileSize: {
    fontSize: 12,
  },
  dateText: {
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 24,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
  footerLoader: {
    paddingVertical: 20,
  },
})
