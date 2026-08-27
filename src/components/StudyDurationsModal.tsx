import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  AlertCircle,
  Check,
  Hourglass,
  Search,
  CheckCircle2,
  Award,
  Layers,
  Calendar,
  Clock,
  ArrowRight,
  Info
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

const PRESETS = [
  {
    nameKhmer: '៤ ឆ្នាំ (ថ្នាក់បរិញ្ញាបត្រ - Bachelor)',
    nameLatin: "4 Years (Bachelor's Degree)",
    years: 4,
    degreeLevel: 'bachelor',
    description: 'កម្មវិធីសិក្សាថ្នាក់បរិញ្ញាបត្រពេញលេញ ៤ ឆ្នាំ សរុប ៨ ឆមាស',
    isDefault: true
  },
  {
    nameKhmer: '២ ឆ្នាំ (ថ្នាក់បរិញ្ញាបត្ររង - Associate)',
    nameLatin: "2 Years (Associate Degree)",
    years: 2,
    degreeLevel: 'associate',
    description: 'កម្មវិធីសិក្សាថ្នាក់បរិញ្ញាបត្ររង ឬសញ្ញាបត្រជាន់ខ្ពស់ ២ ឆ្នាំ',
    isDefault: false
  },
  {
    nameKhmer: '២ ឆ្នាំ (ថ្នាក់អនុបណ្ឌិត - Master)',
    nameLatin: "2 Years (Master's Degree)",
    years: 2,
    degreeLevel: 'master',
    description: 'កម្មវិធីសិក្សាថ្នាក់អនុបណ្ឌិតជំនាញជាន់ខ្ពស់ ២ ឆ្នាំ សរុប ៤ ឆមាស',
    isDefault: false
  },
  {
    nameKhmer: '៣ ឆ្នាំ (ថ្នាក់បណ្ឌិត - PhD)',
    nameLatin: '3 Years (Doctoral Degree)',
    years: 3,
    degreeLevel: 'phd',
    description: 'កម្មវិធីថ្នាក់បណ្ឌិតស្រាវជ្រាវ និងទស្សនវិជ្ជា ៣ ឆ្នាំ',
    isDefault: false
  },
  {
    nameKhmer: '៥ ឆ្នាំ (ថ្នាក់វិស្វករ / ស្ថាបត្យកម្ម - Engineering)',
    nameLatin: '5 Years (Engineering Program)',
    years: 5,
    degreeLevel: 'phd',
    description: 'កម្មវិធីបណ្តុះបណ្តាលជំនាញវិស្វកម្ម និងបច្ចេកទេស ៥ ឆ្នាំ',
    isDefault: false
  },
  {
    nameKhmer: '៦ ខែ (វគ្គខ្លី - Short Course)',
    nameLatin: '6 Months (Certificate Course)',
    years: 0.5,
    degreeLevel: 'short_course',
    description: 'វគ្គបណ្តុះបណ្តាលជំនាញខ្លី និងវិញ្ញាបនបត្រ ៦ ខែ',
    isDefault: false
  }
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
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'edit'>('list');
  const [editingDurationId, setEditingDurationId] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterLevel, setSelectedFilterLevel] = useState<string>('all');

  // Form states
  const [formNameKhmer, setFormNameKhmer] = useState('');
  const [formNameLatin, setFormNameLatin] = useState('');
  const [formYears, setFormYears] = useState<number>(4);
  const [formDegreeLevel, setFormDegreeLevel] = useState('bachelor');
  const [formDescription, setFormDescription] = useState('');
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Deletion confirm
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const resetForm = () => {
    setActiveTab('list');
    setEditingDurationId(null);
    setFormNameKhmer('');
    setFormNameLatin('');
    setFormYears(4);
    setFormDegreeLevel('bachelor');
    setFormDescription('');
    setFormIsDefault(false);
    setDeleteConfirmId(null);
    setIsSubmitting(false);
  };

  // --- CREATE ---
  const handleStartCreate = () => {
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនអាចបង្កើតរយៈពេលសិក្សាថ្មីបានទេ (Read-Only Mode)!', 'info');
      return;
    }
    setEditingDurationId(null);
    setFormNameKhmer('');
    setFormNameLatin('');
    setFormYears(4);
    setFormDegreeLevel('bachelor');
    setFormDescription('');
    setFormIsDefault(false);
    setActiveTab('create');
  };

  // --- EDIT / UPDATE ---
  const handleStartEdit = (item: StudyDurationItem) => {
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនអាចកែប្រែរយៈពេលសិក្សាបានទេ (Read-Only Mode)!', 'info');
      return;
    }
    setEditingDurationId(item.id);
    setFormNameKhmer(item.nameKhmer);
    setFormNameLatin(item.nameLatin || '');
    setFormYears(item.years);
    setFormDegreeLevel(item.degreeLevel || 'bachelor');
    setFormDescription(item.description || '');
    setFormIsDefault(Boolean(item.isDefault));
    setActiveTab('edit');
  };

  // Apply Preset
  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setFormNameKhmer(preset.nameKhmer);
    setFormNameLatin(preset.nameLatin);
    setFormYears(preset.years);
    setFormDegreeLevel(preset.degreeLevel);
    setFormDescription(preset.description);
    setFormIsDefault(preset.isDefault);
    showToast(`បានអនុវត្តគំរូ: ${preset.nameKhmer}`, 'info');
  };

  // --- SAVE / CREATE / UPDATE ---
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

    setIsSubmitting(true);
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
          ? `បានធ្វើបច្ចុប្បន្នភាពរយៈពេលសិក្សា "${newDuration.nameKhmer}" ដោយជោគជ័យ!`
          : `បានបង្កើតរយៈពេលសិក្សាថ្មី "${newDuration.nameKhmer}" ដោយជោគជ័យ!`,
        'success'
      );
      if (onSelectDuration && editingDurationId === selectedDurationId) {
        onSelectDuration(newDuration);
      }
      resetForm();
    } catch (err) {
      console.error(err);
      showToast('មិនអាចរក្សាទុករយៈពេលសិក្សាបានទេ', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- DELETE ---
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

  // --- SELECT ---
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

  // Filtered durations
  const filteredDurations = useMemo(() => {
    return durations.filter((d) => {
      const matchSearch =
        d.nameKhmer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.nameLatin && d.nameLatin.toLowerCase().includes(searchQuery.toLowerCase())) ||
        String(d.years).includes(searchQuery);

      const matchLevel = selectedFilterLevel === 'all' || d.degreeLevel === selectedFilterLevel;
      return matchSearch && matchLevel;
    });
  }, [durations, searchQuery, selectedFilterLevel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111c38] rounded-3xl max-w-3xl w-full border border-zinc-200 dark:border-blue-900/40 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-blue-800 dark:bg-blue-950 p-5 text-white flex items-center justify-between border-b border-blue-700/50">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-blue-300 border border-white/15 shadow-xs">
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
              <p className="text-xs text-blue-200/90">
                បង្កើត (Create), កែប្រែ & ធ្វើបច្ចុប្បន្នភាព (Edit / Update), ជ្រើសរើស (Select), និងលុប (Delete) រយៈពេលសិក្សា
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

        {/* Navigation Tabs within Modal */}
        <div className="px-6 pt-4 pb-2 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 bg-zinc-50/50 dark:bg-[#182645]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'list'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>បញ្ជីរយៈពេលសិក្សា ({durations.length})</span>
            </button>

            {!isReadOnly && (
              <button
                type="button"
                onClick={handleStartCreate}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'create'
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 hover:bg-blue-100'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ បង្កើតថ្មី (Create)</span>
              </button>
            )}

            {activeTab === 'edit' && (
              <div className="px-3.5 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 text-xs font-bold flex items-center gap-1.5">
                <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                <span>កំពុងកែប្រែ & ធ្វើបច្ចុប្បន្នភាព</span>
              </div>
            )}
          </div>

          <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 hidden sm:inline">
            កម្រិតសញ្ញាបត្រ និងឆ្នាំសិក្សាផ្លូវការ
          </span>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Read-Only Notice */}
          {isReadOnly && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                របៀបភ្ញៀវ (Read-Only Mode): អ្នកអាចមើល និងជ្រើសរើស (Select) រយៈពេលសិក្សាបាន ប៉ុន្តែមិនអាចបង្កើត កែប្រែ ឬលុបទិន្នន័យបានទេ។
              </span>
            </div>
          )}

          {/* Form View (Create or Edit/Update) */}
          {activeTab === 'create' || activeTab === 'edit' ? (
            <form onSubmit={handleSaveDuration} className="space-y-4">
              <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-blue-200 dark:border-blue-800/50">
                  <h4 className="font-bold text-sm text-blue-900 dark:text-blue-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>
                      {activeTab === 'edit'
                        ? 'កែប្រែ & ធ្វើបច្ចុប្បន្នភាពរយៈពេលសិក្សា (Edit & Update Duration)'
                        : 'បង្កើតរយៈពេលសិក្សាថ្មី (Create New Study Duration)'}
                    </span>
                  </h4>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-xs text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 font-semibold cursor-pointer"
                  >
                    បោះបង់ (Cancel)
                  </button>
                </div>

                {/* Quick Presets (Only in Create Mode) */}
                {activeTab === 'create' && (
                  <div className="space-y-2 pb-2">
                    <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                      គំរូរហ័ស (Quick Templates) - ចុចដើម្បីបំពេញស្វ័យប្រវត្តិ:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PRESETS.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleApplyPreset(p)}
                          className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#182645] hover:bg-blue-100 dark:hover:bg-blue-900/60 text-zinc-800 dark:text-zinc-200 text-xs font-semibold border border-zinc-200 dark:border-zinc-700/80 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <span>{p.years} ឆ្នាំ</span>
                          <span className="text-[10.5px] text-zinc-500 dark:text-zinc-400 font-normal">
                            ({p.degreeLevel})
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#182645] text-zinc-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden font-semibold"
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#182645] text-zinc-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
                    />
                  </div>

                  {/* Number of Years */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      ចំនួនឆ្នាំសិក្សា (Years / Duration) <span className="text-rose-500">*</span>
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.5"
                          min="0.1"
                          max="10"
                          required
                          value={formYears}
                          onChange={(e) => setFormYears(parseFloat(e.target.value) || 0)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#182645] text-zinc-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden font-bold"
                        />
                        <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 shrink-0">ឆ្នាំ</span>
                      </div>

                      {/* Quick Years chips */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[0.5, 1, 2, 3, 4, 4.5, 5, 6].map((yr) => (
                          <button
                            key={yr}
                            type="button"
                            onClick={() => setFormYears(yr)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                              formYears === yr
                                ? 'bg-blue-700 text-white border-blue-800'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                            }`}
                          >
                            {yr} ឆ្នាំ
                          </button>
                        ))}
                      </div>
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#182645] text-zinc-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden font-medium"
                    >
                      {DEGREE_LEVEL_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.nameKhmer} — {opt.nameLatin}
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#182645] text-zinc-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden resize-none"
                    />
                  </div>

                  {/* Default checkbox */}
                  <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="formIsDefault"
                      checked={formIsDefault}
                      onChange={(e) => setFormIsDefault(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded-sm border-zinc-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <label
                      htmlFor="formIsDefault"
                      className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer"
                    >
                      កំណត់ជារយៈពេលសិក្សាលំនាំដើម (Default Duration)
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-blue-200 dark:border-blue-800/50">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs transition-colors cursor-pointer"
                  >
                    បោះបង់ (Cancel)
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {isSubmitting
                        ? 'កំពុងរក្សាទុក...'
                        : activeTab === 'edit'
                        ? 'ធ្វើបច្ចុប្បន្នភាព (Update / Save)'
                        : 'បង្កើតឥឡូវនេះ (Create Now)'}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50 dark:bg-[#182645] p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="ស្វែងរកតាមឈ្មោះ ឬចំនួនឆ្នាំ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-1.5 bg-white dark:bg-[#111c38] border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Filter chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    type="button"
                    onClick={() => setSelectedFilterLevel('all')}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold shrink-0 transition-colors cursor-pointer ${
                      selectedFilterLevel === 'all'
                        ? 'bg-blue-700 text-white'
                        : 'bg-white dark:bg-[#111c38] text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700'
                    }`}
                  >
                    ទាំងអស់ ({durations.length})
                  </button>
                  {DEGREE_LEVEL_OPTIONS.map((lvl) => {
                    const count = durations.filter((d) => d.degreeLevel === lvl.id).length;
                    if (count === 0 && selectedFilterLevel !== lvl.id) return null;
                    return (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => setSelectedFilterLevel(lvl.id)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold shrink-0 transition-colors cursor-pointer ${
                          selectedFilterLevel === lvl.id
                            ? 'bg-blue-700 text-white'
                            : 'bg-white dark:bg-[#111c38] text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700'
                        }`}
                      >
                        {lvl.nameKhmer.split(' ')[0]} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Durations Cards List */}
              <div className="space-y-3">
                {filteredDurations.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 text-xs space-y-2">
                    <Hourglass className="w-8 h-8 mx-auto text-zinc-400 opacity-60" />
                    <p>មិនមានទិន្នន័យរយៈពេលសិក្សាដែលត្រូវនឹងការស្វែងរកទេ</p>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={handleStartCreate}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ បង្កើតថ្មី (Create New)</span>
                      </button>
                    )}
                  </div>
                ) : (
                  filteredDurations.map((item) => {
                    const isSelected = selectedDurationId === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 shadow-xs ring-2 ring-blue-500/20'
                            : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-[#182645] hover:border-blue-300 dark:hover:border-blue-800/60'
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
                              <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-700 text-[10px] font-bold">
                                លំនាំដើម (Default)
                              </span>
                            )}
                            {isSelected && (
                              <span className="px-2.5 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold inline-flex items-center gap-1 shadow-2xs">
                                <Check className="w-3 h-3" />
                                <span>កំពុងជ្រើសរើស (Selected)</span>
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

                        {/* Action Buttons: Select / Edit / Delete */}
                        <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-200 dark:border-zinc-700/60">
                          {/* SELECT BUTTON */}
                          {onSelectDuration && (
                            <button
                              type="button"
                              onClick={() => handleSelect(item)}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1 shadow-2xs ${
                                isSelected
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800'
                              }`}
                              title="ជ្រើសរើសរយៈពេលសិក្សានេះសម្រាប់ជំនាញ"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>ជ្រើសរើស (Select)</span>
                            </button>
                          )}

                          {/* EDIT / UPDATE & DELETE BUTTONS */}
                          {!isReadOnly && (
                            <div className="flex items-center gap-1.5">
                              {/* EDIT BUTTON */}
                              <button
                                type="button"
                                onClick={() => handleStartEdit(item)}
                                title="កែប្រែ & ធ្វើបច្ចុប្បន្នភាព (Edit / Update)"
                                className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-100 dark:hover:bg-amber-950/60 text-zinc-700 dark:text-zinc-300 hover:text-amber-700 dark:hover:text-amber-300 transition-colors cursor-pointer border border-zinc-200 dark:border-zinc-700"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* DELETE BUTTON WITH INLINE CONFIRM */}
                              {deleteConfirmId === item.id ? (
                                <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/60 p-1 rounded-xl border border-rose-200 dark:border-rose-800 shadow-xs">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteDuration(item.id)}
                                    className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded-lg cursor-pointer transition-colors"
                                  >
                                    បញ្ជាក់លុប
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="p-1 text-zinc-500 hover:text-zinc-800 dark:text-zinc-300 text-xs cursor-pointer"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmId(item.id)}
                                  title="លុបរយៈពេលសិក្សា (Delete)"
                                  className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer border border-rose-200/60 dark:border-rose-900/50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
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
        <div className="p-4 bg-zinc-50 dark:bg-[#182645] border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <Info className="w-3.5 h-3.5 text-blue-600" />
            <span>
              សរុប {durations.length} ប្រភេទ (បរិញ្ញាបត្រ, បរិញ្ញាបត្ររង, អនុបណ្ឌិត, បណ្ឌិត, វគ្គខ្លី)
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 font-bold text-xs transition-colors cursor-pointer"
          >
            បិទ (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
