import {
  Major,
  Classroom,
  Student,
  Teacher,
  AttendanceRecord,
  TeacherAttendance,
  ShiftItem,
  StudyDurationItem,
  GenerationItem,
  ClassType,
  TuitionPayment,
  AbsenceAlertLog,
  ScholarshipType,
  ScholarshipOption
} from '../types';

export type { ScholarshipOption, GenerationItem };

export interface ClassTypeOption {
  id: ClassType;
  nameKhmer: string;
  nameLatin: string;
  nameChinese?: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  description: string;
}

export const CLASS_TYPE_OPTIONS: ClassTypeOption[] = [
  {
    id: 'bachelor',
    nameKhmer: 'បរិញ្ញាបត្រ (Bachelor)',
    nameLatin: "Bachelor's Degree",
    nameChinese: '学士学位',
    color: 'blue',
    badgeBg: 'bg-blue-100 dark:bg-blue-950/80 border-blue-200 dark:border-blue-800/60',
    badgeText: 'text-blue-800 dark:text-blue-300',
    description: 'កម្មវិធីថ្នាក់បរិញ្ញាបត្ររយៈពេល ៤ ឆ្នាំ'
  },
  {
    id: 'master',
    nameKhmer: 'បរិញ្ញាបត្រជាន់ខ្ពស់ (Master)',
    nameLatin: "Master's Degree",
    nameChinese: '硕士学位',
    color: 'indigo',
    badgeBg: 'bg-indigo-100 dark:bg-indigo-950/80 border-indigo-200 dark:border-indigo-800/60',
    badgeText: 'text-indigo-800 dark:text-indigo-300',
    description: 'កម្មវិធីថ្នាក់អនុបណ្ឌិត / បរិញ្ញាបត្រជាន់ខ្ពស់ ២ ឆ្នាំ'
  },
  {
    id: 'phd',
    nameKhmer: 'បណ្ឌិត (Ph.D)',
    nameLatin: 'Doctorate / Ph.D.',
    nameChinese: '博士学位',
    color: 'purple',
    badgeBg: 'bg-purple-100 dark:bg-purple-950/80 border-purple-200 dark:border-purple-800/60',
    badgeText: 'text-purple-800 dark:text-purple-300',
    description: 'កម្មវិធីថ្នាក់បណ្ឌិតស្រាវជ្រាវ ៣-៤ ឆ្នាំ'
  },
  {
    id: 'chinese_general',
    nameKhmer: 'ភាសាចិនទូទៅ (Chinese General)',
    nameLatin: 'General Chinese Program',
    nameChinese: '通用汉语 / HSK',
    color: 'amber',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800/60',
    badgeText: 'text-amber-800 dark:text-amber-300',
    description: 'វគ្គបណ្តុះបណ្តាលភាសាចិនទូទៅ និងត្រៀមប្រឡង HSK 1-6'
  }
];

export const INITIAL_SHIFTS: ShiftItem[] = [
  {
    id: 'shift_morning',
    code: 'morning',
    nameKhmer: 'វេនព្រឹក (Morning)',
    nameLatin: 'Morning Shift',
    timeRange: '07:30 - 11:00',
    days: 'ច័ន្ទ - សុក្រ (Mon-Fri)',
    color: 'amber',
    isDefault: true
  },
  {
    id: 'shift_afternoon',
    code: 'afternoon',
    nameKhmer: 'វេនរសៀល (Afternoon)',
    nameLatin: 'Afternoon Shift',
    timeRange: '13:30 - 17:00',
    days: 'ច័ន្ទ - សុក្រ (Mon-Fri)',
    color: 'orange',
    isDefault: true
  },
  {
    id: 'shift_evening',
    code: 'evening',
    nameKhmer: 'វេនយប់ (Evening)',
    nameLatin: 'Evening Shift',
    timeRange: '17:30 - 20:30',
    days: 'ច័ន្ទ - សុក្រ (Mon-Fri)',
    color: 'indigo',
    isDefault: true
  },
  {
    id: 'shift_weekend',
    code: 'weekend',
    nameKhmer: 'វេនចុងសប្តាហ៍ (Weekend)',
    nameLatin: 'Weekend Shift',
    timeRange: '08:00 - 17:00',
    days: 'សៅរ៍ - អាទិត្យ (Sat-Sun)',
    color: 'teal',
    isDefault: true
  }
];

