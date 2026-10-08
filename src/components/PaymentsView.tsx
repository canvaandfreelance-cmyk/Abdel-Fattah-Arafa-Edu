import React, { useState } from 'react';
import {
  Student,
  Group,
  TeacherProfile,
  PaymentRecord,
  PaymentType,
} from '../types';
import {
  CreditCard,
  Plus,
  Search,
  FileSpreadsheet,
  QrCode,
  CheckCircle,
  Clock,
  Send,
  Printer,
  Calendar,
  DollarSign,
  AlertCircle,
  X,
  Wallet,
  Trash2,
} from 'lucide-react';
import { generatePaymentReceiptWhatsAppUrl, generatePaymentReminderWhatsAppUrl } from '../utils/whatsapp';
import { exportPaymentsToPDF } from '../utils/pdfExport';
import { sounds } from '../utils/audio';
import confetti from 'canvas-confetti';

interface PaymentsViewProps {
  students: Student[];
  groups: Group[];
  teacher: TeacherProfile;
  payments: PaymentRecord[];
  onRecordPayment: (
    studentId: string,
    amount: number,
    type: PaymentType,
    method: 'cash' | 'vodafone_cash' | 'instapay' | 'bank_transfer',
    notes?: string,
    monthCovered?: string
  ) => PaymentRecord | void;
  onDeletePayment?: (id: string) => void;
  onOpenScanner: () => void;
  preselectedStudent?: Student | null;
  onClearPreselectedStudent?: () => void;
  initialTab?: 'history' | 'unpaid';
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  students,
  groups,
  teacher,
  payments,
  onRecordPayment,
  onDeletePayment,
  onOpenScanner,
  preselectedStudent,
  onClearPreselectedStudent,
  initialTab,
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'unpaid'>(initialTab || 'history');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('شهر أكتوبر 2026');
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(Boolean(preselectedStudent));

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Modal Form States
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    preselectedStudent?.id || (students[0]?.id || '')
  );
  const [amount, setAmount] = useState<number>(teacher.defaultFee || 250);
  const [paymentType, setPaymentType] = useState<PaymentType>('monthly_fee');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'vodafone_cash' | 'instapay' | 'bank_transfer'>('cash');
  const [notes, setNotes] = useState('');
  const [formMonth, setFormMonth] = useState('شهر أكتوبر 2026');

  // React to preselectedStudent changes
  React.useEffect(() => {
    if (preselectedStudent) {
      setSelectedStudentId(preselectedStudent.id);
      const studentGroup = groups.find((g) => g.id === preselectedStudent.groupId);
      setAmount(preselectedStudent.customFee ?? studentGroup?.fee ?? teacher.defaultFee);
      setIsRecordModalOpen(true);
    }
  }, [preselectedStudent, groups, teacher.defaultFee]);

  const handleStudentSelect = (id: string) => {
    setSelectedStudentId(id);
    const stu = students.find((s) => s.id === id);
    if (stu) {
      const studentGroup = groups.find((g) => g.id === stu.groupId);
      setAmount(stu.customFee ?? studentGroup?.fee ?? teacher.defaultFee);
    }
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || amount <= 0) return;

    const newPayment = onRecordPayment(
      selectedStudentId,
      amount,
      paymentType,
      paymentMethod,
      notes,
      formMonth
    );

    sounds.playPaymentCash();
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.6 },
    });

    setIsRecordModalOpen(false);
    if (onClearPreselectedStudent) onClearPreselectedStudent();
  };

  // Metrics
  const totalRevenue = payments.reduce((acc, curr) => acc + curr.amount, 0);

  // Paid students for selected month
  const paidStudentIds = new Set(
    payments.filter((p) => p.monthCovered === selectedMonth).map((p) => p.studentId)
  );

  const unpaidStudents = students.filter((s) => !paidStudentIds.has(s.id));

  // Filter payment records
  const filteredPayments = payments.filter((p) => {
    const student = students.find((s) => s.id === p.studentId);
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      student?.name.toLowerCase().includes(query) ||
      student?.code.toLowerCase().includes(query) ||
      p.receiptNumber.toLowerCase().includes(query)
    );
  });

  const getMethodBadge = (m: string) => {
    switch (m) {
      case 'vodafone_cash':
        return <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300 font-bold text-[10px]">فودافون كاش</span>;
      case 'instapay':
        return <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 font-bold text-[10px]">إنستاباي</span>;
      case 'bank_transfer':
        return <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold text-[10px]">تحويل بنكي</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">نقداً (كاش)</span>;
    }
  };

  const getTypeArabic = (t: PaymentType) => {
    switch (t) {
      case 'monthly_fee':
        return 'اشتراك شهري';
      case 'session_fee':
        return 'رسوم حصة';
      case 'book_notes':
        return 'مذكرة وكتب';
      case 'exam':
        return 'رسوم امتحان';
      default:
        return 'أخرى';
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['رقم الإيصال', 'اسم الطالب', 'الكود', 'المبلغ', 'الشهر/البند', 'طريقة الدفع', 'التاريخ والوقت', 'ملاحظات'];
    const rows = filteredPayments.map((p) => {
      const student = students.find((s) => s.id === p.studentId);
      return [
        p.receiptNumber,
        `"${student?.name || ''}"`,
        student?.code || '',
        `${p.amount} ${teacher.currency}`,
        `"${p.monthCovered || getTypeArabic(p.type)}"`,
        p.paymentMethod,
        `${p.date} ${p.time}`,
        `"${p.notes || ''}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `سجل_المدفوعات_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-600" />
            <span>إدارة مدفوعات واشتراكات الطلاب</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            تسجيل المصروفات الشهرية ورسوم الحصص، مسح كود QR للدفع الفوري، وإرسال إيصالات سداد لواتساب ولي الأمر.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportPaymentsToPDF(students, groups, payments, teacher, activeTab === 'unpaid' ? 'unpaid' : 'all', selectedMonth)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors"
            title="طباعة وتصدير كشف المدفوعات كـ PDF"
          >
            <Printer className="w-4 h-4 text-emerald-600" />
            <span>طباعة كشف المدفوعات (PDF)</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>تقرير المدفوعات Excel</span>
          </button>

          <button
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            title="مسح QR كود الطالب وتسجيل دفعة فوراً"
          >
            <QrCode className="w-4 h-4" />
            <span>مسح QR للدفع</span>
          </button>

          <button
            onClick={() => {
              if (onClearPreselectedStudent) onClearPreselectedStudent();
              setIsRecordModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل دفعة جديدة</span>
          </button>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 block mb-1">إجمالي الإيرادات المسجلة</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {totalRevenue.toLocaleString()} {teacher.currency}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 block mb-1">عدد الإيصالات المصدرة</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white">
            {payments.length} إيصال
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
            طلاب متأخرين عن السداد
          </span>
          <span className="text-2xl font-black text-rose-800 dark:text-rose-200">
            {unpaidStudents.length} طالب
          </span>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            سجل المدفوعات المسددة ({payments.length})
          </button>
          <button
            onClick={() => setActiveTab('unpaid')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'unpaid'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            الطلاب غير المسددين ({unpaidStudents.length})
          </button>
        </div>

        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث باسم الطالب أو الكود أو رقم الإيصال..."
            className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
        </div>
      </div>

      {/* Tab 1: Payments History */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          {filteredPayments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold">
                  <tr>
                    <th className="py-3.5 px-4">رقم الإيصال</th>
                    <th className="py-3.5 px-4">اسم الطالب</th>
                    <th className="py-3.5 px-4">المجموعة</th>
                    <th className="py-3.5 px-4">المبلغ</th>
                    <th className="py-3.5 px-4">البند والشهر</th>
                    <th className="py-3.5 px-4">طريقة الدفع</th>
                    <th className="py-3.5 px-4">تاريخ السداد</th>
                    <th className="py-3.5 px-4 text-center">إشعار ولي الأمر</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredPayments.map((record) => {
                    const student = students.find((s) => s.id === record.studentId);
                    const group = groups.find((g) => g.id === student?.groupId);

                    return (
                      <tr
                        key={record.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                          {record.receiptNumber}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <span>{student?.name || 'طالب غير معروف'}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({student?.code})</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                          {group?.name || 'مجموعة دراسية'}
                        </td>
                        <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400">
                          {record.amount} {teacher.currency}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                          {record.monthCovered || getTypeArabic(record.type)}
                        </td>
                        <td className="py-3.5 px-4">
                          {getMethodBadge(record.paymentMethod)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                          {record.date} • {record.time}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {student?.guardianPhone && (
                              <a
                                href={generatePaymentReceiptWhatsAppUrl(
                                  student,
                                  teacher,
                                  group,
                                  record.amount,
                                  teacher.currency,
                                  record.receiptNumber,
                                  record.type,
                                  record.monthCovered
                                )}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-lg text-xs font-bold transition-all"
                                title="إرسال إيصال السداد على واتساب ولي الأمر"
                              >
                                <Send className="w-3 h-3" />
                                <span>إرسال إيصال</span>
                              </a>
                            )}
                            {onDeletePayment && (
                              <button
                                onClick={() => {
                                  if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا الإيصال وسجل الدفع؟')) {
                                    onDeletePayment(record.id);
                                  }
                                }}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                title="حذف هذا السجل المالي"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 p-4">
              <CreditCard className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                لا توجد مدفوعات مسجلة
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                سجل دفعة جديدة أو امسح كارت QR للطالب
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Unpaid Students */}
      {activeTab === 'unpaid' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-4 bg-rose-50/50 dark:bg-rose-950/20 border-b border-rose-100 dark:border-rose-900 flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 dark:text-rose-200">
              قائمة الطلاب الذين لم يتم تسجيل سدادهم لشهر ({selectedMonth})
            </span>
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              المتبقي تحصيله: {unpaidStudents.length * teacher.defaultFee} {teacher.currency} تقريباً
            </span>
          </div>

          {unpaidStudents.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {unpaidStudents.map((student) => {
                const group = groups.find((g) => g.id === student.groupId);
                const fee = student.customFee ?? group?.fee ?? teacher.defaultFee;

                return (
                  <div
                    key={student.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {student.name}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400">
                          {student.code}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        المجموعة: {group?.name || 'غير محددة'} • الرسوم المستحقة: {fee} {teacher.currency}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedStudentId(student.id);
                          setAmount(fee);
                          setIsRecordModalOpen(true);
                        }}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                      >
                        تسجيل السداد الآن
                      </button>

                      {student.guardianPhone && (
                        <a
                          href={generatePaymentReminderWhatsAppUrl(
                            student,
                            teacher,
                            group,
                            fee,
                            teacher.currency,
                            selectedMonth
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-700 dark:text-slate-300 hover:text-emerald-600 rounded-xl text-xs font-semibold transition-colors"
                        >
                          تذكير عبر واتساب
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                رائع! جميع الطلاب مسددين لهذا الشهر.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Record New Payment Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <span>تسجيل دفعة وإصدار إيصال سداد</span>
              </h3>
              <button
                onClick={() => {
                  setIsRecordModalOpen(false);
                  if (onClearPreselectedStudent) onClearPreselectedStudent();
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  اختيار الطالب <span className="text-rose-500">*</span>:
                </label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => handleStudentSelect(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-sm focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                >
                  <option value="" disabled>-- اختر الطالب من القائمة --</option>
                  {students.map((s) => {
                    const g = groups.find((grp) => grp.id === s.groupId);
                    return (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code}) - {g?.name || ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    المبلغ المسدد ({teacher.currency}) <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-sm focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    الشهر المغطى:
                  </label>
                  <input
                    type="text"
                    value={formMonth}
                    onChange={(e) => setFormMonth(e.target.value)}
                    placeholder="مثال: شهر أكتوبر 2026"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    نوع الدفعة:
                  </label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  >
                    <option value="monthly_fee">اشتراك شهري</option>
                    <option value="session_fee">رسوم حصة</option>
                    <option value="book_notes">مذكرة وكتب دراسية</option>
                    <option value="exam">رسوم امتحان ومتابعة</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    طريقة الدفع:
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'vodafone_cash' | 'instapay' | 'bank_transfer')}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  >
                    <option value="cash">نقداً (كاش)</option>
                    <option value="vodafone_cash">فودافون كاش / محفظة إلكترونية</option>
                    <option value="instapay">إنستاباي (InstaPay)</option>
                    <option value="bank_transfer">تحويل بنكي</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  ملاحظات الدفعة (اختياري):
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات إضافية على الإيصال..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsRecordModalOpen(false);
                    if (onClearPreselectedStudent) onClearPreselectedStudent();
                  }}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition-all active:scale-95"
                >
                  حفظ الدفعة وإصدار الإيصال
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
