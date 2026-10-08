import {
  TeacherProfile,
  Group,
  Student,
  AttendanceRecord,
  PaymentRecord,
  EducationalResource,
  ResourceSubmission,
  Exam,
  StudentExamScore,
  BankQuestion,
  DeletedIdsPayload,
} from '../types';

export function generatePortalToken(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    const p1 = crypto.randomUUID().replace(/-/g, '');
    const p2 = crypto.randomUUID().replace(/-/g, '');
    return `${p1}${p2}`;
  }
  const rand = () => Math.random().toString(36).substring(2);
  return `${rand()}${rand()}${Date.now().toString(36)}${rand()}`;
}

const STORAGE_KEYS = {
  TEACHER: 'teacher_app_profile',
  GROUPS: 'teacher_app_groups',
  STUDENTS: 'teacher_app_students',
  ATTENDANCE: 'teacher_app_attendance',
  PAYMENTS: 'teacher_app_payments',
  RESOURCES: 'teacher_app_resources',
  DARK_MODE: 'teacher_app_dark_mode',
  EXAMS: 'teacher_app_exams',
  EXAM_SCORES: 'teacher_app_exam_scores',
  SUBMISSIONS: 'teacher_app_submissions',
  QUESTIONS: 'teacher_app_questions',
  PENDING_DELETIONS: 'teacher_app_pending_deletions',
  LAST_BACKUP_DATE: 'teacher_app_last_backup_date',
};

export const INITIAL_TEACHER: TeacherProfile = {
  name: 'أحمد محمود العطار',
  gender: 'male',
  subject: 'الفيزياء والكيمياء',
  phone: '01012345678',
  centerName: 'أكاديمية الفرسان التعليمية',
  currency: 'ج.م',
  defaultFee: 250,
  avatarUrl: '',
  bio: 'معلم أول لمادتي الفيزياء والكيمياء للمرحلة الثانوية بخبرة تتجاوز 12 عاماً.',
  whatsappAttendanceTemplate: '',
  whatsappPaymentTemplate: '',
};

export const INITIAL_GROUPS: Group[] = [
  {
    id: 'grp-1',
    name: 'الصف الثالث الثانوي (علمي) - السبت والثلاثاء',
    grade: 'الصف الثالث الثانوي',
    scheduleDays: ['السبت', 'الثلاثاء'],
    scheduleTime: '04:30 مساءً',
    fee: 300,
    feeType: 'monthly',
    color: 'indigo',
    icon: 'graduation',
    iconShape: 'squircle',
    notes: 'مجموعة المتميزين في سنتر الفرسان - القاعة الكبرى',
    createdAt: '2026-09-01',
  },
  {
    id: 'grp-2',
    name: 'الصف الثاني الثانوي - الأحد والأربعاء',
    grade: 'الصف الثاني الثانوي',
    scheduleDays: ['الأحد', 'الأربعاء'],
    scheduleTime: '06:00 مساءً',
    fee: 250,
    feeType: 'monthly',
    color: 'emerald',
    icon: 'atom',
    iconShape: 'circle',
    notes: 'قاعة 3 - المعمل',
    createdAt: '2026-09-05',
  },
  {
    id: 'grp-3',
    name: 'الصف الأول الثانوي - الإثنين والخميس',
    grade: 'الصف الأول الثانوي',
    scheduleDays: ['الإثنين', 'الخميس'],
    scheduleTime: '03:30 مساءً',
    fee: 220,
    feeType: 'monthly',
    color: 'amber',
    icon: 'book',
    iconShape: 'rounded',
    notes: 'مجموعة التأسيس والشرح المفصل',
    createdAt: '2026-09-10',
  },
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'stu-1',
    code: 'STU-1001',
    name: 'يوسف أحمد عبد الرحمن',
    gender: 'male',
    groupId: 'grp-1',
    studentPhone: '01099887766',
    guardianPhone: '01223344556',
    guardianName: 'أحمد عبد الرحمن (الأب)',
    enrollmentDate: '2026-09-01',
    notes: 'طالب متفوق وحاصل على الدرجة النهائية بالامتحان التجريبي',
    avatarColor: 'bg-blue-500',
  },
  {
    id: 'stu-2',
    code: 'STU-1002',
    name: 'سارة محمود حسنين',
    gender: 'female',
    groupId: 'grp-1',
    studentPhone: '01122334488',
    guardianPhone: '01011223399',
    guardianName: 'محمود حسنين',
    enrollmentDate: '2026-09-02',
    notes: 'ملتزمة بالحضور والواجبات',
    avatarColor: 'bg-pink-500',
  },
  {
    id: 'stu-3',
    code: 'STU-1003',
    name: 'عمر خالد المنشاوي',
    gender: 'male',
    groupId: 'grp-1',
    studentPhone: '01277665544',
    guardianPhone: '01288990011',
    guardianName: 'خالد المنشاوي',
    enrollmentDate: '2026-09-03',
    notes: 'يحتاج تركيز في مسائل الديناميكا الحرارية',
    avatarColor: 'bg-emerald-500',
  },
  {
    id: 'stu-4',
    code: 'STU-1004',
    name: 'مريم علي الزيات',
    gender: 'female',
    groupId: 'grp-1',
    studentPhone: '01066554433',
    guardianPhone: '01155443322',
    guardianName: 'علي الزيات',
    enrollmentDate: '2026-09-04',
    avatarColor: 'bg-purple-500',
  },
  {
    id: 'stu-5',
    code: 'STU-1005',
    name: 'كريم وائل الصاوي',
    gender: 'male',
    groupId: 'grp-2',
    studentPhone: '01511224455',
    guardianPhone: '01099881122',
    guardianName: 'وائل الصاوي',
    enrollmentDate: '2026-09-05',
    avatarColor: 'bg-teal-500',
  },
  {
    id: 'stu-6',
    code: 'STU-1006',
    name: 'نور الدين مصطفى قاسم',
    gender: 'male',
    groupId: 'grp-2',
    studentPhone: '01033445566',
    guardianPhone: '01244556677',
    guardianName: 'مصطفى قاسم',
    enrollmentDate: '2026-09-06',
    avatarColor: 'bg-amber-500',
  },
  {
    id: 'stu-7',
    code: 'STU-1007',
    name: 'جنى إبراهيم توفيق',
    gender: 'female',
    groupId: 'grp-2',
    studentPhone: '01199882233',
    guardianPhone: '01566778899',
    guardianName: 'إبراهيم توفيق',
    enrollmentDate: '2026-09-07',
    avatarColor: 'bg-rose-500',
  },
  {
    id: 'stu-8',
    code: 'STU-1008',
    name: 'حمزة أشرف الدسوقي',
    gender: 'male',
    groupId: 'grp-3',
    studentPhone: '01211229988',
    guardianPhone: '01022338877',
    guardianName: 'أشرف الدسوقي',
    enrollmentDate: '2026-09-10',
    avatarColor: 'bg-indigo-500',
  },
  {
    id: 'stu-9',
    code: 'STU-1009',
    name: 'ملك هشام الشريف',
    gender: 'female',
    groupId: 'grp-3',
    studentPhone: '01044557788',
    guardianPhone: '01122446688',
    guardianName: 'هشام الشريف',
    enrollmentDate: '2026-09-11',
    avatarColor: 'bg-violet-500',
  },
  {
    id: 'stu-10',
    code: 'STU-1010',
    name: 'زياد طارق البحيري',
    gender: 'male',
    groupId: 'grp-3',
    studentPhone: '01555667788',
    guardianPhone: '01288776655',
    guardianName: 'طارق البحيري',
    enrollmentDate: '2026-09-12',
    avatarColor: 'bg-cyan-500',
  },
];

