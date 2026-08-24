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
  WifiOff
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

  const tabs = [
    { id: 'dashboard', labelKh: 'ផ្ទាំងគ្រប់គ្រង', labelEn: 'Dashboard', icon: BarChart3 },
    { id: 'students', labelKh: 'និស្សិត', labelEn: 'Students', icon: Users, badge: totalStudents },
    { id: 'attendance', labelKh: 'កត់ត្រាវត្តមាន', labelEn: 'Attendance', icon: CalendarCheck },
    { id: 'teachers', labelKh: 'សាស្ត្រាចារ្យ', labelEn: 'Teachers', icon: UserCheck },
    { id: 'teacher_attendance', labelKh: 'វត្តមានគ្រូ', labelEn: 'Faculty Att.', icon: CalendarCheck },
    { id: 'classes', labelKh: 'ថ្នាក់រៀន', labelEn: 'Classes', icon: Layers },
    { id: 'majors', labelKh: 'ជំនាញ', labelEn: 'Majors', icon: BookOpen },
    { id: 'reports', labelKh: 'របាយការណ៍ & AI', labelEn: 'Reports & AI', icon: Sparkles },
  ];

  return (
    <header className="bg-white dark:bg-zinc-100 border-b border-zinc-200 dark:border-zinc-300 sticky top-0 z-40 shadow-xs transition-colors text-black">
      {/* Top Banner */}
      <div className="bg-emerald-100/90 dark:bg-zinc-200 text-black px-4 py-2 border-b border-emerald-200/80 dark:border-zinc-300">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center p-0.5 shadow-xs border border-emerald-300 dark:border-zinc-400 shrink-0 overflow-hidden">
              <img
                src={icetiLogo}
                alt="ICETI Logo"
                className="w-full h-full object-contain rounded-md"
              />
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-wide text-black flex items-center gap-2">
                <span className="text-black">វិទ្យាស្ថានគរុកោសល្យភាសាចិនក្នុងតំបន់</span>
                <span className="text-[11px] font-semibold text-black hidden md:inline">| International Chinese Education and Teachers Institute</span>
              </h1>
              <p className="text-[10.5px] text-black font-semibold hidden sm:block">
                ប្រព័ន្ធគ្រប់គ្រងនិស្សិត ថ្នាក់រៀន វេនសិក្សា និងកត់ត្រាវត្តមានឆ្លាតវៃ
              </p>
            </div>
          </div>

          {/* Quick Shift Badges & User Status */}
          <div className="flex items-center gap-2 ml-auto text-black">
            <div className="hidden lg:flex items-center gap-1.5 bg-white/90 dark:bg-white px-2.5 py-1 rounded-full border border-emerald-300 dark:border-zinc-400 text-[11px] shadow-2xs">
              <span className="text-black font-bold flex items-center gap-1"><Sun className="w-3 h-3 text-amber-600" /> ព្រឹក</span>
              <span className="text-black font-bold">•</span>
              <span className="text-black font-bold flex items-center gap-1"><Sunset className="w-3 h-3 text-orange-600" /> រសៀល</span>
              <span className="text-black font-bold">•</span>
              <span className="text-black font-bold flex items-center gap-1"><Moon className="w-3 h-3 text-indigo-600" /> យប់</span>
              <span className="text-black font-bold">•</span>
              <span className="text-black font-bold flex items-center gap-1"><Calendar className="w-3 h-3 text-teal-700" /> ចុងសប្តាហ៍</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Real-time Sync Status Pill */}
              <div
                title={syncInfo.message || (syncInfo.status === 'synced' ? 'ទិន្នន័យបានធ្វើសមកាលកម្មស្វ័យប្រវត្តិលើ Cloud Firestore' : 'កំពុងធ្វើសមកាលកម្មទិន្នន័យ...')}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border bg-white dark:bg-white border-emerald-300 dark:border-zinc-400 text-black shadow-2xs"
              >
                {syncInfo.status === 'syncing' || isManualSyncing ? (
                  <>
                    <RefreshCw className="w-3 h-3 text-emerald-800 animate-spin" />
                    <span className="text-black font-bold">កំពុង Sync...</span>
                  </>
                ) : syncInfo.status === 'offline' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span className="text-black font-bold">Offline Cache</span>
                  </>
                ) : syncInfo.status === 'error' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                    <span className="text-black font-bold">Sync Error</span>
                  </>
                ) : (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-600 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-700"></span>
                    </span>
                    <span className="text-black font-bold">Real-Time Sync</span>
                  </>
                )}

                <button
                  type="button"
                  onClick={handleManualSync}
                  title="ចុចដើម្បីទាញទិន្នន័យចុងក្រោយបង្អស់ពី Cloud ឡើងវិញ"
                  disabled={isManualSyncing}
                  className="ml-0.5 p-0.5 hover:bg-zinc-100 rounded text-black transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-2.5 h-2.5 ${isManualSyncing ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Cloud Backup Hub Button */}
              <button
                type="button"
                onClick={onOpenBackup}
                title="មជ្ឈមណ្ឌល Backup & Cloud Sync"
                className="flex items-center gap-1 text-[11px] font-bold bg-white dark:bg-white hover:bg-emerald-50 text-black px-2.5 py-1 rounded-full border border-emerald-300 dark:border-zinc-400 transition-all cursor-pointer shadow-2xs"
              >
                <Cloud className="w-3.5 h-3.5 text-emerald-800" />
                <span className="text-black font-bold">Cloud & Backup</span>
              </button>

              {/* Dark / Light Mode Toggle */}
              <button
                type="button"
                onClick={onToggleDarkMode}
                title={isDarkMode ? 'ប្តូរទៅ Normal Mode (Light)' : 'ប្តូរទៅ Dark Mode'}
                className="w-7 h-7 rounded-full bg-white dark:bg-white hover:bg-zinc-100 text-black flex items-center justify-center border border-emerald-300 dark:border-zinc-400 transition-all cursor-pointer shadow-2xs"
              >
                {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-600" /> : <Moon className="w-3.5 h-3.5 text-zinc-900" />}
              </button>

              {user ? (
                <div className="flex items-center gap-2 bg-white dark:bg-white px-3 py-1 rounded-full border border-emerald-300 dark:border-zinc-400 text-black shadow-2xs">
                  {user.role === 'Guest' || user.isAnonymous ? (
                    <div className="w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] font-black flex items-center justify-center">
                      G
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-emerald-800 text-white text-[10px] font-black flex items-center justify-center">
                      A
                    </div>
                  )}
                  <span className="text-black text-xs font-extrabold max-w-[130px] truncate">
                    {user.displayName || (user.role === 'Guest' ? 'Guest User' : 'Admin')}
                  </span>
                  <button
                    type="button"
                    onClick={onLogout}
                    title="ចាកចេញ (Sign Out)"
                    className="flex items-center gap-1 text-rose-750 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-full text-[11px] font-extrabold transition-colors cursor-pointer ml-1"
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
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
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
                    ? 'bg-emerald-800 text-white shadow-sm shadow-emerald-900/20'
                    : 'text-black hover:text-black hover:bg-emerald-50 dark:hover:bg-zinc-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-black'}`} />
                <div className="flex flex-col text-left leading-tight">
                  <span className={`font-black ${isActive ? 'text-white' : 'text-black'}`}>{tab.labelKh}</span>
                  <span className={`text-[9.5px] font-bold ${isActive ? 'text-emerald-100' : 'text-black opacity-80'}`}>
                    {tab.labelEn}
                  </span>
                </div>
                {typeof tab.badge === 'number' && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                      isActive
                        ? 'bg-white text-emerald-900'
                        : 'bg-zinc-200 text-black border border-zinc-300'
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
