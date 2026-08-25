import React, { useState, useMemo } from 'react';
import {
  X,
  TrendingUp,
  Award,
  GraduationCap,
  ArrowRight,
  CheckCircle,
  Users,
  Layers,
  BookOpen,
  Clock,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { Student, Classroom, ShiftItem, ClassType, AcademicYearType, StudentStatus } from '../types';
import { CLASS_TYPE_OPTIONS } from '../data/initialData';
import { instituteService } from '../service/instituteService';
import { getShiftLabel, getClassTypeLabel, getStatusLabel } from '../utils/exportUtils';

interface PromoteStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStudents: Student[];
  classes: Classroom[];
  shifts: ShiftItem[];
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  onSuccess?: () => void;
  isReadOnly?: boolean;
}

export const PromoteStudentsModal: React.FC<PromoteStudentsModalProps> = ({
  isOpen,
  onClose,
  selectedStudents,
  classes,
  shifts,
  showToast,
  onSuccess,
  isReadOnly = false
}) => {
  // Promote mode: 'auto_increment' | 'custom'
  const [promoteMode, setPromoteMode] = useState<'auto_increment' | 'custom'>('auto_increment');

  // Custom targets
  const [targetYear, setTargetYear] = useState<string>('auto'); // 'auto', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'graduated', 'keep'
  const [targetClassType, setTargetClassType] = useState<string>('keep');
  const [targetClassId, setTargetClassId] = useState<string>('keep');
  const [targetShift, setTargetShift] = useState<string>('keep');
  const [targetStatus, setTargetStatus] = useState<string>('keep');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to calculate target year for a student
  const getNextYear = (currentYear: string): { year: AcademicYearType; status?: StudentStatus } => {
    switch (currentYear) {
      case 'Year 1': return { year: 'Year 2' };
      case 'Year 2': return { year: 'Year 3' };
      case 'Year 3': return { year: 'Year 4' };
      case 'Year 4': return { year: 'Year 4', status: 'graduated' };
      default: return { year: currentYear as AcademicYearType };
    }
  };

  // Preview changes for each student
  const previews = useMemo(() => {
    return selectedStudents.map((stu) => {
      let newYear = stu.year;
      let newStatus = stu.status;
      let newClassType = stu.classType;
      let newClassId = stu.classId;
      let newClassName = stu.className;
      let newShift = stu.shift;

      if (promoteMode === 'auto_increment') {
        const next = getNextYear(stu.year);
        newYear = next.year;
        if (next.status) newStatus = next.status;
      } else {
        if (targetYear !== 'keep') {
          if (targetYear === 'graduated') {
            newStatus = 'graduated';
          } else {
            newYear = targetYear as AcademicYearType;
          }
        }
        if (targetClassType !== 'keep') {
          newClassType = targetClassType as ClassType;
        }
        if (targetClassId !== 'keep') {
          const matchedClass = classes.find((c) => c.id === targetClassId);
          if (matchedClass) {
            newClassId = matchedClass.id;
            newClassName = matchedClass.name;
            newShift = matchedClass.shift;
            if (matchedClass.classType) newClassType = matchedClass.classType;
          }
        }
        if (targetShift !== 'keep') {
          newShift = targetShift;
        }
        if (targetStatus !== 'keep') {
          newStatus = targetStatus as StudentStatus;
        }
      }

      return {
        student: stu,
        original: {
          year: stu.year,
          status: stu.status,
          className: stu.className,
          shift: stu.shift,
          classType: stu.classType
        },
        updated: {
          year: newYear,
          status: newStatus,
          classId: newClassId,
          className: newClassName,
          shift: newShift,
          classType: newClassType
        }
      };
    });
  }, [selectedStudents, promoteMode, targetYear, targetClassType, targetClassId, targetShift, targetStatus, classes]);

  if (!isOpen || selectedStudents.length === 0) return null;

  const handleExecutePromotion = async () => {
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនអាចកែប្រែទិន្នន័យបានទេ', 'info');
      return;
    }

    setIsSubmitting(true);
    try {
      const studentIds = selectedStudents.map((s) => s.id);
      
      await instituteService.promoteStudentsBulk(studentIds, (currentStu) => {
        const item = previews.find((p) => p.student.id === currentStu.id);
        if (item) {
          return {
            year: item.updated.year,
            status: item.updated.status,
            classId: item.updated.classId,
            className: item.updated.className,
            shift: item.updated.shift,
            classType: item.updated.classType
          };
        }
        return {};
      });

      showToast(`បានតម្លើងកម្រិត/ផ្លាស់ប្តូរថ្នាក់និស្សិតចំនួន ${selectedStudents.length} នាក់ ដោយជោគជ័យ!`, 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      showToast('មានបញ្ហាក្នុងការតម្លើងកម្រិតសិក្សា', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-[#111c38] rounded-3xl max-w-3xl w-full border border-blue-200/60 dark:border-sky-500/20 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-sky-900 p-5 text-white flex items-center justify-between border-b border-blue-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-sky-300 border border-white/20 shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <span>តម្លើងកម្រិត / ផ្លាស់ប្តូរថ្នាក់និស្សិត (Promote Students)</span>
                <span className="px-2 py-0.5 rounded-full bg-sky-400/20 text-sky-200 text-xs font-mono">
                  {selectedStudents.length} នាក់
                </span>
              </h3>
              <p className="text-xs text-sky-200/90 font-medium">
                តម្លើងឆ្នាំសិក្សា (Year 1 → Year 2 → Graduated) ប្តូរថ្នាក់ ឬប្តូរវេនសិក្សា
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Promotion Strategy Switch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPromoteMode('auto_increment')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                promoteMode === 'auto_increment'
                  ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 dark:border-sky-500 shadow-sm ring-1 ring-blue-600/30'
                  : 'bg-zinc-50 dark:bg-[#15203a] border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                  តម្លើងស្វ័យប្រវត្តិ +១ ឆ្នាំ (Auto Increment)
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                ឆ្នាំទី១ → ឆ្នាំទី២, ឆ្នាំទី២ → ឆ្នាំទី៣, ឆ្នាំទី៣ → ឆ្នាំទី៤, ឆ្នាំទី៤ → បញ្ចប់ការសិក្សា (Graduated)
              </p>
            </button>

            <button
              type="button"
              onClick={() => setPromoteMode('custom')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                promoteMode === 'custom'
                  ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 dark:border-sky-500 shadow-sm ring-1 ring-blue-600/30'
                  : 'bg-zinc-50 dark:bg-[#15203a] border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                  កំណត់តាមជម្រើស (Custom Batch Settings)
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                ជ្រើសរើសឆ្នាំ ថ្នាក់រៀន វេនសិក្សា ឬកម្រិតបណ្តុះបណ្តាលដោយដៃសម្រាប់និស្សិតដែលបានជ្រើស
              </p>
            </button>
          </div>

          {/* Custom Settings Config */}
          {promoteMode === 'custom' && (
            <div className="bg-zinc-50 dark:bg-[#0e172e] p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4 animate-fadeIn">
              <h4 className="font-bold text-xs text-blue-900 dark:text-sky-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>ជម្រើសផ្លាស់ប្តូរសម្រាប់និស្សិតដែលបានជ្រើស (Target Updates):</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {/* Target Year */}
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1 text-[11px]">
                    ឆ្នាំសិក្សាថ្មី (Target Year)
                  </label>
                  <select
                    value={targetYear}
                    onChange={(e) => setTargetYear(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-[#162340] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 outline-hidden font-medium"
                  >
                    <option value="keep">-- រក្សាទុកដដែល (Keep Current) --</option>
                    <option value="Year 1">ឆ្នាំទី ១ (Year 1)</option>
                    <option value="Year 2">ឆ្នាំទី ២ (Year 2)</option>
                    <option value="Year 3">ឆ្នាំទី ៣ (Year 3)</option>
                    <option value="Year 4">ឆ្នាំទី ៤ (Year 4)</option>
                    <option value="graduated">🎓 បញ្ចប់ការសិក្សា (Graduated)</option>
                  </select>
                </div>

                {/* Target Class Type */}
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1 text-[11px]">
                    កម្រិតបណ្តុះបណ្តាល (Class Type)
                  </label>
                  <select
                    value={targetClassType}
                    onChange={(e) => setTargetClassType(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-[#162340] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 outline-hidden font-medium"
                  >
                    <option value="keep">-- រក្សាទុកដដែល (Keep Current) --</option>
                    {CLASS_TYPE_OPTIONS.map((ct) => (
                      <option key={ct.id} value={ct.id}>
                        {ct.nameKhmer}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Classroom */}
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1 text-[11px]">
                    ផ្ទេរទៅថ្នាក់ថ្មី (Target Class)
                  </label>
                  <select
                    value={targetClassId}
                    onChange={(e) => setTargetClassId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-[#162340] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 outline-hidden font-medium"
                  >
                    <option value="keep">-- រក្សាទុកថ្នាក់ដដែល (Keep Class) --</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} ({cls.year} - {getShiftLabel(cls.shift)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Shift */}
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1 text-[11px]">
                    វេនសិក្សាថ្មី (Target Shift)
                  </label>
                  <select
                    value={targetShift}
                    onChange={(e) => setTargetShift(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-[#162340] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 outline-hidden font-medium"
                  >
                    <option value="keep">-- រក្សាទុកវេនដដែល (Keep Shift) --</option>
                    {shifts.map((s) => (
                      <option key={s.id} value={s.code}>
                        {s.nameKhmer} ({s.timeRange})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Status */}
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1 text-[11px]">
                    ស្ថានភាពនិស្សិត (Target Status)
                  </label>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-[#162340] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 outline-hidden font-medium"
                  >
                    <option value="keep">-- រក្សាស្ថានភាពដដែល --</option>
                    <option value="active">កំពុងរៀន (Active)</option>
                    <option value="graduated">បញ្ចប់ការសិក្សា (Graduated)</option>
                    <option value="suspended">ព្យួរការសិក្សា (Suspended)</option>
                    <option value="dropped">បោះបង់ការសិក្សា (Dropped)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Live Preview List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                <span>មើលទិដ្ឋភាពមុនអនុវត្ត (Changes Preview for {previews.length} Students):</span>
              </h4>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-1 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-2 bg-zinc-50/50 dark:bg-[#0b1329]">
              {previews.map((item, idx) => (
                <div
                  key={item.student.id}
                  className="bg-white dark:bg-[#15203a] p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-[180px]">
                    <span className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono text-[10px] flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-zinc-100">
                        {item.student.nameKhmer}
                      </p>
                      <p className="text-[11px] text-zinc-500 font-mono">
                        {item.student.studentCode} • {item.student.nameLatin}
                      </p>
                    </div>
                  </div>

                  {/* Transition pill */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Before */}
                    <div className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[11px] font-medium flex items-center gap-1.5">
                      <span>{item.original.year}</span>
                      <span>•</span>
                      <span>{item.original.className}</span>
                    </div>

                    <ArrowRight className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400 shrink-0" />

                    {/* After */}
                    <div className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-900 dark:text-sky-200 border border-blue-200 dark:border-blue-800 font-bold text-[11px] flex items-center gap-1.5">
                      <span>{item.updated.year}</span>
                      <span>•</span>
                      <span>{item.updated.className}</span>
                      {item.updated.status === 'graduated' && (
                        <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded-md">
                          Graduated
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-zinc-50 dark:bg-[#0e172e] border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs cursor-pointer transition-colors"
          >
            បោះបង់ (Cancel)
          </button>

          <button
            type="button"
            onClick={handleExecutePromotion}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs inline-flex items-center gap-2 shadow-md transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>កំពុងធ្វើបច្ចុប្បន្នភាព...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>យល់ព្រមតម្លើងកម្រិត ({selectedStudents.length} នាក់)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
