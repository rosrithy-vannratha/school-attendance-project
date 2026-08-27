import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Search,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Calendar,
  Layers,
  BookOpen,
  Users
} from 'lucide-react';
import { GenerationItem, Classroom, Student } from '../types';
import { instituteService } from '../service/instituteService';

interface GenerationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  generations: GenerationItem[];
  classes?: Classroom[];
  students?: Student[];
  showToast?: (text: string, type?: 'success' | 'info' | 'error') => void;
  isReadOnly?: boolean;
}

export const GenerationsModal: React.FC<GenerationsModalProps> = ({
  isOpen,
  onClose,
  generations,
  classes = [],
  students = [],
  showToast,
  isReadOnly = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGen, setEditingGen] = useState<GenerationItem | null>(null);

  // Form fields
  const [code, setCode] = useState('');
  const [nameKhmer, setNameKhmer] = useState('');
  const [nameLatin, setNameLatin] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filtered generations
  const filteredGenerations = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return generations;
    return generations.filter(
      (g) =>
        g.nameKhmer.toLowerCase().includes(term) ||
        g.nameLatin.toLowerCase().includes(term) ||
        g.code.toLowerCase().includes(term) ||
        (g.academicYear && g.academicYear.toLowerCase().includes(term)) ||
        (g.description && g.description.toLowerCase().includes(term))
    );
  }, [generations, searchTerm]);

  const handleOpenAddForm = () => {
    setEditingGen(null);
    const nextIndex = generations.length + 1;
    const currentYear = new Date().getFullYear();
    setCode(`Gen ${nextIndex}`);
    setNameKhmer(`ជំនាន់ទី${nextIndex}`);
    setNameLatin(`Generation ${nextIndex}`);
    setStartYear(String(currentYear));
    setEndYear(String(currentYear + 4));
    setAcademicYear(`${currentYear}-${currentYear + 4}`);
    setDescription(`ជំនាន់ទី${nextIndex} កម្មវិធីបណ្តុះបណ្តាល ${currentYear}-${currentYear + 4}`);
    setErrorMsg('');
    setSuccessMsg('');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (g: GenerationItem) => {
    setEditingGen(g);
    setCode(g.code || '');
    setNameKhmer(g.nameKhmer || '');
    setNameLatin(g.nameLatin || '');
    setStartYear(g.startYear || '');
    setEndYear(g.endYear || '');
    setAcademicYear(g.academicYear || '');
    setDescription(g.description || '');
    setErrorMsg('');
    setSuccessMsg('');
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingGen(null);
    setErrorMsg('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameKhmer.trim()) {
      setErrorMsg('សូមបញ្ចូលឈ្មោះជំនាន់ជាភាសាខ្មែរ (ឧ. ជំនាន់ទី១)');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');
    try {
      const yearStr = academicYear.trim() || (startYear && endYear ? `${startYear}-${endYear}` : '');
      const itemToSave: GenerationItem = {
        id: editingGen ? editingGen.id : `gen_${Date.now()}`,
        code: code.trim() || `Gen ${generations.length + 1}`,
        nameKhmer: nameKhmer.trim(),
        nameLatin: nameLatin.trim() || nameKhmer.trim(),
        academicYear: yearStr,
        startYear: startYear.trim(),
        endYear: endYear.trim(),
        description: description.trim(),
        isDefault: editingGen ? editingGen.isDefault : false,
        updatedAt: new Date().toISOString(),
        createdAt: editingGen?.createdAt || new Date().toISOString()
      };

      await instituteService.saveGeneration(itemToSave);
      const msg = editingGen ? 'បានកែប្រែជំនាន់ដោយជោគជ័យ' : 'បានបង្កើតជំនាន់ថ្មីដោយជោគជ័យ';
      setSuccessMsg(msg);
      if (showToast) showToast(msg, 'success');
      setTimeout(() => setSuccessMsg(''), 3000);
      handleCloseForm();
    } catch (err: any) {
      console.error('Error saving generation:', err);
      const errTxt = err?.message || 'មានបញ្ហាក្នុងការរក្សាទុកជំនាន់';
      setErrorMsg(errTxt);
      if (showToast) showToast(errTxt, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (isReadOnly) {
      if (showToast) showToast('គណនីភ្ញៀវមិនអាចលុបទិន្នន័យបានទេ', 'info');
      return;
    }
    try {
      await instituteService.deleteGeneration(id);
      setDeleteConfirmId(null);
      const msg = 'បានលុបជំនាន់ដោយជោគជ័យ';
      setSuccessMsg(msg);
      if (showToast) showToast(msg, 'info');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      console.error('Error deleting generation:', err);
      const errTxt = err?.message || 'មិនអាចលុបជំនាន់បានទេ';
      setErrorMsg(errTxt);
      if (showToast) showToast(errTxt, 'error');
    }
  };

  const handleResetDefaults = async () => {
    if (isReadOnly) {
      if (showToast) showToast('គណនីភ្ញៀវមិនអាចកំណត់ទិន្នន័យបានទេ', 'info');
      return;
    }
    if (window.confirm('តើអ្នកពិតជាចង់កំណត់ជំនាន់ទៅទម្រង់ដើម (ជំនាន់ទី១ ដល់ ជំនាន់ទី៥) វិញមែនទេ?')) {
      try {
        await instituteService.resetGenerationsToDefault();
        const msg = 'បានកំណត់ជំនាន់ដើមវិញជោគជ័យ';
        setSuccessMsg(msg);
        if (showToast) showToast(msg, 'success');
        setTimeout(() => setSuccessMsg(''), 3000);
      } catch (err: any) {
        setErrorMsg('មានបញ្ហាក្នុងការកំណត់ទៅទម្រង់ដើម');
        if (showToast) showToast('មានបញ្ហាក្នុងការកំណត់ទៅទម្រង់ដើម', 'error');
      }
    }
  };

  // Count classes and students per generation
  const getStats = (genKhmer: string, genCode: string) => {
    const classCount = classes.filter(
      (c) => c.generation === genKhmer || c.generation === genCode || c.name?.includes(genKhmer)
    ).length;
    const studentCount = students.filter(
      (s) => s.generation === genKhmer || s.generation === genCode
    ).length;
    return { classCount, studentCount };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div
        id="generations-modal-container"
        className="bg-white dark:bg-[#111c38] w-full max-w-4xl rounded-3xl shadow-2xl border border-blue-900/20 dark:border-blue-800/40 overflow-hidden my-8 max-h-[90vh] flex flex-col transition-colors"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-blue-900/10 dark:border-blue-800/40 flex items-center justify-between bg-zinc-50/80 dark:bg-[#182645]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-black dark:text-white flex items-center gap-2">
                គ្រប់គ្រងជំនាន់សិក្សា (Generations & Batches)
                <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-mono">
                  {generations.length} ជំនាន់
                </span>
              </h2>
              <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                បង្កើត កែប្រែ លុប និងកំណត់ជំនាន់សិក្សាសម្រាប់ភ្ជាប់ជាមួយថ្នាក់រៀន និងនិស្សិត
              </p>
            </div>
          </div>
          <button
            id="close-generations-modal-btn"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-blue-950/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications */}
        {successMsg && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Toolbar */}
        <div className="p-6 pb-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              id="search-generations-input"
              type="text"
              placeholder="ស្វែងរកតាមឈ្មោះជំនាន់, កូដ, ឆ្នាំ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-[#182645] border border-zinc-200 dark:border-blue-900/40 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:border-blue-500 font-medium"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              id="reset-generations-defaults-btn"
              onClick={handleResetDefaults}
              title="កំណត់ទម្រង់ដើម"
              className="px-3 py-2 bg-zinc-100 dark:bg-[#182645] hover:bg-zinc-200 dark:hover:bg-blue-900/60 border border-zinc-200 dark:border-blue-900/40 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ទម្រង់ដើម</span>
            </button>
            <button
              id="add-generation-btn"
              onClick={handleOpenAddForm}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ បង្កើតជំនាន់ថ្មី</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 pt-2 overflow-y-auto flex-1 space-y-4">
          {/* Create / Edit Form Drawer */}
          {isFormOpen && (
            <div
              id="generation-form-card"
              className="p-5 rounded-2xl bg-blue-50/60 dark:bg-[#182645]/80 border border-blue-200 dark:border-blue-700/60 shadow-inner space-y-4 animate-in fade-in duration-200"
            >
              <div className="flex items-center justify-between pb-2 border-b border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-black text-sm">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>{editingGen ? 'កែប្រែព័ត៌មានជំនាន់ (Edit Generation)' : 'បង្កើតជំនាន់ថ្មី (New Generation)'}</span>
                </div>
                <button
                  onClick={handleCloseForm}
                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-black text-zinc-700 dark:text-zinc-300 mb-1">
                      ឈ្មោះជំនាន់ជាខ្មែរ *
                    </label>
                    <input
                      id="gen-form-name-khmer"
                      type="text"
                      required
                      placeholder="ឧ. ជំនាន់ទី១, ជំនាន់ទី៦"
                      value={nameKhmer}
                      onChange={(e) => setNameKhmer(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-[#111c38] border border-blue-300 dark:border-blue-800/80 rounded-xl text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-zinc-700 dark:text-zinc-300 mb-1">
                      ឈ្មោះជាឡាតាំង (Latin)
                    </label>
                    <input
                      id="gen-form-name-latin"
                      type="text"
                      placeholder="ឧ. Generation 1, Batch 2025"
                      value={nameLatin}
                      onChange={(e) => setNameLatin(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-[#111c38] border border-blue-300 dark:border-blue-800/80 rounded-xl text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-zinc-700 dark:text-zinc-300 mb-1">
                      កូដសម្គាល់ (Code)
                    </label>
                    <input
                      id="gen-form-code"
                      type="text"
                      placeholder="ឧ. Gen 1, Gen 2"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-[#111c38] border border-blue-300 dark:border-blue-800/80 rounded-xl text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-black text-zinc-700 dark:text-zinc-300 mb-1">
                      ឆ្នាំចាប់ផ្តើម (Start Year)
                    </label>
                    <input
                      id="gen-form-start-year"
                      type="text"
                      placeholder="ឧ. 2025"
                      value={startYear}
                      onChange={(e) => {
                        setStartYear(e.target.value);
                        if (e.target.value && endYear) {
                          setAcademicYear(`${e.target.value}-${endYear}`);
                        }
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-[#111c38] border border-blue-300 dark:border-blue-800/80 rounded-xl text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-zinc-700 dark:text-zinc-300 mb-1">
                      ឆ្នាំបញ្ចប់ (End Year)
                    </label>
                    <input
                      id="gen-form-end-year"
                      type="text"
                      placeholder="ឧ. 2029"
                      value={endYear}
                      onChange={(e) => {
                        setEndYear(e.target.value);
                        if (startYear && e.target.value) {
                          setAcademicYear(`${startYear}-${e.target.value}`);
                        }
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-[#111c38] border border-blue-300 dark:border-blue-800/80 rounded-xl text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-zinc-700 dark:text-zinc-300 mb-1">
                      ឆ្នាំសិក្សាសរុប (Academic Cycle)
                    </label>
                    <input
                      id="gen-form-academic-year"
                      type="text"
                      placeholder="ឧ. 2025-2029"
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-[#111c38] border border-blue-300 dark:border-blue-800/80 rounded-xl text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-zinc-700 dark:text-zinc-300 mb-1">
                    ការពិពណ៌នា / ចំណាំ
                  </label>
                  <input
                    id="gen-form-description"
                    type="text"
                    placeholder="ឧ. ជំនាន់ទី១ កម្មវិធីបណ្តុះបណ្តាល ២០២២-២០២៦"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#111c38] border border-blue-300 dark:border-blue-800/80 rounded-xl text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="px-4 py-2 bg-zinc-200 dark:bg-blue-950/80 hover:bg-zinc-300 dark:hover:bg-blue-900 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    បោះបង់ (Cancel)
                  </button>
                  <button
                    id="save-generation-submit-btn"
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? 'កំពុងរក្សាទុក...' : editingGen ? 'រក្សាទុកការកែប្រែ' : '+ បង្កើតជំនាន់'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Generations Table / List */}
          <div className="rounded-2xl border border-zinc-200 dark:border-blue-900/40 overflow-hidden bg-white dark:bg-[#111c38]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-zinc-100/90 dark:bg-[#182645] text-zinc-800 dark:text-zinc-200 font-bold uppercase text-[10.5px] border-b border-zinc-200 dark:border-blue-900/40">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">ល.រ</th>
                    <th className="py-3 px-4">ឈ្មោះជំនាន់ (Khmer)</th>
                    <th className="py-3 px-4">កូដ / ឡាតាំង</th>
                    <th className="py-3 px-4">ឆ្នាំសិក្សា</th>
                    <th className="py-3 px-4">ស្ថិតិថ្នាក់ & សិស្ស</th>
                    <th className="py-3 px-4">ការពិពណ៌នា</th>
                    <th className="py-3 px-4 text-right">សកម្មភាព</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/80 dark:divide-blue-900/30">
                  {filteredGenerations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-zinc-700 dark:text-zinc-300">
                        ពុំមានទិន្នន័យជំនាន់ដែលត្រូវនឹងការស្វែងរកឡើយ
                      </td>
                    </tr>
                  ) : (
                    filteredGenerations.map((g, idx) => {
                      const stats = getStats(g.nameKhmer, g.code);
                      return (
                        <tr
                          key={g.id}
                          className="hover:bg-blue-50/40 dark:hover:bg-[#182645]/60 transition-colors"
                        >
                          <td className="py-3 px-4 text-center font-bold text-zinc-700 dark:text-zinc-300 font-mono">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4 font-black text-black dark:text-white">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950/90 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
                                {g.nameKhmer}
                              </span>
                              {g.isDefault && (
                                <span className="text-[10px] text-zinc-700 dark:text-zinc-300 font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                                  Default
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-mono font-bold text-zinc-900 dark:text-zinc-200 text-xs">
                              {g.code}
                            </div>
                            <div className="text-[11px] text-zinc-700 dark:text-zinc-300">
                              {g.nameLatin}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-[#182645] border border-zinc-200 dark:border-blue-900/40 font-mono text-[11px] font-bold text-zinc-800 dark:text-zinc-200">
                              <Calendar className="w-3 h-3 text-blue-500" />
                              <span>{g.academicYear || (g.startYear ? `${g.startYear}-${g.endYear}` : '—')}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3 text-[11px]">
                              <span className="flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400">
                                <BookOpen className="w-3 h-3" />
                                {stats.classCount} ថ្នាក់
                              </span>
                              <span className="flex items-center gap-1 font-bold text-purple-600 dark:text-purple-400">
                                <Users className="w-3 h-3" />
                                {stats.studentCount} នាក់
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300 max-w-xs truncate text-[11px]">
                            {g.description || '—'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {deleteConfirmId === g.id ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                                  លុបមែនទេ?
                                </span>
                                <button
                                  onClick={() => handleDelete(g.id)}
                                  className="px-2 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-bold hover:bg-rose-500"
                                >
                                  យល់ព្រម
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="px-2 py-1 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-[10px] font-bold"
                                >
                                  ទេ
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  id={`edit-gen-${g.id}`}
                                  onClick={() => handleOpenEditForm(g)}
                                  className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/80 rounded-lg transition-colors cursor-pointer"
                                  title="កែប្រែ (Edit)"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  id={`delete-gen-${g.id}`}
                                  onClick={() => setDeleteConfirmId(g.id)}
                                  className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/80 rounded-lg transition-colors cursor-pointer"
                                  title="លុប (Delete)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
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

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-200 dark:border-blue-900/40 bg-zinc-50/80 dark:bg-[#182645]/80 flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-blue-500" />
            <span>
              ជំនាន់ដែលបានកំណត់ នឹងបង្ហាញដោយស្វ័យប្រវត្តិក្នងបញ្ជីជ្រើសរើសថ្នាក់រៀន និងចុះឈ្មោះនិស្សិត
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-200 dark:bg-blue-950 hover:bg-zinc-300 dark:hover:bg-blue-900 text-zinc-800 dark:text-zinc-200 rounded-xl font-bold transition-colors cursor-pointer"
          >
            បិទ (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
