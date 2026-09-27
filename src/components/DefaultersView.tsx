import React, { useState } from 'react';
import { Student, Group, TeacherProfile, PaymentRecord } from '../types';
import {
  AlertCircle,
  Search,
  Filter,
  Send,
  CreditCard,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  Users,
  Calendar,
} from 'lucide-react';
import { generatePaymentReminderWhatsAppUrl } from '../utils/whatsapp';
import { exportPaymentsToPDF } from '../utils/pdfExport';
import { GroupIconBadge } from './GroupIconBadge';

interface DefaultersViewProps {
  students: Student[];
  groups: Group[];
  teacher: TeacherProfile;
  payments: PaymentRecord[];
  onOpenQuickPaymentForStudent: (student: Student) => void;
}

export const DefaultersView: React.FC<DefaultersViewProps> = ({
  students,
  groups,
  teacher,
  payments,
  onOpenQuickPaymentForStudent,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('شهر أكتوبر 2026');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Find students who have NOT paid for the selected month
  const paidStudentIds = new Set(
    payments
      .filter((p) => !selectedMonth || p.monthCovered === selectedMonth)
      .map((p) => p.studentId)
  );

  const allUnpaidStudents = students.filter((s) => !paidStudentIds.has(s.id));

  // Filter by group and search query
  const filteredUnpaid = allUnpaidStudents.filter((student) => {
    const matchesGroup = selectedGroupId === 'all' || student.groupId === selectedGroupId;
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !query ||
      student.name.toLowerCase().includes(query) ||
      student.code.toLowerCase().includes(query) ||
      student.studentPhone.includes(query) ||
      student.guardianPhone.includes(query);
    return matchesGroup && matchesQuery;
  });

  // Calculate total unpaid expected fees
  const totalUnpaidAmount = filteredUnpaid.reduce((sum, stu) => {
    const grp = groups.find((g) => g.id === stu.groupId);
    return sum + (stu.customFee ?? grp?.fee ?? teacher.defaultFee);
  }, 0);

  const handleExportPDF = () => {
    exportPaymentsToPDF(students, groups, payments, teacher, 'unpaid', selectedMonth);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                الطلاب المتأخرون عن سداد المصروفات
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                متابعة الطلاب غير المسددين للاشتراك، إرسال تذكيرات فورية عبر واتساب، وطباعة كشف المتأخرين.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors"
            title="طباعة وتصدير كشف المتأخرين PDF"
          >
            <Printer className="w-4 h-4 text-rose-600" />
            <span>طباعة كشف المتأخرين (PDF)</span>
          </button>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 block mb-1">إجمالي طلاب السنتر</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white">
            {students.length} طالب
          </span>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 shadow-sm">
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 block mb-1">
            طلاب سددوا ({selectedMonth})
          </span>
          <span className="text-2xl font-black text-emerald-800 dark:text-emerald-200">
            {paidStudentIds.size} طالب
          </span>
        </div>

        <div className="bg-rose-50 dark:bg-rose-950/30 p-4 rounded-2xl border border-rose-200 dark:border-rose-800 shadow-sm">
          <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 block mb-1">
            المتأخرون عن السداد
          </span>
          <span className="text-2xl font-black text-rose-800 dark:text-rose-200">
            {allUnpaidStudents.length} طالب
          </span>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200 dark:border-amber-800 shadow-sm">
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 block mb-1">
            إجمالي المتبقي تحصيله
          </span>
          <span className="text-2xl font-black text-amber-800 dark:text-amber-200">
            {totalUnpaidAmount.toLocaleString()} {teacher.currency}
          </span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Month Selector */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Calendar className="w-4 h-4 text-indigo-500 mr-2 ml-1" />
          <input
            type="text"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            placeholder="الشهر المحدد..."
            className="text-xs font-bold bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none"
          />
        </div>

        {/* Quick Search */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث باسم الطالب، الكود، أو رقم الهاتف..."
            className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-slate-100 shadow-sm"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
        </div>

        {/* Group Filter */}
        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
          <Filter className="w-4 h-4 text-slate-400 mr-1.5 ml-1 shrink-0" />
          <button
            onClick={() => setSelectedGroupId('all')}
            className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              selectedGroupId === 'all'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            الكل ({allUnpaidStudents.length})
          </button>
          {groups.map((g) => {
            const count = allUnpaidStudents.filter((s) => s.groupId === g.id).length;
            const isSelected = selectedGroupId === g.id;
            return (
              <button
                key={g.id}
                onClick={() => setSelectedGroupId(g.id)}
                className={`flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{g.name}</span>
                <span className="text-[10px] opacity-80">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* List of Unpaid Students */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 bg-rose-50/50 dark:bg-rose-950/20 border-b border-rose-100 dark:border-rose-900 flex items-center justify-between">
          <span className="text-xs font-bold text-rose-800 dark:text-rose-200">
            قائمة الطلاب المتأخرين عن السداد ({filteredUnpaid.length} طالب)
          </span>
          <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
            إجمالي المستحق: {totalUnpaidAmount.toLocaleString()} {teacher.currency}
          </span>
        </div>

        {filteredUnpaid.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredUnpaid.map((student) => {
              const group = groups.find((g) => g.id === student.groupId);
              const fee = student.customFee ?? group?.fee ?? teacher.defaultFee;
              const whatsappUrl = generatePaymentReminderWhatsAppUrl(
                student,
                teacher,
                group,
                fee,
                teacher.currency,
                selectedMonth
              );

              return (
                <div
                  key={student.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 flex items-center justify-center font-bold text-sm shrink-0">
                      {student.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {student.name}
                        </h4>
                        <span className="font-mono text-xs text-rose-600 dark:text-rose-400 font-bold">
                          ({student.code})
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span>{group?.name || 'مجموعة عامة'}</span>
                        <span>•</span>
                        <span className="font-bold text-rose-700 dark:text-rose-400">
                          مستحق: {fee} {teacher.currency}
                        </span>
                        <span>•</span>
                        <span dir="ltr">هاتف ولي الأمر: {student.guardianPhone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-transform active:scale-95"
                      title="إرسال تذكير بالمصروفات على واتساب ولي الأمر مباشرة"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>تذكير واتساب</span>
                    </a>

                    <button
                      onClick={() => onOpenQuickPaymentForStudent(student)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                      title="تسجيل دفعة هذا الطالب وإصدار إيصال سداد"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>تسجيل السداد</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="font-bold text-sm text-slate-700 dark:text-slate-200">
              لا توجد متأخرات مسجلة مطابقة للبحث أو لهذا الشهر.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              جميع الطلاب مسددون بنجاح!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