export const INITIAL_STUDY_DURATIONS: StudyDurationItem[] = [
  {
    id: 'dur_4years',
    nameKhmer: '៤ ឆ្នាំ (ថ្នាក់បរិញ្ញាបត្រ - Bachelor)',
    nameLatin: '4 Years (Bachelor Degree)',
    years: 4,
    degreeLevel: 'bachelor',
    description: 'កម្មវិធីថ្នាក់បរិញ្ញាបត្រពេញលេញ ៤ ឆ្នាំ សរុប ៨ ឆមាស',
    isDefault: true
  },
  {
    id: 'dur_2years',
    nameKhmer: '២ ឆ្នាំ (បរិញ្ញាបត្ររង / អនុបណ្ឌិត)',
    nameLatin: '2 Years (Associate / Master)',
    years: 2,
    degreeLevel: 'master',
    description: 'កម្មវិធីថ្នាក់បរិញ្ញាបត្ររង ឬ ថ្នាក់អនុបណ្ឌិត សរុប ៤ ឆមាស'
  },
  {
    id: 'dur_3years',
    nameKhmer: '៣ ឆ្នាំ (សញ្ញាបត្របច្ចេកទេសជាន់ខ្ពស់)',
    nameLatin: '3 Years (Higher Technical Diploma)',
    years: 3,
    degreeLevel: 'associate',
    description: 'កម្មវិធីបណ្តុះបណ្តាលបច្ចេកទេស និងគរុកោសល្យជាន់ខ្ពស់ ៣ ឆ្នាំ'
  },
  {
    id: 'dur_1year',
    nameKhmer: '១ ឆ្នាំ (វគ្គមូលដ្ឋានគ្រឹះ / វិញ្ញាបនបត្រ)',
    nameLatin: '1 Year (Foundation / Certificate)',
    years: 1,
    degreeLevel: 'short_course',
    description: 'ថ្នាក់ឆ្នាំសិក្សាមូលដ្ឋានគ្រឹះ ឬវគ្គបណ្តុះបណ្តាលវិជ្ជាជីវៈ ១ ឆ្នាំ'
  },
  {
    id: 'dur_5years',
    nameKhmer: '៥ ឆ្នាំ (ថ្នាក់វិស្វករ / បណ្ឌិត)',
    nameLatin: '5 Years (Doctorate / Engineering)',
    years: 5,
    degreeLevel: 'phd',
    description: 'កម្មវិធីថ្នាក់វិស្វករជំនាញ ឬថ្នាក់បណ្ឌិតស្រាវជ្រាវ ៥ ឆ្នាំ'
  },
  {
    id: 'dur_6months',
    nameKhmer: '៦ ខែ (វគ្គខ្លីពន្លឿន - Intensive)',
    nameLatin: '6 Months (Intensive Course)',
    years: 0.5,
    degreeLevel: 'short_course',
    description: 'វគ្គបំប៉នជំនាញភាសាចិន និងវិធីសាស្ត្របង្រៀនពន្លឿន ៦ ខែ'
  }
];

