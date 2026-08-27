import React, { useState } from 'react';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Layers,
  Sparkles,
  Check,
  CheckCircle,
  AlertCircle,
  Info,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { YearLevelItem } from '../types';
import { instituteService } from '../service/instituteService';

interface YearLevelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  yearLevels: YearLevelItem[];
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  isReadOnly?: boolean;
  onSelectYearLevel?: (item: YearLevelItem) => void;
}

const PRESET_YEARS = [
  {
    code: 'Foundation',
    nameKhmer: 'ឆ្នាំសិក្សាមូលដ្ឋាន (Foundation)',
    nameLatin: 'Foundation Year',
    levelNumber: 0,
    description: 'ឆ្នាំសិក្សាមូលដ្ឋានគ្រឹះមុនចូលរៀនឆ្នាំទី១'
  },
  {
    code: 'Year 1',
    nameKhmer: 'ឆ្នាំទី ១ (Year 1)',
    nameLatin: 'Year 1',
    levelNumber: 1,
    description: 'និស្សិតឆ្នាំទី១ ឆមាសទី១ និងទី២'
  },
  {
    code: 'Year 2',
    nameKhmer: 'ឆ្នាំទី ២ (Year 2)',
    nameLatin: 'Year 2',
    levelNumber: 2,
    description: 'និស្សិតឆ្នាំទី២ ឆមាសទី៣ និងទី៤'
  },
  {
    code: 'Year 3',
    nameKhmer: 'ឆ្នាំទី ៣ (Year 3)',
    nameLatin: 'Year 3',
    levelNumber: 3,
    description: 'និស្សិតឆ្នាំទី៣ ឆមាសទី៥ និងទី៦'
  },
  {
    code: 'Year 4',
    nameKhmer: 'ឆ្នាំទី ៤ (Year 4)',
    nameLatin: 'Year 4',
    levelNumber: 4,
    description: 'និស្សិតឆ្នាំទី៤ ឆមាសទី៧ និងទី៨ (ឆ្នាំបញ្ចប់)'
  },
  {
    code: 'Year 5',
    nameKhmer: 'ឆ្នាំទី ៥ (Year 5 / វិស្វករ)',
    nameLatin: 'Year 5 (Engineering)',
    levelNumber: 5,
    description: 'និស្សិតឆ្នាំទី៥ សម្រាប់កម្មវិធី ៥ ឆ្នាំ'
  },
  {
    code: 'Bridging',
    nameKhmer: 'ថ្នាក់បន្តវេន / ត្រៀម (Bridging Course)',
    nameLatin: 'Bridging Year',
    levelNumber: 0,
    description: 'វគ្គបំប៉នតភ្ជាប់ពីបរិញ្ញាបត្ររងទៅបរិញ្ញាបត្រ'
  },
  {
    code: 'Master Y1',
    nameKhmer: 'អនុបណ្ឌិត ឆ្នាំទី ១ (Master Y1)',
    nameLatin: 'Master Year 1',
    levelNumber: 1,
    description: 'កម្មវិធីអនុបណ្ឌិតឆ្នាំទី១'
  },
  {
    code: 'Master Y2',
    nameKhmer: 'អនុបណ្ឌិត ឆ្នាំទី ២ (Master Y2)',
    nameLatin: 'Master Year 2',
    levelNumber: 2,
    description: 'កម្មវិធីអនុបណ្ឌិតឆ្នាំទី២ (និក្ខេបបទ)'
  }
];

