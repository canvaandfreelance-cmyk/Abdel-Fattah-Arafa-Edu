/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  TeacherProfile,
  Group,
  Student,
  AttendanceRecord,
  PaymentRecord,
  EducationalResource,
  AttendanceStatus,
  PaymentType,
  Exam,
  StudentExamScore,
  ResourceSubmission,
} from './types';
import { StorageService } from './utils/storage';
import { Navbar, NavTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { AttendanceView } from './components/AttendanceView';
import { StudentsView } from './components/StudentsView';
import { PaymentsView } from './components/PaymentsView';
import { DefaultersView } from './components/DefaultersView';
import { GroupsView } from './components/GroupsView';
import { LessonsView } from './components/LessonsView';
import { ExamsView } from './components/ExamsView';
import { SettingsView } from './components/SettingsView';
import { StudentPortalView } from './components/StudentPortalView';
import { ScannerModal, ScannerMode } from './components/ScannerModal';
import { StudentCardModal } from './components/StudentCardModal';
import { PWAInstallButton } from './components/PWAInstallButton';

export default function App() {
  // Global States loaded from storage
  const [teacher, setTeacher] = useState<TeacherProfile>(StorageService.getTeacher);
  const [groups, setGroups] = useState<Group[]>(StorageService.getGroups);
  const [students, setStudents] = useState<Student[]>(StorageService.getStudents);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(StorageService.getAttendance);
  const [payments, setPayments] = useState<PaymentRecord[]>(StorageService.getPayments);
  const [resources, setResources] = useState<EducationalResource[]>(StorageService.getResources);
  const [exams, setExams] = useState<Exam[]>(StorageService.getExams);
  const [examScores, setExamScores] = useState<StudentExamScore[]>(StorageService.getExamScores);
  const [submissions, setSubmissions] = useState<ResourceSubmission[]>(StorageService.getSubmissions);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(StorageService.getDarkMode);

  // Navigation & Modals
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState<ScannerMode>('attendance');
  const [selectedStudentForCard, setSelectedStudentForCard] = useState<Student | null>(null);
  const [preselectedStudentForPayment, setPreselectedStudentForPayment] = useState<Student | null>(null);
  const [loggedInStudent, setLoggedInStudent] = useState<Student | null>(null);

  // Check URL parameters for student portal access (?student=STU-1001 or ?sid=stu-1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const studentCode = params.get('student');
    const studentId = params.get('sid');
    if (studentCode || studentId) {
      const found = students.find(
        (s) =>
          (studentId && s.id === studentId) ||
          (studentCode && s.code.toLowerCase() === studentCode.toLowerCase())
      );
      if (found) {
        setLoggedInStudent(found);
      }
    }
  }, [students]);

  // Sync Dark mode with DOM
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    StorageService.saveDarkMode(isDarkMode);
  }, [isDarkMode]);

  // Persist handlers
  const handleToggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleUpdateTeacher = (newTeacher: TeacherProfile) => {
    setTeacher(newTeacher);
    StorageService.saveTeacher(newTeacher);
  };

  const handleAddStudent = (data: Omit<Student, 'id' | 'code'> & { code?: string }) => {
    // Generate unique code like STU-1011
    const nextCodeNum = students.length + 1001;
    const generatedCode = data.code || `STU-${nextCodeNum}`;
    const newStudent: Student = {
      ...data,
      id: `stu-${Date.now()}`,
      code: generatedCode,
    };
    const updated = [newStudent, ...students];
    setStudents(updated);
    StorageService.saveStudents(updated);
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    const updated = students.map((s) => (s.id === updatedStudent.id ? updatedStudent : s));
    setStudents(updated);
    StorageService.saveStudents(updated);
  };

  const handleDeleteStudent = (id: string) => {
    const updatedStudents = students.filter((s) => s.id !== id);
    setStudents(updatedStudents);
    StorageService.saveStudents(updatedStudents);

    // Also clean up associated attendance and payments for this student
    const updatedAttendance = attendance.filter((a) => a.studentId !== id);
    setAttendance(updatedAttendance);
    StorageService.saveAttendance(updatedAttendance);

    const updatedPayments = payments.filter((p) => p.studentId !== id);
    setPayments(updatedPayments);
    StorageService.savePayments(updatedPayments);
  };

  const handleAddGroup = (data: Omit<Group, 'id' | 'createdAt'>) => {
    const newGroup: Group = {
      ...data,
      id: `grp-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    const updated = [...groups, newGroup];
    setGroups(updated);
    StorageService.saveGroups(updated);
  };

  const handleUpdateGroup = (updatedGroup: Group) => {
    const updated = groups.map((g) => (g.id === updatedGroup.id ? updatedGroup : g));
    setGroups(updated);
    StorageService.saveGroups(updated);
  };

  const handleDeleteGroup = (id: string, transferToGroupId?: string) => {
    const updatedGroups = groups.filter((g) => g.id !== id);
    setGroups(updatedGroups);
    StorageService.saveGroups(updatedGroups);

    // If students were assigned to this group, reassign or unassign cleanly
    const updatedStudents = students.map((s) => {
      if (s.groupId === id) {
        return {
          ...s,
          groupId: transferToGroupId || '',
        };
      }
      return s;
    });
    setStudents(updatedStudents);
    StorageService.saveStudents(updatedStudents);
  };

  const handleRecordAttendance = (
    studentId: string,
    status: AttendanceStatus,
    note?: string,
    method: 'qr' | 'manual' | 'bulk' = 'manual'
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const timeNow = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    // Check if record exists for this date
    const existingIndex = attendance.findIndex(
      (r) => r.studentId === studentId && r.date === today
    );

    let updated: AttendanceRecord[];
    if (existingIndex >= 0) {
      updated = [...attendance];
      updated[existingIndex] = {
        ...updated[existingIndex],
        status,
        note: note || updated[existingIndex].note,
        time: timeNow,
      };
    } else {
      const newRecord: AttendanceRecord = {
        id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        studentId,
        groupId: student.groupId,
        date: today,
        time: timeNow,
        status,
        note,
        method,
      };
      updated = [newRecord, ...attendance];
    }

    setAttendance(updated);
    StorageService.saveAttendance(updated);
  };

  const handleRecordPayment = (
    studentId: string,
    amount: number,
    type: PaymentType = 'monthly_fee',
    paymentMethod: 'cash' | 'vodafone_cash' | 'instapay' | 'bank_transfer' = 'cash',
    notes?: string,
    monthCovered?: string
  ): PaymentRecord => {
    const today = new Date().toISOString().split('T')[0];
    const timeNow = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    const student = students.find((s) => s.id === studentId);
    const receiptNumber = `REC-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      studentId,
      groupId: student?.groupId || '',
      amount,
      date: today,
      time: timeNow,
      monthCovered: monthCovered || 'شهر أكتوبر 2026',
      type,
      paymentMethod,
      receiptNumber,
      notes,
    };

    const updated = [newPayment, ...payments];
    setPayments(updated);
    StorageService.savePayments(updated);
    return newPayment;
  };

  const handleAddResource = (data: Omit<EducationalResource, 'id' | 'createdAt'>) => {
    const newResource: EducationalResource = {
      ...data,
      id: `res-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    const updated = [newResource, ...resources];
    setResources(updated);
    StorageService.saveResources(updated);
  };

  const handleDeleteResource = (id: string) => {
    const updated = resources.filter((r) => r.id !== id);
    setResources(updated);
    StorageService.saveResources(updated);
  };

  const handleAddExam = (data: Omit<Exam, 'id' | 'createdAt'>): Exam => {
    const newExam: Exam = {
      ...data,
      id: `exam-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    const updated = [newExam, ...exams];
    setExams(updated);
    StorageService.saveExams(updated);
    return newExam;
  };

  const handleDeleteExam = (id: string) => {
    const updated = exams.filter((e) => e.id !== id);
    setExams(updated);
    StorageService.saveExams(updated);

    const updatedScores = examScores.filter((s) => s.examId !== id);
    setExamScores(updatedScores);
    StorageService.saveExamScores(updatedScores);
  };

  const handleSaveExamScore = (newScore: StudentExamScore) => {
    const existingIndex = examScores.findIndex(
      (s) => s.examId === newScore.examId && s.studentId === newScore.studentId
    );
    let updated: StudentExamScore[];
    if (existingIndex >= 0) {
      updated = [...examScores];
      updated[existingIndex] = newScore;
    } else {
      updated = [newScore, ...examScores];
    }
    setExamScores(updated);
    StorageService.saveExamScores(updated);
  };

  const handleSubmitResourceHomework = (submission: ResourceSubmission) => {
    const updated = [submission, ...submissions.filter((s) => s.id !== submission.id)];
    setSubmissions(updated);
    StorageService.saveSubmissions(updated);
  };

  const handleReloadData = () => {
    setTeacher(StorageService.getTeacher());
    setGroups(StorageService.getGroups());
    setStudents(StorageService.getStudents());
    setAttendance(StorageService.getAttendance());
    setPayments(StorageService.getPayments());
    setResources(StorageService.getResources());
    setExams(StorageService.getExams());
    setExamScores(StorageService.getExamScores());
    setSubmissions(StorageService.getSubmissions());
  };

  // Helper to open QR scanner in a specific mode
  const handleOpenScannerWithMode = (mode: ScannerMode) => {
    setScannerMode(mode);
    setIsScannerOpen(true);
  };

  const studentForCardGroup = selectedStudentForCard
    ? groups.find((g) => g.id === selectedStudentForCard.groupId)
    : undefined;

  // Calculate unpaid students for current month
  const currentMonthStr = `شهر ${new Date().toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}`;
  const paidThisMonthStudentIds = new Set(
    payments.filter((p) => p.monthCovered === currentMonthStr).map((p) => p.studentId)
  );
  const unpaidStudentsCount = students.filter((s) => !paidThisMonthStudentIds.has(s.id)).length;

  // If a student is accessing their dedicated personal portal
  if (loggedInStudent) {
    const studentGroup = groups.find((g) => g.id === loggedInStudent.groupId);
    return (
      <StudentPortalView
        student={loggedInStudent}
        group={studentGroup}
        teacher={teacher}
        attendanceRecords={attendance}
        payments={payments}
        exams={exams}
        examScores={examScores}
        resources={resources}
        submissions={submissions}
        onSaveExamScore={handleSaveExamScore}
        onSubmitResourceHomework={handleSubmitResourceHomework}
        onExitPortal={() => {
          setLoggedInStudent(null);
          const url = new URL(window.location.href);
          url.searchParams.delete('student');
          url.searchParams.delete('sid');
          window.history.replaceState({}, '', url.pathname);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* Navigation Header */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        onOpenScanner={() => handleOpenScannerWithMode('attendance')}
        teacher={teacher}
        totalStudents={students.length}
        totalGroups={groups.length}
        totalExams={exams.length}
        unpaidCount={unpaidStudentsCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-8">
        {currentTab === 'dashboard' && (
          <DashboardView
            teacher={teacher}
            students={students}
            groups={groups}
            attendanceRecords={attendance}
            payments={payments}
            exams={exams}
            onNavigate={setCurrentTab}
            onOpenScannerWithMode={handleOpenScannerWithMode}
            onSelectStudentCard={(student) => setSelectedStudentForCard(student)}
            onOpenAddStudent={() => setCurrentTab('students')}
            onOpenAddExam={() => setCurrentTab('exams')}
          />
        )}

        {currentTab === 'attendance' && (
          <AttendanceView
            students={students}
            groups={groups}
            teacher={teacher}
            attendanceRecords={attendance}
            onRecordAttendance={handleRecordAttendance}
            onOpenScanner={() => handleOpenScannerWithMode('attendance')}
            onShowStudentCard={(student) => setSelectedStudentForCard(student)}
          />
        )}

        {currentTab === 'students' && (
          <StudentsView
            students={students}
            groups={groups}
            teacher={teacher}
            attendanceRecords={attendance}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
            onShowStudentCard={(student) => setSelectedStudentForCard(student)}
            onRecordAttendance={(id, status) => handleRecordAttendance(id, status)}
            onOpenQuickPaymentForStudent={(student) => {
              setPreselectedStudentForPayment(student);
              setCurrentTab('payments');
            }}
            onNavigateToGroups={() => setCurrentTab('groups')}
          />
        )}

        {currentTab === 'groups' && (
          <GroupsView
            groups={groups}
            students={students}
            teacher={teacher}
            onAddGroup={handleAddGroup}
            onUpdateGroup={handleUpdateGroup}
            onDeleteGroup={handleDeleteGroup}
            onNavigate={setCurrentTab}
          />
        )}

        {currentTab === 'exams' && (
          <ExamsView
            exams={exams}
            students={students}
            groups={groups}
            teacher={teacher}
            examScores={examScores}
            onAddExam={handleAddExam}
            onDeleteExam={handleDeleteExam}
            onSaveScore={handleSaveExamScore}
          />
        )}

        {currentTab === 'defaulters' && (
          <DefaultersView
            students={students}
            groups={groups}
            teacher={teacher}
            payments={payments}
            onOpenQuickPaymentForStudent={(student) => {
              setPreselectedStudentForPayment(student);
              setCurrentTab('payments');
            }}
          />
        )}

        {currentTab === 'payments' && (
          <PaymentsView
            students={students}
            groups={groups}
            teacher={teacher}
            payments={payments}
            onRecordPayment={handleRecordPayment}
            onOpenScanner={() => handleOpenScannerWithMode('payment')}
            preselectedStudent={preselectedStudentForPayment}
            onClearPreselectedStudent={() => setPreselectedStudentForPayment(null)}
          />
        )}

        {currentTab === 'lessons' && (
          <LessonsView
            resources={resources}
            groups={groups}
            teacher={teacher}
            onAddResource={handleAddResource}
            onDeleteResource={handleDeleteResource}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            teacher={teacher}
            onUpdateTeacher={handleUpdateTeacher}
            isDarkMode={isDarkMode}
            onToggleDarkMode={handleToggleDarkMode}
            onDataReloadNeeded={handleReloadData}
          />
        )}
      </main>

      {/* Global Interactive QR Code Scanner Modal */}
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        students={students}
        groups={groups}
        teacher={teacher}
        attendanceRecords={attendance}
        onRecordAttendance={(id, status, note) => handleRecordAttendance(id, status, note, 'qr')}
        onRecordPayment={handleRecordPayment}
        initialMode={scannerMode}
      />

      {/* Student QR ID Card Modal (Printable & Shareable) */}
      <StudentCardModal
        student={selectedStudentForCard}
        group={studentForCardGroup}
        teacher={teacher}
        isOpen={Boolean(selectedStudentForCard)}
        onClose={() => setSelectedStudentForCard(null)}
        onOpenPortalForStudent={(student) => {
          setSelectedStudentForCard(null);
          setLoggedInStudent(student);
        }}
      />

      {/* Footer with PWA Install Button and System Info */}
      <footer className="no-print mt-auto border-t border-slate-200 dark:border-slate-800/80 py-4 px-4 bg-white/50 dark:bg-slate-900/50 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right">
          <p>
            نظام المعلم الذكي • يعمل بدون إنترنت (Offline Mode) بنسبة 100% • ماسح وتوليد باركود QR • إشعارات واتساب
          </p>
          <div className="flex items-center gap-2">
            <PWAInstallButton />
          </div>
        </div>
      </footer>
    </div>
  );
}
