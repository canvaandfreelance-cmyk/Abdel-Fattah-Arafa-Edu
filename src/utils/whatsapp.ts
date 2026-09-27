import { Student, TeacherProfile, Group } from '../types';

/**
 * Converts Eastern Arabic numerals (٠١٢٣٤٥٦٧٨٩) to standard ASCII digits (0-9)
 */
export function normalizeDigits(input: string): string {
  const arabicEasternDigits: Record<string, string> = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  };
  return input.replace(/[٠-٩]/g, (d) => arabicEasternDigits[d] || d);
}

/**
 * Cleans and standardizes phone number for WhatsApp:
 * - Normalizes Arabic numerals
 * - Removes non-digits (+, spaces, hyphens, etc.)
 * - Strips leading 00
 * - Properly handles Egyptian numbers (010, 011, 012, 015 -> 2010, 2011, 2012, 2015)
 * - Handles redundant 0 after country code (e.g., +20 010 -> 2010)
 * - Handles Saudi numbers (05x -> 9665x)
 */
export function cleanPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // 1. Normalize Eastern Arabic numerals
  let cleaned = normalizeDigits(phone.trim());
  
  // 2. Remove all non-digits (spaces, dashes, parentheses, +, etc.)
  cleaned = cleaned.replace(/\D/g, '');
  
  // 3. Strip leading international 00
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.slice(2);
  }
  
  // 4. Handle Egyptian numbers with redundant 0 after country code 20 (e.g. 2001012345678 -> 201012345678)
  if (cleaned.startsWith('2001') && cleaned.length === 13) {
    cleaned = '20' + cleaned.slice(3);
  }

  // 5. Standard Egyptian local number: 010, 011, 012, 015 (11 digits starting with 01)
  if (cleaned.startsWith('01') && cleaned.length === 11) {
    cleaned = '2' + cleaned; // Becomes 201xxxxxxxxx
  } else if (/^1[0125]\d{8}$/.test(cleaned)) {
    // Egyptian number without leading 0 (10 digits starting with 10, 11, 12, 15)
    cleaned = '20' + cleaned;
  }
  
  // 6. Saudi mobile numbers: 05xxxxxxx (10 digits starting with 05)
  if (cleaned.startsWith('05') && cleaned.length === 10) {
    cleaned = '966' + cleaned.slice(1);
  } else if (/^5\d{8}$/.test(cleaned)) {
    cleaned = '966' + cleaned;
  }
  
  return cleaned;
}

/**
 * Creates a direct WhatsApp link that reliably opens the chat on mobile & web
 */
export function buildWhatsAppUrl(rawPhone: string, message: string): string {
  const phone = cleanPhoneNumber(rawPhone);
  if (!phone) return '#';
  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
}

export function generateAttendanceWhatsAppUrl(
  student: Student,
  teacher: TeacherProfile,
  group: Group | undefined,
  status: 'present' | 'absent' | 'late' | 'excused',
  date: string,
  time: string
): string {
  const teacherTitle = teacher.gender === 'female' ? 'الأستاذة' : 'الأستاذ';
  const statusArabic =
    status === 'present'
      ? '✅ تم بحمد الله حضور الحصة'
      : status === 'late'
      ? '⚠️ حضر متأخراً عن موعد الحصة'
      : status === 'excused'
      ? 'ℹ️ غائب بعذر مسبق'
      : '❌ غائب عن الحصة اليوم';

  const message = `السلام عليكم ورحمة الله وبركاته 🌹
ولي أمر الطالب المحترم: *${student.name}*
كود الطالب: *${student.code}*
المجموعة: ${group?.name || 'مجموعة المدرس'}
المادة: *${teacher.subject}*
التاريخ: ${date} - الساعة: ${time}

إفادة الحضور:
${statusArabic}

مع تحيات: ${teacherTitle} ${teacher.name}
${teacher.centerName ? `(${teacher.centerName})` : ''}
${teacher.phone ? `للتواصل: ${teacher.phone}` : ''}`;

  return buildWhatsAppUrl(student.guardianPhone || student.studentPhone, message);
}

export function generatePaymentReceiptWhatsAppUrl(
  student: Student,
  teacher: TeacherProfile,
  group: Group | undefined,
  amount: number,
  currency: string,
  receiptNo: string,
  type: string,
  monthCovered?: string
): string {
  const teacherTitle = teacher.gender === 'female' ? 'الأستاذة' : 'الأستاذ';
  
  const typeText =
    type === 'monthly_fee'
      ? `اشتراك شهري (${monthCovered || 'الشهر الحالي'})`
      : type === 'session_fee'
      ? 'رسوم حصة'
      : type === 'book_notes'
      ? 'مذكرة وكتب دراسية'
      : 'مدفوعات دراسية';

  const message = `🧾 *إيصال سداد مصروفات دراسية*
السلام عليكم ورحمة الله وبركاته
وصلنا من الطالب/ـة: *${student.name}*
كود الطالب: *${student.code}*
المجموعة: ${group?.name || 'المجموعة الدراسية'}
المادة: *${teacher.subject}*

💵 المبلغ المسدد: *${amount} ${currency}*
📌 بند الدفع: ${typeText}
🔢 رقم الإيصال: #${receiptNo}
📅 تاريخ السداد: ${new Date().toLocaleDateString('ar-EG')}

شكراً لحرصكم والتزامكم بالتفوق والنجاح ✨
${teacherTitle} / ${teacher.name}
${teacher.centerName ? `سنتر/مدرسة: ${teacher.centerName}` : ''}`;

  return buildWhatsAppUrl(student.guardianPhone || student.studentPhone, message);
}

