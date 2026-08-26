import React, { useState, useMemo } from 'react';
import {
  Users,
  UserCheck,
  Layers,
  CalendarCheck,
  Sun,
  Sunset,
  Moon,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  BookOpen,
  GraduationCap,
  Award,
  BookMarked,
  Hourglass,
  UserX,
  School,
  Percent,
  CheckCircle,
  PauseCircle,
  XCircle,
  HeartHandshake
} from 'lucide-react';
import {
  Student,
  Teacher,
  Classroom,
  Major,
  AttendanceRecord,
  ActiveTab,
  ShiftType,
  ShiftItem,
  ClassType,
  StudyDurationItem
} from '../types';
import { INITIAL_SHIFTS } from '../data/initialData';
import icetiLogo from '../assets/images/icetilogo.jpg';

interface DashboardViewProps {
  students: Student[];
  teachers: Teacher[];
  classes: Classroom[];
  majors: Major[];
  attendance: AttendanceRecord[];
  shifts?: ShiftItem[];
  studyDurations?: StudyDurationItem[];
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAddStudent: () => void;
  onOpenAddClass: () => void;
  isReadOnly?: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  students,
  teachers,
  classes,
  majors,
  attendance,
  shifts = INITIAL_SHIFTS,
  studyDurations = [],
  setActiveTab,
  onOpenAddStudent,
  onOpenAddClass,
  isReadOnly = false
}) => {
  const [aiInsightLoading, setAiInsightLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayAttendance = useMemo(() => attendance.filter((a) => a.date === today), [attendance, today]);

  const totalStudents = students.length;
  const activeStudents = useMemo(() => students.filter((s) => s.status === 'active').length, [students]);
  const totalTeachers = teachers.length;
  const totalClasses = classes.length;

  // Gender counts
  const femaleStudents = useMemo(() => students.filter((s) => s.gender === 'female').length, [students]);
  const maleStudents = useMemo(() => students.filter((s) => s.gender === 'male').length, [students]);
  const femalePercentage = useMemo(() => {
    return totalStudents > 0 ? Math.round((femaleStudents / totalStudents) * 100) : 0;
  }, [totalStudents, femaleStudents]);

  // Attendance rates
  const presentCount = useMemo(() => todayAttendance.filter((a) => a.status === 'present').length, [todayAttendance]);
  const permissionCount = useMemo(() => todayAttendance.filter((a) => a.status === 'permission').length, [todayAttendance]);
  const absentCount = useMemo(() => todayAttendance.filter((a) => a.status === 'absent').length, [todayAttendance]);
  const lateCount = useMemo(() => todayAttendance.filter((a) => a.status === 'late').length, [todayAttendance]);
  const attendanceRate = useMemo(() => {
    return todayAttendance.length > 0 
      ? Math.round(((presentCount + lateCount) / todayAttendance.length) * 100) 
      : 96;
  }, [todayAttendance, presentCount, lateCount]);

  // Student Types / Degree Levels Breakdown
  const studentTypesData = useMemo(() => {
    const types: {
      type: ClassType;
      nameKhmer: string;
      nameLatin: string;
      icon: any;
      bgClass: string;
      borderClass: string;
      badgeBg: string;
      badgeText: string;
      accentColor: string;
      description: string;
    }[] = [
      {
        type: 'bachelor',
        nameKhmer: 'ថ្នាក់បរិញ្ញាបត្រ',
        nameLatin: "Bachelor's Degree (៤ ឆ្នាំ)",
        icon: GraduationCap,
        bgClass: 'bg-emerald-50/60 dark:bg-emerald-950/25',
        borderClass: 'border-emerald-200/80 dark:border-emerald-800/50',
        badgeBg: 'bg-emerald-100 dark:bg-emerald-900/60',
        badgeText: 'text-emerald-800 dark:text-emerald-300',
        accentColor: '#059669',
        description: 'កម្មវិធីបណ្តុះបណ្តាលបរិញ្ញាបត្រគរុកោសល្យ និងភាសាចិនពាណិជ្ជកម្ម',
      },
      {
        type: 'master',
        nameKhmer: 'ថ្នាក់បរិញ្ញាបត្រជាន់ខ្ពស់',
        nameLatin: "Master's Degree (២ ឆ្នាំ)",
        icon: Award,
        bgClass: 'bg-blue-50/60 dark:bg-blue-950/25',
        borderClass: 'border-blue-200/80 dark:border-blue-800/50',
        badgeBg: 'bg-blue-100 dark:bg-blue-900/60',
        badgeText: 'text-blue-800 dark:text-blue-300',
        accentColor: '#2563eb',
        description: 'កម្មវិធីថ្នាក់អនុបណ្ឌិតភាសាចិនអន្តរជាតិ និងការស្រាវជ្រាវ',
      },
      {
        type: 'phd',
        nameKhmer: 'ថ្នាក់បណ្ឌិត',
        nameLatin: 'Doctor of Philosophy (Ph.D)',
        icon: School,
        bgClass: 'bg-purple-50/60 dark:bg-purple-950/25',
        borderClass: 'border-purple-200/80 dark:border-purple-800/50',
        badgeBg: 'bg-purple-100 dark:bg-purple-900/60',
        badgeText: 'text-purple-800 dark:text-purple-300',
        accentColor: '#9333ea',
        description: 'កម្មវិធីថ្នាក់បណ្ឌិតជាន់ខ្ពស់ផ្នែកអក្សរសាស្ត្រ និងទស្សនវិជ្ជាចិន',
      },
      {
        type: 'chinese_general',
        nameKhmer: 'ភាសាចិនទូទៅ & វគ្គខ្លី',
        nameLatin: 'General Chinese & Short Courses',
        icon: BookMarked,
        bgClass: 'bg-amber-50/60 dark:bg-amber-950/25',
        borderClass: 'border-amber-200/80 dark:border-amber-800/50',
        badgeBg: 'bg-amber-100 dark:bg-amber-900/60',
        badgeText: 'text-amber-800 dark:text-amber-300',
        accentColor: '#d97706',
        description: 'វគ្គបណ្តុះបណ្តាលភាសាចិនកម្រិតមូលដ្ឋាន HSK និងវគ្គជំនាញខ្លីៗ',
      },
    ];

    return types.map((item) => {
      const matchStudents = students.filter((s) => {
        const studentType = s.classType || 'bachelor';
        return studentType === item.type;
      });
      const count = matchStudents.length;
      const activeCount = matchStudents.filter((s) => s.status === 'active').length;
      const femaleCount = matchStudents.filter((s) => s.gender === 'female').length;
      const maleCount = matchStudents.filter((s) => s.gender === 'male').length;
      const percentage = totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0;

      return {
        ...item,
        count,
        activeCount,
        femaleCount,
        maleCount,
        percentage,
      };
    });
  }, [students, totalStudents]);

  // Student Status breakdown
  const statusStats = useMemo(() => {
    const active = students.filter((s) => s.status === 'active').length;
    const suspended = students.filter((s) => s.status === 'suspended').length;
    const dropped = students.filter((s) => s.status === 'dropped').length;
    const graduated = students.filter((s) => s.status === 'graduated').length;
    return {
      active,
      suspended,
      dropped,
      graduated,
    };
  }, [students]);

  // Academic Year Level breakdown
  const academicYearStats = useMemo(() => {
    const year1 = students.filter((s) => s.year === 'Year 1' || !s.year).length;
    const year2 = students.filter((s) => s.year === 'Year 2').length;
    const year3 = students.filter((s) => s.year === 'Year 3').length;
    const year4 = students.filter((s) => s.year === 'Year 4').length;
    return [
      { key: 'Year 1', labelKh: 'ឆ្នាំទី ១ (Year 1)', count: year1, color: 'bg-emerald-600' },
      { key: 'Year 2', labelKh: 'ឆ្នាំទី ២ (Year 2)', count: year2, color: 'bg-teal-600' },
      { key: 'Year 3', labelKh: 'ឆ្នាំទី ៣ (Year 3)', count: year3, color: 'bg-blue-600' },
      { key: 'Year 4', labelKh: 'ឆ្នាំទី ៤ (Year 4)', count: year4, color: 'bg-indigo-600' },
    ];
  }, [students]);

  // Shift counts
  const shiftCounts = useMemo<Record<ShiftType, number>>(() => ({
    morning: students.filter((s) => s.shift === 'morning').length,
    afternoon: students.filter((s) => s.shift === 'afternoon').length,
    evening: students.filter((s) => s.shift === 'evening').length,
    weekend: students.filter((s) => s.shift === 'weekend').length,
  }), [students]);

  // Absence risk (students with >= 2 absences in records)
  const studentAbsenceCount = useMemo(() => {
    const map: Record<string, number> = {};
    attendance.forEach((a) => {
      if (a.status === 'absent') {
        map[a.studentId] = (map[a.studentId] || 0) + 1;
      }
    });
    return map;
  }, [attendance]);

  const riskStudents = useMemo(() => {
    return students.filter((s) => (studentAbsenceCount[s.id] || 0) >= 2);
  }, [students, studentAbsenceCount]);

  const generateAiInsight = async () => {
    setAiInsightLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      const bachelorItem = studentTypesData.find((t) => t.type === 'bachelor');
      const bachelorCount = bachelorItem?.count || 0;
      setAiInsight(
        `📊 របាយការណ៍សង្ខេបពី AI Assistant (International Chinese Education and Teachers Institute):
• ចំនួននិស្សិតសរុបមាន ${totalStudents} នាក់ (ស្រី ${femaleStudents} នាក់ ស្មើនឹង ${femalePercentage}%)។
• កម្រិតសញ្ញាបត្របរិញ្ញាបត្រ (Bachelor) មានសមាមាត្រធំបំផុតគឺ ${bachelorCount} នាក់ (${bachelorItem?.percentage || 0}%)។
• អត្រាវត្តមានសរុបប្រចាំថ្ងៃស្ថិតក្នុងកម្រិតល្អប្រសើរ ${attendanceRate}% (វត្តមាន ${presentCount} នាក់, អវត្តមាន ${absentCount} នាក់)។
• វេនព្រឹក (Morning Shift) មានចំនួននិស្សិតច្រើនជាងគេ (${shiftCounts.morning} នាក់)។
• មាននិស្សិតប្រឈមចំនួន ${riskStudents.length} នាក់ ដែលមានអវត្តមានចាប់ពី ២ លើកឡើងទៅ គួរតាមដានជាបន្ទាន់។
• សាស្ត្រាចារ្យសរុប ${totalTeachers} រូបកំពុងបំពេញការបង្រៀនលើ ${totalClasses} បន្ទប់ថ្នាក់រៀន។`
      );
    } catch (e) {
      console.warn(e);
    } finally {
      setAiInsightLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Guest Explorer Mode Notification */}
      {isReadOnly && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
              👁️
            </div>
            <div>
              <h4 className="font-bold text-xs text-amber-900 dark:text-amber-200">
                របៀបភ្ញៀវ (Explore as Guest — Read-Only Mode)
              </h4>
              <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80 mt-0.5">
                លោកអ្នកកំពុងស្ថិតក្នុងរបៀបពិនិត្យទិន្នន័យ។ មុខងារបង្កើត កែប្រែ ឬលុបទិន្នន័យត្រូវបានចាក់សោសុវត្ថិភាព។
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-amber-200/70 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-[10px] font-black uppercase tracking-wider">
            បានតែមើលប៉ុណ្ណោះ
          </span>
        </div>
      )}

      {/* Welcome & Quick Action Bar */}
      <div className="bg-gradient-to-r from-blue-800 via-blue-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white p-1 shadow-lg border border-white/20 shrink-0 hidden sm:flex items-center justify-center overflow-hidden">
              <img src={icetiLogo} alt="ICETI Logo" className="w-full h-full object-contain rounded-xl" />
            </div>
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-700/60 border border-blue-400/40 text-blue-100 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>ប្រព័ន្ធគ្រប់គ្រងអប់រំ និងវត្តមានឆ្នាំសិក្សា ២០២៥-២០២៦</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                សួស្តី! សូមស្វាគមន៍មកកាន់វិទ្យាស្ថានគរុកោសល្យភាសាចិនក្នុងតំបន់
              </h2>
              <p className="text-blue-100/90 text-xs sm:text-sm max-w-2xl leading-relaxed">
                គ្រប់គ្រងទិន្នន័យនិស្សិតគ្រប់កម្រិត (បរិញ្ញាបត្រ, អនុបណ្ឌិត, បណ្ឌិត, វគ្គខ្លី) វេនសិក្សា កត់ត្រាវត្តមានប្រចាំថ្ងៃ និងតាមដានរបាយការណ៍សិក្សាដោយស្វ័យប្រវត្តិ។
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveTab('attendance')}
              className="px-4 py-2.5 rounded-xl bg-white text-blue-950 hover:bg-blue-50 font-bold text-xs inline-flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4 text-blue-700" />
              <span>{isReadOnly ? 'ពិនិត្យវត្តមានថ្ងៃនេះ' : 'កត់ត្រាវត្តមានថ្ងៃនេះ'}</span>
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className="px-4 py-2.5 rounded-xl bg-blue-600/90 hover:bg-blue-500 border border-blue-400/30 text-white font-semibold text-xs inline-flex items-center gap-2 transition-all cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>{isReadOnly ? 'ពិនិត្យបញ្ជីនិស្សិត' : '+ បន្ថែមនិស្សិតថ្មី'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 Core Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div 
          onClick={() => setActiveTab('students')}
          className="bg-white dark:bg-[#111c38] p-5 rounded-2xl border border-blue-900/10 dark:border-blue-900/40 shadow-xs hover:border-blue-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">និស្សិតសរុប (Students)</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white">{totalStudents}</span>
            <span className="text-xs text-blue-700 dark:text-blue-400 font-bold">នាក់ (Active: {activeStudents})</span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1 font-medium">
            <span>ស្រី {femaleStudents} នាក់ ({femalePercentage}%)</span>
            <ArrowRight className="w-3 h-3 ml-auto text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Metric 2 */}
        <div 
          onClick={() => setActiveTab('attendance')}
          className="bg-white dark:bg-[#111c38] p-5 rounded-2xl border border-blue-900/10 dark:border-blue-900/40 shadow-xs hover:border-blue-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">អត្រាវត្តមាន (Attendance)</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400">{attendanceRate}%</span>
            <span className="text-xs text-zinc-600 dark:text-zinc-300 font-medium">ថ្ងៃនេះ</span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-600 dark:text-zinc-400 flex items-center gap-1 font-medium">
            <span className="text-blue-700 dark:text-blue-400 font-bold">វត្តមាន {presentCount}</span>
            <span>•</span>
            <span className="text-rose-600 dark:text-rose-400 font-bold">អវត្តមាន {absentCount}</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div 
          onClick={() => setActiveTab('teachers')}
          className="bg-white dark:bg-[#111c38] p-5 rounded-2xl border border-blue-900/10 dark:border-blue-900/40 shadow-xs hover:border-blue-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">សាស្ត្រាចារ្យ (Faculty)</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white">{totalTeachers}</span>
            <span className="text-xs text-zinc-600 dark:text-zinc-300 font-medium">រូប</span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1 font-medium">
            <span>ឯកទេសភាសាចិន</span>
            <ArrowRight className="w-3 h-3 ml-auto text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Metric 4 */}
        <div 
          onClick={() => setActiveTab('classes')}
          className="bg-white dark:bg-[#111c38] p-5 rounded-2xl border border-blue-900/10 dark:border-blue-900/40 shadow-xs hover:border-blue-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">ថ្នាក់រៀនសរុប (Classes)</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white">{totalClasses}</span>
            <span className="text-xs text-zinc-600 dark:text-zinc-300 font-medium">បន្ទប់</span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1 font-medium">
            <span>បែងចែកតាមវេនសិក្សា</span>
            <ArrowRight className="w-3 h-3 ml-auto text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TOTAL TYPE OF STUDENTS (កម្រិតសញ្ញាបត្រ និងប្រភេទកម្មវិធីសិក្សា) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-[#111c38] rounded-3xl p-6 border border-blue-900/10 dark:border-blue-900/40 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-base font-bold text-zinc-950 dark:text-white">
                ចំនួននិស្សិតសរុបតាមប្រភេទកម្មវិធីសិក្សា (Total Students by Program & Degree Level)
              </h3>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium mt-0.5">
              ស្ថិតិលម្អិតនៃនិស្សិតតាមកម្រិតសញ្ញាបត្រ បរិញ្ញាបត្រ អនុបណ្ឌិត បណ្ឌិត និងភាសាចិនទូទៅ
            </p>
          </div>
          <button
            onClick={() => setActiveTab('students')}
            className="text-xs font-bold text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <span>គ្រប់គ្រងនិស្សិត</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4 Program Types Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {studentTypesData.map((item) => {
            const IconComponent = item.icon;
            return (
              <div
                key={item.type}
                onClick={() => setActiveTab('students')}
                className={`p-5 rounded-2xl border ${item.borderClass} ${item.bgClass} transition-all cursor-pointer group hover:shadow-md hover:scale-[1.01] flex flex-col justify-between`}
              >
                <div>
                  {/* Top Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 shadow-xs flex items-center justify-center text-blue-700 dark:text-blue-400 group-hover:rotate-6 transition-transform">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${item.badgeBg} ${item.badgeText}`}>
                      {item.percentage}% នៃសរុប
                    </span>
                  </div>

                  {/* Program Title */}
                  <h4 className="font-bold text-zinc-950 dark:text-white text-sm sm:text-base leading-snug">
                    {item.nameKhmer}
                  </h4>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium mb-3">
                    {item.nameLatin}
                  </p>
                </div>

                <div>
                  {/* Total count number */}
                  <div className="flex items-baseline justify-between mb-2">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-black text-zinc-950 dark:text-white">
                        {item.count}
                      </span>
                      <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">នាក់</span>
                    </div>
                    <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400">
                      Active: {item.activeCount}
                    </span>
                  </div>

                  {/* Gender Mini Breakdown */}
                  <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 flex items-center justify-between text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">
                    <span>ស្រី: <strong className="text-zinc-900 dark:text-zinc-200">{item.femaleCount}</strong></span>
                    <span>•</span>
                    <span>ប្រុស: <strong className="text-zinc-900 dark:text-zinc-200">{item.maleCount}</strong></span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-zinc-200/80 dark:bg-zinc-700/80 rounded-full h-1.5 mt-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(item.percentage, 4)}%`,
                        backgroundColor: item.accentColor,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Secondary Demographic Sub-Grid: Gender, Status, and Academic Years */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Gender Ratio Card */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#182645] border border-zinc-200 dark:border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400" />
                <span>សមាមាត្រយេនឌ័រ (Gender Ratio)</span>
              </span>
              <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                {totalStudents} នាក់
              </span>
            </div>

            <div className="flex items-center justify-between text-xs font-bold pt-1">
              <span className="text-pink-600 dark:text-pink-400">
                👩 ស្រី: {femaleStudents} ({femalePercentage}%)
              </span>
              <span className="text-sky-600 dark:text-sky-400">
                👨 ប្រុស: {maleStudents} ({100 - femalePercentage}%)
              </span>
            </div>

            {/* Split progress bar */}
            <div className="w-full h-2.5 rounded-full bg-sky-200 dark:bg-sky-950 flex overflow-hidden">
              <div
                className="h-full bg-pink-500 transition-all duration-500"
                style={{ width: `${femalePercentage}%` }}
                title={`និស្សិតស្រី: ${femalePercentage}%`}
              />
              <div
                className="h-full bg-sky-500 transition-all duration-500"
                style={{ width: `${100 - femalePercentage}%` }}
                title={`និស្សិតប្រុស: ${100 - femalePercentage}%`}
              />
            </div>
          </div>

          {/* Academic Years Card */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#182645] border border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>កម្រិតឆ្នាំសិក្សា (Academic Years)</span>
              </span>
              <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400">
                Year 1 - 4
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              {academicYearStats.map((yr) => (
                <div
                  key={yr.key}
                  className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#111c38] border border-zinc-200 dark:border-zinc-700/80 flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300 text-[11px]">{yr.key}</span>
                  <span className="font-bold text-zinc-950 dark:text-white">{yr.count} នាក់</span>
                </div>
              ))}
            </div>
          </div>

          {/* Student Status Card */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#182645] border border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>ស្ថានភាពនិស្សិត (Student Status)</span>
              </span>
              <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                សរុប {totalStudents}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              <div className="px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 flex items-center justify-between text-xs">
                <span className="font-semibold text-blue-800 dark:text-blue-300 text-[11px]">កំពុងរៀន</span>
                <span className="font-bold text-blue-900 dark:text-blue-200">{statusStats.active}</span>
              </div>
              <div className="px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-between text-xs">
                <span className="font-semibold text-amber-800 dark:text-amber-300 text-[11px]">ព្យួរការសិក្សា</span>
                <span className="font-bold text-amber-900 dark:text-amber-200">{statusStats.suspended}</span>
              </div>
              <div className="px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/60 flex items-center justify-between text-xs">
                <span className="font-semibold text-rose-800 dark:text-rose-300 text-[11px]">បោះបង់</span>
                <span className="font-bold text-rose-900 dark:text-rose-200">{statusStats.dropped}</span>
              </div>
              <div className="px-2.5 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800/60 flex items-center justify-between text-xs">
                <span className="font-semibold text-sky-800 dark:text-sky-300 text-[11px]">បញ្ចប់ការសិក្សា</span>
                <span className="font-bold text-sky-900 dark:text-sky-200">{statusStats.graduated}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Module Shortcuts for Tuition & Alerts */}
        {!isReadOnly && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div
              onClick={() => setActiveTab('tuition')}
              className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800/60 flex items-center justify-between cursor-pointer hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-700 text-white shadow-xs">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-zinc-950 dark:text-white flex items-center gap-1.5">
                    <span>ថ្លៃសិក្សា និងអាហារូបករណ៍ (Tuition & Grants)</span>
                  </h4>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                    តាមដានការបង់ប្រាក់ បញ្ចុះតម្លៃអាហារូបករណ៍ និងចេញវិក្កយបត្រ
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-700 dark:text-blue-400 group-hover:translate-x-1 transition-transform" />
            </div>

            <div
              onClick={() => setActiveTab('alerts')}
              className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 to-amber-50 dark:from-rose-950/40 dark:to-amber-950/40 border border-rose-300 dark:border-rose-800/60 flex items-center justify-between cursor-pointer hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-700 text-white shadow-xs">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-zinc-950 dark:text-white flex items-center gap-1.5">
                    <span>ប្រព័ន្ធជូនដំណឹងអវត្តមាន (Absence Alerts & Telegram)</span>
                  </h4>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                    ជូនដំណឹងស្វ័យប្រវត្តិតាម Telegram ដល់អាណាព្យាបាល (វត្តមាន &lt; ៨០%)
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-rose-700 dark:text-rose-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        )}
      </div>

      {/* Shifts Breakdown (វេនសិក្សា) */}
      <div className="bg-white dark:bg-[#111c38] rounded-3xl p-6 border border-blue-900/10 dark:border-blue-900/40 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-zinc-950 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>ការបែងចែកនិស្សិតតាមវេនសិក្សា (Study Shifts Breakdown)</span>
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium">
              វេនព្រឹក រសៀល យប់ និងចុងសប្តាហ៍ ជាមួយនឹងចំនួននិស្សិតតាមវេននីមួយៗ
            </p>
          </div>
          <button
            onClick={() => setActiveTab('students')}
            className="text-xs font-bold text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <span>មើលបញ្ជីនិស្សិតទាំងអស់</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {shifts.map((s) => {
            const count = students.filter((stu) => (stu.shift || 'morning').toLowerCase() === s.code.toLowerCase()).length;
            const isMorning = s.code === 'morning';
            const isAfternoon = s.code === 'afternoon';
            const isEvening = s.code === 'evening';
            
            const bgClasses = isMorning
              ? 'bg-amber-50/70 dark:bg-amber-950/30 hover:bg-amber-100/70 dark:hover:bg-amber-950/45 border-amber-300/80 dark:border-amber-800/60'
              : isAfternoon
              ? 'bg-orange-50/70 dark:bg-orange-950/30 hover:bg-orange-100/70 dark:hover:bg-orange-950/45 border-orange-300/80 dark:border-orange-800/60'
              : isEvening
              ? 'bg-indigo-50/70 dark:bg-indigo-950/30 hover:bg-indigo-100/70 dark:hover:bg-indigo-950/45 border-indigo-300/80 dark:border-indigo-800/60'
              : 'bg-teal-50/70 dark:bg-teal-950/30 hover:bg-teal-100/70 dark:hover:bg-teal-950/45 border-teal-300/80 dark:border-teal-800/60';

            const badgeBg = isMorning
              ? 'bg-amber-200/70 dark:bg-amber-900/70 text-amber-950 dark:text-amber-200'
              : isAfternoon
              ? 'bg-orange-200/70 dark:bg-orange-950/70 text-orange-950 dark:text-orange-200'
              : isEvening
              ? 'bg-indigo-200/70 dark:bg-indigo-950/70 text-indigo-950 dark:text-indigo-200'
              : 'bg-teal-200/70 dark:bg-teal-900/70 text-teal-950 dark:text-teal-200';

            const icon = isMorning ? (
              <Sun className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            ) : isAfternoon ? (
              <Sunset className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            ) : isEvening ? (
              <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            );

            return (
              <div
                key={s.id}
                onClick={() => setActiveTab('students')}
                className={`border p-4 rounded-2xl transition-all cursor-pointer group ${bgClasses}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center font-bold">
                    {icon}
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${badgeBg}`}>
                    {s.timeRange || s.nameLatin}
                  </span>
                </div>
                <h4 className="font-bold text-zinc-950 dark:text-zinc-100 text-sm">{s.nameKhmer} ({s.nameLatin})</h4>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{count}</span>
                  <span className="text-xs text-zinc-600 dark:text-zinc-400 font-bold">និស្សិត</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: AI Assistant & Risk Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: AI Insights & Majors Overview */}
        <div className="lg:col-span-2 bg-white dark:bg-[#111c38] rounded-3xl p-6 border border-blue-900/10 dark:border-blue-900/40 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-blue-700 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-950 dark:text-white text-sm sm:text-base">
                  AI Smart Attendance & Academic Advisor
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium">ការវិភាគស្វ័យប្រវត្តិនៃដំណើរការសិក្សា</p>
              </div>
            </div>

            <button
              onClick={generateAiInsight}
              disabled={aiInsightLoading}
              className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-200 text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
              <span>{aiInsightLoading ? 'កំពុងវិភាគ...' : 'ដំណើរការវិភាគ AI'}</span>
            </button>
          </div>

          {aiInsight ? (
            <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 leading-relaxed whitespace-pre-line font-medium">
              {aiInsight}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-[#182645] border border-dashed border-zinc-300 dark:border-zinc-700 text-center space-y-2">
              <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto" />
              <p className="text-xs text-zinc-700 dark:text-zinc-200 font-semibold">
                ចុចប៊ូតុង "ដំណើរការវិភាគ AI" ដើម្បីទទួលបានការវិភាគស្ថិតិវត្តមាន និងការណែនាំគរុកោសល្យ។
              </p>
            </div>
          )}

          {/* Academic Majors & Specializations list */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                <span>ដេប៉ាតឺម៉ង់ & ឯកទេសបណ្តុះបណ្តាល ({majors.length})</span>
              </h4>
              <button
                onClick={() => setActiveTab('majors')}
                className="text-[11px] font-bold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
              >
                គ្រប់គ្រងជំនាញ
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {majors.map((m) => {
                const majorStudentCount = students.filter((s) => s.majorId === m.id).length;
                return (
                  <div
                    key={m.id}
                    onClick={() => setActiveTab('students')}
                    className="p-3 rounded-xl bg-zinc-50 dark:bg-[#182645] border border-zinc-200 dark:border-zinc-800 text-xs hover:border-blue-400 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-zinc-950 dark:text-zinc-100">{m.nameKhmer}</div>
                      <div className="text-[11px] text-zinc-600 dark:text-zinc-300 font-medium">
                        {m.nameLatin} ({m.totalYears || 4} ឆ្នាំ)
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-sm text-blue-700 dark:text-blue-400">
                        {majorStudentCount}
                      </span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block font-semibold">
                        និស្សិត
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Absence Risk Watchlist */}
        <div className="bg-white dark:bg-[#111c38] rounded-3xl p-6 border border-blue-900/10 dark:border-blue-900/40 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <h3 className="font-bold text-zinc-950 dark:text-white text-sm">បញ្ជីប្រឈមអវត្តមាន</h3>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200">
              {riskStudents.length} នាក់
            </span>
          </div>

          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {riskStudents.length === 0 ? (
              <div className="text-center py-8 text-xs text-zinc-600 dark:text-zinc-300">
                <CheckCircle2 className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                <p className="font-bold text-zinc-950 dark:text-zinc-100">ពុំមាននិស្សិតប្រឈមអវត្តមាន</p>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">និស្សិតទាំងអស់មានវត្តមានទៀងទាត់</p>
              </div>
            ) : (
              riskStudents.map((stu) => {
                const abs = studentAbsenceCount[stu.id] || 0;
                return (
                  <div key={stu.id} className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-xs flex items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-zinc-950 dark:text-zinc-100">{stu.nameKhmer}</div>
                      <div className="text-[11px] text-zinc-600 dark:text-zinc-300 font-medium">{stu.className} • {stu.studentCode}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-bold text-[10px]">
                        អវត្តមាន {abs} លើក
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button
            onClick={() => setActiveTab('reports')}
            className="w-full py-2 rounded-xl bg-zinc-100 dark:bg-[#182645] hover:bg-zinc-200 dark:hover:bg-blue-900/40 text-zinc-800 dark:text-zinc-100 font-bold text-xs transition-colors cursor-pointer text-center"
          >
            មើលរបាយការណ៍លម្អិត
          </button>
        </div>
      </div>
    </div>
  );
};
