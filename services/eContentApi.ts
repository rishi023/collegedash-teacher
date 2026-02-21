import { api, ApiResponse } from './axios'
import { storage } from './storage'

// ==================== ENUMS ====================
export enum ContentType {
  NOTES = 'NOTES',
  DOCUMENT = 'DOCUMENT',
  VIDEO = 'VIDEO',
  LINK = 'LINK',
  ASSIGNMENT = 'ASSIGNMENT',
  IMAGE = 'IMAGE',
  AUDIO = 'AUDIO',
  OTHER = 'OTHER',
}

export enum ContentStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}

// ==================== TYPES ====================
export interface EContent {
  id: string
  title: string
  description: string
  content?: string // Rich text HTML content
  chapter?: string // Legacy field for backward compatibility
  chapterId?: string
  sectionId?: string
  classId: string
  className: string
  subjectId: string
  subjectName: string
  courseId?: string
  courseName?: string
  year?: string
  filename?: string
  fileUrl?: string
  contentUrl?: string
  mimeType?: string
  fileSize?: number
  contentType: ContentType
  status: ContentStatus
  sequence?: number
  // Assignment-specific fields
  dueDate?: string
  maxMarks?: number
  assignmentInstructions?: string
  // Metadata
  staffId?: string
  teacherName?: string
  active: boolean
  postedDate?: string
  publishedAt?: string
  publishedBy?: string
  createdAt: string
  updatedAt?: string
}

export interface Chapter {
  id: string
  institutionId: string
  batchId: string
  courseId: string
  courseName: string
  year: string
  section?: string
  subjectId: string
  subjectName: string
  title: string
  description?: string
  sequence: number
  active: boolean
  status: ContentStatus
  publishedAt?: string
  publishedBy?: string
  createdBy: string
  teacherName?: string
  createdAt: string
  updatedAt?: string
  // UI helper fields
  sections?: ContentSection[]
  isExpanded?: boolean
}

export interface ContentSection {
  id: string
  institutionId: string
  chapterId: string
  title: string
  description?: string
  sequence: number
  active: boolean
  status: ContentStatus
  publishedAt?: string
  publishedBy?: string
  createdBy: string
  createdAt: string
  updatedAt?: string
  // UI helper fields
  contents?: EContent[]
  isExpanded?: boolean
}

export interface EContentListParams {
  page?: number
  limit?: number
  classId?: string
  courseId?: string
  year?: string
  subjectId?: string
  chapterId?: string
  sectionId?: string
  contentType?: ContentType
  status?: ContentStatus
  search?: string
}

interface PagedContent<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export interface ClassOption {
  id: string
  name: string
  section?: string
}

export interface SubjectOption {
  id: string
  name: string
}

export interface CourseOption {
  id: string
  name: string
  code?: string
  description?: string
  institutionId?: string
  departmentId?: string
}

export interface YearOption {
  id: string
  name: string
  year?: number
}

export interface SubjectByCourseOption {
  id: string
  name: string
  code?: string
}

export interface EContentUploadMetadata {
  /** Prefer course/year; classId kept for legacy backend compatibility. */
  classId?: string
  className?: string
  courseId: string
  courseName: string
  year: string
  subjectId: string
  subjectName: string
  title: string
  description?: string
  chapter?: string
  chapterId?: string
  sectionId?: string
  contentType?: ContentType
  status?: ContentStatus
  content?: string
  dueDate?: string
  maxMarks?: number
  assignmentInstructions?: string
}

export interface ChapterPayload {
  courseId: string
  courseName: string
  year: string
  section?: string
  subjectId: string
  subjectName: string
  title: string
  description?: string
  status?: ContentStatus
}

export interface SectionPayload {
  chapterId: string
  title: string
  description?: string
  status?: ContentStatus
}

export interface ContentPayload {
  chapterId?: string
  sectionId?: string
  classId: string
  className: string
  subjectId: string
  subjectName: string
  courseId?: string
  courseName?: string
  year?: string
  title: string
  description?: string
  content?: string
  contentType: ContentType
  contentUrl?: string
  status?: ContentStatus
  dueDate?: string
  maxMarks?: number
  assignmentInstructions?: string
}

// Hierarchical structure for tree view
export interface ContentStructure {
  subjectId: string
  subjectName: string
  chapters: ChapterWithContent[]
}

