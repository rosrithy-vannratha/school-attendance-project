import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  FileSpreadsheet,
  Download,
  Upload,
  Edit2,
  Trash2,
  Sun,
  Sunset,
  Moon,
  Calendar,
  X,
  CheckCircle,
  Phone,
  BookOpen,
  GraduationCap,
  Eye,
  Lock,
  Camera,
  Image as ImageIcon,
  AlertTriangle,
  UserCheck,
  LayoutGrid,
  Table as TableIcon,
  MapPin,
  TrendingUp,
  Award,
  CheckSquare,
  Square,
  ZoomIn,
  Sparkles,
  Layers,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { Student, Classroom, Major, ShiftType, AcademicYearType, StudentStatus, ShiftItem, ClassType } from '../types';
import { instituteService } from '../service/instituteService';
import { INITIAL_SHIFTS, CLASS_TYPE_OPTIONS } from '../data/initialData';
import {
  exportStudentsToExcel,
  downloadStudentTemplate,
  parseStudentExcel,
  getShiftLabel,
  getClassTypeLabel,
  getStatusLabel
} from '../utils/exportUtils';
import { ProfileImageViewerModal, ProfileViewTarget } from './ProfileImageViewerModal';
import { PromoteStudentsModal } from './PromoteStudentsModal';

