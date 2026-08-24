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
  MapPin
} from 'lucide-react';
import { Student, Classroom, Major, ShiftType, AcademicYearType, StudentStatus } from '../types';
import { instituteService } from '../service/instituteService';
import {
  exportStudentsToExcel,
  downloadStudentTemplate,
  parseStudentExcel,
  getShiftLabel,
  getStatusLabel
} from '../utils/exportUtils';

interface StudentsViewProps {
  students: Student[];
  classes: Classroom[];
  majors: Major[];
  isAddModalOpen?: boolean;
  onCloseAddModal?: () => void;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  isReadOnly?: boolean;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  classes,
  majors,
  isAddModalOpen = false,
  onCloseAddModal,
  showToast,
  isReadOnly = false
}) => {
  const [search, setSearch] = useState('');
  const [selectedShift, setSelectedShift] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMajor, setSelectedMajor] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // Modal states
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
    setSelectedShift('all');
    setSelectedClass('all');
    setSelectedYear('all');
    setSelectedMajor('all');
    setSelectedStatus('all');
  };

  const activeFiltersCount = [
    search.trim() !== '',
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
      showToast('បានលុបទិន្នន័យនិស្សិតទាំងអស់ដោយជោគជ័យ!', 'success');
      setIsDeleteAllModalOpen(false);
    } catch (e) {
      showToast('មិនអាចលុបទិន្នន័យបានទេ', 'error');
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនអាចបង្កើត ឬកែប្រែទិន្នន័យបានទេ (Read-Only Mode)!', 'info');
      return;
    }
    if (!formNameKhmer.trim()) {
      showToast('សូមបញ្ចូលឈ្មោះខ្មែររបស់និស្សិត!', 'error');
      return;
    }

    const selectedMaj = majors.find((m) => m.id === formMajorId);
    const selectedCls = classes.find((c) => c.id === formClassId);

    const studentData: Student = {
      id: editingStudent ? editingStudent.id : `stu_${Date.now()}`,
      studentCode: formStudentCode.trim() || (editingStudent ? editingStudent.studentCode : `CPI-${Date.now()}`),
      nameKhmer: formNameKhmer.trim(),
      nameLatin: formNameLatin.trim(),
      nameChinese: formNameChinese.trim() || undefined,
      gender: formGender,
      dob: formDob,
      phone: formPhone.trim(),
      email: formEmail.trim() || undefined,
      majorId: formMajorId,
      majorName: selectedMaj?.nameKhmer || (editingStudent ? editingStudent.majorName : 'គរុកោសល្យភាសាចិន'),
      classId: formClassId,
      className: selectedCls?.name || (editingStudent ? editingStudent.className : 'ថ្នាក់ទូទៅ'),
      shift: formShift,
      year: formYear,
      status: formStatus,
      guardianPhone: formGuardianPhone.trim() || undefined,
      address: formAddress.trim() || undefined,
      notes: formNotes.trim() || undefined,
      photoUrl: formPhotoUrl || undefined,
      createdAt: editingStudent ? editingStudent.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await instituteService.saveStudent(studentData);
      showToast(
        editingStudent ? 'បានកែប្រែព័ត៌មាននិស្សិតជោគជ័យ!' : 'បានបញ្ចូលនិស្សិតថ្មីជោគជ័យ!',
        'success'
      );
      closeModal();
    } catch (err: any) {
      showToast('មានបញ្ហាក្នុងការរក្សាទុកទិន្នន័យ', 'error');
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
        showToast('បានលុបនិស្សិតជោគជ័យ!', 'info');
      } catch (e) {
        showToast('មិនអាចលុបបានទេ', 'error');
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនអាច Import ទិន្នន័យបានទេ (Read-Only Mode)!', 'info');
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const parsed = await parseStudentExcel(file);
      if (parsed.length === 0) {
        showToast('មិនមានទិន្នន័យនិស្សិតក្នុងឯកសារ Excel ទេ!', 'error');
        return;
      }

      const defaultMajor = majors[0];
      const defaultClass = classes[0];

      let insertedCount = 0;
      let updatedCount = 0;

      // Build map of existing students to prevent duplicates
      const studentMap = new Map<string, Student>();
      students.forEach((s) => {
        studentMap.set(s.id, s);
      });

      const processedBatch: Student[] = [];

      parsed.forEach((p, index) => {
        // Resolve Major
        let matchedMajor = defaultMajor;
        if (p.majorName) {
          const rawMajor = (p.majorName || '').toLowerCase().trim();
          const found = majors.find(
            (m) =>
              m.id.toLowerCase() === rawMajor ||
              m.nameKhmer.toLowerCase().includes(rawMajor) ||
              rawMajor.includes(m.nameKhmer.toLowerCase()) ||
              (m.nameLatin && m.nameLatin.toLowerCase().includes(rawMajor)) ||
              (m.code && m.code.toLowerCase() === rawMajor)
          );
          if (found) matchedMajor = found;
        }

        // Resolve Class
        let matchedClass = defaultClass;
        if (p.className) {
          const rawClass = (p.className || '').toLowerCase().trim();
          const found = classes.find(
            (c) =>
              c.id.toLowerCase() === rawClass ||
              c.name.toLowerCase().includes(rawClass) ||
              rawClass.includes(c.name.toLowerCase()) ||
              (c.classCode && c.classCode.toLowerCase() === rawClass)
          );
          if (found) matchedClass = found;
        }

        // Check if student already exists by Student Code or (Name + Phone)
        const targetCode = (p.studentCode || '').trim().toLowerCase();
        const targetNameKhmer = (p.nameKhmer || '').trim().toLowerCase();
        const targetPhone = (p.phone || '').trim().replace(/\D/g, '');

        let existingMatch: Student | undefined;

        if (targetCode) {
          existingMatch = Array.from(studentMap.values()).find(
            (s) => s.studentCode.trim().toLowerCase() === targetCode
          );
        }

        if (!existingMatch && targetNameKhmer && targetPhone) {
          existingMatch = Array.from(studentMap.values()).find(
            (s) =>
              s.nameKhmer.trim().toLowerCase() === targetNameKhmer &&
              (s.phone || '').replace(/\D/g, '') === targetPhone
          );
        }

        if (existingMatch) {
          // Update existing student record
          updatedCount++;
          const updated: Student = {
            ...existingMatch,
            studentCode: p.studentCode || existingMatch.studentCode,
            nameKhmer: p.nameKhmer || existingMatch.nameKhmer,
            nameLatin: p.nameLatin || existingMatch.nameLatin,
            nameChinese: p.nameChinese || existingMatch.nameChinese,
            gender: p.gender || existingMatch.gender,
            dob: p.dob || existingMatch.dob,
            phone: p.phone || existingMatch.phone,
            email: p.email || existingMatch.email,
            majorId: matchedMajor?.id || existingMatch.majorId,
            majorName: matchedMajor?.nameKhmer || existingMatch.majorName,
            classId: matchedClass?.id || existingMatch.classId,
            className: matchedClass?.name || existingMatch.className,
            shift: p.shift || existingMatch.shift,
            year: p.year || existingMatch.year,
            status: p.status || existingMatch.status,
            guardianPhone: p.guardianPhone || existingMatch.guardianPhone,
            address: p.address || existingMatch.address,
            updatedAt: new Date().toISOString()
          };
          studentMap.set(updated.id, updated);
          processedBatch.push(updated);
        } else {
          // Insert new student record
          insertedCount++;
          const newId = `stu_imp_${Date.now()}_${index}`;
          const newStudent: Student = {
            id: newId,
            studentCode: p.studentCode || `CPI-2025-${String(students.length + insertedCount).padStart(3, '0')}`,
            nameKhmer: p.nameKhmer || 'និស្សិត',
            nameLatin: p.nameLatin || '',
            nameChinese: p.nameChinese || undefined,
            gender: p.gender || 'female',
            dob: p.dob || '2004-01-01',
            phone: p.phone || '',
            email: p.email || undefined,
            majorId: matchedMajor?.id || 'maj_pedagogy',
            majorName: matchedMajor?.nameKhmer || 'គរុកោសល្យភាសាចិន',
            classId: matchedClass?.id || (classes[0]?.id || ''),
            className: matchedClass?.name || 'ថ្នាក់ឆ្នាំទី១',
            shift: p.shift || 'morning',
            year: p.year || 'Year 1',
            status: p.status || 'active',
            guardianPhone: p.guardianPhone || undefined,
            address: p.address || undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          studentMap.set(newId, newStudent);
          processedBatch.push(newStudent);
        }
      });

      await instituteService.saveStudentsBulk(processedBatch);
      showToast(
        `បានបញ្ចូលនិស្សិតថ្មី ${insertedCount} នាក់ និងធ្វើបច្ចុប្បន្នភាព ${updatedCount} នាក់ពី Excel ដោយជោគជ័យ!`,
        'success'
      );
    } catch (err) {
      console.error(err);
      showToast('ទម្រង់ឯកសារ Excel មិនត្រឹមត្រូវ', 'error');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // 1. Shift filter
      if (selectedShift !== 'all') {
        const studentShift = (s.shift || '').toLowerCase();
        if (studentShift !== selectedShift.toLowerCase()) return false;
      }

      // 2. Class filter (match by ID or class name)
      if (selectedClass !== 'all') {
        const targetClass = classes.find((c) => c.id === selectedClass);
        const matchesId = s.classId === selectedClass;
        const matchesName = targetClass && s.className === targetClass.name;
        const matchesDirectName = s.className === selectedClass;
        if (!matchesId && !matchesName && !matchesDirectName) return false;
      }

      // 3. Major filter (match by ID or major name)
      if (selectedMajor !== 'all') {
        const targetMajor = majors.find((m) => m.id === selectedMajor);
        const matchesId = s.majorId === selectedMajor;
        const matchesName = targetMajor && (s.majorName === targetMajor.nameKhmer || s.majorName === targetMajor.nameLatin);
        const matchesDirectName = s.majorName === selectedMajor;
        if (!matchesId && !matchesName && !matchesDirectName) return false;
      }

      // 4. Academic Year filter
      if (selectedYear !== 'all') {
        const studentYear = (s.year || '').toLowerCase();
        const targetYear = selectedYear.toLowerCase();
        if (!studentYear.includes(targetYear) && studentYear !== targetYear) return false;
      }

      // 5. Status filter
      if (selectedStatus !== 'all') {
        if (s.status !== selectedStatus) return false;
      }

      // 6. Search query
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
  }, [students, classes, majors, selectedShift, selectedClass, selectedMajor, selectedYear, selectedStatus, search]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="bg-white dark:bg-[#131f1a] rounded-3xl p-6 border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-sm">
              <Users className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
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

          {/* Delete All Data - Hidden in Guest mode */}
          {!isReadOnly && (
            <button
              onClick={() => setIsDeleteAllModalOpen(true)}
              disabled={students.length === 0}
              title="លុបទិន្នន័យនិស្សិតទាំងអស់"
              className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>លុបទិន្នន័យទាំងអស់ (Delete All)</span>
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

          <button
            onClick={() => exportStudentsToExcel(filteredStudents)}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Export Excel ({filteredStudents.length})</span>
          </button>

          <button
            onClick={downloadStudentTemplate}
            title="ទាញយកគំរូ Excel"
            className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
          </button>

          {!isReadOnly ? (
            <button
              onClick={openAddModal}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
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

      {/* Filters & Search Control */}
      <div className="bg-white dark:bg-[#131f1a] rounded-2xl p-4 border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="relative sm:col-span-2 md:col-span-3 lg:col-span-2">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ស្វែងរកតាមឈ្មោះ, អត្តលេខ, ទូរសព្ទ..."
              className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs text-zinc-800 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-hidden transition-all"
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
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs text-zinc-700 dark:text-zinc-200 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden cursor-pointer"
            >
              <option value="all">ជំនាញទាំងអស់ (All Majors)</option>
              {majors.map((m) => (
                <option key={m.id} value={m.id} className="dark:bg-[#131f1a]">
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
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs text-zinc-700 dark:text-zinc-200 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden cursor-pointer"
            >
              <option value="all">ថ្នាក់ទាំងអស់ (All Classes)</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id} className="dark:bg-[#131f1a]">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Shift Filter */}
          <div>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs text-zinc-700 dark:text-zinc-200 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden cursor-pointer"
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
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs text-zinc-700 dark:text-zinc-200 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden cursor-pointer"
            >
              <option value="all">ឆ្នាំទាំងអស់ (All Years)</option>
              <option value="Year 1">ឆ្នាំទី១ (Year 1)</option>
              <option value="Year 2">ឆ្នាំទី២ (Year 2)</option>
              <option value="Year 3">ឆ្នាំទី៣ (Year 3)</option>
              <option value="Year 4">ឆ្នាំទី៤ (Year 4)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs text-zinc-700 dark:text-zinc-200 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden cursor-pointer"
            >
              <option value="all">ស្ថានភាពទាំងអស់ (All Status)</option>
              <option value="active">កំពុងរៀន (Active)</option>
              <option value="suspended">ព្យួរការសិក្សា (Suspended)</option>
              <option value="dropped">បោះបង់ (Dropped)</option>
              <option value="graduated">បញ្ចប់ការសិក្សា (Graduated)</option>
            </select>
          </div>
        </div>

        {/* Active Filters Bar & Reset */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <Filter className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>
                តម្រងសកម្ម: <strong className="font-semibold">{activeFiltersCount}</strong> លក្ខខណ្ឌ (រកឃើញ {filteredStudents.length} នាក់)
              </span>
            </div>
            <button
              onClick={handleResetFilters}
              className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-medium text-xs inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <X className="w-3 h-3" />
              <span>សម្អាតតម្រងទាំងអស់ (Reset)</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content View: Table or Cards Grid */}
      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-[#131f1a] rounded-3xl border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-[#182620] border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">អត្តលេខ & រូបថត</th>
                  <th className="py-3.5 px-4">ឈ្មោះនិស្សិត (ខ្មែរ / Chinese / Latin)</th>
                  <th className="py-3.5 px-4">ភេទ & ថ្ងៃកំណើត</th>
                  <th className="py-3.5 px-4">ជំនាញ & ថ្នាក់សិក្សា</th>
                  <th className="py-3.5 px-4">វេន & ឆ្នាំសិក្សា</th>
                  <th className="py-3.5 px-4">ទូរសព្ទ & អាណាព្យាបាល</th>
                  <th className="py-3.5 px-4">ស្ថានភាព</th>
                  <th className="py-3.5 px-4 text-right">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-zinc-400">
                      <Users className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
                      <p className="font-bold text-zinc-700 dark:text-zinc-200">ពុំមានទិន្នន័យនិស្សិតទេ</p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        សូមសាកល្បងផ្លាស់ប្តូរលក្ខខណ្ឌ Filter ឬបន្ថែមនិស្សិតថ្មី
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((stu) => (
                    <tr
                      key={stu.id}
                      className="hover:bg-emerald-50/40 dark:hover:bg-[#182620]/60 transition-colors"
                    >
                      {/* Student ID & Photo */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {stu.photoUrl ? (
                            <img
                              src={stu.photoUrl}
                              alt={stu.nameKhmer}
                              className="w-10 h-10 rounded-xl object-cover border border-emerald-500/40 shadow-xs shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                stu.gender === 'female'
                                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200'
                                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200'
                              }`}
                            >
                              {(stu.nameKhmer || stu.nameLatin || 'S').charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-xs">
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
                            <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/40">
                              {stu.nameChinese}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                          {stu.nameLatin || '-'}
                        </div>
                      </td>

                      {/* Gender & DOB */}
                      <td className="py-3 px-4">
                        <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                          {stu.gender === 'female' ? 'ស្រី (Female)' : 'ប្រុស (Male)'}
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-zinc-400 shrink-0" />
                          <span>{stu.dob || '-'}</span>
                        </div>
                      </td>

                      {/* Major & Class */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            {stu.majorName || 'គរុកោសល្យភាសាចិន'}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium pl-5">
                          ថ្នាក់: {stu.className || '-'}
                        </div>
                      </td>

                      {/* Shift & Year */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold text-[11px] border border-zinc-200/60 dark:border-zinc-700/60">
                          {stu.shift === 'morning' && <Sun className="w-3 h-3 text-amber-500" />}
                          {stu.shift === 'afternoon' && <Sunset className="w-3 h-3 text-orange-500" />}
                          {stu.shift === 'evening' && <Moon className="w-3 h-3 text-indigo-500" />}
                          {stu.shift === 'weekend' && <Calendar className="w-3 h-3 text-teal-500" />}
                          <span>{getShiftLabel(stu.shift)}</span>
                        </span>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
                          {stu.year}
                        </div>
                      </td>

                      {/* Contact & Guardian */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-zinc-800 dark:text-zinc-200 font-medium">
                          <Phone className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>{stu.phone || '-'}</span>
                        </div>
                        {stu.guardianPhone && (
                          <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                            អាណាព្យាបាល: {stu.guardianPhone}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Students Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-[#131f1a] rounded-3xl p-12 text-center text-zinc-400 border border-emerald-900/10 dark:border-emerald-800/30">
              <Users className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
              <p className="font-bold text-zinc-700 dark:text-zinc-200">ពុំមានទិន្នន័យនិស្សិតទេ</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
                សូមសាកល្បងផ្លាស់ប្តូរលក្ខខណ្ឌ Filter ឬបន្ថែម/Import និស្សិត
              </p>
            </div>
          ) : (
            filteredStudents.map((stu) => (
              <div
                key={stu.id}
                className="bg-white dark:bg-[#131f1a] rounded-3xl p-5 border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs hover:border-emerald-500/40 dark:hover:border-emerald-600/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      {stu.photoUrl ? (
                        <img
                          src={stu.photoUrl}
                          alt={stu.nameKhmer}
                          className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-xs shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
                            stu.gender === 'female'
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200'
                              : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200'
                          }`}
                        >
                          {(stu.nameKhmer || stu.nameLatin || 'S').charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{stu.nameKhmer}</h3>
                          {stu.nameChinese && (
                            <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/40">
                              {stu.nameChinese}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">{stu.nameLatin || '-'}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
                            {stu.studentCode}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium">
                            {stu.gender === 'female' ? 'ស្រី' : 'ប្រុស'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                        stu.status === 'active'
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                          : stu.status === 'suspended'
                          ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                          : stu.status === 'graduated'
                          ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {getStatusLabel(stu.status)}
                    </span>
                  </div>

                  {/* Academic & Contact Info */}
                  <div className="space-y-2 text-xs py-3 border-y border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-start gap-2">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">ជំនាញ: </span>
                        <span className="text-zinc-700 dark:text-zinc-300 font-medium">{stu.majorName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">ថ្នាក់ / ឆ្នាំ: </span>
                        <span className="text-zinc-700 dark:text-zinc-300 font-medium">{stu.className} • {stu.year}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">វេនសិក្សា: </span>
                        <span className="text-zinc-700 dark:text-zinc-300 font-medium">{getShiftLabel(stu.shift)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="text-zinc-700 dark:text-zinc-300 font-medium">{stu.phone || '-'}</span>
                      {stu.guardianPhone && (
                        <span className="text-zinc-400 text-[11px]">(អាណាព្យាបាល: {stu.guardianPhone})</span>
                      )}
                    </div>

                    {stu.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="text-zinc-600 dark:text-zinc-400 truncate font-medium">{stu.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openEditModal(stu)}
                    className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs inline-flex items-center gap-1 transition-colors cursor-pointer border border-zinc-200 dark:border-zinc-700"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>{isReadOnly ? 'មើលព័ត៌មាន' : 'កែប្រែ'}</span>
                  </button>
                  {!isReadOnly && (
                    <button
                      onClick={() => handleDeleteStudent(stu.id, stu.nameKhmer)}
                      className="p-1.5 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add / Edit Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#131f1a] rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-emerald-900/10 dark:border-emerald-800/30 space-y-5 animate-in fade-in zoom-in duration-150 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
                      {isReadOnly ? 'ព័ត៌មានលម្អិតនិស្សិត (Student Profile)' : editingStudent ? 'កែប្រែព័ត៌មាននិស្សិត' : 'ចុះឈ្មោះនិស្សិតថ្មី (New Student)'}
                    </h3>
                    {isReadOnly && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                        Read-Only
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    វិទ្យាស្ថានគរុកោសល្យភាសាចិនក្នុងតំបន់ (International Chinese Education and Teachers Institute)
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4 text-xs">
              {/* Photo Upload & Preview Bar */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 border-2 border-emerald-500/40 flex items-center justify-center shrink-0 shadow-xs">
                    {formPhotoUrl ? (
                      <img
                        src={formPhotoUrl}
                        alt="Student"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-zinc-400">
                        <ImageIcon className="w-6 h-6 text-zinc-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>រូបថតនិស្សិត (Profile Picture)</span>
                    </h4>
                    <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 font-medium">
                      គាំទ្ររូបភាព JPG, PNG, WebP (អតិបរមា 3MB)
                    </p>
                  </div>
                </div>

                {!isReadOnly && (
                  <div className="flex items-center gap-2">
                    <label className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors">
                      <Camera className="w-3.5 h-3.5" />
                      <span>{formPhotoUrl ? 'ប្តូររូបថត' : 'ជ្រើសរើសរូបថត'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                    {formPhotoUrl && (
                      <button
                        type="button"
                        onClick={() => setFormPhotoUrl(undefined)}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold text-[11px] border border-rose-200 dark:border-rose-800/60 cursor-pointer"
                      >
                        លុបរូប
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Status Buttons Selector */}
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  ស្ថានភាពសិក្សា (Student Status) *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    disabled={isReadOnly}
                    onClick={() => setFormStatus('active')}
                    className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                      isReadOnly ? 'cursor-default' : 'cursor-pointer'
                    } ${
                      formStatus === 'active'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-zinc-50 dark:bg-[#182620] border-zinc-200 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                    <span>កំពុងរៀន (Active)</span>
                  </button>

                  <button
                    type="button"
                    disabled={isReadOnly}
                    onClick={() => setFormStatus('suspended')}
                    className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                      isReadOnly ? 'cursor-default' : 'cursor-pointer'
                    } ${
                      formStatus === 'suspended'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-zinc-50 dark:bg-[#182620] border-zinc-200 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                    <span>ព្យួរការសិក្សា (Suspended)</span>
                  </button>

                  <button
                    type="button"
                    disabled={isReadOnly}
                    onClick={() => setFormStatus('dropped')}
                    className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                      isReadOnly ? 'cursor-default' : 'cursor-pointer'
                    } ${
                      formStatus === 'dropped'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-zinc-50 dark:bg-[#182620] border-zinc-200 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
                    <span>បោះបង់ (Dropped)</span>
                  </button>

                  <button
                    type="button"
                    disabled={isReadOnly}
                    onClick={() => setFormStatus('graduated')}
                    className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                      isReadOnly ? 'cursor-default' : 'cursor-pointer'
                    } ${
                      formStatus === 'graduated'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-zinc-50 dark:bg-[#182620] border-zinc-200 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                    <span>បញ្ចប់ (Graduated)</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    អត្តលេខនិស្សិត (Student ID) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formStudentCode}
                    onChange={(e) => setFormStudentCode(e.target.value)}
                    placeholder="CPI-2025-001"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    ឈ្មោះខ្មែរ (Name Khmer) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formNameKhmer}
                    onChange={(e) => setFormNameKhmer(e.target.value)}
                    placeholder="ឧ. ជា សុខនីកា"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    អក្សរឡាតាំង (Name Latin)
                  </label>
                  <input
                    type="text"
                    value={formNameLatin}
                    onChange={(e) => setFormNameLatin(e.target.value)}
                    placeholder="e.g. Chea Soknika"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    ឈ្មោះជាភាសាចិន (Chinese Name)
                  </label>
                  <input
                    type="text"
                    value={formNameChinese}
                    onChange={(e) => setFormNameChinese(e.target.value)}
                    placeholder="ឧ. 谢淑妮"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">ភេទ (Gender)</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden cursor-pointer font-medium"
                  >
                    <option value="female">ស្រី (Female)</option>
                    <option value="male">ប្រុស (Male)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    ថ្ងៃខែឆ្នាំកំណើត (DOB)
                  </label>
                  <input
                    type="date"
                    value={formDob}
                    onChange={(e) => setFormDob(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    ជំនាញសិក្សា (Major)
                  </label>
                  <select
                    value={formMajorId}
                    onChange={(e) => setFormMajorId(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden cursor-pointer font-medium"
                  >
                    {majors.map((m) => (
                      <option key={m.id} value={m.id} className="dark:bg-[#131f1a]">
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
                    onChange={(e) => setFormClassId(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden cursor-pointer font-medium"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id} className="dark:bg-[#131f1a]">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    វេនសិក្សា (Shift)
                  </label>
                  <select
                    value={formShift}
                    onChange={(e) => setFormShift(e.target.value as ShiftType)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden cursor-pointer font-medium"
                  >
                    <option value="morning">វេនព្រឹក (Morning 07:30-11:00)</option>
                    <option value="afternoon">វេនរសៀល (Afternoon 13:30-17:00)</option>
                    <option value="evening">វេនយប់ (Evening 17:30-20:30)</option>
                    <option value="weekend">ចុងសប្តាហ៍ (Weekend)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    កម្រិតឆ្នាំសិក្សា (Year)
                  </label>
                  <select
                    value={formYear}
                    onChange={(e) => setFormYear(e.target.value as AcademicYearType)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden cursor-pointer font-medium"
                  >
                    <option value="Year 1">ឆ្នាំទី១ (Year 1)</option>
                    <option value="Year 2">ឆ្នាំទី២ (Year 2)</option>
                    <option value="Year 3">ឆ្នាំទី៣ (Year 3)</option>
                    <option value="Year 4">ឆ្នាំទី៤ (Year 4)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">លេខទូរសព្ទ (Phone)</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="012 345 678"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    លេខអាណាព្យាបាល (Guardian Phone)
                  </label>
                  <input
                    type="text"
                    value={formGuardianPhone}
                    onChange={(e) => setFormGuardianPhone(e.target.value)}
                    placeholder="098 765 432"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">អាសយដ្ឋាន (Address)</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="រាជធានីភ្នំពេញ"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">កំណត់សម្គាល់បន្ថែម (Notes)</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="កំណត់សម្គាល់ព័ត៌មានបន្ថែមអំពីនិស្សិត..."
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden font-medium resize-none"
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
                    className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-xs cursor-pointer"
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
          <div className="bg-white dark:bg-[#131f1a] rounded-3xl p-6 max-w-md w-full border border-rose-100 dark:border-rose-900/30 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                តើអ្នកពិតជាចង់លុបទិន្នន័យនិស្សិតទាំងអស់មែនទេ?
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                សកម្មភាពនេះនឹងលុបទិន្នន័យនិស្សិតទាំងអស់ចំនួន <strong className="text-rose-600 dark:text-rose-400 font-bold">{students.length} នាក់</strong> ចេញពីប្រព័ន្ធជាអចិន្ត្រៃយ៍ ហើយមិនអាចត្រឡប់ក្រោយបានឡើយ។
              </p>
            </div>

            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 rounded-2xl p-3 text-xs text-rose-800 dark:text-rose-300 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <span>⚠️ ការព្រមាន (Warning):</span>
              </p>
              <p className="text-[11px] leading-relaxed">
                ទិន្នន័យទាំងអស់នៅក្នុងមូលដ្ឋានទិន្នន័យ (Cloud Firestore) នឹងត្រូវលុបចោលទាំងស្រុង។ សូមប្រាកដថាអ្នកបាន Export Excel រួចរាល់មុននឹងធ្វើការលុប។
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
                {isDeletingAll ? (
                  <span>កំពុងលុប...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>លុបទាំងអស់ (Confirm Delete)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
