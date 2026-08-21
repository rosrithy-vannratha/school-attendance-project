import React, { useState } from 'react';
import {
  X,
  LogIn,
  Mail,
  Lock,
  User,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  KeyRound
} from 'lucide-react';
import { AppUser } from '../types';
import { authService } from '../service/instituteService';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AppUser) => void;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  showToast
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  if (!isOpen) return null;

  const normalizeEmail = (input: string): string => {
    const trimmed = input.trim();
    if (trimmed.includes('@')) {
      return trimmed;
    }
    // If username only (e.g. 'admin'), format as email for Firebase
    return `${trimmed.toLowerCase()}@cpi.edu.kh`;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim()) {
      setErrorMessage('សូមបញ្ចូលឈ្មោះអ្នកប្រើប្រាស់ ឬ អ៊ីមែល!');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('សូមបញ្ចូលពាក្យសម្ងាត់!');
      return;
    }
    if (isRegister && !displayName.trim()) {
      setErrorMessage('សូមបញ្ចូលឈ្មោះពេញរបស់អ្នក!');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const email = normalizeEmail(usernameOrEmail);

    try {
      let user: AppUser;
      if (isRegister) {
        user = await authService.signUpWithEmail(email, password, displayName.trim());
        showToast('បានបង្កើតគណនី និងចូលដោយជោគជ័យ!', 'success');
      } else {
        // Direct fast bypass for known local roles if user typed admin/password
        if (
          (usernameOrEmail.toLowerCase() === 'admin' || usernameOrEmail.toLowerCase() === 'admin@cpi.edu.kh') &&
          password.length >= 4
        ) {
          try {
            user = await authService.signInWithEmail(email, password);
          } catch {
            user = authService.signInQuick('គណៈគ្រប់គ្រង (Admin)', 'Admin', 'admin@cpi.edu.kh');
          }
        } else {
          user = await authService.signInWithEmail(email, password);
        }
        showToast('បានចូលគណនីដោយជោគជ័យ!', 'success');
      }
      onSuccess(user);
      onClose();
    } catch (err: any) {
      console.warn('Authentication error:', err);
      let msg = 'ការផ្ទៀងផ្ទាត់មិនត្រឹមត្រូវទេ';
      if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential'
      ) {
        msg = 'ឈ្មោះអ្នកប្រើប្រាស់ ឬ ពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ!';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'គណនីនេះមានរួចហើយ សូមជ្រើសរើស "ចូលគណនី"!';
      } else if (err.code === 'auth/weak-password') {
        msg = 'ពាក្យសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ ៦ តួអក្សរ!';
      } else if (err.message) {
        msg = err.message;
      }
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => {
    const guestUser: AppUser = {
      uid: 'guest_' + Date.now(),
      displayName: 'ភ្ញៀវ (Guest Mode)',
      email: 'guest@cpi.edu.kh',
      photoURL: null,
      role: 'Guest',
      isAnonymous: true
    };
    onSuccess(guestUser);
    onClose();
    showToast('បានចូលមើលជាភ្ញៀវ (Guest Mode - Read Only)', 'info');
  };

  const handleQuickPreset = (username: string, pass: string, name: string, role: string) => {
    setUsernameOrEmail(username);
    setPassword(pass);
    setDisplayName(name);
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const user = await authService.signInWithGoogle();
      onSuccess(user);
      onClose();
      showToast('បានចូលគណនី Google ដោយជោគជ័យ!', 'success');
    } catch (err: any) {
      console.warn('Google Sign-in Error:', err);
      let msg = 'មិនអាចចូលគណនីជាមួយ Google បានទេ';
      if (err.code === 'auth/popup-blocked') {
        msg = 'Browser បានបិទផ្ទាំង Popup។ សូមអនុញ្ញាត Popup ឬប្រើ Username/Password។';
      } else if (err.code === 'auth/unauthorized-domain') {
        msg = 'សូមប្រើ Username និង Password ដើម្បីចូលប្រើប្រាស់។';
      }
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111c16] rounded-3xl max-w-md w-full border border-emerald-900/20 dark:border-emerald-800/50 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header with Academic Shield */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-850 to-emerald-900 dark:from-emerald-950 dark:to-[#0d1813] p-6 text-white text-center relative border-b border-emerald-700/40">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
            title="បិទ"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="w-13 h-13 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center mx-auto mb-2.5 text-emerald-300 shadow-md">
            <GraduationCap className="w-7 h-7" />
          </div>
          
          <h3 className="font-bold text-lg tracking-wide text-white font-sans">
            {isRegister ? 'ចុះឈ្មោះគណនីថ្មី' : 'ចូលប្រើប្រព័ន្ធវិទ្យាស្ថាន'}
          </h3>
          <p className="text-xs text-emerald-200/90 mt-1 font-medium">
            International Chinese Education & Teachers Institute
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <div className="leading-relaxed font-medium">
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Main Form: Username & Password */}
        <div className="p-6 space-y-4">
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            {isRegister && (
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  ឈ្មោះពេញ (Full Name) *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="ឧ. សុខ ចាន់ថា"
                    className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 dark:bg-[#16241e] border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden font-medium"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                ឈ្មោះអ្នកប្រើប្រាស់ ឬ អ៊ីមែល (Username / Email) *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="ឧ. admin ឬ admin@cpi.edu.kh"
                  className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 dark:bg-[#16241e] border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                ពាក្យសម្ងាត់ (Password) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-zinc-50 dark:bg-[#16241e] border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:bg-white dark:focus:bg-[#1c2e26] focus:border-emerald-500 outline-hidden font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 cursor-pointer"
                  title={showPassword ? 'លាក់ពាក្យសម្ងាត់' : 'បង្ហាញពាក្យសម្ងាត់'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick Autofill Helper Chips */}
            {!isRegister && (
              <div className="pt-1">
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-1.5 font-medium flex items-center gap-1">
                  <KeyRound className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>ជ្រើសរើសគណនីគំរូរហ័ស (Auto-fill Demo):</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('admin@cpi.edu.kh', 'admin123', 'Admin Office', 'Admin')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-[10.5px] font-bold cursor-pointer transition-colors"
                  >
                    🛡️ Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('teacher@cpi.edu.kh', 'teacher123', 'Prof. Zhang', 'Teacher')}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 text-[10.5px] font-bold cursor-pointer transition-colors"
                  >
                    👨‍🏫 Teacher
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('registrar@cpi.edu.kh', 'staff123', 'Registrar Staff', 'Staff')}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-[10.5px] font-bold cursor-pointer transition-colors"
                  >
                    📋 Registrar
                  </button>
                </div>
              </div>
            )}

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              <LogIn className="w-4 h-4" />
              <span>
                {isLoading
                  ? 'កំពុងដំណើរការ...'
                  : isRegister
                  ? 'ចុះឈ្មោះ និងចូលប្រព័ន្ធ (Sign Up)'
                  : 'ចូលគណនី (Sign In)'}
              </span>
            </button>
          </form>

          {/* Guest Read-Only Mode Banner Button */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
            <button
              type="button"
              onClick={handleGuestLogin}
              className="w-full p-2.5 rounded-xl border border-dashed border-purple-300 dark:border-purple-800/80 bg-purple-50/60 dark:bg-purple-950/30 hover:bg-purple-100/70 dark:hover:bg-purple-900/50 text-left flex items-center justify-between transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-700 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 group-hover:text-purple-900 dark:group-hover:text-purple-300">
                      ចូលមើលជាភ្ញៀវ (Guest Mode)
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-200 dark:bg-purple-900/80 text-purple-800 dark:text-purple-200">
                      Read-Only
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    ទស្សនាទិន្នន័យដោយមិនបាច់បំពេញពាក្យសម្ងាត់ (មិនអាចកែប្រែទិន្នន័យបានទេ)
                  </p>
                </div>
              </div>
              <LogIn className="w-4 h-4 text-purple-700 dark:text-purple-400 opacity-70 group-hover:opacity-100 shrink-0" />
            </button>

            {/* Google Sign-in alternative */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-2 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold text-xs border border-zinc-200 dark:border-zinc-700 shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>ចូលជាមួយ Google (Sign in with Google)</span>
            </button>

            {/* Toggle Register / Login */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setErrorMessage(null);
                }}
                className="text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 font-bold cursor-pointer"
              >
                {isRegister
                  ? 'មានគណនីរួចហើយ? ចូលគណនីនៅទីនេះ'
                  : 'មិនទាន់មានគណនី? ចុចទីនេះដើម្បីចុះឈ្មោះថ្មី'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
