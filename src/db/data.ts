// src/db/data.ts
import { db } from './index.ts';
import {
  teacherProfiles,
  groups,
  students,
  attendanceRecords,
  paymentRecords,
  bankQuestions,
  exams,
  studentExamScores,
} from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getUserFullData(userId: number) {
  try {
    const [
      teacherProfileList,
      groupsList,
      studentsList,
      attendanceList,
      paymentsList,
      questionsList,
      examsList,
      scoresList,
    ] = await Promise.all([
      db.select().from(teacherProfiles).where(eq(teacherProfiles.userId, userId)).limit(1),
      db.select().from(groups).where(eq(groups.userId, userId)),
      db.select().from(students).where(eq(students.userId, userId)),
      db.select().from(attendanceRecords).where(eq(attendanceRecords.userId, userId)),
      db.select().from(paymentRecords).where(eq(paymentRecords.userId, userId)),
      db.select().from(bankQuestions).where(eq(bankQuestions.userId, userId)),
      db.select().from(exams).where(eq(exams.userId, userId)),
      db.select().from(studentExamScores).where(eq(studentExamScores.userId, userId)),
    ]);

    return {
      teacherProfile: teacherProfileList[0] || null,
      groups: groupsList,
      students: studentsList,
      attendance: attendanceList,
      payments: paymentsList,
      questions: questionsList,
      exams: examsList,
      scores: scoresList,
    };
  } catch (error) {
    console.error('Failed to get user data from Cloud SQL:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function saveUserTeacherProfile(userId: number, profileData: any) {
  try {
    const existing = await db
      .select()
      .from(teacherProfiles)
      .where(eq(teacherProfiles.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      const updated = await db
        .update(teacherProfiles)
        .set({
          name: profileData.name || '',
          subject: profileData.subject || '',
          phone: profileData.phone || '',
          email: profileData.email || '',
          centerName: profileData.centerName || '',
          currency: profileData.currency || 'ج.م',
          gender: profileData.gender || 'male',
          settings: profileData.settings ? JSON.stringify(profileData.settings) : null,
          updatedAt: new Date(),
        })
        .where(eq(teacherProfiles.userId, userId))
        .returning();
      return updated[0];
    } else {
      const inserted = await db
        .insert(teacherProfiles)
        .values({
          userId,
          name: profileData.name || '',
          subject: profileData.subject || '',
          phone: profileData.phone || '',
          email: profileData.email || '',
          centerName: profileData.centerName || '',
          currency: profileData.currency || 'ج.م',
          gender: profileData.gender || 'male',
          settings: profileData.settings ? JSON.stringify(profileData.settings) : null,
        })
        .returning();
      return inserted[0];
    }
  } catch (error) {
    console.error('saveUserTeacherProfile error:', error);
    throw new Error('Database operation failed.', { cause: error });
  }
}

export async function syncUserData(userId: number, payload: any) {
  try {
    // 1. Teacher profile
    if (payload.teacher) {
      await saveUserTeacherProfile(userId, payload.teacher);
    }

    // 2. Groups
    if (Array.isArray(payload.groups) && payload.groups.length > 0) {
      for (const g of payload.groups) {
        await db
          .insert(groups)
          .values({
            id: g.id,
            userId,
            name: g.name,
            grade: g.grade,
            scheduleDays: g.scheduleDays || [],
            scheduleTime: g.scheduleTime || '',
            fee: g.fee || 0,
            feeType: g.feeType || 'monthly',
            color: g.color || 'indigo',
            icon: g.icon || 'users',
            iconShape: g.iconShape || 'rounded',
            notes: g.notes || '',
            createdAt: g.createdAt || '',
          })
          .onConflictDoUpdate({
            target: groups.id,
            set: {
              name: g.name,
              grade: g.grade,
              scheduleDays: g.scheduleDays || [],
              scheduleTime: g.scheduleTime || '',
              fee: g.fee || 0,
              feeType: g.feeType || 'monthly',
              color: g.color || 'indigo',
              icon: g.icon || 'users',
              iconShape: g.iconShape || 'rounded',
              notes: g.notes || '',
            },
          });
      }
    }

    // 3. Students
    if (Array.isArray(payload.students) && payload.students.length > 0) {
      for (const s of payload.students) {
        await db
          .insert(students)
          .values({
            id: s.id,
            userId,
            code: s.code,
            name: s.name,
            gender: s.gender || 'male',
            groupId: s.groupId,
            studentPhone: s.studentPhone || '',
            guardianPhone: s.guardianPhone || '',
            guardianName: s.guardianName || '',
            enrollmentDate: s.enrollmentDate || '',
            notes: s.notes || '',
            avatarColor: s.avatarColor || '',
            createdAt: s.createdAt || '',
          })
          .onConflictDoUpdate({
            target: students.id,
            set: {
              code: s.code,
              name: s.name,
              gender: s.gender || 'male',
              groupId: s.groupId,
              studentPhone: s.studentPhone || '',
              guardianPhone: s.guardianPhone || '',
              guardianName: s.guardianName || '',
              enrollmentDate: s.enrollmentDate || '',
              notes: s.notes || '',
              avatarColor: s.avatarColor || '',
            },
          });
      }
    }

    // 4. Attendance
    if (Array.isArray(payload.attendance) && payload.attendance.length > 0) {
      for (const a of payload.attendance) {
        await db
          .insert(attendanceRecords)
          .values({
            id: a.id,
            userId,
            studentId: a.studentId,
            groupId: a.groupId,
            date: a.date,
            time: a.time || '',
            status: a.status || 'present',
            homeworkStatus: a.homeworkStatus || 'none',
            homeworkNote: a.homeworkNote || '',
            method: a.method || 'manual',
            notes: a.notes || '',
          })
          .onConflictDoUpdate({
            target: attendanceRecords.id,
            set: {
              status: a.status || 'present',
              homeworkStatus: a.homeworkStatus || 'none',
              homeworkNote: a.homeworkNote || '',
              notes: a.notes || '',
            },
          });
      }
    }

    // 5. Payments
    if (Array.isArray(payload.payments) && payload.payments.length > 0) {
      for (const p of payload.payments) {
        await db
          .insert(paymentRecords)
          .values({
            id: p.id,
            userId,
            studentId: p.studentId,
            groupId: p.groupId,
            amount: p.amount || 0,
            date: p.date,
            month: p.month || '',
            type: p.type || 'monthly',
            status: p.status || 'paid',
            receiptNumber: p.receiptNumber || '',
            notes: p.notes || '',
          })
          .onConflictDoUpdate({
            target: paymentRecords.id,
            set: {
              amount: p.amount || 0,
              date: p.date,
              status: p.status || 'paid',
              notes: p.notes || '',
            },
          });
      }
    }

    // 6. Questions
    if (Array.isArray(payload.questions) && payload.questions.length > 0) {
      for (const q of payload.questions) {
        await db
          .insert(bankQuestions)
          .values({
            id: q.id,
            userId,
            subject: q.subject || 'الفيزياء',
            lesson: q.lesson || 'عام',
            grade: q.grade || '',
            type: q.type || 'mcq',
            difficulty: q.difficulty || 'medium',
            questionText: q.questionText,
            options: q.options || [],
            correctAnswer: String(q.correctAnswer),
            explanation: q.explanation || '',
            points: q.points || 1,
            createdAt: q.createdAt || '',
          })
          .onConflictDoUpdate({
            target: bankQuestions.id,
            set: {
              subject: q.subject || 'الفيزياء',
              lesson: q.lesson || 'عام',
              grade: q.grade || '',
              type: q.type || 'mcq',
              difficulty: q.difficulty || 'medium',
              questionText: q.questionText,
              options: q.options || [],
              correctAnswer: String(q.correctAnswer),
              explanation: q.explanation || '',
              points: q.points || 1,
            },
          });
      }
    }

    // 7. Exams
    if (Array.isArray(payload.exams) && payload.exams.length > 0) {
      for (const e of payload.exams) {
        await db
          .insert(exams)
          .values({
            id: e.id,
            userId,
            title: e.title,
            groupId: e.groupId,
            date: e.date,
            time: e.time || '',
            maxScore: e.maxScore || 50,
            passingScore: e.passingScore || 25,
            topics: e.topics || '',
            notes: e.notes || '',
            questions: e.questions ? JSON.stringify(e.questions) : null,
            createdAt: e.createdAt || '',
          })
          .onConflictDoUpdate({
            target: exams.id,
            set: {
              title: e.title,
              groupId: e.groupId,
              date: e.date,
              time: e.time || '',
              maxScore: e.maxScore || 50,
              passingScore: e.passingScore || 25,
              topics: e.topics || '',
              notes: e.notes || '',
              questions: e.questions ? JSON.stringify(e.questions) : null,
            },
          });
      }
    }

    // 8. Exam scores
    if (Array.isArray(payload.scores) && payload.scores.length > 0) {
      for (const sc of payload.scores) {
        await db
          .insert(studentExamScores)
          .values({
            id: sc.id,
            userId,
            examId: sc.examId,
            studentId: sc.studentId,
            score: sc.score || 0,
            maxScore: sc.maxScore || 50,
            notes: sc.notes || '',
            dateGraded: sc.dateGraded || '',
            answersGiven: sc.answersGiven ? JSON.stringify(sc.answersGiven) : null,
          })
          .onConflictDoUpdate({
            target: studentExamScores.id,
            set: {
              score: sc.score || 0,
              notes: sc.notes || '',
              dateGraded: sc.dateGraded || '',
            },
          });
      }
    }

    return { success: true };
  } catch (error) {
    console.error('syncUserData error:', error);
    throw new Error('Sync operation failed.', { cause: error });
  }
}