interface StudentsViewProps {
  students: Student[];
  classes: Classroom[];
  majors: Major[];
  shifts?: ShiftItem[];
  isAddModalOpen?: boolean;
  onCloseAddModal?: () => void;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  isReadOnly?: boolean;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  classes,
  majors,
  shifts = INITIAL_SHIFTS,
  isAddModalOpen = false,
  onCloseAddModal,
  showToast,
  isReadOnly = false
}) => {
  const [search, setSearch] = useState('');
  const [selectedClassType, setSelectedClassType] = useState<string>('all');
  const [selectedShift, setSelectedShift] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMajor, setSelectedMajor] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // Fast Pagination State
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Multi-Selection State
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  // Promotion Modal State
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [studentsToPromote, setStudentsToPromote] = useState<Student[]>([]);

  // Profile Image Viewer Modal State
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [imageViewerTarget, setImageViewerTarget] = useState<ProfileViewTarget | null>(null);

  // Student Add / Edit Modal states
  const [isModalOpen, setIsModalOpen] = useState(isAddModalOpen);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Form states
  const [formStudentCode, setFormStudentCode] = useState('');
  const [formNameKhmer, setFormNameKhmer] = useState('');
  const [formNameLatin, setFormNameLatin] = useState('');
  const [formNameChinese, setFormNameChinese] = useState('');
  const [formGender, setFormGender] = useState<'male' | 'female'>('female');
  const [formDob, setFormDob] = useState('2004-01-01');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formClassType, setFormClassType] = useState<ClassType>('bachelor');
  const [formMajorId, setFormMajorId] = useState(majors[0]?.id || 'maj_pedagogy');
  const [formClassId, setFormClassId] = useState(classes[0]?.id || '');
  const [formShift, setFormShift] = useState<ShiftType>('morning');
  const [formYear, setFormYear] = useState<AcademicYearType>('Year 1');
  const [formStatus, setFormStatus] = useState<StudentStatus>('active');
  const [formGuardianPhone, setFormGuardianPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formPhotoUrl, setFormPhotoUrl] = useState<string | undefined>(undefined);

  // Sync external prop if passed
  React.useEffect(() => {
    if (isAddModalOpen) {
      openAddModal();
    }
  }, [isAddModalOpen]);

  const openAddModal = () => {
    setEditingStudent(null);
    setFormStudentCode(`ICI-2025-${String(students.length + 1).padStart(3, '0')}`);
    setFormNameKhmer('');
    setFormNameLatin('');
    setFormNameChinese('');
    setFormGender('female');
    setFormDob('2004-01-01');
    setFormPhone('');
    setFormEmail('');
    setFormClassType('bachelor');
    setFormMajorId(majors[0]?.id || 'maj_pedagogy');
    setFormClassId(classes[0]?.id || '');
    setFormShift('morning');
    setFormYear('Year 1');
    setFormStatus('active');
    setFormGuardianPhone('');
    setFormAddress('');
    setFormNotes('');
    setFormPhotoUrl(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (stu: Student) => {
    setEditingStudent(stu);
    setFormStudentCode(stu.studentCode);
    setFormNameKhmer(stu.nameKhmer);
    setFormNameLatin(stu.nameLatin);
    setFormNameChinese(stu.nameChinese || '');
    setFormGender(stu.gender);
    setFormDob(stu.dob || '2004-01-01');
    setFormPhone(stu.phone || '');
    setFormEmail(stu.email || '');
    setFormClassType(stu.classType || 'bachelor');
    setFormMajorId(stu.majorId);
    setFormClassId(stu.classId);
    setFormShift(stu.shift);
    setFormYear(stu.year);
    setFormStatus(stu.status || 'active');
    setFormGuardianPhone(stu.guardianPhone || '');
    setFormAddress(stu.address || '');
    setFormNotes(stu.notes || '');
    setFormPhotoUrl(stu.photoUrl || undefined);
    setIsModalOpen(true);
  };

  // Image viewer opener
  const handleOpenPhotoViewer = (stu: Student) => {
    setImageViewerTarget({
      nameKhmer: stu.nameKhmer,
      nameLatin: stu.nameLatin,
      nameChinese: stu.nameChinese,
      code: stu.studentCode,
      photoUrl: stu.photoUrl,
      gender: stu.gender,
      majorName: stu.majorName,
      className: stu.className,
      classType: stu.classType,
      shift: stu.shift,
      year: stu.year,
      roleOrStatus: stu.status
    });
    setIsImageViewerOpen(true);
  };

  // Selection handlers
  const handleToggleSelectStudent = (id: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllFiltered = (filteredList: Student[]) => {
    const next = new Set<string>();
    filteredList.forEach((s) => next.add(s.id));
    setSelectedStudentIds(next);
  };

  const handleClearSelection = () => {
    setSelectedStudentIds(new Set());
  };

  // Promotion triggers
  const handleOpenPromoteForSelected = () => {
    const selectedList = students.filter((s) => selectedStudentIds.has(s.id));
    if (selectedList.length === 0) {
      showToast('សូមជ្រើសរើសនិស្សិតយ៉ាងហោចណាស់ម្នាក់ដើម្បីតម្លើងកម្រិត!', 'error');
      return;
    }
    setStudentsToPromote(selectedList);
    setIsPromoteModalOpen(true);
  };

  const handleOpenPromoteForSingle = (stu: Student) => {
    setStudentsToPromote([stu]);
    setIsPromoteModalOpen(true);
  };

  const compressImageFile = (file: File, maxWidth = 350, maxHeight = 350, quality = 0.75): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            if (width > height) {
              if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
              }
            } else {
              if (height > maxHeight) {
                width = Math.round((width * maxHeight) / height);
                height = maxHeight;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL('image/jpeg', quality));
              return;
            }
          } catch {
            // fallback
          }
          resolve(e.target?.result as string);
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('សូមជ្រើសរើសឯកសាររូបភាព (JPG, PNG, WebP)!', 'error');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      showToast('ទំហំរូបភាពត្រូវតិចជាង 8MB', 'error');
      return;
    }

    try {
      const compressedDataUrl = await compressImageFile(file);
      if (compressedDataUrl) {
        setFormPhotoUrl(compressedDataUrl);
        showToast('បានផ្ទុកឡើងរូបថតជោគជ័យ!', 'success');
      }
    } catch (err) {
      console.warn('Error processing photo:', err);
      showToast('មិនអាចផ្ទុកឡើងរូបថតបានទេ', 'error');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
    if (onCloseAddModal) onCloseAddModal();
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedClassType('all');
    setSelectedShift('all');
    setSelectedClass('all');
    setSelectedYear('all');
    setSelectedMajor('all');
    setSelectedStatus('all');
  };

  const activeFiltersCount = [
    search.trim() !== '',
    selectedClassType !== 'all',
    selectedShift !== 'all',
    selectedClass !== 'all',
    selectedYear !== 'all',
    selectedMajor !== 'all',
    selectedStatus !== 'all'
  ].filter(Boolean).length;

  const handleDeleteAllStudents = async () => {
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនអាចលុបទិន្នន័យបានទេ (Read-Only Mode)!', 'info');
      return;
    }

    setIsDeletingAll(true);
    try {
      await instituteService.deleteAllStudents();
      showToast('បានលុបទិន្នន័យនិស្សិតទាំងអស់ដោយជោគជ័យ', 'success');
      setIsDeleteAllModalOpen(false);
      setSelectedStudentIds(new Set());
    } catch (err) {
      showToast('មិនអាចលុបទិន្នន័យបានទេ', 'error');
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនអាចកែប្រែទិន្នន័យបានទេ (Read-Only Mode)!', 'info');
      return;
    }

    const selectedMajorObj = majors.find((m) => m.id === formMajorId);
    const selectedClassObj = classes.find((c) => c.id === formClassId);

    const studentData: Student = {
      id: editingStudent ? editingStudent.id : `stu_${Date.now()}`,
      studentCode: formStudentCode.trim() || `ICI-${Date.now().toString().slice(-4)}`,
      nameKhmer: formNameKhmer.trim(),
      nameLatin: formNameLatin.trim(),
      nameChinese: formNameChinese.trim() || undefined,
      gender: formGender,
      dob: formDob,
      phone: formPhone.trim(),
      email: formEmail.trim() || undefined,
      classType: formClassType,
      majorId: formMajorId,
      majorName: selectedMajorObj ? selectedMajorObj.nameKhmer : 'គរុកោសល្យភាសាចិន',
      classId: formClassId,
      className: selectedClassObj ? selectedClassObj.name : 'ថ្នាក់គរុកោសល្យ',
      shift: formShift,
      year: formYear,
      status: formStatus,
      guardianPhone: formGuardianPhone.trim() || undefined,
      address: formAddress.trim() || undefined,
      notes: formNotes.trim() || undefined,
      photoUrl: formPhotoUrl,
      createdAt: editingStudent ? editingStudent.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await instituteService.saveStudent(studentData);
      showToast(editingStudent ? 'បានកែប្រែព័ត៌មាននិស្សិតជោគជ័យ!' : 'បានចុះឈ្មោះនិស្សិតថ្មីជោគជ័យ!', 'success');
      closeModal();
    } catch (err) {
      showToast('មិនអាចរក្សាទុកទិន្នន័យបានទេ', 'error');
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនអាចលុបទិន្នន័យបានទេ (Read-Only Mode)!', 'info');
      return;
    }

    if (window.confirm(`តើអ្នកពិតជាចង់លុបនិស្សិត "${name}" មែនទេ?`)) {
      try {
        await instituteService.deleteStudent(id);
        showToast('បានលុបនិស្សិតរួចរាល់', 'success');
        setSelectedStudentIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } catch (err) {
        showToast('មិនអាចលុបនិស្សិតបានទេ', 'error');
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនអាច Import ទិន្នន័យបានទេ', 'info');
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const importedStudents = await parseStudentExcel(file, majors, classes);
      if (importedStudents.length === 0) {
        showToast('ពុំមានទិន្នន័យត្រឹមត្រូវក្នុងឯកសារ Excel ទេ', 'error');
        setIsImporting(false);
        return;
      }

      await instituteService.saveStudentsBulk(importedStudents);
      showToast(`បានបញ្ចូលនិស្សិតចំនួន ${importedStudents.length} នាក់ដោយជោគជ័យ!`, 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'មានបញ្ហាក្នុងការ Import Excel', 'error');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  // Filtered Students Calculation
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // 1. Class Type filter
      if (selectedClassType !== 'all') {
        const stuType = s.classType || 'bachelor';
        if (stuType !== selectedClassType) return false;
      }

      // 2. Shift filter
      if (selectedShift !== 'all') {
        if (s.shift !== selectedShift) return false;
      }

      // 3. Class filter
      if (selectedClass !== 'all') {
        if (s.classId !== selectedClass) return false;
      }

      // 4. Major filter
      if (selectedMajor !== 'all') {
        if (s.majorId !== selectedMajor) return false;
      }

      // 5. Academic Year filter
      if (selectedYear !== 'all') {
        const studentYear = (s.year || '').toLowerCase();
        const targetYear = selectedYear.toLowerCase();
        if (!studentYear.includes(targetYear) && studentYear !== targetYear) return false;
      }

      // 6. Status filter
      if (selectedStatus !== 'all') {
        if (s.status !== selectedStatus) return false;
      }

      // 7. Search query
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchCode = (s.studentCode || '').toLowerCase().includes(q);
        const matchKhmer = (s.nameKhmer || '').toLowerCase().includes(q);
        const matchLatin = (s.nameLatin || '').toLowerCase().includes(q);
        const matchChinese = (s.nameChinese || '').toLowerCase().includes(q);
        const matchPhone = (s.phone || '').toLowerCase().includes(q);
        const matchGuardian = (s.guardianPhone || '').toLowerCase().includes(q);
        const matchClass = (s.className || '').toLowerCase().includes(q);
        const matchMajor = (s.majorName || '').toLowerCase().includes(q);

        if (!matchCode && !matchKhmer && !matchLatin && !matchChinese && !matchPhone && !matchGuardian && !matchClass && !matchMajor) {
          return false;
        }
      }

      return true;
    });
  }, [students, selectedClassType, selectedShift, selectedClass, selectedMajor, selectedYear, selectedStatus, search]);

  const allFilteredSelected = filteredStudents.length > 0 && filteredStudents.every((s) => selectedStudentIds.has(s.id));
  const someFilteredSelected = filteredStudents.some((s) => selectedStudentIds.has(s.id));

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedClassType, selectedShift, selectedClass, selectedMajor, selectedYear, selectedStatus, pageSize]);

  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedStudents = useMemo(() => {
    if (pageSize === -1) return filteredStudents;
    const start = (validCurrentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, validCurrentPage, pageSize]);

  const startRecordIndex = filteredStudents.length === 0 ? 0 : pageSize === -1 ? 1 : (validCurrentPage - 1) * pageSize + 1;
  const endRecordIndex = pageSize === -1 ? filteredStudents.length : Math.min(validCurrentPage * pageSize, filteredStudents.length);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="bg-white dark:bg-[#111c38] rounded-3xl p-6 border border-blue-200/60 dark:border-sky-500/20 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-sky-300 flex items-center justify-center font-bold text-sm border border-blue-200 dark:border-blue-800/60">
              <Users className="w-4 h-4 text-blue-700 dark:text-sky-400" />
            </span>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              បញ្ជីរាយនាមនិស្សិត (Students Directory)
            </h2>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            ទិន្នន័យសរុប {students.length} នាក់ • កំពុងបង្ហាញតាមតម្រង: {filteredStudents.length} នាក់
          </p>
        </div>

        {/* Actions & View Mode Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle (Table / Grid) */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/90 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-700/80">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-[#182645] text-blue-800 dark:text-sky-300 shadow-xs border border-zinc-200/60 dark:border-blue-800/50'
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
                  ? 'bg-white dark:bg-[#182645] text-blue-800 dark:text-sky-300 shadow-xs border border-zinc-200/60 dark:border-blue-800/50'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
              title="ទិដ្ឋភាពកាត (Grid / Card View)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>កាត (Cards)</span>
            </button>
          </div>

          {/* Delete All Data - Hidden in Guest mode */}
          {!isReadOnly && (
            <button
              onClick={() => setIsDeleteAllModalOpen(true)}
              disabled={students.length === 0}
              title="លុបទិន្នន័យនិស្សិតទាំងអស់"
              className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>លុបទិន្នន័យទាំងអស់</span>
            </button>
          )}

          {!isReadOnly ? (
            <label className="px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
              <span>{isImporting ? 'កំពុង Import...' : 'Import Excel'}</span>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isImporting}
              />
            </label>
          ) : null}

          {!isReadOnly ? (
            <>
              <button
                onClick={() => exportStudentsToExcel(filteredStudents)}
                className="px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-800 dark:text-sky-300 border border-blue-200 dark:border-blue-800/60 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                <span>Export Excel ({filteredStudents.length})</span>
              </button>

              <button
                onClick={downloadStudentTemplate}
                title="ទាញយកគំរូ Excel"
                className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => showToast('គណនីភ្ញៀវមិនមានសិទ្ធិទាញយកទិន្នន័យទេ (Read-Only Mode)!', 'info')}
              className="px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 text-zinc-400 dark:text-zinc-500 font-semibold text-xs inline-flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-700 cursor-not-allowed opacity-60"
              title="គណនីភ្ញៀវមិនអាច Export បានទេ"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export (Locked)</span>
            </button>
          )}

          {!isReadOnly ? (
            <button
              onClick={openAddModal}
              className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ បន្ថែមនិស្សិតថ្មី</span>
            </button>
          ) : (
            <div className="px-3 py-2 rounded-xl bg-amber-100 dark:bg-amber-950/50 border border-amber-300/50 dark:border-amber-800/50 text-amber-900 dark:text-amber-200 font-bold text-xs inline-flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>របៀបភ្ញៀវ (Read-Only)</span>
            </div>
          )}
        </div>
      </div>

      {/* Prominent Selection & Promotion Action Bar (Appears when 1+ students selected) */}
      {selectedStudentIds.size > 0 && (
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn border border-blue-500/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-sky-200 font-bold text-xs">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-xs text-white flex items-center gap-2">
                <span>បានជ្រើសរើស: <strong className="text-sky-300 underline font-mono text-sm">{selectedStudentIds.size} នាក់</strong></span>
                <span className="text-[11px] text-sky-200 font-normal">({selectedStudentIds.size} Students Selected)</span>
              </p>
              <p className="text-[11px] text-sky-200/80">
                អ្នកអាចតម្លើងកម្រិតឆ្នាំសិក្សា ផ្ទេរថ្នាក់ ឬប្តូរវេនសិក្សាជាក្រុម
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {!isReadOnly && (
              <button
                type="button"
                onClick={handleOpenPromoteForSelected}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-md transition-transform active:scale-95 cursor-pointer"
              >
                <TrendingUp className="w-4 h-4" />
                <span>តម្លើងកម្រិត / ផ្លាស់ប្តូរថ្នាក់ (Promote Selected)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSelectAllFiltered(filteredStudents)}
              className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              ជ្រើសរើសទាំងអស់ ({filteredStudents.length})
            </button>

            <button
              type="button"
              onClick={handleClearSelection}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sky-200 font-medium text-xs transition-colors cursor-pointer"
            >
              ដកជម្រើស (Clear)
            </button>
          </div>
        </div>
      )}

      {/* Filters & Search Control */}
      <div className="bg-white dark:bg-[#111c38] rounded-2xl p-4 border border-blue-200/60 dark:border-sky-500/20 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 text-xs">
          {/* Search */}
          <div className="relative sm:col-span-2 md:col-span-3 lg:col-span-2">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ស្វែងរកតាមឈ្មោះ, អត្តលេខ, ទូរសព្ទ..."
              className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-[#182645] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs text-zinc-800 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e55] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden transition-all"
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

          {/* Class Type Filter */}
          <div>
            <select
              value={selectedClassType}
              onChange={(e) => setSelectedClassType(e.target.value)}
              className="w-full px-2.5 py-2 bg-zinc-50 dark:bg-[#182645] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs text-zinc-700 dark:text-zinc-200 focus:bg-white dark:focus:bg-[#1c2e55] focus:border-blue-500 outline-hidden cursor-pointer"
            >
              <option value="all">កម្រិតទាំងអស់ (All Degrees)</option>
              {CLASS_TYPE_OPTIONS.map((ct) => (
                <option key={ct.id} value={ct.id} className="dark:bg-[#111c38]">
                  {ct.nameKhmer}
                </option>
              ))}
            </select>
          </div>

          {/* Major Filter */}
          <div>
            <select
              value={selectedMajor}
              onChange={(e) => setSelectedMajor(e.target.value)}
              className="w-full px-2.5 py-2 bg-zinc-50 dark:bg-[#182645] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs text-zinc-700 dark:text-zinc-200 focus:bg-white dark:focus:bg-[#1c2e55] focus:border-blue-500 outline-hidden cursor-pointer"
            >
              <option value="all">ជំនាញទាំងអស់ (All Majors)</option>
              {majors.map((m) => (
                <option key={m.id} value={m.id} className="dark:bg-[#111c38]">
                  {m.nameKhmer}
                </option>
              ))}
            </select>
          </div>

          {/* Class Filter */}
          <div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-2.5 py-2 bg-zinc-50 dark:bg-[#182645] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs text-zinc-700 dark:text-zinc-200 focus:bg-white dark:focus:bg-[#1c2e55] focus:border-blue-500 outline-hidden cursor-pointer"
            >
              <option value="all">ថ្នាក់ទាំងអស់ (All Classes)</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id} className="dark:bg-[#111c38]">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic Shift Filter */}
          <div>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="w-full px-2.5 py-2 bg-zinc-50 dark:bg-[#182645] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs text-zinc-700 dark:text-zinc-200 focus:bg-white dark:focus:bg-[#1c2e55] focus:border-blue-500 outline-hidden cursor-pointer"
            >
              <option value="all">វេនទាំងអស់ (All Shifts)</option>
              {shifts.map((s) => (
                <option key={s.id} value={s.code} className="dark:bg-[#111c38]">
                  {s.nameKhmer}
                </option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-2.5 py-2 bg-zinc-50 dark:bg-[#182645] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs text-zinc-700 dark:text-zinc-200 focus:bg-white dark:focus:bg-[#1c2e55] focus:border-blue-500 outline-hidden cursor-pointer"
            >
              <option value="all">ឆ្នាំទាំងអស់ (All Years)</option>
              <option value="Year 1">ឆ្នាំទី១ (Year 1)</option>
              <option value="Year 2">ឆ្នាំទី២ (Year 2)</option>
              <option value="Year 3">ឆ្នាំទី៣ (Year 3)</option>
              <option value="Year 4">ឆ្នាំទី៤ (Year 4)</option>
            </select>
          </div>
        </div>

        {/* Status Filter row and active filter count */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-600 dark:text-zinc-400">ស្ថានភាព:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1 bg-zinc-50 dark:bg-[#182645] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs text-zinc-700 dark:text-zinc-200 focus:border-blue-500 outline-hidden cursor-pointer"
            >
              <option value="all">ស្ថានភាពទាំងអស់ (All Status)</option>
              <option value="active">កំពុងរៀន (Active)</option>
              <option value="suspended">ព្យួរការសិក្សា (Suspended)</option>
              <option value="dropped">បោះបង់ (Dropped)</option>
              <option value="graduated">បញ្ចប់ការសិក្សា (Graduated)</option>
            </select>
          </div>

          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-blue-800 dark:text-sky-300 text-xs">
                <Filter className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                <span>
                  តម្រងសកម្ម: <strong className="font-semibold">{activeFiltersCount}</strong> លក្ខខណ្ឌ (រកឃើញ {filteredStudents.length} នាក់)
                </span>
              </div>
              <button
                onClick={handleResetFilters}
                className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-medium text-xs inline-flex items-center gap-1 cursor-pointer transition-colors"
              >
                <X className="w-3 h-3" />
                <span>សម្អាតតម្រង (Reset)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content View: Table or Cards Grid */}
      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-[#111c38] rounded-3xl border border-blue-200/60 dark:border-sky-500/20 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-[#182645] border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  {/* Select All Checkbox Column */}
                  <th className="py-3.5 px-3 w-10 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        if (allFilteredSelected) {
                          handleClearSelection();
                        } else {
                          handleSelectAllFiltered(filteredStudents);
                        }
                      }}
                      className="p-1 rounded-md text-blue-700 dark:text-sky-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 cursor-pointer"
                      title={allFilteredSelected ? 'ដកជម្រើសទាំងអស់' : 'ជ្រើសរើសទាំងអស់'}
                    >
                      {allFilteredSelected ? (
                        <CheckSquare className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                      ) : (
                        <Square className="w-4 h-4 text-zinc-400" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-3">អត្តលេខ & រូបថត</th>
                  <th className="py-3.5 px-4">ឈ្មោះនិស្សិត (ខ្មែរ / Chinese / Latin)</th>
                  <th className="py-3.5 px-3">កម្រិត & ជំនាញ</th>
                  <th className="py-3.5 px-3">ថ្នាក់ & វេនសិក្សា</th>
                  <th className="py-3.5 px-3">ឆ្នាំសិក្សា</th>
                  <th className="py-3.5 px-3">
                    <span className="flex items-center gap-1">
                      <span>ទូរសព្ទ</span>
                      {isReadOnly && <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold lowercase">🔒(Blur)</span>}
                    </span>
                  </th>
                  <th className="py-3.5 px-3">ស្ថានភាព</th>
                  <th className="py-3.5 px-4 text-right">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-zinc-400">
                      <Users className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
                      <p className="font-bold text-zinc-700 dark:text-zinc-200">ពុំមានទិន្នន័យនិស្សិតទេ</p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        សូមសាកល្បងផ្លាស់ប្តូរលក្ខខណ្ឌ Filter ឬបន្ថែមនិស្សិតថ្មី
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedStudents.map((stu) => {
                    const isSelected = selectedStudentIds.has(stu.id);

                    return (
                      <tr
                        key={stu.id}
                        className={`transition-colors ${
                          isSelected
                            ? 'bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-100/60 dark:hover:bg-blue-900/50'
                            : 'hover:bg-blue-50/30 dark:hover:bg-[#182645]/50'
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleSelectStudent(stu.id)}
                            className="p-1 rounded-md text-blue-700 dark:text-sky-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                            ) : (
                              <Square className="w-4 h-4 text-zinc-300 dark:text-zinc-600" />
                            )}
                          </button>
                        </td>

                        {/* Student ID & Clickable Photo */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            {/* Profile Picture (Click to View) */}
                            <button
                              type="button"
                              onClick={() => handleOpenPhotoViewer(stu)}
                              className="relative group w-10 h-10 rounded-xl overflow-hidden border border-blue-400/40 dark:border-sky-500/40 shadow-xs shrink-0 cursor-pointer focus:outline-hidden"
                              title="ចុចដើម្បីមើលរូបថតពេញទំហំ (Click to View Full Photo)"
                            >
                              {stu.photoUrl ? (
                                <img
                                  src={stu.photoUrl}
                                  alt={stu.nameKhmer}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div
                                  className={`w-full h-full flex items-center justify-center font-bold text-xs ${
                                    stu.gender === 'female'
                                      ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200'
                                      : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200'
                                  }`}
                                >
                                  {(stu.nameKhmer || stu.nameLatin || 'S').charAt(0)}
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                <ZoomIn className="w-3.5 h-3.5" />
                              </div>
                            </button>

                            <div>
                              <div className="font-mono font-bold text-blue-700 dark:text-sky-400 text-xs">
                                {stu.studentCode}
                              </div>
                              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                                {stu.gender === 'female' ? 'ស្រី (F)' : 'ប្រុស (M)'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Name */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm">
                              {stu.nameKhmer}
                            </span>
                            {stu.nameChinese && (
                              <span className="text-[11px] font-bold text-blue-800 dark:text-sky-300 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded-md border border-blue-200/60 dark:border-blue-800/40">
                                {stu.nameChinese}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                            {stu.nameLatin || '-'}
                          </div>
                        </td>

                        {/* Class Type & Major */}
                        <td className="py-3 px-3">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-sky-300 font-bold text-[10px] border border-blue-200 dark:border-blue-800/50 mb-1">
                            {getClassTypeLabel(stu.classType)}
                          </span>
                          <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                            {stu.majorName || 'គរុកោសល្យភាសាចិន'}
                          </div>
                        </td>

                        {/* Class & Shift */}
                        <td className="py-3 px-3">
                          <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            {stu.className || '-'}
                          </div>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium text-[10px] mt-0.5">
                            {getShiftLabel(stu.shift)}
                          </span>
                        </td>

                        {/* Year */}
                        <td className="py-3 px-3">
                          <span className="font-bold text-zinc-800 dark:text-zinc-200">
                            {stu.year}
                          </span>
                        </td>

                        {/* Contact */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1 text-zinc-800 dark:text-zinc-200 font-medium">
                            <Phone className="w-3 h-3 text-blue-600 dark:text-sky-400 shrink-0" />
                            <span className={isReadOnly ? 'filter blur-[5px] select-none pointer-events-none opacity-70 font-mono' : ''}>
                              {stu.phone || '-'}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              stu.status === 'active'
                                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50'
                                : stu.status === 'suspended'
                                ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50'
                                : stu.status === 'graduated'
                                ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
                            }`}
                          >
                            {getStatusLabel(stu.status)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Promote single student */}
                            {!isReadOnly && (
                              <button
                                type="button"
                                onClick={() => handleOpenPromoteForSingle(stu)}
                                className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 cursor-pointer transition-colors border border-amber-200 dark:border-amber-800/40"
                                title="តម្លើងកម្រិត / ផ្លាស់ប្តូរថ្នាក់ (Promote Student)"
                              >
                                <TrendingUp className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                              </button>
                            )}

                            <button
                              onClick={() => openEditModal(stu)}
                              className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 cursor-pointer transition-colors border border-zinc-200 dark:border-zinc-700"
                              title={isReadOnly ? 'មើលព័ត៌មាន' : 'កែប្រែ'}
                            >
                              {isReadOnly ? <Eye className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
                            </button>
                            {!isReadOnly && (
                              <button
                                onClick={() => handleDeleteStudent(stu.id, stu.nameKhmer)}
                                className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer transition-colors"
                                title="លុប"
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
        /* Students Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-[#111c38] rounded-3xl p-12 text-center text-zinc-400 border border-blue-200/60 dark:border-sky-500/20">
              <Users className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
              <p className="font-bold text-zinc-700 dark:text-zinc-200">ពុំមានទិន្នន័យនិស្សិតទេ</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
                សូមសាកល្បងផ្លាស់ប្តូរលក្ខខណ្ឌ Filter ឬបន្ថែម/Import និស្សិត
              </p>
            </div>
          ) : (
            paginatedStudents.map((stu) => {
              const isSelected = selectedStudentIds.has(stu.id);

              return (
                <div
                  key={stu.id}
                  className={`rounded-3xl p-5 border shadow-xs transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 shadow-md ring-1 ring-blue-500/30'
                      : 'bg-white dark:bg-[#111c38] border-blue-200/60 dark:border-sky-500/20 hover:border-blue-400 dark:hover:border-sky-500'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        {/* Clickable Profile Picture */}
                        <button
                          type="button"
                          onClick={() => handleOpenPhotoViewer(stu)}
                          className="relative group w-12 h-12 rounded-2xl overflow-hidden border-2 border-blue-400/50 dark:border-sky-500/50 shadow-xs shrink-0 cursor-pointer focus:outline-hidden"
                          title="ចុចដើម្បីមើលរូបថតពេញទំហំ (Click to View Photo)"
                        >
                          {stu.photoUrl ? (
                            <img
                              src={stu.photoUrl}
                              alt={stu.nameKhmer}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div
                              className={`w-full h-full flex items-center justify-center font-bold text-sm ${
                                stu.gender === 'female'
                                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200'
                                  : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200'
                              }`}
                            >
                              {(stu.nameKhmer || stu.nameLatin || 'S').charAt(0)}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                            <ZoomIn className="w-4 h-4" />
                          </div>
                        </button>

                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{stu.nameKhmer}</h3>
                            {stu.nameChinese && (
                              <span className="text-[11px] font-bold text-blue-800 dark:text-sky-300 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.2 rounded-md">
                                {stu.nameChinese}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{stu.nameLatin || '-'}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[11px] font-bold text-blue-700 dark:text-sky-400">{stu.studentCode}</span>
                            <span className="text-[10px] text-zinc-400">• {stu.gender === 'female' ? 'ស្រី' : 'ប្រុស'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Checkbox */}
                      <button
                        type="button"
                        onClick={() => handleToggleSelectStudent(stu.id)}
                        className="p-1 rounded-md text-blue-700 dark:text-sky-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 cursor-pointer"
                        title={isSelected ? 'ដកជម្រើស' : 'ជ្រើសរើស'}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-blue-600 dark:text-sky-400" />
                        ) : (
                          <Square className="w-5 h-5 text-zinc-300 dark:text-zinc-600" />
                        )}
                      </button>
                    </div>

                    <div className="space-y-2 py-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                      {/* Class Type & Major */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-sky-300 font-bold">
                          {getClassTypeLabel(stu.classType)}
                        </span>
                        <span className="text-zinc-700 dark:text-zinc-300 font-semibold truncate">
                          {stu.majorName}
                        </span>
                      </div>

                      {/* Class & Shift */}
                      <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400 text-xs">
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                          <span>ថ្នាក់: {stu.className}</span>
                        </div>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">{stu.year}</span>
                      </div>

                      {/* Shift Badge & Phone */}
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px] font-medium">
                          {getShiftLabel(stu.shift)}
                        </span>
                        <span className="font-mono text-zinc-600 dark:text-zinc-400 text-[11px]">
                          {stu.phone || '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        stu.status === 'active'
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                          : stu.status === 'suspended'
                          ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                          : stu.status === 'graduated'
                          ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {getStatusLabel(stu.status)}
                    </span>

                    <div className="flex items-center gap-1">
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => handleOpenPromoteForSingle(stu)}
                          className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-[11px] font-bold inline-flex items-center gap-1 border border-amber-200 dark:border-amber-800/40 cursor-pointer"
                          title="តម្លើងកម្រិត"
                        >
                          <TrendingUp className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          <span>តម្លើង</span>
                        </button>
                      )}

                      <button
                        onClick={() => openEditModal(stu)}
                        className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 cursor-pointer transition-colors"
                        title={isReadOnly ? 'មើល' : 'កែប្រែ'}
                      >
                        {isReadOnly ? <Eye className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
                      </button>
                      {!isReadOnly && (
                        <button
                          onClick={() => handleDeleteStudent(stu.id, stu.nameKhmer)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer transition-colors"
                          title="លុប"
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

      {/* Pagination Controls */}
      {filteredStudents.length > 0 && (
        <div className="bg-white dark:bg-[#111c38] rounded-2xl p-4 border border-blue-200/60 dark:border-sky-500/20 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          {/* Record Count Range */}
          <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
            <span>
              កំពុងបង្ហាញ <strong className="text-zinc-900 dark:text-zinc-100 font-bold">{startRecordIndex} - {endRecordIndex}</strong> នៃសរុប <strong className="text-blue-700 dark:text-sky-400 font-bold">{filteredStudents.length}</strong> នាក់
            </span>

            {/* Page Size Selector */}
            <div className="flex items-center gap-1.5 pl-3 border-l border-zinc-200 dark:border-zinc-800">
              <span className="text-[11px]">ក្នុងមួយទំព័រ:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 bg-zinc-50 dark:bg-[#182645] border border-zinc-200 dark:border-zinc-700/80 rounded-lg text-xs text-zinc-800 dark:text-zinc-200 font-bold focus:border-blue-500 outline-hidden cursor-pointer"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={-1}>ទាំងអស់ (All)</option>
              </select>
            </div>
          </div>

          {/* Page Navigation Buttons (only if not 'All') */}
          {pageSize !== -1 && totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={validCurrentPage === 1}
                className="p-1.5 rounded-lg bg-zinc-50 dark:bg-[#182645] border border-zinc-200 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-50 dark:hover:bg-blue-950/60 cursor-pointer transition-colors"
                title="ទំព័រដំបូងបង្អស់ (First Page)"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={validCurrentPage === 1}
                className="p-1.5 rounded-lg bg-zinc-50 dark:bg-[#182645] border border-zinc-200 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-50 dark:hover:bg-blue-950/60 cursor-pointer transition-colors"
                title="ទំព័រមុន (Previous Page)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="px-3 py-1 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 rounded-lg text-blue-900 dark:text-sky-300 font-bold text-xs">
                ទំព័រ {validCurrentPage} / {totalPages}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={validCurrentPage === totalPages}
                className="p-1.5 rounded-lg bg-zinc-50 dark:bg-[#182645] border border-zinc-200 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-50 dark:hover:bg-blue-950/60 cursor-pointer transition-colors"
                title="ទំព័របន្ទាប់ (Next Page)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={validCurrentPage === totalPages}
                className="p-1.5 rounded-lg bg-zinc-50 dark:bg-[#182645] border border-zinc-200 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-50 dark:hover:bg-blue-950/60 cursor-pointer transition-colors"
                title="ទំព័រចុងក្រោយ (Last Page)"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111c38] rounded-3xl p-6 max-w-2xl w-full border border-blue-200/60 dark:border-sky-500/20 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/80 flex items-center justify-center text-blue-800 dark:text-sky-300 font-bold">
                  {isReadOnly ? <Eye className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {isReadOnly
                    ? 'ព័ត៌មានលម្អិតអំពីនិស្សិត (Student Profile)'
                    : editingStudent
                    ? 'កែប្រែព័ត៌មាននិស្សិត'
                    : 'ចុះឈ្មោះនិស្សិតថ្មី'}
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4 pt-4 text-xs">
              {/* Photo Upload & Preview Section */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-zinc-50 dark:bg-[#182645] rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80">
                <div className="relative group shrink-0">
                  {formPhotoUrl ? (
                    <img
                      src={formPhotoUrl}
                      alt="Student"
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-500 shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-zinc-200 dark:bg-zinc-800 flex flex-col items-center justify-center text-zinc-400">
                      <Camera className="w-6 h-6 mb-1" />
                      <span className="text-[9px] font-bold">រូបថត</span>
                    </div>
                  )}

                  {!isReadOnly && formPhotoUrl && (
                    <button
                      type="button"
                      onClick={() => setFormPhotoUrl(undefined)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md hover:bg-rose-700 cursor-pointer"
                      title="លុបរូបថតចេញ"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 flex-1 text-center sm:text-left">
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">រូបថតសិស្ស (Student Photo)</span>
                    <span className="text-[10px] text-zinc-400">(ស្រេចចិត្ត - Optional)</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    ផ្ទុកឡើងរូបថតផ្ទាល់ខ្លួនទំហំ 4x6 ឬរូបសន្លឹក (ទំហំអតិបរមា 8MB, JPG/PNG)
                  </p>

                  {!isReadOnly && (
                    <div className="pt-1 flex items-center justify-center sm:justify-start gap-2">
                      <label className="px-3 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors">
                        <Camera className="w-3.5 h-3.5" />
                        <span>ជ្រើសរើសរូបថត (Upload)</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    អត្តលេខនិស្សិត (Student ID) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isReadOnly}
                    value={formStudentCode}
                    onChange={(e) => setFormStudentCode(e.target.value)}
                    placeholder="ICI-2025-001"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182645] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 focus:border-blue-500 outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    ឈ្មោះជាភាសាខ្មែរ (Khmer Name) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isReadOnly}
                    value={formNameKhmer}
                    onChange={(e) => setFormNameKhmer(e.target.value)}
                    placeholder="ឧ. ឡុង សុខា"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182645] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 focus:border-blue-500 outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    ឈ្មោះជាឡាតាំង (Latin Name)
                  </label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={formNameLatin}
                    onChange={(e) => setFormNameLatin(e.target.value)}
                    placeholder="e.g. Long Sokha"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182645] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 focus:border-blue-500 outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    ឈ្មោះជាភាសាចិន (Chinese Name)
                  </label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={formNameChinese}
                    onChange={(e) => setFormNameChinese(e.target.value)}
                    placeholder="例如: 龙淑华"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182645] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 focus:border-blue-500 outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    ភេទ (Gender)
                  </label>
                  <select
                    disabled={isReadOnly}
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as 'male' | 'female')}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182645] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 focus:border-blue-500 outline-hidden cursor-pointer font-medium"
                  >
                    <option value="female">ស្រី (Female)</option>
                    <option value="male">ប្រុស (Male)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    <span>ថ្ងៃខែឆ្នាំកំណើត (DOB)</span>
                    {isReadOnly && <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold ml-1">🔒(Blur)</span>}
                  </label>
                  <input
                    type="date"
                    disabled={isReadOnly}
                    value={formDob}
                    onChange={(e) => setFormDob(e.target.value)}
                    className={`w-full px-3 py-2 bg-zinc-50 dark:bg-[#182645] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 focus:border-blue-500 outline-hidden font-medium ${
                      isReadOnly ? 'filter blur-[5px] select-none pointer-events-none opacity-60 bg-zinc-100 dark:bg-zinc-800 cursor-not-allowed' : ''
                    }`}
                  />
                </div>

                {/* Class Type */}
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    កម្រិតបណ្តុះបណ្តាល (Class Type) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    disabled={isReadOnly}
                    value={formClassType}
                    onChange={(e) => setFormClassType(e.target.value as ClassType)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182645] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 focus:border-blue-500 outline-hidden cursor-pointer font-medium"
                  >
                    {CLASS_TYPE_OPTIONS.map((ct) => (
                      <option key={ct.id} value={ct.id}>
                        {ct.nameKhmer}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    ជំនាញសិក្សា (Major)
                  </label>
                  <select
                    value={formMajorId}
                    disabled={isReadOnly}
                    onChange={(e) => setFormMajorId(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182645] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 focus:border-blue-500 outline-hidden cursor-pointer font-medium"
                  >
                    {majors.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nameKhmer} ({m.nameLatin})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    ថ្នាក់រៀន (Class)
                  </label>
                  <select
                    value={formClassId}
                    disabled={isReadOnly}
                    onChange={(e) => setFormClassId(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182645] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 focus:border-blue-500 outline-hidden cursor-pointer font-medium"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dynamic Shift selection */}
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    វេនសិក្សា (Shift)
                  </label>
                  <select
                    value={formShift}
                    disabled={isReadOnly}
                    onChange={(e) => setFormShift(e.target.value as ShiftType)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182645] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 focus:border-blue-500 outline-hidden cursor-pointer font-medium"
                  >
                    {shifts.map((s) => (
                      <option key={s.id} value={s.code}>
                        {s.nameKhmer} ({s.timeRange})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    កម្រិតឆ្នាំសិក្សា (Year)
                  </label>
                  <select
                    value={formYear}
                    disabled={isReadOnly}
                    onChange={(e) => setFormYear(e.target.value as AcademicYearType)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182645] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 focus:border-blue-500 outline-hidden cursor-pointer font-medium"
                  >
                    <option value="Year 1">ឆ្នាំទី១ (Year 1)</option>
                    <option value="Year 2">ឆ្នាំទី២ (Year 2)</option>
                    <option value="Year 3">ឆ្នាំទី៣ (Year 3)</option>
                    <option value="Year 4">ឆ្នាំទី៤ (Year 4)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    <span>លេខទូរសព្ទ (Phone)</span>
                    {isReadOnly && <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold ml-1">🔒(Blur)</span>}
                  </label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="012 345 678"
                    className={`w-full px-3 py-2 bg-zinc-50 dark:bg-[#182645] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 focus:border-blue-500 outline-hidden font-medium ${
                      isReadOnly ? 'filter blur-[5px] select-none pointer-events-none opacity-60 bg-zinc-100 dark:bg-zinc-800 cursor-not-allowed' : ''
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    <span>លេខអាណាព្យាបាល (Guardian Phone)</span>
                    {isReadOnly && <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold ml-1">🔒(Blur)</span>}
                  </label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={formGuardianPhone}
                    onChange={(e) => setFormGuardianPhone(e.target.value)}
                    placeholder="098 765 432"
                    className={`w-full px-3 py-2 bg-zinc-50 dark:bg-[#182645] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 focus:border-blue-500 outline-hidden font-medium ${
                      isReadOnly ? 'filter blur-[5px] select-none pointer-events-none opacity-60 bg-zinc-100 dark:bg-zinc-800 cursor-not-allowed' : ''
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    ស្ថានភាពនិស្សិត (Status)
                  </label>
                  <select
                    disabled={isReadOnly}
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as StudentStatus)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182645] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 focus:border-blue-500 outline-hidden cursor-pointer font-medium"
                  >
                    <option value="active">កំពុងរៀន (Active)</option>
                    <option value="suspended">ព្យួរការសិក្សា (Suspended)</option>
                    <option value="dropped">បោះបង់ (Dropped)</option>
                    <option value="graduated">បញ្ចប់ការសិក្សា (Graduated)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  <span>អាសយដ្ឋាន (Address)</span>
                  {isReadOnly && <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold ml-1">🔒(Blur)</span>}
                </label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="រាជធានីភ្នំពេញ"
                  className={`w-full px-3 py-2 bg-zinc-50 dark:bg-[#182645] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 focus:border-blue-500 outline-hidden font-medium ${
                    isReadOnly ? 'filter blur-[5px] select-none pointer-events-none opacity-60 bg-zinc-100 dark:bg-zinc-800 cursor-not-allowed' : ''
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  <span>កំណត់សម្គាល់បន្ថែម (Notes)</span>
                  {isReadOnly && <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold ml-1">🔒(Blur)</span>}
                </label>
                <textarea
                  rows={2}
                  disabled={isReadOnly}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="កំណត់សម្គាល់ព័ត៌មានបន្ថែមអំពីនិស្សិត..."
                  className={`w-full px-3 py-2 bg-zinc-50 dark:bg-[#182645] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 focus:border-blue-500 outline-hidden font-medium resize-none ${
                    isReadOnly ? 'filter blur-[5px] select-none pointer-events-none opacity-60 bg-zinc-100 dark:bg-zinc-800 cursor-not-allowed' : ''
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-semibold cursor-pointer"
                >
                  {isReadOnly ? 'បិទ (Close)' : 'បោះបង់ (Cancel)'}
                </button>
                {!isReadOnly && (
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold shadow-xs cursor-pointer"
                  >
                    {editingStudent ? 'រក្សាទុកការកែប្រែ' : 'ចុះឈ្មោះនិស្សិត'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete All Confirmation Modal */}
      {isDeleteAllModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111c38] rounded-3xl p-6 max-w-md w-full border border-rose-200 dark:border-rose-900/40 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                តើអ្នកពិតជាចង់លុបទិន្នន័យនិស្សិតទាំងអស់មែនទេ?
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                សកម្មភាពនេះនឹងលុបទិន្នន័យនិស្សិតទាំងអស់ចំនួន <strong className="text-rose-600 dark:text-rose-400 font-bold">{students.length} នាក់</strong> ចេញពីប្រព័ន្ធជាអចិន្ត្រៃយ៍។
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteAllModalOpen(false)}
                disabled={isDeletingAll}
                className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-semibold text-xs transition-colors cursor-pointer"
              >
                បោះបង់ (Cancel)
              </button>
              <button
                type="button"
                onClick={handleDeleteAllStudents}
                disabled={isDeletingAll}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {isDeletingAll ? 'កំពុងលុប...' : 'លុបទាំងអស់ (Confirm)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Profile Photo Viewer */}
      <ProfileImageViewerModal
        isOpen={isImageViewerOpen}
        onClose={() => {
          setIsImageViewerOpen(false);
          setImageViewerTarget(null);
        }}
        target={imageViewerTarget}
      />

      {/* Batch / Single Promote Modal */}
      <PromoteStudentsModal
        isOpen={isPromoteModalOpen}
        onClose={() => {
          setIsPromoteModalOpen(false);
          setStudentsToPromote([]);
        }}
        selectedStudents={studentsToPromote}
        classes={classes}
        shifts={shifts}
        showToast={showToast}
        onSuccess={() => {
          setSelectedStudentIds(new Set());
        }}
        isReadOnly={isReadOnly}
      />
    </div>
  );
};
