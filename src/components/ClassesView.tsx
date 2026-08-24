import React, { useState, useMemo } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Users,
  Sun,
  Sunset,
  Moon,
  Calendar,
  X,
  BookOpen,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  Info,
  Filter,
  Search,
  LayoutGrid,
  Table as TableIcon,
  Eye,
  GraduationCap,
  Building2,
  DoorOpen
} from 'lucide-react';
import { Classroom, Major, Teacher, Student, ShiftType, AcademicYearType } from '../types';
import { instituteService } from '../service/instituteService';
import { getShiftLabel } from '../utils/exportUtils';

interface ClassesViewProps {
  classes: Classroom[];
  majors: Major[];
  teachers: Teacher[];
  students: Student[];
  isAddModalOpen?: boolean;
  onCloseAddModal?: () => void;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  isReadOnly?: boolean;
}

export const ClassesView: React.FC<ClassesViewProps> = ({
  classes,
  majors,
  teachers,
  students,
  isAddModalOpen = false,
  onCloseAddModal,
  showToast,
  isReadOnly = false
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [search, setSearch] = useState('');
  const [selectedMajor, setSelectedMajor] = useState<string>('all');
  const [selectedShift, setSelectedShift] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [filterMode, setFilterMode] = useState<'all' | 'under10' | 'adequate'>('all');

  const [isModalOpen, setIsModalOpen] = useState(isAddModalOpen);
  const [editingClass, setEditingClass] = useState<Classroom | null>(null);

  // Form fields
  const [formClassCode, setFormClassCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formMajorId, setFormMajorId] = useState(majors[0]?.id || 'maj_pedagogy');
  const [formYear, setFormYear] = useState<AcademicYearType>('Year 1');
  const [formShift, setFormShift] = useState<ShiftType>('morning');
  const [formRoom, setFormRoom] = useState('បន្ទប់ A101');
  const [formAcademicYear, setFormAcademicYear] = useState('2025-2026');
  const [formTeacherId, setFormTeacherId] = useState(teachers[0]?.id || '');

  // Calculate under capacity classes (<10 students)
  const classStudentCounts = useMemo(() => {
    const map = new Map<string, number>();
    students.forEach((s) => {
      if (s.classId) {
        map.set(s.classId, (map.get(s.classId) || 0) + 1);
      }
    });
    return map;
  }, [students]);

  const underCapacityClasses = useMemo(() => {
    return classes
      .map((c) => ({
        cls: c,
        count: classStudentCounts.get(c.id) || 0
      }))
      .filter((item) => item.count < 10);
  }, [classes, classStudentCounts]);

  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      const studentCount = classStudentCounts.get(c.id) || 0;

      // Capacity filter
      if (filterMode === 'under10' && studentCount >= 10) return false;
      if (filterMode === 'adequate' && studentCount < 10) return false;

      // Dropdown filters
      if (selectedMajor !== 'all' && c.majorId !== selectedMajor) return false;
      if (selectedShift !== 'all' && c.shift !== selectedShift) return false;
      if (selectedYear !== 'all' && c.year !== selectedYear) return false;

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchName = c.name.toLowerCase().includes(q);
        const matchCode = c.classCode.toLowerCase().includes(q);
        const matchMajor = (c.majorName || '').toLowerCase().includes(q);
        const matchRoom = (c.room || '').toLowerCase().includes(q);
        const matchTeacher = (c.teacherName || '').toLowerCase().includes(q);
        const matchYear = (c.academicYear || '').toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchMajor && !matchRoom && !matchTeacher && !matchYear) {
          return false;
        }
      }

      return true;
    });
  }, [classes, filterMode, classStudentCounts, selectedMajor, selectedShift, selectedYear, search]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (search.trim()) count++;
    if (selectedMajor !== 'all') count++;
    if (selectedShift !== 'all') count++;
    if (selectedYear !== 'all') count++;
    if (filterMode !== 'all') count++;
    return count;
  }, [search, selectedMajor, selectedShift, selectedYear, filterMode]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedMajor('all');
    setSelectedShift('all');
    setSelectedYear('all');
    setFilterMode('all');
  };

  React.useEffect(() => {
    if (isAddModalOpen && !isReadOnly) {
      openAddModal();
    }
  }, [isAddModalOpen, isReadOnly]);

  const openAddModal = () => {
    if (isReadOnly) return;
    setEditingClass(null);
    setFormClassCode(`ED-Y1-${String(classes.length + 1)}`);
    setFormName('');
    setFormMajorId(majors[0]?.id || 'maj_pedagogy');
    setFormYear('Year 1');
    setFormShift('morning');
    setFormRoom('បន្ទប់ A101');
    setFormAcademicYear('2025-2026');
    setFormTeacherId(teachers[0]?.id || '');
    setIsModalOpen(true);
  };

  const openEditModal = (c: Classroom) => {
    setEditingClass(c);
    setFormClassCode(c.classCode);
    setFormName(c.name);
    setFormMajorId(c.majorId);
    setFormYear(c.year);
    setFormShift(c.shift);
    setFormRoom(c.room);
    setFormAcademicYear(c.academicYear);
    setFormTeacherId(c.teacherId || '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClass(null);
    if (onCloseAddModal) onCloseAddModal();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនអាចកែប្រែទិន្នន័យបានទេ (Read-Only Mode)!', 'info');
      return;
    }
    if (!formName.trim()) {
      showToast('សូមបញ្ចូលឈ្មោះថ្នាក់រៀន!', 'error');
      return;
    }

    const selectedMaj = majors.find((m) => m.id === formMajorId);
    const selectedTch = teachers.find((t) => t.id === formTeacherId);

    const classData: Classroom = {
      id: editingClass ? editingClass.id : `cls_${Date.now()}`,
      classCode: formClassCode || `CLS-${Date.now()}`,
      name: formName.trim(),
      majorId: formMajorId,
      majorName: selectedMaj?.nameKhmer || 'គរុកោសល្យភាសាចិន',
      year: formYear,
      shift: formShift,
      room: formRoom.trim(),
      academicYear: formAcademicYear.trim(),
      teacherId: formTeacherId || undefined,
      teacherName: selectedTch ? `សាស្ត្រាចារ្យ ${selectedTch.nameKhmer}` : undefined,
      createdAt: editingClass ? editingClass.createdAt : new Date().toISOString()
    };

    try {
      await instituteService.saveClass(classData);
      showToast(editingClass ? 'បានកែប្រែថ្នាក់រៀនជោគជ័យ!' : 'បានបង្កើតថ្នាក់រៀនថ្មីជោគជ័យ!', 'success');
      closeModal();
    } catch (e) {
      showToast('មិនអាចរក្សាទុកថ្នាក់រៀនបានទេ', 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនអាចលុបទិន្នន័យបានទេ (Read-Only Mode)!', 'info');
      return;
    }
    if (window.confirm(`តើអ្នកពិតជាចង់លុបថ្នាក់ "${name}" មែនទេ?`)) {
      try {
        await instituteService.deleteClass(id);
        showToast('បានលុបថ្នាក់រៀនជោគជ័យ!', 'info');
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
              <Layers className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            </span>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              បញ្ជីថ្នាក់រៀន (Classrooms & Batches)
            </h2>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 font-medium">
            គ្រប់គ្រងថ្នាក់រៀនតាមវេនសិក្សា ជំនាញ បន្ទប់រៀន និងតាមដានចំនួនសិស្សក្នុងថ្នាក់
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
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ បង្កើតថ្នាក់រៀនថ្មី</span>
            </button>
          )}
          {isReadOnly && (
            <span className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 font-bold text-xs">
              របៀបមើលព័ត៌មាន (Read-Only)
            </span>
          )}
        </div>
      </div>

      {/* Classroom Under-Capacity Alert Notification */}
      {underCapacityClasses.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/60 rounded-3xl p-5 shadow-xs transition-all">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-950 dark:text-amber-200 flex items-center gap-2">
                  <span>សារជូនដំណឹង: មានថ្នាក់រៀនចំនួន {underCapacityClasses.length} មិនទាន់គ្រប់ ១០ នាក់!</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-800/70 text-amber-900 dark:text-amber-100 text-[11px] font-mono font-bold">
                    {underCapacityClasses.length} ថ្នាក់
                  </span>
                </h3>
                <p className="text-xs text-amber-900 dark:text-amber-200 mt-1 font-medium leading-relaxed">
                  តាមគោលការណ៍វិទ្យាស្ថាន ថ្នាក់រៀននីមួយៗគប្បីមានសិស្សយ៉ាងហោចណាស់ ១០នាក់ ដើម្បីដំណើរការពេញលេញ។ សូមពិនិត្យថ្នាក់ដូចខាងក្រោម៖
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {underCapacityClasses.map((item) => (
                    <span
                      key={item.cls.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white dark:bg-[#182620] border border-amber-300 dark:border-amber-700/80 text-xs font-bold text-zinc-900 dark:text-zinc-100 shadow-2xs"
                    >
                      <span>{item.cls.name}</span>
                      <span className="text-amber-700 dark:text-amber-400 font-mono">
                        ({item.count}/10 នាក់ • ខ្វះ {10 - item.count})
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setFilterMode(filterMode === 'under10' ? 'all' : 'under10')}
              className="px-3 py-1.5 rounded-xl bg-amber-200 hover:bg-amber-300 dark:bg-amber-900/80 dark:hover:bg-amber-800 text-amber-950 dark:text-amber-100 font-bold text-xs inline-flex items-center gap-1.5 transition-colors shrink-0 self-start cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{filterMode === 'under10' ? 'បង្ហាញទាំងអស់' : 'មើលតែថ្នាក់ខ្វះសិស្ស'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Filters & Search Control */}
      <div className="bg-white dark:bg-[#131f1a] rounded-2xl p-4 border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative sm:col-span-2 md:col-span-4 lg:col-span-2">
            <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ស្វែងរកតាមឈ្មោះថ្នាក់, កូដ, បន្ទប់, សាស្ត្រាចារ្យ..."
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

          {/* Major Filter */}
          <div>
            <select
              value={selectedMajor}
              onChange={(e) => setSelectedMajor(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs text-zinc-800 dark:text-zinc-200 font-medium focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden cursor-pointer"
            >
              <option value="all">ជំនាញទាំងអស់ (All Majors)</option>
              {majors.map((m) => (
                <option key={m.id} value={m.id} className="dark:bg-[#131f1a]">
                  {m.nameKhmer}
                </option>
              ))}
            </select>
          </div>

          {/* Shift Filter */}
          <div>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs text-zinc-800 dark:text-zinc-200 font-medium focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden cursor-pointer"
            >
              <option value="all">វេនទាំងអស់ (All Shifts)</option>
              <option value="morning">វេនព្រឹក (Morning)</option>
              <option value="afternoon">វេនរសៀល (Afternoon)</option>
              <option value="evening">វេនយប់ (Evening)</option>
              <option value="weekend">ចុងសប្តាហ៍ (Weekend)</option>
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs text-zinc-800 dark:text-zinc-200 font-medium focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden cursor-pointer"
            >
              <option value="all">កម្រិតឆ្នាំទាំងអស់ (All Years)</option>
              <option value="Year 1">ឆ្នាំទី១ (Year 1)</option>
              <option value="Year 2">ឆ្នាំទី២ (Year 2)</option>
              <option value="Year 3">ឆ្នាំទី៣ (Year 3)</option>
              <option value="Year 4">ឆ្នាំទី៤ (Year 4)</option>
            </select>
          </div>
        </div>

        {/* Capacity Filter Tabs & Active filter count */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              ថ្នាក់ទាំងអស់ ({classes.length})
            </button>
            <button
              onClick={() => setFilterMode('under10')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                filterMode === 'under10'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>មិនទាន់គ្រប់ ១០នាក់ ({underCapacityClasses.length})</span>
            </button>
            <button
              onClick={() => setFilterMode('adequate')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                filterMode === 'adequate'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>គ្រប់ ១០នាក់ឡើង ({classes.length - underCapacityClasses.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {activeFiltersCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-medium text-xs inline-flex items-center gap-1 cursor-pointer transition-colors border border-zinc-200 dark:border-zinc-700"
              >
                <X className="w-3 h-3" />
                <span>Reset ({activeFiltersCount})</span>
              </button>
            )}
            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
              បង្ហាញ: {filteredClasses.length} ថ្នាក់
            </span>
          </div>
        </div>
      </div>

      {/* Main Content View: Table or Cards Grid */}
      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-[#131f1a] rounded-3xl border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-[#182620] border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">កូដ & ឈ្មោះថ្នាក់រៀន</th>
                  <th className="py-3.5 px-4">ជំនាញ & កម្រិតឆ្នាំ</th>
                  <th className="py-3.5 px-4">វេនសិក្សា</th>
                  <th className="py-3.5 px-4">បន្ទប់ & ឆ្នាំសិក្សា</th>
                  <th className="py-3.5 px-4">សាស្ត្រាចារ្យទទួលបន្ទុក</th>
                  <th className="py-3.5 px-4">ចំនួននិស្សិត & សមត្ថភាព</th>
                  <th className="py-3.5 px-4 text-right">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {filteredClasses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-500 dark:text-zinc-400 font-medium">
                      <Layers className="w-8 h-8 mx-auto mb-2 text-zinc-400 opacity-60" />
                      <p className="font-bold text-zinc-700 dark:text-zinc-300">ពុំមានទិន្នន័យថ្នាក់រៀនតាមតម្រងនេះទេ</p>
                      <p className="text-xs text-zinc-500 mt-0.5">សូមសាកល្បងផ្លាស់ប្តូរពាក្យស្វែងរក ឬសម្អាតតម្រង</p>
                    </td>
                  </tr>
                ) : (
                  filteredClasses.map((cls) => {
                    const studentCount = classStudentCounts.get(cls.id) || 0;
                    const isUnder10 = studentCount < 10;

                    return (
                      <tr
                        key={cls.id}
                        className={`hover:bg-zinc-50/80 dark:hover:bg-[#182620]/60 transition-colors ${
                          isUnder10 ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''
                        }`}
                      >
                        {/* Class Code & Name */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                                isUnder10
                                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300/50'
                                  : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300/50'
                              }`}
                            >
                              <Layers className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm block">
                                {cls.name}
                              </span>
                              <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                                {cls.classCode}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Major & Year */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100">{cls.majorName}</div>
                          <div className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-[10.5px]">
                            <GraduationCap className="w-3 h-3 text-emerald-600" />
                            <span>{cls.year}</span>
                          </div>
                        </td>

                        {/* Shift */}
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                            {cls.shift === 'morning' && <Sun className="w-3 h-3 text-amber-500" />}
                            {cls.shift === 'afternoon' && <Sunset className="w-3 h-3 text-orange-500" />}
                            {cls.shift === 'evening' && <Moon className="w-3 h-3 text-indigo-500" />}
                            {cls.shift === 'weekend' && <Calendar className="w-3 h-3 text-teal-500" />}
                            <span>{getShiftLabel(cls.shift)}</span>
                          </span>
                        </td>

                        {/* Room & Academic Year */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 text-zinc-800 dark:text-zinc-200 font-medium">
                            <DoorOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>{cls.room || '-'}</span>
                          </div>
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
                            ឆ្នាំសិក្សា {cls.academicYear}
                          </div>
                        </td>

                        {/* Teacher Advisor */}
                        <td className="py-3 px-4">
                          {cls.teacherName ? (
                            <div className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100 font-semibold">
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span className="text-emerald-800 dark:text-emerald-300">{cls.teacherName}</span>
                            </div>
                          ) : (
                            <span className="text-zinc-400 italic text-[11px]">មិនទាន់ចាត់តាំង</span>
                          )}
                        </td>

                        {/* Students Capacity / Status */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                              <Users
                                className={`w-3.5 h-3.5 ${
                                  isUnder10 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                                }`}
                              />
                              <span>{studentCount} នាក់</span>
                            </div>

                            {isUnder10 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 text-[10.5px] font-bold border border-amber-300/60 dark:border-amber-700/60">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                <span>ខ្វះ {10 - studentCount}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 text-[10.5px] font-bold border border-emerald-300/60 dark:border-emerald-700/60">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>គ្រប់ចំនួន</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(cls)}
                              title={isReadOnly ? 'ពិនិត្យព័ត៌មានថ្នាក់' : 'កែប្រែថ្នាក់'}
                              className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                            >
                              {isReadOnly ? <Eye className="w-4 h-4" /> : <Edit2 className="w-3.5 h-3.5" />}
                            </button>
                            {!isReadOnly && (
                              <button
                                onClick={() => handleDelete(cls.id, cls.name)}
                                title="លុបថ្នាក់រៀន"
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
        /* Class Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClasses.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-[#131f1a] rounded-3xl p-12 text-center border border-emerald-900/10 dark:border-emerald-800/30">
              <Layers className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
              <p className="font-bold text-zinc-700 dark:text-zinc-300 text-sm">ពុំមានទិន្នន័យថ្នាក់រៀនតាមតម្រងនេះទេ</p>
            </div>
          ) : (
            filteredClasses.map((cls) => {
              const studentCount = classStudentCounts.get(cls.id) || 0;
              const isUnder10 = studentCount < 10;

              return (
                <div
                  key={cls.id}
                  className={`bg-white dark:bg-[#131f1a] rounded-3xl p-5 border transition-all flex flex-col justify-between ${
                    isUnder10
                      ? 'border-amber-300/80 dark:border-amber-700/60 shadow-xs hover:border-amber-500'
                      : 'border-emerald-900/10 dark:border-emerald-800/30 shadow-xs hover:border-emerald-500/40 dark:hover:border-emerald-600/40'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                            isUnder10
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                              : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                          }`}
                        >
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{cls.name}</h3>
                          <span className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400 font-semibold">
                            {cls.classCode} • {cls.academicYear}
                          </span>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                        {cls.shift === 'morning' && <Sun className="w-3 h-3 text-amber-500" />}
                        {cls.shift === 'afternoon' && <Sunset className="w-3 h-3 text-orange-500" />}
                        {cls.shift === 'evening' && <Moon className="w-3 h-3 text-indigo-500" />}
                        {cls.shift === 'weekend' && <Calendar className="w-3 h-3 text-teal-500" />}
                        <span>{getShiftLabel(cls.shift)}</span>
                      </span>
                    </div>

                    {/* Under 10 Alert Banner inside Card */}
                    {isUnder10 && (
                      <div className="mb-3 p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800/70 flex items-center gap-2 text-xs">
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <div className="font-bold text-amber-900 dark:text-amber-200 text-[11.5px]">
                          មិនទាន់គ្រប់ ១០នាក់ (ខ្វះ {10 - studentCount} នាក់ទៀត)
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 text-xs py-3 border-y border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-600 dark:text-zinc-400 font-medium">ជំនាញ:</span>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">{cls.majorName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-600 dark:text-zinc-400 font-medium">កម្រិតឆ្នាំ:</span>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">{cls.year}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-600 dark:text-zinc-400 font-medium">បន្ទប់រៀន:</span>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">{cls.room}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-600 dark:text-zinc-400 font-medium">សាស្ត្រាចារ្យ:</span>
                        <span className="font-bold text-emerald-800 dark:text-emerald-300">{cls.teacherName || 'មិនទាន់ចាត់តាំង'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer info & Actions */}
                  <div className="mt-4 pt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <Users
                        className={`w-4 h-4 ${
                          isUnder10 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      />
                      <span className={isUnder10 ? 'text-amber-800 dark:text-amber-300' : 'text-zinc-800 dark:text-zinc-200'}>
                        {studentCount} នាក់
                      </span>
                      {isUnder10 ? (
                        <span className="text-[10.5px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-semibold">
                          ខ្វះ {10 - studentCount}
                        </span>
                      ) : (
                        <span className="text-[10.5px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold">
                          គ្រប់ចំនួន
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(cls)}
                        title={isReadOnly ? 'ពិនិត្យព័ត៌មានថ្នាក់' : 'កែប្រែថ្នាក់'}
                        className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                      >
                        {isReadOnly ? <Eye className="w-4 h-4" /> : <Edit2 className="w-3.5 h-3.5" />}
                      </button>
                      {!isReadOnly && (
                        <button
                          onClick={() => handleDelete(cls.id, cls.name)}
                          title="លុបថ្នាក់រៀន"
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131f1a] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-900/20 dark:border-emerald-800/50 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
                  {isReadOnly ? 'ព័ត៌មានថ្នាក់រៀន (Classroom Info)' : editingClass ? 'កែប្រែថ្នាក់រៀន' : 'បង្កើតថ្នាក់រៀនថ្មី'}
                </h3>
                {isReadOnly && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                    Read-Only
                  </span>
                )}
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">កូដថ្នាក់ (Code) *</label>
                <input
                  type="text"
                  required
                  disabled={isReadOnly}
                  value={formClassCode}
                  onChange={(e) => setFormClassCode(e.target.value)}
                  placeholder="ED-Y1-M1"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden font-mono disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">ឈ្មោះថ្នាក់រៀន *</label>
                <input
                  type="text"
                  required
                  disabled={isReadOnly}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="ថ្នាក់គរុកោសល្យ ឆ្នាំទី១ (ព្រឹក)"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">ជំនាញ (Major)</label>
                  <select
                    disabled={isReadOnly}
                    value={formMajorId}
                    onChange={(e) => setFormMajorId(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {majors.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nameKhmer}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">កម្រិតឆ្នាំ (Year)</label>
                  <select
                    disabled={isReadOnly}
                    value={formYear}
                    onChange={(e) => setFormYear(e.target.value as AcademicYearType)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <option value="Foundation">ឆ្នាំសិក្សាមូលដ្ឋាន (Foundation)</option>
                    <option value="Year 1">ឆ្នាំទី ១ (Year 1)</option>
                    <option value="Year 2">ឆ្នាំទី ២ (Year 2)</option>
                    <option value="Year 3">ឆ្នាំទី ៣ (Year 3)</option>
                    <option value="Year 4">ឆ្នាំទី ៤ (Year 4)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">វេនសិក្សា (Shift)</label>
                  <select
                    disabled={isReadOnly}
                    value={formShift}
                    onChange={(e) => setFormShift(e.target.value as ShiftType)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <option value="morning">វេនព្រឹក (Morning)</option>
                    <option value="afternoon">វេនរសៀល (Afternoon)</option>
                    <option value="evening">វេនយប់ (Evening)</option>
                    <option value="weekend">ចុងសប្តាហ៍ (Weekend)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">បន្ទប់រៀន (Room)</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    placeholder="បន្ទប់ A101"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">ឆ្នាំសិក្សា (Academic Year)</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={formAcademicYear}
                    onChange={(e) => setFormAcademicYear(e.target.value)}
                    placeholder="2025-2026"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">សាស្ត្រាចារ្យប្រចាំថ្នាក់</label>
                  <select
                    disabled={isReadOnly}
                    value={formTeacherId}
                    onChange={(e) => setFormTeacherId(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <option value="">-- មិនទាន់ចាត់តាំង --</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nameKhmer} ({t.teacherCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold transition-colors cursor-pointer"
                >
                  {isReadOnly ? 'បិទ' : 'បោះបង់'}
                </button>
                {!isReadOnly && (
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition-all shadow-xs cursor-pointer"
                  >
                    {editingClass ? 'រក្សាទុកការកែប្រែ' : 'បង្កើតថ្នាក់'}
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
