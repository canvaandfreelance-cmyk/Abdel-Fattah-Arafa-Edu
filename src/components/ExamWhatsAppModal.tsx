import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  CheckCircle2,
  Phone,
  MessageSquare,
  Users,
  Calendar,
  Clock,
  Sparkles,
  ExternalLink,
  Award,
  AlertCircle,
  Copy,
  Check,
  Play,
  SkipForward,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { Exam, Student, Group, TeacherProfile } from '../types';
import { generateExamAnnouncementWhatsAppUrl, cleanPhoneNumber } from '../utils/whatsapp';

interface ExamWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: Exam | null;
  students: Student[];
  groups: Group[];
  teacher: TeacherProfile;
}

export const ExamWhatsAppModal: React.FC<ExamWhatsAppModalProps> = ({
  isOpen,
  onClose,
  exam,
  students,
  groups,
  teacher,
}) => {
  const [sentStudentIds, setSentStudentIds] = useState<Record<string, boolean>>({});
  const [isBulkModeActive, setIsBulkModeActive] = useState(false);
  const [bulkQueueIndex, setBulkQueueIndex] = useState(0);
  const [copiedNumbers, setCopiedNumbers] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [isBatchOpening, setIsBatchOpening] = useState(false);
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState<number | null>(null);

  useEffect(() => {
    // Reset queue index when modal opens or exam changes
    setBulkQueueIndex(0);
    setIsBulkModeActive(false);
    setIsBatchOpening(false);
    setAutoAdvanceTimer(null);
  }, [exam?.id, isOpen]);

  if (!isOpen || !exam) return null;

  const targetGroup = groups.find((g) => g.id === exam.groupId);

  // Filter students belonging to this exam's group (or all if groupId is 'all')
  const examStudents = students.filter((s) => {
    if (!exam.groupId || exam.groupId === 'all') return true;
    return s.groupId === exam.groupId;
  });

  // Students who have valid registered phone numbers
  const studentsWithPhone = examStudents.filter((s) => {
    const raw = s.guardianPhone || s.studentPhone;
    return Boolean(raw && cleanPhoneNumber(raw).length >= 8);
  });

  const studentsWithoutPhone = examStudents.filter((s) => {
    const raw = s.guardianPhone || s.studentPhone;
    return !raw || cleanPhoneNumber(raw).length < 8;
  });

  const sentCount = Object.keys(sentStudentIds).filter((id) => sentStudentIds[id]).length;
  const progressPercent =
    studentsWithPhone.length > 0
      ? Math.min(100, Math.round((sentCount / studentsWithPhone.length) * 100))
      : 0;

  // Single send
  const handleSendToStudent = (student: Student) => {
    const url = generateExamAnnouncementWhatsAppUrl(student, teacher, targetGroup, exam);
    window.open(url, '_blank');
    setSentStudentIds((prev) => ({ ...prev, [student.id]: true }));
  };

  // Bulk: Start Interactive Bulk Mode
  const handleStartBulkMode = () => {
    // Find first student not yet sent
    const firstUnsentIdx = studentsWithPhone.findIndex((s) => !sentStudentIds[s.id]);
    setBulkQueueIndex(firstUnsentIdx >= 0 ? firstUnsentIdx : 0);
    setIsBulkModeActive(true);
  };

  // Bulk: Send Current Student in Queue and advance
  const handleSendCurrentAndNext = () => {
    const currentStudent = studentsWithPhone[bulkQueueIndex];
    if (!currentStudent) return;

    handleSendToStudent(currentStudent);

    if (bulkQueueIndex < studentsWithPhone.length - 1) {
      setBulkQueueIndex((prev) => prev + 1);
    }
  };

  // Bulk: Skip Current Student
  const handleSkipCurrent = () => {
    if (bulkQueueIndex < studentsWithPhone.length - 1) {
      setBulkQueueIndex((prev) => prev + 1);
    }
  };

  // Bulk: Open All Tabs sequentially (automated batch dispatch)
  const handleOpenAllTabsBatch = () => {
    if (studentsWithPhone.length === 0) return;

    const confirmMsg =
      `سيتم فتح محادثات الواتساب لـ (${studentsWithPhone.length}) من أولياء الأمور المسجلين.\n` +
      `إذا طلب المتصفح الإذن بالسماح بالنوافذ المنبثقة (Popups)، يرجى الضغط على "السماح دائماً (Allow)".\n\n` +
      `هل تود المتابعة الآن؟`;

    if (!window.confirm(confirmMsg)) return;

    setIsBatchOpening(true);

    const unsentStudents = studentsWithPhone.filter((s) => !sentStudentIds[s.id]);
    const queueToProcess = unsentStudents.length > 0 ? unsentStudents : studentsWithPhone;

    queueToProcess.forEach((student, index) => {
      setTimeout(() => {
        const url = generateExamAnnouncementWhatsAppUrl(student, teacher, targetGroup, exam);
        window.open(url, '_blank');
        setSentStudentIds((prev) => ({ ...prev, [student.id]: true }));

        if (index === queueToProcess.length - 1) {
          setIsBatchOpening(false);
          setIsBulkModeActive(false);
        }
      }, index * 700); // 700ms interval between tabs to prevent browser popup block
    });
  };

  // Copy all phone numbers for WhatsApp Broadcast
  const handleCopyAllPhoneNumbers = () => {
    const phones = studentsWithPhone
      .map((s) => cleanPhoneNumber(s.guardianPhone || s.studentPhone))
      .filter(Boolean);
    const text = phones.join(', ');
    navigator.clipboard.writeText(text);
    setCopiedNumbers(true);
    setTimeout(() => setCopiedNumbers(false), 3000);
  };

  // Copy standard broadcast message
  const handleCopyBroadcastMessage = () => {
    const teacherTitle = teacher.gender === 'female' ? 'الأستاذة' : 'الأستاذ';
    const message = `السلام عليكم ورحمة الله وبركاته 🌹
أولياء الأمور الأفاضل الكرام،
مجموعة: ${targetGroup?.name || 'مجموعة المدرس'}
المادة: *${teacher.subject}*

📢 *تنويه هام بموعد اختبار رسمي:*
📝 اسم الاختبار: *${exam.title}*
📅 الموعد: *${exam.date}* - الساعة: *${exam.time}*
🎯 الدرجة العظمى: *${exam.maxScore} درجة*
${exam.topics ? `📚 الموضوعات المقررة:\n${exam.topics}\n` : ''}${exam.notes ? `💡 ملاحظات وتعليمات:\n${exam.notes}\n` : ''}
نرجو من حضراتكم حث الطلاب على الاستعداد والتركيز لتحقيق أعلى الدرجات والتفوق بإذن الله تعالى.

مع خالص التحيات والتقدير،
${teacherTitle} / ${teacher.name}
${teacher.centerName ? `سنتر: ${teacher.centerName}` : ''}
${teacher.phone ? `هاتف التواصل: ${teacher.phone}` : ''}`;

    navigator.clipboard.writeText(message);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 3000);
  };

  const currentQueueStudent = studentsWithPhone[bulkQueueIndex];
  const allSent = studentsWithPhone.length > 0 && sentCount >= studentsWithPhone.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 text-white flex items-start justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-emerald-100 text-xs font-bold backdrop-blur-xs">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>إرسال إشعارات الواتساب لأولياء الأمور</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {exam.title}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-100 pt-1">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                المجموعة: {targetGroup ? targetGroup.name : 'جميع المجموعات'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {exam.date}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {exam.time}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                الدرجة: {exam.maxScore}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bulk Action Banner - Prominent & Highly Accessible */}
        <div className="p-4 sm:p-5 bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/50 dark:from-emerald-950/40 dark:via-slate-800 dark:to-teal-950/40 border-b border-emerald-200 dark:border-emerald-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/30">
                  <Zap className="w-4 h-4 fill-white" />
                </span>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                  إرسال رسالة جماعية لجميع أولياء الأمور
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                أرسل تنبيه موعد ودرجة الاختبار لجميع أولياء الأمور المسجلين ({studentsWithPhone.length} رقم) بضغطة زر واحدة.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <button
                onClick={handleStartBulkMode}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-black shadow-md shadow-emerald-600/25 active:scale-95 transition-all"
              >
                <Zap className="w-4 h-4" />
                <span>إرسال جماعي متتابع ({studentsWithPhone.length})</span>
              </button>

              <button
                onClick={handleOpenAllTabsBatch}
                disabled={isBatchOpening || studentsWithPhone.length === 0}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all"
                title="فتح محادثات واتساب لكل ولي أمر في تبويب جديد فوراً"
              >
                <ExternalLink className="w-4 h-4" />
                <span>{isBatchOpening ? 'جاري الفتح...' : 'فتح الكل فوراً'}</span>
              </button>

              <button
                onClick={handleCopyBroadcastMessage}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-all"
                title="نسخ نص الرسالة بالكامل لرسائل البث الجماعي (Broadcast)"
              >
                {copiedMessage ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>تم النسخ!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-500" />
                    <span>نسخ النص</span>
                  </>
                )}
              </button>

              <button
                onClick={handleCopyAllPhoneNumbers}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-all"
                title="نسخ جميع أرقام أولياء الأمور لاستخدامها في قوائم البث"
              >
                {copiedNumbers ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>تم نسخ الأرقام!</span>
                  </>
                ) : (
                  <>
                    <Phone className="w-4 h-4 text-slate-500" />
                    <span>الأرقام</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Interactive Sequential Bulk Dispatcher Panel */}
          {isBulkModeActive && currentQueueStudent && (
            <div className="mt-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 shadow-sm animate-in fade-in duration-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 fill-emerald-600" />
                  وضع الإرسال المتتابع الموجه ({bulkQueueIndex + 1} من {studentsWithPhone.length})
                </span>
                <button
                  onClick={() => setIsBulkModeActive(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
                >
                  إلغاء وضع التتابع ✕
                </button>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Current Student Target Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                    {bulkQueueIndex + 1}
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-900 dark:text-white">
                      {currentQueueStudent.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <span>كود: {currentQueueStudent.code}</span>
                      <span>•</span>
                      <span className="font-mono dir-ltr text-emerald-700 dark:text-emerald-300 font-bold">
                        {currentQueueStudent.guardianPhone || currentQueueStudent.studentPhone}
                      </span>
                      {currentQueueStudent.guardianName && (
                        <span>({currentQueueStudent.guardianName})</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={handleSendCurrentAndNext}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/30"
                  >
                    <Send className="w-3.5 h-3.5 rotate-180" />
                    <span>إرسال للواتساب والتالي ➡️</span>
                  </button>

                  <button
                    onClick={handleSkipCurrent}
                    className="inline-flex items-center gap-1 px-3 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                    <span>تخطي</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status Sub-bar */}
        <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-600 dark:text-slate-400 font-bold">تم إرسال:</span>
            <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
              {sentCount} من {studentsWithPhone.length} مسجلين
            </strong>
            {allSent && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                اكتمل الإرسال للجميع بنجاح!
              </span>
            )}
          </div>
          <span className="text-slate-500 dark:text-slate-400 text-[11px] hidden sm:inline">
            يمكنك أيضاً الإرسال الفردي لأي طالب من القائمة أدناه
          </span>
        </div>

        {/* Students List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1">
          {examStudents.length > 0 ? (
            examStudents.map((student) => {
              const isSent = Boolean(sentStudentIds[student.id]);
              const rawPhone = student.guardianPhone || student.studentPhone;
              const hasPhone = Boolean(rawPhone && cleanPhoneNumber(rawPhone).length >= 8);

              return (
                <div
                  key={student.id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSent
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/80'
                      : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-emerald-300'
                  }`}
                >
                  {/* Student & Guardian Info */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shadow-xs ${
                        isSent
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gradient-to-tr from-slate-700 to-slate-800 text-white'
                      }`}
                    >
                      {isSent ? <Check className="w-5 h-5" /> : student.name[0]}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {student.name}
                        </h4>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {student.code}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>ولي الأمر: {student.guardianName || 'مسجل'}</span>
                        </span>
                        <span>•</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300 dir-ltr font-bold">
                          {rawPhone || 'لا يوجد هاتف'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Status */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {isSent && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        تم الإرسال
                      </span>
                    )}

                    {hasPhone ? (
                      <button
                        onClick={() => handleSendToStudent(student)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                          isSent
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        <Send className="w-3.5 h-3.5 rotate-180" />
                        <span>{isSent ? 'إعادة الإرسال' : 'إرسال لولي الأمر'}</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-rose-500 font-bold flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
                        <AlertCircle className="w-3 h-3" />
                        رقم الهاتف غير مسجل
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <Users className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
              <p className="text-xs text-slate-500">
                لا يوجد طلاب مسجلين في هذه المجموعة حتى الآن.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-right">
            تتضمن الرسالة اسم الطالب وموعد الاختبار وتفاصيل المادة والملاحظات تلقائياً بتنسيق رسمي.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
            >
              إغلاق النافذة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
