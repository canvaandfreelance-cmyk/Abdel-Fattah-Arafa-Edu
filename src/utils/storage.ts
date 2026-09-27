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
} from '../types';

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

export const StorageService = {
  getTeacher: () => getFromStorage<TeacherProfile>(STORAGE_KEYS.TEACHER, INITIAL_TEACHER),
  saveTeacher: (data: TeacherProfile) => saveToStorage(STORAGE_KEYS.TEACHER, data),

  getGroups: () => getFromStorage<Group[]>(STORAGE_KEYS.GROUPS, INITIAL_GROUPS),
  saveGroups: (data: Group[]) => saveToStorage(STORAGE_KEYS.GROUPS, data),

  getStudents: () => getFromStorage<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS),
  saveStudents: (data: Student[]) => saveToStorage(STORAGE_KEYS.STUDENTS, data),

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
  },

  exportFullBackup: () => {
    const data = {
      teacher: StorageService.getTeacher(),
      groups: StorageService.getGroups(),
      students: StorageService.getStudents(),
      attendance: StorageService.getAttendance(),
      payments: StorageService.getPayments(),
      resources: StorageService.getResources(),
      exportDate: new Date().toISOString(),
      version: '1.0',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teacher_app_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importBackup: (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.teacher) StorageService.saveTeacher(data.teacher);
      if (Array.isArray(data.groups)) StorageService.saveGroups(data.groups);
      if (Array.isArray(data.students)) StorageService.saveStudents(data.students);
      if (Array.isArray(data.attendance)) StorageService.saveAttendance(data.attendance);
      if (Array.isArray(data.payments)) StorageService.savePayments(data.payments);
      if (Array.isArray(data.resources)) StorageService.saveResources(data.resources);
      return true;
    } catch (err) {
      console.error('Import failed', err);
      return false;
    }
  },
};
