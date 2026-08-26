import React, { useState } from 'react';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  AlertCircle,
  Check,
  Hourglass
} from 'lucide-react';
import { StudyDurationItem } from '../types';
import { instituteService } from '../service/instituteService';

interface StudyDurationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  durations?: StudyDurationItem[];
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  isReadOnly?: boolean;
  onSelectDuration?: (duration: StudyDurationItem) => void;
  selectedDurationId?: string;
}

const DEGREE_LEVEL_OPTIONS = [
  { id: 'bachelor', nameKhmer: 'ថ្នាក់បរិញ្ញាបត្រ (Bachelor)', nameLatin: "Bachelor's Degree", color: 'blue' },
  { id: 'master', nameKhmer: 'ថ្នាក់អនុបណ្ឌិត (Master)', nameLatin: "Master's Degree", color: 'indigo' },
  { id: 'associate', nameKhmer: 'ថ្នាក់បរិញ្ញាបត្ររង / សញ្ញាបត្រជាន់ខ្ពស់ (Associate)', nameLatin: 'Associate Degree', color: 'emerald' },
  { id: 'phd', nameKhmer: 'ថ្នាក់បណ្ឌិត / វិស្វករ (Doctorate / Engineering)', nameLatin: 'Doctorate Degree', color: 'purple' },
  { id: 'short_course', nameKhmer: 'វគ្គខ្លី / មូលដ្ឋានគ្រឹះ (Short Course / Certificate)', nameLatin: 'Short Course', color: 'amber' },
  { id: 'custom', nameKhmer: 'កម្មវិធីផ្សេងៗ (Custom / Vocational)', nameLatin: 'Special Program', color: 'teal' }
];

