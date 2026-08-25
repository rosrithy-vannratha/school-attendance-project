import React, { useState } from 'react';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Calendar,
  CheckCircle,
  Sun,
  Sunset,
  Moon,
  Shield,
  Layers,
  Sparkles,
  Info,
  Check
} from 'lucide-react';
import { ShiftItem } from '../types';
import { instituteService } from '../service/instituteService';

interface ShiftsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shifts: ShiftItem[];
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  isReadOnly?: boolean;
}

const COLOR_OPTIONS = [
  { id: 'amber', name: 'ពណ៌មាស (Amber / Morning)', class: 'bg-amber-100 text-amber-800 border-amber-300' },
  { id: 'orange', name: 'ពណ៌ទឹកក្រូច (Orange / Afternoon)', class: 'bg-orange-100 text-orange-800 border-orange-300' },
  { id: 'indigo', name: 'ពណ៌ស្វាយក្រម៉ៅ (Indigo / Evening)', class: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  { id: 'teal', name: 'ពណ៌បៃតងទឹកសមុទ្រ (Teal / Weekend)', class: 'bg-teal-100 text-teal-800 border-teal-300' },
  { id: 'blue', name: 'ពណ៌ខៀវ (Royal Blue)', class: 'bg-blue-100 text-blue-800 border-blue-300' },
  { id: 'emerald', name: 'ពណ៌បៃតង (Emerald Green)', class: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { id: 'purple', name: 'ពណ៌ស្វាយ (Purple)', class: 'bg-purple-100 text-purple-800 border-purple-300' },
  { id: 'rose', name: 'ពណ៌ផ្កាឈូក (Rose Red)', class: 'bg-rose-100 text-rose-800 border-rose-300' },
];

export const ShiftsModal: React.FC<ShiftsModalProps> = ({
  isOpen,
  onClose,
  shifts,
  showToast,
  isReadOnly = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);

  // Form fields
  const [formCode, setFormCode] = useState('');
  const [formNameKhmer, setFormNameKhmer] = useState('');
  const [formNameLatin, setFormNameLatin] = useState('');
  const [formStartTime, setFormStartTime] = useState('07:30');
  const [formEndTime, setFormEndTime] = useState('11:00');
  const [formDays, setFormDays] = useState('ច័ន្ទ - សុក្រ (Mon-Fri)');
  const [formColor, setFormColor] = useState('blue');

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setIsEditing(false);
    setEditingShiftId(null);
    setFormCode('');
    setFormNameKhmer('');
    setFormNameLatin('');
    setFormStartTime('07:30');
    setFormEndTime('11:00');
    setFormDays('ច័ន្ទ - សុក្រ (Mon-Fri)');
    setFormColor('blue');
    setDeleteConfirmId(null);
  };

  const handleStartCreate = () => {
    setIsEditing(true);
    setEditingShiftId(null);
    setFormCode(`shift_custom_${Date.now().toString().slice(-4)}`);
    setFormNameKhmer('');
    setFormNameLatin('');
    setFormStartTime('11:30');
    setFormEndTime('13:30');
    setFormDays('ច័ន្ទ - សុក្រ (Mon-Fri)');
    setFormColor('blue');
  };

  const handleStartEdit = (s: ShiftItem) => {
    setIsEditing(true);
    setEditingShiftId(s.id);
    setFormCode(s.code);
    setFormNameKhmer(s.nameKhmer);
    setFormNameLatin(s.nameLatin);
    const times = s.timeRange.split('-');
    if (times.length === 2) {
      setFormStartTime(times[0].trim());
      setFormEndTime(times[1].trim());
    } else {
      setFormStartTime('07:30');
      setFormEndTime('11:00');
    }
    setFormDays(s.days || 'ច័ន្ទ - សុក្រ (Mon-Fri)');
    setFormColor(s.color || 'blue');
  };

  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនអាចកែប្រែទិន្នន័យបានទេ', 'info');
      return;
    }

    if (!formNameKhmer.trim()) {
      showToast('សូមបញ្ចូលឈ្មោះវេនសិក្សាជាភាសាខ្មែរ!', 'error');
      return;
    }

    const cleanCode = formCode.trim().toLowerCase().replace(/\s+/g, '_') || `shift_${Date.now()}`;
    const timeRange = `${formStartTime.trim()} - ${formEndTime.trim()}`;

    const newShift: ShiftItem = {
      id: editingShiftId || `shift_${cleanCode}`,
      code: cleanCode,
      nameKhmer: formNameKhmer.trim(),
      nameLatin: formNameLatin.trim() || formNameKhmer.trim(),
      timeRange,
      days: formDays.trim(),
      color: formColor,
      isDefault: editingShiftId ? shifts.find(s => s.id === editingShiftId)?.isDefault : false
    };

    try {
      await instituteService.saveShift(newShift);
      showToast(editingShiftId ? 'បានកែប្រែវេនសិក្សាជោគជ័យ!' : 'បានបង្កើតវេនសិក្សាថ្មីជោគជ័យ!', 'success');
      resetForm();
    } catch (err) {
      showToast('មិនអាចរក្សាទុកវេនសិក្សាបានទេ', 'error');
    }
  };

  const handleDeleteShift = async (s: ShiftItem) => {
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនអាចលុបទិន្នន័យបានទេ', 'info');
      return;
    }

    try {
      await instituteService.deleteShift(s.id);
      showToast(`បានលុបវេន "${s.nameKhmer}" ជោគជ័យ!`, 'success');
      setDeleteConfirmId(null);
    } catch (err) {
      showToast('មិនអាចលុបវេនសិក្សាបានទេ', 'error');
    }
  };

  const getShiftIcon = (code: string) => {
    const c = code.toLowerCase();
    if (c.includes('morn') || c.includes('ព្រឹក')) return <Sun className="w-4 h-4 text-amber-500" />;
    if (c.includes('after') || c.includes('រសៀល')) return <Sunset className="w-4 h-4 text-orange-500" />;
    if (c.includes('even') || c.includes('យប់') || c.includes('night')) return <Moon className="w-4 h-4 text-indigo-500" />;
    if (c.includes('week') || c.includes('ចុងសប្តាហ៍')) return <Calendar className="w-4 h-4 text-teal-500" />;
    return <Clock className="w-4 h-4 text-blue-500" />;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-[#111c38] rounded-3xl max-w-2xl w-full border border-blue-200/60 dark:border-sky-500/20 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-sky-900 p-5 text-white flex items-center justify-between border-b border-blue-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-sky-300 border border-white/20 shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                គ្រប់គ្រងវេនសិក្សា (Manage Shifts)
              </h3>
              <p className="text-xs text-sky-200/90 font-medium">
                បង្កើត កែប្រែ លុប និងកំណត់ម៉ោងសិក្សាតាមវេន (Create / Edit / Delete / Select Shifts)
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Top Actions & Notification */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-blue-50/70 dark:bg-blue-950/40 p-4 rounded-2xl border border-blue-200/80 dark:border-blue-800/60">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-700 dark:text-sky-400 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-900 dark:text-sky-200">
                <p className="font-bold">វេនសិក្សាសរុប: {shifts.length} វេន</p>
                <p className="text-[11px] text-blue-700 dark:text-sky-300/80">
                  វេនទាំងអស់អាចជ្រើសរើសបាននៅក្នុងផ្ទាំងនិស្សិត ថ្នាក់រៀន និងវត្តមាន។
                </p>
              </div>
            </div>

            {!isEditing && !isReadOnly && (
              <button
                type="button"
                onClick={handleStartCreate}
                className="px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ បង្កើតវេនថ្មី</span>
              </button>
            )}
          </div>

          {/* Form: Create or Edit Shift */}
          {isEditing && (
            <form onSubmit={handleSaveShift} className="bg-zinc-50 dark:bg-[#0e172e] p-5 rounded-2xl border border-blue-300/60 dark:border-sky-500/30 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <h4 className="font-bold text-xs text-blue-950 dark:text-sky-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                  <span>{editingShiftId ? 'កែប្រែព័ត៌មានវេនសិក្សា' : 'បង្កើតវេនសិក្សាថ្មី'}</span>
                </h4>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 font-medium"
                >
                  បោះបង់ (Cancel)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Khmer Name */}
                <div>
                  <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                    ឈ្មោះវេន (ខ្មែរ) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formNameKhmer}
                    onChange={(e) => setFormNameKhmer(e.target.value)}
                    placeholder="ឧ. វេនព្រឹក (Morning), វេនថ្ងៃត្រង់"
                    className="w-full px-3 py-2 bg-white dark:bg-[#162340] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:border-blue-500 outline-hidden font-medium"
                  />
                </div>

                {/* Latin Name */}
                <div>
                  <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                    ឈ្មោះជាឡាតាំង (Latin / English)
                  </label>
                  <input
                    type="text"
                    value={formNameLatin}
                    onChange={(e) => setFormNameLatin(e.target.value)}
                    placeholder="e.g. Morning Shift, Noon Shift"
                    className="w-full px-3 py-2 bg-white dark:bg-[#162340] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:border-blue-500 outline-hidden font-medium"
                  />
                </div>

                {/* Start Time */}
                <div>
                  <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                    ម៉ោងចាប់ផ្តើម (Start Time) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#162340] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:border-blue-500 outline-hidden font-mono font-bold"
                  />
                </div>

                {/* End Time */}
                <div>
                  <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                    ម៉ោងបញ្ចប់ (End Time) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#162340] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:border-blue-500 outline-hidden font-mono font-bold"
                  />
                </div>

                {/* Working Days */}
                <div>
                  <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                    ថ្ងៃសិក្សា (Study Days)
                  </label>
                  <input
                    type="text"
                    value={formDays}
                    onChange={(e) => setFormDays(e.target.value)}
                    placeholder="ឧ. ច័ន្ទ - សុក្រ, សៅរ៍ - អាទិត្យ, រាល់ថ្ងៃ"
                    className="w-full px-3 py-2 bg-white dark:bg-[#162340] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:border-blue-500 outline-hidden font-medium"
                  />
                </div>

                {/* Color Theme */}
                <div>
                  <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                    ពណ៌សម្គាល់ (Theme Color)
                  </label>
                  <select
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#162340] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:border-blue-500 outline-hidden font-medium cursor-pointer"
                  >
                    {COLOR_OPTIONS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded-xl bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs cursor-pointer transition-colors"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingShiftId ? 'រក្សាទុកការកែប្រែ' : 'បង្កើតវេនថ្មី'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Shifts List Cards */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
              បញ្ជីវេនសិក្សាក្នុងប្រព័ន្ធ (Configured Shifts):
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {shifts.map((s) => (
                <div
                  key={s.id}
                  className="bg-white dark:bg-[#15203a] p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-sky-600 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/80 flex items-center justify-center border border-blue-200 dark:border-blue-800/60 shrink-0">
                          {getShiftIcon(s.code || s.nameKhmer)}
                        </div>
                        <div>
                          <h5 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                            {s.nameKhmer}
                          </h5>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                            {s.nameLatin || s.code}
                          </p>
                        </div>
                      </div>

                      {s.isDefault && (
                        <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[10px] font-bold border border-zinc-200 dark:border-zinc-700">
                          Default
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 py-2 border-t border-zinc-100 dark:border-zinc-800/80 text-xs">
                      <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400 shrink-0" />
                        <span className="font-mono">{s.timeRange}</span>
                      </div>
                      {s.days && (
                        <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-[11px]">
                          <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span>{s.days}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {!isReadOnly && (
                    <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(s)}
                        className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                        title="កែប្រែ"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>កែប្រែ</span>
                      </button>

                      {deleteConfirmId === s.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDeleteShift(s)}
                            className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] cursor-pointer"
                          >
                            ប្រាកដ
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-[10px] cursor-pointer"
                          >
                            ទេ
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(s.id)}
                          className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/60 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                          title="លុបវេន"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-50 dark:bg-[#0e172e] border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            ការផ្លាស់ប្តូរវេនសិក្សានឹងធ្វើបច្ចុប្បន្នភាពទិន្នន័យដោយស្វ័យប្រវត្តិ។
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            រួចរាល់ (Done)
          </button>
        </div>
      </div>
    </div>
  );
};
