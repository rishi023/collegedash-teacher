import { api, ApiResponse } from './axios'

interface LoginPayload {
  username: string
  password: string
}

type LoginResponse = ApiResponse<{
  token: string
  type: string
  user: {
    id: string
    institutionIds: string[]
    organisationId: string
    runningBatchId: string
    username: string
    firstName: string
    email: string
    activated: true
    roles: string[]
    permissions: string[]
  }
  newUser: true
}>

interface StudentInfo {
  batchId: string
  batchName: string
  institutionId: string
  studentId: string
  rollNumber: number
  admissionNumber: number
  classId: string
  className: string
  section: string
  name: string
}

interface StudentDetails {
  studentInfo: StudentInfo
  studentId: string
  name: string
  imageUrl: string
  className: string
  classId: string
  section: string
  rollNo: number
  batchName: string
  batchId: string
  institutionId: string
  fatherName: string
  motherName: string | null
  mobile: string
  dob: string
  admissionNo: number
  admissionDate: string
  gender: 'MALE'
  bloodGroup: string | null
  address: string | null
  houseName: string | null
  state: string | null
  country: string | null
  district: string | null
  pinCode: string | null
}

type StudentDetailsResponse = ApiResponse<StudentDetails>

type StudentProfile = Omit<StudentDetails, 'studentInfo'> & StudentInfo

export const signIn = async (payload: LoginPayload) => {
  const res: LoginResponse | null = await api.post('/auth/signin', payload)
  return res
}

export const getStudentProfile = async (userId: string): Promise<StudentProfile | null> => {
  const res: StudentDetailsResponse | null = await api.get(`/v1/app/student/profile`, {
    params: { userId },
  })

  if (res) {
    const { studentInfo, ...rest } = res.responseObject
    return { ...rest, ...studentInfo }
  }

  return null
}

interface SubjectHomework {
  subjectName: string
  homework: string
  attachmentUrls?: string[]
}

interface HomeworkData {
  id: string
  classId: string
  grade: string
  section: string
  date: string
  subjectHomeworkList: SubjectHomework[]
  published: boolean
}

type HomeworkResponse = ApiResponse<HomeworkData>

export const getHomeworkByDay = async (classId: string, section: string, date: string) => {
  const res: HomeworkResponse | null = await api.get(
    `/v1/homework/day?classId=${classId}&section=${section}&date=${date}`,
  )
  return res
}

/** Fetch homework for a day by course/year/section (for staff app). */
export const getHomeworkByDayByCourse = async (
  courseId: string,
  year: string,
  section: string | undefined,
  date: string
) => {
  const res = await api.get<ApiResponse<HomeworkData>>(
    `/v1/homework/course/${courseId}/year/${encodeURIComponent(year)}/day`,
    { params: { section: section ?? '', date } }
  )
  return (res?.data as ApiResponse<HomeworkData> | undefined)?.responseObject ?? null
}

