import { Student, Group, TeacherProfile, AttendanceRecord, PaymentRecord, BankQuestion } from '../types';

export interface PDFExportOptions {
  title: string;
  subtitle?: string;
  teacher: TeacherProfile;
  dateStr?: string;
}

/**
 * Generates an official, printable HTML document with RTL, high-resolution styling,
 * center and teacher headers, clean grid tables, summary metrics, and print triggers.
 */
export function printHtmlReport(title: string, contentHtml: string, teacher: TeacherProfile) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    // Fallback: render in an invisible iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(getReportTemplate(title, contentHtml, teacher));
      doc.close();
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }
    return;
  }

  printWindow.document.open();
  printWindow.document.write(getReportTemplate(title, contentHtml, teacher));
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 400);
}

function getReportTemplate(title: string, bodyContent: string, teacher: TeacherProfile): string {
  const teacherTitle = teacher.gender === 'female' ? 'الأستاذة' : 'الأستاذ';
  const currentDate = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const currentTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
      direction: rtl;
      background-color: #ffffff;
      color: #0f172a;
      padding: 24px;
      font-size: 13px;
      line-height: 1.5;
    }

    .report-header {
      border-bottom: 2px solid #4338ca;
      padding-bottom: 16px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-left, .header-right {
      display: flex;
      flex-direction: column;
    }

    .brand-title {
      font-size: 20px;
      font-weight: 900;
      color: #312e81;
    }

    .brand-sub {
      font-size: 13px;
      color: #4b5563;
      margin-top: 2px;
    }

    .meta-tag {
      font-size: 11px;
      color: #6b7280;
      margin-top: 4px;
    }

    .document-badge {
      background-color: #e0e7ff;
      color: #3730a3;
      font-weight: 700;
      font-size: 14px;
      padding: 6px 14px;
      border-radius: 9999px;
      text-align: center;
      display: inline-block;
      margin-bottom: 6px;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }

    .metric-card {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 10px 14px;
      background: #f8fafc;
    }

    .metric-label {
      font-size: 11px;
      color: #64748b;
      font-weight: 600;
    }

    .metric-val {
      font-size: 18px;
      font-weight: 800;
      color: #1e293b;
      margin-top: 2px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 14px;
      margin-bottom: 20px;
    }

    th {
      background-color: #312e81;
      color: #ffffff;
      font-weight: 700;
      padding: 10px 12px;
      text-align: right;
      font-size: 12px;
    }

    td {
      padding: 9px 12px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 12px;
      color: #1e293b;
    }

    tr:nth-child(even) td {
      background-color: #f8fafc;
    }

    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
    }

    .badge-present { background-color: #dcfce7; color: #15803d; }
    .badge-absent { background-color: #fee2e2; color: #b91c1c; }
    .badge-late { background-color: #fef3c7; color: #b45309; }
    .badge-excused { background-color: #e0e7ff; color: #4338ca; }
    .badge-paid { background-color: #dcfce7; color: #15803d; }
    .badge-unpaid { background-color: #fee2e2; color: #b91c1c; }

    .footer {
      margin-top: 30px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      color: #64748b;
      font-size: 11px;
    }

    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="report-header">
    <div class="header-right">
      <div class="brand-title">${teacher.centerName || 'المنظومة التعليمية'}</div>
      <div class="brand-sub">مادة: ${teacher.subject} • ${teacherTitle} / ${teacher.name}</div>
      <div class="meta-tag">هاتف التواصل: ${teacher.phone}</div>
    </div>
    <div class="header-left" style="text-align: left;">
      <span class="document-badge">${title}</span>
      <div class="meta-tag">تاريخ الطباعة: ${currentDate} (${currentTime})</div>
    </div>
  </div>

  ${bodyContent}

  <div class="footer">
    <span>نظام المعلم الذكي • تم التصدير تلقائياً</span>
    <span>توقيع المعلم / الإدارة: ................................</span>
  </div>
</body>
</html>`;
}

/**
 * Export Attendance Sheet to PDF / Print
 */
export function exportAttendanceToPDF(
  students: Student[],
  groups: Group[],
  attendanceRecords: AttendanceRecord[],
  teacher: TeacherProfile,
  date: string,
  selectedGroupId: string = 'all'
) {
  const groupObj = groups.find((g) => g.id === selectedGroupId);
  const groupTitle = groupObj ? groupObj.name : 'جميع المجموعات الدراسية';

  const relevantStudents = students.filter(
    (s) => selectedGroupId === 'all' || s.groupId === selectedGroupId
  );

  const dateRecords = attendanceRecords.filter((r) => r.date === date);

  let presentCount = 0;
  let lateCount = 0;
  let absentCount = 0;
  let excusedCount = 0;

  const rowsHtml = relevantStudents
    .map((stu, idx) => {
      const rec = dateRecords.find((r) => r.studentId === stu.id);
      const studentGroup = groups.find((g) => g.id === stu.groupId);

      let statusBadge = '<span class="badge badge-unpaid">غير مسجل</span>';
      if (rec) {
        if (rec.status === 'present') {
          presentCount++;
          statusBadge = '<span class="badge badge-present">حاضر</span>';
        } else if (rec.status === 'late') {
          lateCount++;
          statusBadge = '<span class="badge badge-late">متأخر</span>';
        } else if (rec.status === 'absent') {
          absentCount++;
          statusBadge = '<span class="badge badge-absent">غائب</span>';
        } else if (rec.status === 'excused') {
          excusedCount++;
          statusBadge = '<span class="badge badge-excused">معتذر</span>';
        }
      }

      return `<tr>
        <td style="font-weight: 700; width: 35px;">${idx + 1}</td>
        <td style="font-family: monospace; font-weight: 700; color: #4338ca;">${stu.code}</td>
        <td style="font-weight: 700;">${stu.name}</td>
        <td>${studentGroup?.name || 'عامة'}</td>
        <td dir="ltr" style="text-align: right;">${stu.studentPhone || stu.guardianPhone || '-'}</td>
        <td>${statusBadge}</td>
        <td style="color: #64748b; font-size: 11px;">${rec?.time || '-'}</td>
        <td>${rec?.note || ''}</td>
      </tr>`;
    })
    .join('');

  const bodyHtml = `
    <div class="summary-grid">
      <div class="metric-card">
        <div class="metric-label">إجمالي الطلاب</div>
        <div class="metric-val">${relevantStudents.length}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">حاضر (شامل التأخير)</div>
        <div class="metric-val" style="color: #15803d;">${presentCount + lateCount}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">غائب</div>
        <div class="metric-val" style="color: #b91c1c;">${absentCount}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">تاريخ الحصة والمجموعة</div>
        <div class="metric-val" style="font-size: 14px;">${date} • ${groupTitle}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>كود الطالب</th>
          <th>اسم الطالب</th>
          <th>المجموعة</th>
          <th>رقم الهاتف</th>
          <th>حالة الحضور</th>
          <th>وقت التسجيل</th>
          <th>ملاحظات</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  `;

  printHtmlReport(`كشف_حضور_${date}_${groupTitle.replace(/\s+/g, '_')}`, bodyHtml, teacher);
}

/**
 * Export Payments & Defaulters Sheet to PDF / Print
 */
export function exportPaymentsToPDF(
  students: Student[],
  groups: Group[],
  payments: PaymentRecord[],
  teacher: TeacherProfile,
  filterType: 'all' | 'unpaid' | 'history',
  monthCovered: string = 'شهر أكتوبر 2026'
) {
  const currentMonthPayments = payments.filter(
    (p) => !monthCovered || p.monthCovered === monthCovered || p.date.startsWith(monthCovered.slice(0, 7))
  );

  const totalCollected = currentMonthPayments.reduce((acc, curr) => acc + curr.amount, 0);

  const paidStudentIds = new Set(
    payments.filter((p) => p.monthCovered === monthCovered).map((p) => p.studentId)
  );

  const unpaidStudents = students.filter((s) => !paidStudentIds.has(s.id));

  let reportTitle = `كشف المتحصلات والمدفوعات - ${monthCovered}`;
  let tableHeader = `
    <tr>
      <th>#</th>
      <th>رقم الإيصال</th>
      <th>كود الطالب</th>
      <th>اسم الطالب</th>
      <th>المجموعة</th>
      <th>المبلغ المدفوع</th>
      <th>طريقة الدفع</th>
      <th>تاريخ السداد</th>
      <th>ملاحظات</th>
    </tr>
  `;

  let rowsHtml = '';

  if (filterType === 'unpaid') {
    reportTitle = `كشف الطلاب المتأخرين عن السداد - ${monthCovered}`;
    tableHeader = `
      <tr>
        <th>#</th>
        <th>كود الطالب</th>
        <th>اسم الطالب</th>
        <th>المجموعة</th>
        <th>المصروفات المستحقة</th>
        <th>هاتف الطالب</th>
        <th>هاتف ولي الأمر</th>
        <th>حالة السداد</th>
      </tr>
    `;

    rowsHtml = unpaidStudents
      .map((s, idx) => {
        const grp = groups.find((g) => g.id === s.groupId);
        const requiredFee = s.customFee ?? grp?.fee ?? teacher.defaultFee;

        return `<tr>
          <td style="font-weight: 700; width: 35px;">${idx + 1}</td>
          <td style="font-family: monospace; font-weight: 700; color: #b91c1c;">${s.code}</td>
          <td style="font-weight: 700;">${s.name}</td>
          <td>${grp?.name || 'عامة'}</td>
          <td style="font-weight: 800; color: #b91c1c;">${requiredFee} ${teacher.currency}</td>
          <td dir="ltr" style="text-align: right;">${s.studentPhone}</td>
          <td dir="ltr" style="text-align: right;">${s.guardianPhone}</td>
          <td><span class="badge badge-unpaid">لم يسدد</span></td>
        </tr>`;
      })
      .join('');
  } else {
    rowsHtml = currentMonthPayments
      .map((p, idx) => {
        const stu = students.find((s) => s.id === p.studentId);
        const grp = groups.find((g) => g.id === p.groupId);

        return `<tr>
          <td style="font-weight: 700; width: 35px;">${idx + 1}</td>
          <td style="font-family: monospace; font-weight: 700; color: #4338ca;">${p.receiptNumber}</td>
          <td style="font-family: monospace; font-weight: 700;">${stu?.code || '-'}</td>
          <td style="font-weight: 700;">${stu?.name || 'طالب'}</td>
          <td>${grp?.name || '-'}</td>
          <td style="font-weight: 800; color: #15803d;">${p.amount} ${teacher.currency}</td>
          <td>${p.paymentMethod}</td>
          <td>${p.date} (${p.time})</td>
          <td>${p.notes || ''}</td>
        </tr>`;
      })
      .join('');
  }

  const bodyHtml = `
    <div class="summary-grid">
      <div class="metric-card">
        <div class="metric-label">إجمالي الطلاب</div>
        <div class="metric-val">${students.length}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">المسددين للشهر</div>
        <div class="metric-val" style="color: #15803d;">${paidStudentIds.size} طالب</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">المتأخرين عن السداد</div>
        <div class="metric-val" style="color: #b91c1c;">${unpaidStudents.length} طالب</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">إجمالي المتحصلات</div>
        <div class="metric-val" style="color: #4338ca;">${totalCollected.toLocaleString()} ${teacher.currency}</div>
      </div>
    </div>

    <table>
      <thead>
        ${tableHeader}
      </thead>
      <tbody>
        ${rowsHtml || '<tr><td colspan="9" style="text-align: center; padding: 20px;">لا توجد سجلات مطابقة</td></tr>'}
      </tbody>
    </table>
  `;

  printHtmlReport(reportTitle.replace(/\s+/g, '_'), bodyHtml, teacher);
}

/**
 * Exports a beautifully structured, printable Exam paper with student name fields,
 * questions formatted clearly with lettered options, marks, and optional model answers.
 */
export function exportQuizToPDF(
  examTitle: string,
  questions: BankQuestion[],
  teacher: TeacherProfile,
  groupName?: string,
  includeAnswerKey: boolean = false
) {
  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);
  const arabicLetters = ['أ', 'ب', 'ج', 'د', 'هـ'];

  const questionsHtml = questions
    .map((q, idx) => {
      let optionsHtml = '';
      if (q.type === 'mcq' && q.options?.length > 0) {
        optionsHtml = `
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 10px; padding-right: 15px;">
            ${q.options
              .map(
                (opt, oIdx) => `
              <div style="display: flex; align-items: center; gap: 8px; font-size: 13.5px;">
                <span style="display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border: 1.5px solid #64748b; border-radius: 50%; font-size: 11px; font-weight: bold; color: #1e293b;">
                  ${arabicLetters[oIdx] || oIdx + 1}
                </span>
                <span>${opt}</span>
              </div>
            `
              )
              .join('')}
          </div>
        `;
      } else if (q.type === 'true_false') {
        optionsHtml = `
          <div style="display: flex; gap: 30px; margin-top: 10px; padding-right: 15px;">
            <div style="display: flex; align-items: center; gap: 8px; font-size: 13.5px;">
              <span style="width: 18px; height: 18px; border: 1.5px solid #64748b; border-radius: 4px; display: inline-block;"></span>
              <span>( ) صواب</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; font-size: 13.5px;">
              <span style="width: 18px; height: 18px; border: 1.5px solid #64748b; border-radius: 4px; display: inline-block;"></span>
              <span>( ) خطأ</span>
            </div>
          </div>
        `;
      } else {
        optionsHtml = `
          <div style="margin-top: 14px; padding-right: 15px;">
            <div style="font-size: 11.5px; color: #64748b; margin-bottom: 6px; font-weight: bold;">مكان كتابة الإجابة المقالية:</div>
            <div style="border-bottom: 1.5px dotted #94a3b8; height: 26px;"></div>
            <div style="border-bottom: 1.5px dotted #94a3b8; height: 26px;"></div>
            <div style="border-bottom: 1.5px dotted #94a3b8; height: 26px;"></div>
            <div style="border-bottom: 1.5px dotted #94a3b8; height: 26px;"></div>
          </div>
        `;
      }

      return `
        <div style="margin-bottom: 22px; padding: 14px 16px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; page-break-inside: avoid;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
            <div style="font-size: 14.5px; font-weight: 700; color: #0f172a; line-height: 1.6;">
              <span style="color: #4338ca; margin-left: 6px;">السؤال (${idx + 1}):</span>
              ${q.questionText}
            </div>
            <div style="font-size: 11px; font-weight: 800; background: #eef2ff; color: #4338ca; padding: 3px 10px; border-radius: 20px; white-space: nowrap;">
              [ ${q.points || 1} ${q.points === 1 ? 'درجة' : 'درجات'} ]
            </div>
          </div>
          ${optionsHtml}
        </div>
      `;
    })
    .join('');

  let answerKeyHtml = '';
  if (includeAnswerKey) {
    answerKeyHtml = `
      <div style="margin-top: 35px; padding: 20px; background: #f8fafc; border: 2px dashed #94a3b8; border-radius: 14px; page-break-before: always;">
        <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #1e293b; font-weight: 800; text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
          🔑 نموذج الإجابة الاسترشادي وتوزيع الدرجات
        </h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background: #e2e8f0;">
              <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-size: 12px;">رقم السؤال</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-size: 12px;">الإجابة الصحيحة</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-size: 12px;">الشرح والتوضيح</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-size: 12px;">الدرجة</th>
            </tr>
          </thead>
          <tbody>
            ${questions
              .map((q, idx) => {
                let ansText = '';
                if (q.type === 'mcq' && typeof q.correctAnswer === 'number') {
                  const letter = arabicLetters[q.correctAnswer] || q.correctAnswer + 1;
                  ansText = `(${letter}) ${q.options[q.correctAnswer] || ''}`;
                } else {
                  ansText = String(q.correctAnswer);
                }
                return `
                  <tr>
                    <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">${idx + 1}</td>
                    <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: 700; color: #16a34a;">${ansText}</td>
                    <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 11.5px; color: #475569;">${q.explanation || '-'}</td>
                    <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">${q.points || 1}</td>
                  </tr>
                `;
              })
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  const bodyHtml = `
    <!-- Exam Header with Student Name & Group -->
    <div style="background: #f1f5f9; padding: 14px 18px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #cbd5e1; display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 15px; font-size: 13px;">
      <div><strong>اسم الطالب / الطالبة:</strong> ............................................................</div>
      <div><strong>المجموعة:</strong> ${groupName || 'عام'}</div>
      <div><strong>الدرجة الكلية:</strong> ( / ${totalPoints})</div>
    </div>

    <!-- Exam Sub-bar -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; font-size: 13px; color: #475569;">
      <span><strong>المادة:</strong> ${teacher.subject}</span>
      <span><strong>عدد الأسئلة:</strong> ${questions.length} أسئلة</span>
      <span><strong>زمن الإجابة المقترح:</strong> ${Math.max(20, questions.length * 3)} دقيقة</span>
    </div>

    <!-- Questions -->
    <div>
      ${questionsHtml}
    </div>

    ${answerKeyHtml}
  `;

  printHtmlReport(examTitle.replace(/\s+/g, '_'), bodyHtml, teacher);
}