const todayStr = new Date().toISOString().split('T')[0];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att-1',
    studentId: 'stu-1',
    groupId: 'grp-1',
    date: todayStr,
    time: '16:25',
    status: 'present',
    method: 'qr',
  },
  {
    id: 'att-2',
    studentId: 'stu-2',
    groupId: 'grp-1',
    date: todayStr,
    time: '16:30',
    status: 'present',
    method: 'qr',
  },
  {
    id: 'att-3',
    studentId: 'stu-3',
    groupId: 'grp-1',
    date: todayStr,
    time: '16:45',
    status: 'late',
    note: 'تأخير بسبب المواصلات',
    method: 'manual',
  },
  {
    id: 'att-4',
    studentId: 'stu-4',
    groupId: 'grp-1',
    date: todayStr,
    time: '16:30',
    status: 'excused',
    note: 'ظرف صحي بإذن من ولي الأمر',
    method: 'manual',
  },
];

export const INITIAL_PAYMENTS: PaymentRecord[] = [
  {
    id: 'pay-1',
    studentId: 'stu-1',
    groupId: 'grp-1',
    amount: 300,
    date: todayStr,
    time: '16:26',
    monthCovered: 'شهر أكتوبر 2026',
    type: 'monthly_fee',
    paymentMethod: 'cash',
    receiptNumber: 'REC-7041',
    notes: 'تم استلام الرسوم كاملة مع كارت الحضور',
  },
  {
    id: 'pay-2',
    studentId: 'stu-2',
    groupId: 'grp-1',
    amount: 300,
    date: todayStr,
    time: '16:31',
    monthCovered: 'شهر أكتوبر 2026',
    type: 'monthly_fee',
    paymentMethod: 'vodafone_cash',
    receiptNumber: 'REC-7042',
  },
  {
    id: 'pay-3',
    studentId: 'stu-5',
    groupId: 'grp-2',
    amount: 250,
    date: todayStr,
    time: '17:00',
    monthCovered: 'شهر أكتوبر 2026',
    type: 'monthly_fee',
    paymentMethod: 'instapay',
    receiptNumber: 'REC-7043',
  },
];