export interface ChapterWithContent extends Chapter {
  sections: SectionWithContent[]
}

export interface SectionWithContent extends ContentSection {
  contents: EContent[]
}

const ENDPOINT = '/v1/teacher/e-content'
const TEACHER_CONTENT_BASE = '/v1/teacher/content'
const CHAPTER_ENDPOINT = '/v1/teacher/chapters'
const SECTION_ENDPOINT = '/v1/teacher/sections'
const IMAGE_UPLOAD_PATH = '/v1/image'

// Get institution ID from storage
const getInstitutionId = async (): Promise<string | null> => {
  const userData = await storage.getUserData()
  return userData?.institutionIds?.[0] || null
}

// Get batch ID from storage
const getBatchId = async (): Promise<string | null> => {
  const userData = await storage.getUserData()
  return userData?.runningBatchId || null
}

/**
 * Upload a file to the same endpoint as admin portal (S3 via /v1/image).
 * Returns the file URL to store in content.contentUrl.
 * Uses fetch() and web/native FormData handling like uploadAssignmentAttachment.
 */
export const uploadContentFile = async (
  file: { uri: string; name: string; type: string },
  institutionId?: string | null,
): Promise<string | null> => {
  try {
    const token = await storage.getToken()
    const instId = institutionId ?? (await getInstitutionId())
    const formData = new FormData()

    const isWeb = typeof file.uri === 'string' && (file.uri.startsWith('blob:') || file.uri.startsWith('data:'))

    if (isWeb) {
      const response = await fetch(file.uri)
      const blob = await response.blob()
      const fileObj = new File([blob], file.name || 'file', {
        type: file.type || 'application/octet-stream',
      })
      formData.append('file', fileObj)
    } else {
      formData.append('file', {
        uri: file.uri,
        name: file.name || 'file',
        type: file.type || 'application/octet-stream',
      } as any)
    }
    if (instId) formData.append('institutionId', instId)

    const uploadResponse = await fetch(`${api.defaults.baseURL}${IMAGE_UPLOAD_PATH}`, {
      method: 'POST',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: formData,
    })

    if (!uploadResponse.ok) {
      console.error('Upload content file failed:', uploadResponse.status, await uploadResponse.text())
      return null
    }

    const data = (await uploadResponse.json()) as ApiResponse<string> & { responseObject?: string; message?: string }
    const url = data?.responseObject ?? data?.message
    return url && typeof url === 'string' ? url : null
  } catch (e) {
    console.error('Upload content file failed:', e)
    return null
  }
}

// ==================== RESPONSE TYPES ====================
type ChaptersResponse = ApiResponse<Chapter[]>
type SectionsResponse = ApiResponse<ContentSection[]>
type ContentsResponse = ApiResponse<EContent[]>
type ContentStructureResponse = ApiResponse<ContentStructure>
type CoursesResponse = ApiResponse<CourseOption[]>
type YearsResponse = ApiResponse<YearOption[]>
type SubjectsResponse = ApiResponse<SubjectByCourseOption[]>

// ==================== CHAPTER APIS ====================

/** Params for getChapters (must match backend ChapterController: courseId, year, subjectId; section optional). */
export interface GetChaptersParams {
  courseId: string
  year: string
  subjectId: string
  section?: string
}

/** Get all chapters for a subject (course/year/section). Matches admin portal and backend ChapterController. */
export const getChapters = async (params: GetChaptersParams): Promise<ChaptersResponse | null> => {
  const { courseId, year, subjectId, section } = params
  if (!courseId?.trim() || !year?.trim() || !subjectId?.trim()) return null
  const res: ChaptersResponse | null = await api.get(CHAPTER_ENDPOINT, {
    params: { courseId, year, subjectId, ...(section?.trim() && { section: section.trim() }) },
  })
  return res
}

// Create a new chapter
export const createChapter = async (
  payload: ChapterPayload,
): Promise<ApiResponse<Chapter> | null> => {
  const institutionId = await getInstitutionId()
  const batchId = await getBatchId()
  if (!institutionId || !batchId) {
    throw new Error('Institution or batch is not set. Please update your profile or settings and try again.')
  }

  const res: ApiResponse<Chapter> | null = await api.post(CHAPTER_ENDPOINT, {
    ...payload,
    institutionId,
    batchId,
  })
  if (res && (res as ApiResponse<Chapter> & { error?: boolean }).error) {
    const msg = (res as ApiResponse<Chapter> & { errorMessage?: string }).errorMessage || (res as ApiResponse<Chapter> & { message?: string }).message
    throw new Error(msg || 'Failed to create chapter')
  }
  return res
}

