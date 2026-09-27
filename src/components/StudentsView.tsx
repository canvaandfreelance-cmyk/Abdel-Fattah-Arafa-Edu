import React, { useState } from 'react';
import {
  Student,
  Group,
  TeacherProfile,
  AttendanceStatus,
  AttendanceRecord,
  Gender,
} from '../types';
import {
  Search,
  UserPlus,
  QrCode,
  Phone,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Printer,
  FileSpreadsheet,
  CalendarCheck,
  CreditCard,
  X,
  Filter,
  UserCheck,
  Send,
  LayoutGrid,
  List,
  AlertTriangle,
  Check,
  HelpCircle,
  Layers,
} from 'lucide-react';
import { generateAttendanceWhatsAppUrl } from '../utils/whatsapp';
import { GroupIconBadge } from './GroupIconBadge';

// Helper to normalize Arabic letters and diacritics for smart search
function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '') // tashkeel
    .toLowerCase()
    .trim();
}

interface StudentsViewProps {
  students: Student[];
  groups: Group[];
  teacher: TeacherProfile;
  attendanceRecords: AttendanceRecord[];
  onAddStudent: (student: Omit<Student, 'id' | 'code'> & { code?: string }) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  onShowStudentCard: (student: Student) => void;
  onRecordAttendance: (studentId: string, status: AttendanceStatus) => void;
  onOpenQuickPaymentForStudent: (student: Student) => void;
  onNavigateToGroups?: () => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  groups,
  teacher,
  attendanceRecords,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onShowStudentCard,
  onRecordAttendance,
  onOpenQuickPaymentForStudent,
  onNavigateToGroups,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [toastMessage, setToastMessage] = useState<string>('');