export const INITIAL_RESOURCES: EducationalResource[] = [
  {
    id: 'res-1',
    title: 'فيديو شرح الفصل الأول: التيار الكهربي وقانون أوم',
    type: 'video',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    groupId: 'grp-1',
    grade: 'الصف الثالث الثانوي',
    description: 'شرح تفصيلي مع حل 20 مسألة نموذجية من كتاب الوزارة',
    createdAt: '2026-09-15',
  },
  {
    id: 'res-2',
    title: 'مذكرة تدريبات الباب الأول وقوانين الدوائر الكهربية (PDF)',
    type: 'pdf',
    url: 'https://drive.google.com',
    groupId: 'grp-1',
    grade: 'الصف الثالث الثانوي',
    fileName: 'مذكرة_تدريبات_الدوائر_الكهربية.pdf',
    description: 'مذكرة تدريبات شاملة مع أسئلة اختيار من متعدد - يمكنك تحميلها وحلها ثم رفع إجاباتك للتصحيح الفوري',
    createdAt: '2026-09-18',
    questionsCount: 4,
    answerKey: ['أ', 'ج', 'ب', 'أ'],
  },
  {
    id: 'res-3',
    title: 'حصة مراجعة تفاعلية مسجلة: الحركة الموجية',
    type: 'video',
    url: 'https://www.youtube.com',
    groupId: 'grp-2',
    grade: 'الصف الثاني الثانوي',
    description: 'تسجيل حصة الزووم والمناقشات لطلاب المجموعة',
    createdAt: '2026-09-20',
  },
  {
    id: 'res-4',
    title: 'مذكرة أسئلة وتدريبات الحركة بعجلة منتظمة (PDF)',
    type: 'pdf',
    url: 'https://drive.google.com',
    groupId: 'grp-2',
    grade: 'الصف الثاني الثانوي',
    fileName: 'تدريبات_معادلات_الحركة.pdf',
    description: 'مذكرة واجب وتدريب إلكتروني تحتوي على أسئلة للمراجعة والتصحيح التلقائي الفوري',
    createdAt: '2026-09-21',
    questionsCount: 3,
    answerKey: ['ب', 'أ', 'ج'],
  },
];

export const INITIAL_EXAMS: Exam[] = [
  {
    id: 'exam-1',
    title: 'اختبار نصف الفصل الدراسي - الدوائر الكهربية',
    groupId: 'grp-1',
    date: '2026-10-03',
    time: '04:30 مساءً',
    maxScore: 50,
    passingScore: 25,
    topics: 'قوانين كيرشوف، توصيل المقاومات، قانون أوم للدوائر المغلقة',
    notes: 'برجاء إحضار الآلة الحاسبة والمسطرة، الاختبار 60 دقيقة',
    createdAt: '2026-09-22',
    fileName: 'امتحان_الدوائر_الكهربية.pdf',
    questions: [
      {
        id: 'q1',
        questionText: 'في الدائرة الموضحة، إذا تضاعفت المقاومة الكهربية عند ثبوت فرق الجهد، فإن شدة التيار المار:',
        options: ['تتضاعف', 'تقل إلى النصف', 'تظل ثابتة', 'تزداد لأربعة أمثال'],
        correctOptionIndex: 1,
        explanation: 'وفقاً لقانون أوم (I = V / R)، عند ثبوت الجهد يتناسب التيار عكسياً مع المقاومة.',
      },
      {
        id: 'q2',
        questionText: 'المجموع الجبري للتيارات الكهربية الداخلة إلى نقطة تفرع في دائرة مغلقة يساوي:',
        options: ['الجهد الكلي', 'صفر', 'مجموع التيارات الخارجة', 'المقاومة المكافئة'],
        correctOptionIndex: 2,
        explanation: 'نص قانون كيرشوف الأول (حفظ الشحنة): مجموع التيارات الداخلة = مجموع التيارات الخارجة.',
      },
      {
        id: 'q3',
        questionText: 'وحدة قياس المقاومة النوعية لمادة موصل هي:',
        options: ['أوم . متر', 'أوم / متر', 'أمبير . متر', 'فولت / أوم'],
        correctOptionIndex: 0,
        explanation: 'المقاومة النوعية ρ = R * A / L، وبالتالي وحدتها (أوم * م² / م) = أوم . متر.',
      },
    ],
  },
  {
    id: 'exam-2',
    title: 'كويز شامل على معادلات الحركة والمقذوفات',
    groupId: 'grp-2',
    date: '2026-10-05',
    time: '06:00 مساءً',
    maxScore: 30,
    passingScore: 15,
    topics: 'معادلات الحركة بعجلة منتظمة والمسائل التطبيقية',
    notes: 'اختبار سريع 30 دقيقة في بداية الحصة',
    createdAt: '2026-09-23',
    fileName: 'كويز_الحركة_والمقذوفات.pdf',
    questions: [
      {
        id: 'q1',
        questionText: 'جسم يتحرك من السكون بعجلة منتظمة 2 m/s²، فتكون سرعته بعد 5 ثوانٍ:',
        options: ['5 m/s', '10 m/s', '20 m/s', '2.5 m/s'],
        correctOptionIndex: 1,
        explanation: 'وفقاً للمعادلة الأولى للحركة: vf = vi + at = 0 + (2 * 5) = 10 m/s.',
      },
      {
        id: 'q2',
        questionText: 'عند قذف جسم رأسياً لأعلى، فإن سرعته عند أقصى ارتفاع تساوي:',
        options: ['أقصى قيمة', 'صفر', 'عجلة الجاذبية', 'نصف سرعته الابتدائية'],
        correctOptionIndex: 1,
        explanation: 'يتوقف الجسم لحظياً عند بلوغه أقصى ارتفاع قبل أن يسقط.',
      },
    ],
  },
];

