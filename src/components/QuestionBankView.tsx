import React, { useState, useMemo } from 'react';
import {
  BankQuestion,
  QuestionType,
  QuestionDifficulty,
  Group,
  TeacherProfile,
  Exam,
} from '../types';
import {
  HelpCircle,
  Plus,
  Search,
  Sparkles,
  Printer,
  Trash2,
  Edit3,
  CheckCircle2,
  FileCheck2,
  Filter,
  Check,
  X,
  Play,
  Layers,
  BookOpen,
  Award,
  ChevronDown,
  Info,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { exportQuizToPDF } from '../utils/pdfExport';

interface QuestionBankViewProps {
  questions: BankQuestion[];
  groups: Group[];
  teacher: TeacherProfile;
  onAddQuestion: (question: Omit<BankQuestion, 'id' | 'createdAt'>) => void;
  onUpdateQuestion: (question: BankQuestion) => void;
  onDeleteQuestion: (id: string) => void;
  onCreateExamFromBank: (newExam: Omit<Exam, 'id' | 'createdAt'>) => void;
}

export const QuestionBankView: React.FC<QuestionBankViewProps> = ({
  questions,
  groups,
  teacher,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onCreateExamFromBank,
}) => {
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLesson, setSelectedLesson] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | QuestionDifficulty>('all');
  const [selectedType, setSelectedType] = useState<'all' | QuestionType>('all');

  // Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<BankQuestion | null>(null);
  const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState(false);
  const [interactiveQuiz, setInteractiveQuiz] = useState<BankQuestion[] | null>(null);

  // Form State for Add/Edit
  const [formSubject, setFormSubject] = useState(teacher.subject);
  const [formLesson, setFormLesson] = useState('');
  const [formGrade, setFormGrade] = useState('');
  const [formType, setFormType] = useState<QuestionType>('mcq');
  const [formDifficulty, setFormDifficulty] = useState<QuestionDifficulty>('medium');
  const [formQuestionText, setFormQuestionText] = useState('');
  const [formOptions, setFormOptions] = useState<string[]>(['', '', '', '']);
  const [formCorrectAnswer, setFormCorrectAnswer] = useState<string | number>(0);
  const [formExplanation, setFormExplanation] = useState('');
  const [formPoints, setFormPoints] = useState<number>(2);

  // Generator State
  const [genTitle, setGenTitle] = useState('');
  const [genGroupId, setGenGroupId] = useState<string>('all');
  const [genLesson, setGenLesson] = useState<string>('all');
  const [genDifficulty, setGenDifficulty] = useState<'all' | QuestionDifficulty>('all');
  const [genType, setGenType] = useState<'all' | QuestionType>('all');
  const [genCount, setGenCount] = useState<number>(5);
  const [genIncludeKeyInPdf, setGenIncludeKeyInPdf] = useState(true);

  // Interactive Quiz Taking State
  const [userAnswers, setUserAnswers] = useState<Record<string, string | number>>({});
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false);

  // Unique Lessons in current questions
  const availableLessons = useMemo(() => {
    const lessons = new Set<string>();
    questions.forEach((q) => {
      if (q.lesson?.trim()) lessons.add(q.lesson.trim());
    });
    return Array.from(lessons);
  }, [questions]);

  // Filtered Questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchesSearch =
        !searchQuery ||
        q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.lesson?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.options?.some((opt) => opt.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (typeof q.correctAnswer === 'string' && q.correctAnswer.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesLesson = selectedLesson === 'all' || q.lesson === selectedLesson;
      const matchesDifficulty = selectedDifficulty === 'all' || q.difficulty === selectedDifficulty;
      const matchesType = selectedType === 'all' || q.type === selectedType;

      return matchesSearch && matchesLesson && matchesDifficulty && matchesType;
    });
  }, [questions, searchQuery, selectedLesson, selectedDifficulty, selectedType]);

  // Stats
  const mcqCount = questions.filter((q) => q.type === 'mcq').length;
  const tfCount = questions.filter((q) => q.type === 'true_false').length;
  const essayCount = questions.filter((q) => q.type === 'essay').length;
  const easyCount = questions.filter((q) => q.difficulty === 'easy').length;
  const mediumCount = questions.filter((q) => q.difficulty === 'medium').length;
  const hardCount = questions.filter((q) => q.difficulty === 'hard').length;

  const handleOpenAdd = (defaultType: QuestionType = 'mcq') => {
    setEditingQuestion(null);
    setFormSubject(teacher.subject);
    setFormLesson(availableLessons[0] || 'الوحدة الأولى');
    setFormGrade(groups[0]?.grade || 'الصف الأول الثانوي');
    setFormType(defaultType);
    setFormDifficulty('medium');
    setFormQuestionText('');
    setFormOptions(defaultType === 'mcq' ? ['', '', '', ''] : defaultType === 'true_false' ? ['صواب', 'خطأ'] : []);
    setFormCorrectAnswer(defaultType === 'mcq' ? 0 : defaultType === 'true_false' ? 'صواب' : '');
    setFormExplanation('');
    setFormPoints(defaultType === 'essay' ? 3 : defaultType === 'true_false' ? 1 : 2);
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (q: BankQuestion) => {
    setEditingQuestion(q);
    setFormSubject(q.subject);
    setFormLesson(q.lesson);
    setFormGrade(q.grade || '');
    setFormType(q.type);
    setFormDifficulty(q.difficulty);
    setFormQuestionText(q.questionText);
    setFormOptions(
      q.type === 'mcq'
        ? q.options && q.options.length > 0
          ? [...q.options]
          : ['', '', '', '']
        : q.type === 'true_false'
        ? ['صواب', 'خطأ']
        : []
    );
    setFormCorrectAnswer(q.correctAnswer);
    setFormExplanation(q.explanation || '');
    setFormPoints(q.points || (q.type === 'essay' ? 3 : 1));
    setIsAddEditModalOpen(true);
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formQuestionText.trim()) return;

    let cleanOptions = formOptions.map((o) => o.trim());
    let finalCorrectAnswer = formCorrectAnswer;

    if (formType === 'true_false') {
      cleanOptions = ['صواب', 'خطأ'];
      if (finalCorrectAnswer !== 'صواب' && finalCorrectAnswer !== 'خطأ') {
        finalCorrectAnswer = 'صواب';
      }
    } else if (formType === 'essay') {
      cleanOptions = [];
      finalCorrectAnswer = String(formCorrectAnswer).trim();
    }

    if (editingQuestion) {
      onUpdateQuestion({
        ...editingQuestion,
        subject: formSubject,
        lesson: formLesson.trim() || 'عام',
        grade: formGrade,
        type: formType,
        difficulty: formDifficulty,
        questionText: formQuestionText.trim(),
        options: cleanOptions,
        correctAnswer: finalCorrectAnswer,
        explanation: formExplanation.trim(),
        points: Number(formPoints) || 1,
      });
    } else {
      onAddQuestion({
        subject: formSubject,
        lesson: formLesson.trim() || 'عام',
        grade: formGrade,
        type: formType,
        difficulty: formDifficulty,
        questionText: formQuestionText.trim(),
        options: cleanOptions,
        correctAnswer: finalCorrectAnswer,
        explanation: formExplanation.trim(),
        points: Number(formPoints) || 1,
      });
    }

    setIsAddEditModalOpen(false);
  };

  const handleOpenGenerator = () => {
    const defaultGroup = groups[0];
    setGenTitle(`اختبار فوري: ${selectedLesson !== 'all' ? selectedLesson : teacher.subject}`);
    setGenGroupId(defaultGroup?.id || 'all');
    setGenLesson(selectedLesson !== 'all' ? selectedLesson : 'all');
    setGenDifficulty(selectedDifficulty !== 'all' ? selectedDifficulty : 'all');
    setGenType(selectedType !== 'all' ? selectedType : 'all');
    setGenCount(Math.min(10, Math.max(3, questions.length)));
    setIsGeneratorModalOpen(true);
  };

  // Generate Questions List based on generator options
  const generateSelectedQuestions = (): BankQuestion[] => {
    let pool = questions.filter((q) => {
      const matchLesson = genLesson === 'all' || q.lesson === genLesson;
      const matchDiff = genDifficulty === 'all' || q.difficulty === genDifficulty;
      const matchType = genType === 'all' || q.type === genType;
      return matchLesson && matchDiff && matchType;
    });

    if (pool.length === 0) pool = [...questions];

    // Shuffle pool
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(genCount, shuffled.length));
  };

  // Action 1: Create Exam directly into Exams Tab
  const handleConfirmCreateExam = () => {
    const selectedQuestions = generateSelectedQuestions();
    if (selectedQuestions.length === 0) return;

    const totalPoints = selectedQuestions.reduce((sum, q) => sum + (q.points || 1), 0);
    const selectedGroup = groups.find((g) => g.id === genGroupId);

    onCreateExamFromBank({
      title: genTitle.trim() || 'اختبار إلكتروني من بنك الأسئلة',
      groupId: genGroupId,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      maxScore: totalPoints,
      passingScore: Math.round(totalPoints * 0.5),
      topics: genLesson !== 'all' ? genLesson : 'أسئلة مختارة من بنك الأسئلة (صح وغلط ومقالي واختياري)',
      notes: `اختبار تم توليده آلياً من بنك الأسئلة (${selectedQuestions.length} سؤال متنوع) لمجموعة ${selectedGroup?.name || 'كافة المجموعات'}`,
      questions: selectedQuestions.map((q, idx) => ({
        id: `gen-q-${idx}-${Date.now()}`,
        questionText: q.questionText,
        type: q.type,
        options: q.type === 'true_false' ? ['صواب', 'خطأ'] : q.options,
        correctOptionIndex:
          q.type === 'mcq'
            ? typeof q.correctAnswer === 'number'
              ? q.correctAnswer
              : 0
            : q.type === 'true_false'
            ? q.correctAnswer === 'صواب'
              ? 0
              : 1
            : undefined,
        correctAnswerText:
          q.type === 'essay'
            ? String(q.correctAnswer)
            : q.type === 'true_false'
            ? String(q.correctAnswer)
            : undefined,
        explanation: q.explanation,
        points: q.points || 1,
      })),
    });

    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    setIsGeneratorModalOpen(false);
  };

  // Action 2: Print PDF Exam Paper
  const handlePrintGeneratedPDF = () => {
    const selectedQuestions = generateSelectedQuestions();
    if (selectedQuestions.length === 0) return;

    const selectedGroup = groups.find((g) => g.id === genGroupId);
    exportQuizToPDF(
      genTitle.trim() || 'اختبار تجريبي',
      selectedQuestions,
      teacher,
      selectedGroup?.name || 'عام',
      genIncludeKeyInPdf
    );
  };

  // Action 3: Start Interactive Test Mode
  const handleStartInteractiveQuiz = () => {
    const selectedQuestions = generateSelectedQuestions();
    if (selectedQuestions.length === 0) return;
    setUserAnswers({});
    setIsQuizSubmitted(false);
    setInteractiveQuiz(selectedQuestions);
    setIsGeneratorModalOpen(false);
  };

  // Interactive Quiz Submission
  const handleSubmitInteractiveQuiz = () => {
    setIsQuizSubmitted(true);
    confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
  };

  const interactiveScore = useMemo(() => {
    if (!interactiveQuiz) return { score: 0, total: 0, percentage: 0 };
    let score = 0;
    let total = 0;

    interactiveQuiz.forEach((q) => {
      const qPoints = q.points || 1;
      total += qPoints;
      const userAns = userAnswers[q.id];
      if (q.type === 'mcq') {
        if (Number(userAns) === Number(q.correctAnswer)) {
          score += qPoints;
        }
      } else if (q.type === 'true_false') {
        if (String(userAns).trim() === String(q.correctAnswer).trim()) {
          score += qPoints;
        }
      } else if (q.type === 'essay') {
        // Essay is credited if student typed a meaningful answer (> 6 chars)
        if (userAns && String(userAns).trim().length > 6) {
          score += qPoints;
        }
      }
    });

    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    return { score, total, percentage };
  }, [interactiveQuiz, userAnswers]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>بنك الأسئلة والاختبارات التفاعلية</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">بنك الأسئلة ومولد الامتحانات الفوري</h2>
          <p className="text-indigo-100 text-sm leading-relaxed">
            أنشئ ورتّب بنك أسئلتك لمادة <strong className="text-white">{teacher.subject}</strong>،
            مع دعم كامل لأسئلة <strong>الاختيار من متعدد، وصح وغلط، والأسئلة المقالية</strong>،
            وقم بتوليد اختبارات إلكترونية تفاعلية بضغطة زر أو طباعة أوراق امتحانات رسمية PDF فوراً.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full md:w-auto">
          <button
            onClick={handleOpenGenerator}
            className="flex-1 sm:flex-none px-4 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-slate-900" />
            <span>⚡ توليد اختبار فوري</span>
          </button>

          <button
            onClick={() => handleOpenAdd('mcq')}
            className="px-3 py-3 rounded-2xl bg-white hover:bg-slate-100 text-indigo-700 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
            title="إضافة سؤال اختيار من متعدد"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ اختياري</span>
          </button>

          <button
            onClick={() => handleOpenAdd('true_false')}
            className="px-3 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
            title="إضافة سؤال صح وغلط"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>+ صح وغلط</span>
          </button>

          <button
            onClick={() => handleOpenAdd('essay')}
            className="px-3 py-3 rounded-2xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
            title="إضافة سؤال مقالي"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>+ سؤال مقالي</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold">إجمالي الأسئلة</span>
            <HelpCircle className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {questions.length} <span className="text-xs font-normal text-slate-400">سؤال</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold">اختيار من متعدد</span>
            <Layers className="w-4 h-4 text-violet-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {mcqCount} <span className="text-xs font-normal text-slate-400">سؤال</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold">صح وغلط</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {tfCount} <span className="text-xs font-normal text-slate-400">سؤال</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold">أسئلة مقالية</span>
            <BookOpen className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {essayCount} <span className="text-xs font-normal text-slate-400">سؤال</span>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ابحث في نص السؤال، الاختيارات، أو الدرس..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border-none text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                مسح
              </button>
            )}
          </div>

          {/* Lesson Filter */}
          <select
            value={selectedLesson}
            onChange={(e) => setSelectedLesson(e.target.value)}
            className="w-full md:w-56 px-3 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border-none text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="all">كل الدروس والوحدات ({questions.length})</option>
            {availableLessons.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>

          {/* Difficulty Filter */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value as any)}
            className="w-full md:w-40 px-3 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border-none text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="all">كافة المستويات</option>
            <option value="easy">سهل ({easyCount})</option>
            <option value="medium">متوسط ({mediumCount})</option>
            <option value="hard">متقدم ({hardCount})</option>
          </select>

          {/* Question Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            className="w-full md:w-48 px-3 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border-none text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="all">جميع أنواع الأسئلة ({questions.length})</option>
            <option value="mcq">اختيار من متعدد ({mcqCount})</option>
            <option value="true_false">صح وغلط ({tfCount})</option>
            <option value="essay">أسئلة مقالية ({essayCount})</option>
          </select>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-2">
          <span>نتائج العرض: {filteredQuestions.length} سؤال</span>
          {filteredQuestions.length > 0 && (
            <button
              onClick={() => exportQuizToPDF(`بنك أسئلة - ${teacher.subject}`, filteredQuestions, teacher, undefined, true)}
              className="hover:text-indigo-600 flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة هذه الأسئلة PDF</span>
            </button>
          )}
        </div>

        {filteredQuestions.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center">
              <HelpCircle className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-1">لا توجد أسئلة تطابق البحث</h3>
            <p className="text-slate-400 text-sm max-w-sm mx-auto mb-4">
              يمكنك تغيير فلاتر البحث أو النقر على "إضافة سؤال جديد" لإثراء بنك الأسئلة.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => handleOpenAdd('mcq')}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
              >
                + اختيار من متعدد
              </button>
              <button
                onClick={() => handleOpenAdd('true_false')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                + صح وغلط
              </button>
              <button
                onClick={() => handleOpenAdd('essay')}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
              >
                + سؤال مقالي
              </button>
            </div>
          </div>
        ) : (
          filteredQuestions.map((q, idx) => {
            const arabicLetters = ['أ', 'ب', 'ج', 'د'];
            const diffColor =
              q.difficulty === 'easy'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                : q.difficulty === 'medium'
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800';

            const diffText =
              q.difficulty === 'easy' ? 'مستوى سهل' : q.difficulty === 'medium' ? 'مستوى متوسط' : 'مستوى متقدم';

            return (
              <div
                key={q.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-all space-y-4"
              >
                {/* Header tags */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-black flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
                      {q.lesson}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-xl border text-[11px] font-bold ${diffColor}`}>
                      {diffText}
                    </span>
                    <span className="px-2 py-0.5 rounded-xl bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-300 text-[11px] font-bold">
                      {q.type === 'mcq'
                        ? 'اختيار من متعدد'
                        : q.type === 'true_false'
                        ? 'صح وغلط'
                        : 'سؤال مقالي'}
                    </span>
                    <span className="px-2 py-0.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold">
                      [{q.points || 1} {q.points === 1 ? 'درجة' : 'درجات'}]
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(q)}
                      className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 transition-colors"
                      title="تعديل السؤال"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('هل أنت متأكد من حذف هذا السؤال من بنك الأسئلة؟')) {
                          onDeleteQuestion(q.id);
                        }
                      }}
                      className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition-colors"
                      title="حذف السؤال"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100 leading-relaxed">
                  {q.questionText}
                </h3>

                {/* Options display for MCQ */}
                {q.type === 'mcq' && q.options?.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {q.options.map((opt, oIdx) => {
                      const isCorrect = Number(q.correctAnswer) === oIdx;
                      return (
                        <div
                          key={oIdx}
                          className={`p-3 rounded-2xl border text-xs sm:text-sm font-medium flex items-center justify-between gap-3 ${
                            isCorrect
                              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-400 text-emerald-900 dark:text-emerald-200 font-bold'
                              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                isCorrect
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {arabicLetters[oIdx] || oIdx + 1}
                            </span>
                            <span>{opt}</span>
                          </div>
                          {isCorrect && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>الإجابة الصحيحة</span>
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* True / False Display */}
                {q.type === 'true_false' && (
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    {[
                      { label: 'صواب (العبارة صحيحة)', value: 'صواب', icon: '✅' },
                      { label: 'خطأ (العبارة خاطئة)', value: 'خطأ', icon: '❌' },
                    ].map((choice) => {
                      const isCorrect = String(q.correctAnswer).trim() === choice.value;
                      return (
                        <div
                          key={choice.value}
                          className={`px-4 py-2.5 rounded-2xl border text-xs sm:text-sm font-bold flex items-center gap-2 ${
                            isCorrect
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-500/20 shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 opacity-60'
                          }`}
                        >
                          <span>{choice.icon}</span>
                          <span>{choice.label}</span>
                          {isCorrect && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold flex items-center gap-1 mr-2">
                              <Check className="w-3 h-3" />
                              <span>الإجابة الصحيحة</span>
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Essay Model Answer Display */}
                {q.type === 'essay' && (
                  <div className="p-4 rounded-2xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/80 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-violet-800 dark:text-violet-300">
                      <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                      <span>نموذج الإجابة وعناصر الحل المعتمدة:</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                      {String(q.correctAnswer)}
                    </p>
                  </div>
                )}

                {/* Explanation */}
                {q.explanation && (
                  <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2">
                    <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">الشرح ونموذج الإجابة: </strong>
                      <span>{q.explanation}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Question Modal */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  {editingQuestion ? 'تعديل السؤال' : 'إضافة سؤال جديد لبنك الأسئلة'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    اسم الدرس أو الوحدة *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: الباب الأول - قانون أوم"
                    value={formLesson}
                    onChange={(e) => setFormLesson(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    الصف الدراسي (المرحلة)
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: الصف الثالث الثانوي"
                    value={formGrade}
                    onChange={(e) => setFormGrade(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    نوع السؤال
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => {
                      const newType = e.target.value as QuestionType;
                      setFormType(newType);
                      if (newType === 'mcq') {
                        setFormOptions(['', '', '', '']);
                        setFormCorrectAnswer(0);
                        setFormPoints(2);
                      } else if (newType === 'true_false') {
                        setFormOptions(['صواب', 'خطأ']);
                        setFormCorrectAnswer('صواب');
                        setFormPoints(1);
                      } else if (newType === 'essay') {
                        setFormOptions([]);
                        setFormCorrectAnswer('');
                        setFormPoints(3);
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="mcq">اختيار من متعدد (MCQ)</option>
                    <option value="true_false">صح أو خطأ (صواب / خطأ)</option>
                    <option value="essay">سؤال مقالي (إجابة إنشائية وشرح)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    مستوى الصعوبة
                  </label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="easy">سهل (مباشر)</option>
                    <option value="medium">متوسط (تطبيقي)</option>
                    <option value="hard">متقدم (مستويات عليا)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    الدرجة المخصصة للسؤال
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formPoints}
                    onChange={(e) => setFormPoints(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  نص السؤال *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder={
                    formType === 'essay'
                      ? 'مثال: علل، وضح بالرسم والشرح، قارن في جدول بين، اذكر وظيفة...'
                      : formType === 'true_false'
                      ? 'اكتب العبارة العلمية المراد الحكم عليها بالصواب أو الخطأ...'
                      : 'اكتب صيغة السؤال واختياراته هنا بوضوح...'
                  }
                  value={formQuestionText}
                  onChange={(e) => setFormQuestionText(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border-none text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>

              {/* Options Section */}
              {formType === 'mcq' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                    خيارات الإجابة (حدد الإجابة الصحيحة بالضغط على الدائرة) *
                  </label>
                  {formOptions.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        id={`opt-radio-${oIdx}`}
                        name="correctAnswer"
                        checked={Number(formCorrectAnswer) === oIdx}
                        onChange={() => setFormCorrectAnswer(oIdx)}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className="font-bold text-xs text-slate-400 w-5 text-center">
                        {['أ', 'ب', 'ج', 'د'][oIdx]}
                      </span>
                      <input
                        type="text"
                        required
                        placeholder={`الخيار ${oIdx + 1}`}
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...formOptions];
                          newOpts[oIdx] = e.target.value;
                          setFormOptions(newOpts);
                        }}
                        className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium border-none outline-none focus:ring-2 focus:ring-indigo-500 ${
                          Number(formCorrectAnswer) === oIdx
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              )}

              {formType === 'true_false' && (
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 space-y-2">
                  <label className="block text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    حدد الإجابة الصحيحة للعبارة (صح أو خطأ): *
                  </label>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {[
                      { label: 'صواب (العبارة صحيحة)', val: 'صواب', icon: '✅' },
                      { label: 'خطأ (العبارة خاطئة)', val: 'خطأ', icon: '❌' },
                    ].map((choice) => (
                      <button
                        key={choice.val}
                        type="button"
                        onClick={() => setFormCorrectAnswer(choice.val)}
                        className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                          formCorrectAnswer === choice.val
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                        }`}
                      >
                        <span>{choice.icon}</span>
                        <span>{choice.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {formType === 'essay' && (
                <div className="space-y-3 p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-900 dark:text-purple-300">
                    <BookOpen className="w-4 h-4 text-purple-600" />
                    <span>نموذج الإجابة الاسترشادي وعناصر التقييم للسؤال المقالي *</span>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      نص الإجابة النموذجية المعتمدة (المطلوبة من الطالب): *
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="اكتب هنا عناصر الإجابة الدقيقة ونموذج الحل الاسترشادي وتوزيع الدرجات..."
                      value={String(formCorrectAnswer || '')}
                      onChange={(e) => setFormCorrectAnswer(e.target.value)}
                      className="w-full p-3 rounded-xl bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-700 text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                    />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      يُعرض هذا النموذج للطالب عند مراجعة النتيجة ويُدرج في ورقة نموذج إجابة الامتحان PDF.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  شرح الإجابة والنموذج الاسترشادي (اختياري)
                </label>
                <textarea
                  rows={2}
                  placeholder="اكتب التفسير العلمي للإجابة ليظهر للطالب في تقرير التصحيح..."
                  value={formExplanation}
                  onChange={(e) => setFormExplanation(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
                >
                  {editingQuestion ? 'حفظ التعديلات' : 'إضافة السؤال للبنك'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generator Modal */}
      {isGeneratorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  مولّد الاختبارات الفوري من بنك الأسئلة
                </h3>
              </div>
              <button
                onClick={() => setIsGeneratorModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  عنوان الاختبار
                </label>
                <input
                  type="text"
                  value={genTitle}
                  onChange={(e) => setGenTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    المجموعة المستهدفة
                  </label>
                  <select
                    value={genGroupId}
                    onChange={(e) => setGenGroupId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">كافة المجموعات</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    اختيار الدرس / الوحدة
                  </label>
                  <select
                    value={genLesson}
                    onChange={(e) => setGenLesson(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">سحب عشوائي شامل من كافة الدروس</option>
                    {availableLessons.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    نوعية الأسئلة في الاختبار
                  </label>
                  <select
                    value={genType}
                    onChange={(e) => setGenType(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">مزيج متوازن (اختياري + صح وغلط + مقالي)</option>
                    <option value="mcq">اختيار من متعدد فقط (MCQ)</option>
                    <option value="true_false">صح وغلط فقط (صواب / خطأ)</option>
                    <option value="essay">أسئلة مقالية فقط</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    مستوى الصعوبة المطلوب
                  </label>
                  <select
                    value={genDifficulty}
                    onChange={(e) => setGenDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">مزيج متوازن من كافة المستويات</option>
                    <option value="easy">سهل ومباشر فقط</option>
                    <option value="medium">متوسط فقط</option>
                    <option value="hard">مستويات عليا وتحدي فقط</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  عدد الأسئلة المراد سحبها: ({genCount})
                </label>
                <input
                  type="range"
                  min={1}
                  max={Math.max(5, questions.length)}
                  value={genCount}
                  onChange={(e) => setGenCount(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer mt-2"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  يقوم المولد بسحب الأسئلة ومزجها تلقائياً بدون تكرار، مع جاهزية تامة للتصحيح الإلكتروني الفوري في بوابة الطالب والامتحانات!
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="includeKey"
                  checked={genIncludeKeyInPdf}
                  onChange={(e) => setGenIncludeKeyInPdf(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="includeKey" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  تضمين نموذج الإجابة الاسترشادي في ملف الـ PDF عند الطباعة
                </label>
              </div>

              {/* Actions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleConfirmCreateExam}
                  className="p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all"
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>نشر في الامتحانات</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintGeneratedPDF}
                  className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة ورقة PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleStartInteractiveQuiz}
                  className="p-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all"
                >
                  <Play className="w-4 h-4" />
                  <span>تجربة حل الاختبار</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Quiz Mode Modal */}
      {interactiveQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <Play className="w-5 h-5 text-indigo-600" />
                  <span>تجربة حل الاختبار التفاعلي</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {interactiveQuiz.length} أسئلة • المادة: {teacher.subject}
                </p>
              </div>
              <button
                onClick={() => setInteractiveQuiz(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score Banner if Submitted */}
            {isQuizSubmitted && (
              <div
                className={`p-5 rounded-2xl border text-center space-y-2 ${
                  interactiveScore.percentage >= 50
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-900 dark:text-emerald-100'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-900 dark:text-rose-100'
                }`}
              >
                <div className="inline-flex p-3 rounded-full bg-white dark:bg-slate-800 shadow-xs mb-1">
                  <Award className="w-8 h-8 text-amber-500" />
                </div>
                <h4 className="text-xl font-black">
                  النتيجة: {interactiveScore.score} من {interactiveScore.total} ({interactiveScore.percentage}%)
                </h4>
                <p className="text-xs font-bold opacity-80">
                  {interactiveScore.percentage >= 85
                    ? 'ممتاز جداً! إجابات نموذجية متقنة 🌟'
                    : interactiveScore.percentage >= 50
                    ? 'جيد! راجع الشروحات أدناه لمزيد من التفوق 👍'
                    : 'تحتاج للمزيد من التركيز والمراجعة 💡'}
                </p>
              </div>
            )}

            {/* Questions Form */}
            <div className="space-y-6 max-h-[60vh] overflow-y-auto px-1">
              {interactiveQuiz.map((q, idx) => {
                const currentAnswer = userAnswers[q.id];
                const isCorrect =
                  isQuizSubmitted &&
                  (q.type === 'mcq'
                    ? Number(currentAnswer) === Number(q.correctAnswer)
                    : q.type === 'true_false'
                    ? String(currentAnswer).trim() === String(q.correctAnswer).trim()
                    : Boolean(currentAnswer && String(currentAnswer).trim().length > 6));

                return (
                  <div
                    key={q.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isQuizSubmitted
                        ? isCorrect
                          ? 'border-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/20'
                          : 'border-rose-400 bg-rose-50/20 dark:bg-rose-950/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-relaxed">
                        <span className="text-indigo-600 ml-1.5">({idx + 1})</span>
                        {q.questionText}
                      </div>
                      <span className="text-[11px] font-bold text-slate-400 shrink-0">
                        [{q.points || 1} د]
                      </span>
                    </div>

                    {q.type === 'mcq' && (
                      <div className="space-y-2">
                        {q.options.map((opt, oIdx) => {
                          const isSelected = Number(currentAnswer) === oIdx;
                          const isModelAnswer = isQuizSubmitted && Number(q.correctAnswer) === oIdx;

                          return (
                            <button
                              key={oIdx}
                              type="button"
                              disabled={isQuizSubmitted}
                              onClick={() => setUserAnswers((prev) => ({ ...prev, [q.id]: oIdx }))}
                              className={`w-full text-right p-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                                isModelAnswer
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : isSelected
                                  ? isQuizSubmitted
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-indigo-600 text-white shadow-sm'
                                  : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                              }`}
                            >
                              <span>{opt}</span>
                              {isModelAnswer && <Check className="w-4 h-4 text-white" />}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {q.type === 'true_false' && (
                      <div className="flex gap-3">
                        {['صواب', 'خطأ'].map((choice) => {
                          const isSelected = currentAnswer === choice;
                          const isModelAnswer = isQuizSubmitted && q.correctAnswer === choice;

                          return (
                            <button
                              key={choice}
                              type="button"
                              disabled={isQuizSubmitted}
                              onClick={() => setUserAnswers((prev) => ({ ...prev, [q.id]: choice }))}
                              className={`flex-1 p-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                isModelAnswer
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : isSelected
                                  ? isQuizSubmitted
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-indigo-600 text-white shadow-sm'
                                  : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                              }`}
                            >
                              <span>{choice}</span>
                              {isModelAnswer && <Check className="w-4 h-4 text-white" />}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {q.type === 'essay' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                            إجابة السؤال المقالي:
                          </label>
                          <textarea
                            disabled={isQuizSubmitted}
                            rows={3}
                            placeholder="اكتب هنا إجابتك النموذجية وشرحك وخطوات الحل بالتفصيل..."
                            value={String(currentAnswer || '')}
                            onChange={(e) =>
                              setUserAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                            }
                            className="w-full p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                          />
                        </div>

                        {/* When submitted, show comparison with model answer */}
                        {isQuizSubmitted && (
                          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 space-y-1.5">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>نموذج الإجابة والعناصر المعتمدة:</span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-semibold">
                              {String(q.correctAnswer)}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Explanation after submission */}
                    {isQuizSubmitted && q.explanation && (
                      <div className="mt-3 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
                        <strong>💡 التوضيح: </strong> {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              {isQuizSubmitted ? (
                <button
                  onClick={() => {
                    setUserAnswers({});
                    setIsQuizSubmitted(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>إعادة الاختبار</span>
                </button>
              ) : (
                <div className="text-xs text-slate-400">
                  تم الإجابة على {Object.keys(userAnswers).length} من {interactiveQuiz.length}
                </div>
              )}

              {!isQuizSubmitted ? (
                <button
                  onClick={handleSubmitInteractiveQuiz}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md"
                >
                  إنهاء وتصحيح الاختبار الآن
                </button>
              ) : (
                <button
                  onClick={() => setInteractiveQuiz(null)}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md"
                >
                  إغلاق
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