  // Form states
  const [formName, setFormName] = useState('');
  const [formGender, setFormGender] = useState<Gender>('male');
  const [formGroupId, setFormGroupId] = useState('');
  const [formStudentPhone, setFormStudentPhone] = useState('');
  const [formGuardianPhone, setFormGuardianPhone] = useState('');
  const [formGuardianName, setFormGuardianName] = useState('');
  const [formCustomFee, setFormCustomFee] = useState<string>('');
  const [formNotes, setFormNotes] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3500);
  };

  // Open Add modal with defaults
  const handleOpenAdd = () => {
    setFormName('');
    setFormGender('male');
    setFormGroupId(groups[0]?.id || '');
    setFormStudentPhone('');
    setFormGuardianPhone('');
    setFormGuardianName('');
    setFormCustomFee('');
    setFormNotes('');
    setEditingStudent(null);
    setIsAddModalOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormName(student.name);
    setFormGender(student.gender);
    setFormGroupId(student.groupId);
    setFormStudentPhone(student.studentPhone);
    setFormGuardianPhone(student.guardianPhone);
    setFormGuardianName(student.guardianName || '');
    setFormCustomFee(student.customFee !== undefined ? String(student.customFee) : '');
    setFormNotes(student.notes || '');
    setIsAddModalOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formGroupId) return;

    if (editingStudent) {
      onUpdateStudent({
        ...editingStudent,
        name: formName.trim(),
        gender: formGender,
        groupId: formGroupId,
        studentPhone: formStudentPhone.trim(),
        guardianPhone: formGuardianPhone.trim(),
        guardianName: formGuardianName.trim(),
        customFee: formCustomFee ? Number(formCustomFee) : undefined,
        notes: formNotes.trim(),
      });
      showNotification(`تم تحديث بيانات الطالب "${formName.trim()}" بنجاح.`);
    } else {
      onAddStudent({
        name: formName.trim(),
        gender: formGender,
        groupId: formGroupId,
        studentPhone: formStudentPhone.trim(),
        guardianPhone: formGuardianPhone.trim(),
        guardianName: formGuardianName.trim(),
        customFee: formCustomFee ? Number(formCustomFee) : undefined,
        enrollmentDate: today,
        notes: formNotes.trim(),
      });
      showNotification(`تم إضافة الطالب "${formName.trim()}" وتوليد كارت QR له بنجاح.`);
    }
    setIsAddModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!studentToDelete) return;
    const name = studentToDelete.name;
    onDeleteStudent(studentToDelete.id);
    setStudentToDelete(null);
    showNotification(`تم حذف الطالب "${name}" وسجلاته بنجاح.`);
  };

  // Filter students by query (smart match for name, code, phone) and group
  const filteredStudents = students.filter((student) => {
    const matchesGroup = selectedGroupId === 'all' || student.groupId === selectedGroupId;
    const rawQuery = searchQuery.trim();
    if (!rawQuery) return matchesGroup;

    const queryNorm = normalizeArabic(rawQuery);
    const queryDigits = rawQuery.replace(/\D/g, '');

    const nameNorm = normalizeArabic(student.name);
    const guardianNameNorm = normalizeArabic(student.guardianName || '');
    const codeNorm = student.code.toLowerCase().trim();
    const stuPhoneDigits = student.studentPhone.replace(/\D/g, '');
    const guardPhoneDigits = student.guardianPhone.replace(/\D/g, '');

    const matchesName = nameNorm.includes(queryNorm) || guardianNameNorm.includes(queryNorm);
    const matchesCode =
      codeNorm.includes(rawQuery.toLowerCase()) ||
      (queryDigits.length > 0 && codeNorm.includes(queryDigits));
    const matchesPhone = Boolean(
      queryDigits.length >= 2 &&
        (stuPhoneDigits.includes(queryDigits) || guardPhoneDigits.includes(queryDigits))
    );

    return matchesGroup && (matchesName || matchesCode || matchesPhone);
  });

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['الكود', 'الاسم', 'النوع', 'المجموعة', 'هاتف الطالب', 'هاتف ولي الأمر', 'تاريخ التسجيل', 'ملاحظات'];
    const rows = filteredStudents.map((s) => {
      const g = groups.find((grp) => grp.id === s.groupId);
      return [
        s.code,
        `"${s.name}"`,
        s.gender === 'female' ? 'أنثى' : 'ذكر',
        `"${g?.name || ''}"`,
        s.studentPhone,
        s.guardianPhone,
        s.enrollmentDate,
        `"${s.notes || ''}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `قائمة_الطلاب_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="flex items-center gap-2 p-3.5 bg-emerald-600 text-white rounded-2xl shadow-lg text-xs sm:text-sm font-bold animate-in fade-in slide-in-from-top-2">
          <Check className="w-5 h-5 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>إدارة الطلاب وبطاقات الـ QR</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono font-bold">
              {filteredStudents.length} طالب
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            إضافة وتعديل وحذف الطلاب، إصدار كروت الباركود المخصصة، وتسجيل الحضور والمدفوعات فوراً.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle: Cards vs Table */}
          <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="عرض الكروت"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="عرض الجدول"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors"
            title="تصدير كملف إكسل"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden xs:inline">Excel/CSV</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة طالب جديد</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search input by name, code or phone */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث سريع: اكتب اسم الطالب، أو رقم الهاتف، أو كود الطالب (مثال: STU-1001)..."
            className="w-full pl-4 pr-11 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 shadow-xs"
          />
          <Search className="w-5 h-5 text-indigo-500 absolute right-4 top-3.5" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3.5 top-3.5 p-1 text-slate-400 hover:text-slate-600 rounded-full"
              title="مسح البحث"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Group Selector Filter */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-x-auto no-scrollbar">
          <Filter className="w-4 h-4 text-slate-400 mr-2 ml-1 shrink-0" />
          <button
            onClick={() => setSelectedGroupId('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors shrink-0 ${
              selectedGroupId === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <GroupIconBadge group={group} size="xs" hasShadow={false} />
                <span>{group.name}</span>
                <span className="text-[10px] opacity-80">({count})</span>
              </button>
            );
          })}

          {onNavigateToGroups && (
            <button
              onClick={onNavigateToGroups}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors border border-dashed border-indigo-300 dark:border-indigo-800 shrink-0 mr-auto"
              title="إدارة وتخصيص المجموعات وإضافة مجموعات جديدة"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>إدارة المجموعات</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Students List: Responsive Cards for Mobile & Table/Cards for Desktop */}
      {filteredStudents.length > 0 ? (
        <>
          {/* 1. Mobile Cards View (Always on screens < md, or when viewMode === 'cards') */}
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${
              viewMode === 'table' ? 'md:hidden' : 'block'
            }`}
          >
            {filteredStudents.map((student) => {
              const group = groups.find((g) => g.id === student.groupId);
              const todayRecord = attendanceRecords.find(
                (r) => r.studentId === student.id && r.date === today
              );

              return (
                <div
                  key={student.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  {/* Top: Student Info & Delete/Edit Actions */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center font-black text-base shadow-sm shrink-0">
                        {student.name ? student.name.trim().charAt(0) : 'ط'}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                          {student.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono font-bold">
                            {student.code}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {student.gender === 'female' ? 'طالبة' : 'طالب'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Edit & Delete Action Icons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(student)}
                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        title="تعديل بيانات الطالب"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setStudentToDelete(student)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                        title="حذف الطالب نهائياً"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Group & Fees Details */}
                  <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span className="text-slate-400">المجموعة:</span>
                      <div className="flex items-center gap-1.5 min-w-0">
                        {group && <GroupIconBadge group={group} size="xs" hasShadow={false} />}
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[170px]">
                          {group?.name || 'غير محدد'}
                        </span>
                      </div>
                    </div>

                    {(student.studentPhone || student.guardianPhone) && (
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span className="text-slate-400">ولي الأمر:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px]" dir="ltr">
                            {student.guardianPhone || student.studentPhone}
                          </span>
                          {student.guardianPhone && (
                            <a
                              href={generateAttendanceWhatsAppUrl(
                                student,
                                teacher,
                                group,
                                todayRecord?.status || 'present',
                                today,
                                'الآن'
                              )}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded-lg"
                              title="إرسال رسالة واتساب لولي الأمر"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {student.notes && (
                      <p className="text-[11px] text-slate-400 italic truncate pt-1 border-t border-slate-200/40 dark:border-slate-700/40">
                        {student.notes}
                      </p>
                    )}
                  </div>

                  {/* Today Attendance Status Bar */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400">حالة اليوم:</span>
                      {todayRecord?.status === 'present' ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          حاضر
                        </span>
                      ) : todayRecord?.status === 'late' ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                          متأخر
                        </span>
                      ) : todayRecord?.status === 'absent' ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                          غائب
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800">
                          لم يسجل
                        </span>
                      )}
                    </div>

                    {/* Quick Attendance Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onRecordAttendance(student.id, 'present')}
                        className={`p-1.5 rounded-xl text-xs font-bold transition-all ${
                          todayRecord?.status === 'present'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 hover:bg-emerald-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-700'
                        }`}
                        title="تسجيل حاضر اليوم"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onRecordAttendance(student.id, 'absent')}
                        className={`p-1.5 rounded-xl text-xs font-bold transition-all ${
                          todayRecord?.status === 'absent'
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-100 hover:bg-rose-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-rose-700'
                        }`}
                        title="تسجيل غائب اليوم"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Actions Footer: QR Card & Payment & Delete */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => onShowStudentCard(student)}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-xl font-bold text-xs transition-colors"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>كارت QR</span>
                    </button>

                    <button
                      onClick={() => onOpenQuickPaymentForStudent(student)}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950/60 text-slate-700 hover:text-emerald-700 dark:text-slate-300 rounded-xl font-bold text-xs transition-colors"
                    >
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      <span>دفع رسوم</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 2. Desktop Table View (visible on screens >= md when viewMode === 'table') */}
          <div
            className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs ${
              viewMode === 'cards' ? 'hidden md:hidden' : 'hidden md:block'
            }`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold">
                  <tr>
                    <th className="py-3.5 px-4">الطالب</th>
                    <th className="py-3.5 px-4">الكود / كارت الـ QR</th>
                    <th className="py-3.5 px-4">المجموعة المقيد بها</th>
                    <th className="py-3.5 px-4">هواتف الاتصال</th>
                    <th className="py-3.5 px-4 text-center">حالة اليوم</th>
                    <th className="py-3.5 px-4 text-center">إجراءات سريعة</th>
                    <th className="py-3.5 px-4 text-center">إدارة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredStudents.map((student) => {
                    const group = groups.find((g) => g.id === student.groupId);
                    const todayRecord = attendanceRecords.find(
                      (r) => r.studentId === student.id && r.date === today
                    );

                    return (
                      <tr
                        key={student.id}
                        className="hover:bg-indigo-50/40 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Name & Avatar */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                              {student.name ? student.name[0] : 'ط'}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                                {student.name}
                              </p>
                              <span className="text-[11px] text-slate-400">
                                {student.gender === 'female' ? 'طالبة' : 'طالب'}
                                {student.notes ? ` • ${student.notes}` : ''}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Code & QR trigger */}
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => onShowStudentCard(student)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-xl font-mono font-bold text-xs transition-colors group"
                            title="عرض وطباعة بطاقة الـ QR الخاصة بالطالب"
                          >
                            <QrCode className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                            <span>{student.code}</span>
                          </button>
                        </td>

                        {/* Group */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            {group && <GroupIconBadge group={group} size="xs" hasShadow={false} />}
                            <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                              {group ? group.name : 'غير محدد'}
                            </span>
                          </div>
                        </td>

                        {/* Contact Phones */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5 font-mono text-[11px]">
                            {student.guardianPhone && (
                              <p className="text-slate-600 dark:text-slate-300 flex items-center gap-1" dir="ltr">
                                <span className="text-[9px] text-slate-400 font-sans">ولي أمر:</span>
                                <span>{student.guardianPhone}</span>
                              </p>
                            )}
                            {student.studentPhone && (
                              <p className="text-slate-400 flex items-center gap-1" dir="ltr">
                                <span className="text-[9px] text-slate-400 font-sans">طالب:</span>
                                <span>{student.studentPhone}</span>
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Attendance Status */}
                        <td className="py-3.5 px-4 text-center">
                          {todayRecord?.status === 'present' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>حاضر</span>
                            </span>
                          ) : todayRecord?.status === 'absent' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>غائب</span>
                            </span>
                          ) : todayRecord?.status === 'late' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                              <Clock className="w-3.5 h-3.5" />
                              <span>متأخر</span>
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                              لم يسجل اليوم
                            </span>
                          )}
                        </td>

                        {/* Quick Attendance / Payment actions */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => onRecordAttendance(student.id, 'present')}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-lg transition-colors"
                              title="تسجيل حاضر اليوم فوراً"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onRecordAttendance(student.id, 'absent')}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors"
                              title="تسجيل غائب اليوم"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onOpenQuickPaymentForStudent(student)}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60 rounded-lg transition-colors"
                              title="تسجيل دفعة سريعة"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                          </div>
                        </td>

                        {/* Edit / Delete / WhatsApp */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1 text-slate-400">
                            {student.guardianPhone && (
                              <a
                                href={generateAttendanceWhatsAppUrl(
                                  student,
                                  teacher,
                                  group,
                                  todayRecord?.status || 'present',
                                  today,
                                  'الآن'
                                )}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                                title="إرسال رسالة واتساب لولي الأمر"
                              >
                                <Send className="w-3.5 h-3.5 text-emerald-500" />
                              </a>
                            )}
                            <button
                              onClick={() => handleOpenEdit(student)}
                              className="p-1.5 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              title="تعديل بيانات الطالب"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setStudentToDelete(student)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors"
                              title="حذف الطالب نهائياً"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center py-12 p-4 shadow-xs">
          <UserCheck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">
            لم يتم العثور على طلاب مطابقة
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            جرب تغيير كلمات البحث أو أضف طالباً جديداً للمجموعة
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة طالب الآن</span>
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal (Responsive & Clean - No window.confirm) */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden p-6 space-y-4 text-center sm:text-right">
            {/* Warning Icon & Title */}
            <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-right">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                  تأكيد حذف الطالب نهائياً
                </h3>
                <p className="text-xs text-slate-500">
                  هل أنت متأكد من رغبتك في حذف هذا الطالب؟
                </p>
              </div>
            </div>

            {/* Student Preview Card */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {studentToDelete.name ? studentToDelete.name[0] : 'ط'}
              </div>
              <div className="min-w-0 text-right">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                  {studentToDelete.name}
                </h4>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {studentToDelete.code}
                  </span>
                  <span>•</span>
                  <span>{groups.find((g) => g.id === studentToDelete.groupId)?.name || ''}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-xl text-right leading-relaxed">
              ⚠️ تنبيه: سيتم حذف بيانات الطالب بشكل كامل من المنظومة، بالإضافة إلى كارت الـ QR الخاص به، وكافة سجلات الحضور وسدادات الرسوم السابقة المرتبطة به.
            </p>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs transition-colors"
              >
                إلغاء وتراجع
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md shadow-rose-600/20 active:scale-95 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>نعم، حذف الطالب الآن</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-sm sm:text-base">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <span>{editingStudent ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد وتوليد كود QR'}</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  اسم الطالب ثلاثي أو رباعي <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثال: يوسف أحمد عبد الرحمن"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    النوع:
                  </label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as Gender)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  >
                    <option value="male">ذكر (طالب)</option>
                    <option value="female">أنثى (طالبة)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    المجموعة الدراسية <span className="text-rose-500">*</span>:
                  </label>
                  <div className="flex gap-2">
                    <select
                      required
                      value={formGroupId}
                      onChange={(e) => setFormGroupId(e.target.value)}
                      className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                    >
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} ({g.scheduleTime})
                        </option>
                      ))}
                    </select>
                    {onNavigateToGroups && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddModalOpen(false);
                          onNavigateToGroups();
                        }}
                        className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold shrink-0"
                        title="إنشاء مجموعة جديدة"
                      >
                        + مجموعة
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    رقم هاتف الطالب:
                  </label>
                  <input
                    type="text"
                    value={formStudentPhone}
                    onChange={(e) => setFormStudentPhone(e.target.value)}
                    placeholder="010xxxxxxxx"
                    dir="ltr"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    رقم هاتف ولي الأمر (واتساب):
                  </label>
                  <input
                    type="text"
                    value={formGuardianPhone}
                    onChange={(e) => setFormGuardianPhone(e.target.value)}
                    placeholder="012xxxxxxxx"
                    dir="ltr"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  اسم ولي الأمر وصفته (اختياري):
                </label>
                <input
                  type="text"
                  value={formGuardianName}
                  onChange={(e) => setFormGuardianName(e.target.value)}
                  placeholder="مثال: أحمد عبد الرحمن (الأب)"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  رسوم مخصصة للطالب ({teacher.currency}) إن وجدت (خصم تفوق / إعفاء):
                </label>
                <input
                  type="number"
                  value={formCustomFee}
                  onChange={(e) => setFormCustomFee(e.target.value)}
                  placeholder="اتركه فارغاً لاعتماد رسوم المجموعة الافتراضية"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  ملاحظات إضافية عن الطالب:
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="ملاحظات سلوكية، تفوق، ظروف خاصة..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                {editingStudent ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setStudentToDelete(editingStudent);
                    }}
                    className="flex items-center gap-1 px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl font-bold transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>حذف هذا الطالب</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md transition-all active:scale-95"
                  >
                    {editingStudent ? 'حفظ التعديلات' : 'إضافة الطالب وتوليد QR'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
