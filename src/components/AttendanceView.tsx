import React, { useState } from 'react';
import {
  Student,
  Group,
  TeacherProfile,
  AttendanceRecord,
  AttendanceStatus,
} from '../types';
import {
  CalendarCheck,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  Users,
  QrCode,
  Send,
  Calendar,
  Sparkles,
  CheckCheck,
  Filter,
  Printer,
} from 'lucide-react';
import { generateAttendanceWhatsAppUrl } from '../utils/whatsapp';
import { exportAttendanceToPDF } from '../utils/pdfExport';
import confetti from 'canvas-confetti';
import { GroupIconBadge } from './GroupIconBadge';

interface AttendanceViewProps {
  students: Student[];
  groups: Group[];
  teacher: TeacherProfile;
  attendanceRecords: AttendanceRecord[];
  onRecordAttendance: (studentId: string, status: AttendanceStatus, note?: string) => void;
  onOpenScanner: () => void;
  onShowStudentCard: (student: Student) => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  students,
  groups,
  teacher,
  attendanceRecords,
  onRecordAttendance,
  onOpenScanner,
  onShowStudentCard,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AttendanceStatus>('all');
  const [showMarkAllConfirm, setShowMarkAllConfirm] = useState(false);

  // Filter students based on group and search query
  const eligibleStudents = students.filter((s) => {
    const matchesGroup = selectedGroupId === 'all' || s.groupId === selectedGroupId;
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !query ||
      s.name.toLowerCase().includes(query) ||
      s.code.toLowerCase().includes(query) ||
      s.studentPhone.includes(query);
    return matchesGroup && matchesQuery;
  });

  // Today/Selected Date records
  const dateRecords = attendanceRecords.filter((r) => r.date === selectedDate);

  // Compute metrics
  const totalCount = eligibleStudents.length;
  const presentCount = eligibleStudents.filter((s) => {
    const rec = dateRecords.find((r) => r.studentId === s.id);
    return rec?.status === 'present';
  }).length;
  const lateCount = eligibleStudents.filter((s) => {
    const rec = dateRecords.find((r) => r.studentId === s.id);
    return rec?.status === 'late';
  }).length;
  const excusedCount = eligibleStudents.filter((s) => {
    const rec = dateRecords.find((r) => r.studentId === s.id);
    return rec?.status === 'excused';
  }).length;
  const absentCount = eligibleStudents.filter((s) => {
    const rec = dateRecords.find((r) => r.studentId === s.id);
    return rec?.status === 'absent';
  }).length;
  const unrecordedCount = totalCount - (presentCount + lateCount + excusedCount + absentCount);

  const attendedTotal = presentCount + lateCount;
  const attendanceRate = totalCount > 0 ? Math.round((attendedTotal / totalCount) * 100) : 0;