// Update a chapter
export const updateChapter = async (
  chapterId: string,
  payload: Partial<ChapterPayload>,
): Promise<ApiResponse<Chapter> | null> => {
  const res: ApiResponse<Chapter> | null = await api.put(
    `${CHAPTER_ENDPOINT}/${chapterId}`,
    payload,
  )
  if (res && (res as ApiResponse<Chapter> & { error?: boolean }).error) {
    const msg = (res as ApiResponse<Chapter> & { errorMessage?: string }).errorMessage || (res as ApiResponse<Chapter> & { message?: string }).message
    throw new Error(msg || 'Failed to update chapter')
  }
  return res
}

// Delete a chapter (soft delete)
export const deleteChapter = async (chapterId: string): Promise<ApiResponse<boolean> | null> => {
  const res: ApiResponse<boolean> | null = await api.delete(`${CHAPTER_ENDPOINT}/${chapterId}`)
  return res
}

// Publish a chapter
export const publishChapter = async (chapterId: string): Promise<ApiResponse<Chapter> | null> => {
  const res: ApiResponse<Chapter> | null = await api.put(`${CHAPTER_ENDPOINT}/${chapterId}/publish`)
  return res
}

// Unpublish a chapter (move to draft)
export const unpublishChapter = async (chapterId: string): Promise<ApiResponse<Chapter> | null> => {
  const res: ApiResponse<Chapter> | null = await api.put(
    `${CHAPTER_ENDPOINT}/${chapterId}/unpublish`,
  )
  return res
}

// Reorder chapters
export const reorderChapters = async (
  chapterIds: string[],
): Promise<ApiResponse<Chapter[]> | null> => {
  const res: ApiResponse<Chapter[]> | null = await api.put(`${CHAPTER_ENDPOINT}/reorder`, {
    chapterIds,
  })
  return res
}

// ==================== SECTION APIS ====================

// Get all sections for a chapter
export const getSections = async (chapterId: string, status?: ContentStatus) => {
  const res: SectionsResponse | null = await api.get(SECTION_ENDPOINT, {
    params: {
      chapterId,
      ...(status && { status }),
    },
  })
  return res
}

// Create a new section
export const createSection = async (
  payload: SectionPayload,
): Promise<ApiResponse<ContentSection> | null> => {
  const institutionId = await getInstitutionId()
  if (!institutionId) {
    throw new Error('Institution is not set. Please update your profile or settings and try again.')
  }

  const res: ApiResponse<ContentSection> | null = await api.post(SECTION_ENDPOINT, {
    ...payload,
    institutionId,
  })
  if (res && (res as ApiResponse<ContentSection> & { error?: boolean }).error) {
    const msg = (res as ApiResponse<ContentSection> & { errorMessage?: string }).errorMessage || (res as ApiResponse<ContentSection> & { message?: string }).message
    throw new Error(msg || 'Failed to create section')
  }
  return res
}

// Update a section
export const updateSection = async (
  sectionId: string,
  payload: Partial<SectionPayload>,
): Promise<ApiResponse<ContentSection> | null> => {
  const res: ApiResponse<ContentSection> | null = await api.put(
    `${SECTION_ENDPOINT}/${sectionId}`,
    payload,
  )
  if (res && (res as ApiResponse<ContentSection> & { error?: boolean }).error) {
    const msg = (res as ApiResponse<ContentSection> & { errorMessage?: string }).errorMessage || (res as ApiResponse<ContentSection> & { message?: string }).message
    throw new Error(msg || 'Failed to update section')
  }
  return res
}

// Delete a section (soft delete)
export const deleteSection = async (sectionId: string): Promise<ApiResponse<boolean> | null> => {
  const res: ApiResponse<boolean> | null = await api.delete(`${SECTION_ENDPOINT}/${sectionId}`)
  return res
}

// Publish a section
export const publishSection = async (
  sectionId: string,
): Promise<ApiResponse<ContentSection> | null> => {
  const res: ApiResponse<ContentSection> | null = await api.put(
    `${SECTION_ENDPOINT}/${sectionId}/publish`,
  )
  return res
}

