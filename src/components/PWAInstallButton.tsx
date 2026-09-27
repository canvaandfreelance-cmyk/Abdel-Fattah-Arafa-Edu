import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as standalone app, hide the button
  if (isInstalled) {
    return null;
  }

  return (
    <>
      {/* Android / Chromium / Desktop Install Button */}
      {isInstallable && (
        <button
          onClick={install}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
          title="تثبيت التطبيق على الهاتف بدون إنترنت"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>تثبيت التطبيق على الهاتف</span>
        </button>
      )}

      {/* iOS Safari Fallback */}
      {isIOS && (
        <>
          <button
            onClick={() => setShowIOSGuide(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-slate-800 text-xs font-bold transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تثبيت على الآيفون</span>
          </button>

          {showIOSGuide && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-right space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    تثبيت التطبيق على iPhone / iPad
                  </h3>
                  <button
                    onClick={() => setShowIOSGuide(false)}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <p>1. اضغط على زر <strong>المشاركة (Share)</strong> في شريط متصفح Safari أسفل الشاشة.</p>
                  <p>2. مرر للأسفل واضغط على <strong>إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong>.</p>
                  <p>3. اضغط <strong>إضافة (Add)</strong>، وسيظهر التطبيق على هاتفك ويعمل بدون إنترنت تماماً.</p>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="w-full mt-3 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-700"
                >
                  حسناً، فهمت
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};
