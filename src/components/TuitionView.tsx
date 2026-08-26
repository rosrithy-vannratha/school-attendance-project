import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Award,
  CreditCard,
  Plus,
  Search,
  Filter,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Edit2,
  Trash2,
  FileSpreadsheet,
  Printer,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Building2,
  Calendar,
  User,
  Percent,
  Receipt,
  X
} from 'lucide-react';
import {
  Student,
  TuitionPayment,
  ScholarshipType,
  PaymentStatus,
  PaymentMethod,
  Classroom,
  Major
} from '../types';
import { SCHOLARSHIP_OPTIONS } from '../data/initialData';
import { instituteService } from '../service/instituteService';
import icetiLogo from '../assets/images/icetilogo.jpg';

interface TuitionViewProps {
  students: Student[];
  classes: Classroom[];
  majors: Major[];
  payments: TuitionPayment[];
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  isReadOnly: boolean;
}

export const TuitionView: React.FC<TuitionViewProps> = ({
  students,
  classes,
  majors,
  payments,
  showToast,
  isReadOnly
}) => {
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScholarship, setSelectedScholarship] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<TuitionPayment | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptTarget, setReceiptTarget] = useState<TuitionPayment | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formStudentId, setFormStudentId] = useState(students[0]?.id || '');
  const [formAcademicYear, setFormAcademicYear] = useState('2025-2026');
  const [formTerm, setFormTerm] = useState<TuitionPayment['term']>('Semester 1');
  const [formScholarshipType, setFormScholarshipType] = useState<ScholarshipType>('self_funded');
  const [formDiscountPercent, setFormDiscountPercent] = useState<number>(0);
  const [formOriginalAmount, setFormOriginalAmount] = useState<number>(600);
  const [formPaidAmount, setFormPaidAmount] = useState<number>(600);
  const [formPaymentMethod, setFormPaymentMethod] = useState<PaymentMethod>('aba_pay');
  const [formTransactionRef, setFormTransactionRef] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Auto calculate discount & final amounts
  const formDiscountAmount = (formOriginalAmount * formDiscountPercent) / 100;
  const formFinalAmount = Math.max(0, formOriginalAmount - formDiscountAmount);
  const formDueAmount = Math.max(0, formFinalAmount - formPaidAmount);

  // Handle student selection in form
  const handleStudentChange = (stuId: string) => {
    setFormStudentId(stuId);
    const stu = students.find((s) => s.id === stuId);
    if (stu) {
      // Default standard fee based on class type
      if (stu.classType === 'master') setFormOriginalAmount(900);
      else if (stu.classType === 'phd') setFormOriginalAmount(1500);
      else if (stu.classType === 'chinese_general') setFormOriginalAmount(250);
      else setFormOriginalAmount(600);
    }
  };

  // Handle scholarship selection in form
  const handleScholarshipChange = (schType: ScholarshipType) => {
    setFormScholarshipType(schType);
    const opt = SCHOLARSHIP_OPTIONS.find((o) => o.id === schType);
    if (opt) {
      setFormDiscountPercent(opt.discountPercentage);
      const disc = (formOriginalAmount * opt.discountPercentage) / 100;
      const fin = Math.max(0, formOriginalAmount - disc);
      setFormPaidAmount(fin);
    }
  };

  const openAddModal = () => {
    setEditingPayment(null);
    const firstStu = students[0];
    setFormStudentId(firstStu?.id || '');
    setFormAcademicYear('2025-2026');
    setFormTerm('Semester 1');
    setFormScholarshipType('self_funded');
    setFormDiscountPercent(0);
    setFormOriginalAmount(600);
    setFormPaidAmount(600);
    setFormPaymentMethod('aba_pay');
    setFormTransactionRef(`TX-${Math.floor(100000 + Math.random() * 900000)}`);
    setFormDueDate('');
    setFormNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: TuitionPayment) => {
    setEditingPayment(p);
    setFormStudentId(p.studentId);
    setFormAcademicYear(p.academicYear || '2025-2026');
    setFormTerm(p.term || 'Semester 1');
    setFormScholarshipType(p.scholarshipType);
    setFormDiscountPercent(p.discountPercentage);
    setFormOriginalAmount(p.originalAmount);
    setFormPaidAmount(p.paidAmount);
    setFormPaymentMethod(p.paymentMethod || 'aba_pay');
    setFormTransactionRef(p.transactionRef || '');
    setFormDueDate(p.dueDate || '');
    setFormNotes(p.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនអាចកែប្រែទិន្នន័យបានទេ!', 'info');
      return;
    }

    const stu = students.find((s) => s.id === formStudentId);
    if (!stu) {
      showToast('សូមជ្រើសរើសនិស្សិត!', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const discAmt = (formOriginalAmount * formDiscountPercent) / 100;
      const finAmt = Math.max(0, formOriginalAmount - discAmt);
      const dueAmt = Math.max(0, finAmt - formPaidAmount);

      let calcStatus: PaymentStatus = 'paid';
      if (formScholarshipType === 'full' || formDiscountPercent === 100) {
        calcStatus = 'waived';
      } else if (formPaidAmount >= finAmt && finAmt > 0) {
        calcStatus = 'paid';
      } else if (formPaidAmount > 0 && formPaidAmount < finAmt) {
        calcStatus = 'partial';
      } else {
        calcStatus = 'pending';
      }

      const invNo = editingPayment?.invoiceNumber || `INV-${new Date().getFullYear()}-${String(payments.length + 1).padStart(3, '0')}`;

      const paymentRecord: TuitionPayment = {
        id: editingPayment?.id || `pay_${Date.now()}_${stu.id}`,
        studentId: stu.id,
        studentCode: stu.studentCode,
        studentName: stu.nameKhmer || stu.nameLatin,
        academicYear: formAcademicYear,
        term: formTerm,
        scholarshipType: formScholarshipType,
        discountPercentage: formDiscountPercent,
        originalAmount: formOriginalAmount,
        discountAmount: discAmt,
        finalAmount: finAmt,
        paidAmount: formPaidAmount,
        dueAmount: dueAmt,
        status: calcStatus,
        paymentDate: calcStatus === 'paid' || calcStatus === 'partial' ? new Date().toISOString().split('T')[0] : undefined,
        paymentMethod: formPaymentMethod,
        transactionRef: formTransactionRef.trim() || undefined,
        invoiceNumber: invNo,
        recordedBy: 'Admin (ការិយាល័យហិរញ្ញវត្ថុ)',
        dueDate: formDueDate || undefined,
        notes: formNotes.trim() || undefined,
        createdAt: editingPayment?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await instituteService.savePayment(paymentRecord);
      setIsModalOpen(false);
      showToast(editingPayment ? 'បានកែប្រែព័ត៌មានបង់ប្រាក់ជោគជ័យ!' : 'បានចុះបញ្ជីបង់ប្រាក់ថ្មីជោគជ័យ!', 'success');
    } catch (err) {
      console.error(err);
      showToast('មានបញ្ហាក្នុងការរក្សាទុកទិន្នន័យ!', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (p: TuitionPayment) => {
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនអាចលុបទិន្នន័យបានទេ!', 'info');
      return;
    }
    if (!window.confirm(`តើអ្នកពិតជាចង់លុបកំណត់ត្រាបង់ប្រាក់របស់ ${p.studentName} (${p.invoiceNumber}) ឬ?`)) {
      return;
    }
    try {
      await instituteService.deletePayment(p.id);
      showToast('បានលុបកំណត់ត្រាបង់ប្រាក់រួចរាល់!', 'success');
    } catch (err) {
      showToast('បរាជ័យក្នុងការលុប', 'error');
    }
  };

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchSearch =
        p.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.transactionRef && p.transactionRef.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchSch = selectedScholarship === 'all' || p.scholarshipType === selectedScholarship;
      const matchStatus = selectedStatus === 'all' || p.status === selectedStatus;
      const matchYear = selectedYear === 'all' || p.academicYear === selectedYear;

      return matchSearch && matchSch && matchStatus && matchYear;
    });
  }, [payments, searchTerm, selectedScholarship, selectedStatus, selectedYear]);

  // Statistics
  const stats = useMemo(() => {
    let totalCollected = 0;
    let totalDue = 0;
    let totalScholarshipSubsidy = 0;
    let fullScholarships = 0;
    let partialScholarships = 0;
    let selfFunded = 0;

    payments.forEach((p) => {
      totalCollected += Number(p.paidAmount || 0);
      totalDue += Number(p.dueAmount || 0);
      totalScholarshipSubsidy += Number(p.discountAmount || 0);

      if (p.scholarshipType === 'full' || p.scholarshipType === 'government') {
        fullScholarships++;
      } else if (p.scholarshipType === 'partial_50' || p.scholarshipType === 'partial_30' || p.scholarshipType === 'special_grant') {
        partialScholarships++;
      } else {
        selfFunded++;
      }
    });

    return {
      totalCollected,
      totalDue,
      totalScholarshipSubsidy,
      fullScholarships,
      partialScholarships,
      selfFunded,
      totalCount: payments.length
    };
  }, [payments]);

  // Export to CSV
  const handleExportCSV = () => {
    if (isReadOnly) {
      showToast('គណនីភ្ញៀវមិនអាចទាញយកទិន្នន័យបានទេ!', 'info');
      return;
    }
    const headers = ['វិក្កយបត្រ (Invoice)', 'អត្តលេខ', 'ឈ្មោះនិស្សិត', 'ឆ្នាំសិក្សា', 'ឆមាស/វគ្គ', 'ប្រភេទអាហារូបករណ៍', 'តម្លៃពេញ ($)', 'បញ្ចុះតម្លៃ ($)', 'តម្លៃត្រូវបង់ ($)', 'បានបង់ ($)', 'នៅខ្វះ ($)', 'ស្ថានភាព', 'វិធីបង់ប្រាក់', 'កាលបរិច្ឆេទ'];
    const rows = filteredPayments.map((p) => [
      p.invoiceNumber || '-',
      p.studentCode,
      p.studentName,
      p.academicYear,
      p.term,
      p.scholarshipType,
      p.originalAmount,
      p.discountAmount,
      p.finalAmount,
      p.paidAmount,
      p.dueAmount,
      p.status,
      p.paymentMethod || 'cash',
      p.paymentDate || '-'
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ICETI_Tuition_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('បានទាញយករបាយការណ៍បង់ថ្លៃសិក្សាជា CSV!', 'success');
  };

  const openReceipt = (p: TuitionPayment) => {
    setReceiptTarget(p);
    setIsReceiptModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#111e17] p-5 rounded-2xl border border-zinc-200 dark:border-emerald-900/40 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-700 dark:text-emerald-400" />
            <span>ការគ្រប់គ្រងថ្លៃសិក្សា និងអាហារូបករណ៍ (Tuition & Scholarships)</span>
          </h2>
          <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-1">
            តាមដានស្ថានភាពបង់ប្រាក់ បញ្ចុះតម្លៃ អាហារូបករណ៍ពេញលេញ និងចេញវិក្កយបត្រឌីជីថល
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold flex items-center gap-1.5 border border-zinc-300 dark:border-zinc-700 cursor-pointer transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Export Excel</span>
          </button>

          {!isReadOnly && (
            <button
              onClick={openAddModal}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>កត់ត្រាការបង់ប្រាក់ថ្មី</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collected */}
        <div className="bg-white dark:bg-[#111e17] p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">ចំណូលប្រមូលបានសរុប</span>
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-2">
            ${stats.totalCollected.toLocaleString()}
          </p>
          <p className="text-[11px] text-zinc-700 dark:text-zinc-300 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
            <span>ពីនិស្សិតចំនួន {stats.totalCount} នាក់</span>
          </p>
        </div>

        {/* Total Due / Outstanding */}
        <div className="bg-white dark:bg-[#111e17] p-4 rounded-2xl border border-rose-200 dark:border-rose-900/40 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">ប្រាក់នៅខ្វះ (បំណុលថ្លៃសិក្សា)</span>
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-700 dark:text-rose-400 mt-2">
            ${stats.totalDue.toLocaleString()}
          </p>
          <p className="text-[11px] text-zinc-700 dark:text-zinc-300 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-rose-700 dark:text-rose-400" />
            <span>កំពុងរង់ចាំការទូទាត់បញ្ចប់</span>
          </p>
        </div>

        {/* Scholarships Grant Value */}
        <div className="bg-white dark:bg-[#111e17] p-4 rounded-2xl border border-purple-200 dark:border-purple-900/40 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">ទំហំឧបត្ថម្ភអាហារូបករណ៍</span>
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-700 dark:text-purple-400 mt-2">
            ${stats.totalScholarshipSubsidy.toLocaleString()}
          </p>
          <p className="text-[11px] text-zinc-700 dark:text-zinc-300 mt-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-700 dark:text-purple-400" />
            <span>អាហារូបករណ៍ពេញលេញ {stats.fullScholarships} នាក់</span>
          </p>
        </div>

        {/* Scholarship Breakdown */}
        <div className="bg-white dark:bg-[#111e17] p-4 rounded-2xl border border-blue-200 dark:border-blue-900/40 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">ប្រភេទនិស្សិតទទួលឧបត្ថម្ភ</span>
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 space-y-1">
            <div className="flex justify-between">
              <span>អាហារូបករណ៍ ១០០%៖</span>
              <span className="text-emerald-700 dark:text-emerald-400">{stats.fullScholarships} នាក់</span>
            </div>
            <div className="flex justify-between">
              <span>អាហារូបករណ៍ ៣០-៧០%៖</span>
              <span className="text-blue-700 dark:text-blue-400">{stats.partialScholarships} នាក់</span>
            </div>
            <div className="flex justify-between">
              <span>បង់ថ្លៃផ្ទាល់ខ្លួន (Self)៖</span>
              <span className="text-zinc-800 dark:text-zinc-200">{stats.selfFunded} នាក់</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#111e17] p-4 rounded-2xl border border-zinc-200 dark:border-emerald-900/40 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ស្វែងរកតាមឈ្មោះ អត្តលេខ ឬលេខវិក្កយបត្រ (Invoice)..."
            className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Scholarship Filter */}
        <select
          value={selectedScholarship}
          onChange={(e) => setSelectedScholarship(e.target.value)}
          aria-label="ជ្រើសរើសប្រភេទអាហារូបករណ៍"
          className="px-3 py-2 bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">គ្រប់អាហារូបករណ៍ (All)</option>
          {SCHOLARSHIP_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.nameKhmer}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          aria-label="ជ្រើសរើសស្ថានភាពបង់ប្រាក់"
          className="px-3 py-2 bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">គ្រប់ស្ថានភាព (All Status)</option>
          <option value="paid">បង់គ្រប់ចំនួន (Paid)</option>
          <option value="partial">បង់មួយផ្នែក (Partial)</option>
          <option value="pending">មិនទាន់បង់ (Pending)</option>
          <option value="waived">លើកលែងថ្លៃ/អាហារូបករណ៍ (Waived)</option>
        </select>
      </div>

      {/* Payments Table */}
      <div className="bg-white dark:bg-[#111e17] rounded-2xl border border-zinc-200 dark:border-emerald-900/40 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold">
                <th className="py-3.5 px-4">វិក្កយបត្រ (Invoice)</th>
                <th className="py-3.5 px-4">និស្សិត</th>
                <th className="py-3.5 px-4">ឆ្នាំសិក្សា & ឆមាស</th>
                <th className="py-3.5 px-4">អាហារូបករណ៍</th>
                <th className="py-3.5 px-4 text-right">តម្លៃពេញ</th>
                <th className="py-3.5 px-4 text-right">បានបង់</th>
                <th className="py-3.5 px-4 text-right">នៅខ្វះ</th>
                <th className="py-3.5 px-4 text-center">ស្ថានភាព</th>
                <th className="py-3.5 px-4 text-center">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-zinc-600 dark:text-zinc-400">
                    មិនមានទិន្នន័យបង់ប្រាក់ត្រូវនឹងលក្ខខណ្ឌស្វែងរកទេ
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const schOpt = SCHOLARSHIP_OPTIONS.find((o) => o.id === p.scholarshipType);

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40 transition-colors"
                    >
                      {/* Invoice No */}
                      <td className="py-3 px-4 font-mono font-bold text-emerald-800 dark:text-emerald-300">
                        {p.invoiceNumber || 'INV-TEMP'}
                      </td>

                      {/* Student Info */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100">
                          {p.studentName}
                        </div>
                        <div className="text-[11px] text-zinc-600 dark:text-zinc-400 font-mono">
                          {p.studentCode}
                        </div>
                      </td>

                      {/* Term & Year */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-zinc-800 dark:text-zinc-200">{p.term}</div>
                        <div className="text-[11px] text-zinc-600 dark:text-zinc-400">{p.academicYear}</div>
                      </td>

                      {/* Scholarship Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${
                            schOpt?.badgeBg || 'bg-zinc-100 border-zinc-300'
                          } ${schOpt?.badgeText || 'text-zinc-800'}`}
                        >
                          <Award className="w-3 h-3" />
                          <span>{schOpt?.nameKhmer || p.scholarshipType}</span>
                        </span>
                      </td>

                      {/* Original Amount */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-zinc-800 dark:text-zinc-200">
                        ${p.originalAmount}
                      </td>

                      {/* Paid Amount */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        ${p.paidAmount}
                      </td>

                      {/* Due Amount */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-700 dark:text-rose-400">
                        ${p.dueAmount}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {p.status === 'paid' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>បង់រួចរាល់</span>
                          </span>
                        )}
                        {p.status === 'partial' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <Clock className="w-3 h-3" />
                            <span>បង់មួយផ្នែក</span>
                          </span>
                        )}
                        {p.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            <AlertCircle className="w-3 h-3" />
                            <span>មិនទាន់បង់</span>
                          </span>
                        )}
                        {p.status === 'waived' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            <Award className="w-3 h-3" />
                            <span>អាហារូបករណ៍ ១០០%</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openReceipt(p)}
                            title="មើល និងបោះពុម្ពបង្កាន់ដៃបង់ប្រាក់"
                            className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          </button>

                          {!isReadOnly && (
                            <>
                              <button
                                onClick={() => openEditModal(p)}
                                title="កែប្រែព័ត៌មានបង់ប្រាក់"
                                className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                              </button>
                              <button
                                onClick={() => handleDelete(p)}
                                title="លុបកំណត់ត្រា"
                                className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                              </button>
                            </>
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

      {/* ADD / EDIT TUITION PAYMENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#111e17] border border-zinc-200 dark:border-emerald-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-emerald-50/50 dark:bg-emerald-950/30">
              <h3 className="font-extrabold text-zinc-900 dark:text-zinc-100 text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span>{editingPayment ? 'កែប្រែព័ត៌មានបង់ប្រាក់' : 'ចុះបញ្ជីការបង់ប្រាក់ & អាហារូបករណ៍'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto text-xs">
              {/* Student Select */}
              <div>
                <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                  ជ្រើសរើសនិស្សិត *
                </label>
                <select
                  value={formStudentId}
                  onChange={(e) => handleStudentChange(e.target.value)}
                  required
                  className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl font-bold text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.studentCode} - {s.nameKhmer} ({s.nameLatin}) [{s.className || s.majorName}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Term & Academic Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                    ឆ្នាំសិក្សា (Academic Year)
                  </label>
                  <input
                    type="text"
                    value={formAcademicYear}
                    onChange={(e) => setFormAcademicYear(e.target.value)}
                    required
                    className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                    ឆមាស / វគ្គសិក្សា (Term)
                  </label>
                  <select
                    value={formTerm}
                    onChange={(e) => setFormTerm(e.target.value as any)}
                    className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl font-bold text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Semester 1">ឆមាសទី ១ (Semester 1)</option>
                    <option value="Semester 2">ឆមាសទី ២ (Semester 2)</option>
                    <option value="Full Year">ពេញមួយឆ្នាំ (Full Year)</option>
                    <option value="Short Course">វគ្គបណ្តុះបណ្តាលខ្លី (Short Course)</option>
                  </select>
                </div>
              </div>

              {/* Scholarship Tier */}
              <div>
                <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                  ប្រភេទអាហារូបករណ៍ (Scholarship Tier)
                </label>
                <select
                  value={formScholarshipType}
                  onChange={(e) => handleScholarshipChange(e.target.value as ScholarshipType)}
                  className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl font-bold text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {SCHOLARSHIP_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.nameKhmer} (បញ្ចុះ {opt.discountPercentage}%)
                    </option>
                  ))}
                </select>
              </div>

              {/* Financial Calculations Box */}
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-700 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      តម្លៃដើម ($)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formOriginalAmount}
                      onChange={(e) => setFormOriginalAmount(Number(e.target.value))}
                      required
                      className="w-full p-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg font-bold text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      បញ្ចុះតម្លៃ (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={formDiscountPercent}
                      onChange={(e) => setFormDiscountPercent(Number(e.target.value))}
                      className="w-full p-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg font-bold text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      តម្លៃត្រូវបង់ ($)
                    </label>
                    <input
                      type="number"
                      readOnly
                      value={formFinalAmount}
                      className="w-full p-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg font-bold text-emerald-700 dark:text-emerald-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-700">
                  <div>
                    <label className="block font-bold text-emerald-800 dark:text-emerald-400 mb-1">
                      ប្រាក់បានបង់ជាក់ស្តែង ($) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={formFinalAmount}
                      value={formPaidAmount}
                      onChange={(e) => setFormPaidAmount(Number(e.target.value))}
                      required
                      className="w-full p-2 bg-white dark:bg-zinc-800 border border-emerald-400 dark:border-emerald-600 rounded-lg font-bold text-emerald-700 dark:text-emerald-300"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-rose-800 dark:text-rose-400 mb-1">
                      ប្រាក់នៅខ្វះ ($)
                    </label>
                    <input
                      type="number"
                      readOnly
                      value={formDueAmount}
                      className="w-full p-2 bg-zinc-100 dark:bg-zinc-900 border border-rose-300 dark:border-rose-700 rounded-lg font-bold text-rose-700 dark:text-rose-400"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method & Ref */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                    វិធីសាស្ត្រទូទាត់
                  </label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl font-bold text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="aba_pay">ABA KHQR / ABA Mobile</option>
                    <option value="acleda_khqr">ACLEDA KHQR</option>
                    <option value="wing">Wing Bank KHQR</option>
                    <option value="cash">សាច់ប្រាក់សុទ្ធ (Cash)</option>
                    <option value="bank_transfer">ផ្ទេរតាមធនាគារផ្សេងៗ</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                    លេខប្រតិបត្តិការ (Tx Reference)
                  </label>
                  <input
                    type="text"
                    value={formTransactionRef}
                    onChange={(e) => setFormTransactionRef(e.target.value)}
                    placeholder="e.g. ABA-998822"
                    className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                  កំណត់សម្គាល់បន្ថែម
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="ព័ត៌មានលម្អិតបន្ថែមអំពីការបង់ប្រាក់..."
                  className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold transition-colors cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSaving ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកកំណត់ត្រា'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE RECEIPT MODAL */}
      {isReceiptModalOpen && receiptTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white text-black border border-zinc-300 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Header with Logo */}
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <img src={icetiLogo} alt="Logo" className="w-12 h-12 object-contain" />
                <div>
                  <h4 className="font-extrabold text-sm text-black">វិទ្យាស្ថានគរុកោសល្យភាសាចិនក្នុងតំបន់</h4>
                  <p className="text-[10px] text-zinc-600 font-bold">International Chinese Education and Teachers Institute</p>
                  <p className="text-[10px] text-emerald-800 font-bold">បង្កាន់ដៃទទួលប្រាក់ថ្លៃសិក្សា (Official Receipt)</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono block text-zinc-500">Invoice No:</span>
                <span className="font-mono font-black text-sm text-emerald-800">{receiptTarget.invoiceNumber}</span>
              </div>
            </div>

            {/* Receipt Details */}
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                <div>
                  <span className="text-zinc-500 block text-[10px]">ឈ្មោះនិស្សិត៖</span>
                  <span className="font-bold text-zinc-900">{receiptTarget.studentName}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">អត្តលេខ៖</span>
                  <span className="font-mono font-bold text-zinc-900">{receiptTarget.studentCode}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">ឆ្នាំសិក្សា / ឆមាស៖</span>
                  <span className="font-bold text-zinc-900">{receiptTarget.academicYear} - {receiptTarget.term}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px]">វិធីបង់ប្រាក់៖</span>
                  <span className="font-bold text-zinc-900 uppercase">{receiptTarget.paymentMethod || 'CASH'}</span>
                </div>
              </div>

              {/* Breakdown Table */}
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-100 border-b">
                    <tr>
                      <th className="py-2 px-3">បរិយាយ</th>
                      <th className="py-2 px-3 text-right">ទឹកប្រាក់ ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-zinc-800">
                    <tr>
                      <td className="py-2 px-3">តម្លៃសិក្សាពេញកំណត់</td>
                      <td className="py-2 px-3 text-right font-mono">${receiptTarget.originalAmount}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-purple-700 font-bold">
                        បញ្ចុះអាហារូបករណ៍ ({receiptTarget.discountPercentage}%)
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-purple-700 font-bold">
                        -${receiptTarget.discountAmount}
                      </td>
                    </tr>
                    <tr className="bg-emerald-50 font-bold text-emerald-900">
                      <td className="py-2 px-3">ប្រាក់បានបង់រួចរាល់</td>
                      <td className="py-2 px-3 text-right font-mono text-base">${receiptTarget.paidAmount}</td>
                    </tr>
                    {receiptTarget.dueAmount > 0 && (
                      <tr className="bg-rose-50 font-bold text-rose-900">
                        <td className="py-2 px-3">ប្រាក់នៅខ្វះ</td>
                        <td className="py-2 px-3 text-right font-mono">${receiptTarget.dueAmount}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {receiptTarget.transactionRef && (
                <div className="text-[11px] text-zinc-600">
                  <span className="font-bold">Transaction Ref:</span> {receiptTarget.transactionRef}
                </div>
              )}
            </div>

            {/* Signature Area */}
            <div className="grid grid-cols-2 gap-4 pt-6 text-center text-xs border-t">
              <div>
                <p className="text-zinc-500 text-[11px]">ហត្ថលេខាអ្នកបង់ប្រាក់</p>
                <div className="h-12"></div>
                <p className="font-bold">{receiptTarget.studentName}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-[11px]">បេឡាធិការ / សាកលវិទ្យាធិការ</p>
                <div className="h-12 flex items-center justify-center">
                  <span className="text-[10px] text-emerald-700 font-bold border border-emerald-600 px-2 py-0.5 rounded-sm rotate-[-6deg]">
                    PAID / បានទូទាត់
                  </span>
                </div>
                <p className="font-bold">ICETI Finance Office</p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold cursor-pointer"
              >
                បិទ
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>បោះពុម្ព (Print Receipt)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