// Unpublish a section
export const unpublishSection = async (
  sectionId: string,
): Promise<ApiResponse<ContentSection> | null> => {
  const res: ApiResponse<ContentSection> | null = await api.put(
    `${SECTION_ENDPOINT}/${sectionId}/unpublish`,
  )
  return res
}

// Reorder sections within a chapter
export const reorderSections = async (
  sectionIds: string[],
): Promise<ApiResponse<ContentSection[]> | null> => {
  const res: ApiResponse<ContentSection[]> | null = await api.put(`${SECTION_ENDPOINT}/reorder`, {
    sectionIds,
  })
  return res
}

// Move section to a different chapter
export const moveSection = async (
  sectionId: string,
  targetChapterId: string,
  newSequence?: number,
): Promise<ApiResponse<ContentSection> | null> => {
  const res: ApiResponse<ContentSection> | null = await api.put(
    `${SECTION_ENDPOINT}/${sectionId}/move`,
    {
      chapterId: targetChapterId,
      newSequence,
    },
  )
  return res
}

// ==================== CONTENT APIS ====================

// Get all e-content with filters
export const getAllEContent = async (
  params: EContentListParams = {},
): Promise<ApiResponse<PagedContent<EContent>> | null> => {
  const institutionId = await getInstitutionId()
  if (!institutionId) return null

  const res: ApiResponse<PagedContent<EContent>> | null = await api.get(ENDPOINT, {
    params: {
      institutionId,
      page: params.page ?? 0,
      limit: params.limit ?? 10,
      ...(params.classId && { classId: params.classId }),
      ...(params.courseId && { courseId: params.courseId }),
      ...(params.year && { year: params.year }),
      ...(params.subjectId && { subjectId: params.subjectId }),
      ...(params.chapterId && { chapterId: params.chapterId }),
      ...(params.sectionId && { sectionId: params.sectionId }),
      ...(params.contentType && { contentType: params.contentType }),
      ...(params.status && { status: params.status }),
      ...(params.search && { search: params.search }),
    },
  })
  return res
}

// Get content by chapter
export const getContentByChapter = async (chapterId: string) => {
  const res: ContentsResponse | null = await api.get(`${ENDPOINT}/by-chapter/${chapterId}`)
  return res
}

// Get content by section
/** Get content items for a section. Uses TeacherController path /v1/teacher/content/by-section/{sectionId}. */
export const getContentBySection = async (sectionId: string): Promise<ContentsResponse | null> => {
  if (!sectionId?.trim()) return null
  const res: ContentsResponse | null = await api.get(`${TEACHER_CONTENT_BASE}/by-section/${sectionId}`)
  return res
}

// Get full content structure (hierarchical)
export const getContentStructure = async (subjectId: string) => {
  const institutionId = await getInstitutionId()
  const batchId = await getBatchId()
  if (!institutionId || !batchId) return null

  const res: ContentStructureResponse | null = await api.get(`${ENDPOINT}/structure`, {
    params: { institutionId, batchId, subjectId },
  })
  return res
}

// Get single e-content by ID
export const getEContentById = async (contentId: string): Promise<ApiResponse<EContent> | null> => {
  const res: ApiResponse<EContent> | null = await api.get(`${ENDPOINT}/${contentId}`)
  return res
}

// Upload new e-content with file
export const uploadEContent = async (
  file: { uri: string; name: string; type: string },
  metadata: EContentUploadMetadata,
): Promise<ApiResponse<EContent> | null> => {
  const institutionId = await getInstitutionId()
  if (!institutionId) return null

  const formData = new FormData()

  // Append file
  formData.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as any)

  // Append metadata fields (course/year preferred)
  formData.append('title', metadata.title)
  formData.append('courseId', metadata.courseId)
  formData.append('courseName', metadata.courseName)
  formData.append('year', metadata.year)
  formData.append('subjectId', metadata.subjectId)
  formData.append('subjectName', metadata.subjectName)
  if (metadata.classId) formData.append('classId', metadata.classId)
  if (metadata.className) formData.append('className', metadata.className)

  if (metadata.description) formData.append('description', metadata.description)
  if (metadata.chapter) formData.append('chapter', metadata.chapter)
  if (metadata.chapterId) formData.append('chapterId', metadata.chapterId)
  if (metadata.sectionId) formData.append('sectionId', metadata.sectionId)
  if (metadata.contentType) formData.append('contentType', metadata.contentType)
  if (metadata.status) formData.append('status', metadata.status)
  if (metadata.content) formData.append('content', metadata.content)
  if (metadata.dueDate) formData.append('dueDate', metadata.dueDate)
  if (metadata.maxMarks) formData.append('maxMarks', metadata.maxMarks.toString())
  if (metadata.assignmentInstructions) {
    formData.append('assignmentInstructions', metadata.assignmentInstructions)
  }

  // Don't set Content-Type header manually - let axios/RN set it with proper boundary
  const res: ApiResponse<EContent> | null = await api.post(ENDPOINT, formData, {
    params: { institutionId },
    headers: { 'Content-Type': undefined },
    transformRequest: (data) => data, // Prevent axios from transforming FormData
  })
  return res
}