export const INITIAL_GENERATIONS: GenerationItem[] = [
  {
    id: 'gen_1',
    code: 'Gen 1',
    nameKhmer: 'ជំនាន់ទី១',
    nameLatin: 'Generation 1',
    academicYear: '2022-2026',
    startYear: '2022',
    endYear: '2026',
    description: 'ជំនាន់ទី១ កម្មវិធីបណ្តុះបណ្តាល ២០២២-២០២៦',
    isDefault: true
  },
  {
    id: 'gen_2',
    code: 'Gen 2',
    nameKhmer: 'ជំនាន់ទី២',
    nameLatin: 'Generation 2',
    academicYear: '2023-2027',
    startYear: '2023',
    endYear: '2027',
    description: 'ជំនាន់ទី២ កម្មវិធីបណ្តុះបណ្តាល ២០២៣-២០២៧',
    isDefault: true
  },
  {
    id: 'gen_3',
    code: 'Gen 3',
    nameKhmer: 'ជំនាន់ទី៣',
    nameLatin: 'Generation 3',
    academicYear: '2024-2028',
    startYear: '2024',
    endYear: '2028',
    description: 'ជំនាន់ទី៣ កម្មវិធីបណ្តុះបណ្តាល ២០២៤-២០២៨',
    isDefault: true
  },
  {
    id: 'gen_4',
    code: 'Gen 4',
    nameKhmer: 'ជំនាន់ទី៤',
    nameLatin: 'Generation 4',
    academicYear: '2025-2029',
    startYear: '2025',
    endYear: '2029',
    description: 'ជំនាន់ទី៤ កម្មវិធីបណ្តុះបណ្តាល ២០២៥-២០២៩',
    isDefault: true
  },
  {
    id: 'gen_5',
    code: 'Gen 5',
    nameKhmer: 'ជំនាន់ទី៥',
    nameLatin: 'Generation 5',
    academicYear: '2026-2030',
    startYear: '2026',
    endYear: '2030',
    description: 'ជំនាន់ទី៥ កម្មវិធីបណ្តុះបណ្តាល ២០២៦-២០៣០',
    isDefault: true
  }
];

export const INITIAL_MAJORS: Major[] = [
  {
    id: 'maj_pedagogy',
    code: 'EDU-CN',
    nameKhmer: 'គរុកោសល្យភាសាចិន',
    nameLatin: 'Chinese Language Pedagogy',
    classType: 'bachelor',
    description: 'បណ្តុះបណ្តាលគរុនិស្សិតឱ្យក្លាយជាគ្រូបង្រៀនភាសាចិនកម្រិតឧត្តមសិក្សា និងមធ្យមសិក្សា',
    totalYears: 4
  },
  {
    id: 'maj_translation',
    code: 'TRA-CN',
    nameKhmer: 'បកប្រែភាសាចិន',
    nameLatin: 'Chinese Translation & Interpretation',
    classType: 'bachelor',
    description: 'ជំនាញបកប្រែផ្ទាល់មាត់ និងឯកសារផ្លូវការ ពាណិជ្ជកម្ម ការទូត',
    totalYears: 4
  },
  {
    id: 'maj_business',
    code: 'BUS-CN',
    nameKhmer: 'ភាសាចិនពាណិជ្ជកម្ម',
    nameLatin: 'Business Chinese',
    classType: 'bachelor',
    description: 'ភាសាចិនសម្រាប់វិស័យពាណិជ្ជកម្ម គណនេយ្យ ធនាគារ និងការគ្រប់គ្រង',
    totalYears: 4
  },
  {
    id: 'maj_tourism',
    code: 'TOU-CN',
    nameKhmer: 'ទេសចរណ៍ & បដិសណ្ឋារកិច្ច',
    nameLatin: 'Tourism & Hospitality Chinese',
    classType: 'bachelor',
    description: 'ភាសាចិនសម្រាប់មគ្គុទ្ទេសក៍ទេសចរណ៍ សណ្ឋាគារ និងអាកាសចរណ៍',
    totalYears: 4
  }
];

