export type Gender = 'male' | 'female';

export interface TeacherProfile {
  name: string;
  gender: Gender;
  subject: string;
  phone: string;
  centerName: string;
  currency: string;
  defaultFee: number;
  avatarUrl?: string;
  bio?: string;
  welcomeMessage?: string;
  whatsappAttendanceTemplate: string;
  whatsappPaymentTemplate: string;
}

export type GroupIconType =
  | 'book'
  | 'graduation'
  | 'atom'
  | 'calculator'
  | 'globe'
  | 'award'
  | 'flame'
  | 'sparkles'
  | 'brain'
  | 'lightbulb'
  | 'trophy'
  | 'layers'
  | 'star'
  | 'target';

export type GroupIconShape = 'squircle' | 'circle' | 'rounded';

export interface Group {
  id: string;
  name: string; // e.g. "الصف الثالث الثانوي - السبت والثلاثاء"
  grade: string; // e.g. "الثالث الثانوي"
  scheduleDays: string[]; // e.g. ["السبت", "الثلاثاء"]
  scheduleTime: string; // e.g. "04:30 م"
  fee: number; // e.g. 250
  feeType: 'monthly' | 'per_session';
  color: string; // 'indigo' | 'violet' | 'emerald' | 'amber' | 'rose' | 'blue' | 'cyan' | 'orange' | 'fuchsia'
  icon?: GroupIconType;
  iconShape?: GroupIconShape;
  notes?: string;
  createdAt: string;
}

export interface Student {
  id: string; // unique internal id
  code: string; // visible unique code, e.g. "STU-1001"
  name: string;
  gender: Gender;
  groupId: string;
  studentPhone: string;
  guardianPhone: string;
  guardianName?: string;
  customFee?: number; // optional custom fee if discounted
  enrollmentDate: string;
  notes?: string;
  avatarColor?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  groupId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: AttendanceStatus;
  note?: string;
  method: 'qr' | 'manual' | 'bulk';
}

export type PaymentType = 'monthly_fee' | 'session_fee' | 'book_notes' | 'exam' | 'other';

export interface PaymentRecord {
  id: string;
  studentId: string;
  groupId: string;
  amount: number;
  date: string; // YYYY-MM-DD
  time: string;
  monthCovered?: string; // e.g. "2026-10" or "أكتوبر"
  type: PaymentType;
  paymentMethod: 'cash' | 'vodafone_cash' | 'instapay' | 'bank_transfer' | 'other';
  notes?: string;
  receiptNumber: string;
}

export interface EducationalResource {
  id: string;
  title: string;
  type: 'video' | 'pdf' | 'link' | 'exam';
  url: string;
  groupId: string; // or 'all'
  grade: string;
  description?: string;
  createdAt: string;
  fileName?: string;
  pdfData?: string; // base64 or object URL for uploaded PDFs
  questionsCount?: number;
  answerKey?: string[]; // e.g. ["أ", "ب", "ج", "د"] or ["1", "2", "3"]
}

export interface ResourceSubmission {
  id: string;
  resourceId: string;
  studentId: string;
  submittedAt: string;
  submittedFileName: string;
  submittedFileUrl?: string; // base64 / blob
  studentAnswers?: Record<number, string>; // question index -> chosen answer
  score: number;
  totalScore: number;
  feedback: Array<{
    questionNum: number;
    studentAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation?: string;
  }>;
  aiFeedbackNotes?: string;
}

export interface ExamQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
}

export interface Exam {
  id: string;
  title: string;
  groupId: string; // group id or 'all'
  date: string; // YYYY-MM-DD
  time: string; // e.g. "04:30 مساءً"
  maxScore: number;
  passingScore?: number;
  topics?: string;
  notes?: string;
  createdAt: string;
  questions?: ExamQuestion[];
  pdfUrl?: string;
  pdfData?: string;
  fileName?: string;
}

export interface StudentExamScore {
  id: string;
  examId: string;
  studentId: string;
  score: number;
  maxScore: number;
  notes?: string;
  dateGraded: string;
  answersGiven?: Record<string, number>; // questionId -> selectedOption
}