export const YearLevelsModal: React.FC<YearLevelsModalProps> = ({
  isOpen,
  onClose,
  yearLevels = [],
  showToast,
  isReadOnly = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingYearId, setEditingYearId] = useState<string | null>(null);

  // Form fields
  const [formCode, setFormCode] = useState('');
  const [formNameKhmer, setFormNameKhmer] = useState('');
  const [formNameLatin, setFormNameLatin] = useState('');
  const [formLevelNumber, setFormLevelNumber] = useState<number>(1);
  const [formDescription, setFormDescription] = useState('');

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setIsEditing(false);
    setEditingYearId(null);
    setFormCode('');
    setFormNameKhmer('');
    setFormNameLatin('');
    setFormLevelNumber(1);
    setFormDescription('');
    setDeleteConfirmId(null);
  };

  const handleStartCreate = () => {
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនអាចបង្កើតកម្រិតឆ្នាំបានទេ (Read-Only Mode)!', 'info');
      return;
    }
    resetForm();
    setIsEditing(true);
    const nextLevel = yearLevels.length > 0 ? Math.max(...yearLevels.map((y) => y.levelNumber || 1)) + 1 : 1;
    setFormCode(`Year ${nextLevel}`);
    setFormNameKhmer(`ឆ្នាំទី ${nextLevel} (Year ${nextLevel})`);
    setFormNameLatin(`Year ${nextLevel}`);
    setFormLevelNumber(nextLevel);
  };

  const handleStartEdit = (item: YearLevelItem) => {
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនអាចកែប្រែទិន្នន័យបានទេ (Read-Only Mode)!', 'info');
      return;
    }
    setEditingYearId(item.id);
    setFormCode(item.code);
    setFormNameKhmer(item.nameKhmer);
    setFormNameLatin(item.nameLatin || '');
    setFormLevelNumber(item.levelNumber ?? 1);
    setFormDescription(item.description || '');
    setIsEditing(true);
  };

  const handleApplyPreset = (preset: typeof PRESET_YEARS[0]) => {
    setFormCode(preset.code);
    setFormNameKhmer(preset.nameKhmer);
    setFormNameLatin(preset.nameLatin);
    setFormLevelNumber(preset.levelNumber);
    setFormDescription(preset.description);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    if (!formCode.trim() || !formNameKhmer.trim()) {
      showToast('សូមបំពេញកូដកម្រិតឆ្នាំ និងឈ្មោះជាភាសាខ្មែរ!', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const yearId = editingYearId || `yr_${Date.now()}`;
      const payload: YearLevelItem = {
        id: yearId,
        code: formCode.trim(),
        nameKhmer: formNameKhmer.trim(),
        nameLatin: formNameLatin.trim() || formCode.trim(),
        levelNumber: Number(formLevelNumber) || 1,
        description: formDescription.trim(),
        isDefault: Boolean(editingYearId ? yearLevels.find((y) => y.id === editingYearId)?.isDefault : false),
        updatedAt: new Date().toISOString()
      };

      await instituteService.saveYearLevel(payload);
      showToast(editingYearId ? 'បានកែប្រែកម្រិតឆ្នាំដោយជោគជ័យ!' : 'បានបង្កើតកម្រិតឆ្នាំថ្មីដោយជោគជ័យ!', 'success');
      resetForm();
    } catch (err: any) {
      console.error('Error saving year level:', err);
      showToast('មានបញ្ហាក្នុងការរក្សាទុកកម្រិតឆ្នាំ!', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (isReadOnly) return;
    try {
      await instituteService.deleteYearLevel(id);
      showToast('បានលុបកម្រិតឆ្នាំសិក្សាដោយជោគជ័យ!', 'success');
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Error deleting year level:', err);
      showToast('មិនអាចលុបកម្រិតឆ្នាំនេះបានទេ!', 'error');
    }
  };

  const handleResetDefaults = async () => {
    if (isReadOnly) return;
    if (window.confirm('តើអ្នកពិតជាចង់កំណត់កម្រិតឆ្នាំសិក្សាទៅទម្រង់ដើមវិញមែនទេ?')) {
      await instituteService.resetYearLevelsToDefault();
      showToast('បានកំណត់កម្រិតឆ្នាំសិក្សាទៅលំនាំដើមវិញ!', 'info');
      resetForm();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0f172a] border border-zinc-200 dark:border-blue-900/40 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-zinc-800 dark:text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#131f37]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-sky-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-zinc-900 dark:text-white">
                គ្រប់គ្រងកម្រិតឆ្នាំសិក្សា (Year Levels)
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                បន្ថែម កែប្រែ និងកំណត់ជម្រើសឆ្នាំសិក្សាសម្រាប់ថ្នាក់រៀន និងនិស្សិត
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Top Actions */}
          {!isEditing && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                សរុបមាន <span className="font-bold text-blue-600 dark:text-sky-400">{yearLevels.length}</span> កម្រិតឆ្នាំសិក្សា
              </div>
              <div className="flex items-center gap-2">
                {!isReadOnly && (
                  <>
                    <button
                      type="button"
                      onClick={handleResetDefaults}
                      className="px-3 py-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                    >
                      កំណត់ដើមវិញ
                    </button>
                    <button
                      type="button"
                      onClick={handleStartCreate}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      + បង្កើតកម្រិតឆ្នាំថ្មី
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Create / Edit Form */}
          {isEditing ? (
            <div className="bg-slate-50 dark:bg-[#131f37] border border-blue-200 dark:border-blue-800/60 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <div className="flex items-center gap-2 font-bold text-sm text-blue-600 dark:text-sky-400">
                  <Sparkles className="w-4 h-4" />
                  {editingYearId ? 'កែប្រែកម្រិតឆ្នាំសិក្សា' : 'បង្កើតកម្រិតឆ្នាំសិក្សាថ្មី'}
                </div>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer"
                >
                  បោះបង់
                </button>
              </div>

              {/* Quick Presets for fast creation */}
              {!editingYearId && (
                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1.5">
                    ⚡ ជ្រើសរើសគំរូរហ័ស (Quick Presets)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_YEARS.map((preset) => (
                      <button
                        key={preset.code}
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                          formCode === preset.code
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white dark:bg-[#182645] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-blue-400'
                        }`}
                      >
                        {preset.code}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      កូដកម្រិតឆ្នាំ (Code / Key) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      placeholder="ឧទាហរណ៍: Year 1, Foundation, Year 5"
                      className="w-full px-3 py-2 bg-white dark:bg-[#182645] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 font-bold focus:border-blue-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      លេខរៀងកម្រិត (Level Number)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={formLevelNumber}
                      onChange={(e) => setFormLevelNumber(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white dark:bg-[#182645] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:border-blue-500 outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      ឈ្មោះជាភាសាខ្មែរ (Khmer Name) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formNameKhmer}
                      onChange={(e) => setFormNameKhmer(e.target.value)}
                      placeholder="ឧទាហរណ៍: ឆ្នាំទី ១ (Year 1)"
                      className="w-full px-3 py-2 bg-white dark:bg-[#182645] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 font-bold focus:border-blue-500 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      ឈ្មោះជាអក្សរឡាតាំង (Latin Name)
                    </label>
                    <input
                      type="text"
                      value={formNameLatin}
                      onChange={(e) => setFormNameLatin(e.target.value)}
                      placeholder="ឧទាហរណ៍: Year 1"
                      className="w-full px-3 py-2 bg-white dark:bg-[#182645] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:border-blue-500 outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    ការពិពណ៌នាបន្ថែម (Description)
                  </label>
                  <input
                    type="text"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="ឧទាហរណ៍: កម្មវិធីថ្នាក់ឆ្នាំទី១ ឆមាសទី១ និងទី២"
                    className="w-full px-3 py-2 bg-white dark:bg-[#182645] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:border-blue-500 outline-hidden"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                  >
                    បោះបង់
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? 'កំពុងរក្សាទុក...' : editingYearId ? 'រក្សាទុកការកែប្រែ' : 'បង្កើតកម្រិតឆ្នាំ'}
                  </button>
                </div>
              </form>
            </div>
          ) : null}

          {/* List of Year Levels */}
          <div className="space-y-2">
            {yearLevels.length === 0 ? (
              <div className="text-center py-8 bg-zinc-50 dark:bg-[#131f37] rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs">
                មិនទាន់មានកម្រិតឆ្នាំណាមួយឡើយ។ សូមចុចប៊ូតុង &ldquo;+ បង្កើតកម្រិតឆ្នាំថ្មី&rdquo; ដើម្បីបន្ថែម!
              </div>
            ) : (
              yearLevels.map((y) => {
                const isDeleting = deleteConfirmId === y.id;
                return (
                  <div
                    key={y.id}
                    className="flex items-center justify-between p-3.5 bg-white dark:bg-[#131f37] border border-zinc-200 dark:border-zinc-800/80 hover:border-blue-400 dark:hover:border-blue-600 rounded-2xl transition-all shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 flex flex-col items-center justify-center text-blue-700 dark:text-sky-300 shrink-0">
                        <span className="font-extrabold text-xs leading-none">{y.code}</span>
                        <span className="text-[9px] text-blue-600/75 dark:text-sky-400/75 mt-0.5">#{y.levelNumber ?? 0}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                            {y.nameKhmer}
                          </span>
                          {y.isDefault && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                              លំនាំដើម
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-2 mt-0.5">
                          <span>{y.nameLatin || y.code}</span>
                          {y.description && (
                            <>
                              <span>&bull;</span>
                              <span className="truncate max-w-[240px]">{y.description}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {!isReadOnly && (
                      <div className="flex items-center gap-1.5">
                        {isDeleting ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDelete(y.id)}
                              className="px-2.5 py-1 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer"
                            >
                              បញ្ជាក់លុប
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-1 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer"
                            >
                              បោះបង់
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(y)}
                              className="p-1.5 text-zinc-500 hover:text-blue-600 dark:hover:text-sky-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                              title="កែប្រែ"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {!y.isDefault && (
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(y.id)}
                                className="p-1.5 text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                                title="លុប"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#131f37] flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
            <Info className="w-4 h-4 text-blue-500" />
            <span>កម្រិតឆ្នាំដែលបានបង្កើតនឹងបង្ហាញក្នុងបញ្ជីជ្រើសរើសនៃផ្ទាំងបង្កើតថ្នាក់រៀនដោយស្វ័យប្រវត្តិ</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold rounded-xl transition-colors cursor-pointer"
          >
            បិទ
          </button>
        </div>
      </div>
    </div>
  );
};
