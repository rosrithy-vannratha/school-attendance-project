import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  User,
  GraduationCap,
  BookOpen,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { getShiftLabel, getClassTypeLabel } from '../utils/exportUtils';

export interface ProfileViewTarget {
  nameKhmer: string;
  nameLatin?: string;
  nameChinese?: string;
  code?: string;
  photoUrl?: string;
  gender?: 'male' | 'female' | string;
  majorName?: string;
  className?: string;
  classType?: string;
  shift?: string;
  year?: string;
  roleOrStatus?: string;
  degree?: string;
  subjects?: string;
  phone?: string;
  email?: string;
  isTeacher?: boolean;
}

interface ProfileImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: ProfileViewTarget | null;
}

export const ProfileImageViewerModal: React.FC<ProfileImageViewerModalProps> = ({
  isOpen,
  onClose,
  target
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
    }
  }, [isOpen, target]);

  // Keyboard shortcut ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !target) return null;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  const handleDownload = () => {
    if (!target.photoUrl) return;
    const a = document.createElement('a');
    a.href = target.photoUrl;
    const fileName = `${target.code || 'profile'}_${target.nameLatin || target.nameKhmer || 'photo'}.jpg`
      .replace(/\s+/g, '_');
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-[#111c38] rounded-3xl max-w-2xl w-full border border-blue-200/50 dark:border-sky-500/20 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-sky-900 p-4 text-white flex items-center justify-between border-b border-blue-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-sky-300 border border-white/20 shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">
                  {target.nameKhmer}
                </h3>
                {target.nameChinese && (
                  <span className="text-[11px] font-bold bg-white/20 text-sky-100 px-2 py-0.5 rounded-md">
                    {target.nameChinese}
                  </span>
                )}
              </div>
              <p className="text-xs text-sky-200/90 font-medium">
                {target.nameLatin ? `${target.nameLatin} • ` : ''}
                {target.code ? `អត្តលេខ: ${target.code}` : 'រូបថតផ្ទាល់ខ្លួន (Profile Picture)'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="បិទ (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Preview Canvas */}
        <div className="relative bg-zinc-950/90 dark:bg-black/90 flex-1 min-h-[320px] max-h-[480px] overflow-hidden flex items-center justify-center p-6 select-none">
          {target.photoUrl ? (
            <div
              className="transition-transform duration-200 ease-out flex items-center justify-center"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`
              }}
            >
              <img
                src={target.photoUrl}
                alt={target.nameKhmer}
                className="max-h-[360px] max-w-full rounded-2xl shadow-2xl object-contain border-2 border-white/20"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-zinc-400 py-12">
              <div
                className={`w-28 h-28 rounded-3xl flex items-center justify-center font-bold text-4xl shadow-xl mb-4 ${
                  target.gender === 'female'
                    ? 'bg-rose-500/20 text-rose-300 border-2 border-rose-500/30'
                    : 'bg-blue-500/20 text-blue-300 border-2 border-blue-500/30'
                }`}
              >
                {(target.nameKhmer || target.nameLatin || 'S').charAt(0)}
              </div>
              <p className="text-sm font-semibold text-zinc-300">ពុំមានរូបថត (No photo uploaded)</p>
              <p className="text-xs text-zinc-500 mt-1">
                {target.isTeacher ? 'អ្នកអាចកែប្រែទិន្នន័យសាស្ត្រាចារ្យដើម្បី Upload រូបភាពថ្មី' : 'អ្នកអាចកែប្រែនិស្សិតដើម្បី Upload រូបភាពថ្មី'}
              </p>
            </div>
          )}

          {/* Floating Image Controls (when photo is available) */}
          {target.photoUrl && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md rounded-2xl p-1.5 px-3 flex items-center gap-2 border border-white/15 text-white text-xs shadow-xl">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
                className="p-1.5 rounded-lg hover:bg-white/20 disabled:opacity-40 transition-colors cursor-pointer"
                title="បង្រួម (Zoom Out)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="font-mono text-[11px] px-1 font-bold">{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                className="p-1.5 rounded-lg hover:bg-white/20 disabled:opacity-40 transition-colors cursor-pointer"
                title="ពង្រីក (Zoom In)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="h-4 w-px bg-white/20 mx-1" />
              <button
                type="button"
                onClick={handleRotate}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
                title="បង្វិលរូប 90° (Rotate)"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              {(zoom !== 1 || rotation !== 0) && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-2 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-[11px] font-bold cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer info & Details */}
        <div className="p-4 bg-zinc-50 dark:bg-[#0e172e] border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {target.isTeacher && (
              <span className="px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>សាស្ត្រាចារ្យ (Faculty)</span>
              </span>
            )}
            {target.classType && (
              <span className="px-2.5 py-1 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800/60 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span>{getClassTypeLabel(target.classType)}</span>
              </span>
            )}
            {target.degree && (
              <span className="px-2.5 py-1 rounded-xl bg-zinc-200/80 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{target.degree}</span>
              </span>
            )}
            {target.majorName && (
              <span className="px-2.5 py-1 rounded-xl bg-zinc-200/80 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                <span>{target.majorName}</span>
              </span>
            )}
            {target.subjects && (
              <span className="px-2.5 py-1 rounded-xl bg-zinc-200/80 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>មុខវិជ្ជា: {target.subjects}</span>
              </span>
            )}
            {target.className && (
              <span className="px-2.5 py-1 rounded-xl bg-zinc-200/80 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                <span>ថ្នាក់: {target.className}</span>
              </span>
            )}
            {target.shift && (
              <span className="px-2.5 py-1 rounded-xl bg-zinc-200/80 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold">
                {getShiftLabel(target.shift)}
              </span>
            )}
            {target.year && (
              <span className="px-2.5 py-1 rounded-xl bg-zinc-200/80 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                <span>{target.year}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {target.photoUrl && (
              <button
                type="button"
                onClick={handleDownload}
                className="px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ទាញយករូប (Download)</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition-colors cursor-pointer"
            >
              បិទ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