/**
 * Build content payload for teacher/content API (same shape as admin portal).
 * Adds staffId, teacherName, postedDate from storage when not provided.
 */
export interface SubjectContentPayload {
  id?: string
  title: string
  description?: string
  content?: string
  contentType: ContentType
  contentUrl?: string
  status?: ContentStatus
  sectionId: string
  chapterId: string
  subjectId: string
  subjectName: string
  courseId?: string
  courseName?: string
  year?: string
  classId?: string
  className?: string
  staffId?: string
  teacherName?: string
  userName?: string
  postedDate?: string
  dueDate?: string
  maxMarks?: number
  assignmentInstructions?: string
}

// Create content (POST /v1/teacher/content – same as admin portal)
export const createContent = async (
  payload: SubjectContentPayload,
): Promise<ApiResponse<EContent> | null> => {
  const userData = await storage.getUserData()
  const staffId = payload.staffId ?? (userData?.staffDetails as { id?: string })?.id ?? userData?.id
  const sd = userData?.staffDetails as { firstName?: string; lastName?: string } | undefined
  const nameFromStaff =
    sd
      ? [sd.firstName ?? '', sd.lastName ?? ''].filter(Boolean).join(' ').trim() || (userData?.username ?? '')
      : (userData?.username ?? '')
  const teacherName = payload.teacherName ?? nameFromStaff
  const postedDate = payload.postedDate ?? new Date().toISOString().split('T')[0]
  const body = {
    ...payload,
    classId: payload.classId ?? payload.courseId,
    className: payload.className ?? payload.courseName,
    staffId: staffId ?? undefined,
    teacherName: teacherName || undefined,
    postedDate,
    active: true,
  }
  const res: ApiResponse<EContent> | null = await api.post(TEACHER_CONTENT_BASE, body)
  if (res && (res as ApiResponse<EContent> & { error?: boolean }).error) {
    const msg = (res as ApiResponse<EContent> & { errorMessage?: string }).errorMessage || (res as ApiResponse<EContent> & { message?: string }).message
    throw new Error(msg || 'Failed to create content')
  }
  return res
}

// Update content (PUT /v1/teacher/content with body including id – same as admin portal)
export const updateContent = async (
  payload: SubjectContentPayload & { id: string },
): Promise<ApiResponse<EContent> | null> => {
  const res: ApiResponse<EContent> | null = await api.put(TEACHER_CONTENT_BASE, payload)
  if (res && (res as ApiResponse<EContent> & { error?: boolean }).error) {
    const msg = (res as ApiResponse<EContent> & { errorMessage?: string }).errorMessage || (res as ApiResponse<EContent> & { message?: string }).message
    throw new Error(msg || 'Failed to update content')
  }
  return res
}

// Legacy alias for update (teacher/content)
export const updateEContent = async (
  contentId: string,
  payload: Partial<SubjectContentPayload>,
): Promise<ApiResponse<EContent> | null> => {
  return updateContent({ ...payload, id: contentId } as SubjectContentPayload & { id: string })
}

// Delete content (uses teacher/content when backend supports it)
export const deleteEContent = async (contentId: string): Promise<ApiResponse<boolean> | null> => {
  const res: ApiResponse<boolean> | null = await api.delete(`${TEACHER_CONTENT_BASE}/${contentId}`)
  return res
}

// Publish content (PUT /v1/teacher/content/{id}/publish – same as portal)
export const publishContent = async (contentId: string): Promise<ApiResponse<EContent> | null> => {
  const res: ApiResponse<EContent> | null = await api.put(`${TEACHER_CONTENT_BASE}/${contentId}/publish`)
  return res
}

