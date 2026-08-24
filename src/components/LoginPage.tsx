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
    <div className="min-h-screen bg-[#f5f8f6] dark:bg-[#0a110e] text-black flex flex-col justify-between selection:bg-emerald-600 selection:text-white transition-colors">
      {/* Top Header Bar */}
      <header className="px-4 sm:px-8 py-3.5 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-300 bg-white dark:bg-zinc-100 backdrop-blur-md sticky top-0 z-20 text-black">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center p-0.5 font-black shadow-md border border-emerald-300 dark:border-zinc-400 overflow-hidden shrink-0">
            <img src={icetiLogo} alt="ICETI Logo" className="w-full h-full object-contain rounded-xl" />
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
          <div className="bg-white dark:bg-zinc-50 rounded-3xl border border-zinc-200 dark:border-zinc-300 shadow-xl overflow-hidden text-black">
            {/* Card Header */}
            <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 p-6 text-center text-white relative">
              <div className="w-16 h-16 rounded-2xl bg-white p-1 border border-white/30 flex items-center justify-center mx-auto mb-3 shadow-lg overflow-hidden">
                <img src={icetiLogo} alt="ICETI Logo" className="w-full h-full object-contain rounded-xl" />
              </div>
              <h2 className="text-xl font-black text-white tracking-wide">
                ចូលប្រើប្រព័ន្ធវិទ្យាស្ថាន
              </h2>
              <p className="text-xs text-emerald-100/90 font-medium mt-1">
                International Chinese Education & Teachers Institute
              </p>
            </div>

            {/* Form Content */}
            <div className="p-6 sm:p-8 space-y-5 text-black">
              {/* Error Message if any */}
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-xs text-black font-bold flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="text-black">{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                {/* Username Input */}
                <div>
                  <label className="block text-xs font-black text-black mb-1.5">
                    ឈ្មោះអ្នកប្រើប្រាស់ (Username) <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black">
                      <User className="w-4 h-4 text-black" />
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
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-300 bg-white text-black placeholder:text-zinc-500 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all shadow-2xs"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-xs font-black text-black mb-1.5">
                    ពាក្យសម្ងាត់ (Password) <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black">
                      <Lock className="w-4 h-4 text-black" />
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
                      className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-zinc-300 bg-white text-black placeholder:text-zinc-500 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-black hover:text-emerald-700 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4 text-black" /> : <Eye className="w-4 h-4 text-black" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  id="btn-login-submit"
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-3"
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
                  <div className="border-t border-zinc-300 w-full" />
                  <span className="bg-white dark:bg-zinc-50 px-3 text-[11px] font-extrabold text-black uppercase tracking-wider whitespace-nowrap">
                    ឬ (OR)
                  </span>
                  <div className="border-t border-zinc-300 w-full" />
                </div>

                {/* As a Guest User Button */}
                <button
                  id="btn-login-guest"
                  type="button"
                  onClick={handleGuestLogin}
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-200 dark:hover:bg-zinc-300 text-black border-2 border-zinc-300 dark:border-zinc-400 font-black text-sm shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <User className="w-4 h-4 text-black" />
                  <span className="text-black">As a Guest User</span>
                </button>
              </form>

              {/* System Features note */}
              <div className="pt-3 border-t border-zinc-200 text-center">
                <p className="text-[11px] text-black font-bold">
                  ប្រព័ន្ធគ្រប់គ្រងនិស្សិត ថ្នាក់រៀន វេនសិក្សា និងកត់ត្រាវត្តមានឌីជីថល 
                </p>
                <p className="text-[11px] text-black font-bold">
                  រៀបចំដោយ លោក រស់រិទ្ធី វ៉ាន់រដ្ឋា ក្រុមការងារវិទ្យាស្ថាន
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
            ប្រព័ន្ធគ្រប់គ្រងនិស្សិត ថ្នាក់រៀន វេនសិក្សា និងវត្តមានឌីជីថល &bull; រក្សាសិទ្ធិគ្រប់យ៉ាង ២០២៥-២០២៦ @rosrithyvannratha
          </p>
        </div>
      </footer>
    </div>
  );
};