export function generatePaymentReminderWhatsAppUrl(
  student: Student,
  teacher: TeacherProfile,
  group: Group | undefined,
  amount: number,
  currency: string,
  monthCovered: string
): string {
  const teacherTitle = teacher.gender === 'female' ? 'الأستاذة' : 'الأستاذ';

  const message = `السلام عليكم ورحمة الله وبركاته 🌹
تحية طيبة لولي أمر الطالب/ـة: *${student.name}*
كود الطالب: *${student.code}*
المجموعة: ${group?.name || 'المجموعة الدراسية'}
المادة: *${teacher.subject}*
المعلم: ${teacherTitle} / ${teacher.name}

📌 تذكير بمصروفات الاشتراك الدراسي:
نحيطكم علماً بأن اشتراك (${monthCovered}) وقيمته *${amount} ${currency}* مستحق السداد.
يرجى التكرم بالسداد في الحصة القادمة أو عبر وسائل الدفع المعتمدة (فودافون كاش / إنستاباي).

شاكرين ومقدرين حسن تعاونكم وحرصكم الدائم على مصلحة الطالب 🌸
${teacher.centerName ? `سنتر: ${teacher.centerName}` : ''}
${teacher.phone ? `هاتف التواصل: ${teacher.phone}` : ''}`;

  return buildWhatsAppUrl(student.guardianPhone || student.studentPhone, message);
}

export function generateExamAnnouncementWhatsAppUrl(
  student: Student,
  teacher: TeacherProfile,
  group: Group | undefined,
  exam: {
    title: string;
    date: string;
    time: string;
    maxScore: number;
    topics?: string;
    notes?: string;
  }
): string {
  const teacherTitle = teacher.gender === 'female' ? 'الأستاذة' : 'الأستاذ';
  const guardianGreeting = student.guardianName
    ? `الأفاضل / ${student.guardianName}`
    : `ولي أمر الطالب/ـة: *${student.name}*`;

  const message = `السلام عليكم ورحمة الله وبركاته 🌹
تحية طيبة إلى ${guardianGreeting}
طالبنا المتميز: *${student.name}* (كود: ${student.code})
المجموعة: ${group?.name || 'مجموعة المدرس'}
المادة: *${teacher.subject}*

📢 *تنويه هام بموعد اختبار رسمي:*
📝 اسم الاختبار: *${exam.title}*
📅 الموعد: *${exam.date}* - الساعة: *${exam.time}*
🎯 الدرجة العظمى: *${exam.maxScore} درجة*
${exam.topics ? `📚 الموضوعات المقررة:\n${exam.topics}\n` : ''}${exam.notes ? `💡 ملاحظات وتعليمات:\n${exam.notes}\n` : ''}
نرجو من حضراتكم حث الطالب على الاستعداد والتركيز لتحقيق أعلى الدرجات والتفوق بإذن الله تعالى.

مع خالص التحيات والتقدير،
${teacherTitle} / ${teacher.name}
${teacher.centerName ? `سنتر: ${teacher.centerName}` : ''}
${teacher.phone ? `هاتف التواصل: ${teacher.phone}` : ''}`;

  return buildWhatsAppUrl(student.guardianPhone || student.studentPhone, message);
}

export function generateExamScoreWhatsAppUrl(
  student: Student,
  teacher: TeacherProfile,
  group: Group | undefined,
  exam: { title: string; maxScore: number; passingScore?: number },
  score: number,
  notes?: string
): string {
  const teacherTitle = teacher.gender === 'female' ? 'الأستاذة' : 'الأستاذ';
  const percentage = Math.round((score / exam.maxScore) * 100);
  const isPassed = exam.passingScore ? score >= exam.passingScore : percentage >= 50;
  const statusEmoji = isPassed ? (percentage >= 85 ? '🌟 ممتاز وتفوق باهر' : '✅ ناجح ومستوى جيد') : '⚠️ يحتاج إلى مزيد من المتابعة والاجتهاد';

  const message = `📊 *تقرير نتيجة اختبار دراسي*
السلام عليكم ورحمة الله وبركاته
تحية طيبة لولي أمر الطالب/ـة: *${student.name}* (كود: ${student.code})
المجموعة: ${group?.name || 'المجموعة'}
المادة: *${teacher.subject}*

📝 اسم الاختبار: *${exam.title}*
🎯 درجة الطالب: *${score} من ${exam.maxScore}* (${percentage}%)
📌 التقييم العام: ${statusEmoji}
${notes ? `💬 ملاحظات المعلم: ${notes}\n` : ''}
نسأل الله لأبنائنا دوام التوفيق والتميز الدائم.
${teacherTitle} / ${teacher.name}
${teacher.centerName ? `(${teacher.centerName})` : ''}`;

  return buildWhatsAppUrl(student.guardianPhone || student.studentPhone, message);
}
