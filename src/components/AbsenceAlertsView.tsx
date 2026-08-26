import React, { useState, useMemo } from 'react';
import {
  Send,
  Bell,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  RefreshCw,
  PhoneCall,
  Settings,
  ShieldAlert,
  SendHorizontal,
  ExternalLink,
  Users,
  Info,
  Layers,
  Sparkles,
  Smartphone,
  Check,
  X
} from 'lucide-react';
import {
  Student,
  AttendanceRecord,
  Classroom,
  AbsenceAlertLog,
  TelegramConfig
} from '../types';
import { instituteService } from '../service/instituteService';

interface AbsenceAlertsViewProps {
  students: Student[];
  attendance: AttendanceRecord[];
  classes: Classroom[];
  alertLogs: AbsenceAlertLog[];
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  isReadOnly: boolean;
}

export const AbsenceAlertsView: React.FC<AbsenceAlertsViewProps> = ({
  students,
  attendance,
  classes,
  alertLogs,
  showToast,
  isReadOnly
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'watchlist' | 'history' | 'settings'>('watchlist');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [threshold, setThreshold] = useState<number>(80); // Absence alert threshold (e.g. < 80%)

  // Telegram Config
  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>(() => instituteService.getTelegramConfig());
  const [botTokenInput, setBotTokenInput] = useState(telegramConfig.botToken || '');
  const [chatIdInput, setChatIdInput] = useState(telegramConfig.chatId || '');
  const [channelInput, setChannelInput] = useState(telegramConfig.channelUsername || '@iceti_cambodia_alerts');

  // Single Student Alert Modal State
  const [selectedStudentForAlert, setSelectedStudentForAlert] = useState<{
    student: Student;
    absentCount: number;
    attendanceRate: number;
    totalRecords: number;
  } | null>(null);
  const [customNote, setCustomNote] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Batch Alert Modal State
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isBatchSending, setIsBatchSending] = useState(false);

  // Calculate Student Attendance Rates & Absent Counts
  const studentStats = useMemo(() => {
    const map: Record<string, { total: number; absent: number; permission: number; present: number; late: number }> = {};

    attendance.forEach((r) => {
      if (!map[r.studentId]) {
        map[r.studentId] = { total: 0, absent: 0, permission: 0, present: 0, late: 0 };
      }
      map[r.studentId].total++;
      if (r.status === 'absent') map[r.studentId].absent++;
      else if (r.status === 'permission') map[r.studentId].permission++;
      else if (r.status === 'late') map[r.studentId].late++;
      else if (r.status === 'present') map[r.studentId].present++;
    });

    return students.map((stu) => {
      const stat = map[stu.id] || { total: 0, absent: 0, permission: 0, present: 0, late: 0 };
      const rate = stat.total > 0 ? ((stat.present + stat.permission * 0.8 + stat.late * 0.9) / stat.total) * 100 : 100;
      return {
        student: stu,
        totalRecords: stat.total,
        absentCount: stat.absent,
        permissionCount: stat.permission,
        presentCount: stat.present,
        attendanceRate: rate
      };
    });
  }, [students, attendance]);

  // At-Risk Watchlist (Attendance Rate < threshold OR absent count >= 2)
  const atRiskStudents = useMemo(() => {
    return studentStats.filter((item) => {
      const matchSearch =
        item.student.nameKhmer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.student.nameLatin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.student.studentCode.toLowerCase().includes(searchTerm.toLowerCase());

      const matchClass = selectedClassId === 'all' || item.student.classId === selectedClassId;
      const isAtRisk = item.totalRecords > 0 ? item.attendanceRate < threshold || item.absentCount >= 2 : item.absentCount >= 1;

      return matchSearch && matchClass && isAtRisk;
    });
  }, [studentStats, searchTerm, selectedClassId, threshold]);

  // Save Telegram Settings
  const handleSaveTelegramConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនអាចកែប្រែកំណត់រចនាសម្ព័ន្ធបានទេ!', 'info');
      return;
    }

    const updated: TelegramConfig = {
      botToken: botTokenInput.trim() || undefined,
      chatId: chatIdInput.trim() || undefined,
      channelUsername: channelInput.trim() || undefined,
      isEnabled: true,
      instituteHeader: 'វិទ្យាស្ថានគរុកោសល្យភាសាចិនក្នុងតំបន់ (ICETI)'
    };
    instituteService.saveTelegramConfig(updated);
    setTelegramConfig(updated);
    showToast('បានរក្សាទុកការកំណត់ Telegram Bot រួចរាល់!', 'success');
  };

  // Open single send modal
  const openSingleAlert = (item: { student: Student; absentCount: number; attendanceRate: number; totalRecords: number }) => {
    setSelectedStudentForAlert(item);
    setCustomNote('');
  };

  // Execute single send
  const handleSendSingleAlert = async () => {
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនអាចបញ្ជូនសារបានទេ!', 'info');
      return;
    }
    if (!selectedStudentForAlert) return;

    setIsSending(true);
    try {
      const res = await instituteService.sendTelegramAlert({
        student: selectedStudentForAlert.student,
        absentCount: selectedStudentForAlert.absentCount,
        attendanceRate: selectedStudentForAlert.attendanceRate,
        customNote
      });
      showToast(res.message, 'success');
      setSelectedStudentForAlert(null);
    } catch (e) {
      showToast('បរាជ័យក្នុងការបញ្ជូនដំណឹង Telegram', 'error');
    } finally {
      setIsSending(false);
    }
  };

  // Execute Batch Send to all at-risk students
  const handleSendBatchAlerts = async () => {
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនអាចបញ្ជូនសារបានទេ!', 'info');
      return;
    }
    if (atRiskStudents.length === 0) {
      showToast('មិនមាននិស្សិតស្ថិតក្នុងបញ្ជីប្រកាសអាសន្នទេ!', 'info');
      return;
    }

    setIsBatchSending(true);
    let successCount = 0;
    try {
      for (const item of atRiskStudents) {
        await instituteService.sendTelegramAlert({
          student: item.student,
          absentCount: item.absentCount,
          attendanceRate: item.attendanceRate,
          customNote: 'ស្វ័យប្រវត្តិកម្មជូនដំណឹងពីប្រព័ន្ធវត្តមាន ICETI'
        });
        successCount++;
      }
      showToast(`បានបញ្ជូនដំណឹងស្វ័យប្រវត្តិទៅកាន់អាណាព្យាបាល/Telegram និស្សិតចំនួន ${successCount} នាក់!`, 'success');
      setIsBatchModalOpen(false);
    } catch (e) {
      showToast('មានបញ្ហាក្នុងពេលបញ្ជូនសារមួយចំនួន', 'error');
    } finally {
      setIsBatchSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#111c38] p-5 rounded-2xl border border-zinc-200 dark:border-blue-900/40 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Send className="w-6 h-6 text-blue-700 dark:text-blue-400" />
            <span>ប្រព័ន្ធជូនដំណឹងអវត្តមាន & Telegram Alerts</span>
          </h2>
          <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-1">
            ត្រួតពិនិត្យនិស្សិតអវត្តមានញឹកញាប់ (ក្រោម ៨០%) និងផ្ញើដំណឹងស្វ័យប្រវត្តិតាម Telegram / SMS ទៅអាណាព្យាបាល
          </p>
        </div>

        {/* SubTab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl border border-zinc-300 dark:border-zinc-700">
          <button
            onClick={() => setActiveSubTab('watchlist')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'watchlist'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-900'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>បញ្ជីប្រកាសអាសន្ន ({atRiskStudents.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'history'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>ប្រវត្តិផ្ញើសារ ({alertLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('settings')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'settings'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-900'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>កំណត់ Telegram Bot</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: WATCHLIST & AT-RISK STUDENTS                                       */}
      {/* ========================================================================= */}
      {activeSubTab === 'watchlist' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Controls Bar */}
          <div className="bg-white dark:bg-[#111c38] p-4 rounded-2xl border border-zinc-200 dark:border-blue-900/40 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ស្វែងរកតាមឈ្មោះ ឬអត្តលេខនិស្សិត..."
                  className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Class Filter */}
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                aria-label="ជ្រើសរើសថ្នាក់រៀន"
                className="px-3 py-2 bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">គ្រប់ថ្នាក់រៀន (All Classes)</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.shift})
                  </option>
                ))}
              </select>

              {/* Threshold Filter */}
              <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900/80 px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700">
                <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">កម្រិតប្រកាសអាសន្ន៖</span>
                <select
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  aria-label="ជ្រើសរើសកម្រិតភាគរយវត្តមាន"
                  className="bg-transparent font-bold text-xs text-rose-700 dark:text-rose-400 focus:outline-none"
                >
                  <option value={85}>ក្រោម ៨៥% (យ៉ាងតឹងរ៉ឹង)</option>
                  <option value={80}>ក្រោម ៨០% (បទដ្ឋានគោល)</option>
                  <option value={75}>ក្រោម ៧៥% (ធ្ងន់ធ្ងរ)</option>
                  <option value={70}>ក្រោម ៧០% (ធ្លាក់ការប្រឡង)</option>
                </select>
              </div>
            </div>

            {/* Batch Send Action */}
            {!isReadOnly && atRiskStudents.length > 0 && (
              <button
                onClick={() => setIsBatchModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-98"
              >
                <SendHorizontal className="w-4 h-4" />
                <span>ផ្ញើដំណឹងទាំងអស់ ({atRiskStudents.length} នាក់)</span>
              </button>
            )}
          </div>

          {/* At-Risk Table */}
          <div className="bg-white dark:bg-[#111c38] rounded-2xl border border-zinc-200 dark:border-blue-900/40 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold">
                    <th className="py-3.5 px-3 w-12 text-center">ល.រ</th>
                    <th className="py-3.5 px-4">និស្សិត & អត្តលេខ</th>
                    <th className="py-3.5 px-4">ថ្នាក់រៀន & វេន</th>
                    <th className="py-3.5 px-4 text-center">អវត្តមាន (Absent)</th>
                    <th className="py-3.5 px-4 text-center">សុំច្បាប់ (Permission)</th>
                    <th className="py-3.5 px-4 text-center">អត្រាវត្តមានសរុប</th>
                    <th className="py-3.5 px-4">ទូរស័ព្ទអាណាព្យាបាល</th>
                    <th className="py-3.5 px-4 text-center">សកម្មភាព</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                  {atRiskStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-zinc-600 dark:text-zinc-400">
                        <CheckCircle2 className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2 opacity-80" />
                        <p className="font-bold">ពុំមាននិស្សិតដែលជាប់ហានិភ័យអវត្តមានក្រោម {threshold}% ទេ!</p>
                        <p className="text-[11px] text-zinc-500 mt-0.5">វត្តមានទូទៅរបស់និស្សិតស្ថិតក្នុងកម្រិតល្អប្រសើរ</p>
                      </td>
                    </tr>
                  ) : (
                    atRiskStudents.map((item, index) => {
                      const isCritical = item.attendanceRate < 75 || item.absentCount >= 3;

                      return (
                        <tr
                          key={item.student.id}
                          className="hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition-colors"
                        >
                          <td className="py-3 px-3 text-center font-bold text-zinc-500 dark:text-zinc-400">
                            {index + 1}
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                              <span>{item.student.nameKhmer}</span>
                              <span className="text-zinc-500">({item.student.nameLatin})</span>
                            </div>
                            <div className="text-[11px] text-zinc-600 dark:text-zinc-400 font-mono">
                              {item.student.studentCode}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-bold text-zinc-800 dark:text-zinc-200">
                              {item.student.className || 'មិនទាន់កំណត់'}
                            </div>
                            <div className="text-[11px] text-zinc-600 dark:text-zinc-400">
                              វេន៖ {item.student.shift}
                            </div>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                              {item.absentCount} លើក
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center text-zinc-700 dark:text-zinc-300 font-bold">
                            {item.permissionCount} លើក
                          </td>

                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span
                                className={`font-black text-xs px-2 py-0.5 rounded-md ${
                                  isCritical
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300'
                                }`}
                              >
                                {item.attendanceRate.toFixed(1)}%
                              </span>
                              <span className="text-[10px] text-zinc-500 mt-0.5">
                                {isCritical ? 'ជាប់បន្ទាត់ក្រហម' : 'គួរព្រមាន'}
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 font-mono font-bold text-zinc-800 dark:text-zinc-200">
                              <PhoneCall className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                              <span>{item.student.guardianPhone || item.student.phone || 'ពុំមាន'}</span>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => openSingleAlert(item)}
                              className="px-3 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs inline-flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                            >
                              <Send className="w-3 h-3" />
                              <span>ផ្ញើដំណឹង Telegram</span>
                            </button>
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
      {/* TAB 2: SENT ALERTS HISTORY LOG                                            */}
      {/* ========================================================================= */}
      {activeSubTab === 'history' && (
        <div className="bg-white dark:bg-[#111c38] rounded-2xl border border-zinc-200 dark:border-blue-900/40 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-700 dark:text-blue-400" />
              <span>ប្រវត្តិដំណឹងដែលបានបញ្ជូនកន្លងមក</span>
            </h3>
            <span className="text-xs text-zinc-600 dark:text-zinc-400">
              សរុប {alertLogs.length} សារ
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold">
                  <th className="py-3.5 px-3 w-12 text-center">ល.រ</th>
                  <th className="py-3.5 px-4">កាលបរិច្ឆេទ</th>
                  <th className="py-3.5 px-4">និស្សិត</th>
                  <th className="py-3.5 px-4">ថ្នាក់រៀន</th>
                  <th className="py-3.5 px-4 text-center">អវត្តមាន</th>
                  <th className="py-3.5 px-4">ខ្លឹមសារសារ</th>
                  <th className="py-3.5 px-4 text-center">ស្ថានភាព</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                {alertLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-600 dark:text-zinc-400">
                      មិនទាន់មានប្រវត្តិផ្ញើសារនៅឡើយទេ
                    </td>
                  </tr>
                ) : (
                  alertLogs.map((log, index) => (
                    <tr key={log.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40">
                      <td className="py-3 px-3 text-center font-bold text-zinc-500 dark:text-zinc-400">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-700 dark:text-zinc-300">
                        {log.date}
                      </td>
                      <td className="py-3 px-4 font-bold text-zinc-900 dark:text-zinc-100">
                        {log.studentName} ({log.studentCode})
                      </td>
                      <td className="py-3 px-4 text-zinc-800 dark:text-zinc-200">
                        {log.className}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-rose-700 dark:text-rose-400">
                        {log.absentCount} លើក
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-zinc-600 dark:text-zinc-400">
                        {log.message}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>បានផ្ញើរួច</span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TELEGRAM BOT INTEGRATION SETTINGS                                  */}
      {/* ========================================================================= */}
      {activeSubTab === 'settings' && (
        <div className="bg-white dark:bg-[#111c38] p-6 rounded-2xl border border-zinc-200 dark:border-blue-900/40 shadow-xs max-w-2xl space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
                ការកំណត់តភ្ជាប់ Telegram Bot API
              </h3>
              <p className="text-xs text-zinc-700 dark:text-zinc-300">
                រៀបចំ Bot Token និង Chat ID ដើម្បីផ្ញើសេចក្តីជូនដំណឹងវត្តមានទៅកាន់ Group ឬ Channel
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveTelegramConfig} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                Telegram Bot Token (ពី @BotFather)
              </label>
              <input
                type="password"
                value={botTokenInput}
                onChange={(e) => setBotTokenInput(e.target.value)}
                placeholder="e.g. 7192839182:AAFlw98zX..."
                className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                បង្កើត Bot តាមរយៈ Telegram ដោយផ្ញើ /newbot ទៅកាន់ @BotFather
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                  Telegram Group / Channel Chat ID
                </label>
                <input
                  type="text"
                  value={chatIdInput}
                  onChange={(e) => setChatIdInput(e.target.value)}
                  placeholder="e.g. -1002345678901 ឬ @channel_name"
                  className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                  ឈ្មោះ Channel Username
                </label>
                <input
                  type="text"
                  value={channelInput}
                  onChange={(e) => setChannelInput(e.target.value)}
                  placeholder="@iceti_cambodia_alerts"
                  className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-[11px] text-blue-900 dark:text-blue-300 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <Info className="w-3.5 h-3.5" />
                <span>ចំណាំសម្រាប់ការបញ្ជូនសារ៖</span>
              </p>
              <p>• ប្រព័ន្ធគាំទ្រទាំងការផ្ញើផ្ទាល់តាម Web Telegram Hook និងការបង្កើតជាសារស្វ័យប្រវត្តិកត់ត្រាក្នុងប្រវត្តិ។</p>
              <p>• អាចប្រើសម្រាប់ផ្ញើសាររំលឹកដល់អាណាព្យាបាលតាម Telegram, SMS ឬការហៅទូរស័ព្ទផ្ទាល់។</p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>រក្សាទុកការកំណត់ Telegram</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SINGLE ALERT CONFIRMATION MODAL */}
      {selectedStudentForAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#111c38] border border-zinc-200 dark:border-blue-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3 border-zinc-200 dark:border-zinc-800">
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                <span>ផ្ញើសេចក្តីជូនដំណឹងអវត្តមាន (Telegram Alert)</span>
              </h3>
              <button
                onClick={() => setSelectedStudentForAlert(null)}
                className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-700 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">ឈ្មោះនិស្សិត៖</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                  {selectedStudentForAlert.student.nameKhmer} ({selectedStudentForAlert.student.nameLatin})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">អត្តលេខ & ថ្នាក់៖</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                  {selectedStudentForAlert.student.studentCode} - {selectedStudentForAlert.student.className}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">ចំនួនអវត្តមាន & អត្រាវត្តមាន៖</span>
                <span className="font-black text-rose-700 dark:text-rose-400">
                  {selectedStudentForAlert.absentCount} លើក ({selectedStudentForAlert.attendanceRate.toFixed(1)}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">ទូរស័ព្ទអាណាព្យាបាល៖</span>
                <span className="font-bold text-blue-700 dark:text-blue-400 font-mono">
                  {selectedStudentForAlert.student.guardianPhone || 'ពុំមាន'}
                </span>
              </div>
            </div>

            {/* Custom Note input */}
            <div>
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                សារបន្ថែមទៅកាន់អាណាព្យាបាល (Custom Note - Optional)
              </label>
              <textarea
                rows={2}
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="ឧទាហរណ៍៖ សូមមកជួបការិយាល័យសិក្សា នៅថ្ងៃច័ន្ទ វេលាម៉ោង ៩:០០ ព្រឹក..."
                className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setSelectedStudentForAlert(null)}
                className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                onClick={handleSendSingleAlert}
                disabled={isSending}
                className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSending ? 'កំពុងផ្ញើ...' : 'បញ្ជូនសារ Telegram ឥឡូវនេះ'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BATCH ALERT CONFIRMATION MODAL */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#111c38] border border-zinc-200 dark:border-blue-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-700 dark:text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                បញ្ជាក់ការផ្ញើដំណឹងស្វ័យប្រវត្តិច្រើននាក់ (Batch Alerts)
              </h3>
            </div>

            <p className="text-xs text-zinc-700 dark:text-zinc-300">
              តើអ្នកពិតជាចង់ផ្ញើសេចក្តីជូនដំណឹងវត្តមានទៅកាន់និស្សិត/អាណាព្យាបាលចំនួន{' '}
              <span className="font-black text-rose-700 dark:text-rose-400">{atRiskStudents.length} នាក់</span> ដែលមានវត្តមានក្រោម {threshold}% មែនទេ?
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                onClick={handleSendBatchAlerts}
                disabled={isBatchSending}
                className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                <SendHorizontal className="w-3.5 h-3.5" />
                <span>{isBatchSending ? 'កំពុងបញ្ជូន...' : 'បញ្ជាក់ការផ្ញើទាំងអស់'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
