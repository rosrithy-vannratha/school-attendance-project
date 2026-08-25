import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  GraduationCap,
  X,
  Users,
  Layers,
  Search,
  LayoutGrid,
  Table as TableIcon,
  Eye,
  Clock,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { Major, Classroom, Student } from '../types';
import { instituteService } from '../service/instituteService';

interface MajorsViewProps {
  majors: Major[];
  classes: Classroom[];
  students: Student[];
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  isReadOnly?: boolean;
}

export const MajorsView: React.FC<MajorsViewProps> = ({
  majors,
  classes,
  students,
  showToast,
  isReadOnly = false
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMajor, setEditingMajor] = useState<Major | null>(null);

  // Pagination State
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [formCode, setFormCode] = useState('');
  const [formNameKhmer, setFormNameKhmer] = useState('');
  const [formNameLatin, setFormNameLatin] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formYears, setFormYears] = useState(4);

  // Filtered majors
  const filteredMajors = useMemo(() => {
    if (!search.trim()) return majors;
    const q = search.toLowerCase().trim();
    return majors.filter((m) => {
      const matchKhmer = m.nameKhmer.toLowerCase().includes(q);
      const matchLatin = (m.nameLatin || '').toLowerCase().includes(q);
      const matchCode = m.code.toLowerCase().includes(q);
      const matchDesc = (m.description || '').toLowerCase().includes(q);
      return matchKhmer || matchLatin || matchCode || matchDesc;
    });
  }, [majors, search]);

  // Reset page when search or pageSize changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, pageSize]);

  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(filteredMajors.length / pageSize));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedMajors = useMemo(() => {
    if (pageSize === -1) return filteredMajors;
    const start = (validPage - 1) * pageSize;
    return filteredMajors.slice(start, start + pageSize);
  }, [filteredMajors, validPage, pageSize]);

  const startIndex = filteredMajors.length === 0 ? 0 : pageSize === -1 ? 1 : (validPage - 1) * pageSize + 1;
  const endIndex = pageSize === -1 ? filteredMajors.length : Math.min(validPage * pageSize, filteredMajors.length);

  const openAddModal = () => {
    if (isReadOnly) return;
    setEditingMajor(null);
    setFormCode(`MAJ-${String(majors.length + 1)}`);
    setFormNameKhmer('');
    setFormNameLatin('');
    setFormDescription('');
    setFormYears(4);
    setIsModalOpen(true);
  };

  const openEditModal = (m: Major) => {
    setEditingMajor(m);
    setFormCode(m.code);
    setFormNameKhmer(m.nameKhmer);
    setFormNameLatin(m.nameLatin);
    setFormDescription(m.description || '');
    setFormYears(m.totalYears);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនអាចកែប្រែទិន្នន័យបានទេ (Read-Only Mode)!', 'info');
      return;
    }
    if (!formNameKhmer.trim()) {
      showToast('សូមបញ្ចូលឈ្មោះជំនាញ!', 'error');
      return;
    }

    const data: Major = {
      id: editingMajor ? editingMajor.id : `maj_${Date.now()}`,
      code: formCode.trim() || `MAJ-${Date.now()}`,
      nameKhmer: formNameKhmer.trim(),
      nameLatin: formNameLatin.trim(),
      description: formDescription.trim() || undefined,
      totalYears: Number(formYears) || 4
    };

    try {
      await instituteService.saveMajor(data);
      showToast(editingMajor ? 'បានកែប្រែជំនាញជោគជ័យ!' : 'បានបន្ថែមជំនាញថ្មីជោគជ័យ!', 'success');
      setIsModalOpen(false);
    } catch (e) {
      showToast('មិនអាចរក្សាទុកបានទេ', 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនអាចលុបទិន្នន័យបានទេ (Read-Only Mode)!', 'info');
      return;
    }
    if (window.confirm(`តើអ្នកពិតជាចង់លុបជំនាញ "${name}" មែនទេ?`)) {
      try {
        await instituteService.deleteMajor(id);
        showToast('បានលុបជំនាញជោគជ័យ!', 'info');
      } catch (e) {
        showToast('មិនអាចលុបបានទេ', 'error');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="bg-white dark:bg-[#131f1a] rounded-3xl p-6 border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-sm">
              <BookOpen className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            </span>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              ដេប៉ាតឺម៉ង់ & ជំនាញបណ្តុះបណ្តាល (Academic Majors)
            </h2>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 font-medium">
            កម្មវិធីបណ្តុះបណ្តាល និងឯកទេសភាសាចិនថ្នាក់បរិញ្ញាបត្រ (៤ ឆ្នាំ)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle (Table / Grid) */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/90 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-700/80">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-[#182620] text-emerald-800 dark:text-emerald-300 shadow-xs border border-zinc-200/60 dark:border-emerald-800/50'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
              title="ទិដ្ឋភាពតារាង (Table View)"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>តារាង (Table)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-[#182620] text-emerald-800 dark:text-emerald-300 shadow-xs border border-zinc-200/60 dark:border-emerald-800/50'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
              title="ទិដ្ឋភាពកាត (Grid / Card View)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>កាត (Cards)</span>
            </button>
          </div>

          {!isReadOnly && (
            <button
              onClick={openAddModal}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer self-start md:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>+ បន្ថែមជំនាញថ្មី</span>
            </button>
          )}
          {isReadOnly && (
            <span className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 font-bold text-xs">
              របៀបមើលព័ត៌មាន (Read-Only)
            </span>
          )}
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white dark:bg-[#131f1a] rounded-2xl p-4 border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ស្វែងរកតាមឈ្មោះជំនាញ, កូដ, ឈ្មោះឡាតាំង..."
            className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-hidden transition-all placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {search && (
            <button
              onClick={() => setSearch('')}
              className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-medium text-xs inline-flex items-center gap-1 cursor-pointer transition-colors border border-zinc-200 dark:border-zinc-700"
            >
              <X className="w-3 h-3" />
              <span>Reset Search</span>
            </button>
          )}
          <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
            បង្ហាញ: {filteredMajors.length} / {majors.length} ជំនាញ
          </span>
        </div>
      </div>

      {/* Main Content: Table or Grid */}
      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-[#131f1a] rounded-3xl border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-[#182620] border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">កូដ & ឈ្មោះជំនាញបណ្តុះបណ្តាល</th>
                  <th className="py-3.5 px-4">ឈ្មោះជាឡាតាំង (Latin Name)</th>
                  <th className="py-3.5 px-4 text-center">រយៈពេលសិក្សា</th>
                  <th className="py-3.5 px-4 text-center">ចំនួនថ្នាក់</th>
                  <th className="py-3.5 px-4 text-center">ចំនួននិស្សិត</th>
                  <th className="py-3.5 px-4">ការពិពណ៌នា / គោលបំណង</th>
                  <th className="py-3.5 px-4 text-right">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {filteredMajors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-500 dark:text-zinc-400 font-medium">
                      <BookOpen className="w-8 h-8 mx-auto mb-2 text-zinc-400 opacity-60" />
                      <p className="font-bold text-zinc-700 dark:text-zinc-300">ពុំមានទិន្នន័យជំនាញតាមការស្វែងរកទេ</p>
                      <p className="text-xs text-zinc-500 mt-0.5">សូមសាកល្បងបញ្ចូលពាក្យគន្លឹះផ្សេងទៀត</p>
                    </td>
                  </tr>
                ) : (
                  paginatedMajors.map((maj) => {
                    const classCount = classes.filter((c) => c.majorId === maj.id).length;
                    const studentCount = students.filter((s) => s.majorId === maj.id).length;

                    return (
                      <tr
                        key={maj.id}
                        className="hover:bg-zinc-50/80 dark:hover:bg-[#182620]/60 transition-colors"
                      >
                        {/* Code & Name Khmer */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold shrink-0 border border-emerald-300/50">
                              <GraduationCap className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                            </div>
                            <div>
                              <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm block">
                                {maj.nameKhmer}
                              </span>
                              <span className="inline-block font-mono text-[10.5px] font-bold px-2 py-0.5 mt-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                                {maj.code}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Name Latin */}
                        <td className="py-3.5 px-4 font-medium text-zinc-700 dark:text-zinc-300">
                          {maj.nameLatin || '-'}
                        </td>

                        {/* Duration */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold text-[11px]">
                            <Clock className="w-3 h-3 text-emerald-600" />
                            <span>{maj.totalYears || 4} ឆ្នាំ</span>
                          </span>
                        </td>

                        {/* Classes Count */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5 font-bold text-zinc-800 dark:text-zinc-200">
                            <Layers className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                            <span>{classCount} ថ្នាក់</span>
                          </div>
                        </td>

                        {/* Students Count */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-300">
                            <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>{studentCount} នាក់</span>
                          </div>
                        </td>

                        {/* Description */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="text-zinc-600 dark:text-zinc-400 text-xs line-clamp-2 leading-relaxed font-normal">
                            {maj.description || 'កម្មវិធីសិក្សាស្តង់ដារវិទ្យាស្ថានគរុកោសល្យភាសាចិន'}
                          </p>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(maj)}
                              title={isReadOnly ? 'ពិនិត្យព័ត៌មានជំនាញ' : 'កែប្រែជំនាញ'}
                              className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                            >
                              {isReadOnly ? <Eye className="w-4 h-4" /> : <Edit2 className="w-3.5 h-3.5" />}
                            </button>
                            {!isReadOnly && (
                              <button
                                onClick={() => handleDelete(maj.id, maj.nameKhmer)}
                                title="លុបជំនាញ"
                                className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Majors Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredMajors.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-[#131f1a] rounded-3xl p-12 text-center border border-emerald-900/10 dark:border-emerald-800/30">
              <BookOpen className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
              <p className="font-bold text-zinc-700 dark:text-zinc-300 text-sm">ពុំមានទិន្នន័យជំនាញតាមការស្វែងរកទេ</p>
            </div>
          ) : (
            paginatedMajors.map((maj) => {
              const classCount = classes.filter((c) => c.majorId === maj.id).length;
              const studentCount = students.filter((s) => s.majorId === maj.id).length;

              return (
                <div
                  key={maj.id}
                  className="bg-white dark:bg-[#131f1a] rounded-3xl p-6 border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs hover:border-emerald-500/40 dark:hover:border-emerald-600/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold">
                          <GraduationCap className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">{maj.nameKhmer}</h3>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">{maj.nameLatin}</p>
                        </div>
                      </div>

                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                        {maj.code}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed py-3 border-y border-zinc-100 dark:border-zinc-800">
                      {maj.description || 'កម្មវិធីសិក្សាស្តង់ដារវិទ្យាស្ថានគរុកោសល្យភាសាចិនក្នុងតំបន់'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                        <span>{classCount} ថ្នាក់</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>{studentCount} និស្សិត</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(maj)}
                        title={isReadOnly ? 'ពិនិត្យព័ត៌មានជំនាញ' : 'កែប្រែជំនាញ'}
                        className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                      >
                        {isReadOnly ? <Eye className="w-4 h-4" /> : <Edit2 className="w-3.5 h-3.5" />}
                      </button>
                      {!isReadOnly && (
                        <button
                          onClick={() => handleDelete(maj.id, maj.nameKhmer)}
                          className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Majors Pagination Controls */}
      {filteredMajors.length > 0 && (
        <div className="bg-white dark:bg-[#131f1a] rounded-2xl p-4 border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
            <span>
              កំពុងបង្ហាញ <strong className="text-zinc-900 dark:text-zinc-100 font-bold">{startIndex} - {endIndex}</strong> នៃសរុប <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{filteredMajors.length}</strong> ជំនាញ
            </span>

            <div className="flex items-center gap-1.5 pl-3 border-l border-zinc-200 dark:border-zinc-800">
              <span className="text-[11px]">ក្នុងមួយទំព័រ:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
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

          {pageSize !== -1 && totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={validPage === 1}
                className="p-1.5 rounded-lg bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-50 dark:hover:bg-emerald-950/60 cursor-pointer transition-colors"
                title="ទំព័រដំបូងបង្អស់ (First Page)"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={validPage === 1}
                className="p-1.5 rounded-lg bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-50 dark:hover:bg-emerald-950/60 cursor-pointer transition-colors"
                title="ទំព័រមុន (Previous Page)"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="px-3 py-1 font-bold text-zinc-800 dark:text-zinc-200">
                ទំព័រ {validPage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={validPage === totalPages}
                className="p-1.5 rounded-lg bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-50 dark:hover:bg-emerald-950/60 cursor-pointer transition-colors"
                title="ទំព័របន្ទាប់ (Next Page)"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={validPage === totalPages}
                className="p-1.5 rounded-lg bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-50 dark:hover:bg-emerald-950/60 cursor-pointer transition-colors"
                title="ទំព័រចុងក្រោយ (Last Page)"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131f1a] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-900/20 dark:border-emerald-800/50 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
                  {isReadOnly ? 'ព័ត៌មានជំនាញ (Major Info)' : editingMajor ? 'កែប្រែជំនាញ' : 'បន្ថែមជំនាញថ្មី'}
                </h3>
                {isReadOnly && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                    Read-Only
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">កូដជំនាញ (Code) *</label>
                <input
                  type="text"
                  required
                  disabled={isReadOnly}
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="EDU-CN"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden font-mono disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">ឈ្មោះខ្មែរ (Name Khmer) *</label>
                <input
                  type="text"
                  required
                  disabled={isReadOnly}
                  value={formNameKhmer}
                  onChange={(e) => setFormNameKhmer(e.target.value)}
                  placeholder="គរុកោសល្យភាសាចិន"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">ឈ្មោះឡាតាំង (Name Latin)</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={formNameLatin}
                  onChange={(e) => setFormNameLatin(e.target.value)}
                  placeholder="Chinese Language Pedagogy"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">ការពិពណ៌នា</label>
                <textarea
                  rows={3}
                  disabled={isReadOnly}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="គោលបំណង និងការបណ្តុះបណ្តាល..."
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden resize-none disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold cursor-pointer transition-colors border border-zinc-200 dark:border-zinc-700"
                >
                  {isReadOnly ? 'បិទ (Close)' : 'បោះបង់'}
                </button>
                {!isReadOnly && (
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer transition-colors shadow-sm"
                  >
                    រក្សាទុក
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

