import React from 'react';
import {
  Users,
  CalendarCheck,
  CreditCard,
  Layers,
  QrCode,
  UserPlus,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  Calendar,
  Sparkles,
  Phone,
  Award,
  FileCheck2,
  Plus,
  AlertCircle,
  Send,
  Printer,
  Download,
} from 'lucide-react';
import { StorageService } from '../utils/storage';
import {
  Student,
  Group,
  TeacherProfile,
  AttendanceRecord,
  PaymentRecord,
  Exam,
} from '../types';
import { NavTab } from './Navbar';
import { ScannerMode } from './ScannerModal';
import { GroupIconBadge } from './GroupIconBadge';

interface DashboardViewProps {
  teacher: TeacherProfile;
  students: Student[];
  groups: Group[];
  attendanceRecords: AttendanceRecord[];
  payments: PaymentRecord[];
  exams: Exam[];
  onNavigate: (tab: NavTab) => void;
  onOpenScannerWithMode: (mode: ScannerMode) => void;
  onSelectStudentCard: (student: Student) => void;
  onOpenAddStudent: () => void;
  onOpenAddExam?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  teacher,
  students,
  groups,
  attendanceRecords,
  payments,
  exams,
  onNavigate,
  onOpenScannerWithMode,
  onSelectStudentCard,
  onOpenAddStudent,
  onOpenAddExam,
}) => {
  const today = new Date().toISOString().split('T')[0];
  const todayArabicDay = new Intl.DateTimeFormat('ar-EG', { weekday: 'long' }).format(new Date());

  // Today's attendance stats
  const todayAttendance = attendanceRecords.filter((r) => r.date === today);
  const presentToday = todayAttendance.filter(
    (r) => r.status === 'present' || r.status === 'late'
  ).length;

  // Payments collected today and this month
  const currentMonthStr = today.slice(0, 7); // YYYY-MM
  const monthPayments = payments.filter((p) => p.date.startsWith(currentMonthStr));
  const monthTotalRevenue = monthPayments.reduce((acc, curr) => acc + curr.amount, 0);

  // Groups having classes today
  const groupsToday = groups.filter((g) =>
    g.scheduleDays.some((day) => day.includes(todayArabicDay) || todayArabicDay.includes(day))
  );

  // Defaulters: Students who have not paid for the current month
  const paidStudentIdsThisMonth = new Set(
    payments
      .filter((p) => p.date.startsWith(currentMonthStr) || p.monthCovered?.includes('أكتوبر'))
      .map((p) => p.studentId)
  );

  const unpaidStudentsThisMonth = students.filter((s) => !paidStudentIdsThisMonth.has(s.id));

  // Check if last backup was more than 14 days ago or never
  const lastBackupStr = StorageService.getLastBackupDate();
  let showBackupReminder = false;
  let daysSinceBackup = 0;
  if (!lastBackupStr) {
    showBackupReminder = true;
  } else {
    const lastDate = new Date(lastBackupStr);
    const diffTime = Math.abs(Date.now() - lastDate.getTime());
    daysSinceBackup = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (daysSinceBackup >= 14) {
      showBackupReminder = true;
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner (Settings and QR buttons removed per request) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 text-white p-5 sm:p-6 shadow-xl">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>
                اليوم {todayArabicDay} • {new Date().toLocaleDateString('ar-EG')}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              مرحباً، {teacher.gender === 'female' ? 'أستاذة' : 'أستاذ'} {teacher.name} 👋
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200/90">
              {teacher.subject} • {teacher.centerName || 'المنظومة التعليمية الذكية'}
            </p>
          </div>
        </div>
      </div>

      {/* Gentle Backup Reminder Banner (if last backup > 14 days or never) */}
      {showBackupReminder && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm">
                تذكير بأمان البيانات: لم تقم بتصدير نسخة احتياطية منذ {daysSinceBackup > 0 ? `${daysSinceBackup} يوماً` : 'فترة'}
              </h4>
              <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 mt-0.5">
                لحفظ سجلاتك وملفات الطلاب في مكان آمن على جهازك، يُنصح بتصدير نسخة احتياطية دورياً.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('settings')}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 transition-colors shadow-xs"
          >
            تصدير الآن
          </button>
        </div>
      )}

      {/* Stats KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div
          onClick={() => onNavigate('students')}
          className="cursor-pointer bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              إجمالي الطلاب
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {students.length}
            </span>
            <span className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5">
              <span>عرض القائمة</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Today's Attendance */}
        <div
          onClick={() => onNavigate('attendance')}
          className="cursor-pointer bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              حضور اليوم
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {presentToday}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              طالب تم تسجيلهم
            </span>
          </div>
        </div>

        {/* Month Revenue */}
        <div
          onClick={() => onNavigate('payments')}
          className="cursor-pointer bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              متحصلات الشهر
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {monthTotalRevenue.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {teacher.currency}
            </span>
          </div>
        </div>

        {/* Exams & Groups Count */}
        <div
          onClick={() => onNavigate('exams')}
          className="cursor-pointer bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              الامتحانات المجدولة
            </span>
            <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {exams.length}
            </span>
            <span className="text-xs text-violet-600 dark:text-violet-400 flex items-center gap-0.5">
              <span>إدارة الاختبارات</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Today's Groups + Quick Student Search & Access */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule & Groups (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    جدول مجموعات اليوم ({todayArabicDay})
                  </h3>
                  <p className="text-xs text-slate-500">
                    المجموعات التي لديها مواعيد مقررة في هذا اليوم
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('groups')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                جميع المجموعات ({groups.length})
              </button>
            </div>

            {groupsToday.length > 0 ? (
              <div className="space-y-3">
                {groupsToday.map((g) => {
                  const groupStudents = students.filter((s) => s.groupId === g.id);
                  const groupAttendedCount = todayAttendance.filter(
                    (a) => a.groupId === g.id && (a.status === 'present' || a.status === 'late')
                  ).length;

                  return (
                    <div
                      key={g.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <GroupIconBadge group={g} size="md" />
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                              {g.name}
                            </h4>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                              {g.grade}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {g.scheduleTime}
                            </span>
                            <span>•</span>
                            <span>{groupStudents.length} طلاب مسجلين</span>
                            <span>•</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              حضر منهم: {groupAttendedCount}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onNavigate('attendance')}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                        >
                          تسجيل حضور المجموعة
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                <p className="text-xs text-slate-500 font-medium">
                  لا توجد حصص مجدولة رسمياً اليوم ({todayArabicDay}).
                </p>
                <button
                  onClick={() => onNavigate('attendance')}
                  className="mt-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  فتح شاشة تسجيل الحضور لأي مجموعة
                </button>
              </div>
            )}
          </div>

          {/* Quick Action Shortcuts */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <button
              onClick={onOpenAddStudent}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all text-right flex flex-col justify-between"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 flex items-center justify-center mb-2">
                <UserPlus className="w-4 h-4" />
              </div>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-100">
                إضافة طالب جديد
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                توليد كود وبطاقة QR فورية
              </span>
            </button>

            <button
              onClick={() => onNavigate('exams')}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all text-right flex flex-col justify-between"
            >
              <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-950/70 text-violet-600 flex items-center justify-center mb-2">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-100">
                إضافة وتنبيه اختبار
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                إرسال واتساب تلقائي لأولياء الأمور
              </span>
            </button>

            <button
              onClick={() => onNavigate('lessons')}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all text-right flex flex-col justify-between col-span-2 sm:col-span-1"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 flex items-center justify-center mb-2">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-100">
                مكتبة الفيديوهات والدروس
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                مشاركة الروابط مع الطلاب
              </span>
            </button>
          </div>
        </div>

        {/* Right Column: Students Quick Access with QR cards */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-500" />
                <span>بطاقات الطلاب الذكية (QR)</span>
              </h3>
              <button
                onClick={() => onNavigate('students')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                الكل ({students.length})
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              اضغط على أي طالب لعرض كارت الـ QR المخصص له وطباعته أو إرساله لولي الأمر:
            </p>

            <div className="space-y-2 overflow-y-auto max-h-[380px] pr-1">
              {students.slice(0, 6).map((student) => {
                const group = groups.find((g) => g.id === student.groupId);
                return (
                  <div
                    key={student.id}
                    onClick={() => onSelectStudentCard(student)}
                    className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-slate-800/60 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                        {student.name[0]}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                          {student.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {student.code} • {group?.grade || 'طالب'}
                        </p>
                      </div>
                    </div>

                    <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400">
                      <QrCode className="w-4 h-4" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
