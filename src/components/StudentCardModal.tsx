import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Student, Group, TeacherProfile } from '../types';
import { Printer, Download, Share2, X, Sparkles, Check, Phone, User, Award, ExternalLink, RefreshCw } from 'lucide-react';
import { cleanPhoneNumber } from '../utils/whatsapp';
import { GroupIconBadge } from './GroupIconBadge';

interface StudentCardModalProps {
  student: Student | null;
  group?: Group;
  teacher: TeacherProfile;
  isOpen: boolean;
  onClose: () => void;
  onOpenPortalForStudent?: (student: Student) => void;
  onRegeneratePortalToken?: (studentId: string) => void;
}

export const StudentCardModal: React.FC<StudentCardModalProps> = ({
  student,
  group,
  teacher,
  isOpen,
  onClose,
  onOpenPortalForStudent,
  onRegeneratePortalToken,
}) => {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [copiedPortalUrl, setCopiedPortalUrl] = useState(false);

  useEffect(() => {
    if (student) {
      // The QR code contains the secure student web portal URL with portalToken (?p=<token>)
      const currentOrigin = window.location.origin;
      const portalUrl = `${currentOrigin}/?p=${encodeURIComponent(student.portalToken || '')}`;
      
      QRCode.toDataURL(portalUrl, {
        width: 320,
        margin: 1.5,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      })
        .then((url) => setQrUrl(url))
        .catch((err) => console.error('QR Gen error', err));
    }
  }, [student, student?.portalToken]);

  if (!isOpen || !student) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQR = () => {
    if (!qrUrl) return;
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `QR_${student.code}_${student.name}.png`;
    a.click();
  };

  const handleSendWhatsApp = () => {
    const teacherTitle = teacher.gender === 'female' ? 'الأستاذة' : 'الأستاذ';
    const portalUrl = `${window.location.origin}/?p=${encodeURIComponent(student.portalToken || '')}`;

    const message = `السلام عليكم ورحمة الله وبركاته 🌹
مرحباً بكم ولي أمر الطالب: *${student.name}*
كود الطالب الخاص بالمنظومة: *${student.code}*
المجموعة: ${group?.name || 'مجموعة المدرس'}
المادة: *${teacher.subject}*
المعلم: ${teacherTitle} / ${teacher.name}

📲 *رابط البوابة التعليمية الآمنة الخاصة بالطالب:*
${portalUrl}

(عبر هذا الرابط المشفر أو بمسح كارت الـ QR، يمكن للطالب الدخول لبوابته الخاصة لمشاهدة حصص وفيديوهات الشرح، وتحميل مذكرات التدريب والامتحانات وحلها ليتم تصحيحها تلقائياً بالدرجات وتوضيح الإجابات الصحيحة، مع متابعة سجل الحضور والمصروفات).

مع تمنياتنا بدوام التميز والنجاح ✨`;

    const phone = cleanPhoneNumber(student.guardianPhone || student.studentPhone);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(student.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyPortalUrl = () => {
    const portalUrl = `${window.location.origin}/?p=${encodeURIComponent(student.portalToken || '')}`;
    navigator.clipboard.writeText(portalUrl);
    setCopiedPortalUrl(true);
    setTimeout(() => setCopiedPortalUrl(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Actions */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100">بطاقة الطالب الذكية (QR)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Card Area */}
        <div className="p-6 overflow-y-auto flex flex-col items-center">
          <div
            id="printable-student-card"
            className="w-full max-w-[340px] bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 text-white rounded-3xl p-5 shadow-xl relative overflow-hidden border border-indigo-400/20"
          >
            {/* Background design elements */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-white/15 pb-3 mb-4">
              <div>
                <span className="text-[11px] font-medium tracking-wide uppercase text-indigo-200 block">
                  {teacher.centerName || 'المركز التعليمي'}
                </span>
                <h4 className="text-sm font-extrabold text-white">
                  مادة: {teacher.subject}
                </h4>
              </div>
              <div className="text-left text-[11px] text-indigo-200">
                <span>{teacher.gender === 'female' ? 'أستاذة' : 'أستاذ'} /</span>
                <p className="font-bold text-white text-xs">{teacher.name}</p>
              </div>
            </div>

            {/* Card Body with QR Code */}
            <div className="flex flex-col items-center bg-white text-slate-900 rounded-2xl p-4 shadow-inner mb-4">
              <div className="relative">
                {qrUrl ? (
                  <img
                    src={qrUrl}
                    alt={`QR Code for ${student.name}`}
                    className="w-48 h-48 rounded-xl object-contain shadow-sm border border-slate-100"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center bg-slate-100 rounded-xl text-slate-400">
                    جاري التوليد...
                  </div>
                )}
                <div className="absolute inset-0 border-2 border-indigo-500/20 rounded-xl pointer-events-none" />
              </div>

              {/* Code badge */}
              <div className="mt-3 flex items-center gap-2 bg-slate-100 dark:bg-slate-200 px-3 py-1 rounded-full text-xs font-mono font-bold text-indigo-700">
                <span>الكود:</span>
                <span className="tracking-wider">{student.code}</span>
              </div>
            </div>

            {/* Student Details */}
            <div className="space-y-1.5 text-center">
              <h3 className="text-lg font-black text-white tracking-wide">
                {student.name}
              </h3>
              <div className="flex items-center justify-center gap-1.5 text-xs text-indigo-200 font-medium">
                {group && <GroupIconBadge group={group} size="xs" hasShadow={false} />}
                <span>{group?.name || 'مجموعة دراسية'}</span>
              </div>
              {student.guardianPhone && (
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-white/70 pt-1">
                  <Phone className="w-3 h-3" />
                  <span dir="ltr">{student.guardianPhone}</span>
                  <span className="text-[10px] text-white/50">(ولي الأمر)</span>
                </div>
              )}
            </div>

            {/* Card Footer notice */}
            <div className="mt-4 pt-2.5 border-t border-white/10 text-center text-[10px] text-white/60">
              يُبرز هذا الكارت عند الحضور لدخول الحصة وتسجيل المصروفات
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="no-print p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex flex-wrap gap-2 justify-between">
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الكارت</span>
            </button>
            <button
              onClick={handleDownloadQR}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-xl text-sm font-medium transition-all"
              title="تحميل كود QR كصورة PNG"
            >
              <Download className="w-4 h-4" />
              <span>تحميل QR</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : null}
              <span>{copied ? 'تم النسخ!' : 'نسخ الكود'}</span>
            </button>
            <button
              onClick={handleCopyPortalUrl}
              className="flex items-center gap-1 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium transition-colors"
              title="نسخ رابط صفحة الطالب الخاصة به فقط"
            >
              {copiedPortalUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <ExternalLink className="w-3.5 h-3.5" />}
              <span>{copiedPortalUrl ? 'تم نسخ الرابط!' : 'رابط صفحة الطالب'}</span>
            </button>
            {onRegeneratePortalToken && (
              <button
                onClick={() => onRegeneratePortalToken(student.id)}
                className="flex items-center gap-1 px-2.5 py-2 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-medium transition-colors border border-amber-200 dark:border-amber-800"
                title="توليد رمز أمان ورابط جديد في حال تسريب الرابط القديم"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
                <span>إعادة توليد الرابط</span>
              </button>
            )}
            {onOpenPortalForStudent && (
              <button
                onClick={() => {
                  onClose();
                  onOpenPortalForStudent(student);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition-all border border-indigo-200 dark:border-indigo-800"
                title="معاينة الصفحة كما يراها الطالب تماماً"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>معاينة صفحة الطالب</span>
              </button>
            )}
            <button
              onClick={handleSendWhatsApp}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm active:scale-95"
              title="إرسال بيانات الكارت إلى ولي الأمر عبر واتساب"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>واتساب ولي الأمر</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
