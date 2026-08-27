import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { StudentsView } from './components/StudentsView';
import { AttendanceView } from './components/AttendanceView';
import { TuitionView } from './components/TuitionView';
import { AbsenceAlertsView } from './components/AbsenceAlertsView';
import { TeachersView } from './components/TeachersView';
import { TeacherAttendanceView } from './components/TeacherAttendanceView';
import { ClassesView } from './components/ClassesView';
import { MajorsView } from './components/MajorsView';
import { ReportsView } from './components/ReportsView';
import { LoginPage } from './components/LoginPage';
import { BackupModal } from './components/BackupModal';
import { ScholarshipsModal } from './components/ScholarshipsModal';
import { instituteService, authService } from './service/instituteService';
import { INITIAL_SHIFTS, INITIAL_STUDY_DURATIONS, INITIAL_PAYMENTS, INITIAL_ALERT_LOGS, INITIAL_SCHOLARSHIPS, INITIAL_GENERATIONS } from './data/initialData';
import {
  Student,
  Teacher,
  Classroom,
  Major,
  AttendanceRecord,
  TeacherAttendance,
  AppUser,
  ActiveTab,
  ShiftItem,
  StudyDurationItem,
  TuitionPayment,
  AbsenceAlertLog,
  ScholarshipOption,
  Generation
} from './types';
import { CheckCircle2, AlertCircle, Sparkles, GraduationCap } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [user, setUser] = useState<AppUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('cpi_theme_mode');
      if (saved !== null) return saved === 'dark';
    } catch (e) {
      console.warn(e);
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      try {
        localStorage.setItem('cpi_theme_mode', 'dark');
      } catch (e) {}
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Core Data States
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [shifts, setShifts] = useState<ShiftItem[]>(INITIAL_SHIFTS);
  const [studyDurations, setStudyDurations] = useState<StudyDurationItem[]>(INITIAL_STUDY_DURATIONS);
  const [generations, setGenerations] = useState<Generation[]>(INITIAL_GENERATIONS);
  const [scholarships, setScholarships] = useState<ScholarshipOption[]>(INITIAL_SCHOLARSHIPS);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [teacherAttendance, setTeacherAttendance] = useState<TeacherAttendance[]>([]);
  const [payments, setPayments] = useState<TuitionPayment[]>(INITIAL_PAYMENTS);
  const [alertLogs, setAlertLogs] = useState<AbsenceAlertLog[]>(INITIAL_ALERT_LOGS);

  // Modals triggered from quick action buttons
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [isScholarshipsModalOpen, setIsScholarshipsModalOpen] = useState(false);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((current) => (current?.text === text ? null : current));
    }, 3200);
  };

  // 1. Initial auth state listener & seed check
  useEffect(() => {
    const unsubAuth = authService.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });

    instituteService.seedInitialDataIfEmpty();

    return () => unsubAuth();
  }, []);

  const isReadOnly = user?.role === 'Guest' || user?.isAnonymous || !user;

  // Protect Tuition & Alerts tabs from Guest access (Unconditionally registered hook)
  useEffect(() => {
    if (isReadOnly && (activeTab === 'tuition' || activeTab === 'alerts')) {
      setActiveTab('dashboard');
    }
  }, [isReadOnly, activeTab]);

  // 2. Real-time subscriptions to Firestore collections
  useEffect(() => {
    const unsubStudents = typeof instituteService?.subscribeStudents === 'function'
      ? instituteService.subscribeStudents((data) => setStudents(data))
      : () => {};
    const unsubTeachers = typeof instituteService?.subscribeTeachers === 'function'
      ? instituteService.subscribeTeachers((data) => setTeachers(data))
      : () => {};
    const unsubClasses = typeof instituteService?.subscribeClasses === 'function'
      ? instituteService.subscribeClasses((data) => setClasses(data))
      : () => {};
    const unsubMajors = typeof instituteService?.subscribeMajors === 'function'
      ? instituteService.subscribeMajors((data) => setMajors(data))
      : () => {};
    const unsubShifts = typeof instituteService?.subscribeShifts === 'function'
      ? instituteService.subscribeShifts((data) => {
          if (data && data.length > 0) {
            setShifts(data);
          }
        })
      : () => {};
    const unsubDurations = typeof instituteService?.subscribeStudyDurations === 'function'
      ? instituteService.subscribeStudyDurations((data) => {
          if (data && data.length > 0) {
            setStudyDurations(data);
          }
        })
      : () => {};
    const unsubGenerations = typeof instituteService?.subscribeGenerations === 'function'
      ? instituteService.subscribeGenerations((data) => {
          if (data && data.length > 0) {
            setGenerations(data);
          }
        })
      : () => {};
    const unsubScholarships = typeof instituteService?.subscribeScholarships === 'function'
      ? instituteService.subscribeScholarships((data) => {
          if (data && data.length > 0) {
            setScholarships(data);
          }
        })
      : () => {};
    const unsubAttendance = typeof instituteService?.subscribeAttendance === 'function'
      ? instituteService.subscribeAttendance((data) => setAttendance(data))
      : () => {};
    const unsubTeacherAtt = typeof instituteService?.subscribeTeacherAttendance === 'function'
      ? instituteService.subscribeTeacherAttendance((data) => setTeacherAttendance(data))
      : () => {};
    const unsubPayments = typeof instituteService?.subscribePayments === 'function'
      ? instituteService.subscribePayments((data) => setPayments(data))
      : () => {};
    const unsubAlertLogs = typeof instituteService?.subscribeAlertLogs === 'function'
      ? instituteService.subscribeAlertLogs((data) => setAlertLogs(data))
      : () => {};

    return () => {
      if (typeof unsubStudents === 'function') unsubStudents();
      if (typeof unsubTeachers === 'function') unsubTeachers();
      if (typeof unsubClasses === 'function') unsubClasses();
      if (typeof unsubMajors === 'function') unsubMajors();
      if (typeof unsubShifts === 'function') unsubShifts();
      if (typeof unsubDurations === 'function') unsubDurations();
      if (typeof unsubGenerations === 'function') unsubGenerations();
      if (typeof unsubScholarships === 'function') unsubScholarships();
      if (typeof unsubAttendance === 'function') unsubAttendance();
      if (typeof unsubTeacherAtt === 'function') unsubTeacherAtt();
      if (typeof unsubPayments === 'function') unsubPayments();
      if (typeof unsubAlertLogs === 'function') unsubAlertLogs();
    };
  }, []);

  // Direct login as single Admin user
  const handleAdminLogin = () => {
    const adminUser = authService.signInAsAdmin();
    setUser(adminUser);
    showToast('បានចូលគណនីជា Admin (អ្នកគ្រប់គ្រង) ដោយជោគជ័យ', 'success');
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      setUser(null);
      showToast('បានចាកចេញពីគណនីរួចរាល់', 'info');
    } catch (e) {
      console.error(e);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b1329] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-700 flex items-center justify-center text-white shadow-md animate-pulse">
            <GraduationCap className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">កំពុងតភ្ជាប់វិទ្យាស្ថានគរុកោសល្យភាសាចិនក្នុងតំបន់...</p>
        </div>
      </div>
    );
  }

  // Show Login Page with username/password (Admin / admin123) if not logged in
  if (!user) {
    return (
      <>
        <LoginPage
          onSuccess={(loggedUser) => {
            setUser(loggedUser);
          }}
          showToast={showToast}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
        />

        {/* Toast Alert */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 backdrop-blur-md ${
                toastMessage.type === 'error'
                  ? 'bg-rose-900/90 text-white border-rose-700'
                  : toastMessage.type === 'info'
                  ? 'bg-zinc-900/90 text-white border-zinc-700'
                  : 'bg-blue-900/90 text-white border-blue-700'
              }`}
            >
              {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-sky-300" />}
              {toastMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-300" />}
              <span>{toastMessage.text}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b1329] text-zinc-900 dark:text-zinc-100 flex flex-col selection:bg-blue-600 selection:text-white font-sans antialiased transition-colors">
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogin={handleAdminLogin}
        onLogout={handleLogout}
        totalStudents={students.length}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        onOpenBackup={() => setIsBackupModalOpen(true)}
      />

      {/* Main App Content Router */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            students={students}
            teachers={teachers}
            classes={classes}
            majors={majors}
            attendance={attendance}
            shifts={shifts}
            studyDurations={studyDurations}
            setActiveTab={setActiveTab}
            isReadOnly={isReadOnly}
            onOpenAddStudent={() => {
              if (isReadOnly) {
                showToast('សូមចូលគណនី Admin ដើម្បីបន្ថែមទិន្នន័យ!', 'info');
                return;
              }
              setActiveTab('students');
              setIsAddStudentOpen(true);
            }}
            onOpenAddClass={() => {
              if (isReadOnly) {
                showToast('សូមចូលគណនី Admin ដើម្បីបន្ថែមទិន្នន័យ!', 'info');
                return;
              }
              setActiveTab('classes');
              setIsAddClassOpen(true);
            }}
          />
        )}

        {activeTab === 'students' && (
          <StudentsView
            students={students}
            classes={classes}
            majors={majors}
            shifts={shifts}
            isAddModalOpen={isAddStudentOpen}
            onCloseAddModal={() => setIsAddStudentOpen(false)}
            showToast={showToast}
            isReadOnly={isReadOnly}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceView
            students={students}
            classes={classes}
            attendance={attendance}
            showToast={showToast}
            isReadOnly={isReadOnly}
          />
        )}

        {activeTab === 'tuition' && (
          <TuitionView
            students={students}
            classes={classes}
            majors={majors}
            payments={payments}
            scholarships={scholarships}
            onOpenScholarshipsModal={() => setIsScholarshipsModalOpen(true)}
            showToast={showToast}
            isReadOnly={isReadOnly}
          />
        )}

        {activeTab === 'alerts' && (
          <AbsenceAlertsView
            students={students}
            attendance={attendance}
            classes={classes}
            alertLogs={alertLogs}
            showToast={showToast}
            isReadOnly={isReadOnly}
          />
        )}

        {activeTab === 'teachers' && (
          <TeachersView
            teachers={teachers}
            showToast={showToast}
            isReadOnly={isReadOnly}
          />
        )}

        {activeTab === 'teacher_attendance' && (
          <TeacherAttendanceView
            teachers={teachers}
            attendance={teacherAttendance}
            showToast={showToast}
            isReadOnly={isReadOnly}
          />
        )}

        {activeTab === 'classes' && (
          <ClassesView
            classes={classes}
            majors={majors}
            teachers={teachers}
            students={students}
            shifts={shifts}
            generations={generations}
            isAddModalOpen={isAddClassOpen}
            onCloseAddModal={() => setIsAddClassOpen(false)}
            showToast={showToast}
            isReadOnly={isReadOnly}
          />
        )}

        {activeTab === 'majors' && (
          <MajorsView
            majors={majors}
            classes={classes}
            students={students}
            studyDurations={studyDurations}
            showToast={showToast}
            isReadOnly={isReadOnly}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            students={students}
            teachers={teachers}
            classes={classes}
            majors={majors}
            attendance={attendance}
            showToast={showToast}
            isReadOnly={isReadOnly}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800/80 py-6 bg-white dark:bg-[#0f172a] text-center text-xs transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-zinc-600 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm">វិទ្យាស្ថានគរុកោសល្យភាសាចិនក្នុងតំបន់</span>
            <span className="text-zinc-400">&bull; International Chinese Education and Teachers Institute</span>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            ប្រព័ន្ធគ្រប់គ្រងនិស្សិត ថ្នាក់រៀន វេនសិក្សា និងវត្តមានឌីជីថល &bull; ២០២៥-២០២៦
          </p>
        </div>
      </footer>

      {/* Backup & Cloud Sync Modal */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        user={user}
        showToast={showToast}
        isReadOnly={isReadOnly}
        onRefreshData={() => {
          // Re-subscribe or state will automatically update from snapshot
        }}
      />

      {/* Scholarships Management Modal */}
      <ScholarshipsModal
        isOpen={isScholarshipsModalOpen}
        onClose={() => setIsScholarshipsModalOpen(false)}
        scholarships={scholarships}
        onSaveScholarship={async (item) => {
          await instituteService.saveScholarship(item);
        }}
        onDeleteScholarship={async (id) => {
          await instituteService.deleteScholarship(id);
        }}
        showToast={showToast}
        isReadOnly={isReadOnly}
      />

      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 backdrop-blur-md ${
              toastMessage.type === 'error'
                ? 'bg-rose-900/90 text-white border-rose-700'
                : toastMessage.type === 'info'
                ? 'bg-zinc-900/90 text-white border-zinc-700'
                : 'bg-blue-900/90 text-white border-blue-700'
            }`}
          >
            {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-sky-300" />}
            {toastMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-300" />}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