export const INITIAL_CLASSES: Classroom[] = [
  {
    id: 'cls_y1_m1',
    classCode: 'ED-Y1-M1',
    name: 'ថ្នាក់គរុកោសល្យ ឆ្នាំទី១ (ព្រឹក)',
    classType: 'bachelor',
    majorId: 'maj_pedagogy',
    majorName: 'គរុកោសល្យភាសាចិន',
    generation: 'ជំនាន់ទី១',
    year: 'Year 1',
    shift: 'morning',
    room: 'បន្ទប់ A101',
    academicYear: '2025-2026',
    teacherId: 'tch_01',
    teacherName: 'សាស្ត្រាចារ្យ ឡុង សុខា (Long Sokha)',
    createdAt: new Date().toISOString()
  },
  {
    id: 'cls_y1_e1',
    classCode: 'ED-Y1-E1',
    name: 'ថ្នាក់គរុកោសល្យ ឆ្នាំទី១ (យប់)',
    classType: 'bachelor',
    majorId: 'maj_pedagogy',
    majorName: 'គរុកោសល្យភាសាចិន',
    generation: 'ជំនាន់ទី១',
    year: 'Year 1',
    shift: 'evening',
    room: 'បន្ទប់ A102',
    academicYear: '2025-2026',
    teacherId: 'tch_02',
    teacherName: 'សាស្ត្រាចារ្យ ចេង វ៉ាន់នី (Cheng Vanny)',
    createdAt: new Date().toISOString()
  },
  {
    id: 'cls_y2_a1',
    classCode: 'TR-Y2-A1',
    name: 'ថ្នាក់បកប្រែ ឆ្នាំទី២ (រសៀល)',
    classType: 'bachelor',
    majorId: 'maj_translation',
    majorName: 'បកប្រែភាសាចិន',
    generation: 'ជំនាន់ទី១',
    year: 'Year 2',
    shift: 'afternoon',
    room: 'បន្ទប់ B203',
    academicYear: '2025-2026',
    teacherId: 'tch_03',
    teacherName: 'សាស្ត្រាចារ្យ ហេង សុផល (Heng Sophal)',
    createdAt: new Date().toISOString()
  },
  {
    id: 'cls_y2_w1',
    classCode: 'BU-Y2-W1',
    name: 'ថ្នាក់ពាណិជ្ជកម្ម ឆ្នាំទី២ (ចុងសប្តាហ៍)',
    classType: 'bachelor',
    majorId: 'maj_business',
    majorName: 'ភាសាចិនពាណិជ្ជកម្ម',
    generation: 'ជំនាន់ទី១',
    year: 'Year 2',
    shift: 'weekend',
    room: 'បន្ទប់ C301',
    academicYear: '2025-2026',
    teacherId: 'tch_04',
    teacherName: 'សាស្ត្រាចារ្យ ចាន់ ធីតា (Chan Thida)',
    createdAt: new Date().toISOString()
  },
  {
    id: 'cls_y3_m1',
    classCode: 'ED-Y3-M1',
    name: 'ថ្នាក់គរុកោសល្យ ឆ្នាំទី៣ (ព្រឹក)',
    classType: 'bachelor',
    majorId: 'maj_pedagogy',
    majorName: 'គរុកោសល្យភាសាចិន',
    generation: 'ជំនាន់ទី១',
    year: 'Year 3',
    shift: 'morning',
    room: 'បន្ទប់ A205',
    academicYear: '2025-2026',
    teacherId: 'tch_01',
    teacherName: 'សាស្ត្រាចារ្យ ឡុង សុខា (Long Sokha)',
    createdAt: new Date().toISOString()
  },
  {
    id: 'cls_y4_e1',
    classCode: 'TR-Y4-E1',
    name: 'ថ្នាក់បកប្រែ ឆ្នាំទី៤ (យប់)',
    classType: 'bachelor',
    majorId: 'maj_translation',
    majorName: 'បកប្រែភាសាចិន',
    generation: 'ជំនាន់ទី១',
    year: 'Year 4',
    shift: 'evening',
    room: 'បន្ទប់ B401',
    academicYear: '2025-2026',
    teacherId: 'tch_03',
    teacherName: 'សាស្ត្រាចារ្យ ហេង សុផល (Heng Sophal)',
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 'tch_01',
    teacherCode: 'TCH-001',
    nameKhmer: 'ឡុង សុខា',
    nameLatin: 'Long Sokha',
    nameChinese: '龙索卡',
    gender: 'male',
    phone: '012 889 901',
    email: 'long.sokha@cpi.edu.kh',
    subjects: 'វេយ្យាករណ៍ភាសាចិន, វិធីសាស្ត្របង្រៀន',
    shift: 'morning',
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'tch_02',
    teacherCode: 'TCH-002',
    nameKhmer: 'ចេង វ៉ាន់នី',
    nameLatin: 'Cheng Vanny',
    nameChinese: '程婉妮',
    gender: 'female',
    phone: '010 556 778',
    email: 'cheng.vanny@cpi.edu.kh',
    subjects: 'សូរសព្ទចិន (Pinyin), អក្សរសិល្ប៍ចិន',
    shift: 'evening',
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'tch_03',
    teacherCode: 'TCH-003',
    nameKhmer: 'ហេង សុផល',
    nameLatin: 'Heng Sophal',
    nameChinese: '亨索法',
    gender: 'male',
    phone: '097 789 1234',
    email: 'heng.sophal@cpi.edu.kh',
    subjects: 'បកប្រែផ្ទាល់មាត់, ភាសាចិនកម្រិតខ្ពស់ HSK 6',
    shift: 'afternoon',
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'tch_04',
    teacherCode: 'TCH-004',
    nameKhmer: 'ចាន់ ធីតា',
    nameLatin: 'Chan Thida',
    nameChinese: '陈蒂达',
    gender: 'female',
    phone: '088 665 4321',
    email: 'chan.thida@cpi.edu.kh',
    subjects: 'ភាសាចិនពាណិជ្ជកម្ម, ការទំនាក់ទំនងធុរកិច្ច',
    shift: 'weekend',
    status: 'active',
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'stu_01',
    studentCode: 'CPI-2025-001',
    nameKhmer: 'ជា សុខនីកា',
    nameLatin: 'Chea Soknika',
    nameChinese: '谢淑妮',
    gender: 'female',
    dob: '2004-05-12',
    phone: '085 432 110',
    email: 'soknika.chea@student.cpi.edu.kh',
    majorId: 'maj_pedagogy',
    majorName: 'គរុកោសល្យភាសាចិន',
    classId: 'cls_y1_m1',
    className: 'ថ្នាក់គរុកោសល្យ ឆ្នាំទី១ (ព្រឹក)',
    shift: 'morning',
    year: 'Year 1',
    status: 'active',
    address: 'ខណ្ឌទួលគោក រាជធានីភ្នំពេញ',
    guardianPhone: '012 334 455',
    createdAt: new Date().toISOString()
  },
  {
    id: 'stu_02',
    studentCode: 'CPI-2025-002',
    nameKhmer: 'សុខ វិបុល',
    nameLatin: 'Sok Vibol',
    nameChinese: '宋伟博',
    gender: 'male',
    dob: '2003-11-20',
    phone: '098 776 543',
    email: 'vibol.sok@student.cpi.edu.kh',
    majorId: 'maj_pedagogy',
    majorName: 'គរុកោសល្យភាសាចិន',
    classId: 'cls_y1_m1',
    className: 'ថ្នាក់គរុកោសល្យ ឆ្នាំទី១ (ព្រឹក)',
    shift: 'morning',
    year: 'Year 1',
    status: 'active',
    address: 'ខណ្ឌសែនសុខ រាជធានីភ្នំពេញ',
    guardianPhone: '097 889 900',
    createdAt: new Date().toISOString()
  },
  {
    id: 'stu_03',
    studentCode: 'CPI-2025-003',
    nameKhmer: 'ហុង ស្រីលីន',
    nameLatin: 'Hong Sreylin',
    nameChinese: '洪丽玲',
    gender: 'female',
    dob: '2004-02-18',
    phone: '070 123 987',
    email: 'sreylin.hong@student.cpi.edu.kh',
    majorId: 'maj_pedagogy',
    majorName: 'គរុកោសល្យភាសាចិន',
    classId: 'cls_y1_m1',
    className: 'ថ្នាក់គរុកោសល្យ ឆ្នាំទី១ (ព្រឹក)',
    shift: 'morning',
    year: 'Year 1',
    status: 'active',
    address: 'ខណ្ឌច្បារអំពៅ រាជធានីភ្នំពេញ',
    guardianPhone: '011 223 344',
    createdAt: new Date().toISOString()
  },
  {
    id: 'stu_04',
    studentCode: 'CPI-2025-004',
    nameKhmer: 'រតនៈ វណ្ណា',
    nameLatin: 'Ratanak Vanna',
    nameChinese: '万纳',
    gender: 'male',
    dob: '2002-08-14',
    phone: '017 654 321',
    email: 'vanna.r@student.cpi.edu.kh',
    majorId: 'maj_pedagogy',
    majorName: 'គរុកោសល្យភាសាចិន',
    classId: 'cls_y1_e1',
    className: 'ថ្នាក់គរុកោសល្យ ឆ្នាំទី១ (យប់)',
    shift: 'evening',
    year: 'Year 1',
    status: 'active',
    address: 'ខណ្ឌមានជ័យ រាជធានីភ្នំពេញ',
    guardianPhone: '092 554 433',
    createdAt: new Date().toISOString()
  },
  {
    id: 'stu_05',
    studentCode: 'CPI-2025-005',
    nameKhmer: 'កែវ មុនីរ័ត្ន',
    nameLatin: 'Keo Munyroth',
    nameChinese: '柯梦茹',
    gender: 'female',
    dob: '2003-09-05',
    phone: '081 998 877',
    email: 'munyroth.keo@student.cpi.edu.kh',
    majorId: 'maj_translation',
    majorName: 'បកប្រែភាសាចិន',
    classId: 'cls_y2_a1',
    className: 'ថ្នាក់បកប្រែ ឆ្នាំទី២ (រសៀល)',
    shift: 'afternoon',
    year: 'Year 2',
    status: 'active',
    address: 'ខណ្ឌដង្កោ រាជធានីភ្នំពេញ',
    guardianPhone: '016 778 899',
    createdAt: new Date().toISOString()
  },
  {
    id: 'stu_06',
    studentCode: 'CPI-2025-006',
    nameKhmer: 'លី ឈុនហួរ',
    nameLatin: 'Ly Chunhour',
    nameChinese: '李春华',
    gender: 'male',
    dob: '2003-01-25',
    phone: '015 332 211',
    email: 'chunhour.ly@student.cpi.edu.kh',
    majorId: 'maj_translation',
    majorName: 'បកប្រែភាសាចិន',
    classId: 'cls_y2_a1',
    className: 'ថ្នាក់បកប្រែ ឆ្នាំទី២ (រសៀល)',
    shift: 'afternoon',
    year: 'Year 2',
    status: 'active',
    address: 'ខណ្ឌឬស្សីកែវ រាជធានីភ្នំពេញ',
    guardianPhone: '078 990 011',
    createdAt: new Date().toISOString()
  },
  {
    id: 'stu_07',
    studentCode: 'CPI-2025-007',
    nameKhmer: 'សេង ម៉េងលី',
    nameLatin: 'Seng Mengly',
    nameChinese: '成明礼',
    gender: 'male',
    dob: '2002-04-30',
    phone: '089 445 566',
    email: 'mengly.seng@student.cpi.edu.kh',
    majorId: 'maj_business',
    majorName: 'ភាសាចិនពាណិជ្ជកម្ម',
    classId: 'cls_y2_w1',
    className: 'ថ្នាក់ពាណិជ្ជកម្ម ឆ្នាំទី២ (ចុងសប្តាហ៍)',
    shift: 'weekend',
    year: 'Year 2',
    status: 'active',
    address: 'ខណ្ឌពោធិ៍សែនជ័យ រាជធានីភ្នំពេញ',
    guardianPhone: '086 221 144',
    createdAt: new Date().toISOString()
  },
  {
    id: 'stu_08',
    studentCode: 'CPI-2025-008',
    nameKhmer: 'ឌី សុវណ្ណារី',
    nameLatin: 'Dy Sovannary',
    nameChinese: '苏婉妮',
    gender: 'female',
    dob: '2001-12-10',
    phone: '096 332 119',
    email: 'sovannary.dy@student.cpi.edu.kh',
    majorId: 'maj_pedagogy',
    majorName: 'គរុកោសល្យភាសាចិន',
    classId: 'cls_y3_m1',
    className: 'ថ្នាក់គរុកោសល្យ ឆ្នាំទី៣ (ព្រឹក)',
    shift: 'morning',
    year: 'Year 3',
    status: 'active',
    address: 'ក្រុងតាខ្មៅ ខេត្តកណ្តាល',
    guardianPhone: '012 998 844',
    createdAt: new Date().toISOString()
  },
  {
    id: 'stu_09',
    studentCode: 'CPI-2025-009',
    nameKhmer: 'ឆាយ បូណ៌មី',
    nameLatin: 'Chhay Bormey',
    nameChinese: '蔡宝美',
    gender: 'female',
    dob: '2000-07-22',
    phone: '010 445 522',
    email: 'bormey.chhay@student.cpi.edu.kh',
    majorId: 'maj_translation',
    majorName: 'បកប្រែភាសាចិន',
    classId: 'cls_y4_e1',
    className: 'ថ្នាក់បកប្រែ ឆ្នាំទី៤ (យប់)',
    shift: 'evening',
    year: 'Year 4',
    status: 'active',
    address: 'ខណ្ឌបឹងកេងកង រាជធានីភ្នំពេញ',
    guardianPhone: '097 554 411',
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att_01',
    date: new Date().toISOString().split('T')[0],
    classId: 'cls_y1_m1',
    shift: 'morning',
    studentId: 'stu_01',
    studentName: 'ជា សុខនីកា',
    status: 'present',
    createdAt: new Date().toISOString()
  },
  {
    id: 'att_02',
    date: new Date().toISOString().split('T')[0],
    classId: 'cls_y1_m1',
    shift: 'morning',
    studentId: 'stu_02',
    studentName: 'សុខ វិបុល',
    status: 'present',
    createdAt: new Date().toISOString()
  },
  {
    id: 'att_03',
    date: new Date().toISOString().split('T')[0],
    classId: 'cls_y1_m1',
    shift: 'morning',
    studentId: 'stu_03',
    studentName: 'ហុង ស្រីលីន',
    status: 'permission',
    note: 'ឈឺគ្រុនក្តៅ មានលិខិតសុំច្បាប់ពីអាណាព្យាបាល',
    createdAt: new Date().toISOString()
  }
];

