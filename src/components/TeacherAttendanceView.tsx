import React, { useState, useMemo } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  XCircle,
  Save,
  UserCheck,
  Search,
  BookOpen,
  Calendar,
  Users,
  FileSpreadsheet,
  Download,
  Upload,
  BarChart3,
  Layers,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { Teacher, TeacherAttendance, TeacherAttendanceStatus, ShiftType } from '../types';
import { instituteService } from '../service/instituteService';
import { ProfileImageViewerModal, ProfileViewTarget } from './ProfileImageViewerModal';
import {
  getShiftLabel,
  exportTeacherMonthlyAttendanceToExcel,
  downloadTeacherMonthlyTemplate,
  parseTeacherMonthlyAttendanceExcel
} from '../utils/exportUtils';

interface TeacherAttendanceViewProps {
  teachers: Teacher[];
  attendance: TeacherAttendance[];
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  isReadOnly?: boolean;
}

export const TeacherAttendanceView: React.FC<TeacherAttendanceViewProps> = ({
  teachers,
  attendance,
  showToast,
  isReadOnly = false
}) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedShift, setSelectedShift] = useState<string>('morning');
  const [search, setSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Monthly stats state
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());

  // Profile Image Viewer Modal State
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [imageViewerTarget, setImageViewerTarget] = useState<ProfileViewTarget | null>(null);

  const handleOpenPhotoViewer = (t: Teacher) => {
    setImageViewerTarget({
      nameKhmer: t.nameKhmer,
      nameLatin: t.nameLatin,
      nameChinese: t.nameChinese,
      code: t.teacherCode,
      photoUrl: t.photoUrl,
      gender: t.gender,
      degree: t.degree,
      subjects: t.subjects,
      shift: t.shift,
      phone: t.phone,
      email: t.email,
      roleOrStatus: t.status,
      isTeacher: true
    });
    setIsImageViewerOpen(true);
  };

  // Draft state: teacherId -> { status, note, subject }
  const [draft, setDraft] = useState<
    Record<string, { status: TeacherAttendanceStatus; note: string; subject: string }>
  >({});

  // Active teachers
  const activeTeachers = useMemo(() => {
    return teachers.filter((t) => !t.status || t.status.toLowerCase() === 'active');
  }, [teachers]);

  // Load existing records for this date & shift
  React.useEffect(() => {
    const existing = attendance.filter(
      (a) => a.date === selectedDate && a.shift === selectedShift
    );

    const draftMap: Record<string, { status: TeacherAttendanceStatus; note: string; subject: string }> = {};

    activeTeachers.forEach((t) => {
      const match = existing.find((r) => r.teacherId === t.id);
      if (match) {
        draftMap[t.id] = {
          status: match.status,
          note: match.note || '',
          subject: match.subject || t.subjects || ''
        };
      } else {
        draftMap[t.id] = {
          status: 'present',
          note: '',
          subject: t.subjects || ''
        };
      }
    });

    setDraft(draftMap);
  }, [selectedDate, selectedShift, activeTeachers, attendance]);

  const handleSetStatus = (teacherId: string, status: TeacherAttendanceStatus) => {
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនអាចកែប្រែវត្តមានបានទេ (Read-Only Mode)!', 'info');
      return;
    }
    setDraft((prev) => ({
      ...prev,
      [teacherId]: {
        ...prev[teacherId],
        status
      }
    }));
  };

  const handleSetNote = (teacherId: string, note: string) => {
    if (isReadOnly) return;
    setDraft((prev) => ({
      ...prev,
      [teacherId]: {
        ...prev[teacherId],
        note
      }
    }));
  };

  const handleMarkAllPresent = () => {
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនអាចកែប្រែវត្តមានបានទេ (Read-Only Mode)!', 'info');
      return;
    }
    const updated: Record<string, { status: TeacherAttendanceStatus; note: string; subject: string }> = {};
    activeTeachers.forEach((t) => {
      updated[t.id] = {
        status: 'present',
        note: draft[t.id]?.note || '',
        subject: draft[t.id]?.subject || t.subjects || ''
      };
    });
    setDraft(updated);
    showToast('បានកំណត់វត្តមានសាស្ត្រាចារ្យទាំងអស់!', 'info');
  };

  const handleSave = async () => {
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនអាចរក្សាទុកវត្តមានបានទេ (Read-Only Mode)!', 'info');
      return;
    }
    setIsSaving(true);
    try {
      const records: TeacherAttendance[] = activeTeachers.map((t) => {
        const d = draft[t.id] || { status: 'present', note: '', subject: t.subjects };
        return {
          id: `t_att_${selectedDate}_${selectedShift}_${t.id}`,
          date: selectedDate,
          teacherId: t.id,
          teacherName: t.nameKhmer,
          shift: selectedShift as ShiftType,
          subject: d.subject || t.subjects || 'ភាសាចិន',
          status: d.status,
          note: d.note.trim() || undefined,
          createdAt: new Date().toISOString()
        };
      });

      await instituteService.saveTeacherAttendanceBatch(records);
      showToast('បានរក្សាទុកវត្តមានសាស្ត្រាចារ្យដោយជោគជ័យ!', 'success');
    } catch (e) {
      showToast('បរាជ័យក្នុងការរក្សាទុក', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMonthlyExport = () => {
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនមានសិទ្ធិទាញយករបាយការណ៍ទេ (Read-Only Mode)!', 'info');
      return;
    }
    try {
      const yearMonth = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
      exportTeacherMonthlyAttendanceToExcel(teachers, attendance, yearMonth);
      showToast(`បានទាញយករបាយការណ៍វត្តមានប្រចាំខែ ${selectedMonth}/${selectedYear} ជោគជ័យ!`, 'success');
    } catch (e) {
      showToast('បរាជ័យក្នុងការ Export ឯកសារ', 'error');
    }
  };

  const handleDownloadTemplate = () => {
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនមានសិទ្ធិទាញយកទិន្នន័យទេ (Read-Only Mode)!', 'info');
      return;
    }
    try {
      const yearMonth = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
      downloadTeacherMonthlyTemplate(teachers, yearMonth);
      showToast(`បានទាញយកទម្រង់គំរូវត្តមានខែ ${selectedMonth}/${selectedYear} ជោគជ័យ!`, 'success');
    } catch (e) {
      showToast('បរាជ័យក្នុងការទាញយកគំរូ', 'error');
    }
  };

  const handleMonthlyImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនអាច Import ទិន្នន័យបានទេ (Read-Only Mode)!', 'info');
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const yearMonth = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
      const parsedRecords = await parseTeacherMonthlyAttendanceExcel(file, teachers, yearMonth);
      if (parsedRecords.length === 0) {
        showToast('មិនមានទិន្នន័យត្រឹមត្រូវក្នុងឯកសារ Excel ទេ', 'error');
        return;
      }

      await instituteService.saveTeacherAttendanceBatch(parsedRecords);
      showToast(`បានបញ្ចូលទិន្នន័យវត្តមានចំនួន ${parsedRecords.length} កំណត់ត្រាដោយជោគជ័យ!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('ទម្រង់ឯកសារ Excel មិនត្រឹមត្រូវ', 'error');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  // Monthly summary calculations
  const monthlySummary = useMemo(() => {
    const monthStr = String(selectedMonth).padStart(2, '0');
    const prefix = `${selectedYear}-${monthStr}`;

    const monthRecords = attendance.filter((a) => a.date.startsWith(prefix));

    return activeTeachers.map((t) => {
      const teacherRecords = monthRecords.filter((a) => a.teacherId === t.id);
      const present = teacherRecords.filter((a) => a.status === 'present').length;
      const permission = teacherRecords.filter((a) => a.status === 'permission').length;
      const absent = teacherRecords.filter((a) => a.status === 'absent').length;
      const substituted = teacherRecords.filter((a) => a.status === 'substituted').length;
      const total = teacherRecords.length;

      return {
        teacher: t,
        present,
        permission,
        absent,
        substituted,
        total
      };
    });
  }, [activeTeachers, attendance, selectedMonth, selectedYear]);

  const filteredTeachers = activeTeachers.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (t.nameKhmer || '').toLowerCase().includes(q) ||
      (t.nameLatin || '').toLowerCase().includes(q) ||
      (t.nameChinese || '').toLowerCase().includes(q) ||
      (t.teacherCode || '').toLowerCase().includes(q)
    );
  });

  const filteredMonthlySummary = monthlySummary.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (item.teacher.nameKhmer || '').toLowerCase().includes(q) ||
      (item.teacher.nameLatin || '').toLowerCase().includes(q) ||
      (item.teacher.nameChinese || '').toLowerCase().includes(q) ||
      (item.teacher.teacherCode || '').toLowerCase().includes(q)
    );
  });

  // Daily Pagination State
  const [dailyPageSize, setDailyPageSize] = useState<number>(25);
  const [dailyCurrentPage, setDailyCurrentPage] = useState<number>(1);

  // Monthly Pagination State
  const [monthlyPageSize, setMonthlyPageSize] = useState<number>(25);
  const [monthlyCurrentPage, setMonthlyCurrentPage] = useState<number>(1);

  // Reset daily page on filter change
  React.useEffect(() => {
    setDailyCurrentPage(1);
  }, [selectedDate, selectedShift, search, dailyPageSize]);

  const totalDailyPages = dailyPageSize === -1 ? 1 : Math.max(1, Math.ceil(filteredTeachers.length / dailyPageSize));
  const validDailyPage = Math.min(Math.max(1, dailyCurrentPage), totalDailyPages);

  const paginatedTeachers = useMemo(() => {
    if (dailyPageSize === -1) return filteredTeachers;
    const start = (validDailyPage - 1) * dailyPageSize;
    return filteredTeachers.slice(start, start + dailyPageSize);
  }, [filteredTeachers, validDailyPage, dailyPageSize]);

  const startDailyIndex = filteredTeachers.length === 0 ? 0 : dailyPageSize === -1 ? 1 : (validDailyPage - 1) * dailyPageSize + 1;
  const endDailyIndex = dailyPageSize === -1 ? filteredTeachers.length : Math.min(validDailyPage * dailyPageSize, filteredTeachers.length);

  // Reset monthly page on filter change
  React.useEffect(() => {
    setMonthlyCurrentPage(1);
  }, [selectedMonth, selectedYear, search, monthlyPageSize]);

  const totalMonthlyPages = monthlyPageSize === -1 ? 1 : Math.max(1, Math.ceil(filteredMonthlySummary.length / monthlyPageSize));
  const validMonthlyPage = Math.min(Math.max(1, monthlyCurrentPage), totalMonthlyPages);

  const paginatedMonthlySummary = useMemo(() => {
    if (monthlyPageSize === -1) return filteredMonthlySummary;
    const start = (validMonthlyPage - 1) * monthlyPageSize;
    return filteredMonthlySummary.slice(start, start + monthlyPageSize);
  }, [filteredMonthlySummary, validMonthlyPage, monthlyPageSize]);

  const startMonthlyIndex = filteredMonthlySummary.length === 0 ? 0 : monthlyPageSize === -1 ? 1 : (validMonthlyPage - 1) * monthlyPageSize + 1;
  const endMonthlyIndex = monthlyPageSize === -1 ? filteredMonthlySummary.length : Math.min(validMonthlyPage * monthlyPageSize, filteredMonthlySummary.length);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="bg-white dark:bg-[#131f1a] rounded-3xl p-6 border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-sm">
              <CalendarCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            </span>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              កត់ត្រាវត្តមានសាស្ត្រាចារ្យ (Faculty Attendance)
            </h2>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 font-medium">
            គ្រប់គ្រងវត្តមានប្រចាំថ្ងៃ និងរបាយការណ៍វត្តមានប្រចាំខែ Export/Import Excel
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800/80 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-700">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'daily'
                ? 'bg-white dark:bg-[#182620] text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>កត់ត្រាប្រចាំថ្ងៃ</span>
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'monthly'
                ? 'bg-white dark:bg-[#182620] text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>របាយការណ៍/វត្តមានប្រចាំខែ</span>
          </button>
        </div>
      </div>

      {activeTab === 'daily' ? (
        <>
          {/* Daily Controls */}
          <div className="bg-white dark:bg-[#131f1a] rounded-2xl p-4 border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                  កាលបរិច្ឆេទ (Date)
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                  វេនបង្រៀន (Teaching Shift)
                </label>
                <select
                  value={selectedShift}
                  onChange={(e) => setSelectedShift(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden cursor-pointer"
                >
                  <option value="morning">វេនព្រឹក (Morning)</option>
                  <option value="afternoon">វេនរសៀល (Afternoon)</option>
                  <option value="evening">វេនយប់ (Evening)</option>
                  <option value="weekend">ចុងសប្តាហ៍ (Weekend)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                  ស្វែងរកសាស្ត្រាចារ្យ
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="ឈ្មោះ ឬអត្តលេខ..."
                    className="w-full pl-8 pr-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                សាស្ត្រាចារ្យសរុប: <b className="text-zinc-900 dark:text-zinc-100">{filteredTeachers.length}</b> នាក់
              </span>

              <div className="flex items-center gap-2">
                {!isReadOnly && (
                  <>
                    <button
                      onClick={handleMarkAllPresent}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>វត្តមានទាំងអស់</span>
                    </button>

                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSaving ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកវត្តមាន'}</span>
                    </button>
                  </>
                )}
                {isReadOnly && (
                  <span className="px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 font-bold text-[11px]">
                    របៀបមើលព័ត៌មាន (Read-Only)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Daily Table */}
          <div className="bg-white dark:bg-[#131f1a] rounded-3xl border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-100/90 dark:bg-[#182620] border-b border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">ល.រ</th>
                    <th className="py-3 px-4">អត្តលេខ</th>
                    <th className="py-3 px-4">ឈ្មោះសាស្ត្រាចារ្យ</th>
                    <th className="py-3 px-4">មុខវិជ្ជាទទួលបន្ទុក</th>
                    <th className="py-3 px-4 text-center">ស្ថានភាពវត្តមាន</th>
                    <th className="py-3 px-4">សម្គាល់ / គ្រូបង្រៀនជំនួស</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                  {filteredTeachers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-zinc-400 dark:text-zinc-500">
                        <UserCheck className="w-8 h-8 text-zinc-400 dark:text-zinc-500 mx-auto mb-2" />
                        <p className="font-bold text-zinc-700 dark:text-zinc-300">ពុំមានទិន្នន័យសាស្ត្រាចារ្យទេ</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedTeachers.map((t, index) => {
                      const globalIndex = (dailyPageSize === -1 ? 0 : (validDailyPage - 1) * dailyPageSize) + index + 1;
                      const d = draft[t.id] || { status: 'present', note: '', subject: t.subjects };
                      return (
                        <tr key={t.id} className="hover:bg-zinc-50/80 dark:hover:bg-[#182620]/60 transition-colors">
                          <td className="py-3 px-4 text-center font-bold text-zinc-500 dark:text-zinc-400">
                            {globalIndex}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-zinc-800 dark:text-zinc-200">
                            {t.teacherCode}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              {/* Clickable Profile Photo */}
                              <button
                                type="button"
                                onClick={() => handleOpenPhotoViewer(t)}
                                className="relative group w-9 h-9 rounded-xl overflow-hidden border border-emerald-500/40 shadow-xs shrink-0 cursor-pointer focus:outline-hidden"
                                title="ចុចដើម្បីមើលរូបថតពេញទំហំ (Click to View Full Photo)"
                              >
                                {t.photoUrl ? (
                                  <img
                                    src={t.photoUrl}
                                    alt={t.nameKhmer}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div
                                    className={`w-full h-full flex items-center justify-center font-bold text-xs ${
                                      t.gender === 'female'
                                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200'
                                        : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200'
                                    }`}
                                  >
                                    {(t.nameKhmer || t.nameLatin || 'T').charAt(0)}
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                  <ZoomIn className="w-3.5 h-3.5" />
                                </div>
                              </button>
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{t.nameKhmer}</span>
                                  {t.nameChinese && (
                                    <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-200/60 dark:border-emerald-800/40">
                                      {t.nameChinese}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">{t.nameLatin}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-bold text-zinc-800 dark:text-zinc-200">
                            {t.subjects || '-'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                disabled={isReadOnly}
                                onClick={() => handleSetStatus(t.id, 'present')}
                                className={`px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all ${
                                  isReadOnly ? 'cursor-default' : 'cursor-pointer'
                                } ${
                                  d.status === 'present'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                                } ${isReadOnly && d.status !== 'present' ? 'opacity-40' : ''}`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>វត្តមាន</span>
                              </button>

                              <button
                                type="button"
                                disabled={isReadOnly}
                                onClick={() => handleSetStatus(t.id, 'permission')}
                                className={`px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all ${
                                  isReadOnly ? 'cursor-default' : 'cursor-pointer'
                                } ${
                                  d.status === 'permission'
                                    ? 'bg-amber-600 text-white shadow-xs'
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                                } ${isReadOnly && d.status !== 'permission' ? 'opacity-40' : ''}`}
                              >
                                <Clock className="w-3.5 h-3.5" />
                                <span>សុំច្បាប់</span>
                              </button>

                              <button
                                type="button"
                                disabled={isReadOnly}
                                onClick={() => handleSetStatus(t.id, 'absent')}
                                className={`px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all ${
                                  isReadOnly ? 'cursor-default' : 'cursor-pointer'
                                } ${
                                  d.status === 'absent'
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                                } ${isReadOnly && d.status !== 'absent' ? 'opacity-40' : ''}`}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>អវត្តមាន</span>
                              </button>

                              <button
                                type="button"
                                disabled={isReadOnly}
                                onClick={() => handleSetStatus(t.id, 'substituted')}
                                className={`px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all ${
                                  isReadOnly ? 'cursor-default' : 'cursor-pointer'
                                } ${
                                  d.status === 'substituted'
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                                } ${isReadOnly && d.status !== 'substituted' ? 'opacity-40' : ''}`}
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>ជំនួស</span>
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              disabled={isReadOnly}
                              value={d.note}
                              onChange={(e) => handleSetNote(t.id, e.target.value)}
                              placeholder={isReadOnly ? '-' : 'សម្គាល់ / គ្រូជំនួស...'}
                              className="w-full px-2.5 py-1.5 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden disabled:opacity-75 disabled:cursor-not-allowed"
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

          {/* Daily Teacher Attendance Pagination Controls */}
          {filteredTeachers.length > 0 && (
            <div className="bg-white dark:bg-[#131f1a] rounded-2xl p-4 border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
                <span>
                  កំពុងបង្ហាញ <strong className="text-zinc-900 dark:text-zinc-100 font-bold">{startDailyIndex} - {endDailyIndex}</strong> នៃសរុប <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{filteredTeachers.length}</strong> នាក់
                </span>

                <div className="flex items-center gap-1.5 pl-3 border-l border-zinc-200 dark:border-zinc-800">
                  <span className="text-[11px]">ក្នុងមួយទំព័រ:</span>
                  <select
                    value={dailyPageSize}
                    onChange={(e) => {
                      setDailyPageSize(Number(e.target.value));
                      setDailyCurrentPage(1);
                    }}
                    className="px-2 py-1 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-lg text-xs text-zinc-800 dark:text-zinc-200 font-bold focus:border-emerald-500 outline-hidden cursor-pointer"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                    <option value={-1}>ទាំងអស់ (All)</option>
                  </select>
                </div>
              </div>

              {dailyPageSize !== -1 && totalDailyPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setDailyCurrentPage(1)}
                    disabled={validDailyPage === 1}
                    className="p-1.5 rounded-lg bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-50 dark:hover:bg-emerald-950/60 cursor-pointer transition-colors"
                    title="ទំព័រដំបូងបង្អស់ (First Page)"
                  >
                    <ChevronsLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDailyCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={validDailyPage === 1}
                    className="p-1.5 rounded-lg bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-50 dark:hover:bg-emerald-950/60 cursor-pointer transition-colors"
                    title="ទំព័រមុន (Previous Page)"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <span className="px-3 py-1 font-bold text-zinc-800 dark:text-zinc-200">
                    ទំព័រ {validDailyPage} / {totalDailyPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => setDailyCurrentPage((p) => Math.min(totalDailyPages, p + 1))}
                    disabled={validDailyPage === totalDailyPages}
                    className="p-1.5 rounded-lg bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-50 dark:hover:bg-emerald-950/60 cursor-pointer transition-colors"
                    title="ទំព័របន្ទាប់ (Next Page)"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDailyCurrentPage(totalDailyPages)}
                    disabled={validDailyPage === totalDailyPages}
                    className="p-1.5 rounded-lg bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-50 dark:hover:bg-emerald-950/60 cursor-pointer transition-colors"
                    title="ទំព័រចុងក្រោយ (Last Page)"
                  >
                    <ChevronsRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Monthly Controls Bar */}
          <div className="bg-white dark:bg-[#131f1a] rounded-3xl p-6 border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                    ខែ (Month)
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden cursor-pointer"
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        ខែ {i + 1} (Month {i + 1})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                    ឆ្នាំ (Year)
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden cursor-pointer"
                  >
                    {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!isReadOnly ? (
                  <>
                    <button
                      onClick={handleDownloadTemplate}
                      className="px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>ទាញយកគំរូ Excel (Template)</span>
                    </button>

                    <button
                      onClick={handleMonthlyExport}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Export របាយការណ៍ប្រចាំខែ</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => showToast('គណនីភ្ញៀវមិនមានសិទ្ធិទាញយករបាយការណ៍ទេ (Read-Only Mode)!', 'info')}
                    className="px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700 font-bold text-xs inline-flex items-center gap-1.5 cursor-not-allowed opacity-60"
                    title="គណនីភ្ញៀវមិនអាច Export បានទេ"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Export (Locked)</span>
                  </button>
                )}

                {!isReadOnly && (
                  <label
                    className={`px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer ${
                      isImporting ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isImporting ? 'កំពុង Import...' : 'Import វត្តមានពី Excel'}</span>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleMonthlyImport}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Filter Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ស្វែងរកតាមឈ្មោះសាស្ត្រាចារ្យ ឬអត្តលេខ..."
                className="w-full pl-8 pr-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden"
              />
            </div>
          </div>

          {/* Monthly Table Summary */}
          <div className="bg-white dark:bg-[#131f1a] rounded-3xl border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-100/90 dark:bg-[#182620] border-b border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">ល.រ</th>
                    <th className="py-3 px-4">អត្តលេខ</th>
                    <th className="py-3 px-4">ឈ្មោះសាស្ត្រាចារ្យ</th>
                    <th className="py-3 px-4">មុខវិជ្ជា</th>
                    <th className="py-3 px-4 text-center text-emerald-700 dark:text-emerald-400">វត្តមាន (P)</th>
                    <th className="py-3 px-4 text-center text-amber-700 dark:text-amber-400">សុំច្បាប់ (L)</th>
                    <th className="py-3 px-4 text-center text-rose-700 dark:text-rose-400">អវត្តមាន (A)</th>
                    <th className="py-3 px-4 text-center text-blue-700 dark:text-blue-400">ជំនួស (S)</th>
                    <th className="py-3 px-4 text-center">សរុបកត់ត្រា</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                  {filteredMonthlySummary.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-zinc-400 dark:text-zinc-500">
                        <UserCheck className="w-8 h-8 text-zinc-400 dark:text-zinc-500 mx-auto mb-2" />
                        <p className="font-bold text-zinc-700 dark:text-zinc-300">ពុំមានទិន្នន័យសាស្ត្រាចារ្យទេ</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedMonthlySummary.map((item, index) => {
                      const globalIndex = (monthlyPageSize === -1 ? 0 : (validMonthlyPage - 1) * monthlyPageSize) + index + 1;
                      return (
                        <tr key={item.teacher.id} className="hover:bg-zinc-50/80 dark:hover:bg-[#182620]/60 transition-colors">
                          <td className="py-3 px-4 text-center font-bold text-zinc-500 dark:text-zinc-400">
                            {globalIndex}
                          </td>
                        <td className="py-3 px-4 font-mono font-bold text-zinc-800 dark:text-zinc-200">
                          {item.teacher.teacherCode}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            {/* Clickable Profile Photo */}
                            <button
                              type="button"
                              onClick={() => handleOpenPhotoViewer(item.teacher)}
                              className="relative group w-9 h-9 rounded-xl overflow-hidden border border-emerald-500/40 shadow-xs shrink-0 cursor-pointer focus:outline-hidden"
                              title="ចុចដើម្បីមើលរូបថតពេញទំហំ (Click to View Full Photo)"
                            >
                              {item.teacher.photoUrl ? (
                                <img
                                  src={item.teacher.photoUrl}
                                  alt={item.teacher.nameKhmer}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div
                                  className={`w-full h-full flex items-center justify-center font-bold text-xs ${
                                    item.teacher.gender === 'female'
                                      ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200'
                                      : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200'
                                  }`}
                                >
                                  {(item.teacher.nameKhmer || item.teacher.nameLatin || 'T').charAt(0)}
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                <ZoomIn className="w-3.5 h-3.5" />
                              </div>
                            </button>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-zinc-900 dark:text-zinc-100">{item.teacher.nameKhmer}</span>
                                {item.teacher.nameChinese && (
                                  <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-200/60 dark:border-emerald-800/40">
                                    {item.teacher.nameChinese}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">{item.teacher.nameLatin}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-zinc-800 dark:text-zinc-200">
                          {item.teacher.subjects || '-'}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-emerald-700 dark:text-emerald-400">
                          {item.present}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-amber-700 dark:text-amber-400">
                          {item.permission}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-rose-700 dark:text-rose-400">
                          {item.absent}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-blue-700 dark:text-blue-400">
                          {item.substituted}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-zinc-900 dark:text-zinc-100">
                          {item.total} ថ្ងៃ
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Monthly Teacher Attendance Pagination Controls */}
        {filteredMonthlySummary.length > 0 && (
          <div className="bg-white dark:bg-[#131f1a] rounded-2xl p-4 border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
              <span>
                កំពុងបង្ហាញ <strong className="text-zinc-900 dark:text-zinc-100 font-bold">{startMonthlyIndex} - {endMonthlyIndex}</strong> នៃសរុប <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{filteredMonthlySummary.length}</strong> នាក់
              </span>

              <div className="flex items-center gap-1.5 pl-3 border-l border-zinc-200 dark:border-zinc-800">
                <span className="text-[11px]">ក្នុងមួយទំព័រ:</span>
                <select
                  value={monthlyPageSize}
                  onChange={(e) => {
                    setMonthlyPageSize(Number(e.target.value));
                    setMonthlyCurrentPage(1);
                  }}
                  className="px-2 py-1 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-lg text-xs text-zinc-800 dark:text-zinc-200 font-bold focus:border-emerald-500 outline-hidden cursor-pointer"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                  <option value={-1}>ទាំងអស់ (All)</option>
                </select>
              </div>
            </div>

            {monthlyPageSize !== -1 && totalMonthlyPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setMonthlyCurrentPage(1)}
                  disabled={validMonthlyPage === 1}
                  className="p-1.5 rounded-lg bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-50 dark:hover:bg-emerald-950/60 cursor-pointer transition-colors"
                  title="ទំព័រដំបូងបង្អស់ (First Page)"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setMonthlyCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={validMonthlyPage === 1}
                  className="p-1.5 rounded-lg bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-50 dark:hover:bg-emerald-950/60 cursor-pointer transition-colors"
                  title="ទំព័រមុន (Previous Page)"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <span className="px-3 py-1 font-bold text-zinc-800 dark:text-zinc-200">
                  ទំព័រ {validMonthlyPage} / {totalMonthlyPages}
                </span>

                <button
                  type="button"
                  onClick={() => setMonthlyCurrentPage((p) => Math.min(totalMonthlyPages, p + 1))}
                  disabled={validMonthlyPage === totalMonthlyPages}
                  className="p-1.5 rounded-lg bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-50 dark:hover:bg-emerald-950/60 cursor-pointer transition-colors"
                  title="ទំព័របន្ទាប់ (Next Page)"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setMonthlyCurrentPage(totalMonthlyPages)}
                  disabled={validMonthlyPage === totalMonthlyPages}
                  className="p-1.5 rounded-lg bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-50 dark:hover:bg-emerald-950/60 cursor-pointer transition-colors"
                  title="ទំព័រចុងក្រោយ (Last Page)"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
        </>
      )}

      {/* Profile Image Viewer Modal */}
      <ProfileImageViewerModal
        isOpen={isImageViewerOpen}
        onClose={() => {
          setIsImageViewerOpen(false);
          setImageViewerTarget(null);
        }}
        target={imageViewerTarget}
      />
    </div>
  );
};