export const StudyDurationsModal: React.FC<StudyDurationsModalProps> = ({
  isOpen,
  onClose,
  durations = [],
  showToast,
  isReadOnly = false,
  onSelectDuration,
  selectedDurationId
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingDurationId, setEditingDurationId] = useState<string | null>(null);

  // Form states
  const [formNameKhmer, setFormNameKhmer] = useState('');
  const [formNameLatin, setFormNameLatin] = useState('');
  const [formYears, setFormYears] = useState<number>(4);
  const [formDegreeLevel, setFormDegreeLevel] = useState('bachelor');
  const [formDescription, setFormDescription] = useState('');
  const [formIsDefault, setFormIsDefault] = useState(false);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setIsEditing(false);
    setEditingDurationId(null);
    setFormNameKhmer('');
    setFormNameLatin('');
    setFormYears(4);
    setFormDegreeLevel('bachelor');
    setFormDescription('');
    setFormIsDefault(false);
    setDeleteConfirmId(null);
  };

  const handleStartCreate = () => {
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនអាចបង្កើតរយៈពេលសិក្សាថ្មីបានទេ (Read-Only Mode)!', 'info');
      return;
    }
    setIsEditing(true);
    setEditingDurationId(null);
    setFormNameKhmer('');
    setFormNameLatin('');
    setFormYears(4);
    setFormDegreeLevel('bachelor');
    setFormDescription('');
    setFormIsDefault(false);
  };

  const handleStartEdit = (item: StudyDurationItem) => {
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនអាចកែប្រែរយៈពេលសិក្សាបានទេ (Read-Only Mode)!', 'info');
      return;
    }
    setIsEditing(true);
    setEditingDurationId(item.id);
    setFormNameKhmer(item.nameKhmer);
    setFormNameLatin(item.nameLatin || '');
    setFormYears(item.years);
    setFormDegreeLevel(item.degreeLevel || 'bachelor');
    setFormDescription(item.description || '');
    setFormIsDefault(Boolean(item.isDefault));
  };

  const handleSaveDuration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនអាចកែប្រែទិន្នន័យបានទេ (Read-Only Mode)!', 'info');
      return;
    }

    if (!formNameKhmer.trim()) {
      showToast('សូមបញ្ចូលឈ្មោះរយៈពេលសិក្សាជាភាសាខ្មែរ!', 'error');
      return;
    }

    if (formYears <= 0) {
      showToast('ចំនួនឆ្នាំសិក្សាត្រូវតែធំជាង ០!', 'error');
      return;
    }

    const durationId = editingDurationId || `dur_${Date.now()}`;
    const newDuration: StudyDurationItem = {
      id: durationId,
      nameKhmer: formNameKhmer.trim(),
      nameLatin: formNameLatin.trim() || `${formYears} Year(s) Program`,
      years: Number(formYears),
      degreeLevel: formDegreeLevel,
      description: formDescription.trim(),
      isDefault: formIsDefault
    };

    try {
      await instituteService.saveStudyDuration(newDuration);
      showToast(
        editingDurationId
          ? 'បានកែប្រែរយៈពេលសិក្សាដោយជោគជ័យ!'
          : 'បានបង្កើតរយៈពេលសិក្សាថ្មីដោយជោគជ័យ!',
        'success'
      );
      if (onSelectDuration && editingDurationId === selectedDurationId) {
        onSelectDuration(newDuration);
      }
      resetForm();
    } catch (err) {
      console.error(err);
      showToast('មិនអាចរក្សាទុករយៈពេលសិក្សាបានទេ', 'error');
    }
  };

  const handleDeleteDuration = async (id: string) => {
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនអាចលុបរយៈពេលសិក្សាបានទេ (Read-Only Mode)!', 'info');
      return;
    }

    try {
      await instituteService.deleteStudyDuration(id);
      showToast('បានលុបរយៈពេលសិក្សាដោយជោគជ័យ!', 'success');
      setDeleteConfirmId(null);
    } catch (err) {
      console.error(err);
      showToast('មិនអាចលុបរយៈពេលសិក្សាបានទេ', 'error');
    }
  };

  const handleSelect = (item: StudyDurationItem) => {
    if (onSelectDuration) {
      onSelectDuration(item);
      showToast(`បានជ្រើសរើសរយៈពេលសិក្សា: ${item.nameKhmer}`, 'success');
      onClose();
    }
  };

  const getDegreeBadgeColor = (level?: string) => {
    switch (level) {
      case 'bachelor':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800/60';
      case 'master':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60';
      case 'associate':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60';
      case 'phd':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800/60';
      case 'short_course':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800/60';
      default:
        return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#131f1a] rounded-3xl max-w-2xl w-full border border-emerald-900/10 dark:border-emerald-800/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-emerald-850 dark:bg-emerald-950 p-5 text-white flex items-center justify-between border-b border-emerald-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-300 border border-white/15 shadow-xs">
              <Hourglass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base">
                  គ្រប់គ្រងរយៈពេលសិក្សា (Study Durations)
                </h3>
                {isReadOnly && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold">
                    Read-Only
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-200/90">
                កំណត់ បង្កើត កែប្រែ ជ្រើសរើស និងលុបរយៈពេលសិក្សារបស់ជំនាញនីមួយៗ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Read-Only Notice */}
          {isReadOnly && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                របៀបភ្ញៀវ (Read-Only Mode): អ្នកអាចមើល និងជ្រើសរើសរយៈពេលសិក្សាបាន ប៉ុន្តែមិនអាចបង្កើត កែប្រែ ឬលុបទិន្នន័យបានទេ។
              </span>
            </div>
          )}

          {/* Form or List View */}
          {isEditing ? (
            <form onSubmit={handleSaveDuration} className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-200 dark:border-emerald-800/50">
                  <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>{editingDurationId ? 'កែប្រែរយៈពេលសិក្សា' : 'បង្កើតរយៈពេលសិក្សាថ្មី'}</span>
                  </h4>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-xs text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 font-semibold cursor-pointer"
                  >
                    បោះបង់
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name Khmer */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      ឈ្មោះជាភាសាខ្មែរ (Khmer Name) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ឧ. ៤ ឆ្នាំ (ថ្នាក់បរិញ្ញាបត្រ - Bachelor)"
                      value={formNameKhmer}
                      onChange={(e) => setFormNameKhmer(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#182620] text-zinc-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
                    />
                  </div>

                  {/* Name Latin */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      ឈ្មោះជាអក្សរឡាតាំង (Latin Name)
                    </label>
                    <input
                      type="text"
                      placeholder="ឧ. 4 Years (Bachelor Degree)"
                      value={formNameLatin}
                      onChange={(e) => setFormNameLatin(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#182620] text-zinc-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
                    />
                  </div>

                  {/* Number of Years */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      ចំនួនឆ្នាំសិក្សា (Years / Duration) <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.5"
                        min="0.1"
                        max="10"
                        required
                        value={formYears}
                        onChange={(e) => setFormYears(parseFloat(e.target.value) || 0)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#182620] text-zinc-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden font-bold"
                      />
                      <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 shrink-0">ឆ្នាំ</span>
                    </div>
                  </div>

                  {/* Degree Level */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      កម្រិតសញ្ញាបត្រ / កម្មវិធីសិក្សា (Degree Level)
                    </label>
                    <select
                      value={formDegreeLevel}
                      onChange={(e) => setFormDegreeLevel(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#182620] text-zinc-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
                    >
                      {DEGREE_LEVEL_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.nameKhmer} ({opt.nameLatin})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      ការពិពណ៌នាបន្ថែម (Description)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="ឧ. កម្មវិធីថ្នាក់បរិញ្ញាបត្រពេញលេញ ៤ ឆ្នាំ សរុប ៨ ឆមាស..."
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#182620] text-zinc-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden resize-none"
                    />
                  </div>

                  {/* Default checkbox */}
                  <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="formIsDefault"
                      checked={formIsDefault}
                      onChange={(e) => setFormIsDefault(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded-sm border-zinc-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="formIsDefault" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer">
                      កំណត់ជារយៈពេលសិក្សាលំនាំដើម (Default Duration)
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-emerald-200 dark:border-emerald-800/50">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs transition-colors cursor-pointer"
                  >
                    បោះបង់
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingDurationId ? 'រក្សាទុកការកែប្រែ' : 'បង្កើតឥឡូវនេះ'}</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Header Action Bar inside modal */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    បញ្ជីរយៈពេលសិក្សា ({durations.length})
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    ចុច "ជ្រើសរើស" ដើម្បីកំណត់សម្រាប់ជំនាញ ឬចុច "កែប្រែ/លុប"
                  </p>
                </div>

                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={handleStartCreate}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ បង្កើតថ្មី</span>
                  </button>
                )}
              </div>

              {/* Durations List */}
              <div className="space-y-3">
                {durations.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 text-xs space-y-2">
                    <Hourglass className="w-8 h-8 mx-auto text-zinc-400 opacity-60" />
                    <p>មិនទាន់មានទិន្នន័យរយៈពេលសិក្សានៅឡើយទេ</p>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={handleStartCreate}
                        className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-bold text-xs"
                      >
                        + បង្កើតឥឡូវនេះ
                      </button>
                    )}
                  </div>
                ) : (
                  durations.map((item) => {
                    const isSelected = selectedDurationId === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 shadow-xs'
                            : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-[#182620] hover:border-emerald-300 dark:hover:border-emerald-800/60'
                        }`}
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                              {item.nameKhmer}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold border ${getDegreeBadgeColor(
                                item.degreeLevel
                              )}`}
                            >
                              {item.years} ឆ្នាំ
                            </span>
                            {item.isDefault && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-[10px] font-bold">
                                លំនាំដើម (Default)
                              </span>
                            )}
                            {isSelected && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold inline-flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                <span>កំពុងជ្រើសរើស</span>
                              </span>
                            )}
                          </div>

                          {item.nameLatin && (
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                              {item.nameLatin}
                            </p>
                          )}

                          {item.description && (
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                              {item.description}
                            </p>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-200 dark:border-zinc-700/60">
                          {onSelectDuration && (
                            <button
                              type="button"
                              onClick={() => handleSelect(item)}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1 ${
                                isSelected
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>ជ្រើសរើស</span>
                            </button>
                          )}

                          {!isReadOnly && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleStartEdit(item)}
                                title="កែប្រែ"
                                className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {deleteConfirmId === item.id ? (
                                <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/60 p-1 rounded-xl border border-rose-200 dark:border-rose-800">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteDuration(item.id)}
                                    className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded-lg cursor-pointer"
                                  >
                                    បញ្ជាក់លុប
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="p-1 text-zinc-500 hover:text-zinc-800 dark:text-zinc-300 text-xs"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmId(item.id)}
                                  title="លុប"
                                  className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-50 dark:bg-[#182620] border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            សរុបរយៈពេលសិក្សា: {durations.length} ប្រភេទ
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 font-bold text-xs transition-colors cursor-pointer"
          >
            បិទ (Close)
          </button>
        </div>
      </div>
    </div>
  );
};

