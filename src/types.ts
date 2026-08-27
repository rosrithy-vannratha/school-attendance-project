export type ShiftType = 'morning' | 'afternoon' | 'evening' | 'weekend' | string;
export type AcademicYearType = 'Year 1' | 'Year 2' | 'Year 3' | 'Year 4' | string;
export type StudentStatus = 'active' | 'suspended' | 'dropped' | 'graduated';
export type AttendanceStatus = 'present' | 'permission' | 'absent' | 'late';
export type TeacherAttendanceStatus = 'present' | 'permission' | 'absent' | 'substituted';
export type TeacherStatus = 'active' | 'on_leave' | 'resigned' | 'retired';

export type ClassType = 'bachelor' | 'master' | 'phd' | 'chinese_general';

export interface ShiftItem {
  id: string;
  code: string; // e.g. 'morning', 'afternoon', 'evening', 'weekend', etc.
  nameKhmer: string; // e.g. 'វេនព្រឹក (Morning)'
  nameLatin: string; // e.g. 'Morning Shift'
  timeRange: string; // e.g. '07:30 - 11:00'
  days?: string; // e.g. 'ច័ន្ទ - សុក្រ'
  color?: string; // badge color key
  isDefault?: boolean;
}

export interface StudyDurationItem {
  id: string;
  nameKhmer: string; // e.g. '៤ ឆ្នាំ (បរិញ្ញាបត្រ - Bachelor)'
  nameLatin: string; // e.g. '4 Years (Bachelor Degree)'
  years: number; // e.g. 4, 2, 1, 3, 5, 0.5
  degreeLevel?: 'bachelor' | 'master' | 'associate' | 'phd' | 'short_course' | string;
  description?: string;
  isDefault?: boolean;
}

export interface GenerationItem {
  id: string;
  code: string; // e.g. 'Gen 1', 'Gen 2', 'gen_1'
  nameKhmer: string; // e.g. 'ជំនាន់ទី១'
  nameLatin: string; // e.g. 'Generation 1'
  academicYear?: string; // e.g. '2022-2026'
  startYear?: string; // e.g. '2022'
  endYear?: string; // e.g. '2026'
  description?: string;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type Generation = GenerationItem;

export interface Major {
  id: string;
  code: string;
  nameKhmer: string;
  nameLatin: string;
  description?: string;
  totalYears: number;
  durationId?: string;
  classType?: ClassType;
}

export interface Classroom {
  id: string;
  classCode: string;
  name: string;
  majorId: string;
  majorName: string;
  classType?: ClassType;
  year: AcademicYearType;
  generation?: string; // e.g. "ជំនាន់ទី១", "ជំនាន់ទី២", "Gen 1", "Gen 2"
  shift: ShiftType;
  room: string;
  academicYear: string; // e.g. "2025-2026"
  teacherId?: string;
  teacherName?: string;
  createdAt: string;
}

export interface Student {
  id: string;
  studentCode: string;
  nameKhmer: string;
  nameLatin: string;
  nameChinese?: string;
  gender: 'male' | 'female';
  dob: string;
  phone: string;
  email?: string;
  majorId: string;
  majorName: string;
  classType?: ClassType;
  classId: string;
  className: string;
  generation?: string; // e.g. "ជំនាន់ទី១", "ជំនាន់ទី២", "Gen 1", "Gen 2"
  shift: ShiftType;
  year: AcademicYearType;
  status: StudentStatus;
  photoUrl?: string;
  address?: string;
  guardianPhone?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Teacher {
  id: string;
  teacherCode: string;
  nameKhmer: string;
  nameLatin: string;
  nameChinese?: string;
  gender: 'male' | 'female';
  phone: string;
  email?: string;
  subjects: string;
  shift?: ShiftType | string;
  degree?: string;
  status: TeacherStatus;
  photoUrl?: string;
  cvName?: string;
  cvUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  classId: string;
  shift: ShiftType;
  studentId: string;
  studentName: string;
  status: AttendanceStatus;
  note?: string;
  recordedBy?: string;
  createdAt: string;
}

export interface TeacherAttendance {
  id: string;
  date: string; // YYYY-MM-DD
  teacherId: string;
  teacherName: string;
  shift: ShiftType;
  subject: string;
  room?: string;
  status: TeacherAttendanceStatus;
  note?: string;
  recordedBy?: string;
  createdAt: string;
}

export type ScholarshipType = string;
export type PaymentStatus = 'paid' | 'partial' | 'pending' | 'overdue' | 'waived';
export type PaymentMethod = 'aba_pay' | 'acleda_khqr' | 'wing' | 'cash' | 'bank_transfer';

export interface ScholarshipOption {
  id: string;
  nameKhmer: string;
  nameLatin?: string;
  discountPercentage: number;
  badgeBg?: string;
  badgeText?: string;
  description?: string;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TuitionPayment {
  id: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  className?: string;
  majorName?: string;
  generation?: string;
  year?: string;
  academicYear: string; // e.g. "2025-2026"
  term: 'Semester 1' | 'Semester 2' | 'Full Year' | 'Term 1' | 'Term 2' | 'Term 3' | 'Term 4' | 'Short Course';
  scholarshipType: ScholarshipType;
  discountPercentage: number; // e.g. 100, 50, 30, 0
  originalAmount: number; // USD e.g. 600
  discountAmount: number; // USD
  finalAmount: number; // USD to pay
  paidAmount: number; // USD paid
  dueAmount: number; // USD remaining
  status: PaymentStatus;
  paymentDate?: string; // YYYY-MM-DD
  paymentMethod?: PaymentMethod;
  transactionRef?: string;
  invoiceNumber?: string;
  recordedBy?: string;
  notes?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TelegramConfig {
  botToken?: string;
  chatId?: string;
  channelUsername?: string;
  isEnabled: boolean;
  instituteHeader?: string;
}

export interface AbsenceAlertLog {
  id: string;
  date: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  guardianPhone?: string;
  className: string;
  shift: ShiftType;
  absentCount: number;
  attendanceRate: number;
  channel: 'telegram' | 'sms' | 'direct';
  message: string;
  status: 'sent' | 'failed' | 'draft';
  sentAt?: string;
  sentBy?: string;
}

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: string;
  isAnonymous?: boolean;
}

export type ActiveTab = 
  | 'dashboard'
  | 'students'
  | 'attendance'
  | 'teachers'
  | 'teacher_attendance'
  | 'classes'
  | 'majors'
  | 'tuition'
  | 'alerts'
  | 'reports';

export interface AttendanceStats {
  totalRecords: number;
  present: number;
  permission: number;
  absent: number;
  late: number;
  rate: number;
}
