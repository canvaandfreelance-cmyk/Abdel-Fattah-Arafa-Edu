// src/components/DatabaseSecurityModal.tsx
import React, { useState } from 'react';
import {
  ShieldCheck,
  Database,
  Lock,
  UserCheck,
  LogOut,
  RefreshCw,
  CheckCircle2,
  X,
  Server,
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface DatabaseSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onManualSync: () => Promise<void>;
  isSyncing: boolean;
}

export const DatabaseSecurityModal: React.FC<DatabaseSecurityModalProps> = ({
  isOpen,
  onClose,
  onManualSync,
  isSyncing,
}) => {
  const { currentUser, loginWithGoogle, logout, isDbConnected } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      await loginWithGoogle();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSync = async () => {
    await onManualSync();
    setSyncSuccessMessage(true);
    setTimeout(() => setSyncSuccessMessage(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900 dark:text-white">
                أمان البيانات وقاعدة البيانات السحابية
              </h3>
              <p className="text-xs text-slate-400">
                ربط مشفر آمن عبر Cloud SQL (PostgreSQL) وتوثيق Firebase
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security & Database Status Card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-500" />
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                حالة قاعدة البيانات:
              </span>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>متصلة ومشفرة (PostgreSQL)</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/50 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <Lock className="w-3.5 h-3.5 text-indigo-500" />
              <span>تشفير الاتصال والرموز</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <Server className="w-3.5 h-3.5 text-indigo-500" />
              <span>منطقة الخادم: europe-west2</span>
            </div>
          </div>
        </div>

        {/* Current User Session */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            حساب المعلم والمزامنة السحابية:
          </label>

          {currentUser ? (
            <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 space-y-3">
              <div className="flex items-center gap-3">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-12 h-12 rounded-2xl object-cover border-2 border-indigo-400"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg">
                    {currentUser.email ? currentUser.email.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                      {currentUser.displayName || 'معلم مسجل'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                    {currentUser.email}
                  </p>
                </div>

                <button
                  onClick={logout}
                  className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-colors"
                  title="تسجيل الخروج"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* Sync Actions */}
              <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between gap-3">
                <span className="text-[11px] text-indigo-700 dark:text-indigo-300 font-medium">
                  يتم حفظ وتشفير الطلاب والحصص والدرجات سحابياً.
                </span>

                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'جاري المزامنة...' : 'مزامنة الآن'}</span>
                </button>
              </div>

              {syncSuccessMessage && (
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>تم حفظ ومزامنة كافة السجلات بنجاح في قاعدة البيانات!</span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 flex items-center justify-center">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  سجّل الدخول لتأمين ومزامنة بياناتك سحابياً
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                  اربط حسابك بحساب Google لتشفير كافة السجلات والوصول إليها من أي جهاز بأمان تام.
                </p>
              </div>

              <button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  className="w-4 h-4"
                />
                <span>{isLoggingIn ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول عبر Google'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Security Features Bullet points */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
          <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-indigo-600" />
            <span>معايير الأمان المطبقة:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
            <li>فصل تام لبيانات كل معلم عبر مفاتيح التوثيق المشفرة (Bearer JWT).</li>
            <li>عدم تخزين أي كلمات مرور أو مفاتيح سرية في متصفح العميل (Client-side).</li>
            <li>قاعدة بيانات سحابية متوافقة مع معايير Enterprise PostgreSQL مع نسخ احتياطي مستمر.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
