import React, { useState, useMemo } from 'react';
import {
  Award,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  RotateCcw,
  Sparkles,
  Percent,
  Search,
  FileText,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { ScholarshipOption } from '../types';
import { instituteService } from '../service/instituteService';
import { INITIAL_SCHOLARSHIPS } from '../data/initialData';

interface ScholarshipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  scholarships: ScholarshipOption[];
  onSaveScholarship: (scholarship: ScholarshipOption) => Promise<void>;
  onDeleteScholarship: (id: string) => Promise<void>;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  isReadOnly?: boolean;
}

const BADGE_COLOR_PRESETS = [
  {
    name: 'Emerald (បៃតងត្បូង)',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-700',
    badgeText: 'text-emerald-800 dark:text-emerald-300',
    previewColor: 'bg-emerald-500'
  },
  {
    name: 'Teal (បៃតងសមុទ្រ)',
    badgeBg: 'bg-teal-100 dark:bg-teal-950/80 border-teal-300 dark:border-teal-700',
    badgeText: 'text-teal-800 dark:text-teal-300',
    previewColor: 'bg-teal-500'
  },
  {
    name: 'Blue (ខៀវ)',
    badgeBg: 'bg-blue-100 dark:bg-blue-950/80 border-blue-300 dark:border-blue-700',
    badgeText: 'text-blue-800 dark:text-blue-300',
    previewColor: 'bg-blue-500'
  },
  {
    name: 'Cyan (ផ្ទៃមេឃ)',
    badgeBg: 'bg-cyan-100 dark:bg-cyan-950/80 border-cyan-300 dark:border-cyan-700',
    badgeText: 'text-cyan-800 dark:text-cyan-300',
    previewColor: 'bg-cyan-500'
  },
  {
    name: 'Purple (ស្វាយ)',
    badgeBg: 'bg-purple-100 dark:bg-purple-950/80 border-purple-300 dark:border-purple-700',
    badgeText: 'text-purple-800 dark:text-purple-300',
    previewColor: 'bg-purple-500'
  },
  {
    name: 'Amber (លឿងទុំ / មាស)',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/80 border-amber-300 dark:border-amber-700',
    badgeText: 'text-amber-800 dark:text-amber-300',
    previewColor: 'bg-amber-500'
  },
  {
    name: 'Orange (ទឹកក្រូច)',
    badgeBg: 'bg-orange-100 dark:bg-orange-950/80 border-orange-300 dark:border-orange-700',
    badgeText: 'text-orange-800 dark:text-orange-300',
    previewColor: 'bg-orange-500'
  },
  {
    name: 'Rose (ផ្កាឈូកក្រហម)',
    badgeBg: 'bg-rose-100 dark:bg-rose-950/80 border-rose-300 dark:border-rose-700',
    badgeText: 'text-rose-800 dark:text-rose-300',
    previewColor: 'bg-rose-500'
  },
  {
    name: 'Slate (ប្រផេះ)',
    badgeBg: 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700',
    badgeText: 'text-zinc-800 dark:text-zinc-200',
    previewColor: 'bg-zinc-500'
  }
];

