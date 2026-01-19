export interface Assignment {
  id: string
  title: string
  subject: string
  description: string
  dueDate: string
  submissionDate?: string
  status: 'Pending' | 'Submitted' | 'Overdue'
  marks?: number
  totalMarks: number
}

export interface TimeSlot {
  id: string
  day: string
  period: number
  startTime: string
  endTime: string
  subject: string
  teacher: string
  room: string
}

export interface Notification {
  id: string
  title: string
  message: string
  type: 'Assignment' | 'Announcement' | 'Fee' | 'Exam' | 'Holiday' | 'Event' | 'General'
  date: string
  priority: 'High' | 'Medium' | 'Low'
  status: 'Read' | 'Unread'
}

export const dummyAssignments: Assignment[] = [
  {
    id: '1',
    title: 'Algebra Problem Set',
    subject: 'Mathematics',
    description: 'Complete exercises 1-20 from chapter 5',
    dueDate: '2025-07-25',
    status: 'Pending',
    totalMarks: 50,
  },
  {
    id: '2',
    title: 'Science Lab Report',
    subject: 'Science',
    description: 'Write a detailed report on the photosynthesis experiment',
    dueDate: '2025-07-23',
    submissionDate: '2025-07-22',
    status: 'Submitted',
    marks: 45,
    totalMarks: 50,
  },
  {
    id: '3',
    title: 'Essay on Climate Change',
    subject: 'English',
    description: 'Write a 500-word essay on climate change impact',
    dueDate: '2025-07-20',
    status: 'Overdue',
    totalMarks: 30,
  },
]

export const dummyTimetable: TimeSlot[] = [
  // Monday
  {
    id: '1',
    day: 'Monday',
    period: 1,
    startTime: '08:00',
    endTime: '08:45',
    subject: 'Mathematics',
    teacher: 'Mr. Kumar',
    room: 'A107',
  },
  {
    id: '2',
    day: 'Monday',
    period: 2,
    startTime: '08:45',
    endTime: '09:30',
    subject: 'English',
    teacher: 'Ms. Sharma',
    room: 'A102',
  },
  {
    id: '3',
    day: 'Monday',
    period: 3,
    startTime: '09:45',
    endTime: '10:30',
    subject: 'Science',
    teacher: 'Dr. Patel',
    room: 'Lab1',
  },
  {
    id: '4',
    day: 'Monday',
    period: 4,
    startTime: '10:30',
    endTime: '11:15',
    subject: 'Social Studies',
    teacher: 'Mrs. Singh',
    room: 'A103',
  },
  {
    id: '5',
    day: 'Monday',
    period: 5,
    startTime: '11:30',
    endTime: '12:15',
    subject: 'Hindi',
    teacher: 'Mr. Gupta',
    room: 'A104',
  },
  {
    id: '6',
    day: 'Monday',
    period: 6,
    startTime: '12:15',
    endTime: '13:00',
    subject: 'Physical Education',
    teacher: 'Coach Rao',
    room: 'Ground',
  },

  // Tuesday
  {
    id: '7',
    day: 'Tuesday',
    period: 1,
    startTime: '08:00',
    endTime: '08:45',
    subject: 'Science',
    teacher: 'Dr. Patel',
    room: 'Lab1',
  },
  {
    id: '8',
    day: 'Tuesday',
    period: 2,
    startTime: '08:45',
    endTime: '09:30',
    subject: 'Mathematics',
    teacher: 'Mr. Kumar',
    room: 'A107',
  },
  {
    id: '9',
    day: 'Tuesday',
    period: 3,
    startTime: '09:45',
    endTime: '10:30',
    subject: 'English',
    teacher: 'Ms. Sharma',
    room: 'A102',
  },
  {
    id: '10',
    day: 'Tuesday',
    period: 4,
    startTime: '10:30',
    endTime: '11:15',
    subject: 'Computer Science',
    teacher: 'Mr. Tech',
    room: 'ComLab',
  },
  {
    id: '11',
    day: 'Tuesday',
    period: 5,
    startTime: '11:30',
    endTime: '12:15',
    subject: 'Art',
    teacher: 'Ms. Creative',
    room: 'Art Room',
  },
  {
    id: '12',
    day: 'Tuesday',
    period: 6,
    startTime: '12:15',
    endTime: '13:00',
    subject: 'Music',
    teacher: 'Mr. Melody',
    room: 'Music Room',
  },

  // Wednesday
  {
    id: '13',
    day: 'Wednesday',
    period: 1,
    startTime: '08:00',
    endTime: '08:45',
    subject: 'Mathematics',
    teacher: 'Mr. Kumar',
    room: 'A107',
  },
  {
    id: '14',
    day: 'Wednesday',
    period: 2,
    startTime: '08:45',
    endTime: '09:30',
    subject: 'Social Studies',
    teacher: 'Mrs. Singh',
    room: 'A103',
  },
  {
    id: '15',
    day: 'Wednesday',
    period: 3,
    startTime: '09:45',
    endTime: '10:30',
    subject: 'Science',
    teacher: 'Dr. Patel',
    room: 'Lab1',
  },
  {
    id: '16',
    day: 'Wednesday',
    period: 4,
    startTime: '10:30',
    endTime: '11:15',
    subject: 'English',
    teacher: 'Ms. Sharma',
    room: 'A102',
  },
  {
    id: '17',
    day: 'Wednesday',
    period: 5,
    startTime: '11:30',
    endTime: '12:15',
    subject: 'Hindi',
    teacher: 'Mr. Gupta',
    room: 'A104',
  },
  {
    id: '18',
    day: 'Wednesday',
    period: 6,
    startTime: '12:15',
    endTime: '13:00',
    subject: 'Library',
    teacher: 'Librarian',
    room: 'Library',
  },

  // Thursday
  {
    id: '19',
    day: 'Thursday',
    period: 1,
    startTime: '08:00',
    endTime: '08:45',
    subject: 'English',
    teacher: 'Ms. Sharma',
    room: 'A102',
  },
  {
    id: '20',
    day: 'Thursday',
    period: 2,
    startTime: '08:45',
    endTime: '09:30',
    subject: 'Science',
    teacher: 'Dr. Patel',
    room: 'Lab1',
  },
  {
    id: '21',
    day: 'Thursday',
    period: 3,
    startTime: '09:45',
    endTime: '10:30',
    subject: 'Mathematics',
    teacher: 'Mr. Kumar',
    room: 'A107',
  },
  {
    id: '22',
    day: 'Thursday',
    period: 4,
    startTime: '10:30',
    endTime: '11:15',
    subject: 'Social Studies',
    teacher: 'Mrs. Singh',
    room: 'A103',
  },
  {
    id: '23',
    day: 'Thursday',
    period: 5,
    startTime: '11:30',
    endTime: '12:15',
    subject: 'Computer Science',
    teacher: 'Mr. Tech',
    room: 'ComLab',
  },
  {
    id: '24',
    day: 'Thursday',
    period: 6,
    startTime: '12:15',
    endTime: '13:00',
    subject: 'Physical Education',
    teacher: 'Coach Rao',
    room: 'Ground',
  },

  // Friday
  {
    id: '25',
    day: 'Friday',
    period: 1,
    startTime: '08:00',
    endTime: '08:45',
    subject: 'Hindi',
    teacher: 'Mr. Gupta',
    room: 'A104',
  },
  {
    id: '26',
    day: 'Friday',
    period: 2,
    startTime: '08:45',
    endTime: '09:30',
    subject: 'Mathematics',
    teacher: 'Mr. Kumar',
    room: 'A107',
  },
  {
    id: '27',
    day: 'Friday',
    period: 3,
    startTime: '09:45',
    endTime: '10:30',
    subject: 'English',
    teacher: 'Ms. Sharma',
    room: 'A102',
  },
  {
    id: '28',
    day: 'Friday',
    period: 4,
    startTime: '10:30',
    endTime: '11:15',
    subject: 'Science',
    teacher: 'Dr. Patel',
    room: 'Lab1',
  },
  {
    id: '29',
    day: 'Friday',
    period: 5,
    startTime: '11:30',
    endTime: '12:15',
    subject: 'Social Studies',
    teacher: 'Mrs. Singh',
    room: 'A103',
  },
  {
    id: '30',
    day: 'Friday',
    period: 6,
    startTime: '12:15',
    endTime: '13:00',
    subject: 'Assembly',
    teacher: 'Principal',
    room: 'Hall',
  },
]