export const INITIAL_SUBMISSIONS: ResourceSubmission[] = [
  {
    id: 'sub-1',
    resourceId: 'res-2',
    studentId: 'stu-1',
    submittedAt: '2026-09-24T18:30:00Z',
    submittedFileName: 'حل_يوسف_أحمد_مذكرة_الباب_الأول.pdf',
    studentAnswers: { 0: 'أ', 1: 'ج', 2: 'ب', 3: 'أ' },
    score: 4,
    totalScore: 4,
    feedback: [
      { questionNum: 1, studentAnswer: 'أ', correctAnswer: 'أ', isCorrect: true, explanation: 'إجابة صحيحة نموذجية' },
      { questionNum: 2, studentAnswer: 'ج', correctAnswer: 'ج', isCorrect: true, explanation: 'إجابة صحيحة وفق قانون أوم' },
      { questionNum: 3, studentAnswer: 'ب', correctAnswer: 'ب', isCorrect: true, explanation: 'تطبيق دقيق لحساب المقاومات' },
      { questionNum: 4, studentAnswer: 'أ', correctAnswer: 'أ', isCorrect: true, explanation: 'تطبيق صحيح لقانون كيرشوف' },
    ],
    aiFeedbackNotes: 'أداء ممتاز يا بطل! إجاباتك جميعها نموذجية ودرجتك كاملة 4 من 4.',
  },
];

export const INITIAL_EXAM_SCORES: StudentExamScore[] = [
  {
    id: 'score-1',
    examId: 'exam-1',
    studentId: 'stu-1',
    score: 48,
    maxScore: 50,
    notes: 'ممتاز وإجابة نموذجية',
    dateGraded: '2026-09-24',
  },
  {
    id: 'score-2',
    examId: 'exam-1',
    studentId: 'stu-2',
    score: 44,
    maxScore: 50,
    notes: 'أداء رائع وتركيز عالي',
    dateGraded: '2026-09-24',
  },
];

export function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Storage save error:', err);
  }
}