export const SCHOLARSHIP_OPTIONS: ScholarshipOption[] = [
  {
    id: 'two_plus_two',
    nameKhmer: 'អាហារូបករណ៍ ២+២',
    nameLatin: '2+2 Bachelor Dual Degree Scholarship',
    discountPercentage: 100,
    badgeBg: 'bg-blue-100 dark:bg-blue-950/80 border-blue-300 dark:border-blue-700',
    badgeText: 'text-blue-800 dark:text-blue-300',
    description: 'កម្មវិធីអាហារូបករណ៍ ២+២ សិក្សា ២ឆ្នាំនៅកម្ពុជា និង ២ឆ្នាំនៅសាកលវិទ្យាល័យដៃគូចិន',
    isDefault: true
  },
  {
    id: 'partial_25',
    nameKhmer: 'អាហារូបករណ៍ ២៥%',
    nameLatin: '25% Partial Scholarship',
    discountPercentage: 25,
    badgeBg: 'bg-sky-100 dark:bg-sky-950/80 border-sky-300 dark:border-sky-700',
    badgeText: 'text-sky-800 dark:text-sky-300',
    description: 'បញ្ចុះតម្លៃសិក្សា ២៥% សម្រាប់និស្សិតទូទៅ',
    isDefault: true
  },
  {
    id: 'president_grant',
    nameKhmer: 'អាហារូបករណ៍ឯកឧត្តមប្រធាន',
    nameLatin: "President's Excellence Scholarship",
    discountPercentage: 100,
    badgeBg: 'bg-indigo-100 dark:bg-indigo-950/80 border-indigo-300 dark:border-indigo-700',
    badgeText: 'text-indigo-800 dark:text-indigo-300',
    description: 'អាហារូបករណ៍កិត្តិយសពិសេសឧបត្ថម្ភដោយឯកឧត្តមប្រធានវិទ្យាស្ថាន',
    isDefault: true
  }
];

