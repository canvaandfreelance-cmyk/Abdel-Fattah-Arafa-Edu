import React, { useState } from 'react';
import {
  Student,
  Group,
  TeacherProfile,
  AttendanceRecord,
  PaymentRecord,
  Exam,
  StudentExamScore,
  EducationalResource,
  ResourceSubmission,
  ExamQuestion,
} from '../types';
import {
  User,
  GraduationCap,
  CalendarCheck,
  Calendar,
  CreditCard,
  Video,
  FileText,
  FileCheck2,
  Download,
  Upload,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Award,
  BookOpen,
  Send,
  HelpCircle,
  PlayCircle,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GroupIconBadge } from './GroupIconBadge';

interface StudentPortalViewProps {
  student: Student;
  group?: Group;
  teacher: TeacherProfile;
  attendanceRecords: AttendanceRecord[];
  payments: PaymentRecord[];
  exams: Exam[];
  examScores: StudentExamScore[];
  resources: EducationalResource[];
  submissions: ResourceSubmission[];
  onSaveExamScore?: (score: StudentExamScore) => void;
  onSubmitResourceHomework?: (submission: ResourceSubmission) => void;
  onExitPortal?: () => void;
}

export const StudentPortalView: React.FC<StudentPortalViewProps> = ({
  student,
  group,
  teacher,
  attendanceRecords,
  payments,
  exams,
  examScores,
  resources,
  submissions,
  onSaveExamScore,
  onSubmitResourceHomework,
  onExitPortal,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'exams' | 'resources' | 'attendance' | 'payments'>('overview');

  // Exercise solving & uploading state
  const [activeExerciseToSolve, setActiveExerciseToSolve] = useState<EducationalResource | null>(null);
  const [userExerciseAnswers, setUserExerciseAnswers] = useState<Record<number, string>>({});
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadedFileData, setUploadedFileData] = useState<string>('');
  const [exerciseSubmissionResult, setExerciseSubmissionResult] = useState<ResourceSubmission | null>(null);

  // Online Exam taking state
  const [activeExamToTake, setActiveExamToTake] = useState<Exam | null>(null);
  const [userExamAnswers, setUserExamAnswers] = useState<Record<string, number | string>>({});
  const [examSubmittedResult, setExamSubmittedResult] = useState<{
    score: number;
    maxScore: number;
    percent: number;
    passed: boolean;
  } | null>(null);

  const teacherTitle = teacher.gender === 'female' ? 'الأستاذة' : 'الأستاذ';

  // 1. Strict Security: Filter resources belonging ONLY to student's group or 'all'
  const studentResources = resources.filter(
    (r) => r.groupId === 'all' || r.groupId === student.groupId
  );

  // 2. Strict Security: Filter exams belonging ONLY to student's group or 'all'
  const studentExams = exams.filter(
    (e) => e.groupId === 'all' || e.groupId === student.groupId
  );

  // 3. Filter student's private attendance
  const studentAttendance = attendanceRecords.filter((a) => a.studentId === student.id);
  const studentPresentCount = studentAttendance.filter(
    (a) => a.status === 'present' || a.status === 'late'
  ).length;

  // 4. Filter student's private payments
  const studentPayments = payments.filter((p) => p.studentId === student.id);
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const isPaidThisMonth = studentPayments.some(
    (p) => p.date.startsWith(currentMonthStr) || p.monthCovered?.includes('أكتوبر')
  );

  // 5. Filter student's exam scores
  const studentScores = examScores.filter((sc) => sc.studentId === student.id);

  // 6. Submissions made by this student
  const studentSubmissions = submissions.filter((s) => s.studentId === student.id);

  // Handle uploading completed PDF sheet
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedFileData((event.target?.result as string) || '');
    };
    reader.readAsDataURL(file);
  };

  // Instant grading for Exercise / Homework PDF
  const handleInstantGradeExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeExerciseToSolve) return;

    const answerKey = activeExerciseToSolve.answerKey || ['أ', 'ب', 'ج', 'د'];
    let score = 0;
    const feedback: ResourceSubmission['feedback'] = [];

    answerKey.forEach((correct, idx) => {
      const chosen = userExerciseAnswers[idx] || '';
      const isCorrect = chosen.trim().toLowerCase() === correct.trim().toLowerCase();
      if (isCorrect) score += 1;

      feedback.push({
        questionNum: idx + 1,
        studentAnswer: chosen || 'لم يُجب',
        correctAnswer: correct,
        isCorrect,
        explanation: isCorrect ? 'إجابة صحيحة نموذجية!' : `الإجابة الصحيحة هي (${correct})`,
      });
    });

    const percent = Math.round((score / answerKey.length) * 100);
    const aiFeedbackNotes =
      percent >= 80
        ? `ممتاز جداً يا ${student.name}! درجتك ${score} من ${answerKey.length} (${percent}%). استمر في هذا الأداء الرائع!`
        : percent >= 50
        ? `جيد جداً يا ${student.name}. درجتك ${score} من ${answerKey.length} (${percent}%). راجع الأخطاء الموضحة أدناه.`
        : `تحتاج للمزيد من التركيز يا ${student.name}. درجتك ${score} من ${answerKey.length} (${percent}%). راجع شرح المذكرة جيداً.`;

    const newSubmission: ResourceSubmission = {
      id: `sub-${Date.now()}`,
      resourceId: activeExerciseToSolve.id,
      studentId: student.id,
      submittedAt: new Date().toISOString(),
      submittedFileName: uploadedFileName || `إجابات_${student.name}.pdf`,
      submittedFileUrl: uploadedFileData,
      studentAnswers: userExerciseAnswers,
      score,
      totalScore: answerKey.length,
      feedback,
      aiFeedbackNotes,
    };

    setExerciseSubmissionResult(newSubmission);
    if (onSubmitResourceHomework) {
      onSubmitResourceHomework(newSubmission);
    }

    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  // Instant grading for Exam Questions
  const handleInstantGradeExam = (exam: Exam) => {
    if (!exam.questions || exam.questions.length === 0) return;

    let totalPoints = 0;
    let earnedPoints = 0;

    exam.questions.forEach((q) => {
      const qPts = q.points || 1;
      totalPoints += qPts;
      const chosen = userExamAnswers[q.id];

      if (q.type === 'true_false') {
        const correctStr = q.correctAnswerText || (q.correctOptionIndex === 0 ? 'صواب' : 'خطأ');
        if (
          chosen !== undefined &&
          (chosen === q.correctOptionIndex || String(chosen).trim() === correctStr.trim())
        ) {
          earnedPoints += qPts;
        }
      } else if (q.type === 'essay') {
        // Essay question: if student provided an answer, credit appropriately
        if (chosen !== undefined && String(chosen).trim().length > 6) {
          earnedPoints += qPts;
        }
      } else {
        // MCQ question
        if (chosen !== undefined && Number(chosen) === q.correctOptionIndex) {
          earnedPoints += qPts;
        }
      }
    });

    const calculatedScore = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * exam.maxScore) : 0;
    const percent = Math.round((calculatedScore / exam.maxScore) * 100);
    const passed = calculatedScore >= (exam.passingScore || exam.maxScore * 0.5);

    const newScore: StudentExamScore = {
      id: `score-${Date.now()}`,
      examId: exam.id,
      studentId: student.id,
      score: calculatedScore,
      maxScore: exam.maxScore,
      notes: passed ? 'تم اجتياز الاختبار بنجاح عبر البوابة' : 'لم يتم بلوغ درجة النجاح، يُرجى مراجعة المعلم',
      dateGraded: new Date().toISOString().split('T')[0],
      answersGiven: userExamAnswers,
    };

    if (onSaveExamScore) {
      onSaveExamScore(newScore);
    }

    setExamSubmittedResult({
      score: calculatedScore,
      maxScore: exam.maxScore,
      percent,
      passed,
    });

    confetti({
      particleCount: 60,
      spread: 80,
      origin: { y: 0.5 },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Fixed Security & Student Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 shadow-xs">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-base shadow-md">
              {student.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-base md:text-lg text-slate-900 dark:text-white">
                  بوابة الطالب: {student.name}
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-xs">
                  {student.code}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {teacherTitle} / {teacher.name} • {teacher.subject} • {group?.name || 'مجموعتك'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>جلسة طالب آمنة ومحمية</span>
            </div>

            {onExitPortal && (
              <button
                onClick={onExitPortal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
                title="الرجوع إلى لوحة تحكم المعلم"
              >
                <span>لوحة المعلم</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Student Navigation Ribbon */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4">
        <div className="max-w-6xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar py-2.5">
          <button
            onClick={() => { setActiveTab('overview'); setActiveExerciseToSolve(null); setActiveExamToTake(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>نظرة عامة</span>
          </button>

          <button
            onClick={() => { setActiveTab('exams'); setActiveExerciseToSolve(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'exams'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>الامتحانات والاختبارات ({studentExams.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('resources'); setActiveExamToTake(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'resources'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>المذكرات والفيديوهات ({studentResources.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('attendance'); setActiveExerciseToSolve(null); setActiveExamToTake(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'attendance'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>سجل الحضور ({studentAttendance.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('payments'); setActiveExerciseToSolve(null); setActiveExamToTake(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'payments'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>حالة المصروفات ({isPaidThisMonth ? 'مسدد' : 'مستحق'})</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto w-full p-4 md:p-6 space-y-6 flex-1">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Student Welcome Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 text-white p-6 shadow-xl">
              <div className="relative z-10 space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-bold backdrop-blur-xs">
                  <Award className="w-3.5 h-3.5 text-amber-300" />
                  <span>لوحة الطالب الشخصية الخاصة بك فقط</span>
                </span>
                <h2 className="text-2xl md:text-3xl font-black">أهلاً بك يا {student.name} ✨</h2>
                <p className="text-xs md:text-sm text-indigo-200/90 max-w-2xl leading-relaxed">
                  هذه مساحتك الخاصة لمتابعة امتحاناتك القادمة، تحميل مذكرات التدريب وحلها لتقوم المنظومة بتصحيحها فورياً، ومشاهدة تسجيلات وفيديوهات الشرح المخصصة لمجموعتك ({group?.name || 'مجموعتك'}).
                </p>
              </div>
            </div>

            {/* Quick KPI Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-xs text-slate-500 font-semibold block mb-1">نسبة الحضور</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                    {studentAttendance.length > 0
                      ? Math.round((studentPresentCount / studentAttendance.length) * 100)
                      : 100}%
                  </span>
                  <span className="text-xs text-slate-400">({studentPresentCount} حصة)</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-xs text-slate-500 font-semibold block mb-1">الامتحانات المقررة</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {studentExams.length}
                  </span>
                  <span className="text-xs text-slate-400">اختبار مجدول</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-xs text-slate-500 font-semibold block mb-1">المذكرات والفيديوهات</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                    {studentResources.length}
                  </span>
                  <span className="text-xs text-slate-400">مورد دراسي</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-xs text-slate-500 font-semibold block mb-1">حالة اشتراك الشهر</span>
                <div className="flex items-center gap-1.5 mt-1">
                  {isPaidThisMonth ? (
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                      ✅ مسدد بالكامل
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold text-xs">
                      ⚠️ بانتظار السداد
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Upcoming Exams for this student */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-base flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-indigo-600" />
                  <span>الامتحانات المجدولة لمجموعتك</span>
                </h3>
                <button
                  onClick={() => setActiveTab('exams')}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  عرض تفاصيل الامتحانات
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studentExams.map((exam) => {
                  const score = studentScores.find((sc) => sc.examId === exam.id);
                  return (
                    <div
                      key={exam.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">{exam.title}</h4>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{exam.date} • {exam.time}</span>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                          {exam.maxScore} درجة
                        </span>
                      </div>

                      {score ? (
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
                            درجتك المسجلة: {score.score} من {score.maxScore}
                          </span>
                          <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                            {score.notes || 'تم رصد النتيجة'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs text-slate-500">امتحان قادم لم تؤده بعد</span>
                          <button
                            onClick={() => {
                              setActiveTab('exams');
                              setActiveExamToTake(exam);
                            }}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                          >
                            بدء الامتحان الآن
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EXAMS */}
        {activeTab === 'exams' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black">الامتحانات الخاصة بمجموعتك</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  تظهر هنا الامتحانات المخصصة لمجموعتك حصراً مع درجاتك السابقة وحلول الأسئلة النموذجية.
                </p>
              </div>
            </div>

            {/* Taking an Exam Live Interface */}
            {activeExamToTake && (
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-indigo-500 shadow-xl space-y-6 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      الاختبار الإلكتروني التفاعلي
                    </span>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      {activeExamToTake.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveExamToTake(null)}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200"
                  >
                    إغلاق
                  </button>
                </div>

                {examSubmittedResult ? (
                  <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 space-y-3 text-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto text-xl font-black">
                      ✓
                    </div>
                    <h4 className="text-lg font-black text-emerald-900 dark:text-emerald-100">
                      تم تصحيح امتحانك تلقائياً وبنجاح!
                    </h4>
                    <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                      {examSubmittedResult.score} / {examSubmittedResult.maxScore} درجة ({examSubmittedResult.percent}%)
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      تم حفظ الدرجة مباشرة في كشف درجاتك لدى المعلم.
                    </p>
                    <button
                      onClick={() => {
                        setExamSubmittedResult(null);
                        setActiveExamToTake(null);
                      }}
                      className="mt-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                    >
                      تم والعودة لقائمة الامتحانات
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {activeExamToTake.questions && activeExamToTake.questions.length > 0 ? (
                      <div className="space-y-5">
                        {activeExamToTake.questions.map((q, idx) => {
                          const isEssay = q.type === 'essay';
                          const isTrueFalse = q.type === 'true_false';
                          const isMcq = !isEssay && !isTrueFalse;

                          return (
                            <div
                              key={q.id}
                              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-3"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                                  السؤال رقم ({idx + 1}):
                                </span>
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
                                  {isTrueFalse ? 'صح وغلط' : isEssay ? 'سؤال مقالي' : 'اختيار من متعدد'} • [{q.points || 1} د]
                                </span>
                              </div>

                              <p className="font-bold text-sm text-slate-900 dark:text-white leading-relaxed">
                                {q.questionText}
                              </p>

                              {/* MCQ Option Buttons */}
                              {isMcq && q.options && q.options.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                  {q.options.map((opt, optIdx) => {
                                    const isSelected = userExamAnswers[q.id] === optIdx;
                                    return (
                                      <button
                                        key={optIdx}
                                        type="button"
                                        onClick={() =>
                                          setUserExamAnswers({
                                            ...userExamAnswers,
                                            [q.id]: optIdx,
                                          })
                                        }
                                        className={`p-3 rounded-xl text-xs text-right font-semibold border transition-all flex items-center justify-between ${
                                          isSelected
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
                                        }`}
                                      >
                                        <span>{opt}</span>
                                        <span
                                          className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                                            isSelected ? 'border-white bg-white text-indigo-600' : 'border-slate-300'
                                          }`}
                                        >
                                          {isSelected ? '✓' : ''}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}

                              {/* True/False Buttons */}
                              {isTrueFalse && (
                                <div className="grid grid-cols-2 gap-3 pt-1">
                                  {[
                                    { label: 'صواب (العبارة صحيحة)', val: 'صواب', optIdx: 0, icon: '✅' },
                                    { label: 'خطأ (العبارة خاطئة)', val: 'خطأ', optIdx: 1, icon: '❌' },
                                  ].map((choice) => {
                                    const isSelected =
                                      userExamAnswers[q.id] === choice.val ||
                                      userExamAnswers[q.id] === choice.optIdx;
                                    return (
                                      <button
                                        key={choice.val}
                                        type="button"
                                        onClick={() =>
                                          setUserExamAnswers({
                                            ...userExamAnswers,
                                            [q.id]: choice.val,
                                          })
                                        }
                                        className={`p-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                                          isSelected
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
                                        }`}
                                      >
                                        <span>{choice.icon}</span>
                                        <span>{choice.label}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Essay Question Input */}
                              {isEssay && (
                                <div className="pt-1">
                                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                                    اكتب إجابتك المقالية وشرحك هنا:
                                  </label>
                                  <textarea
                                    rows={3}
                                    placeholder="اكتب خطوات الحل أو التعليل أو المقارنة بالتفصيل..."
                                    value={String(userExamAnswers[q.id] || '')}
                                    onChange={(e) =>
                                      setUserExamAnswers({
                                        ...userExamAnswers,
                                        [q.id]: e.target.value,
                                      })
                                    }
                                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}

                        <button
                          onClick={() => handleInstantGradeExam(activeExamToTake)}
                          className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-black text-sm shadow-md transition-all active:scale-98"
                        >
                          تأكيد تسليم الامتحان والتصحيح اللحظي التلقائي
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-xs text-slate-500">
                          هذا الامتحان لا يحتوي على أسئلة إلكترونية بعد، يُرجى حضور الحصة لأداء الاختبار الورقي.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* List of Exams */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {studentExams.map((exam) => {
                const score = studentScores.find((sc) => sc.examId === exam.id);
                return (
                  <div
                    key={exam.id}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-bold">
                          المجموعة: {group?.name || 'مجموعتك'}
                        </span>
                        <span className="font-extrabold text-sm text-indigo-600 dark:text-indigo-400">
                          {exam.maxScore} درجة
                        </span>
                      </div>

                      <h3 className="font-black text-base text-slate-900 dark:text-white">{exam.title}</h3>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {exam.date}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {exam.time}
                        </span>
                      </div>

                      {exam.topics && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-850 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                          الموضوعات: {exam.topics}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      {score ? (
                        <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                          <div>
                            <span className="text-xs font-black text-emerald-800 dark:text-emerald-200 block">
                              درجتك المحققة: {score.score} من {score.maxScore}
                            </span>
                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                              {score.notes || 'تم التصحيح واعتماد النتيجة'}
                            </span>
                          </div>
                          <span className="text-xs font-bold px-2 py-1 rounded-lg bg-emerald-600 text-white">
                            تم الامتحان
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setActiveExamToTake(exam);
                            setExamSubmittedResult(null);
                          }}
                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-2"
                        >
                          <PlayCircle className="w-4 h-4" />
                          <span>دخول الاختبار والتصحيح التلقائي</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: EDUCATIONAL RESOURCES & HOMEWORK */}
        {activeTab === 'resources' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl font-black">المذكرات وفيديوهات الشرح الخاصة بمجموعتك</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                يمكنك تحميل مذكرات التدريب بصيغة PDF، حل الأسئلة، ثم رفع إجاباتك ليتم تصحيحها تلقائياً وإعطائك النتيجة فوراً مع توضيح الصح والخطأ.
              </p>
            </div>

            {/* Exercise Solving Modal / Drawer */}
            {activeExerciseToSolve && (
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-emerald-500 shadow-xl space-y-5 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      حل وتصحيح المذكرة التدريبية
                    </span>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      {activeExerciseToSolve.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveExerciseToSolve(null)}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200"
                  >
                    إغلاق
                  </button>
                </div>

                {exerciseSubmissionResult ? (
                  <div className="space-y-4">
                    {/* Score Ribbon */}
                    <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between">
                      <div>
                        <h4 className="font-black text-sm text-emerald-900 dark:text-emerald-200">
                          نتيجة التصحيح الفوري:
                        </h4>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                          {exerciseSubmissionResult.aiFeedbackNotes}
                        </p>
                      </div>
                      <div className="text-left font-black text-xl text-emerald-600 dark:text-emerald-300">
                        {exerciseSubmissionResult.score} / {exerciseSubmissionResult.totalScore}
                      </div>
                    </div>

                    {/* Question by question feedback */}
                    <div className="space-y-2">
                      <h5 className="font-extrabold text-xs text-slate-700 dark:text-slate-300">
                        تفاصيل إجابات الأسئلة (الصح والخطأ):
                      </h5>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {exerciseSubmissionResult.feedback.map((item) => (
                          <div
                            key={item.questionNum}
                            className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                              item.isCorrect
                                ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                                : 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 text-rose-950 dark:text-rose-200'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {item.isCorrect ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              ) : (
                                <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                              )}
                              <div>
                                <span className="font-black">السؤال رقم ({item.questionNum}): </span>
                                <span>إجابتك: ({item.studentAnswer}) • </span>
                                <span>الصحيح: ({item.correctAnswer})</span>
                                <p className="text-[11px] opacity-80 mt-1">{item.explanation}</p>
                              </div>
                            </div>
                            <span className="font-bold text-[11px] px-2 py-0.5 rounded-md bg-white/60 dark:bg-slate-900/60">
                              {item.isCorrect ? 'صحيح' : 'خطأ'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveExerciseToSolve(null)}
                      className="w-full py-2.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white rounded-xl text-xs font-bold"
                    >
                      إتمام والرجوع للمكتبة
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleInstantGradeExercise} className="space-y-5">
                    {/* Step 1: Download Original PDF */}
                    <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-xs text-indigo-900 dark:text-indigo-200">
                          الخطوة الأولى: تحميل المذكرة أو فتحها للقراءة
                        </h4>
                        <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-0.5">
                          {activeExerciseToSolve.fileName || 'ملف المذكرة الدراسية'}
                        </p>
                      </div>
                      <a
                        href={activeExerciseToSolve.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>فتح وتحميل PDF</span>
                      </a>
                    </div>

                    {/* Step 2: Input Answers (Multiple choice options for questions) */}
                    <div className="space-y-3">
                      <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                        الخطوة الثانية: أدخل اختياراتك لأسئلة المذكرة:
                      </h4>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {Array.from({ length: activeExerciseToSolve.questionsCount || 4 }).map((_, idx) => (
                          <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-1.5">
                            <span className="text-xs font-bold block text-slate-700 dark:text-slate-300">
                              السؤال ({idx + 1}):
                            </span>
                            <div className="flex items-center gap-1 justify-between">
                              {['أ', 'ب', 'ج', 'د'].map((choice) => {
                                const isSelected = userExerciseAnswers[idx] === choice;
                                return (
                                  <button
                                    key={choice}
                                    type="button"
                                    onClick={() =>
                                      setUserExerciseAnswers({
                                        ...userExerciseAnswers,
                                        [idx]: choice,
                                      })
                                    }
                                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                                      isSelected
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                                    }`}
                                  >
                                    {choice}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Step 3: Optional upload student's solved PDF/image */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        الخطوة الثالثة: رفع ملف الحل أو صورة كشكول الإجابة (اختياري):
                      </label>
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        onChange={handleFileUpload}
                        className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                      />
                      {uploadedFileName && (
                        <span className="text-xs text-emerald-600 font-bold block mt-1">
                          ✓ تم تحديد الملف: {uploadedFileName}
                        </span>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-black text-sm shadow-md transition-all active:scale-98"
                    >
                      تسليم الحل وبدء التصحيح التلقائي اللحظي
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Resources List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {studentResources.map((res) => {
                const isPdf = res.type === 'pdf';
                const submission = studentSubmissions.find((s) => s.resourceId === res.id);

                return (
                  <div
                    key={res.id}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                            isPdf
                              ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300'
                              : 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          {isPdf ? <FileText className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                          <span>{isPdf ? 'مذكرة تدريب PDF' : 'فيديو شرح'}</span>
                        </span>

                        <span className="text-[11px] text-slate-400 font-medium">
                          {res.createdAt}
                        </span>
                      </div>

                      <h3 className="font-black text-sm text-slate-900 dark:text-white leading-snug">
                        {res.title}
                      </h3>

                      {res.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                          {res.description}
                        </p>
                      )}

                      {submission && (
                        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
                          <span className="font-bold text-emerald-800 dark:text-emerald-200 block">
                            ✅ تم الحل والتصحيح: {submission.score} من {submission.totalScore}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        {isPdf ? <Download className="w-3.5 h-3.5" /> : <PlayCircle className="w-3.5 h-3.5" />}
                        <span>{isPdf ? 'تحميل / فتح المذكرة' : 'مشاهدة الفيديو الآن'}</span>
                      </a>

                      {isPdf && (
                        <button
                          onClick={() => {
                            setActiveExerciseToSolve(res);
                            setExerciseSubmissionResult(null);
                            setUserExerciseAnswers({});
                          }}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>رفع الحل والتصحيح الفوري</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: ATTENDANCE HISTORY */}
        {activeTab === 'attendance' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h2 className="text-xl font-black mb-1">سجل حضور الحصص الخاص بك</h2>
              <p className="text-xs text-slate-500">
                يعرض هذا الجدول تواريخ الحصص التي حضرتها وحالات الغياب المسجلة لك فقط.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5 font-bold">تاريخ الحصة</th>
                    <th className="p-3.5 font-bold">وقت التسجيل</th>
                    <th className="p-3.5 font-bold">حالة الحضور</th>
                    <th className="p-3.5 font-bold">طريقة التسجيل</th>
                    <th className="p-3.5 font-bold">ملاحظات المعلم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {studentAttendance.length > 0 ? (
                    studentAttendance.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-3.5 font-bold text-slate-900 dark:text-white font-mono">{rec.date}</td>
                        <td className="p-3.5 text-slate-500">{rec.time}</td>
                        <td className="p-3.5">
                          {rec.status === 'present' ? (
                            <span className="px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                              ✅ حاضر
                            </span>
                          ) : rec.status === 'late' ? (
                            <span className="px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold">
                              ⏰ متأخر
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold">
                              ❌ غائب
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-slate-500 font-medium">
                          {rec.method === 'qr' ? 'مسح باركود الـ QR' : 'تسجيل المعلم'}
                        </td>
                        <td className="p-3.5 text-slate-500">{rec.note || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400">
                        لا توجد سجلات حضور مسجلة لك حتى الآن.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: PAYMENTS */}
        {activeTab === 'payments' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black mb-1">سجل مدفوعاتك وإيصالات السداد</h2>
                <p className="text-xs text-slate-500">
                  كافة المبالغ والاشتراكات الشهرية المسددة مع أرقام الإيصالات المعتمدة.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">اشتراك الشهر:</span>
                {isPaidThisMonth ? (
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs">
                    ✅ تم سداد شهر {currentMonthStr}
                  </span>
                ) : (
                  <span className="px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-extrabold text-xs">
                    ⚠️ لم يتم سداد اشتراك شهر {currentMonthStr} بعد
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5 font-bold">رقم الإيصال</th>
                    <th className="p-3.5 font-bold">المبلغ المسدد</th>
                    <th className="p-3.5 font-bold">الشهر / النوع</th>
                    <th className="p-3.5 font-bold">طريقة الدفع</th>
                    <th className="p-3.5 font-bold">تاريخ الدفع</th>
                    <th className="p-3.5 font-bold">ملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {studentPayments.length > 0 ? (
                    studentPayments.map((pay) => (
                      <tr key={pay.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {pay.receiptNumber}
                        </td>
                        <td className="p-3.5 font-black text-emerald-600 dark:text-emerald-400 text-sm">
                          {pay.amount} {teacher.currency}
                        </td>
                        <td className="p-3.5 font-medium">{pay.monthCovered || 'اشتراك شهري'}</td>
                        <td className="p-3.5 text-slate-600 dark:text-slate-300">{pay.paymentMethod}</td>
                        <td className="p-3.5 text-slate-500 font-mono">{pay.date} ({pay.time})</td>
                        <td className="p-3.5 text-slate-500">{pay.notes || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        لا توجد مدفوعات مسجلة بعد.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
