import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Users,
  CalendarCheck,
  UserCheck,
  Layers,
  BookOpen,
  BarChart3,
  LogOut,
  LogIn,
  Cloud,
  Database,
  Sparkles,
  Sun,
  Sunset,
  Moon,
  Calendar,
  RefreshCw,
  CheckCircle,
  WifiOff,
  DollarSign,
  Send
} from 'lucide-react';
import { ActiveTab, AppUser } from '../types';
import { subscribeSyncInfo, SyncInfo, instituteService } from '../service/instituteService';
import icetiLogo from '../assets/images/icetilogo.jpg';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  user: AppUser | null;
  onLogin: () => void;
  onLogout: () => void;
  totalStudents: number;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenBackup: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  onLogin,
  onLogout,
  totalStudents,
  isDarkMode,
  onToggleDarkMode,
  onOpenBackup
}) => {
  const [syncInfo, setSyncInfo] = useState<SyncInfo>({
    status: 'synced',
    lastSyncedAt: new Date(),
    message: 'Cloud Sync Active'
  });
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  useEffect(() => {
    const unsub = subscribeSyncInfo((info) => setSyncInfo(info));
    return () => unsub();
  }, []);

  const handleManualSync = async () => {
    if (isManualSyncing) return;
    setIsManualSyncing(true);
    try {
      await instituteService.forceSyncAll();
    } finally {
      setIsManualSyncing(false);
    }
  };

  const isGuest = user?.role === 'Guest' || user?.isAnonymous || !user;

  const tabs = [
    { id: 'dashboard', labelKh: 'ផ្ទាំងគ្រប់គ្រង', labelEn: 'Dashboard', icon: BarChart3 },
    { id: 'students', labelKh: 'និស្សិត', labelEn: 'Students', icon: Users, badge: totalStudents },
    { id: 'attendance', labelKh: 'កត់ត្រាវត្តមាន', labelEn: 'Attendance', icon: CalendarCheck },
    ...(!isGuest ? [
      { id: 'tuition', labelKh: 'ថ្លៃសិក្សា & អាហារូបករណ៍', labelEn: 'Tuition & Grants', icon: DollarSign },
      { id: 'alerts', labelKh: 'ជូនដំណឹងអវត្តមាន', labelEn: 'Absence Alerts', icon: Send }
    ] : []),
    { id: 'teachers', labelKh: 'សាស្ត្រាចារ្យ', labelEn: 'Teachers', icon: UserCheck },
    { id: 'teacher_attendance', labelKh: 'វត្តមានគ្រូ', labelEn: 'Faculty Att.', icon: CalendarCheck },
    { id: 'classes', labelKh: 'ថ្នាក់រៀន', labelEn: 'Classes', icon: Layers },
    { id: 'majors', labelKh: 'ជំនាញ', labelEn: 'Majors', icon: BookOpen },
    { id: 'reports', labelKh: 'របាយការណ៍ & AI', labelEn: 'Reports & AI', icon: Sparkles },
  ];

  return (
    <header className="bg-white dark:bg-[#111c38] border-b border-zinc-200 dark:border-blue-900/40 sticky top-0 z-40 shadow-xs transition-colors text-zinc-900 dark:text-zinc-100">
      {/* Top Banner */}
      <div className="bg-blue-50/80 dark:bg-[#0c1527] text-zinc-900 dark:text-zinc-100 px-4 py-2 border-b border-blue-200/60 dark:border-blue-900/50">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center p-0.5 shadow-xs border border-blue-300 dark:border-blue-700 shrink-0 overflow-hidden">
              <img
                src={icetiLogo}
                alt="ICETI Logo"
                className="w-full h-full object-contain rounded-md"
              />
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-wide text-zinc-950 dark:text-white flex items-center gap-2">
                <span className="text-zinc-950 dark:text-white">វិទ្យាស្ថានគរុកោសល្យភាសាចិនក្នុងតំបន់</span>
                <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 hidden md:inline">| International Chinese Education and Teachers Institute</span>
              </h1>
              <p className="text-[10.5px] text-zinc-600 dark:text-zinc-400 font-semibold hidden sm:block">
                ប្រព័ន្ធគ្រប់គ្រងនិស្សិត ថ្នាក់រៀន វេនសិក្សា និងកត់ត្រាវត្តមានឆ្លាតវៃ
              </p>
            </div>
          </div>

          {/* Quick Shift Badges & User Status */}
          <div className="flex items-center gap-2 ml-auto text-zinc-900 dark:text-zinc-100">
            <div className="hidden lg:flex items-center gap-1.5 bg-white/90 dark:bg-[#182645] px-2.5 py-1 rounded-full border border-blue-200/80 dark:border-blue-800/60 text-[11px] shadow-2xs">
              <span className="text-zinc-800 dark:text-zinc-200 font-bold flex items-center gap-1"><Sun className="w-3 h-3 text-amber-600" /> ព្រឹក</span>
              <span className="text-zinc-400">•</span>
              <span className="text-zinc-800 dark:text-zinc-200 font-bold flex items-center gap-1"><Sunset className="w-3 h-3 text-orange-600" /> រសៀល</span>
              <span className="text-zinc-400">•</span>
              <span className="text-zinc-800 dark:text-zinc-200 font-bold flex items-center gap-1"><Moon className="w-3 h-3 text-indigo-500" /> យប់</span>
              <span className="text-zinc-400">•</span>
              <span className="text-zinc-800 dark:text-zinc-200 font-bold flex items-center gap-1"><Calendar className="w-3 h-3 text-sky-600" /> ចុងសប្តាហ៍</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Real-time Sync Status Pill */}
              <div
                title={syncInfo.message || (syncInfo.status === 'synced' ? 'ទិន្នន័យបានធ្វើសមកាលកម្មស្វ័យប្រវត្តិលើ Cloud Firestore' : 'កំពុងធ្វើសមកាលកម្មទិន្នន័យ...')}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border bg-white dark:bg-[#182645] border-blue-200/80 dark:border-blue-800/60 text-zinc-900 dark:text-zinc-100 shadow-2xs"
              >
                {syncInfo.status === 'syncing' || isManualSyncing ? (
                  <>
                    <RefreshCw className="w-3 h-3 text-blue-600 dark:text-blue-400 animate-spin" />
                    <span className="text-zinc-900 dark:text-zinc-100 font-bold">កំពុង Sync...</span>
                  </>
                ) : syncInfo.status === 'offline' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-bold">Offline Cache</span>
                  </>
                ) : syncInfo.status === 'error' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-bold">Sync Error</span>
                  </>
                ) : (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600 dark:bg-blue-400"></span>
                    </span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-bold">Real-Time Sync</span>
                  </>
                )}

                <button
                  type="button"
                  onClick={handleManualSync}
                  title="ចុចដើម្បីទាញទិន្នន័យចុងក្រោយបង្អស់ពី Cloud ឡើងវិញ"
                  disabled={isManualSyncing}
                  className="ml-0.5 p-0.5 hover:bg-zinc-100 dark:hover:bg-blue-900/50 rounded text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-2.5 h-2.5 ${isManualSyncing ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Cloud Backup Hub Button */}
              <button
                type="button"
                onClick={onOpenBackup}
                title="មជ្ឈមណ្ឌល Backup & Cloud Sync"
                className="flex items-center gap-1 text-[11px] font-bold bg-white dark:bg-[#182645] hover:bg-blue-50 dark:hover:bg-blue-900/40 text-zinc-900 dark:text-zinc-100 px-2.5 py-1 rounded-full border border-blue-200/80 dark:border-blue-800/60 transition-all cursor-pointer shadow-2xs"
              >
                <Cloud className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-zinc-900 dark:text-zinc-100 font-bold">Cloud & Backup</span>
              </button>

              {/* Dark / Light Mode Toggle */}
              <button
                type="button"
                onClick={onToggleDarkMode}
                title={isDarkMode ? 'ប្តូរទៅ Normal Mode (Light)' : 'ប្តូរទៅ Dark Mode'}
                className="w-7 h-7 rounded-full bg-white dark:bg-[#182645] hover:bg-zinc-100 dark:hover:bg-blue-900/40 text-zinc-900 dark:text-zinc-100 flex items-center justify-center border border-blue-200/80 dark:border-blue-800/60 transition-all cursor-pointer shadow-2xs"
              >
                {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-blue-600" />}
              </button>

              {user ? (
                <div className="flex items-center gap-2 bg-white dark:bg-[#182645] px-3 py-1 rounded-full border border-blue-200/80 dark:border-blue-800/60 text-zinc-900 dark:text-zinc-100 shadow-2xs">
                  {user.role === 'Guest' || user.isAnonymous ? (
                    <div className="w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] font-black flex items-center justify-center">
                      G
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-blue-600 dark:bg-blue-500 text-white text-[10px] font-black flex items-center justify-center">
                      A
                    </div>
                  )}
                  <span className="text-zinc-950 dark:text-white text-xs font-extrabold max-w-[130px] truncate">
                    {user.displayName || (user.role === 'Guest' ? 'Guest User' : 'Admin')}
                  </span>
                  <button
                    type="button"
                    onClick={onLogout}
                    title="ចាកចេញ (Sign Out)"
                    className="flex items-center gap-1 text-rose-600 dark:text-rose-400 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 px-2 py-0.5 rounded-full text-[11px] font-extrabold transition-colors cursor-pointer ml-1"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>ចាកចេញ</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onLogin}
                  title="ចូលគណនី Admin"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-white" />
                  <span>ចូលគណនី Admin</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4">
        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-700 dark:bg-blue-600 text-white shadow-sm shadow-blue-900/20'
                    : 'text-zinc-700 dark:text-zinc-300 hover:text-blue-900 dark:hover:text-white hover:bg-blue-50 dark:hover:bg-blue-950/40'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-600 dark:text-zinc-400'}`} />
                <div className="flex flex-col text-left leading-tight">
                  <span className={`font-black ${isActive ? 'text-white' : 'text-zinc-900 dark:text-zinc-200'}`}>{tab.labelKh}</span>
                  <span className={`text-[9.5px] font-bold ${isActive ? 'text-blue-100' : 'text-zinc-500 dark:text-zinc-400'}`}>
                    {tab.labelEn}
                  </span>
                </div>
                {typeof tab.badge === 'number' && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                      isActive
                        ? 'bg-white text-blue-900'
                        : 'bg-zinc-100 dark:bg-[#182645] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