  // Mark all currently filtered students as present
  const handleConfirmMarkAll = () => {
    eligibleStudents.forEach((s) => {
      onRecordAttendance(s.id, 'present');
    });
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });
    setShowMarkAllConfirm(false);
  };

  // Filter list by status tab if selected
  const displayedStudents = eligibleStudents.filter((s) => {
    if (statusFilter === 'all') return true;
    const rec = dateRecords.find((r) => r.studentId === s.id);
    return rec?.status === statusFilter;
  });

  const selectedGroupObj = groups.find((g) => g.id === selectedGroupId);

  return (
    <div className="space-y-6">
      {/* Top Banner and Controls */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-indigo-600" />
            <span>تسجيل وتأكيد حضور الطلاب</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            سجّل الحضور عبر مسح رمز الـ QR أو البحث السريع بالاسم والنقر على حالة الطالب مباشرة.
          </p>
        </div>

        {/* Date Selector, PDF export & QR Scanner Launch */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
            />
          </div>

          <button
            onClick={() => exportAttendanceToPDF(students, groups, attendanceRecords, teacher, selectedDate, selectedGroupId)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors"
            title="طباعة وتصدير كشف الحضور كملف PDF"
          >
            <Printer className="w-4 h-4 text-indigo-600" />
            <span>طباعة كشف الحضور (PDF)</span>
          </button>

          <button
            onClick={onOpenScanner}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/25 active:scale-95 transition-all group"
            title="فتح وضع المسح الفوري - بمجرد قراءة الكود يُسجل الحضور فوراً مع إمكانية الإيقاف والتفعيل"
          >
            <QrCode className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            <span>تشغيل وضع المسح الفوري (QR)</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 block">إجمالي الطلاب</span>
          <span className="text-xl font-black text-slate-800 dark:text-slate-100">{totalCount}</span>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800 shadow-sm">
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block">✅ حاضر</span>
          <span className="text-xl font-black text-emerald-800 dark:text-emerald-200">{presentCount}</span>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/30 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-800 shadow-sm">
          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 block">⏰ متأخر</span>
          <span className="text-xl font-black text-amber-800 dark:text-amber-200">{lateCount}</span>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/30 p-3.5 rounded-2xl border border-blue-200 dark:border-blue-800 shadow-sm">
          <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 block">ℹ️ بعذر</span>
          <span className="text-xl font-black text-blue-800 dark:text-blue-200">{excusedCount}</span>
        </div>

        <div className="bg-rose-50 dark:bg-rose-950/30 p-3.5 rounded-2xl border border-rose-200 dark:border-rose-800 shadow-sm">
          <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 block">❌ غائب</span>
          <span className="text-xl font-black text-rose-800 dark:text-rose-200">{absentCount}</span>
        </div>

        <div className="bg-indigo-50 dark:bg-indigo-950/30 p-3.5 rounded-2xl border border-indigo-200 dark:border-indigo-800 shadow-sm">
          <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 block">نسبة الحضور</span>
          <span className="text-xl font-black text-indigo-800 dark:text-indigo-200">{attendanceRate}%</span>
        </div>
      </div>

      {/* Filters & Search ("تبحث عن الطالب باسمه وتجيب الاسم بتاعه في التطبيق وتسجله من خلال اسمهم مش شرط الكود") */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث باسم الطالب فوراً للتأكيد (مثال: يوسف، سارة)..."
            className="w-full pl-4 pr-11 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 shadow-sm"
          />
          <Search className="w-5 h-5 text-slate-400 absolute right-4 top-3.5" />
        </div>

        {/* Group selector */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
          <button
            onClick={() => setSelectedGroupId('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              selectedGroupId === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            الكل ({students.length})
          </button>
          {groups.map((group) => {
            const count = students.filter((s) => s.groupId === group.id).length;
            const isSelected = selectedGroupId === group.id;
            return (
              <button
                key={group.id}
                onClick={() => setSelectedGroupId(group.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <GroupIconBadge group={group} size="xs" hasShadow={false} />
                <span>{group.name}</span>
                <span className="text-[10px] opacity-80">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Mark All Present Quick Button */}
        <button
          onClick={() => setShowMarkAllConfirm(true)}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition-all shadow-sm active:scale-95"
          title="تسجيل كل طلاب هذه القائمة كحاضرين بنقرة واحدة"
        >
          <CheckCheck className="w-4 h-4" />
          <span>تحضير الكل حاضر</span>
        </button>
      </div>

      {/* Attendance List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {displayedStudents.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {displayedStudents.map((student) => {
              const group = groups.find((g) => g.id === student.groupId);
              const record = dateRecords.find((r) => r.studentId === student.id);
              const currentStatus = record?.status;

              return (
                <div
                  key={student.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                >
                  {/* Student Details */}
                  <div className="flex items-center gap-3">
                    <div
                      onClick={() => onShowStudentCard(student)}
                      className="cursor-pointer w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center font-bold text-sm shadow-sm hover:scale-105 transition-transform"
                      title="عرض بطاقة QR"
                    >
                      {student.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {student.name}
                        </h4>
                        <button
                          onClick={() => onShowStudentCard(student)}
                          className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-[10px] text-slate-500 hover:text-indigo-600 flex items-center gap-1 font-bold"
                          title="عرض كود QR"
                        >
                          <QrCode className="w-3 h-3 text-indigo-500" />
                          <span>{student.code}</span>
                        </button>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {group?.name || 'مجموعة دراسية'}
                        {record?.time ? ` • سُجل في ${record.time}` : ''}
                        {record?.method === 'qr' && (
                          <span className="text-indigo-500 font-bold mr-1"> (بواسطة QR)</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Attendance Status Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Present */}
                    <button
                      onClick={() => onRecordAttendance(student.id, 'present')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                        currentStatus === 'present'
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-105'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>حاضر</span>
                    </button>

                    {/* Late */}
                    <button
                      onClick={() => onRecordAttendance(student.id, 'late')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                        currentStatus === 'late'
                          ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 scale-105'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/50 hover:text-amber-600'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>متأخر</span>
                    </button>

                    {/* Excused */}
                    <button
                      onClick={() => onRecordAttendance(student.id, 'excused')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                        currentStatus === 'excused'
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-105'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600'
                      }`}
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>بعذر</span>
                    </button>

                    {/* Absent */}
                    <button
                      onClick={() => onRecordAttendance(student.id, 'absent')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                        currentStatus === 'absent'
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 scale-105'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>غائب</span>
                    </button>

                    {/* WhatsApp Guardian Notification */}
                    {student.guardianPhone && (
                      <a
                        href={generateAttendanceWhatsAppUrl(
                          student,
                          teacher,
                          group,
                          currentStatus || 'present',
                          selectedDate,
                          record?.time || new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-emerald-50 dark:bg-slate-800 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl text-xs transition-colors"
                        title="إرسال إفادة الحضور/الغياب لولي الأمر عبر واتساب"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 p-4">
            <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">
              لا يوجد طلاب في هذه المجموعة
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              تأكد من اختيار المجموعة الصحيحة أو أضف طلاباً إليها
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Marking All Present */}
      {showMarkAllConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-center sm:text-right">
            <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
              تسجيل حضور جميع الطلاب
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              هل تريد تسجيل جميع الطلاب المعروضين ({eligibleStudents.length} طالب) كحاضرين لهذا اليوم ({selectedDate}) بنقرة واحدة؟
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowMarkAllConfirm(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmMarkAll}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-95"
              >
                نعم، تسجيل الكل حاضر
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
