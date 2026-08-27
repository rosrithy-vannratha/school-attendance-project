import React, { useState } from 'react';
import {
  GraduationCap,
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  Sun,
  Moon,
  AlertCircle,
} from 'lucide-react';
import { authService } from '../service/instituteService';
import { AppUser } from '../types';
import icetiLogo from '../assets/images/icetilogo.jpg';

interface LoginPageProps {
  onSuccess: (user: AppUser) => void;
  onContinueAsGuest?: () => void;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSuccess,
  onContinueAsGuest,
  showToast,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      const result = authService.loginWithAdminCredentials(username, password);

      if (result.success && result.user) {
        showToast('បានចូលគណនី Admin ដោយជោគជ័យ!', 'success');
        onSuccess(result.user);
      } else {
        setErrorMessage(result.error || 'ឈ្មោះអ្នកប្រើប្រាស់ ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ!');
        showToast(result.error || 'ឈ្មោះអ្នកប្រើប្រាស់ ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ!', 'error');
      }
      setIsLoading(false);
    }, 300);
  };

  const handleGuestLogin = () => {
    if (onContinueAsGuest) {
      onContinueAsGuest();
      return;
    }
    const guestUser: AppUser = {
      uid: 'guest_' + Date.now(),
      email: 'guest@ici.edu.kh',
      displayName: 'Guest User (ភ្ញៀវ)',
      photoURL: null,
      role: 'Guest',
      isAnonymous: true,
    };
    showToast('បានចូលមើលជា Guest User (Read-Only Mode)', 'info');
    onSuccess(guestUser);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b1329] text-zinc-900 dark:text-zinc-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white transition-colors">
      {/* Top Header Bar */}
      <header className="px-4 sm:px-8 py-3.5 flex items-center justify-between border-b border-zinc-200 dark:border-blue-900/40 bg-white dark:bg-[#111c38] backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center p-0.5 font-black shadow-md border border-blue-200 dark:border-blue-800 overflow-hidden shrink-0">
            <img src={icetiLogo} alt="ICETI Logo" className="w-full h-full object-contain rounded-xl" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm sm:text-base leading-tight text-zinc-900 dark:text-white">
              វិទ្យាស្ថានគរុកោសល្យភាសាចិនក្នុងតំបន់
            </h1>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-semibold">
              International Chinese Education & Teachers Institute
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleDarkMode}
            title={isDarkMode ? 'ប្តូរទៅ Light Mode' : 'ប្តូរទៅ Dark Mode'}
            className="p-2.5 rounded-xl border border-zinc-200 dark:border-blue-800 bg-white dark:bg-[#182645] text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer shadow-2xs"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-blue-600" />}
          </button>
        </div>
      </header>

      {/* Main Login Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          {/* Card Box */}
          <div className="bg-white dark:bg-[#111c38] rounded-3xl border border-zinc-200 dark:border-blue-900/40 shadow-xl overflow-hidden">
            {/* Card Header */}
            <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 p-6 text-center text-white relative">
              <div className="w-16 h-16 rounded-2xl bg-white p-1 border border-white/30 flex items-center justify-center mx-auto mb-3 shadow-lg overflow-hidden">
                <img src={icetiLogo} alt="ICETI Logo" className="w-full h-full object-contain rounded-xl" />
              </div>
              <h2 className="text-xl font-black text-white tracking-wide">
                ចូលប្រើប្រព័ន្ធវិទ្យាស្ថាន
              </h2>
              <p className="text-xs text-blue-100 font-medium mt-1">
                International Chinese Education & Teachers Institute
              </p>
            </div>

            {/* Form Content */}
            <div className="p-6 sm:p-8 space-y-5">
              {/* Error Message if any */}
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-bold flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                {/* Username Input */}
                <div>
                  <label className="block text-xs font-black text-zinc-800 dark:text-zinc-200 mb-1.5">
                    ឈ្មោះអ្នកប្រើប្រាស់ (Username) <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="login-username-input"
                      type="text"
                      required
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setErrorMessage('');
                      }}
                      placeholder="Enter username"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-[#182645] text-zinc-900 dark:text-white placeholder:text-zinc-400 text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-2xs"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-xs font-black text-zinc-800 dark:text-zinc-200 mb-1.5">
                    ពាក្យសម្ងាត់ (Password) <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="login-password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrorMessage('');
                      }}
                      placeholder="input password"
                      className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-[#182645] text-zinc-900 dark:text-white placeholder:text-zinc-400 text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-blue-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  id="btn-login-submit"
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-black text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-3"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span className="text-white">កំពុងផ្ទៀងផ្ទាត់...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 text-white" />
                      <span className="text-white">Login</span>
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="relative flex items-center justify-center py-2">
                  <div className="border-t border-zinc-200 dark:border-zinc-800 w-full" />
                  <span className="bg-white dark:bg-[#111c38] px-3 text-[11px] font-extrabold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider whitespace-nowrap">
                    ឬ (OR)
                  </span>
                  <div className="border-t border-zinc-200 dark:border-zinc-800 w-full" />
                </div>

                {/* As a Guest User Button */}
                <button
                  id="btn-login-guest"
                  type="button"
                  onClick={handleGuestLogin}
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#182645] dark:hover:bg-blue-900/40 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 font-black text-sm shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>As a Guest User</span>
                </button>
              </form>

              {/* System Features note */}
              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 text-center">
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-bold">
                  ប្រព័ន្ធគ្រប់គ្រងនិស្សិត ថ្នាក់រៀន វេនសិក្សា និងកត់ត្រាវត្តមានឌីជីថល 
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold mt-0.5">
                  រៀបចំដោយ លោក រស់រិទ្ធី វ៉ាន់រដ្ឋា ក្រុមការងារវិទ្យាស្ថាន
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800/80 py-4 bg-white dark:bg-[#0f172a] text-center text-xs text-zinc-600 dark:text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-extrabold text-zinc-800 dark:text-zinc-200">
            វិទ្យាស្ថានគរុកោសល្យភាសាចិនក្នុងតំបន់ &bull; International Chinese Education and Teachers Institute
          </p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold">
            ប្រព័ន្ធគ្រប់គ្រងនិស្សិត ថ្នាក់រៀន វេនសិក្សា និងវត្តមានឌីជីថល &bull; រក្សាសិទ្ធិគ្រប់យ៉ាង ២០២៥-២០២៦ @rosrithyvannratha
          </p>
        </div>
      </footer>
    </div>
  );
};