export const INITIAL_SCHOLARSHIPS = SCHOLARSHIP_OPTIONS;

export const INITIAL_PAYMENTS: TuitionPayment[] = [
  {
    id: 'pay_001',
    studentId: 'stu_01',
    studentCode: 'CPI-2025-001',
    studentName: 'ជា សុខនីកា',
    academicYear: '2025-2026',
    term: 'Semester 1',
    scholarshipType: 'two_plus_two',
    discountPercentage: 100,
    originalAmount: 600,
    discountAmount: 600,
    finalAmount: 0,
    paidAmount: 0,
    dueAmount: 0,
    status: 'waived',
    invoiceNumber: 'INV-2025-001',
    paymentDate: '2025-09-01',
    recordedBy: 'Admin',
    notes: 'អាហារូបករណ៍ ២+២ ពេញ ១០០%',
    createdAt: new Date().toISOString()
  },
  {
    id: 'pay_002',
    studentId: 'stu_02',
    studentCode: 'CPI-2025-002',
    studentName: 'សុខ វិបុល',
    academicYear: '2025-2026',
    term: 'Semester 1',
    scholarshipType: 'partial_25',
    discountPercentage: 25,
    originalAmount: 600,
    discountAmount: 150,
    finalAmount: 450,
    paidAmount: 450,
    dueAmount: 0,
    status: 'paid',
    paymentMethod: 'aba_pay',
    transactionRef: 'ABA-889921',
    invoiceNumber: 'INV-2025-002',
    paymentDate: '2025-09-05',
    recordedBy: 'Admin',
    notes: 'បង់គ្រប់ចំនួនតាម ABA KHQR (អាហារូបករណ៍ ២៥%)',
    createdAt: new Date().toISOString()
  },
  {
    id: 'pay_003',
    studentId: 'stu_03',
    studentCode: 'CPI-2025-003',
    studentName: 'ហុង ស្រីលីន',
    academicYear: '2025-2026',
    term: 'Semester 1',
    scholarshipType: 'president_grant',
    discountPercentage: 100,
    originalAmount: 600,
    discountAmount: 600,
    finalAmount: 0,
    paidAmount: 0,
    dueAmount: 0,
    status: 'waived',
    invoiceNumber: 'INV-2025-003',
    paymentDate: '2025-09-10',
    recordedBy: 'Admin',
    notes: 'អាហារូបករណ៍ឯកឧត្តមប្រធាន',
    createdAt: new Date().toISOString()
  },
  {
    id: 'pay_004',
    studentId: 'stu_04',
    studentCode: 'CPI-2025-004',
    studentName: 'កែវ មករា',
    academicYear: '2025-2026',
    term: 'Semester 1',
    scholarshipType: 'partial_25',
    discountPercentage: 25,
    originalAmount: 650,
    discountAmount: 162.5,
    finalAmount: 487.5,
    paidAmount: 200,
    dueAmount: 287.5,
    status: 'partial',
    dueDate: '2025-10-30',
    invoiceNumber: 'INV-2025-004',
    recordedBy: 'Admin',
    notes: 'បានបង់ដំណាក់កាលទី១ ចំនួន $200 (អាហារូបករណ៍ ២៥%)',
    createdAt: new Date().toISOString()
  },
  {
    id: 'pay_005',
    studentId: 'stu_05',
    studentCode: 'CPI-2025-005',
    studentName: 'លី ម៉េងហុង',
    academicYear: '2025-2026',
    term: 'Semester 1',
    scholarshipType: 'two_plus_two',
    discountPercentage: 100,
    originalAmount: 650,
    discountAmount: 650,
    finalAmount: 0,
    paidAmount: 0,
    dueAmount: 0,
    status: 'waived',
    invoiceNumber: 'INV-2025-005',
    paymentDate: '2025-09-02',
    recordedBy: 'Admin',
    notes: 'អាហារូបករណ៍ ២+២ (បរិញ្ញាបត្រ)',
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_ALERT_LOGS: AbsenceAlertLog[] = [
  {
    id: 'alt_001',
    date: new Date().toISOString().split('T')[0],
    studentId: 'stu_03',
    studentCode: 'CPI-2025-003',
    studentName: 'ហុង ស្រីលីន',
    guardianPhone: '098 776 543',
    className: 'ថ្នាក់គរុកោសល្យ ឆ្នាំទី១ (ព្រឹក)',
    shift: 'morning',
    absentCount: 3,
    attendanceRate: 75,
    channel: 'telegram',
    message: '【ICETI សេចក្តីជូនដំណឹងវត្តមាន】សូមគោរពជម្រាបជូនអាណាព្យាបាល និស្សិត ហុង ស្រីលីន (CPI-2025-003) ថ្នាក់គរុកោសល្យ ឆ្នាំទី១ វេនព្រឹក បានអវត្តមានចំនួន 3 លើក (អត្រាវត្តមាន 75%)។ សូមទាក់ទងមកវិទ្យាស្ថានដើម្បីបញ្ជាក់ព័ត៌មានបន្ថែម។',
    status: 'sent',
    sentAt: new Date().toISOString(),
    sentBy: 'Admin System'
  }
];
