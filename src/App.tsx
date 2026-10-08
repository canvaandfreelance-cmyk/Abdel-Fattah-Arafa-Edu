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
  BankQuestion,
  HomeworkStatus,
} from './types';
import { StorageService, generatePortalToken } from './utils/storage';
import { Navbar, NavTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { AttendanceView } from './components/AttendanceView';
import { StudentsView } from './components/StudentsView';
import { PaymentsView } from './components/PaymentsView';
import { DefaultersView } from './components/DefaultersView';
import { GroupsView } from './components/GroupsView';
import { LessonsView } from './components/LessonsView';
import { ExamsView } from './components/ExamsView';
import { QuestionBankView } from './components/QuestionBankView';
import { SettingsView } from './components/SettingsView';
import { StudentPortalView } from './components/StudentPortalView';
import { ScannerModal, ScannerMode } from './components/ScannerModal';
import { StudentCardModal } from './components/StudentCardModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DatabaseSecurityModal } from './components/DatabaseSecurityModal';

function AppContent() {
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
  const [questions, setQuestions] = useState<BankQuestion[]>(StorageService.getQuestions);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(StorageService.getDarkMode);

  // Auth & Cloud Sync
  const { currentUser, syncDataToCloud, fetchDataFromCloud } = useAuth();
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Navigation & Modals
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState<ScannerMode>('attendance');
  const [selectedStudentForCard, setSelectedStudentForCard] = useState<Student | null>(null);
  const [preselectedStudentForPayment, setPreselectedStudentForPayment] = useState<Student | null>(null);
  const [loggedInStudent, setLoggedInStudent] = useState<Student | null>(null);

  // Sync with Cloud SQL when user logs in
  useEffect(() => {
    if (!currentUser) return;

    let isMounted = true;
    const syncWithCloud = async () => {
      setIsSyncing(true);
      try {
        const cloudData = await fetchDataFromCloud();
        if (!isMounted) return;

        // Pending deletions protection: ensure locally deleted records are never brought back from cloud
        const pending = StorageService.getPendingDeletions();
        const pendingDelStudents = new Set(pending.students || []);
        const pendingDelGroups = new Set(pending.groups || []);
        const pendingDelAttendance = new Set(pending.attendance || []);
        const pendingDelPayments = new Set(pending.payments || []);
        const pendingDelQuestions = new Set(pending.questions || []);
        const pendingDelExams = new Set(pending.exams || []);
        const pendingDelScores = new Set(pending.scores || []);

        const hasPending = Boolean(
          pendingDelStudents.size > 0 ||
          pendingDelGroups.size > 0 ||
          pendingDelAttendance.size > 0 ||
          pendingDelPayments.size > 0 ||
          pendingDelQuestions.size > 0 ||
          pendingDelExams.size > 0 ||
          pendingDelScores.size > 0
        );

        if (cloudData && (cloudData.students?.length > 0 || cloudData.groups?.length > 0)) {
          if (cloudData.teacherProfile) {
            setTeacher(cloudData.teacherProfile);
            StorageService.saveTeacher(cloudData.teacherProfile);
          }
          if (cloudData.groups?.length > 0) {
            const filteredGroups = cloudData.groups.filter((g: Group) => !pendingDelGroups.has(g.id));
            setGroups(filteredGroups);
            StorageService.saveGroups(filteredGroups);
          }
          if (cloudData.students?.length > 0) {
            const filteredStudents = cloudData.students
              .filter((s: Student) => !pendingDelStudents.has(s.id))
              .map((s: Student) => ({
                ...s,
                portalToken: s.portalToken || generatePortalToken(),
              }));
            setStudents(filteredStudents);
            StorageService.saveStudents(filteredStudents);
          }
          if (cloudData.attendance?.length > 0) {
            const filteredAttendance = cloudData.attendance.filter((a: AttendanceRecord) => !pendingDelAttendance.has(a.id));
            setAttendance(filteredAttendance);
            StorageService.saveAttendance(filteredAttendance);
          }
          if (cloudData.payments?.length > 0) {
            const filteredPayments = cloudData.payments.filter((p: PaymentRecord) => !pendingDelPayments.has(p.id));
            setPayments(filteredPayments);
            StorageService.savePayments(filteredPayments);
          }
          if (cloudData.questions?.length > 0) {
            const filteredQuestions = cloudData.questions.filter((q: BankQuestion) => !pendingDelQuestions.has(q.id));
            setQuestions(filteredQuestions);
            StorageService.saveQuestions(filteredQuestions);
          }
          if (cloudData.exams?.length > 0) {
            const filteredExams = cloudData.exams.filter((e: Exam) => !pendingDelExams.has(e.id));
            setExams(filteredExams);
            StorageService.saveExams(filteredExams);
          }
          if (cloudData.scores?.length > 0) {
            const filteredScores = cloudData.scores.filter((sc: StudentExamScore) => !pendingDelScores.has(sc.id));
            setExamScores(filteredScores);
            StorageService.saveExamScores(filteredScores);
          }

          // If there were offline deletions pending, sync them to cloud and clear them once acknowledged
          if (hasPending) {
            const delSyncSuccess = await syncDataToCloud({
              deletedIds: pending,
            });
            if (delSyncSuccess) {
              StorageService.clearPendingDeletions();
            }
          }
        } else {
          // Cloud has no records yet; sync current local data to Cloud SQL
          await syncDataToCloud({
            teacher,
            groups,
            students,
            attendance,
            payments,
            questions,
            exams,
            scores: examScores,
            deletedIds: hasPending ? pending : undefined,
          });
          if (hasPending) {
            StorageService.clearPendingDeletions();
          }
        }
      } catch (err) {
        console.error('Error synchronizing with Cloud SQL:', err);
      } finally {
        if (isMounted) setIsSyncing(false);
      }
    };

    syncWithCloud();
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  const handleManualSync = async () => {
    if (!currentUser) {
      setIsSecurityModalOpen(true);
      return;
    }
    setIsSyncing(true);
    try {
      const pending = StorageService.getPendingDeletions();
      const success = await syncDataToCloud({
        teacher,
        groups,
        students,
        attendance,
        payments,
        questions,
        exams,
        scores: examScores,
        deletedIds: pending,
      });
      if (success) {
        StorageService.clearPendingDeletions();
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Check URL parameters for secure student portal access (?p=<token>)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const portalToken = params.get('p');
    if (portalToken) {
      const found = students.find((s) => s.portalToken === portalToken);
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
    // Generate unique code like STU-1011 and long random portal token
    const nextCodeNum = students.length + 1001;
    const generatedCode = data.code || `STU-${nextCodeNum}`;
    const newStudent: Student = {
      ...data,
      id: `stu-${Date.now()}`,
      code: generatedCode,
      portalToken: generatePortalToken(),
    };
    const updated = [newStudent, ...students];
    setStudents(updated);
    StorageService.saveStudents(updated);
    if (currentUser) {
      syncDataToCloud({ students: updated });
    }
  };

  const handleRegeneratePortalToken = async (studentId: string) => {
    const newToken = generatePortalToken();
    const updated = students.map((s) => (s.id === studentId ? { ...s, portalToken: newToken } : s));
    setStudents(updated);
    StorageService.saveStudents(updated);
    if (selectedStudentForCard && selectedStudentForCard.id === studentId) {
      setSelectedStudentForCard({ ...selectedStudentForCard, portalToken: newToken });
    }
    if (currentUser) {
      await syncDataToCloud({ students: updated });
    }
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    const updated = students.map((s) => (s.id === updatedStudent.id ? updatedStudent : s));
    setStudents(updated);
    StorageService.saveStudents(updated);
    if (currentUser) {
      syncDataToCloud({ students: updated });
    }
  };

  const handleDeleteStudent = (id: string) => {
    const updatedStudents = students.filter((s) => s.id !== id);
    setStudents(updatedStudents);
    StorageService.saveStudents(updatedStudents);

    // Cascade: attendance records for this student
    const delAtt = attendance.filter((a) => a.studentId === id);
    const delAttIds = delAtt.map((a) => a.id);
    const updatedAttendance = attendance.filter((a) => a.studentId !== id);
    setAttendance(updatedAttendance);
    StorageService.saveAttendance(updatedAttendance);

    // Cascade: payments for this student
    const delPay = payments.filter((p) => p.studentId === id);
    const delPayIds = delPay.map((p) => p.id);
    const updatedPayments = payments.filter((p) => p.studentId !== id);
    setPayments(updatedPayments);
    StorageService.savePayments(updatedPayments);

    // Cascade: exam scores for this student
    const delScores = examScores.filter((sc) => sc.studentId === id);
    const delScoreIds = delScores.map((sc) => sc.id);
    const updatedScores = examScores.filter((sc) => sc.studentId !== id);
    setExamScores(updatedScores);
    StorageService.saveExamScores(updatedScores);

    const pendingPayload = {
      students: [id],
      attendance: delAttIds,
      payments: delPayIds,
      scores: delScoreIds,
    };
    StorageService.addPendingDeletions(pendingPayload);

    if (currentUser) {
      syncDataToCloud({
        students: updatedStudents,
        attendance: updatedAttendance,
        payments: updatedPayments,
        scores: updatedScores,
        deletedIds: pendingPayload,
      }).then((success) => {
        if (success) StorageService.removeAcknowledgedDeletions(pendingPayload);
      });
    }
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
    if (currentUser) {
      syncDataToCloud({ groups: updated });
    }
  };

  const handleUpdateGroup = (updatedGroup: Group) => {
    const updated = groups.map((g) => (g.id === updatedGroup.id ? updatedGroup : g));
    setGroups(updated);
    StorageService.saveGroups(updated);
    if (currentUser) {
      syncDataToCloud({ groups: updated });
    }
  };

  const handleDeleteGroup = (id: string) => {
    const updatedGroups = groups.filter((g) => g.id !== id);
    setGroups(updatedGroups);
    StorageService.saveGroups(updatedGroups);

    // Cascade: delete all students belonging to this group
    const studentsInGroup = students.filter((s) => s.groupId === id);
    const studentIdsInGroup = studentsInGroup.map((s) => s.id);
    const updatedStudents = students.filter((s) => s.groupId !== id);
    setStudents(updatedStudents);
    StorageService.saveStudents(updatedStudents);

    // Cascade: delete attendance for group and its students
    const delAtt = attendance.filter((a) => a.groupId === id || studentIdsInGroup.includes(a.studentId));
    const delAttIds = delAtt.map((a) => a.id);
    const updatedAttendance = attendance.filter((a) => a.groupId !== id && !studentIdsInGroup.includes(a.studentId));
    setAttendance(updatedAttendance);
    StorageService.saveAttendance(updatedAttendance);

    // Cascade: delete payments for group and its students
    const delPay = payments.filter((p) => p.groupId === id || studentIdsInGroup.includes(p.studentId));
    const delPayIds = delPay.map((p) => p.id);
    const updatedPayments = payments.filter((p) => p.groupId !== id && !studentIdsInGroup.includes(p.studentId));
    setPayments(updatedPayments);
    StorageService.savePayments(updatedPayments);

    // Cascade: delete exams for this group
    const delExams = exams.filter((e) => e.groupId === id);
    const delExamIds = delExams.map((e) => e.id);
    const updatedExams = exams.filter((e) => e.groupId !== id);
    setExams(updatedExams);
    StorageService.saveExams(updatedExams);

    // Cascade: delete scores for those exams and students
    const delScores = examScores.filter((sc) => delExamIds.includes(sc.examId) || studentIdsInGroup.includes(sc.studentId));
    const delScoreIds = delScores.map((sc) => sc.id);
    const updatedScores = examScores.filter((sc) => !delExamIds.includes(sc.examId) && !studentIdsInGroup.includes(sc.studentId));
    setExamScores(updatedScores);
    StorageService.saveExamScores(updatedScores);

    const pendingPayload = {
      groups: [id],
      students: studentIdsInGroup,
      attendance: delAttIds,
      payments: delPayIds,
      exams: delExamIds,
      scores: delScoreIds,
    };
    StorageService.addPendingDeletions(pendingPayload);

    if (currentUser) {
      syncDataToCloud({
        groups: updatedGroups,
        students: updatedStudents,
        attendance: updatedAttendance,
        payments: updatedPayments,
        exams: updatedExams,
        scores: updatedScores,
        deletedIds: pendingPayload,
      }).then((success) => {
        if (success) StorageService.removeAcknowledgedDeletions(pendingPayload);
      });
    }
  };

  const handleRecordAttendance = (
    studentId: string,
    status: AttendanceStatus,
    note?: string,
    homeworkStatus?: HomeworkStatus,
    targetDate?: string,
    method: 'qr' | 'manual' | 'bulk' = 'manual'
  ) => {
    const today = targetDate || new Date().toISOString().split('T')[0];
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
        note: note !== undefined ? note : updated[existingIndex].note,
        homeworkStatus: homeworkStatus !== undefined ? homeworkStatus : updated[existingIndex].homeworkStatus,
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
        homeworkStatus: homeworkStatus || 'completed',
        note,
        method,
      };
      updated = [newRecord, ...attendance];
    }

    setAttendance(updated);
    StorageService.saveAttendance(updated);
    if (currentUser) {
      syncDataToCloud({ attendance: updated });
    }
  };

  const handleAddQuestion = (data: Omit<BankQuestion, 'id' | 'createdAt'>) => {
    const newQuestion: BankQuestion = {
      ...data,
      id: `q-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    const updated = [newQuestion, ...questions];
    setQuestions(updated);
    StorageService.saveQuestions(updated);
    if (currentUser) {
      syncDataToCloud({ questions: updated });
    }
  };

  const handleUpdateQuestion = (updatedQuestion: BankQuestion) => {
    const updated = questions.map((q) => (q.id === updatedQuestion.id ? updatedQuestion : q));
    setQuestions(updated);
    StorageService.saveQuestions(updated);
    if (currentUser) {
      syncDataToCloud({ questions: updated });
    }
  };

  const handleDeleteQuestion = (id: string) => {
    const updated = questions.filter((q) => q.id !== id);
    setQuestions(updated);
    StorageService.saveQuestions(updated);

    const pendingPayload = { questions: [id] };
    StorageService.addPendingDeletions(pendingPayload);

    if (currentUser) {
      syncDataToCloud({
        questions: updated,
        deletedIds: pendingPayload,
      }).then((success) => {
        if (success) StorageService.removeAcknowledgedDeletions(pendingPayload);
      });
    }
  };

  const handleCreateExamFromBank = (newExamData: Omit<Exam, 'id' | 'createdAt'>) => {
    const newExam: Exam = {
      ...newExamData,
      id: `exam-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    const updated = [newExam, ...exams];
    setExams(updated);
    StorageService.saveExams(updated);
    if (currentUser) {
      syncDataToCloud({ exams: updated });
    }
    setCurrentTab('exams');
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
    if (currentUser) {
      syncDataToCloud({ payments: updated });
    }
    return newPayment;
  };

  const handleDeletePayment = (id: string) => {
    const updated = payments.filter((p) => p.id !== id);
    setPayments(updated);
    StorageService.savePayments(updated);

    const pendingPayload = { payments: [id] };
    StorageService.addPendingDeletions(pendingPayload);

    if (currentUser) {
      syncDataToCloud({
        payments: updated,
        deletedIds: pendingPayload,
      }).then((success) => {
        if (success) StorageService.removeAcknowledgedDeletions(pendingPayload);
      });
    }
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
    if (currentUser) {
      syncDataToCloud({ exams: updated });
    }
    return newExam;
  };

  const handleDeleteExam = (id: string) => {
    const updatedExams = exams.filter((e) => e.id !== id);
    setExams(updatedExams);
    StorageService.saveExams(updatedExams);

    const delScores = examScores.filter((s) => s.examId === id);
    const delScoreIds = delScores.map((s) => s.id);
    const updatedScores = examScores.filter((s) => s.examId !== id);
    setExamScores(updatedScores);
    StorageService.saveExamScores(updatedScores);

    const pendingPayload = {
      exams: [id],
      scores: delScoreIds,
    };
    StorageService.addPendingDeletions(pendingPayload);

    if (currentUser) {
      syncDataToCloud({
        exams: updatedExams,
        scores: updatedScores,
        deletedIds: pendingPayload,
      }).then((success) => {
        if (success) StorageService.removeAcknowledgedDeletions(pendingPayload);
      });
    }
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
    if (currentUser) {
      syncDataToCloud({ scores: updated });
    }
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
    setQuestions(StorageService.getQuestions());
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
          url.searchParams.delete('p');
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
        onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
        teacher={teacher}
        totalStudents={students.length}
        totalGroups={groups.length}
        totalExams={exams.length}
        totalQuestions={questions.length}
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

        {currentTab === 'question-bank' && (
          <QuestionBankView
            questions={questions}
            groups={groups}
            teacher={teacher}
            onAddQuestion={handleAddQuestion}
            onUpdateQuestion={handleUpdateQuestion}
            onDeleteQuestion={handleDeleteQuestion}
            onCreateExamFromBank={handleCreateExamFromBank}
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
            onDeletePayment={handleDeletePayment}
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
            onSyncWithCloud={handleManualSync}
            totalStudents={students.length}
            totalGroups={groups.length}
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
        onRecordAttendance={(id, status, note, hw) =>
          handleRecordAttendance(id, status, note, hw, undefined, 'qr')
        }
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
        onRegeneratePortalToken={handleRegeneratePortalToken}
      />

      {/* Cloud SQL Database Security & Account Modal */}
      <DatabaseSecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        onManualSync={handleManualSync}
        isSyncing={isSyncing}
      />

      {/* Footer with PWA Install Button and System Info */}
      <footer className="no-print mt-auto border-t border-slate-200 dark:border-slate-800/80 py-4 px-4 bg-white/50 dark:bg-slate-900/50 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right">
          <p>
            نظام المعلم الذكي • متصل بقاعدة بيانات سحابية مشفرة (PostgreSQL) • يعمل بدون إنترنت (Offline Mode) • ماسح وتوليد باركود QR • إشعارات واتساب
          </p>
          <div className="flex items-center gap-2">
            <PWAInstallButton />
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
