import React, { useState, useMemo } from 'react';
import {
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  Search,
  Phone,
  Mail,
  BookOpen,
  X,
  GraduationCap,
  CalendarCheck,
  FileSpreadsheet,
  Download,
  Upload,
  Filter,
  Camera,
  FileText,
  Paperclip,
  Image as ImageIcon,
  ExternalLink,
  FileCheck,
  AlertTriangle,
  LayoutGrid,
  Table as TableIcon,
  Eye,
  Lock,
  ZoomIn
} from 'lucide-react';
import { Teacher, TeacherStatus, ShiftType } from '../types';
import { instituteService } from '../service/instituteService';
import { ProfileImageViewerModal, ProfileViewTarget } from './ProfileImageViewerModal';
import {
  exportTeachersToExcel,
  downloadTeacherTemplate,
  parseTeacherExcel,
  getShiftLabel,
  getTeacherStatusLabel
} from '../utils/exportUtils';

interface TeachersViewProps {
  teachers: Teacher[];
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  isReadOnly?: boolean;
}

export const TeachersView: React.FC<TeachersViewProps> = ({
  teachers,
  showToast,
  isReadOnly = false
}) => {
  const [search, setSearch] = useState('');
  const [selectedShift, setSelectedShift] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Profile Image Viewer Modal State
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [imageViewerTarget, setImageViewerTarget] = useState<ProfileViewTarget | null>(null);

  // Form states
  const [formTeacherCode, setFormTeacherCode] = useState('');
  const [formNameKhmer, setFormNameKhmer] = useState('');
  const [formNameLatin, setFormNameLatin] = useState('');
  const [formNameChinese, setFormNameChinese] = useState('');
  const [formGender, setFormGender] = useState<'male' | 'female'>('male');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formSubjects, setFormSubjects] = useState('');
  const [formShift, setFormShift] = useState('morning');
  const [formStatus, setFormStatus] = useState<TeacherStatus>('active');
  const [formDegree, setFormDegree] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formPhotoUrl, setFormPhotoUrl] = useState<string | undefined>(undefined);
  const [formCvName, setFormCvName] = useState<string | undefined>(undefined);
  const [formCvUrl, setFormCvUrl] = useState<string | undefined>(undefined);

  const openAddModal = () => {
    if (isReadOnly) return;
    setEditingTeacher(null);
    setFormTeacherCode(`ICI-TCH-${String(teachers.length + 1).padStart(3, '0')}`);
    setFormNameKhmer('');
    setFormNameLatin('');
    setFormNameChinese('');
    setFormGender('male');
    setFormPhone('');
    setFormEmail('');
    setFormSubjects('');
    setFormShift('morning');
    setFormStatus('active');
    setFormDegree('បរិញ្ញាបត្រជាន់ខ្ពស់ (Master\'s)');
    setFormNotes('');
    setFormPhotoUrl(undefined);
    setFormCvName(undefined);
    setFormCvUrl(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (t: Teacher) => {
    setEditingTeacher(t);
    setFormTeacherCode(t.teacherCode);
    setFormNameKhmer(t.nameKhmer);
    setFormNameLatin(t.nameLatin);
    setFormNameChinese(t.nameChinese || '');
    setFormGender(t.gender);
    setFormPhone(t.phone);
    setFormEmail(t.email || '');
    setFormSubjects(t.subjects);
    setFormShift(t.shift || 'morning');
    setFormStatus(t.status || 'active');
    setFormDegree(t.degree || 'បរិញ្ញាបត្រជាន់ខ្ពស់ (Master\'s)');
    setFormNotes(t.notes || '');
    setFormPhotoUrl(t.photoUrl || undefined);
    setFormCvName(t.cvName || undefined);
    setFormCvUrl(t.cvUrl || undefined);
    setIsModalOpen(true);
  };

  // Image viewer opener
  const handleOpenPhotoViewer = (t: Teacher) => {
    setImageViewerTarget({
      nameKhmer: t.nameKhmer,
      nameLatin: t.nameLatin,
      nameChinese: t.nameChinese,
      code: t.teacherCode,
      photoUrl: t.photoUrl,
      gender: t.gender,
      degree: t.degree,
      subjects: t.subjects,
      shift: t.shift,
      phone: t.phone,
      email: t.email,
      roleOrStatus: t.status,
      isTeacher: true
    });
    setIsImageViewerOpen(true);
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
        showToast('បានផ្ទុកឡើងរូបថតសាស្ត្រាចារ្យជោគជ័យ!', 'success');
      }
    } catch (err) {
      console.warn('Error processing photo:', err);
      showToast('មិនអាចផ្ទុកឡើងរូបថតបានទេ', 'error');
    }
  };

  const handleCvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('ទំហំឯកសារ CV ត្រូវតិចជាង 2MB សម្រាប់ការរក្សាទុកលើ Cloud', 'error');
      return;
    }

    setFormCvName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setFormCvUrl(result);
      showToast(`បានភ្ជាប់ឯកសារ CV "${file.name}" ជោគជ័យ!`, 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនអាចកែប្រែទិន្នន័យបានទេ (Read-Only Mode)!', 'info');
      return;
    }
    if (!formNameKhmer.trim()) {
      showToast('សូមបញ្ចូលឈ្មោះខ្មែររបស់សាស្ត្រាចារ្យ!', 'error');
      return;
    }

    setIsSaving(true);

    const generatedCode = `ICI-TCH-${Date.now().toString().slice(-4)}`;
    const finalCode = formTeacherCode.trim() || (editingTeacher ? editingTeacher.teacherCode : generatedCode);

    const data: Teacher = {
      id: editingTeacher ? editingTeacher.id : `tch_${Date.now()}`,
      teacherCode: finalCode,
      nameKhmer: formNameKhmer.trim(),
      nameLatin: formNameLatin.trim(),
      nameChinese: formNameChinese.trim() || undefined,
      gender: formGender,
      phone: formPhone.trim(),
      email: formEmail.trim() || undefined,
      subjects: formSubjects.trim() || 'ភាសាចិន',
      shift: formShift,
      status: formStatus,
      degree: formDegree.trim() || undefined,
      notes: formNotes.trim() || undefined,
      photoUrl: formPhotoUrl || undefined,
      cvName: formCvName || undefined,
      cvUrl: formCvUrl || undefined,
      createdAt: editingTeacher ? editingTeacher.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await instituteService.saveTeacher(data);
      showToast(
        editingTeacher
          ? `បានធ្វើបច្ចុប្បន្នភាពព័ត៌មានសាស្ត្រាចារ្យ "${data.nameKhmer}" ជោគជ័យ!`
          : `បានបន្ថែមសាស្ត្រាចារ្យ "${data.nameKhmer}" ជោគជ័យ!`,
        'success'
      );
      setIsModalOpen(false);
      setEditingTeacher(null);
    } catch (e: any) {
      console.error('Error saving teacher:', e);
      showToast('មិនអាចរក្សាទុកទិន្នន័យបានទេ សូមព្យាយាមម្តងទៀត', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនអាចលុបទិន្នន័យបានទេ (Read-Only Mode)!', 'info');
      return;
    }
    if (window.confirm(`តើអ្នកពិតជាចង់លុបសាស្ត្រាចារ្យ "${name}" មែនទេ?`)) {
      try {
        await instituteService.deleteTeacher(id);
        showToast('បានលុបសាស្ត្រាចារ្យជោគជ័យ!', 'info');
      } catch (e) {
        showToast('មិនអាចលុបបានទេ', 'error');
      }
    }
  };

  const handleDeleteAllTeachers = async () => {
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនអាចលុបទិន្នន័យបានទេ (Read-Only Mode)!', 'info');
      return;
    }
    setIsDeletingAll(true);
    try {
      await instituteService.deleteAllTeachers();
      showToast('បានលុបទិន្នន័យសាស្ត្រាចារ្យទាំងអស់ដោយជោគជ័យ!', 'success');
      setIsDeleteAllModalOpen(false);
    } catch (e) {
      showToast('មិនអាចលុបទិន្នន័យបានទេ', 'error');
    } finally {
      setIsDeletingAll(false);
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
      const parsed = await parseTeacherExcel(file);
      if (parsed.length === 0) {
        showToast('មិនមានទិន្នន័យត្រឹមត្រូវក្នុងឯកសារ Excel ទេ', 'error');
        return;
      }

      let insertedCount = 0;
      let updatedCount = 0;

      // Build map of existing teachers to prevent duplicates and preserve enriched fields
      const teacherMap = new Map<string, Teacher>();
      teachers.forEach((t) => {
        teacherMap.set(t.id, t);
      });

      const processedBatch: Teacher[] = [];

      parsed.forEach((p, idx) => {
        const targetCode = (p.teacherCode || '').trim().toLowerCase();
        const targetNameKhmer = (p.nameKhmer || '').trim().toLowerCase();
        const targetPhone = (p.phone || '').trim().replace(/\D/g, '');

        let existingMatch: Teacher | undefined;

        if (targetCode) {
          existingMatch = Array.from(teacherMap.values()).find(
            (t) => t.teacherCode.trim().toLowerCase() === targetCode
          );
        }

        if (!existingMatch && targetNameKhmer && targetPhone) {
          existingMatch = Array.from(teacherMap.values()).find(
            (t) =>
              t.nameKhmer.trim().toLowerCase() === targetNameKhmer &&
              (t.phone || '').replace(/\D/g, '') === targetPhone
          );
        }

        if (existingMatch) {
          // Update existing teacher record while preserving custom fields (photo, CV, notes, degree)
          updatedCount++;
          const updated: Teacher = {
            ...existingMatch,
            teacherCode: p.teacherCode || existingMatch.teacherCode,
            nameKhmer: p.nameKhmer || existingMatch.nameKhmer,
            nameLatin: p.nameLatin || existingMatch.nameLatin,
            nameChinese: p.nameChinese !== undefined && p.nameChinese !== '' ? p.nameChinese : existingMatch.nameChinese,
            gender: p.gender || existingMatch.gender,
            phone: p.phone || existingMatch.phone,
            email: p.email || existingMatch.email,
            subjects: p.subjects || existingMatch.subjects,
            shift: p.shift || existingMatch.shift,
            status: p.status || existingMatch.status,
            degree: p.degree || existingMatch.degree,
            notes: p.notes || existingMatch.notes,
            photoUrl: existingMatch.photoUrl,
            cvName: existingMatch.cvName,
            cvUrl: existingMatch.cvUrl,
            updatedAt: new Date().toISOString()
          };
          teacherMap.set(updated.id, updated);
          processedBatch.push(updated);
        } else {
          // Insert new teacher record
          insertedCount++;
          const newId = `tch_imp_${Date.now()}_${idx}`;
          const newTeacher: Teacher = {
            id: newId,
            teacherCode: p.teacherCode || `ICI-TCH-${String(teachers.length + insertedCount).padStart(3, '0')}`,
            nameKhmer: p.nameKhmer || 'សាស្ត្រាចារ្យ',
            nameLatin: p.nameLatin || '',
            nameChinese: p.nameChinese || undefined,
            gender: p.gender || 'male',
            phone: p.phone || '',
            email: p.email || undefined,
            subjects: p.subjects || 'ភាសាចិន',
            shift: p.shift || 'morning',
            status: p.status || 'active',
            degree: p.degree || undefined,
            notes: p.notes || undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          teacherMap.set(newId, newTeacher);
          processedBatch.push(newTeacher);
        }
      });

      await instituteService.saveTeachersBulk(processedBatch);
      showToast(`បានបញ្ចូលសាស្ត្រាចារ្យថ្មី ${insertedCount} នាក់ និងធ្វើបច្ចុប្បន្នភាព ${updatedCount} នាក់ដោយជោគជ័យ!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('ទម្រង់ឯកសារ Excel មិនត្រឹមត្រូវ', 'error');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedShift('all');
    setSelectedStatus('all');
  };

  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      // 1. Shift filter
      if (selectedShift !== 'all') {
        const teacherShift = (t.shift || '').toLowerCase();
        if (teacherShift !== selectedShift.toLowerCase()) return false;
      }

      // 2. Status filter
      if (selectedStatus !== 'all') {
        if (t.status !== selectedStatus) return false;
      }

      // 3. Search query
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchCode = (t.teacherCode || '').toLowerCase().includes(q);
        const matchKhmer = (t.nameKhmer || '').toLowerCase().includes(q);
        const matchLatin = (t.nameLatin || '').toLowerCase().includes(q);
        const matchChinese = (t.nameChinese || '').toLowerCase().includes(q);
        const matchSubjects = (t.subjects || '').toLowerCase().includes(q);
        const matchPhone = (t.phone || '').toLowerCase().includes(q);
        const matchEmail = (t.email || '').toLowerCase().includes(q);

        if (!matchCode && !matchKhmer && !matchLatin && !matchChinese && !matchSubjects && !matchPhone && !matchEmail) {
          return false;
        }
      }

      return true;
    });
  }, [teachers, selectedShift, selectedStatus, search]);

  const activeFiltersCount = [
    search.trim() !== '',
    selectedShift !== 'all',
    selectedStatus !== 'all'
  ].filter(Boolean).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="bg-white dark:bg-[#131f1a] rounded-3xl p-6 border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-sm">
              <UserCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            </span>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              សាស្ត្រាចារ្យ & គ្រូបង្រៀន (Faculty Directory)
            </h2>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 font-medium">
            ទិន្នន័យសរុប {teachers.length} នាក់ • កំពុងបង្ហាញតាមតម្រង: {filteredTeachers.length} នាក់
          </p>
        </div>

        {/* Action Buttons & View Toggle */}
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
            <>
              {/* Delete All Data */}
              <button
                onClick={() => setIsDeleteAllModalOpen(true)}
                disabled={teachers.length === 0}
                title="លុបទិន្នន័យសាស្ត្រាចារ្យទាំងអស់"
                className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>លុបទិន្នន័យទាំងអស់ (Delete All)</span>
              </button>

              {/* Import Excel */}
              <label className="px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-200 dark:border-zinc-700">
                <Upload className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300" />
                <span>{isImporting ? 'កំពុង Import...' : 'Import Excel'}</span>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isImporting}
                />
              </label>
            </>
          )}

          {/* Export Excel */}
          <button
            onClick={() => exportTeachersToExcel(filteredTeachers)}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Export Excel ({filteredTeachers.length})</span>
          </button>

          {!isReadOnly && (
            <>
              {/* Template Download */}
              <button
                onClick={downloadTeacherTemplate}
                title="ទាញយកគំរូ Excel សម្រាប់សាស្ត្រាចារ្យ"
                className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
              </button>

              {/* Add Teacher */}
              <button
                onClick={openAddModal}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ បន្ថែមសាស្ត្រាចារ្យ</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters & Search Control */}
      <div className="bg-white dark:bg-[#131f1a] rounded-2xl p-4 border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative sm:col-span-2 lg:col-span-2">
            <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ស្វែងរកតាមឈ្មោះ, អត្តលេខ, មុខវិជ្ជា, ឬទូរស័ព្ទ..."
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

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 rounded-xl text-xs text-zinc-800 dark:text-zinc-200 font-medium focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden cursor-pointer"
            >
              <option value="all">ស្ថានភាពទាំងអស់ (All Status)</option>
              <option value="active">កំពុងបង្រៀន (Active)</option>
              <option value="on_leave">សុំច្បាប់សម្រាក (On Leave)</option>
              <option value="resigned">ឈប់បង្រៀន (Resigned)</option>
            </select>
          </div>
        </div>

        {/* Active Filters Bar & Reset */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-medium">
              <Filter className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>
                តម្រងសកម្ម: <strong className="font-bold">{activeFiltersCount}</strong> លក្ខខណ្ឌ (រកឃើញ {filteredTeachers.length} នាក់)
              </span>
            </div>
            <button
              onClick={handleResetFilters}
              className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-medium text-xs inline-flex items-center gap-1 cursor-pointer transition-colors border border-zinc-200 dark:border-zinc-700"
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
                  <th className="py-3.5 px-4">ឈ្មោះសាស្ត្រាចារ្យ (ខ្មែរ / Chinese / Latin)</th>
                  <th className="py-3.5 px-4">កម្រិតវប្បធម៌</th>
                  <th className="py-3.5 px-4">មុខវិជ្ជាបង្រៀន</th>
                  <th className="py-3.5 px-4">វេនបង្រៀន</th>
                  <th className="py-3.5 px-4">
                    <span className="flex items-center gap-1">
                      <span>ទំនាក់ទំនង & អ៊ីមែល</span>
                      {isReadOnly && <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold lowercase">🔒(Blur)</span>}
                    </span>
                  </th>
                  <th className="py-3.5 px-4">
                    <span className="flex items-center gap-1">
                      <span>ឯកសារ CV</span>
                      {isReadOnly && <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold lowercase">🔒(Blur)</span>}
                    </span>
                  </th>
                  <th className="py-3.5 px-4">ស្ថានភាព</th>
                  <th className="py-3.5 px-4 text-right">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredTeachers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-zinc-400">
                      <UserCheck className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
                      <p className="font-bold text-zinc-700 dark:text-zinc-200">ពុំមានទិន្នន័យសាស្ត្រាចារ្យទេ</p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        សូមសាកល្បងផ្លាស់ប្តូរលក្ខខណ្ឌ Filter ឬបន្ថែមសាស្ត្រាចារ្យថ្មី
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredTeachers.map((t) => (
                    <tr
                      key={t.id}
                      className="hover:bg-emerald-50/40 dark:hover:bg-[#182620]/60 transition-colors"
                    >
                      {/* Teacher ID & Photo (Click to View Full Photo) */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleOpenPhotoViewer(t)}
                            className="relative group w-10 h-10 rounded-xl overflow-hidden border border-emerald-500/40 dark:border-emerald-600/40 shadow-xs shrink-0 cursor-pointer focus:outline-hidden"
                            title="ចុចដើម្បីមើលរូបថតពេញទំហំ (Click to View Full Photo)"
                          >
                            {t.photoUrl ? (
                              <img
                                src={t.photoUrl}
                                alt={t.nameKhmer}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div
                                className={`w-full h-full flex items-center justify-center font-bold text-xs ${
                                  t.gender === 'female'
                                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200'
                                    : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200'
                                }`}
                              >
                                {(t.nameKhmer || t.nameLatin || 'T').charAt(0)}
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                              <ZoomIn className="w-3.5 h-3.5" />
                            </div>
                          </button>
                          <div>
                            <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                              {t.teacherCode}
                            </div>
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                              {t.gender === 'female' ? 'ស្រី (F)' : 'ប្រុស (M)'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm">
                            {t.nameKhmer}
                          </span>
                          {t.nameChinese && (
                            <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/40">
                              {t.nameChinese}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                          {t.nameLatin || '-'}
                        </div>
                      </td>

                      {/* Degree */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                            {t.degree || 'បរិញ្ញាបត្រ'}
                          </span>
                        </div>
                      </td>

                      {/* Subjects */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span
                            className="text-xs font-medium text-zinc-700 dark:text-zinc-300 max-w-[180px] truncate"
                            title={t.subjects}
                          >
                            {t.subjects || 'មិនទាន់បញ្ជាក់'}
                          </span>
                        </div>
                      </td>

                      {/* Shift */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold text-[11px] border border-zinc-200/60 dark:border-zinc-700/60">
                          <CalendarCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          {getShiftLabel(t.shift || 'morning')}
                        </span>
                      </td>

                      {/* Contact & Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-zinc-800 dark:text-zinc-200 font-medium">
                          <Phone className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className={isReadOnly ? 'filter blur-[5px] select-none pointer-events-none opacity-70 font-mono' : ''}>
                            {t.phone || '-'}
                          </span>
                        </div>
                        {t.email && (
                          <div
                            className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400 text-[11px] mt-0.5 truncate max-w-[160px]"
                            title={isReadOnly ? undefined : t.email}
                          >
                            <Mail className="w-3 h-3 text-zinc-400 shrink-0" />
                            <span className={`truncate ${isReadOnly ? 'filter blur-[4.5px] select-none pointer-events-none opacity-70' : ''}`}>
                              {t.email}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* CV */}
                      <td className="py-3 px-4">
                        {t.cvUrl ? (
                          isReadOnly ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 text-[11px] font-bold border border-zinc-200/60 dark:border-zinc-700/40">
                              <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                              <span className="filter blur-[3px] select-none pointer-events-none opacity-60 max-w-[50px] truncate">CV_Doc</span>
                            </span>
                          ) : (
                            <a
                              href={t.cvUrl}
                              download={t.cvName || 'CV_Teacher'}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold border border-emerald-200/60 dark:border-emerald-800/40 transition-colors"
                              title={t.cvName}
                            >
                              <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="max-w-[70px] truncate">{t.cvName || 'ទាញយក'}</span>
                            </a>
                          )
                        ) : (
                          <span className="text-zinc-400 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${
                            t.status === 'active'
                              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50'
                              : t.status === 'on_leave'
                              ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50'
                              : t.status === 'retired'
                              ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
                          }`}
                        >
                          {getTeacherStatusLabel(t.status)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(t)}
                            className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 cursor-pointer transition-colors border border-zinc-200 dark:border-zinc-700"
                            title={isReadOnly ? 'មើលព័ត៌មាន' : 'កែប្រែ'}
                          >
                            {isReadOnly ? <Eye className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
                          </button>
                          {!isReadOnly && (
                            <button
                              onClick={() => handleDelete(t.id, t.nameKhmer)}
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
        /* Teachers Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeachers.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-[#131f1a] rounded-3xl p-12 text-center text-zinc-400 border border-emerald-900/10 dark:border-emerald-800/30">
              <UserCheck className="w-8 h-8 text-zinc-400 dark:text-zinc-500 mx-auto mb-2" />
              <p className="font-bold text-zinc-700 dark:text-zinc-200">ពុំមានទិន្នន័យសាស្ត្រាចារ្យទេ</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">សូមសាកល្បងផ្លាស់ប្តូរលក្ខខណ្ឌ Filter ឬបន្ថែម/Import សាស្ត្រាចារ្យ</p>
            </div>
          ) : (
            filteredTeachers.map((t) => (
              <div
                key={t.id}
                className="bg-white dark:bg-[#131f1a] rounded-3xl p-5 border border-emerald-900/10 dark:border-emerald-800/30 shadow-xs hover:border-emerald-500/40 dark:hover:border-emerald-600/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      {/* Clickable Teacher Avatar */}
                      <button
                        type="button"
                        onClick={() => handleOpenPhotoViewer(t)}
                        className="relative group w-12 h-12 rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-xs shrink-0 cursor-pointer focus:outline-hidden"
                        title="ចុចដើម្បីមើលរូបថតពេញទំហំ (Click to View Full Photo)"
                      >
                        {t.photoUrl ? (
                          <img
                            src={t.photoUrl}
                            alt={t.nameKhmer}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div
                            className={`w-full h-full flex items-center justify-center font-bold text-sm ${
                              t.gender === 'female'
                                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200'
                                : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200'
                            }`}
                          >
                            {(t.nameKhmer || t.nameLatin || 'T').charAt(0)}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                          <ZoomIn className="w-4 h-4" />
                        </div>
                      </button>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{t.nameKhmer}</h3>
                          {t.nameChinese && (
                            <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/40">
                              {t.nameChinese}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">{t.nameLatin || '-'}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
                            {t.teacherCode}
                          </span>
                          {t.degree && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-medium truncate max-w-[120px]">
                              {t.degree}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                        t.status === 'active'
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                          : t.status === 'on_leave'
                          ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                          : t.status === 'retired'
                          ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {getTeacherStatusLabel(t.status)}
                    </span>
                  </div>

                  {/* Subjects & Contact */}
                  <div className="space-y-2 text-xs py-3 border-y border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-start gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">មុខវិជ្ជា: </span>
                        <span className="text-zinc-700 dark:text-zinc-300 font-medium">{t.subjects || 'មិនទាន់បញ្ជាក់'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <CalendarCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">វេនបង្រៀន: </span>
                        <span className="text-zinc-700 dark:text-zinc-300 font-medium">{getShiftLabel(t.shift || 'morning')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className={`text-zinc-700 dark:text-zinc-300 font-medium ${isReadOnly ? 'filter blur-[5px] select-none pointer-events-none opacity-70 font-mono' : ''}`}>
                        {t.phone || '-'}
                      </span>
                    </div>

                    {t.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className={`text-zinc-600 dark:text-zinc-400 truncate font-medium ${isReadOnly ? 'filter blur-[4.5px] select-none pointer-events-none opacity-70' : ''}`}>
                          {t.email}
                        </span>
                      </div>
                    )}

                    {/* CV document badge if uploaded */}
                    {t.cvName && (
                      <div className="flex items-center justify-between pt-1 text-[11px] bg-emerald-50/60 dark:bg-emerald-950/30 px-2.5 py-1.5 rounded-xl border border-emerald-200/50 dark:border-emerald-800/40">
                        <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-medium truncate">
                          <FileCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className={`truncate ${isReadOnly ? 'filter blur-[3px] select-none pointer-events-none opacity-70 max-w-[80px]' : ''}`}>
                            {isReadOnly ? 'CV_Teacher_File.pdf' : t.cvName}
                          </span>
                        </div>
                        {t.cvUrl && !isReadOnly && (
                          <a
                            href={t.cvUrl}
                            download={t.cvName}
                            className="text-emerald-700 dark:text-emerald-300 font-bold hover:underline shrink-0 text-[10px]"
                          >
                            ទាញយក CV
                          </a>
                        )}
                        {isReadOnly && (
                          <span className="text-amber-700 dark:text-amber-400 font-bold shrink-0 text-[10px] flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" /> ការពារ
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openEditModal(t)}
                    className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs inline-flex items-center gap-1 transition-colors cursor-pointer border border-zinc-200 dark:border-zinc-700"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>{isReadOnly ? 'មើលព័ត៌មាន' : 'កែប្រែ'}</span>
                  </button>
                  {!isReadOnly && (
                    <button
                      onClick={() => handleDelete(t.id, t.nameKhmer)}
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

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#131f1a] rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-emerald-900/20 dark:border-emerald-800/50 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
                  {isReadOnly ? 'ព័ត៌មានលម្អិតសាស្ត្រាចារ្យ (Faculty Profile)' : editingTeacher ? 'កែប្រែព័ត៌មានសាស្ត្រាចារ្យ' : 'បន្ថែមសាស្ត្រាចារ្យថ្មី'}
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

            <form onSubmit={handleSave} noValidate className="space-y-3.5 text-xs">
              {/* Guest Read-Only Privacy Notice */}
              {isReadOnly && (
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-200 animate-in fade-in duration-200">
                  <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <p className="font-semibold leading-relaxed">
                    <b>របៀបភ្ញៀវ (Guest Mode):</b> ព័ត៌មានឯកជនភាពផ្ទាល់ខ្លួន (លេខទូរស័ព្ទ, អ៊ីមែល, CV, កំណត់សម្គាល់) ត្រូវបាន Blur ការពារសុវត្ថិភាព។
                  </p>
                </div>
              )}

              {/* Photo Upload & Preview */}
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative w-13 h-13 rounded-2xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 border-2 border-emerald-500/40 flex items-center justify-center shrink-0 shadow-xs">
                    {formPhotoUrl ? (
                      <img
                        src={formPhotoUrl}
                        alt="Teacher"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Camera className="w-5 h-5 text-zinc-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-xs flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>រូបថតសាស្ត្រាចារ្យ (Photo)</span>
                    </h4>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">JPG, PNG, WebP (អតិបរមា 3MB)</p>
                  </div>
                </div>

                {!isReadOnly && (
                  <div className="flex items-center gap-1.5">
                    <label className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer shadow-xs">
                      <Camera className="w-3.5 h-3.5" />
                      <span>{formPhotoUrl ? 'ប្តូររូប' : 'ជ្រើសរើសរូប'}</span>
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
                        className="px-2 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold text-[11px] border border-rose-200 dark:border-rose-800/60 cursor-pointer"
                      >
                        លុប
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Status Buttons Selector */}
              <div>
                <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1.5">
                  ស្ថានភាពបង្រៀន (Status) *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    disabled={isReadOnly}
                    onClick={() => setFormStatus('active')}
                    className={`py-2 px-2 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                      isReadOnly ? 'cursor-default' : 'cursor-pointer'
                    } ${
                      formStatus === 'active'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-zinc-50 dark:bg-[#182620] border-zinc-200 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                    <span>កំពុងបង្រៀន</span>
                  </button>

                  <button
                    type="button"
                    disabled={isReadOnly}
                    onClick={() => setFormStatus('on_leave')}
                    className={`py-2 px-2 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                      isReadOnly ? 'cursor-default' : 'cursor-pointer'
                    } ${
                      formStatus === 'on_leave'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-zinc-50 dark:bg-[#182620] border-zinc-200 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                    <span>សុំច្បាប់</span>
                  </button>

                  <button
                    type="button"
                    disabled={isReadOnly}
                    onClick={() => setFormStatus('resigned')}
                    className={`py-2 px-2 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                      isReadOnly ? 'cursor-default' : 'cursor-pointer'
                    } ${
                      formStatus === 'resigned'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-zinc-50 dark:bg-[#182620] border-zinc-200 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
                    <span>ឈប់បង្រៀន</span>
                  </button>

                  <button
                    type="button"
                    disabled={isReadOnly}
                    onClick={() => setFormStatus('retired')}
                    className={`py-2 px-2 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                      isReadOnly ? 'cursor-default' : 'cursor-pointer'
                    } ${
                      formStatus === 'retired'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-zinc-50 dark:bg-[#182620] border-zinc-200 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
                    <span>ចូលនិវត្តន៍</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">អត្តលេខគ្រូ (Teacher Code)</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={formTeacherCode}
                  onChange={(e) => setFormTeacherCode(e.target.value)}
                  placeholder="ICI-TCH-001"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden font-mono disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">ឈ្មោះខ្មែរ *</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={formNameKhmer}
                    onChange={(e) => setFormNameKhmer(e.target.value)}
                    placeholder="ឡុង សុខា"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">ឈ្មោះឡាតាំង</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={formNameLatin}
                    onChange={(e) => setFormNameLatin(e.target.value)}
                    placeholder="Long Sokha"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">ឈ្មោះចិន (Chinese)</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={formNameChinese}
                    onChange={(e) => setFormNameChinese(e.target.value)}
                    placeholder="龙索卡"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">ភេទ</label>
                  <select
                    disabled={isReadOnly}
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <option value="male">ប្រុស (Male)</option>
                    <option value="female">ស្រី (Female)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                    <span>លេខទូរស័ព្ទ</span>
                    {isReadOnly && <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold ml-1">🔒(Blur)</span>}
                  </label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="012 889 901"
                    className={`w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden disabled:opacity-75 disabled:cursor-not-allowed ${
                      isReadOnly ? 'filter blur-[5px] select-none pointer-events-none opacity-60 bg-zinc-100 dark:bg-zinc-800' : ''
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">វេនបង្រៀន</label>
                  <select
                    disabled={isReadOnly}
                    value={formShift}
                    onChange={(e) => setFormShift(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <option value="morning">វេនព្រឹក (Morning)</option>
                    <option value="afternoon">វេនរសៀល (Afternoon)</option>
                    <option value="evening">វេនយប់ (Evening)</option>
                    <option value="weekend">ចុងសប្តាហ៍ (Weekend)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">កម្រិតសញ្ញាបត្រ (Degree)</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={formDegree}
                    onChange={(e) => setFormDegree(e.target.value)}
                    placeholder="ឧ. បរិញ្ញាបត្រជាន់ខ្ពស់ / បណ្ឌិត"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden disabled:opacity-75 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                  <span>អ៊ីមែល (Email)</span>
                  {isReadOnly && <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold ml-1">🔒(Blur)</span>}
                </label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="teacher@ici.edu.kh"
                  className={`w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden disabled:opacity-75 disabled:cursor-not-allowed ${
                    isReadOnly ? 'filter blur-[4.5px] select-none pointer-events-none opacity-60 bg-zinc-100 dark:bg-zinc-800' : ''
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">មុខវិជ្ជាទទួលបន្ទុក</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={formSubjects}
                  onChange={(e) => setFormSubjects(e.target.value)}
                  placeholder="គរុកោសល្យទូទៅ, វេយ្យាករណ៍ភាសាចិន..."
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>

              {/* CV Attachment Upload Bar */}
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 text-xs flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>ឯកសារប្រវត្តិរូបសង្ខេប (CV / Resume)</span>
                    {isReadOnly && <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold ml-1">🔒(Blur)</span>}
                  </span>
                  {!isReadOnly && (
                    <label className="px-2.5 py-1 rounded-xl bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 text-zinc-800 dark:text-zinc-200 font-bold text-[10.5px] inline-flex items-center gap-1 cursor-pointer">
                      <Upload className="w-3 h-3" />
                      <span>{formCvName ? 'ប្តូរ CV' : 'ជ្រើសរើសឯកសារ CV'}</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={handleCvUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {formCvName ? (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/40">
                    <div className="flex items-center gap-1.5 text-emerald-900 dark:text-emerald-300 font-medium truncate text-[11px]">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className={`truncate ${isReadOnly ? 'filter blur-[3px] select-none pointer-events-none opacity-60 max-w-[120px]' : ''}`}>
                        {isReadOnly ? 'CV_Teacher_File.pdf' : formCvName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {formCvUrl && !isReadOnly && (
                        <a
                          href={formCvUrl}
                          download={formCvName}
                          className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-700"
                        >
                          ទាញយក
                        </a>
                      )}
                      {isReadOnly && (
                        <span className="text-amber-700 dark:text-amber-400 font-bold text-[10px] flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5" /> ការពារ
                        </span>
                      )}
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => {
                            setFormCvName(undefined);
                            setFormCvUrl(undefined);
                          }}
                          className="text-rose-600 dark:text-rose-400 font-bold text-[10px] hover:underline cursor-pointer"
                        >
                          ដកចេញ
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    គាំទ្រឯកសារ PDF, DOC, DOCX (អតិបរមា 8MB)
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                  <span>កំណត់សម្គាល់បន្ថែម (Notes)</span>
                  {isReadOnly && <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold ml-1">🔒(Blur)</span>}
                </label>
                <textarea
                  rows={2}
                  disabled={isReadOnly}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="កំណត់សម្គាល់បន្ថែមអំពីសាស្ត្រាចារ្យ..."
                  className={`w-full px-3 py-2 bg-zinc-50 dark:bg-[#182620] border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden resize-none disabled:opacity-75 disabled:cursor-not-allowed ${
                    isReadOnly ? 'filter blur-[5px] select-none pointer-events-none opacity-60 bg-zinc-100 dark:bg-zinc-800' : ''
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingTeacher(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold cursor-pointer transition-colors border border-zinc-200 dark:border-zinc-700"
                >
                  {isReadOnly ? 'បិទ (Close)' : 'បោះបង់'}
                </button>
                {!isReadOnly && (
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>កំពុងរក្សាទុក...</span>
                      </>
                    ) : (
                      <span>{editingTeacher ? 'ធ្វើបច្ចុប្បន្នភាព (Update)' : 'រក្សាទុក (Save)'}</span>
                    )}
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
          <div className="bg-white dark:bg-[#131f1a] rounded-3xl p-6 max-w-md w-full border border-rose-200 dark:border-rose-900/50 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                តើអ្នកពិតជាចង់លុបទិន្នន័យសាស្ត្រាចារ្យទាំងអស់មែនទេ?
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium">
                សកម្មភាពនេះនឹងលុបទិន្នន័យសាស្ត្រាចារ្យទាំងអស់ចំនួន <strong className="text-rose-600 dark:text-rose-400 font-bold">{teachers.length} នាក់</strong> ចេញពីប្រព័ន្ធជាអចិន្ត្រៃយ៍។
              </p>
            </div>

            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 rounded-2xl p-3 text-xs text-rose-800 dark:text-rose-200 space-y-1">
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
                className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs transition-colors cursor-pointer border border-zinc-200 dark:border-zinc-700"
              >
                បោះបង់ (Cancel)
              </button>
              <button
                type="button"
                onClick={handleDeleteAllTeachers}
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

      {/* Profile Image Viewer Modal */}
      <ProfileImageViewerModal
        isOpen={isImageViewerOpen}
        onClose={() => {
          setIsImageViewerOpen(false);
          setImageViewerTarget(null);
        }}
        target={imageViewerTarget}
      />
    </div>
  );
};