// Unpublish content (PUT /v1/teacher/content/{id}/unpublish – same as portal)
export const unpublishContent = async (
  contentId: string,
): Promise<ApiResponse<EContent> | null> => {
  const res: ApiResponse<EContent> | null = await api.put(`${TEACHER_CONTENT_BASE}/${contentId}/unpublish`)
  return res
}

// Reorder content (PUT /v1/teacher/content/reorder – same as portal)
export const reorderContent = async (
  contentIds: string[],
): Promise<ApiResponse<EContent[]> | null> => {
  const res: ApiResponse<EContent[]> | null = await api.put(`${TEACHER_CONTENT_BASE}/reorder`, { contentIds })
  return res
}

// Move content (PUT /v1/teacher/content/{id}/move – same as portal)
export const moveContent = async (
  contentId: string,
  targetSectionId: string,
  newSequence?: number,
): Promise<ApiResponse<EContent> | null> => {
  const res: ApiResponse<EContent> | null = await api.put(`${TEACHER_CONTENT_BASE}/${contentId}/move`, {
    sectionId: targetSectionId,
    newSequence,
  })
  return res
}

// View/stream file - returns blob URL
export const viewEContent = async (contentId: string): Promise<string | null> => {
  try {
    const response = await api.get(`${ENDPOINT}/${contentId}/view`, {
      responseType: 'blob',
    })
    if (response) {
      return `${api.defaults.baseURL}${ENDPOINT}/${contentId}/view`
    }
    return null
  } catch (error) {
    console.error('Error viewing e-content:', error)
    return null
  }
}

// ==================== UTILITY FUNCTIONS ====================

export const getFileIcon = (mimeType?: string): string => {
  if (!mimeType) return 'doc.fill'
  if (mimeType.startsWith('video/')) return 'video.fill'
  if (mimeType.startsWith('image/')) return 'photo.fill'
  if (mimeType.startsWith('audio/')) return 'music.note'
  if (mimeType.includes('pdf')) return 'doc.fill'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'doc.text.fill'
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint'))
    return 'play.rectangle.fill'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'tablecells.fill'
  return 'doc.fill'
}

export const getContentTypeIcon = (contentType?: ContentType): string => {
  switch (contentType) {
    case ContentType.NOTES:
      return 'doc.text.fill'
    case ContentType.DOCUMENT:
      return 'doc.fill'
    case ContentType.VIDEO:
      return 'video.fill'
    case ContentType.LINK:
      return 'link'
    case ContentType.ASSIGNMENT:
      return 'checkmark.square.fill'
    case ContentType.IMAGE:
      return 'photo.fill'
    case ContentType.AUDIO:
      return 'music.note'
    default:
      return 'doc.fill'
  }
}

export const getFileColor = (mimeType?: string): string => {
  if (!mimeType) return '#6b7280'
  if (mimeType.startsWith('video/')) return '#8b5cf6' // purple
  if (mimeType.startsWith('image/')) return '#10b981' // green
  if (mimeType.startsWith('audio/')) return '#f59e0b' // orange
  if (mimeType.includes('pdf')) return '#ef4444' // red
  if (mimeType.includes('word') || mimeType.includes('document')) return '#3b82f6' // blue
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '#f59e0b' // orange
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '#10b981' // green
  return '#6b7280' // grey
}

export const getContentTypeColor = (contentType?: ContentType): string => {
  switch (contentType) {
    case ContentType.NOTES:
      return '#3b82f6' // blue
    case ContentType.DOCUMENT:
      return '#ef4444' // red
    case ContentType.VIDEO:
      return '#8b5cf6' // purple
    case ContentType.LINK:
      return '#06b6d4' // cyan
    case ContentType.ASSIGNMENT:
      return '#f59e0b' // orange
    case ContentType.IMAGE:
      return '#10b981' // green
    case ContentType.AUDIO:
      return '#ec4899' // pink
    default:
      return '#6b7280' // grey
  }
}

export const getFileTypeLabel = (mimeType?: string): string => {
  if (!mimeType) return 'File'
  if (mimeType.startsWith('video/')) return 'Video'
  if (mimeType.startsWith('image/')) return 'Image'
  if (mimeType.startsWith('audio/')) return 'Audio'
  if (mimeType.includes('pdf')) return 'PDF'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'Document'
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'Presentation'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'Spreadsheet'
  return 'File'
}

