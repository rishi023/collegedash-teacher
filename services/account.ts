import { api } from './axios'

interface LoginPayload {
  username: string
  password: string
}

interface ApiResponse<T> {
  status: string
  timeStamp: string
  message: string
  debugMessage: string
  apiResponseStatus: string
  responseObject: T
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
    `/v1/homework/day?classId=${classId}&section=${section}&date=${date}`
  )
  return res
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

export const getStudentAttendance = async (
  classId: string,
  section: string,
  studentId: string,
  startDate: string,
  endDate: string
) => {
  const res: AttendanceResponse | null = await api.get(
    `/v1/attendance/class/${classId}/section/${section}/student/${studentId}?startDate=${startDate}&endDate=${endDate}`
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

export const getAnnouncements = async (institutionId: string) => {
  const res: AnnouncementResponse | null = await api.get('/v1/app/student/public/announcement', {
    params: { institutionId },
  })
  return res
}

interface ChangePasswordPayload {
  oldPassword: string
  newPassword: string
}

interface ChangePasswordResponseObject {
  timeStamp: string
  responseObject: boolean
  apiResponseStatus: {
    code: number
    message: string
  }
  planActive: boolean
  userDisabled: boolean
}

export const changePassword = async (payload: ChangePasswordPayload) => {
  const res: ChangePasswordResponseObject | null = await api.put(
    '/v1/users/password/change',
    payload
  )
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

interface TermsResponseObject {
  timeStamp: string
  responseObject: Term[]
  apiResponseStatus: {
    code: number
    message: string
  }
  planActive: boolean
  userDisabled: boolean
}

export const getTerms = async (institutionId: string) => {
  const res: TermsResponseObject | null = await api.get('/v1/exams/es/term/all', {
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
    }
  )
  return res
}
