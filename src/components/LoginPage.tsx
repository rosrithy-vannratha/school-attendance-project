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
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { authService } from '../service/instituteService';
import { AppUser } from '../types';

interface LoginPageProps {
  onSuccess: (user: AppUser) => void;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSuccess,
  showToast,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [username, setUsername] = useState('Admin');
  const [password, setPassword] = useState('admin123');
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

  const handleFillAdmin = () => {
    setUsername('Admin');
    setPassword('admin123');
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-[#f5f8f6] dark:bg-[#0a110e] text-zinc-900 dark:text-zinc-100 flex flex-col justify-between selection:bg-emerald-600 selection:text-white transition-colors">
      {/* Top Header Bar */}
      <header className="px-4 sm:px-8 py-3.5 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-300 bg-white dark:bg-zinc-100 backdrop-blur-md sticky top-0 z-20 text-black">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-black shadow-md border border-emerald-700/50">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm sm:text-base leading-tight text-black">
              វិទ្យាស្ថានគរុកោសល្យភាសាចិនក្នុងតំបន់
            </h1>
            <p className="text-[11px] text-black font-semibold">
              International Chinese Education & Teachers Institute
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleDarkMode}
            title={isDarkMode ? 'ប្តូរទៅ Light Mode' : 'ប្តូរទៅ Dark Mode'}
            className="p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-400 bg-white text-black hover:bg-zinc-100 transition-colors cursor-pointer shadow-2xs"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-600" /> : <Moon className="w-4 h-4 text-black" />}
          </button>
        </div>
      </header>

      {/* Main Login Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          {/* Card Box */}
          <div className="bg-white dark:bg-[#121e18] rounded-3xl border border-emerald-900/10 dark:border-emerald-800/40 shadow-xl overflow-hidden">
            {/* Card Header */}
            <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 p-6 text-center text-white relative">
              <div className="w-14 h-14 rounded-2xl bg-white/10 text-emerald-300 border border-white/20 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-black text-white tracking-wide">
                ចូលប្រើប្រព័ន្ធវិទ្យាស្ថាន
              </h2>
              <p className="text-xs text-emerald-100/90 font-medium mt-1">
                International Chinese Education & Teachers Institute
              </p>
            </div>

            {/* Form Content */}
            <div className="p-6 sm:p-8 space-y-5">
              {/* Error Message if any */}
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-850 dark:text-rose-200 font-bold flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username Input */}
                <div>
                  <label className="block text-xs font-extrabold text-zinc-900 dark:text-zinc-100 mb-1.5">
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
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        setErrorMessage('');
                      }}
                      placeholder="Enter username"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-xs font-extrabold text-zinc-900 dark:text-zinc-100 mb-1.5">
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
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrorMessage('');
                      }}
                      placeholder="input password"
                      className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Credential Quick Pill */}
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-3 rounded-xl flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                    <div className="text-[11.5px] leading-tight">
                      <span className="font-extrabold text-emerald-950 dark:text-emerald-200">គណនី Admin: </span>
                      <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded text-[11px]">
                        Admin / admin123
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleFillAdmin}
                    className="text-[11px] font-black text-emerald-800 dark:text-emerald-300 hover:underline cursor-pointer shrink-0"
                  >
                    បំពេញស្វ័យប្រវត្ត
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  id="btn-login-submit"
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-750 hover:bg-emerald-850 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>កំពុងផ្ទៀងផ្ទាត់...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>ចូលគណនី (Sign In)</span>
                    </>
                  )}
                </button>
              </form>

              {/* System Features note */}
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 text-center">
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                  ប្រព័ន្ធគ្រប់គ្រងនិស្សិត ថ្នាក់រៀន វេនសិក្សា និងកត់ត្រាវត្តមានឌីជីថល
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-300 py-4 bg-white dark:bg-zinc-100 text-center text-xs text-black">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-black">
          <p className="font-extrabold text-black">
            វិទ្យាស្ថានគរុកោសល្យភាសាចិនក្នុងតំបន់ &bull; International Chinese Education and Teachers Institute
          </p>
          <p className="text-[11px] text-black font-semibold">
            ប្រព័ន្ធគ្រប់គ្រងនិស្សិត ថ្នាក់រៀន វេនសិក្សា និងវត្តមានឌីជីថល @rosrithyvannratha &bull; រក្សាសិទ្ធិគ្រប់យ៉ាង ២០២៥-២០២៦
          </p>
        </div>
      </footer>
    </div>
  );
};
