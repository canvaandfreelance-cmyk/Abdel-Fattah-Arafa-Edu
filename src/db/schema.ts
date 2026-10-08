// src/db/schema.ts
import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Users table (identifying via Firebase Auth UID)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  photoUrl: text('photo_url'),
  role: text('role').default('teacher').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Teacher profiles
export const teacherProfiles = pgTable('teacher_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  name: text('name').notNull(),
  subject: text('subject').notNull(),
  phone: text('phone'),
  email: text('email'),
  centerName: text('center_name'),
  currency: text('currency').default('ج.م').notNull(),
  gender: text('gender').default('male').notNull(),
  settings: text('settings'), // JSON string
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Groups table
export const groups = pgTable('groups', {
  id: text('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  name: text('name').notNull(),
  grade: text('grade').notNull(),
  scheduleDays: text('schedule_days').array(),
  scheduleTime: text('schedule_time'),
  fee: integer('fee').default(0).notNull(),
  feeType: text('fee_type').default('monthly').notNull(),
  color: text('color').default('indigo'),
  icon: text('icon').default('users'),
  iconShape: text('icon_shape').default('rounded'),
  notes: text('notes'),
  createdAt: text('created_at'),
});

// Students table
export const students = pgTable('students', {
  id: text('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  code: text('code').notNull(),
  portalToken: text('portal_token'),
  name: text('name').notNull(),
  gender: text('gender').default('male'),
  groupId: text('group_id').notNull(),
  studentPhone: text('student_phone'),
  guardianPhone: text('guardian_phone'),
  guardianName: text('guardian_name'),
  enrollmentDate: text('enrollment_date'),
  notes: text('notes'),
  avatarColor: text('avatar_color'),
  createdAt: text('created_at'),
});

// Attendance records table (including Homework status)
export const attendanceRecords = pgTable('attendance_records', {
  id: text('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  studentId: text('student_id').notNull(),
  groupId: text('group_id').notNull(),
  date: text('date').notNull(),
  time: text('time'),
  status: text('status').default('present').notNull(), // present, absent, late, excused
  homeworkStatus: text('homework_status').default('none'), // completed, partial, incomplete, excused, none
  homeworkNote: text('homework_note'),
  method: text('method').default('manual'), // manual, qr, bulk
  notes: text('notes'),
});

// Payments table
export const paymentRecords = pgTable('payment_records', {
  id: text('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  studentId: text('student_id').notNull(),
  groupId: text('group_id').notNull(),
  amount: integer('amount').notNull(),
  date: text('date').notNull(),
  month: text('month'),
  type: text('type').default('monthly').notNull(),
  status: text('status').default('paid').notNull(),
  receiptNumber: text('receipt_number'),
  notes: text('notes'),
});

// Question bank table (MCQ, True/False, Essay)
export const bankQuestions = pgTable('bank_questions', {
  id: text('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  subject: text('subject').notNull(),
  lesson: text('lesson').notNull(),
  grade: text('grade'),
  type: text('type').default('mcq').notNull(), // mcq, true_false, essay
  difficulty: text('difficulty').default('medium').notNull(), // easy, medium, hard
  questionText: text('question_text').notNull(),
  options: text('options').array(),
  correctAnswer: text('correct_answer').notNull(),
  explanation: text('explanation'),
  points: integer('points').default(1).notNull(),
  createdAt: text('created_at'),
});

// Exams table
export const exams = pgTable('exams', {
  id: text('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  title: text('title').notNull(),
  groupId: text('group_id').notNull(),
  date: text('date').notNull(),
  time: text('time'),
  maxScore: integer('max_score').default(50).notNull(),
  passingScore: integer('passing_score').default(25),
  topics: text('topics'),
  notes: text('notes'),
  questions: text('questions'), // JSON string of ExamQuestion[]
  createdAt: text('created_at'),
});

// Student exam scores table
export const studentExamScores = pgTable('student_exam_scores', {
  id: text('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  examId: text('exam_id').notNull(),
  studentId: text('student_id').notNull(),
  score: integer('score').notNull(),
  maxScore: integer('max_score').notNull(),
  notes: text('notes'),
  dateGraded: text('date_graded'),
  answersGiven: text('answers_given'), // JSON string
});

// Relationships
export const usersRelations = relations(users, ({ many, one }) => ({
  teacherProfile: one(teacherProfiles, {
    fields: [users.id],
    references: [teacherProfiles.userId],
  }),
  groups: many(groups),
  students: many(students),
  attendanceRecords: many(attendanceRecords),
  paymentRecords: many(paymentRecords),
  bankQuestions: many(bankQuestions),
  exams: many(exams),
  studentExamScores: many(studentExamScores),
}));
