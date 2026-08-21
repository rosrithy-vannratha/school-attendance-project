import React, { useState, useMemo } from 'react';
import {
  CalendarCheck,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  FileSpreadsheet,
  Save,
  Sun,
  Sunset,
  Moon,
  Users,
  Search,
  Filter,
  Check,
  Lock,
  Printer,
  CalendarRange,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Award,
  BookOpen,
  ArrowUpDown,
  Download
} from 'lucide-react';
import { Student, Classroom, AttendanceRecord, AttendanceStatus, ShiftType } from '../types';
import { instituteService } from '../service/instituteService';
import {
  exportAttendanceToExcel,
  exportDailyAttendanceSummaryToExcel,
  exportStudentMonthlyAttendanceToExcel,
  getShiftLabel,
  getAttendanceLabel
} from '../utils/exportUtils';

interface AttendanceViewProps {
  students: Student[];
  classes: Classroom[];
  attendance: AttendanceRecord[];
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  isReadOnly?: boolean;
}

type AttendanceSubTab = 'workspace' | 'daily_report' | 'monthly_report';

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  students,
  classes,
  attendance,
  showToast,
  isReadOnly = false
}) => {
  const [subTab, setSubTab] = useState<AttendanceSubTab>('workspace');

  // Daily Workspace State
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedShift, setSelectedShift] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Monthly Report State
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  );
  const [monthlyClassId, setMonthlyClassId] = useState<string>('all');
  const [monthlyShift, setMonthlyShift] = useState<string>('all');
  const [monthlySearch, setMonthlySearch] = useState('');
  const [monthlyRiskFilter, setMonthlyRiskFilter] = useState<'all' | 'high_absence' | 'perfect'>('all');

  // Local editing state for attendance on this date & class
  // key: studentId -> { status: AttendanceStatus, note?: string }
  const [attendanceDraft, setAttendanceDraft] = useState<
    Record<string, { status: AttendanceStatus; note: string }>
  >({});
  const [isSaving, setIsSaving] = useState(false);

  // Auto-sync selected class if invalid
  React.useEffect(() => {
    if (selectedClassId !== 'all' && classes.length > 0) {
      const exists = classes.some((c) => c.id === selectedClassId);
      if (!exists) {
        setSelectedClassId('all');
      }
    }
  }, [classes, selectedClassId]);

  const selectedClass = useMemo(() => {
    if (selectedClassId === 'all') return null;
    return classes.find((c) => c.id === selectedClassId) || null;
  }, [classes, selectedClassId]);

  // Students belonging to selected class / all classes for daily workspace
  const classStudents = useMemo(() => {
    return students.filter((s) => {
      // 1. Active status check
      const isActive = !s.status || s.status.toLowerCase() === 'active';
      if (!isActive) return false;

      // 2. Class check
      if (selectedClassId !== 'all') {
        if (selectedClass) {
          const matchId = s.classId === selectedClass.id;
          const matchCode = Boolean(selectedClass.classCode && s.classId === selectedClass.classCode);
          const matchName = Boolean(
            s.className &&
              (s.className.toLowerCase() === selectedClass.name.toLowerCase() ||
                selectedClass.name.toLowerCase().includes(s.className.toLowerCase()) ||
                s.className.toLowerCase().includes(selectedClass.name.toLowerCase()))
          );
          if (!matchId && !matchCode && !matchName) return false;
        } else {
          if (s.classId !== selectedClassId) return false;
        }
      }

      // 3. Shift check
      if (selectedShift !== 'all') {
        const studentShift = (s.shift || (selectedClass ? selectedClass.shift : 'morning')).toLowerCase();
        if (studentShift !== selectedShift.toLowerCase()) return false;
      }

      return true;
    });
  }, [students, selectedClassId, selectedClass, selectedShift]);

  // Load existing attendance records for the selectedDate & selectedClassId
  React.useEffect(() => {
    const existingForDay = attendance.filter((a) => a.date === selectedDate);

    const draftMap: Record<string, { status: AttendanceStatus; note: string }> = {};

    classStudents.forEach((stu) => {
      const match = existingForDay.find((r) => r.studentId === stu.id);
      if (match) {
        draftMap[stu.id] = {
          status: match.status,
          note: match.note || ''
        };
      } else {
        // Default to present if not marked yet
        draftMap[stu.id] = {
          status: 'present',
          note: ''
        };
      }
    });

    setAttendanceDraft(draftMap);
  }, [selectedDate, selectedClassId, selectedShift, classStudents, attendance]);

  // Update single student attendance status
  const handleSetStatus = (studentId: string, status: AttendanceStatus) => {
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនអាចកែប្រែវត្តមានបានទេ (Read-Only Mode)!', 'info');
      return;
    }
    setAttendanceDraft((prev) => ({
      ...prev,
      [studentId]: {
        status,
        note: prev[studentId]?.note || ''
      }
    }));
  };

  // Update note
  const handleSetNote = (studentId: string, note: string) => {
    if (isReadOnly) return;
    setAttendanceDraft((prev) => ({
      ...prev,
      [studentId]: {
        status: prev[studentId]?.status || 'present',
        note
      }
    }));
  };

  // Mark all students as present
  const handleMarkAllPresent = () => {
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនអាចកែប្រែវត្តមានបានទេ (Read-Only Mode)!', 'info');
      return;
    }
    const updated: Record<string, { status: AttendanceStatus; note: string }> = {};
    classStudents.forEach((stu) => {
      updated[stu.id] = {
        status: 'present',
        note: attendanceDraft[stu.id]?.note || ''
      };
    });
    setAttendanceDraft(updated);
    showToast('បានកំណត់វត្តមាន (Present) សម្រាប់និស្សិតទាំងអស់!', 'info');
  };

  // Save attendance batch to Firestore / service
  const handleSaveAttendance = async () => {
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនអាចរក្សាទុកទិន្នន័យបានទេ (Read-Only Mode)!', 'info');
      return;
    }
    if (classStudents.length === 0) {
      showToast('មិនមាននិស្សិតដើម្បីរក្សាទុកវត្តមានទេ', 'info');
      return;
    }
    setIsSaving(true);

    try {
      const recordsToSave: AttendanceRecord[] = classStudents.map((stu) => {
        const draft = attendanceDraft[stu.id] || { status: 'present', note: '' };
        const assignedClassId = stu.classId || (selectedClass ? selectedClass.id : classes[0]?.id || 'general');
        const assignedShift = stu.shift || (selectedClass ? selectedClass.shift : 'morning');
        return {
          id: `att_${selectedDate}_${assignedClassId}_${stu.id}`,
          date: selectedDate,
          classId: assignedClassId,
          shift: assignedShift,
          studentId: stu.id,
          studentName: stu.nameKhmer || stu.nameLatin || 'និស្សិត',
          status: draft.status,
          note: draft.note.trim() || undefined,
          createdAt: new Date().toISOString()
        };
      });

      await instituteService.saveAttendanceBatch(recordsToSave);
      showToast(`បានរក្សាទុកវត្តមានចំនួន ${recordsToSave.length} នាក់ដោយជោគជ័យ!`, 'success');
    } catch (e) {
      console.error(e);
      showToast('បរាជ័យក្នុងការរក្សាទុកវត្តមាន', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Export today's attendance
  const handleExportAttendance = () => {
    if (classStudents.length === 0) {
      showToast('មិនមានទិន្នន័យដើម្បី Export', 'info');
      return;
    }
    const currentRecords: AttendanceRecord[] = classStudents.map((stu) => {
      const draft = attendanceDraft[stu.id] || { status: 'present', note: '' };
      const assignedClassId = stu.classId || (selectedClass ? selectedClass.id : 'general');
      const assignedShift = stu.shift || (selectedClass ? selectedClass.shift : 'morning');
      return {
        id: `att_${selectedDate}_${assignedClassId}_${stu.id}`,
        date: selectedDate,
        classId: assignedClassId,
        shift: assignedShift,
        studentId: stu.id,
        studentName: stu.nameKhmer || stu.nameLatin || 'និស្សិត',
        status: draft.status,
        note: draft.note.trim() || undefined,
        createdAt: new Date().toISOString()
      };
    });
    const titleName = selectedClass ? selectedClass.name : 'គ្រប់ថ្នាក់ទាំងអស់';
    exportAttendanceToExcel(currentRecords, titleName, selectedDate);
  };

  // Export full daily report
  const handleExportDailyReport = () => {
    if (classStudents.length === 0) {
      showToast('មិនមានទិន្នន័យដើម្បី Export', 'info');
      return;
    }
    const titleName = selectedClass ? selectedClass.name : 'All_Classes';
    exportDailyAttendanceSummaryToExcel(attendance, filteredClassStudents, classes, selectedDate, titleName);
    showToast('បានទាញយករបាយការណ៍វត្តមានប្រចាំថ្ងៃ!', 'success');
  };

  // Export monthly report
  const handleExportMonthlyReport = () => {
    if (monthlyFilteredStudents.length === 0) {
      showToast('មិនមានទិន្នន័យដើម្បី Export', 'info');
      return;
    }
    const monthlyClassObj = classes.find((c) => c.id === monthlyClassId);
    const titleName = monthlyClassObj ? monthlyClassObj.name : 'All_Classes';
    exportStudentMonthlyAttendanceToExcel(monthlyFilteredStudents, attendance, selectedMonth, titleName);
    showToast(`បានទាញយករបាយការណ៍វត្តមានប្រចាំខែ ${selectedMonth}!`, 'success');
  };

  // Filtered by local search query for daily view
  const filteredClassStudents = useMemo(() => {
    if (!search.trim()) return classStudents;
    const q = search.toLowerCase();
    return classStudents.filter(
      (s) =>
        (s.nameKhmer || '').toLowerCase().includes(q) ||
        (s.studentCode || '').toLowerCase().includes(q) ||
        (s.nameLatin || '').toLowerCase().includes(q)
    );
  }, [classStudents, search]);

  // Daily statistics for current draft
  const presentCount = Object.values(attendanceDraft).filter((v) => v.status === 'present').length;
  const permissionCount = Object.values(attendanceDraft).filter((v) => v.status === 'permission').length;
  const absentCount = Object.values(attendanceDraft).filter((v) => v.status === 'absent').length;
  const lateCount = Object.values(attendanceDraft).filter((v) => v.status === 'late').length;
  const totalMarked = presentCount + permissionCount + absentCount + lateCount;
  const dailyAttendanceRate = totalMarked > 0 ? Math.round(((presentCount + permissionCount) / totalMarked) * 100) : 100;

  // -------------------------------------------------------------
  // MONTHLY REPORT COMPUTATIONS
  // -------------------------------------------------------------
  const [monthlyYearStr, monthlyMonthStr] = selectedMonth.split('-');
  const daysInSelectedMonth = useMemo(() => {
    const y = parseInt(monthlyYearStr || '2026', 10);
    const m = parseInt(monthlyMonthStr || '8', 10);
    return new Date(y, m, 0).getDate();
  }, [monthlyYearStr, monthlyMonthStr]);

  const daysArray = useMemo(() => {
    return Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1);
  }, [daysInSelectedMonth]);

  // Monthly filtered students list
  const monthlyFilteredStudents = useMemo(() => {
    return students.filter((s) => {
      const isActive = !s.status || s.status.toLowerCase() === 'active';
      if (!isActive) return false;

      if (monthlyClassId !== 'all') {
        const c = classes.find((cl) => cl.id === monthlyClassId);
        if (c) {
          const matchId = s.classId === c.id;
          const matchCode = Boolean(c.classCode && s.classId === c.classCode);
          const matchName = Boolean(
            s.className &&
              (s.className.toLowerCase() === c.name.toLowerCase() ||
                c.name.toLowerCase().includes(s.className.toLowerCase()) ||
                s.className.toLowerCase().includes(c.name.toLowerCase()))
          );
          if (!matchId && !matchCode && !matchName) return false;
        } else {
          if (s.classId !== monthlyClassId) return false;
        }
      }

      if (monthlyShift !== 'all') {
        const studentShift = (s.shift || 'morning').toLowerCase();
        if (studentShift !== monthlyShift.toLowerCase()) return false;
      }

      if (monthlySearch.trim()) {
        const q = monthlySearch.toLowerCase();
        const match =
          (s.nameKhmer || '').toLowerCase().includes(q) ||
          (s.studentCode || '').toLowerCase().includes(q) ||
          (s.nameLatin || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [students, monthlyClassId, monthlyShift, monthlySearch, classes]);

  // Pre-index monthly attendance records for fast lookup: studentId -> date (YYYY-MM-DD) -> AttendanceRecord
  const monthlyAttendanceMap = useMemo(() => {
    const map = new Map<string, Map<string, AttendanceRecord>>();
    attendance.forEach((rec) => {
      if (rec.date.startsWith(selectedMonth)) {
        if (!map.has(rec.studentId)) {
          map.set(rec.studentId, new Map());
        }
        map.get(rec.studentId)!.set(rec.date, rec);
      }
    });
    return map;
  }, [attendance, selectedMonth]);

  // Monthly stats per student
  const studentMonthlySummary = useMemo(() => {
    return monthlyFilteredStudents.map((s) => {
      const dateMap = monthlyAttendanceMap.get(s.id);
      let p = 0;
      let e = 0;
      let a = 0;
      let l = 0;

      daysArray.forEach((d) => {
        const dateKey = `${selectedMonth}-${String(d).padStart(2, '0')}`;
        const rec = dateMap?.get(dateKey);
        if (rec) {
          if (rec.status === 'present') p++;
          else if (rec.status === 'permission') e++;
          else if (rec.status === 'absent') a++;
          else if (rec.status === 'late') l++;
        }
      });

      const totalRecorded = p + e + a + l;
      const rate = totalRecorded > 0 ? Math.round(((p + e) / totalRecorded) * 100) : 100;

      return {
        student: s,
        present: p,
        permission: e,
        absent: a,
        late: l,
        totalRecorded,
        rate
      };
    });
  }, [monthlyFilteredStudents, monthlyAttendanceMap, daysArray, selectedMonth]);

  // Apply risk filter on monthly summary
  const filteredMonthlySummary = useMemo(() => {
    if (monthlyRiskFilter === 'high_absence') {
      return studentMonthlySummary.filter((item) => item.absent >= 3);
    }
    if (monthlyRiskFilter === 'perfect') {
      return studentMonthlySummary.filter((item) => item.absent === 0 && item.present > 0);
    }
    return studentMonthlySummary;
  }, [studentMonthlySummary, monthlyRiskFilter]);

  // Total month-wide aggregate counters
  const totalMonthPresent = studentMonthlySummary.reduce((acc, curr) => acc + curr.present, 0);
  const totalMonthPermission = studentMonthlySummary.reduce((acc, curr) => acc + curr.permission, 0);
  const totalMonthAbsent = studentMonthlySummary.reduce((acc, curr) => acc + curr.absent, 0);
  const totalMonthLate = studentMonthlySummary.reduce((acc, curr) => acc + curr.late, 0);
  const totalMonthRecords = totalMonthPresent + totalMonthPermission + totalMonthAbsent + totalMonthLate;
  const overallMonthlyRate = totalMonthRecords > 0 ? Math.round(((totalMonthPresent + totalMonthPermission) / totalMonthRecords) * 100) : 100;
  const highAbsenceStudentsCount = studentMonthlySummary.filter((item) => item.absent >= 3).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header Card with Segmented Tab Switcher */}
      <div className="bg-white dark:bg-[#131f1a] rounded-3xl p-5 sm:p-6 border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-sm">
              <CalendarCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            </span>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Student Attendance Workspace
            </h2>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 font-medium">
            គ្រប់គ្រងការកត់ត្រាវត្តមានប្រចាំថ្ងៃ និងតាមដានរបាយការណ៍វត្តមានប្រចាំខែ
          </p>
        </div>

        {/* 3 Workspace Sub-Tabs Switcher */}
        <div className="bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-2xl flex items-center gap-1 border border-zinc-200 dark:border-zinc-700">
          <button
            id="tab-attendance-workspace"
            type="button"
            onClick={() => setSubTab('workspace')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              subTab === 'workspace'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>កត់ត្រាវត្តមាន</span>
          </button>

          <button
            id="tab-attendance-daily-report"
            type="button"
            onClick={() => setSubTab('daily_report')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              subTab === 'daily_report'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>របាយការណ៍ប្រចាំថ្ងៃ</span>
          </button>

          <button
            id="tab-attendance-monthly-report"
            type="button"
            onClick={() => setSubTab('monthly_report')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              subTab === 'monthly_report'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5" />
            <span>របាយការណ៍ប្រចាំខែ</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: DAILY ATTENDANCE MARKING WORKSPACE                                */}
      {/* ========================================================================= */}
      {subTab === 'workspace' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#131f1a] rounded-2xl p-4 border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100">
                កាលបរិច្ឆេទកត់ត្រា៖
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono font-bold text-xs border border-emerald-200 dark:border-emerald-800/60">
                {selectedDate}
              </span>
              <span className="text-zinc-400">•</span>
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                និស្សិតសរុប {classStudents.length} នាក់
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {!isReadOnly && (
                <button
                  onClick={handleMarkAllPresent}
                  className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>វត្តមានទាំងអស់ (All Present)</span>
                </button>
              )}

              <button
                onClick={handleExportAttendance}
                className="px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-200 dark:border-zinc-700"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
                <span>Export Excel</span>
              </button>

              {!isReadOnly ? (
                <button
                  onClick={handleSaveAttendance}
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs inline-flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកវត្តមាន'}</span>
                </button>
              ) : (
                <div className="px-3.5 py-2 rounded-xl bg-amber-100 dark:bg-amber-950/50 border border-amber-300/50 dark:border-amber-800/50 text-amber-900 dark:text-amber-200 font-bold text-xs inline-flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>របៀបភ្ញៀវ (Read-Only)</span>
                </div>
              )}
            </div>
          </div>

          {/* Select Class & Date Controls */}
          <div className="bg-white dark:bg-[#131f1a] rounded-2xl p-4 border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Class Selector */}
              <div>
                <label className="block text-xs font-black text-black dark:text-zinc-100 mb-1">
                  ជ្រើសរើសថ្នាក់រៀន (Classroom)
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-300 dark:border-zinc-700/80 rounded-xl text-xs font-bold text-black dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden cursor-pointer shadow-2xs"
                >
                  <option value="all" className="dark:bg-[#131f1a]">
                    ⚡ គ្រប់ថ្នាក់ទាំងអស់ (All Classes) - {students.length} នាក់
                  </option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id} className="dark:bg-[#131f1a]">
                      {c.name} ({getShiftLabel(c.shift)}) - {c.room}
                    </option>
                  ))}
                </select>
              </div>

              {/* Shift Filter */}
              <div>
                <label className="block text-xs font-black text-black dark:text-zinc-100 mb-1">
                  វេនសិក្សា (Shift)
                </label>
                <select
                  value={selectedShift}
                  onChange={(e) => setSelectedShift(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-300 dark:border-zinc-700/80 rounded-xl text-xs font-bold text-black dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden cursor-pointer shadow-2xs"
                >
                  <option value="all" className="dark:bg-[#131f1a]">គ្រប់វេនទាំងអស់ (All Shifts)</option>
                  <option value="morning" className="dark:bg-[#131f1a]">ព្រឹក (Morning)</option>
                  <option value="afternoon" className="dark:bg-[#131f1a]">រសៀល (Afternoon)</option>
                  <option value="evening" className="dark:bg-[#131f1a]">យប់ (Evening)</option>
                  <option value="weekend" className="dark:bg-[#131f1a]">ចុងសប្តាហ៍ (Weekend)</option>
                </select>
              </div>

              {/* Date Selector */}
              <div>
                <label className="block text-xs font-black text-black dark:text-zinc-100 mb-1">
                  កាលបរិច្ឆេទ (Attendance Date)
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-300 dark:border-zinc-700/80 rounded-xl text-xs font-bold text-black dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden font-mono shadow-2xs"
                />
              </div>

              {/* Local Search */}
              <div>
                <label className="block text-xs font-black text-black dark:text-zinc-100 mb-1">
                  ស្វែងរកឈ្មោះ / អត្តលេខ
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="ឈ្មោះ ឬ អត្តលេខ..."
                    className="w-full pl-8 pr-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-300 dark:border-zinc-700/80 rounded-xl text-xs font-bold text-black dark:text-zinc-100 placeholder:text-zinc-500 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Info badge & Stat counters */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-zinc-800 dark:text-zinc-100">
                  {selectedClass ? selectedClass.name : 'គ្រប់ថ្នាក់ទាំងអស់ (All Classes)'}
                </span>
                <span className="text-zinc-400">•</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                  សរុប {classStudents.length} នាក់
                </span>
                {selectedClass && (
                  <>
                    <span className="text-zinc-400">•</span>
                    <span className="text-zinc-600 dark:text-zinc-400 font-bold">{selectedClass.room}</span>
                  </>
                )}
              </div>

              {/* Quick Stat Pills */}
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 font-black text-xs">
                  វត្តមាន (E): {presentCount}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 font-black text-xs">
                  សុំច្បាប់ (P): {permissionCount}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-300 font-black text-xs">
                  អវត្តមាន (A): {absentCount}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-300 font-black text-xs">
                  មកយឺត (L): {lateCount}
                </span>
              </div>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-white dark:bg-[#131f1a] rounded-3xl border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-100/90 dark:bg-[#182620] border-b border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">ល.រ</th>
                    <th className="py-3 px-4">អត្តលេខ</th>
                    <th className="py-3 px-4">ឈ្មោះនិស្សិត (Khmer / Latin)</th>
                    <th className="py-3 px-4">ថ្នាក់ / វេនសិក្សា</th>
                    <th className="py-3 px-4 text-center">ស្ថានភាពវត្តមាន (Status)</th>
                    <th className="py-3 px-4">កំណត់ចំណាំ / មូលហេតុសុំច្បាប់ (Notes)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filteredClassStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-zinc-400">
                        <Users className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
                        <p className="font-bold text-zinc-700 dark:text-zinc-300">ពុំមាននិស្សិតក្នុងលក្ខខណ្ឌជ្រើសរើសនេះទេ</p>
                        <p className="text-xs">សូមជ្រើសរើស "គ្រប់ថ្នាក់ទាំងអស់" ឬថ្នាក់រៀនផ្សេង</p>
                      </td>
                    </tr>
                  ) : (
                    filteredClassStudents.map((stu, index) => {
                      const draft = attendanceDraft[stu.id] || { status: 'present', note: '' };
                      const studentClass = classes.find((c) => c.id === stu.classId);
                      const classNameDisplay = stu.className || studentClass?.name || 'ថ្នាក់ទូទៅ';
                      const shiftDisplay = stu.shift || studentClass?.shift || 'morning';

                      return (
                        <tr key={stu.id} className="hover:bg-zinc-50/80 dark:hover:bg-[#182620]/60 transition-colors">
                          <td className="py-3 px-4 text-center font-bold text-zinc-500">
                            {index + 1}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-zinc-900 dark:text-zinc-200">
                            {stu.studentCode}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-black text-black dark:text-zinc-100">{stu.nameKhmer}</div>
                            <div className="text-xs text-zinc-600 dark:text-zinc-400 font-bold">
                              {stu.nameLatin} {stu.nameChinese && `• ${stu.nameChinese}`}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-bold text-xs">
                              {classNameDisplay} ({getShiftLabel(shiftDisplay as ShiftType)})
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Present Button */}
                              <button
                                type="button"
                                disabled={isReadOnly}
                                onClick={() => handleSetStatus(stu.id, 'present')}
                                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all ${
                                  draft.status === 'present'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-700 dark:hover:text-emerald-300'
                                } ${isReadOnly ? 'cursor-default opacity-90' : 'cursor-pointer'}`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>វត្តមាន</span>
                              </button>

                              {/* Permission Button */}
                              <button
                                type="button"
                                disabled={isReadOnly}
                                onClick={() => handleSetStatus(stu.id, 'permission')}
                                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all ${
                                  draft.status === 'permission'
                                    ? 'bg-amber-600 text-white shadow-xs'
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-amber-50 dark:hover:bg-amber-950/50 hover:text-amber-700 dark:hover:text-amber-300'
                                } ${isReadOnly ? 'cursor-default opacity-90' : 'cursor-pointer'}`}
                              >
                                <Clock className="w-3.5 h-3.5" />
                                <span>សុំច្បាប់</span>
                              </button>

                              {/* Absent Button */}
                              <button
                                type="button"
                                disabled={isReadOnly}
                                onClick={() => handleSetStatus(stu.id, 'absent')}
                                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all ${
                                  draft.status === 'absent'
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-700 dark:hover:text-rose-300'
                                } ${isReadOnly ? 'cursor-default opacity-90' : 'cursor-pointer'}`}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>អវត្តមាន</span>
                              </button>

                              {/* Late Button */}
                              <button
                                type="button"
                                disabled={isReadOnly}
                                onClick={() => handleSetStatus(stu.id, 'late')}
                                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all ${
                                  draft.status === 'late'
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-700 dark:hover:text-blue-300'
                                } ${isReadOnly ? 'cursor-default opacity-90' : 'cursor-pointer'}`}
                              >
                                <Clock className="w-3.5 h-3.5" />
                                <span>យឺត</span>
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              disabled={isReadOnly}
                              value={draft.note}
                              onChange={(e) => handleSetNote(stu.id, e.target.value)}
                              placeholder={isReadOnly ? 'គ្មានមូលហេតុ' : 'មូលហេតុ (ឧ. មានធុរៈគ្រួសារ, ឈឺ...)'}
                              className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden font-medium disabled:opacity-75 disabled:cursor-not-allowed"
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: DAILY ATTENDANCE REPORT (របាយការណ៍វត្តមានប្រចាំថ្ងៃ)                 */}
      {/* ========================================================================= */}
      {subTab === 'daily_report' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Daily Report Filter Card */}
          <div className="bg-white dark:bg-[#131f1a] rounded-3xl p-6 border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
                  របាយការណ៍វត្តមានប្រចាំថ្ងៃ (Daily Attendance Report)
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer border border-zinc-200 dark:border-zinc-700"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>បោះពុម្ព (Print)</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportDailyReport}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>ទាញយក Excel</span>
                </button>
              </div>
            </div>

            {/* Filter inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-black text-black dark:text-zinc-100 mb-1">
                  ជ្រើសរើសកាលបរិច្ឆេទ
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-300 dark:border-zinc-700/80 rounded-xl text-xs font-bold text-black dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-black dark:text-zinc-100 mb-1">
                  ថ្នាក់រៀន (Classroom)
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-300 dark:border-zinc-700/80 rounded-xl text-xs font-bold text-black dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden cursor-pointer"
                >
                  <option value="all" className="dark:bg-[#131f1a]">⚡ គ្រប់ថ្នាក់ទាំងអស់ (All Classes)</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id} className="dark:bg-[#131f1a]">
                      {c.name} ({getShiftLabel(c.shift)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-black dark:text-zinc-100 mb-1">
                  វេនសិក្សា (Shift)
                </label>
                <select
                  value={selectedShift}
                  onChange={(e) => setSelectedShift(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-300 dark:border-zinc-700/80 rounded-xl text-xs font-bold text-black dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden cursor-pointer"
                >
                  <option value="all" className="dark:bg-[#131f1a]">គ្រប់វេនទាំងអស់</option>
                  <option value="morning" className="dark:bg-[#131f1a]">ព្រឹក (Morning)</option>
                  <option value="afternoon" className="dark:bg-[#131f1a]">រសៀល (Afternoon)</option>
                  <option value="evening" className="dark:bg-[#131f1a]">យប់ (Evening)</option>
                  <option value="weekend" className="dark:bg-[#131f1a]">ចុងសប្តាហ៍ (Weekend)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-black dark:text-zinc-100 mb-1">
                  ស្វែងរកឈ្មោះ / អត្តលេខ
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="ឈ្មោះ ឬ អត្តលេខ..."
                    className="w-full pl-8 pr-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-300 dark:border-zinc-700/80 rounded-xl text-xs font-bold text-black dark:text-zinc-100 placeholder:text-zinc-500 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Daily 4 Stat Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Total Students */}
            <div className="bg-white dark:bg-[#131f1a] rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
                និស្សិតសរុប
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-zinc-900 dark:text-white">
                  {classStudents.length}
                </span>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  {dailyAttendanceRate}% វត្តមាន
                </span>
              </div>
            </div>

            {/* Present */}
            <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
              <span className="text-xs font-black text-emerald-950 dark:text-emerald-300 block mb-1">
                វត្តមាន (E)
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-emerald-900 dark:text-emerald-200">
                  {presentCount}
                </span>
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>

            {/* Permission */}
            <div className="bg-amber-50 dark:bg-amber-950/40 rounded-2xl p-4 border border-amber-200 dark:border-amber-800/60 shadow-xs">
              <span className="text-xs font-black text-amber-950 dark:text-amber-300 block mb-1">
                សុំច្បាប់ (P)
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-amber-900 dark:text-amber-200">
                  {permissionCount}
                </span>
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>

            {/* Absent */}
            <div className="bg-rose-50 dark:bg-rose-950/40 rounded-2xl p-4 border border-rose-200 dark:border-rose-800/60 shadow-xs">
              <span className="text-xs font-black text-rose-950 dark:text-rose-300 block mb-1">
                អវត្តមាន (A)
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-rose-900 dark:text-rose-200">
                  {absentCount}
                </span>
                <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
            </div>

            {/* Late */}
            <div className="bg-blue-50 dark:bg-blue-950/40 rounded-2xl p-4 border border-blue-200 dark:border-blue-800/60 shadow-xs col-span-2 lg:col-span-1">
              <span className="text-xs font-black text-blue-950 dark:text-blue-300 block mb-1">
                មកយឺត (L)
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-blue-900 dark:text-blue-200">
                  {lateCount}
                </span>
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          {/* Detailed Daily Attendance Sheet Table */}
          <div className="bg-white dark:bg-[#131f1a] rounded-3xl border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                បញ្ជីឈ្មោះវត្តមានប្រចាំថ្ងៃ {selectedDate} ({filteredClassStudents.length} នាក់)
              </h4>
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/50">
                អត្រាវត្តមានសរុប៖ {dailyAttendanceRate}%
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-100/90 dark:bg-[#182620] border-b border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300 font-bold uppercase text-[10.5px]">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">ល.រ</th>
                    <th className="py-3 px-4">អត្តលេខ</th>
                    <th className="py-3 px-4">ឈ្មោះនិស្សិត (ខ្មែរ / ឡាតាំង)</th>
                    <th className="py-3 px-4">ភេទ</th>
                    <th className="py-3 px-4">ថ្នាក់ / វេនសិក្សា</th>
                    <th className="py-3 px-4 text-center">ស្ថានភាពវត្តមាន</th>
                    <th className="py-3 px-4">កំណត់ចំណាំ / មូលហេតុ</th>
                    <th className="py-3 px-4">ទូរស័ព្ទអាណាព្យាបាល</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filteredClassStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-zinc-400">
                        ពុំមានទិន្នន័យនិស្សិត
                      </td>
                    </tr>
                  ) : (
                    filteredClassStudents.map((stu, index) => {
                      const draft = attendanceDraft[stu.id] || { status: 'present', note: '' };
                      const studentClass = classes.find((c) => c.id === stu.classId);

                      return (
                        <tr key={stu.id} className="hover:bg-zinc-50/80 dark:hover:bg-[#182620]/60">
                          <td className="py-2.5 px-4 text-center font-bold text-zinc-500">{index + 1}</td>
                          <td className="py-2.5 px-4 font-mono font-bold text-zinc-900 dark:text-zinc-200">{stu.studentCode}</td>
                          <td className="py-2.5 px-4">
                            <span className="font-bold text-black dark:text-zinc-100">{stu.nameKhmer}</span>
                            <span className="text-zinc-600 dark:text-zinc-400 ml-1 text-xs font-semibold">({stu.nameLatin})</span>
                          </td>
                          <td className="py-2.5 px-4 font-bold text-zinc-700 dark:text-zinc-300">
                            {stu.gender === 'female' ? 'ស្រី' : 'ប្រុស'}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">
                              {stu.className || studentClass?.name || 'ថ្នាក់ទូទៅ'}
                            </span>
                            <span className="text-zinc-500 dark:text-zinc-400 text-[10px] block font-semibold">
                              {getShiftLabel(stu.shift)}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            {draft.status === 'present' && (
                              <span className="px-2.5 py-1 rounded-full font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 text-xs inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                វត្តមាន (E)
                              </span>
                            )}
                            {draft.status === 'permission' && (
                              <span className="px-2.5 py-1 rounded-full font-black bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 text-xs inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                សុំច្បាប់ (P)
                              </span>
                            )}
                            {draft.status === 'absent' && (
                              <span className="px-2.5 py-1 rounded-full font-black bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-300 text-xs inline-flex items-center gap-1">
                                <XCircle className="w-3 h-3" />
                                អវត្តមាន (A)
                              </span>
                            )}
                            {draft.status === 'late' && (
                              <span className="px-2.5 py-1 rounded-full font-black bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-blue-300 text-xs inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                មកយឺត (L)
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 font-medium text-zinc-700 dark:text-zinc-300">
                            {draft.note || '-'}
                          </td>
                          <td className="py-2.5 px-4 font-bold font-mono text-zinc-800 dark:text-zinc-200">
                            {stu.guardianPhone || stu.phone || '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: MONTHLY ATTENDANCE REPORT & MATRIX (របាយការណ៍វត្តមានប្រចាំខែ)          */}
      {/* ========================================================================= */}
      {subTab === 'monthly_report' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Monthly Controls Card */}
          <div className="bg-white dark:bg-[#131f1a] rounded-3xl p-6 border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <CalendarRange className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
                    របាយការណ៍វត្តមានប្រចាំខែ (Monthly Student Attendance Matrix)
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                    តារាងវត្តមានលម្អិតតាមថ្ងៃនីមួយៗ (Day 1 - {daysInSelectedMonth}) ក្នុងខែ {selectedMonth}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer border border-zinc-200 dark:border-zinc-700"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>បោះពុម្ព</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportMonthlyReport}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>ទាញយក Excel ប្រចាំខែ</span>
                </button>
              </div>
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Select Year-Month */}
              <div>
                <label className="block text-xs font-black text-black dark:text-zinc-100 mb-1">
                  ជ្រើសរើសខែ / ឆ្នាំ (Month)
                </label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-300 dark:border-zinc-700/80 rounded-xl text-xs font-bold text-black dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden font-mono"
                />
              </div>

              {/* Select Classroom */}
              <div>
                <label className="block text-xs font-black text-black dark:text-zinc-100 mb-1">
                  ថ្នាក់រៀន (Classroom)
                </label>
                <select
                  value={monthlyClassId}
                  onChange={(e) => setMonthlyClassId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-300 dark:border-zinc-700/80 rounded-xl text-xs font-bold text-black dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden cursor-pointer"
                >
                  <option value="all" className="dark:bg-[#131f1a]">⚡ គ្រប់ថ្នាក់ទាំងអស់ (All Classes)</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id} className="dark:bg-[#131f1a]">
                      {c.name} ({getShiftLabel(c.shift)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Shift Filter */}
              <div>
                <label className="block text-xs font-black text-black dark:text-zinc-100 mb-1">
                  វេនសិក្សា (Shift)
                </label>
                <select
                  value={monthlyShift}
                  onChange={(e) => setMonthlyShift(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-300 dark:border-zinc-700/80 rounded-xl text-xs font-bold text-black dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden cursor-pointer"
                >
                  <option value="all" className="dark:bg-[#131f1a]">គ្រប់វេនទាំងអស់</option>
                  <option value="morning" className="dark:bg-[#131f1a]">ព្រឹក (Morning)</option>
                  <option value="afternoon" className="dark:bg-[#131f1a]">រសៀល (Afternoon)</option>
                  <option value="evening" className="dark:bg-[#131f1a]">យប់ (Evening)</option>
                  <option value="weekend" className="dark:bg-[#131f1a]">ចុងសប្តាហ៍ (Weekend)</option>
                </select>
              </div>

              {/* Filter By Status Risk */}
              <div>
                <label className="block text-xs font-black text-black dark:text-zinc-100 mb-1">
                  ស្វែងរក / ច្រោះលក្ខខណ្ឌ
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={monthlySearch}
                    onChange={(e) => setMonthlySearch(e.target.value)}
                    placeholder="ឈ្មោះ ឬ អត្តលេខ..."
                    className="w-full pl-8 pr-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-300 dark:border-zinc-700/80 rounded-xl text-xs font-bold text-black dark:text-zinc-100 placeholder:text-zinc-500 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Quick Filter Buttons */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">តម្រៀបរហ័ស៖</span>
                <button
                  type="button"
                  onClick={() => setMonthlyRiskFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    monthlyRiskFilter === 'all'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  និស្សិតទាំងអស់ ({studentMonthlySummary.length})
                </button>
                <button
                  type="button"
                  onClick={() => setMonthlyRiskFilter('high_absence')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    monthlyRiskFilter === 'high_absence'
                      ? 'bg-rose-700 text-white'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>អវត្តមានលើសពី ៣ ដង ({highAbsenceStudentsCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMonthlyRiskFilter('perfect')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    monthlyRiskFilter === 'perfect'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                  }`}
                >
                  <Award className="w-3 h-3" />
                  <span>វត្តមានពេញ ១០០%</span>
                </button>
              </div>

              {/* Legend Badges */}
              <div className="flex items-center gap-2 text-[11px] font-bold">
                <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                  <span className="w-3.5 h-3.5 rounded bg-emerald-600 text-white flex items-center justify-center text-[9px] font-mono">E</span>
                  <span>វត្តមាន (E)</span>
                </span>
                <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
                  <span className="w-3.5 h-3.5 rounded bg-amber-500 text-white flex items-center justify-center text-[9px] font-mono">P</span>
                  <span>សុំច្បាប់ (P)</span>
                </span>
                <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-400">
                  <span className="w-3.5 h-3.5 rounded bg-rose-600 text-white flex items-center justify-center text-[9px] font-mono">A</span>
                  <span>អវត្តមាន (A)</span>
                </span>
                <span className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-400">
                  <span className="w-3.5 h-3.5 rounded bg-blue-600 text-white flex items-center justify-center text-[9px] font-mono">L</span>
                  <span>យឺត (L)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Monthly Aggregate Statistics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="bg-white dark:bg-[#131f1a] rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
                អត្រាវត្តមានប្រចាំខែ
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-zinc-900 dark:text-white">
                  {overallMonthlyRate}%
                </span>
                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
              <span className="text-xs font-black text-emerald-950 dark:text-emerald-300 block mb-1">
                សរុបវត្តមាន (E)
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-emerald-900 dark:text-emerald-200">
                  {totalMonthPresent}
                </span>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">ដង</span>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/40 rounded-2xl p-4 border border-amber-200 dark:border-amber-800/60 shadow-xs">
              <span className="text-xs font-black text-amber-950 dark:text-amber-300 block mb-1">
                សរុបសុំច្បាប់ (P)
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-amber-900 dark:text-amber-200">
                  {totalMonthPermission}
                </span>
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400">ដង</span>
              </div>
            </div>

            <div className="bg-rose-50 dark:bg-rose-950/40 rounded-2xl p-4 border border-rose-200 dark:border-rose-800/60 shadow-xs">
              <span className="text-xs font-black text-rose-950 dark:text-rose-300 block mb-1">
                សរុបអវត្តមាន (A)
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-rose-900 dark:text-rose-200">
                  {totalMonthAbsent}
                </span>
                <span className="text-xs font-bold text-rose-700 dark:text-rose-400">ដង</span>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/40 rounded-2xl p-4 border border-blue-200 dark:border-blue-800/60 shadow-xs col-span-2 lg:col-span-1">
              <span className="text-xs font-black text-blue-950 dark:text-blue-300 block mb-1">
                សរុបមកយឺត (L)
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-blue-900 dark:text-blue-200">
                  {totalMonthLate}
                </span>
                <span className="text-xs font-bold text-blue-700 dark:text-blue-400">ដង</span>
              </div>
            </div>
          </div>

          {/* Full Monthly Matrix Table */}
          <div className="bg-white dark:bg-[#131f1a] rounded-3xl border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                តារាងវត្តមានប្រចាំខែ {selectedMonth} ({filteredMonthlySummary.length} នាក់)
              </h4>
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-600 dark:text-zinc-400">
                <span>E = វត្តមាន</span>
                <span>•</span>
                <span>P = សុំច្បាប់</span>
                <span>•</span>
                <span>A = អវត្តមាន</span>
                <span>•</span>
                <span>L = មកយឺត</span>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-zinc-100/90 dark:bg-[#182620] sticky top-0 z-10 text-zinc-800 dark:text-zinc-300 font-bold uppercase text-[10px] border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center bg-zinc-100/95 dark:bg-[#182620] sticky left-0 z-20">ល.រ</th>
                    <th className="py-2.5 px-3 min-w-[90px] bg-zinc-100/95 dark:bg-[#182620] sticky left-10 z-20">អត្តលេខ</th>
                    <th className="py-2.5 px-3 min-w-[140px] bg-zinc-100/95 dark:bg-[#182620] sticky left-32 z-20">ឈ្មោះខ្មែរ</th>
                    <th className="py-2.5 px-2 min-w-[65px]">ភេទ</th>
                    <th className="py-2.5 px-2 min-w-[100px]">ថ្នាក់ / វេន</th>
                    {/* 1 to 31 Day Headers */}
                    {daysArray.map((d) => (
                      <th key={d} className="py-2.5 px-1 text-center min-w-[28px] border-l border-zinc-200/60 dark:border-zinc-800/80">
                        {d}
                      </th>
                    ))}
                    {/* Summary Columns */}
                    <th className="py-2.5 px-2 text-center bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 font-black border-l border-zinc-200 dark:border-zinc-800">E</th>
                    <th className="py-2.5 px-2 text-center bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 font-black">P</th>
                    <th className="py-2.5 px-2 text-center bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-300 font-black">A</th>
                    <th className="py-2.5 px-2 text-center bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300 font-black">L</th>
                    <th className="py-2.5 px-3 text-center bg-zinc-200/70 dark:bg-zinc-800 font-black">% វត្តមាន</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filteredMonthlySummary.length === 0 ? (
                    <tr>
                      <td colSpan={daysArray.length + 10} className="py-12 text-center text-zinc-400">
                        ពុំមានទិន្នន័យនិស្សិតត្រូវនឹងលក្ខខណ្ឌជ្រើសរើសទេ
                      </td>
                    </tr>
                  ) : (
                    filteredMonthlySummary.map((item, index) => {
                      const stu = item.student;
                      const studentClass = classes.find((c) => c.id === stu.classId);
                      const studentDateMap = monthlyAttendanceMap.get(stu.id);

                      return (
                        <tr key={stu.id} className="hover:bg-zinc-50/80 dark:hover:bg-[#182620]/60 transition-colors">
                          <td className="py-2 px-3 text-center font-bold text-zinc-500 sticky left-0 bg-white dark:bg-[#131f1a] z-10">
                            {index + 1}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-zinc-900 dark:text-zinc-200 sticky left-10 bg-white dark:bg-[#131f1a] z-10">
                            {stu.studentCode}
                          </td>
                          <td className="py-2 px-3 font-black text-black dark:text-zinc-100 sticky left-32 bg-white dark:bg-[#131f1a] z-10 whitespace-nowrap">
                            {stu.nameKhmer}
                            {item.absent >= 3 && (
                              <span className="ml-1.5 px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 text-[9px] font-black">
                                អវត្តមានច្រើន
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-2 font-bold text-zinc-700 dark:text-zinc-300">
                            {stu.gender === 'female' ? 'ស្រី' : 'ប្រុស'}
                          </td>
                          <td className="py-2 px-2 text-[11px]">
                            <span className="font-bold text-zinc-800 dark:text-zinc-200 block truncate max-w-[100px]">
                              {stu.className || studentClass?.name || 'ថ្នាក់ទូទៅ'}
                            </span>
                          </td>

                          {/* 1 to 31 Day Cells */}
                          {daysArray.map((d) => {
                            const dateKey = `${selectedMonth}-${String(d).padStart(2, '0')}`;
                            const rec = studentDateMap?.get(dateKey);

                            return (
                              <td
                                key={d}
                                className="py-2 px-0.5 text-center border-l border-zinc-100 dark:border-zinc-800/60 font-mono text-[10px]"
                              >
                                {rec ? (
                                  rec.status === 'present' ? (
                                    <span className="inline-block w-5 h-5 leading-5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-black">
                                      E
                                    </span>
                                  ) : rec.status === 'permission' ? (
                                    <span className="inline-block w-5 h-5 leading-5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-black">
                                      P
                                    </span>
                                  ) : rec.status === 'absent' ? (
                                    <span className="inline-block w-5 h-5 leading-5 rounded bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 font-black">
                                      A
                                    </span>
                                  ) : (
                                    <span className="inline-block w-5 h-5 leading-5 rounded bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 font-black">
                                      L
                                    </span>
                                  )
                                ) : (
                                  <span className="text-zinc-300 dark:text-zinc-600">-</span>
                                )}
                              </td>
                            );
                          })}

                          {/* Totals */}
                          <td className="py-2 px-2 text-center font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 border-l border-zinc-200 dark:border-zinc-800">
                            {item.present}
                          </td>
                          <td className="py-2 px-2 text-center font-bold text-amber-800 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/20">
                            {item.permission}
                          </td>
                          <td className="py-2 px-2 text-center font-bold text-rose-800 dark:text-rose-300 bg-rose-50/50 dark:bg-rose-950/20">
                            {item.absent}
                          </td>
                          <td className="py-2 px-2 text-center font-bold text-blue-800 dark:text-blue-300 bg-blue-50/50 dark:bg-blue-950/20">
                            {item.late}
                          </td>
                          <td className="py-2 px-3 text-center font-black">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                                item.rate >= 90
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                  : item.rate >= 75
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                              }`}
                            >
                              {item.rate}%
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