export const INITIAL_QUESTIONS: BankQuestion[] = [
  {
    id: 'q-1',
    subject: 'الفيزياء',
    lesson: 'قوانين نيوتن والحركة الدائرية',
    grade: 'الصف الأول الثانوي',
    type: 'mcq',
    difficulty: 'medium',
    questionText: 'عند مضاعفة السرعة المماسية لجسم يتحرك في مسار دائري منتظم، فإن القوة الجاذبة المركزية اللازمة لإبقائه في نفس المسار:',
    options: ['تزداد إلى الضعف', 'تزداد إلى أربعة أمثالها', 'تقل إلى النصف', 'تظل ثابتة'],
    correctAnswer: 1,
    explanation: 'القوة الجاذبة المركزية تتناسب طردياً مع مربع السرعة المماسية (F = m*v^2 / r). فعند مضاعفة السرعة تصبح (2v)^2 = 4v^2.',
    points: 2,
    createdAt: '2026-09-15',
  },
  {
    id: 'q-2',
    subject: 'الكيمياء',
    lesson: 'الروابط الكيميائية والتهجين',
    grade: 'الصف الثاني الثانوي',
    type: 'mcq',
    difficulty: 'hard',
    questionText: 'نوع التهجين في ذرة الكربون في جزيء الأسيتيلين (C2H2) والزاوية بين الروابط المهجنة هي:',
    options: ['sp3 وزاوية 109.5°', 'sp2 وزاوية 120°', 'sp وزاوية 180°', 'dsp2 وزاوية 90°'],
    correctAnswer: 2,
    explanation: 'في جزئ الأسيتيلين، كل ذرة كربون متصلة برابطة أحادية ورابطة ثلاثية (واحدة سيجما واثنتان باي)، وبالتالي التهجين sp والشكل خطي بزاوية 180°.',
    points: 2,
    createdAt: '2026-09-16',
  },
  {
    id: 'q-3',
    subject: 'الفيزياء',
    lesson: 'التيار الكهربي وقانون أوم',
    grade: 'الصف الثالث الثانوي',
    type: 'true_false',
    difficulty: 'easy',
    questionText: 'المقاومة النوعية لمادة موصل تزداد بزيادة درجة حرارة الموصل.',
    options: ['صواب', 'خطأ'],
    correctAnswer: 'صواب',
    explanation: 'عند رفع درجة الحرارة تزداد سعة وسرعة اهتزاز ذرات الفلز مما يزيد من معدل تصادم الإلكترونات معها فتزداد المقاومة النوعية.',
    points: 1,
    createdAt: '2026-09-18',
  },
  {
    id: 'q-4',
    subject: 'الفيزياء',
    lesson: 'قانون أوم للدائرة المغلقة',
    grade: 'الصف الثالث الثانوي',
    type: 'mcq',
    difficulty: 'medium',
    questionText: 'في دائرة كهربية تحتوي على بطارية ومقاومة خارجية، عندما تصبح المقاومة الخارجية مساوية للمقاومة الداخلية، فإن القدرة الكهربية المستنفدة في المقاومة الخارجية تكون:',
    options: ['أقل ما يمكن', 'أقصى ما يمكن (أعظمية)', 'تساوي صفراً', 'نصف القوة الدافعة'],
    correctAnswer: 1,
    explanation: 'تتحقق أقصى قدرة منقولة للحمل الخارجي (Maximum Power Transfer) عندما R = r.',
    points: 2,
    createdAt: '2026-09-20',
  },
  {
    id: 'q-5',
    subject: 'الكيمياء',
    lesson: 'الاتزان الكيميائي وقاعدة لوشاتيليه',
    grade: 'الصف الثالث الثانوي',
    type: 'true_false',
    difficulty: 'easy',
    questionText: 'إضافة عامل حفاز إلى تفاعل انعكاسي متزن يزيد من كمية النواتج عند الاتزان.',
    options: ['صواب', 'خطأ'],
    correctAnswer: 'خطأ',
    explanation: 'العامل الحفاز يسرع التفاعلين الطردي والعكسي بنفس المقدار دون التأثير على موضع الاتزان أو كميات المواد.',
    points: 1,
    createdAt: '2026-09-22',
  },
  {
    id: 'q-6',
    subject: 'الفيزياء',
    lesson: 'الفيزياء الحديثة وإشعاع الجسم الأسود',
    grade: 'الصف الثالث الثانوي',
    type: 'mcq',
    difficulty: 'hard',
    questionText: 'وفقاً لقانون فين، فإن الطول الموجي المصاحب لأقصى شدة إشعاع يصدر من جسم متوهج يتناسب:',
    options: ['طردياً مع درجة الحرارة المطلقة', 'عكسياً مع درجة الحرارة المطلقة', 'طردياً مع مربع درجة الحرارة', 'عكسياً مع الجذر التربيعي لدرجة الحرارة'],
    correctAnswer: 1,
    explanation: 'قانون فين ينص على أن: λ_max يتناسب عكسياً مع درجة الحرارة الكلفينية المطلقة T.',
    points: 2,
    createdAt: '2026-09-24',
  },
  {
    id: 'q-7',
    subject: 'الفيزياء',
    lesson: 'المحولات الكهربية وتوليد الطاقة',
    grade: 'الصف الثالث الثانوي',
    type: 'essay',
    difficulty: 'medium',
    questionText: 'علل (سؤال مقالي): يفضل نقل الطاقة الكهربية من محطات التوليد إلى مناطق الاستهلاك تحت جهود كهربية عالية جداً باستخدام محولات رافعة للجهد.',
    options: [],
    correctAnswer: 'لأن رفع الجهد الكهربي يؤدي إلى خفض شدة التيار المار في خطوط النقل بنفس النسبة، وبالتالي تقل القدرة والحرارة المفقودة في الأسلاك بدرجة كبيرة لأن القدرة المفقودة تتناسب طردياً مع مربع شدة التيار (P = I² × R).',
    explanation: 'تطبيق مباشر على علاقة القدرة المفقودة مع مربع شدة التيار وقانون بقاء الطاقة في المحول الكهربي.',
    points: 3,
    createdAt: '2026-09-25',
  },
  {
    id: 'q-8',
    subject: 'الفيزياء',
    lesson: 'أجهزة القياس الكهربي',
    grade: 'الصف الثالث الثانوي',
    type: 'essay',
    difficulty: 'hard',
    questionText: 'وضح بالتفصيل (سؤال مقالي): ما الأساس العلمي للجلفانومتر ذي الملف المتحرك؟ وما شرط استقرار المؤشر عند قراءة معينة؟',
    options: [],
    correctAnswer: 'الأساس العلمي: عزم الازدواج المغناطيسي المؤثر على ملف قابل للدوران يمر به تيار كهربي موضوع في مجال مغناطيسي منتظم. شرط استقرار المؤشر: عندما يتساوى عزم الازدواج المغناطيسي مع عزم اللي الناشئ في زوج الملفات الزنبركية.',
    explanation: 'عزم الازدواج وعزم اللي يتساويان في المقدار ويتضادان في الاتجاه فيثبت الملف والمؤشر.',
    points: 3,
    createdAt: '2026-09-26',
  },
  {
    id: 'q-9',
    subject: 'الفيزياء',
    lesson: 'الظاهرة الكهروضوئية',
    grade: 'الصف الثالث الثانوي',
    type: 'true_false',
    difficulty: 'medium',
    questionText: 'تزداد طاقة حركة الإلكترونات الضوئية المنبعثة من سطح الفلز بزيادة شدة الضوء الساقط عليه.',
    options: ['صواب', 'خطأ'],
    correctAnswer: 'خطأ',
    explanation: 'طاقة حركة الإلكترونات المنبعثة تتوقف فقط على تردد الضوء الساقط ونوع مادة السطح (دالة الشغل)، بينما زيادة شدة الضوء تزيد من عدد الإلكترونات المنبعثة وليس طاقتها.',
    points: 1,
    createdAt: '2026-09-27',
  },
  {
    id: 'q-10',
    subject: 'الفيزياء',
    lesson: 'الحث الكهرومغناطيسي وقاعدة لنز',
    grade: 'الصف الثالث الثانوي',
    type: 'true_false',
    difficulty: 'easy',
    questionText: 'قاعدة لنز تعد تطبيقاً عملياً لمبدأ بقاء الطاقة في الحث الكهرومغناطيسي.',
    options: ['صواب', 'خطأ'],
    correctAnswer: 'صواب',
    explanation: 'ينص مبدأ بقاء الطاقة على أن الشغل المبذول للتغلب على قوى التنافر أو التجاذب المغناطيسي يتحول إلى طاقة كهربية مستحثة.',
    points: 1,
    createdAt: '2026-09-28',
  },
  {
    id: 'q-11',
    subject: 'الفيزياء',
    lesson: 'المجال المغناطيسي للتيار الكهربي',
    grade: 'الصف الثالث الثانوي',
    type: 'true_false',
    difficulty: 'medium',
    questionText: 'ينعدم الفيض المغناطيسي الكلي الذي يخترق ملفاً عندما يكون مستوى الملف عمودياً على خطوط الفيض المغناطيسي.',
    options: ['صواب', 'خطأ'],
    correctAnswer: 'خطأ',
    explanation: 'الفيض المغناطيسي Φm = B·A·sinθ، وعندما يكون الملف عمودياً تكون الزاوية 90° وقيمة الفيض عظمى، بينما ينعدم عندما يكون موازياً لمجال الفيض.',
    points: 1,
    createdAt: '2026-09-28',
  },
  {
    id: 'q-12',
    subject: 'الفيزياء',
    lesson: 'الحث الكهرومغناطيسي والمحولات',
    grade: 'الصف الثالث الثانوي',
    type: 'essay',
    difficulty: 'hard',
    questionText: 'قارن في جدول منظم (سؤال مقالي): بين المحول الرافع للجهد والمحول الخافض للجهد من حيث: (1) النسبة بين عدد لفات الملف الثانوي والابتدائي، (2) شدة تيار الملف الثانوي مقارنة بالابتدائي، (3) موضع الاستخدام عند محطات التوليد ومناطق التوزيع.',
    options: [],
    correctAnswer: 'المحول الرافع للجهد: (Ns > Np) عدد لفات الثانوي أكبر - (Is < Ip) خافض لشدة التيار - يستخدم عند محطات توليد الطاقة الكهربية لتقليل الفقد. المحول الخافض للجهد: (Ns < Np) عدد لفات الثانوي أقل - (Is > Ip) رافع لشدة التيار - يستخدم عند أماكن التوزيع والاستهلاك والمصانع لحماية الأجهزة ومناسبة الجهد.',
    explanation: 'المحول الرافع للجهد خافض للتيار والعكس صحيح، طبقاً لقانون بقاء الطاقة (Vs/Vp = Ns/Np = Ip/Is).',
    points: 4,
    createdAt: '2026-09-29',
  },
  {
    id: 'q-13',
    subject: 'الفيزياء',
    lesson: 'الفيزياء الحديثة وليزر الهيليوم نيون',
    grade: 'الصف الثالث الثانوي',
    type: 'essay',
    difficulty: 'medium',
    questionText: 'ما الشروط الواجب توافرها لإنتاج أشعة الليزر في أي جهاز ليزر؟ مع ذكر وظيفة التجويف الرنيني باختصار.',
    options: [],
    correctAnswer: 'الشروط الواجب توافرها: (1) وجود وسط مادي فعال يحتوي على ذرات مناسبة. (2) توفير مصدر مناسب للطاقة لإثارة ذرات الوسط والوصول لوضع الإسكان المعكوس (Inversion). (3) وجود تجويف رنيني حاوٍ للمادة الفعالة. وظيفة التجويف الرنيني: يعمل كوعاء حاوٍ ومضخم لشعاع الليزر من خلال الانعكاسات المتتالية بين المرآتين العاكسة وشبه المنفذة.',
    explanation: 'الإسكان المعكوس والتضخيم بواسطة التجويف الرنيني هما الركيزتان الأساسيتان في إنتاج حزم فوتونات الليزر المترابطة.',
    points: 3,
    createdAt: '2026-09-29',
  },
];