/** Upload an image or PDF for assignment attachment. Returns the file URL on success. */
export const uploadAssignmentAttachment = async (
  file: { uri: string; name: string; type: string },
): Promise<string | null> => {
  const formData = new FormData()
  formData.append('file', {
    uri: file.uri,
    name: file.name || 'attachment',
    type: file.type || 'application/octet-stream',
  } as any)
  const res: ApiResponse<string> | null = await api.post('/v1/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res?.responseObject ?? null
}

export interface AttendanceRecord {
  studentId: string
  admissionNumber: number
  rollNumber: number
  studentName: string
  fatherName: string
  contactNumber: string
  remarks: string
  present: boolean
  date: string
}

type AttendanceResponse = ApiResponse<AttendanceRecord[]>

/** Legacy: by classId/section. For course/year use attendance/course/{courseId}/year/{year} endpoints. */
export const getStudentAttendance = async (
  classId: string,
  section: string,
  studentId: string,
  startDate: string,
  endDate: string,
) => {
  const res: AttendanceResponse | null = await api.get(
    `/v1/attendance/class/${classId}/section/${section}/student/${studentId}?startDate=${startDate}&endDate=${endDate}`,
  )
  return res
}

interface SortInfo {
  direction: string
  nullHandling: string
  ascending: boolean
  property: string
  ignoreCase: boolean
}

interface Pageable {
  pageNumber: number
  pageSize: number
  offset: number
  sort: SortInfo[]
  paged: boolean
  unpaged: boolean
}

export interface Announcement {
  id: string
  institutionId: string
  type: 'NOTICE' | 'EVENT' | 'ALERT'
  title: string
  description: string
  imageUrls?: string[]
  contentUrls: string[]
  postedOn: string
  createdAt: string
  updatedAt: string
}

interface PagedResponse<T> {
  totalPages: number
  totalElements: number
  pageable: Pageable
  size: number
  content: T[]
  number: number
  sort: SortInfo[]
  numberOfElements: number
  first: boolean
  last: boolean
  empty: boolean
}

type AnnouncementResponse = ApiResponse<PagedResponse<Announcement>>

/** Fetch announcements with pagination. Latest first (postedOn,desc). type filters by NOTICE, TENDER, etc.; omit for all. */
export const getAnnouncements = async (
  institutionId: string,
  page = 0,
  size = 30,
  sort = 'postedOn,desc',
  type?: string
) => {
  const res: AnnouncementResponse | null = await api.get('/v1/app/student/public/announcement', {
    params: { institutionId, page, size, sort, ...(type ? { type } : {}) },
  })
  return res
}

interface ChangePasswordPayload {
  oldPassword: string
  newPassword: string
}

export const changePassword = async (payload: ChangePasswordPayload) => {
  const res = await api.put<boolean>('/v1/users/password/change', payload)
  return res
}

// Staff Profile Types
export interface StaffAddress {
  country: string
  state: string
  city: string
  district: string
  pinCode: string
  addLineOne: string
  addLineTwo: string
  landmark: string
}

export interface StaffAccount {
  bankName: string
  bankAccountName: string
  bankBranch: string
  ifscCode: string
  pfAccNo: string
  esiAccNo: string
  active: string
}

export interface StaffLoginDetails {
  loginId: string
  password: string
  userId: string
}

export interface StaffParentsDetails {
  fatherName: string
  motherName: string
  motherAadhar: string
  fatherAadhar: string
  fatherEducation: string
  fatherPhotoUrl: string
  motherPhotoUrl: string
  motherEducation: string
  legalGuardianName: string
  familyAnnualIncome: string
  fatherOccupation: string
  motherOccupation: string
}

export interface StaffProfile {
  id: string
  userId: string
  institutionId: string
  empCode: string
  firstName: string
  lastNme: string
  imageUrl: string
  gender: string
  mobileNo: string
  email: string
  alternateNo: string
  dob: string
  doj: string
  bloodGrp: string
  panCardNo: string
  aadharNo: string
  qualification: string
  degree: string
  married: string
  jobStatus: string
  jobType: string
  jobFunction: string | null
  role: string
  account: StaffAccount
  loginDetails: StaffLoginDetails
  sendSms: boolean
  sendWelcomeSms: boolean
  parentsDetails: StaffParentsDetails
  familyMemberList: unknown[]
  active: boolean
  deactivatedForReason: string | null
  deactivatedRemarks: string | null
  activatedRemarks: string | null
  caddress: StaffAddress
  paddress: StaffAddress
}

export const getStaffProfile = async (): Promise<StaffProfile | null> => {
  const res = (await api.get('/v1/staff/profile')) as ApiResponse<StaffProfile> | null
  return res?.responseObject ?? null
}

/** Current user's institution (logo, address, lat/long for geo-check, etc.). Requires auth. */
export interface Institution {
  id: string
  name: string
  address?: { line1?: string; city?: string; state?: string; country?: string; pinCode?: string }
  logoUrl?: string
  principalSignatureUrl?: string
  website?: string
  contacts?: string[]
  emailIds?: string[]
  latitude?: number
  longitude?: number
}

export const getCurrentInstitution = async (): Promise<Institution | null> => {
  const res = (await api.get('/v1/institution/me')) as ApiResponse<Institution> | null
  return res?.responseObject ?? null
}

/** E-content item for dashboard (recent content). */
export interface SubjectContentSummary {
  id: string
  title?: string
  description?: string
  contentType?: string
  contentUrl?: string
  subjectName?: string
  courseId?: string
  year?: string
  postedDate?: string
}

/** Dashboard summary: recent announcements, news, and e-content in one call (staff app). */
export interface DashboardSummary {
  recentAnnouncements: Announcement[]
  recentNews: NewsItem[]
  recentContent: SubjectContentSummary[]
}

export interface NewsItem {
  id: string
  institutionId: string
  title?: string
  content?: string
  imageUrl?: string
  imageUrls?: string[]
  postedOn?: string
  author?: string
}

interface NewsPage {
  content: NewsItem[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

type NewsResponse = ApiResponse<NewsPage>

/** Fetch news with pagination. Latest first. */
export const getNews = async (institutionId: string, page = 0, size = 20) => {
  const res: NewsResponse | null = await api.get('/v1/app/student/news', {
    params: { institutionId, page, size, sort: 'postedOn,desc' },
  })
  return res
}

export const getDashboardSummary = async (): Promise<DashboardSummary | null> => {
  const res = (await api.get('/v1/app/staff/dashboard')) as ApiResponse<DashboardSummary> | null
  return res?.responseObject ?? null
}

/** Assigned subject for staff app (course/year/section). */
export interface StaffSubjectItem {
  courseId?: string
  courseName?: string
  year?: string
  section?: string
  subjectId?: string
  subjectName?: string
  className?: string
  classId?: string
  skillName?: string
  subSkillName?: string
}

export const getMySubjects = async (): Promise<StaffSubjectItem[] | null> => {
  const res = (await api.get('/v1/app/staff/subjects')) as ApiResponse<StaffSubjectItem[]> | null
  return res?.responseObject ?? null
}

/** Staff payroll summary for payslips list. */
export interface StaffPayrollSummary {
  id: string
  staffId?: string
  periodId?: string
  status?: string
  grossEarnings?: number
  grossDeductions?: number
  netPayable?: number
  payrollDate?: string
  staffSnapshot?: { name?: string; empCode?: string }
  attendanceSnapshot?: { year?: number; month?: number }
}

export const getMyPayslips = async (): Promise<StaffPayrollSummary[] | null> => {
  const res = await api.get<ApiResponse<StaffPayrollSummary[]>>('/v1/app/staff/payslips')
  return (res as ApiResponse<StaffPayrollSummary[]> | null)?.responseObject ?? null
}

/** Single payslip for current staff (by payroll id). */
export interface PayslipDetail {
  payrollId: string
  period?: string
  staffSnapshot?: { name?: string; empCode?: string; department?: string; designation?: string }
  attendanceSnapshot?: { year?: number; month?: number; workingDays?: number; presentDays?: number }
  earnings?: { componentName?: string; amount?: number }[]
  deductions?: { componentName?: string; amount?: number }[]
  grossEarnings?: number
  grossDeductions?: number
  netPayable?: number
  paymentInfo?: { paymentMode?: string; paidAt?: string; paidBy?: string }
  payrollDate?: string
}

export const getMyPayslip = async (payrollId: string): Promise<PayslipDetail | null> => {
  const res = await api.get<ApiResponse<PayslipDetail>>(`/v1/app/staff/payslips/${payrollId}`)
  return (res as ApiResponse<PayslipDetail> | null)?.responseObject ?? null
}

/** Timetable slots for the logged-in teacher (current batch). */
export interface TimetableSlotItem {
  id: string
  dayOfWeek: string
  period: number
  startTime: string
  endTime: string
  subjectId?: string
  subjectName?: string
  staffId?: string
  staffName?: string
  room?: string
  courseId?: string
  courseName?: string
  year?: string
  section?: string
}

export const getMyTimetable = async (batchId: string): Promise<TimetableSlotItem[] | null> => {
  const res = await api.get<ApiResponse<TimetableSlotItem[]>>('/v1/app/staff/timetable', {
    params: { batchId },
  })
  return (res as ApiResponse<TimetableSlotItem[]> | null)?.responseObject ?? null
}

/** My attendance report (current staff only). Optional date range. */
export const getMyAttendanceReport = async (
  startDate?: string,
  endDate?: string
): Promise<StaffAttendance[] | null> => {
  const res = await api.get<ApiResponse<StaffAttendance[]>>('/v1/app/staff/attendance/report', {
    params: { startDate, endDate },
  })
  return (res as ApiResponse<StaffAttendance[]> | null)?.responseObject ?? null
}

// Staff Attendance Types
export interface StaffAttendance {
  id?: string
  staffId: string
  institutionId: string
  name: string
  code: string
  inTime: string
  outTime: string
  attendanceDate: string
  remarks: string
}

export interface StaffAttendancePayload {
  staffId: string
  institutionId: string
  name: string
  code: string
  inTime: string
  outTime: string
  attendanceDate: string
  remarks: string
  latitude?: number
  longitude?: number
}

export const markStaffAttendance = async (payload: StaffAttendancePayload) => {
  const res = await api.post<StaffAttendance>('/v1/staff/attendance', payload)
  return res
}

export const updateStaffAttendance = async (payload: StaffAttendancePayload & { id: string }) => {
  const res = await api.put<StaffAttendance>('/v1/staff/attendance', payload)
  return res
}

export const getStaffAttendanceByDate = async (
  // staffId: string,
  startDate: string,
  // endDate: string
) => {
  const res = await api.get<StaffAttendance[]>(`/v1/staff/attendance/day`, {
    params: { startDate },
  })
  return res
}

export const getStaffAttendanceReport = async (
  staffId: string,
  startDate: string,
  endDate: string,
) => {
  const res = await api.get<StaffAttendance[]>(`/v1/staff/${staffId}/attendance`, {
    params: { startDate, endDate },
  })
  return res
}

export interface Subject {
  className: string
  classId: string
  sectionName: string
  subjectName: string
  staffId: string
  teacherName: string
}

type SubjectsResponse = ApiResponse<Subject[]>

export const getSubjects = async (batchId: string, classId: string, section: string) => {
  const res: SubjectsResponse | null = await api.get('/v1/app/student/subject/list', {
    params: { batchId, classId, section },
  })
  return res
}

export interface Term {
  id: string
  name: string
  institutionId: string
  batchId: string
  batchName: string
  startDate: string
  endDate: string
  totalWorkingDays: number
  fullDayCount: number
  halfDayCount: number
  holidayCount: number
}

export const getTerms = async (institutionId: string) => {
  const res = await api.get<Term[]>('/v1/exams/es/term/all', {
    params: { institutionId },
  })
  return res
}

interface SubjectMark {
  id: string
  subjectName: string
  subjectId: string
  marksObtained: number
}

interface StudentExamMarks {
  studentSubjectMarks: SubjectMark[]
  examName: string
  examActivityName: string
}

export interface ExamMarksData {
  termName: string
  studentExamMarksList: StudentExamMarks[]
}

type ExamMarksResponse = ApiResponse<ExamMarksData>

export const getExamMarks = async (studentId: string, termId: string, classId: string) => {
  const res: ExamMarksResponse | null = await api.get('/v1/app/student/exam/marks', {
    params: { studentId, termId, classId },
  })
  return res
}

interface PayableItem {
  payableId: string
  feeId: string
  trustId: string
  batchId: string
  institutionId: string
  feeName: string
  period: string
  amount: number
  paid: number
  dues: number
  fine: number
  discount: number
  toPay: number
  payingNow: number
  paidFees: boolean
  type: string
}

export interface PaymentRecord {
  id: string
  institutionId: string
  orderId: string
  batchId: string
  studentId: string
  classId: string
  section: string
  currentPayableAmount: number
  upcomingPayableAmount: number
  additionalFeeAmount: number
  demandFeeAmount: number
  paidDate: string
  payableList: PayableItem[]
  paymentType: 'CASH' | 'ONLINE' | 'CHEQUE' | 'DD'
  remarks: string
  collectedBy: string
  updatedDate: string
  updatedBy: string
}

type PaymentRecordsResponse = ApiResponse<PaymentRecord[]>

export const getStudentPaymentRecords = async (batchId: string, studentId: string) => {
  const res: PaymentRecordsResponse | null = await api.get(
    '/v1/app/student/student/payment/record',
    {
      params: { batchId, studentId },
    },
  )
  return res
}
