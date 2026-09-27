import React, { useState } from 'react';
import {
  FileCheck2,
  Plus,
  Calendar,
  Clock,
  Award,
  Users,
  MessageSquare,
  Trash2,
  Edit3,
  Search,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Send,
  BookOpen,
  Zap,
  Save,
  Check,
  ExternalLink,
} from 'lucide-react';
import { Exam, Student, Group, TeacherProfile, StudentExamScore } from '../types';
import { ExamWhatsAppModal } from './ExamWhatsAppModal';
import { generateExamScoreWhatsAppUrl } from '../utils/whatsapp';
import { StorageService } from '../utils/storage';

interface ExamsViewProps {
  exams: Exam[];
  students: Student[];
  groups: Group[];
  teacher: TeacherProfile;
  examScores: StudentExamScore[];
  onAddExam: (examData: Omit<Exam, 'id' | 'createdAt'>) => Exam;
  onDeleteExam: (id: string) => void;
  onSaveScore: (scoreData: StudentExamScore) => void;
}

export const ExamsView: React.FC<ExamsViewProps> = ({
  exams,
  students,
  groups,
  teacher,
  examScores,
  onAddExam,
  onDeleteExam,
  onSaveScore,
}) => {
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Active exam for WhatsApp Modal
  const [activeExamForWhatsApp, setActiveExamForWhatsApp] = useState<Exam | null>(null);

  // Active exam for Grading Modal
  const [activeExamForGrading, setActiveExamForGrading] = useState<Exam | null>(null);

  // Form states for New Exam
  const [title, setTitle] = useState('');
  const [groupId, setGroupId] = useState<string>(groups[0]?.id || 'all');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('04:30 مساءً');
  const [maxScore, setMaxScore] = useState<number>(50);
  const [passingScore, setPassingScore] = useState<number>(25);
  const [topics, setTopics] = useState('');
  const [notes, setNotes] = useState('');
  const [autoOpenWhatsApp, setAutoOpenWhatsApp] = useState(true);

  // Form state for grading
  const [scoringInputs, setScoringInputs] = useState<Record<string, { score: number; notes: string }>>({});
  const [sentGradeStudentIds, setSentGradeStudentIds] = useState<Record<string, boolean>>({});
  const [isGradingBulkMode, setIsGradingBulkMode] = useState(false);
  const [gradingBulkIndex, setGradingBulkIndex] = useState(0);
  const [isSavedAllSuccess, setIsSavedAllSuccess] = useState(false);

  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const createdExam = onAddExam({
      title: title.trim(),
      groupId,
      date,
      time,
      maxScore: Number(maxScore) || 50,
      passingScore: Number(passingScore) || 25,
      topics: topics.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    setIsAddModalOpen(false);
    setTitle('');
    setTopics('');
    setNotes('');

    // If autoOpenWhatsApp is checked, immediately open the WhatsApp notification modal!
    if (autoOpenWhatsApp) {
      setActiveExamForWhatsApp(createdExam);
    }
  };

  const filteredExams = exams.filter((exam) => {
    const matchesGroup = selectedGroupId === 'all' || exam.groupId === selectedGroupId;
    const matchesSearch =
      exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exam.topics && exam.topics.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesGroup && matchesSearch;
  });

  const handleOpenGrading = (exam: Exam) => {
    setActiveExamForGrading(exam);
    // Pre-populate existing scores
    const existing: Record<string, { score: number; notes: string }> = {};
    const relevantStudents = students.filter(
      (s) => exam.groupId === 'all' || s.groupId === exam.groupId
    );
    relevantStudents.forEach((st) => {
      const recorded = examScores.find((sc) => sc.examId === exam.id && sc.studentId === st.id);
      existing[st.id] = {
        score: recorded ? recorded.score : 0,
        notes: recorded?.notes || '',
      };
    });
    setScoringInputs(existing);
  };

  const handleSaveStudentGrade = (studentId: string) => {
    if (!activeExamForGrading) return;
    const data = scoringInputs[studentId];
    if (!data) return;

    const newScore: StudentExamScore = {
      id: `score-${Date.now()}-${studentId}`,
      examId: activeExamForGrading.id,
      studentId,
      score: Number(data.score),
      maxScore: activeExamForGrading.maxScore,
      notes: data.notes,
      dateGraded: new Date().toISOString().split('T')[0],
    };
    onSaveScore(newScore);
  };

  const handleSendGradeToWhatsApp = (student: Student) => {
    if (!activeExamForGrading) return;
    const data = scoringInputs[student.id];
    const group = groups.find((g) => g.id === student.groupId);
    const scoreVal = data ? Number(data.score) : 0;
    const url = generateExamScoreWhatsAppUrl(
      student,
      teacher,
      group,
      activeExamForGrading,
      scoreVal,
      data?.notes
    );
    window.open(url, '_blank');
    setSentGradeStudentIds((prev) => ({ ...prev, [student.id]: true }));
  };

  const handleSaveAllGrades = () => {
    if (!activeExamForGrading) return;
    const relevantStudents = students.filter(
      (s) => activeExamForGrading.groupId === 'all' || s.groupId === activeExamForGrading.groupId
    );
    relevantStudents.forEach((st) => {
      const data = scoringInputs[st.id] || { score: 0, notes: '' };
      onSaveScore({
        id: `score-${Date.now()}-${st.id}`,
        examId: activeExamForGrading.id,
        studentId: st.id,
        score: Number(data.score) || 0,
        maxScore: activeExamForGrading.maxScore,
        notes: data.notes,
        dateGraded: new Date().toISOString().split('T')[0],
      });
    });
    setIsSavedAllSuccess(true);
    setTimeout(() => setIsSavedAllSuccess(false), 2500);
  };

  const handleOpenAllGradesBatch = () => {
    if (!activeExamForGrading) return;
    const relevantStudents = students.filter(
      (s) => activeExamForGrading.groupId === 'all' || s.groupId === activeExamForGrading.groupId
    );
    const withPhone = relevantStudents.filter((s) => s.guardianPhone || s.studentPhone);
    if (withPhone.length === 0) return;

    if (
      !window.confirm(
        `هل تريد فتح محادثات الواتساب لـ (${withPhone.length}) من أولياء الأمور لإرسال نتائج درجاتهم دفعة واحدة؟`
      )
    )
      return;

    handleSaveAllGrades();

    withPhone.forEach((student, index) => {
      setTimeout(() => {
        handleSendGradeToWhatsApp(student);
      }, index * 700);
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
              <FileCheck2 className="w-6 h-6" />
            </span>
            <span>إدارة الاختبارات والامتحانات</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            جدولة مواعيد الامتحانات، تحديد المجموعات، وإرسال تنبيهات تلقائية عبر الواتساب لأولياء الأمور
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>إضافة اختبار جديد وتنبيه أولياء الأمور</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث عن اختبار بالاسم أو الموضوعات المقررة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <select
          value={selectedGroupId}
          onChange={(e) => setSelectedGroupId(e.target.value)}
          className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none min-w-[200px]"
        >
          <option value="all">جميع المجموعات ({exams.length})</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      {/* Exams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredExams.length > 0 ? (
          filteredExams.map((exam) => {
            const group = groups.find((g) => g.id === exam.groupId);
            const targetStudents = students.filter(
              (s) => exam.groupId === 'all' || s.groupId === exam.groupId
            );
            const gradedScores = examScores.filter((sc) => sc.examId === exam.id);

            return (
              <div
                key={exam.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      {group ? group.name : 'جميع المجموعات'}
                    </span>
                    <button
                      onClick={() => onDeleteExam(exam.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="حذف الاختبار"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      {exam.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        {exam.date}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        {exam.time}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        الدرجة: {exam.maxScore}
                      </span>
                    </div>
                  </div>

                  {exam.topics && (
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                      <span className="font-bold block text-slate-800 dark:text-slate-200">
                        الموضوعات المقررة:
                      </span>
                      <p className="line-clamp-2">{exam.topics}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                    <span>عدد الطلاب: {targetStudents.length}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      تم رصد: {gradedScores.length} من {targetStudents.length}
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <button
                    onClick={() => setActiveExamForWhatsApp(exam)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>إرسال تنبيه واتساب لأولياء الأمور</span>
                  </button>

                  <button
                    onClick={() => handleOpenGrading(exam)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition-all"
                  >
                    <Award className="w-4 h-4" />
                    <span>رصد الدرجات وإرسال بطاقة النتيجة</span>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
            <FileCheck2 className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-40" />
            <h3 className="font-bold text-base text-slate-700 dark:text-slate-300">
              لا توجد اختبارات مسجلة
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              يمكنك إضافة اختبار جديد واختيار المجموعة لتقوم المنظومة بتجهيز رسائل الواتساب الفورية لجميع أولياء الأمور
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm"
            >
              + إضافة اختبار الآن
            </button>
          </div>
        )}
      </div>

      {/* Add Exam Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    إضافة اختبار جديد
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    حدد المجموعة والموعد لإرسال التنبيهات لأولياء الأمور
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="space-y-4 text-right">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم أو عنوان الاختبار:*
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: اختبار شهر أكتوبر - الفصل الثاني"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  تحديد المجموعة المستهدفة:*
                </label>
                <select
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-bold"
                >
                  <option value="all">متاح لجميع المجموعات</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.grade})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تاريخ الاختبار:*
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    وقت الاختبار:*
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="04:30 مساءً"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الدرجة العظمى (الكلية):*
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={maxScore}
                    onChange={(e) => setMaxScore(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    درجة النجاح المقترحة:
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={passingScore}
                    onChange={(e) => setPassingScore(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الموضوعات المقررة في الاختبار:
                </label>
                <textarea
                  rows={2}
                  placeholder="مثال: من بداية الفصل الثاني حتى نهاية قانون كيرشوف الأول مع المسائل"
                  value={topics}
                  onChange={(e) => setTopics(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ملاحظات أو تعليمات للطلاب وأولياء الأمور:
                </label>
                <input
                  type="text"
                  placeholder="مثال: برجاء إحضار الآلة الحاسبة والالتزام بالحضور قبل الموعد بـ 10 دقائق"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="autoOpenWhatsAppCheck"
                  checked={autoOpenWhatsApp}
                  onChange={(e) => setAutoOpenWhatsApp(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <label
                  htmlFor="autoOpenWhatsAppCheck"
                  className="text-xs font-bold text-emerald-900 dark:text-emerald-200 cursor-pointer"
                >
                  فتح شاشة إرسال رسائل الواتساب لأولياء الأمور فور إنشاء الاختبار تلقائياً
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20"
                >
                  إنشاء الاختبار
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grading & Score Recording Modal */}
      {activeExamForGrading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-indigo-600 to-violet-700 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base sm:text-lg">
                  رصد درجات: {activeExamForGrading.title}
                </h3>
                <p className="text-xs text-indigo-100 mt-0.5">
                  الدرجة الكلية: {activeExamForGrading.maxScore} درجة • درجة النجاح:{' '}
                  {activeExamForGrading.passingScore || 25}
                </p>
              </div>
              <button
                onClick={() => setActiveExamForGrading(null)}
                className="p-1.5 text-white/80 hover:text-white rounded-full bg-white/10"
              >
                ✕
              </button>
            </div>

            {/* Top Toolbar: Save All & Bulk WhatsApp Results */}
            <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleSaveAllGrades}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all"
                >
                  {isSavedAllSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  <span>{isSavedAllSuccess ? 'تم حفظ جميع الدرجات بنجاح!' : 'حفظ جميع الدرجات'}</span>
                </button>

                <button
                  onClick={handleOpenAllGradesBatch}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs active:scale-95 transition-all"
                >
                  <Zap className="w-4 h-4" />
                  <span>إرسال نتائج جميع الطلاب لأولياء الأمور (جماعياً)</span>
                </button>
              </div>

              <span className="text-[11px] text-slate-500 font-bold">
                تم إرسال نتيجة {Object.keys(sentGradeStudentIds).length} طالب
              </span>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1">
              {students
                .filter(
                  (s) =>
                    activeExamForGrading.groupId === 'all' ||
                    s.groupId === activeExamForGrading.groupId
                )
                .map((student) => {
                  const inputData = scoringInputs[student.id] || { score: 0, notes: '' };
                  const percent = Math.round(
                    (inputData.score / activeExamForGrading.maxScore) * 100
                  );

                  return (
                    <div
                      key={student.id}
                      className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                          {student.name[0]}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                            {student.name}
                          </h4>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {student.code} • ولي الأمر: {student.guardianPhone || 'لا يوجد'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                            الدرجة:
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={activeExamForGrading.maxScore}
                            value={inputData.score}
                            onChange={(e) =>
                              setScoringInputs({
                                ...scoringInputs,
                                [student.id]: {
                                  ...inputData,
                                  score: Number(e.target.value),
                                },
                              })
                            }
                            className="w-16 px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-center"
                          />
                          <span className="text-xs font-bold text-slate-400">
                            / {activeExamForGrading.maxScore}
                          </span>
                        </div>

                        <span
                          className={`text-xs font-bold px-2 py-1 rounded-lg ${
                            percent >= 85
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : percent >= 50
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {percent}%
                        </span>

                        <button
                          onClick={() => handleSaveStudentGrade(student.id)}
                          className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs active:scale-95 transition-all"
                        >
                          حفظ
                        </button>

                        <button
                          onClick={() => handleSendGradeToWhatsApp(student)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold shadow-xs flex items-center gap-1 active:scale-95 transition-all ${
                            sentGradeStudentIds[student.id]
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                          title="إرسال تقرير النتيجة لولي الأمر على الواتساب"
                        >
                          <Send className="w-3 h-3 rotate-180" />
                          <span>
                            {sentGradeStudentIds[student.id] ? 'تم الإرسال (إعادة)' : 'إرسال لولي الأمر'}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                يتم حفظ الدرجات محلياً وتحديث تقارير الطلاب فورياً.
              </span>
              <button
                onClick={() => setActiveExamForGrading(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Automated WhatsApp Modal */}
      <ExamWhatsAppModal
        isOpen={Boolean(activeExamForWhatsApp)}
        onClose={() => setActiveExamForWhatsApp(null)}
        exam={activeExamForWhatsApp}
        students={students}
        groups={groups}
        teacher={teacher}
      />
    </div>
  );
};