export const StorageService = {
  getTeacher: () => getFromStorage<TeacherProfile>(STORAGE_KEYS.TEACHER, INITIAL_TEACHER),
  saveTeacher: (data: TeacherProfile) => saveToStorage(STORAGE_KEYS.TEACHER, data),

  getGroups: () => getFromStorage<Group[]>(STORAGE_KEYS.GROUPS, INITIAL_GROUPS),
  saveGroups: (data: Group[]) => saveToStorage(STORAGE_KEYS.GROUPS, data),

  getStudents: () => {
    const list = getFromStorage<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    let updated = false;
    const withTokens = list.map((s) => {
      if (!s.portalToken) {
        updated = true;
        return { ...s, portalToken: generatePortalToken() };
      }
      return s;
    });
    if (updated) {
      saveToStorage(STORAGE_KEYS.STUDENTS, withTokens);
    }
    return withTokens;
  },
  saveStudents: (data: Student[]) => {
    // Ensure all saved students have a portalToken
    const withTokens = data.map((s) => ({
      ...s,
      portalToken: s.portalToken || generatePortalToken(),
    }));
    saveToStorage(STORAGE_KEYS.STUDENTS, withTokens);
  },

  getAttendance: () => getFromStorage<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE),
  saveAttendance: (data: AttendanceRecord[]) => saveToStorage(STORAGE_KEYS.ATTENDANCE, data),

  getPayments: () => getFromStorage<PaymentRecord[]>(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS),
  savePayments: (data: PaymentRecord[]) => saveToStorage(STORAGE_KEYS.PAYMENTS, data),

  getResources: () => getFromStorage<EducationalResource[]>(STORAGE_KEYS.RESOURCES, INITIAL_RESOURCES),
  saveResources: (data: EducationalResource[]) => saveToStorage(STORAGE_KEYS.RESOURCES, data),

  getExams: () => getFromStorage<Exam[]>(STORAGE_KEYS.EXAMS, INITIAL_EXAMS),
  saveExams: (data: Exam[]) => saveToStorage(STORAGE_KEYS.EXAMS, data),

  getExamScores: () => getFromStorage<StudentExamScore[]>(STORAGE_KEYS.EXAM_SCORES, INITIAL_EXAM_SCORES),
  saveExamScores: (data: StudentExamScore[]) => saveToStorage(STORAGE_KEYS.EXAM_SCORES, data),

  getSubmissions: () => getFromStorage<ResourceSubmission[]>(STORAGE_KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS),
  saveSubmissions: (data: ResourceSubmission[]) => saveToStorage(STORAGE_KEYS.SUBMISSIONS, data),

  getQuestions: () => {
    const data = getFromStorage<BankQuestion[]>(STORAGE_KEYS.QUESTIONS, INITIAL_QUESTIONS);
    if (!data || data.length === 0) {
      return INITIAL_QUESTIONS;
    }
    const existingIds = new Set(data.map((q) => q.id));
    const missing = INITIAL_QUESTIONS.filter((q) => !existingIds.has(q.id));
    if (missing.length > 0) {
      const merged = [...data, ...missing];
      saveToStorage(STORAGE_KEYS.QUESTIONS, merged);
      return merged;
    }
    return data;
  },
  saveQuestions: (data: BankQuestion[]) => saveToStorage(STORAGE_KEYS.QUESTIONS, data),

  // Pending deletions tracking for offline sync
  getPendingDeletions: (): DeletedIdsPayload => {
    return getFromStorage<DeletedIdsPayload>(STORAGE_KEYS.PENDING_DELETIONS, {});
  },

  addPendingDeletions: (updates: DeletedIdsPayload) => {
    const current = StorageService.getPendingDeletions();
    const merged: DeletedIdsPayload = {
      groups: Array.from(new Set([...(current.groups || []), ...(updates.groups || [])])),
      students: Array.from(new Set([...(current.students || []), ...(updates.students || [])])),
      attendance: Array.from(new Set([...(current.attendance || []), ...(updates.attendance || [])])),
      payments: Array.from(new Set([...(current.payments || []), ...(updates.payments || [])])),
      questions: Array.from(new Set([...(current.questions || []), ...(updates.questions || [])])),
      exams: Array.from(new Set([...(current.exams || []), ...(updates.exams || [])])),
      scores: Array.from(new Set([...(current.scores || []), ...(updates.scores || [])])),
    };
    saveToStorage(STORAGE_KEYS.PENDING_DELETIONS, merged);
    return merged;
  },

  removeAcknowledgedDeletions: (acknowledged: DeletedIdsPayload) => {
    const current = StorageService.getPendingDeletions();
    const removeSet = (orig: string[] | undefined, ack: string[] | undefined) => {
      if (!orig) return [];
      if (!ack) return orig;
      const ackSet = new Set(ack);
      return orig.filter((id) => !ackSet.has(id));
    };

    const next: DeletedIdsPayload = {
      groups: removeSet(current.groups, acknowledged.groups),
      students: removeSet(current.students, acknowledged.students),
      attendance: removeSet(current.attendance, acknowledged.attendance),
      payments: removeSet(current.payments, acknowledged.payments),
      questions: removeSet(current.questions, acknowledged.questions),
      exams: removeSet(current.exams, acknowledged.exams),
      scores: removeSet(current.scores, acknowledged.scores),
    };
    saveToStorage(STORAGE_KEYS.PENDING_DELETIONS, next);
  },

  clearPendingDeletions: () => {
    saveToStorage(STORAGE_KEYS.PENDING_DELETIONS, {});
  },

  getLastBackupDate: (): string | null => {
    try {
      return localStorage.getItem(STORAGE_KEYS.LAST_BACKUP_DATE);
    } catch {
      return null;
    }
  },

  saveLastBackupDate: (dateStr: string) => {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_BACKUP_DATE, dateStr);
    } catch {
      // ignore
    }
  },

  getDarkMode: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DARK_MODE);
      if (stored !== null) return stored === 'true';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  },
  saveDarkMode: (isDark: boolean) => {
    try {
      localStorage.setItem(STORAGE_KEYS.DARK_MODE, String(isDark));
    } catch {
      // ignore
    }
  },

  resetAllData: () => {
    localStorage.removeItem(STORAGE_KEYS.TEACHER);
    localStorage.removeItem(STORAGE_KEYS.GROUPS);
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
    localStorage.removeItem(STORAGE_KEYS.PAYMENTS);
    localStorage.removeItem(STORAGE_KEYS.RESOURCES);
    localStorage.removeItem(STORAGE_KEYS.EXAMS);
    localStorage.removeItem(STORAGE_KEYS.EXAM_SCORES);
    localStorage.removeItem(STORAGE_KEYS.QUESTIONS);
    localStorage.removeItem(STORAGE_KEYS.SUBMISSIONS);
    localStorage.removeItem(STORAGE_KEYS.PENDING_DELETIONS);
    localStorage.removeItem(STORAGE_KEYS.LAST_BACKUP_DATE);
  },

  exportFullBackup: (): string => {
    const today = new Date().toISOString().split('T')[0];
    const data = {
      version: '2.0',
      exportDate: new Date().toISOString(),
      teacher: StorageService.getTeacher(),
      groups: StorageService.getGroups(),
      students: StorageService.getStudents(),
      attendance: StorageService.getAttendance(),
      payments: StorageService.getPayments(),
      questions: StorageService.getQuestions(),
      exams: StorageService.getExams(),
      scores: StorageService.getExamScores(),
      resources: StorageService.getResources(),
      submissions: StorageService.getSubmissions(),
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = `teacher-backup-${today}.json`;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    StorageService.saveLastBackupDate(today);
    return fileName;
  },

  validateBackupFile: (data: any): { valid: boolean; error?: string } => {
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'الملف ليس بتنسيق JSON صحيح.' };
    }
    if (!data.teacher && !Array.isArray(data.students) && !Array.isArray(data.groups)) {
      return { valid: false, error: 'الملف المحدد لا يحتوي على بنية بيانات صحيحة لنسخة المعلم الاحتياطية.' };
    }
    return { valid: true };
  },

  importBackupData: (data: any) => {
    if (data.teacher) StorageService.saveTeacher(data.teacher);
    if (Array.isArray(data.groups)) StorageService.saveGroups(data.groups);
    if (Array.isArray(data.students)) {
      const withTokens = data.students.map((s: any) => ({
        ...s,
        portalToken: s.portalToken || generatePortalToken(),
      }));
      StorageService.saveStudents(withTokens);
    }
    if (Array.isArray(data.attendance)) StorageService.saveAttendance(data.attendance);
    if (Array.isArray(data.payments)) StorageService.savePayments(data.payments);
    if (Array.isArray(data.questions)) StorageService.saveQuestions(data.questions);
    if (Array.isArray(data.exams)) StorageService.saveExams(data.exams);
    if (Array.isArray(data.scores)) StorageService.saveExamScores(data.scores);
    if (Array.isArray(data.resources)) StorageService.saveResources(data.resources);
    if (Array.isArray(data.submissions)) StorageService.saveSubmissions(data.submissions);
    StorageService.saveLastBackupDate(new Date().toISOString().split('T')[0]);
  },
};
