// API Response wrapper
export interface ApiResponse<T> {
  status: string
  timeStamp: string
  message: string
  debugMessage: string
  responseObject: T
  apiResponseStatus: {
    code: number
    message: string
  }
  planActive: boolean
  userDisabled: boolean
  error: Record<string, string[]>
  errorMessage: string
}

// Section
export interface Section {
  name: string
  active: boolean
  classTeacherName: string | null
  classTeacherId: string | null
  imageUrl: string | null
  sequence: number
}

// Subject
export interface Subject {
  subjectId: string
  name: string
  subCode: string
  colorCode: string
  sequence: number
  credits: number | null
  theoryHours: number | null
  practicalHours: number | null
  tutorialHours: number | null
  subjectType: string | null
  active: boolean
  graded: boolean
  reportCardApplicable: boolean
  applicableForTotal: boolean
}

// Year (Class)
export interface Year {
  name: string
  sequence: number
  active: boolean
  sections: Section[]
  subjects: Subject[]
}

// Course
export interface Course {
  id: string
  institutionId: string | null
  departmentId: string
  departmentName: string
  name: string
  code: string
  duration: number
  batchId: string
  years: Year[]
  sections: Section[]
  subjects: Subject[]
  coScholasticSubjects: any[]
  active: boolean
  sequence: number
  grade: string | null
}

// Homework item for saving
export interface HomeworkItem {
  subjectName: string
  homework: string
  /** URLs of attached images or PDFs (from upload). */
  attachmentUrls?: string[]
}

// Homework payload
export interface HomeworkPayload {
  date: string
  courseId: string
  year: string
  section: string
  courseName: string
  classId: string
  grade: string
  id: null
  published: boolean
  subjectHomeworkList: HomeworkItem[]
}

// Attendance types
export interface StudentAttendance {
  studentId: string
  admissionNumber: string
  rollNumber: number
  studentName: string
  fatherName: string
  contactNumber: string
  present: boolean
  remarks: string | null
  date: string | null
}

export interface AttendancePayload {
  batchId: string
  courseId: string
  courseName: string
  year: string
  section: string
  classId: string
  grade: string
  date: string
  id: string | null
  studentAttendance: StudentAttendance[]
}