export const getContentTypeLabel = (contentType?: ContentType): string => {
  switch (contentType) {
    case ContentType.NOTES:
      return 'Notes'
    case ContentType.DOCUMENT:
      return 'Document'
    case ContentType.VIDEO:
      return 'Video'
    case ContentType.LINK:
      return 'Link'
    case ContentType.ASSIGNMENT:
      return 'Assignment'
    case ContentType.IMAGE:
      return 'Image'
    case ContentType.AUDIO:
      return 'Audio'
    default:
      return 'Other'
  }
}

export const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export const isImage = (mimeType?: string): boolean => {
  return mimeType?.startsWith('image/') ?? false
}

export const isPdf = (mimeType?: string): boolean => {
  return mimeType?.includes('pdf') ?? false
}

export const isVideo = (mimeType?: string): boolean => {
  return mimeType?.startsWith('video/') ?? false
}

export const isAudio = (mimeType?: string): boolean => {
  return mimeType?.startsWith('audio/') ?? false
}

// ==================== COURSE/SUBJECT APIS ====================

// Get classes for the teacher
export const getTeacherClasses = async (): Promise<ApiResponse<ClassOption[]> | null> => {
  const userData = await storage.getUserData()
  const batchId = userData?.runningBatchId
  if (!batchId) return null

  const res: ApiResponse<ClassOption[]> | null = await api.get('/v1/teacher/classes', {
    params: { batchId },
  })
  return res
}

// Get subjects by class
export const getSubjectsByClass = async (
  classId: string,
): Promise<ApiResponse<SubjectOption[]> | null> => {
  const userData = await storage.getUserData()
  const batchId = userData?.runningBatchId
  if (!batchId) return null

  const res: ApiResponse<SubjectOption[]> | null = await api.get('/v1/teacher/subjects', {
    params: { batchId, classId },
  })
  return res
}

// Get list of courses for the teacher's current batch
export const getCourses = async () => {
  const batchId = await getBatchId()
  if (!batchId) return null
  const res: CoursesResponse | null = await api.get(`/v1/course/batch/${batchId}`)
  return res
}

// Get years for a specific course
export const getCourseYears = async (courseId: string) => {
  const res: YearsResponse | null = await api.get(`/v1/course/${courseId}/years`)
  return res
}

// Get subjects by course and year
export const getSubjectsByCourseYear = async (
  courseId: string,
  year: string,
  section?: string
) => {
  const res: SubjectsResponse | null = await api.get(`/v1/subject/course/${courseId}/year/${year}`, {
    params: section ? { section } : undefined,
  })
  return res
}

// Get teacher's assigned subjects
export const getAssignedSubjects = async () => {
  const userData = await storage.getUserData()
  const batchId = userData?.runningBatchId
  if (!batchId) return null

  const res: SubjectsResponse | null = await api.get('/v1/teacher/assigned-subjects', {
    params: { batchId },
  })
  return res
}

// ==================== CONTENT TYPE OPTIONS ====================
export const CONTENT_TYPE_OPTIONS = [
  { value: ContentType.NOTES, label: 'Notes', icon: 'doc.text.fill', color: '#3b82f6' },
  { value: ContentType.DOCUMENT, label: 'Document', icon: 'doc.fill', color: '#ef4444' },
  { value: ContentType.VIDEO, label: 'Video', icon: 'video.fill', color: '#8b5cf6' },
  { value: ContentType.LINK, label: 'Link', icon: 'link', color: '#06b6d4' },
  {
    value: ContentType.ASSIGNMENT,
    label: 'Assignment',
    icon: 'checkmark.square.fill',
    color: '#f59e0b',
  },
  { value: ContentType.IMAGE, label: 'Image', icon: 'photo.fill', color: '#10b981' },
  { value: ContentType.AUDIO, label: 'Audio', icon: 'music.note', color: '#ec4899' },
  { value: ContentType.OTHER, label: 'Other', icon: 'doc.fill', color: '#6b7280' },
]

export const STATUS_OPTIONS = [
  { value: ContentStatus.DRAFT, label: 'Draft', color: '#6b7280' },
  { value: ContentStatus.PUBLISHED, label: 'Published', color: '#10b981' },
]