export const dummyNotifications: Notification[] = [
  {
    id: '1',
    title: 'New Assignment Posted',
    message:
      'Mathematics teacher has posted a new assignment on Quadratic Equations. Due date: August 30, 2025.',
    type: 'Assignment',
    date: '2025-08-26T10:30:00Z',
    priority: 'High',
    status: 'Unread',
  },
  {
    id: '2',
    title: 'Fee Payment Reminder',
    message:
      'Your examination fee payment is due in 3 days. Please complete the payment to avoid late fees.',
    type: 'Fee',
    date: '2025-08-25T14:15:00Z',
    priority: 'High',
    status: 'Unread',
  },
  {
    id: '3',
    title: 'Parent-Teacher Meeting',
    message:
      'Parent-teacher meeting scheduled for September 5th, 2025 at 2:00 PM. Please ensure your parents attend.',
    type: 'Event',
    date: '2025-08-24T09:00:00Z',
    priority: 'Medium',
    status: 'Read',
  },
  {
    id: '4',
    title: 'Holiday Announcement',
    message: 'School will be closed on September 2nd, 2025 for Ganesh Chaturthi celebration.',
    type: 'Holiday',
    date: '2025-08-23T11:45:00Z',
    priority: 'Low',
    status: 'Read',
  },
  {
    id: '5',
    title: 'Mid-term Exam Schedule',
    message:
      'Mid-term examinations will begin from October 15th, 2025. Please check the detailed timetable on the portal.',
    type: 'Exam',
    date: '2025-08-22T16:20:00Z',
    priority: 'High',
    status: 'Unread',
  },
  {
    id: '6',
    title: 'Library Books Return',
    message: 'Please return all borrowed library books by August 31st, 2025 to avoid late fees.',
    type: 'Announcement',
    date: '2025-08-21T13:30:00Z',
    priority: 'Medium',
    status: 'Read',
  },
  {
    id: '7',
    title: 'Sports Day Registration',
    message:
      'Registration for annual sports day is now open. Last date to register: September 10th, 2025.',
    type: 'Event',
    date: '2025-08-20T08:15:00Z',
    priority: 'Low',
    status: 'Read',
  },
]