export const ScholarshipsModal: React.FC<ScholarshipsModalProps> = ({
  isOpen,
  onClose,
  scholarships,
  onSaveScholarship,
  onDeleteScholarship,
  showToast,
  isReadOnly = false,
}) => {
  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameKhmer, setNameKhmer] = useState('');
  const [nameLatin, setNameLatin] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState<number>(100);
  const [description, setDescription] = useState('');
  const [selectedColorIdx, setSelectedColorIdx] = useState<number>(0);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Memoized filtered list
  const filteredList = useMemo(() => {
    if (!searchKeyword.trim()) return scholarships;
    const q = searchKeyword.toLowerCase();
    return scholarships.filter(
      (s) =>
        s.nameKhmer.toLowerCase().includes(q) ||
        (s.nameLatin && s.nameLatin.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        s.id.toLowerCase().includes(q)
    );
  }, [scholarships, searchKeyword]);

  const handleStartAdd = () => {
    setIsEditing(true);
    setEditingId(null);
    setNameKhmer('');
    setNameLatin('');
    setDiscountPercentage(100);
    setDescription('');
    setSelectedColorIdx(0);
  };

  const handleStartEdit = (item: ScholarshipOption) => {
    setIsEditing(true);
    setEditingId(item.id);
    setNameKhmer(item.nameKhmer);
    setNameLatin(item.nameLatin || '');
    setDiscountPercentage(item.discountPercentage ?? 0);
    setDescription(item.description || '');

    // Match preset
    const foundIdx = BADGE_COLOR_PRESETS.findIndex((p) => p.badgeBg === item.badgeBg);
    setSelectedColorIdx(foundIdx >= 0 ? foundIdx : 0);
  };

  const handleCancelForm = () => {
    setIsEditing(false);
    setEditingId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameKhmer.trim()) {
      showToast('សូមបញ្ចូលឈ្មោះអាហារូបករណ៍ជាភាសាខ្មែរ', 'error');
      return;
    }

    const colorPreset = BADGE_COLOR_PRESETS[selectedColorIdx] || BADGE_COLOR_PRESETS[0];

    const generateId = (kh: string) => {
      const clean = kh.replace(/[^\w\s\u1780-\u17FF]/gi, '').trim().toLowerCase();
      const slug = clean.replace(/\s+/g, '_');
      return `sch_${slug.slice(0, 20)}_${Date.now().toString().slice(-4)}`;
    };

    const newOrUpdated: ScholarshipOption = {
      id: editingId || generateId(nameKhmer),
      nameKhmer: nameKhmer.trim(),
      nameLatin: nameLatin.trim() || undefined,
      discountPercentage: Number(discountPercentage) || 0,
      badgeBg: colorPreset.badgeBg,
      badgeText: colorPreset.badgeText,
      description: description.trim() || undefined,
      isDefault: editingId ? scholarships.find((s) => s.id === editingId)?.isDefault : false,
      updatedAt: new Date().toISOString()
    };

    if (!editingId) {
      newOrUpdated.createdAt = new Date().toISOString();
    }

    setIsSubmitting(true);
    try {
      await onSaveScholarship(newOrUpdated);
      showToast(
        editingId ? 'បានកែប្រែប្រភេទអាហារូបករណ៍ដោយជោគជ័យ!' : 'បានបន្ថែមប្រភេទអាហារូបករណ៍ថ្មីដោយជោគជ័យ!',
        'success'
      );
      setIsEditing(false);
      setEditingId(null);
    } catch (err: any) {
      showToast(err?.message || 'មានបញ្ហាក្នុងការរក្សាទុក', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsSubmitting(true);
    try {
      await onDeleteScholarship(id);
      showToast('បានលុបប្រភេទអាហារូបករណ៍រួចរាល់', 'info');
      setDeleteConfirmId(null);
      if (editingId === id) {
        setIsEditing(false);
        setEditingId(null);
      }
    } catch (err: any) {
      showToast(err?.message || 'មិនអាចលុបបានទេ', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetDefaults = async () => {
    if (window.confirm('តើអ្នកប្រាកដជាចង់កំណត់ប្រភេទអាហារូបករណ៍ឡើងវិញតាមទិន្នន័យដើមរបស់ប្រព័ន្ធ (Default) មែនទេ?')) {
      setIsSubmitting(true);
      try {
        await instituteService.resetScholarshipsToDefault();
        showToast('បានកំណត់ឡើងវិញតាមលំនាំដើមជោគជ័យ!', 'success');
      } catch (err: any) {
        showToast('មានបញ្ហាក្នុងការកំណត់ឡើងវិញ', 'error');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Safe early return AFTER all hooks
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#111c38] rounded-3xl border border-blue-900/20 dark:border-blue-900/50 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-blue-900/40 flex items-center justify-between bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-700 text-white flex items-center justify-center shadow-md">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>គ្រប់គ្រងប្រភេទអាហារូបករណ៍ (Manage Scholarships)</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-mono font-bold">
                  {scholarships.length} ប្រភេទ
                </span>
              </h2>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                បន្ថែម កែប្រែ ឬលុបប្រភេទអាហារូបករណ៍ និងកំណត់ភាគរយបញ្ចុះតម្លៃ (Discount %)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isReadOnly && !isEditing && (
              <button
                type="button"
                onClick={handleStartAdd}
                className="px-3.5 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>បន្ថែមអាហារូបករណ៍ថ្មី</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Add / Edit Form */}
          {isEditing && (
            <form
              onSubmit={handleSave}
              className="p-5 rounded-2xl bg-blue-50/50 dark:bg-[#182645] border border-blue-500/30 dark:border-blue-700/40 shadow-xs space-y-4 animate-in slide-in-from-top-2 duration-200"
            >
              <div className="flex items-center justify-between pb-3 border-b border-blue-200/60 dark:border-blue-800/60">
                <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-bold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>{editingId ? 'កែប្រែព័ត៌មានអាហារូបករណ៍' : 'បង្កើតប្រភេទអាហារូបករណ៍ថ្មី'}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 underline cursor-pointer"
                >
                  បោះបង់ (Cancel)
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name Khmer */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    ឈ្មោះអាហារូបករណ៍ (ខ្មែរ) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nameKhmer}
                    onChange={(e) => setNameKhmer(e.target.value)}
                    placeholder="ឧ. អាហារូបករណ៍ ២+២, អាហារូបករណ៍ ២៥%, អាហារូបករណ៍ឯកឧត្តមប្រធាន"
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#0e172e] border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-bold"
                  />
                </div>

                {/* Name Latin */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    ឈ្មោះជាភាសាអង់គ្លេស/ឡាតាំង (Latin Name)
                  </label>
                  <input
                    type="text"
                    value={nameLatin}
                    onChange={(e) => setNameLatin(e.target.value)}
                    placeholder="e.g. 2+2 Dual Degree Grant, 25% Partial Grant"
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#0e172e] border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Discount Percentage */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center justify-between">
                    <span>ភាគរយបញ្ចុះតម្លៃ (%)</span>
                    <span className="text-blue-700 dark:text-blue-400 font-mono font-bold">
                      {discountPercentage}%
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={discountPercentage}
                        onChange={(e) => setDiscountPercentage(Math.max(0, Math.min(100, Number(e.target.value))))}
                        className="w-full pl-8 pr-3.5 py-2 rounded-xl bg-white dark:bg-[#0e172e] border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 font-bold focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                      />
                      <Percent className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                    {/* Quick percentage buttons */}
                    <div className="flex items-center gap-1">
                      {[100, 70, 50, 30, 25, 0].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setDiscountPercentage(val)}
                          className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                            discountPercentage === val
                              ? 'bg-blue-700 text-white border-blue-700'
                              : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50'
                          }`}
                        >
                          {val}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Badge Color Preset */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    ពណ៌សម្គាល់ផ្លាក Badge
                  </label>
                  <div className="flex items-center gap-2 flex-wrap pt-0.5">
                    {BADGE_COLOR_PRESETS.map((preset, idx) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setSelectedColorIdx(idx)}
                        className={`w-7 h-7 rounded-xl flex items-center justify-center border-2 transition-all cursor-pointer ${
                          selectedColorIdx === idx
                            ? 'border-blue-600 scale-110 shadow-xs'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                        title={preset.name}
                      >
                        <span className={`w-4 h-4 rounded-lg ${preset.previewColor} block`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    ការពិពណ៌នា / លក្ខខណ្ឌអាហារូបករណ៍ (Description / Terms)
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="បញ្ជាក់ពីលក្ខខណ្ឌ ដៃគូសហការ ឬគោលការណ៍ជ្រើសរើស..."
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#0e172e] border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingId ? 'រក្សាទុកការកែប្រែ' : 'បង្កើតអាហារូបករណ៍'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Search & Filter Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="ស្វែងរកតាមឈ្មោះអាហារូបករណ៍ ឬភាគរយ..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-[#182645] border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-blue-500"
              />
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              {searchKeyword && (
                <button
                  type="button"
                  onClick={() => setSearchKeyword('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {!isReadOnly && (
              <button
                type="button"
                onClick={handleResetDefaults}
                disabled={isSubmitting}
                className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="កំណត់ឡើងវិញតាមទិន្នន័យដើមរបស់ប្រព័ន្ធ"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>កំណត់ឡើងវិញតាមដើម (Reset Defaults)</span>
              </button>
            )}
          </div>

          {/* Scholarship List (Cards & Table) */}
          <div className="space-y-3">
            {filteredList.length === 0 ? (
              <div className="p-8 text-center bg-zinc-50 dark:bg-[#182645] rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                <Award className="w-8 h-8 text-zinc-400 mx-auto mb-2 opacity-60" />
                <p className="font-bold text-sm text-zinc-700 dark:text-zinc-300">
                  ពុំមានប្រភេទអាហារូបករណ៍ត្រូវនឹងលក្ខខណ្ឌស្វែងរកទេ
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  សូមសាកល្បងបញ្ចូលពាក្យស្វែងរកផ្សេង ឬបន្ថែមប្រភេទថ្មី
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredList.map((item, index) => {
                  const isDeletingThis = deleteConfirmId === item.id;
                  const discount = item.discountPercentage ?? 0;

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        item.id === 'two_plus_two' || item.id === 'president_grant'
                          ? 'bg-gradient-to-br from-white via-blue-50/30 to-blue-100/20 dark:from-[#131f3b] dark:via-[#182647] dark:to-[#111c36] border-blue-500/40 shadow-xs'
                          : 'bg-white dark:bg-[#152445] border-zinc-200 dark:border-blue-900/40 hover:border-blue-500/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 border border-blue-300/40">
                            {index + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                                {item.nameKhmer}
                              </h4>
                              {item.id === 'two_plus_two' && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                                  ⭐ 2+2 Dual
                                </span>
                              )}
                              {item.id === 'president_grant' && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-purple-100 text-purple-900 border border-purple-300">
                                  👑 ប្រធាន
                                </span>
                              )}
                            </div>
                            {item.nameLatin && (
                              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">
                                {item.nameLatin}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Discount Badge */}
                        <div className="shrink-0 text-right">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-black border ${
                              item.badgeBg || 'bg-blue-100 border-blue-300'
                            } ${item.badgeText || 'text-blue-800'}`}
                          >
                            {discount === 100
                              ? '១០០% ឥតគិតថ្លៃ'
                              : discount === 0
                              ? '០% បង់ពេញ'
                              : `បញ្ចុះ ${discount}%`}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      {item.description && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      {/* Footer Info & Actions */}
                      <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 text-[11px]">
                        <span className="font-mono text-zinc-600 dark:text-zinc-400">
                          ID: <strong className="text-zinc-700 dark:text-zinc-300">{item.id}</strong>
                        </span>

                        {!isReadOnly && (
                          <div className="flex items-center gap-1">
                            {isDeletingThis ? (
                              <div className="flex items-center gap-1 animate-in fade-in duration-150">
                                <span className="text-[10.5px] text-rose-700 dark:text-rose-400 font-bold">
                                  លុបមែនទេ?
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(item.id)}
                                  className="px-2 py-0.5 rounded bg-rose-700 text-white font-bold text-[10.5px] hover:bg-rose-800 cursor-pointer"
                                >
                                  យល់ព្រម
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[10.5px] cursor-pointer"
                                >
                                  ទេ
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(item)}
                                  className="p-1.5 rounded-lg text-blue-700 dark:text-sky-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors cursor-pointer"
                                  title="កែសម្រួល (Edit)"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmId(item.id)}
                                  className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
                                  title="លុប (Delete)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0c1527] flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-700 dark:text-blue-400" />
            <span>ប្រភេទអាហារូបករណ៍ទាំងនេះនឹងត្រូវបានបង្ហាញក្នុងផ្ទាំងចុះឈ្មោះ និងការបង់ប្រាក់ថ្លៃសិក្សា</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold transition-colors cursor-pointer"
          >
            បិទ (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
