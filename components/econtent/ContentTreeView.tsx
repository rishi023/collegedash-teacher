import { ThemedText } from '@/components/ThemedText'
import { IconSymbol } from '@/components/ui/IconSymbol'
import { useThemeColor } from '@/hooks/useThemeColor'
import {
  Chapter,
  ContentSection,
  ContentStatus,
  EContent,
  deleteChapter,
  deleteEContent,
  deleteSection,
  getContentBySection,
  getSections,
  getContentTypeColor,
  getContentTypeIcon,
  getContentTypeLabel,
  publishChapter,
  publishContent,
  publishSection,
  unpublishChapter,
  unpublishContent,
  unpublishSection,
} from '@/services/eContentApi'
import * as Linking from 'expo-linking'
import React, { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native'

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

interface ContentTreeViewProps {
  chapters: Chapter[]
  onRefresh: () => void
  onEditChapter: (chapter: Chapter) => void
  onAddSection: (chapter: Chapter) => void
  onEditSection: (chapter: Chapter, section: ContentSection) => void
  onAddContent: (chapter: Chapter, section: ContentSection) => void
  onEditContent: (chapter: Chapter, section: ContentSection, content: EContent) => void
  isLoading?: boolean
}

interface ExpandedState {
  [key: string]: boolean
}

export default function ContentTreeView({
  chapters,
  onRefresh,
  onEditChapter,
  onAddSection,
  onEditSection,
  onAddContent,
  onEditContent,
  isLoading,
}: ContentTreeViewProps) {
  const primaryColor = useThemeColor({}, 'primary')
  const cardBackground = useThemeColor({}, 'card')
  const textColor = useThemeColor({}, 'text')
  const mutedColor = useThemeColor({}, 'muted')
  const borderColor = useThemeColor({}, 'border')
  const errorColor = useThemeColor({}, 'error')
  const successColor = useThemeColor({}, 'success')
  const warningColor = useThemeColor({}, 'warning')

  const [expandedChapters, setExpandedChapters] = useState<ExpandedState>({})
  const [expandedSections, setExpandedSections] = useState<ExpandedState>({})
  const [sectionsByChapter, setSectionsByChapter] = useState<{ [key: string]: ContentSection[] }>({})
  const [contentBySection, setContentBySection] = useState<{ [key: string]: EContent[] }>({})
  const [loadingChapters, setLoadingChapters] = useState<{ [key: string]: boolean }>({})
  const [loadingSections, setLoadingSections] = useState<{ [key: string]: boolean }>({})

  const toggleChapter = async (chapterId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    const isExpanded = expandedChapters[chapterId]

    setExpandedChapters(prev => ({ ...prev, [chapterId]: !isExpanded }))

    if (!isExpanded && !sectionsByChapter[chapterId]) {
      setLoadingChapters(prev => ({ ...prev, [chapterId]: true }))
      const res = await getSections(chapterId)
      if (res?.responseObject) {
        setSectionsByChapter(prev => ({ ...prev, [chapterId]: res.responseObject }))
      }
      setLoadingChapters(prev => ({ ...prev, [chapterId]: false }))
    }
  }

  const toggleSection = async (sectionId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    const isExpanded = expandedSections[sectionId]

    setExpandedSections(prev => ({ ...prev, [sectionId]: !isExpanded }))

    if (!isExpanded && !contentBySection[sectionId]) {
      setLoadingSections(prev => ({ ...prev, [sectionId]: true }))
      const res = await getContentBySection(sectionId)
      if (res?.responseObject) {
        setContentBySection(prev => ({ ...prev, [sectionId]: res.responseObject }))
      }
      setLoadingSections(prev => ({ ...prev, [sectionId]: false }))
    }
  }

  const handleDeleteChapter = (chapter: Chapter) => {
    Alert.alert(
      'Delete Chapter',
      'Are you sure you want to delete "' + chapter.title + '"? This will also delete all sections and content within it.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteChapter(chapter.id)
              onRefresh()
            } catch (error) {
              console.error('Error deleting chapter:', error)
              Alert.alert('Error', 'Failed to delete chapter')
            }
          },
        },
      ]
    )
  }

  const handleToggleChapterStatus = async (chapter: Chapter) => {
    try {
      if (chapter.status === ContentStatus.PUBLISHED) {
        await unpublishChapter(chapter.id)
      } else {
        await publishChapter(chapter.id)
      }
      onRefresh()
    } catch (error) {
      console.error('Error toggling chapter status:', error)
      Alert.alert('Error', 'Failed to update chapter status')
    }
  }

  const handleDeleteSection = (chapter: Chapter, section: ContentSection) => {
    Alert.alert(
      'Delete Section',
      'Are you sure you want to delete "' + section.title + '"? This will also delete all content within it.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSection(section.id)
              setSectionsByChapter(prev => ({
                ...prev,
                [chapter.id]: prev[chapter.id]?.filter(s => s.id !== section.id) || [],
              }))
            } catch (error) {
              console.error('Error deleting section:', error)
              Alert.alert('Error', 'Failed to delete section')
            }
          },
        },
      ]
    )
  }

  const handleToggleSectionStatus = async (section: ContentSection) => {
    try {
      if (section.status === ContentStatus.PUBLISHED) {
        await unpublishSection(section.id)
      } else {
        await publishSection(section.id)
      }
      const res = await getSections(section.chapterId)
      if (res?.responseObject) {
        setSectionsByChapter(prev => ({ ...prev, [section.chapterId]: res.responseObject }))
      }
    } catch (error) {
      console.error('Error toggling section status:', error)
      Alert.alert('Error', 'Failed to update section status')
    }
  }

  const handleDeleteContent = (section: ContentSection, content: EContent) => {
    Alert.alert('Delete Content', 'Are you sure you want to delete "' + content.title + '"?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteEContent(content.id)
            setContentBySection(prev => ({
              ...prev,
              [section.id]: prev[section.id]?.filter(c => c.id !== content.id) || [],
            }))
          } catch (error) {
            console.error('Error deleting content:', error)
            Alert.alert('Error', 'Failed to delete content')
          }
        },
      },
    ])
  }

  const handleToggleContentStatus = async (section: ContentSection, content: EContent) => {
    try {
      if (content.status === ContentStatus.PUBLISHED) {
        await unpublishContent(content.id)
      } else {
        await publishContent(content.id)
      }
      const res = await getContentBySection(section.id)
      if (res?.responseObject) {
        setContentBySection(prev => ({ ...prev, [section.id]: res.responseObject }))
      }
    } catch (error) {
      console.error('Error toggling content status:', error)
      Alert.alert('Error', 'Failed to update content status')
    }
  }

  const handleViewContent = (content: EContent) => {
    const url = content.fileUrl || content.contentUrl
    if (url) {
      Linking.openURL(url)
    }
  }

  const renderStatusBadge = (status: ContentStatus) => (
    <View style={[styles.statusBadge, { backgroundColor: status === ContentStatus.PUBLISHED ? successColor + '20' : mutedColor + '20' }]}>
      <ThemedText style={[styles.statusBadgeText, { color: status === ContentStatus.PUBLISHED ? successColor : mutedColor }]}>
        {status === ContentStatus.PUBLISHED ? 'Published' : 'Draft'}
      </ThemedText>
    </View>
  )

  const renderContentItem = (chapter: Chapter, section: ContentSection, content: EContent) => {
    const typeColor = getContentTypeColor(content.contentType)

    return (
      <View key={content.id} style={[styles.contentItem, { borderLeftColor: typeColor }]}>
        <View style={styles.contentHeader}>
          <View style={[styles.contentIconContainer, { backgroundColor: typeColor + '20' }]}>
            <IconSymbol name={getContentTypeIcon(content.contentType) as any} size={14} color={typeColor} />
          </View>
          <View style={styles.contentInfo}>
            <ThemedText style={[styles.contentTitle, { color: textColor }]} numberOfLines={1}>
              {content.title}
            </ThemedText>
            <ThemedText style={[styles.contentType, { color: typeColor }]}>
              {getContentTypeLabel(content.contentType)}
            </ThemedText>
          </View>
          {renderStatusBadge(content.status)}
        </View>
        <View style={[styles.contentActions, { borderTopColor: borderColor }]}>
          {(content.fileUrl || content.contentUrl) ? (
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleViewContent(content)}>
              <IconSymbol name="eye.fill" size={14} color={primaryColor} />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={styles.actionBtn} onPress={() => onEditContent(chapter, section, content)}>
            <IconSymbol name="pencil" size={14} color={mutedColor} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleToggleContentStatus(section, content)}>
            <IconSymbol
              name={content.status === ContentStatus.PUBLISHED ? 'eye.slash.fill' : 'eye.fill'}
              size={14}
              color={content.status === ContentStatus.PUBLISHED ? warningColor : successColor}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleDeleteContent(section, content)}>
            <IconSymbol name="trash.fill" size={14} color={errorColor} />
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const renderSectionItem = (chapter: Chapter, section: ContentSection) => {
    const isExpanded = expandedSections[section.id]
    const isSectionLoading = loadingSections[section.id]
    const contents = contentBySection[section.id] || []

    return (
      <View key={section.id} style={[styles.sectionContainer, { borderLeftColor: primaryColor + '40' }]}>
        <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection(section.id)} activeOpacity={0.7}>
          <View style={styles.sectionExpandIcon}>
            <IconSymbol name={isExpanded ? 'chevron.down' : 'chevron.right'} size={14} color={mutedColor} />
          </View>
          <View style={[styles.sectionIconContainer, { backgroundColor: warningColor + '20' }]}>
            <IconSymbol name="doc.text.fill" size={16} color={warningColor} />
          </View>
          <View style={styles.sectionInfo}>
            <ThemedText style={[styles.sectionTitle, { color: textColor }]} numberOfLines={1}>
              {section.title}
            </ThemedText>
          </View>
          {renderStatusBadge(section.status)}
        </TouchableOpacity>
        <View style={[styles.itemActions, styles.sectionActions, { borderTopColor: borderColor }]}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => onAddContent(chapter, section)}>
            <IconSymbol name="plus.circle.fill" size={16} color={primaryColor} />
            <ThemedText style={[styles.actionBtnText, styles.smallActionText, { color: primaryColor }]}>Content</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => onEditSection(chapter, section)}>
            <IconSymbol name="pencil" size={14} color={mutedColor} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleToggleSectionStatus(section)}>
            <IconSymbol
              name={section.status === ContentStatus.PUBLISHED ? 'eye.slash.fill' : 'eye.fill'}
              size={14}
              color={section.status === ContentStatus.PUBLISHED ? warningColor : successColor}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleDeleteSection(chapter, section)}>
            <IconSymbol name="trash.fill" size={14} color={errorColor} />
          </TouchableOpacity>
        </View>
        {isExpanded ? (
          <View style={styles.contentsContainer}>
            {isSectionLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={primaryColor} />
              </View>
            ) : contents.length > 0 ? (
              <View>{contents.map(content => renderContentItem(chapter, section, content))}</View>
            ) : (
              <View style={styles.emptyContainer}>
                <ThemedText style={[styles.emptyText, { color: mutedColor }]}>No content yet</ThemedText>
                <TouchableOpacity onPress={() => onAddContent(chapter, section)}>
                  <ThemedText style={[styles.addLink, { color: primaryColor }]}>+ Add first content</ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : null}
      </View>
    )
  }

  const renderChapterItem = (chapter: Chapter) => {
    const isExpanded = expandedChapters[chapter.id]
    const isChapterLoading = loadingChapters[chapter.id]
    const sections = sectionsByChapter[chapter.id] || []

    return (
      <View key={chapter.id} style={[styles.chapterContainer, { backgroundColor: cardBackground }]}>
        <TouchableOpacity style={styles.chapterHeader} onPress={() => toggleChapter(chapter.id)} activeOpacity={0.7}>
          <View style={styles.chapterExpandIcon}>
            <IconSymbol name={isExpanded ? 'chevron.down' : 'chevron.right'} size={16} color={mutedColor} />
          </View>
          <View style={[styles.chapterIconContainer, { backgroundColor: primaryColor + '20' }]}>
            <IconSymbol name="folder.fill" size={20} color={primaryColor} />
          </View>
          <View style={styles.chapterInfo}>
            <ThemedText style={[styles.chapterTitle, { color: textColor }]} numberOfLines={1}>
              {chapter.title}
            </ThemedText>
            <ThemedText style={[styles.chapterMeta, { color: mutedColor }]} numberOfLines={1}>
              {chapter.subjectName}
            </ThemedText>
          </View>
          {renderStatusBadge(chapter.status)}
        </TouchableOpacity>
        <View style={[styles.itemActions, { borderTopColor: borderColor }]}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => onAddSection(chapter)}>
            <IconSymbol name="plus.circle.fill" size={18} color={primaryColor} />
            <ThemedText style={[styles.actionBtnText, { color: primaryColor }]}>Section</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => onEditChapter(chapter)}>
            <IconSymbol name="pencil" size={16} color={mutedColor} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleToggleChapterStatus(chapter)}>
            <IconSymbol
              name={chapter.status === ContentStatus.PUBLISHED ? 'eye.slash.fill' : 'eye.fill'}
              size={16}
              color={chapter.status === ContentStatus.PUBLISHED ? warningColor : successColor}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleDeleteChapter(chapter)}>
            <IconSymbol name="trash.fill" size={16} color={errorColor} />
          </TouchableOpacity>
        </View>
        {isExpanded ? (
          <View style={styles.sectionsContainer}>
            {isChapterLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={primaryColor} />
              </View>
            ) : sections.length > 0 ? (
              <View>{sections.map(section => renderSectionItem(chapter, section))}</View>
            ) : (
              <View style={styles.emptyContainer}>
                <ThemedText style={[styles.emptyText, { color: mutedColor }]}>No sections yet</ThemedText>
                <TouchableOpacity onPress={() => onAddSection(chapter)}>
                  <ThemedText style={[styles.addLink, { color: primaryColor }]}>+ Add first section</ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : null}
      </View>
    )
  }

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={primaryColor} />
        <ThemedText style={[styles.loadingText, { color: mutedColor }]}>Loading chapters...</ThemedText>
      </View>
    )
  }

  if (chapters.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <IconSymbol name="folder.fill" size={48} color={mutedColor} />
        <ThemedText style={[styles.emptyTitle, { color: textColor }]}>No Chapters Yet</ThemedText>
        <ThemedText style={[styles.emptySubtitle, { color: mutedColor }]}>Create your first chapter to start organizing content</ThemedText>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {chapters.map(chapter => renderChapterItem(chapter))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  chapterContainer: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  chapterExpandIcon: {
    width: 20,
    alignItems: 'center',
    marginRight: 12,
  },
  chapterIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chapterInfo: {
    flex: 1,
  },
  chapterTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  chapterMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionsContainer: {
    paddingLeft: 20,
    paddingRight: 12,
    paddingBottom: 12,
  },
  sectionContainer: {
    borderLeftWidth: 2,
    marginLeft: 20,
    marginBottom: 8,
    paddingLeft: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  sectionExpandIcon: {
    width: 16,
    alignItems: 'center',
    marginRight: 10,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  sectionInfo: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  contentsContainer: {
    paddingLeft: 26,
    paddingTop: 4,
  },
  contentItem: {
    borderLeftWidth: 2,
    marginBottom: 8,
    paddingLeft: 10,
  },
  contentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  contentIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  contentInfo: {
    flex: 1,
  },
  contentTitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  contentType: {
    fontSize: 11,
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  sectionActions: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  contentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopWidth: 1,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 4,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  smallActionText: {
    fontSize: 11,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    marginBottom: 8,
  },
  addLink: {
    fontSize: 13,
    fontWeight: '500',
  },
})
