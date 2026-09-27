import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Student,
  Group,
  TeacherProfile,
  AttendanceRecord,
  PaymentRecord,
  AttendanceStatus,
} from '../types';
import {
  X,
  Camera,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  UserCheck,
  Search,
  Volume2,
  RefreshCw,
  Send,
  Sparkles,
  ArrowRight,
  Info,
  Upload,
  Image as ImageIcon,
  Power,
  Play,
  Square,
  Zap,
  History,
} from 'lucide-react';
import { sounds } from '../utils/audio';
import {
  generateAttendanceWhatsAppUrl,
  generatePaymentReceiptWhatsAppUrl,
} from '../utils/whatsapp';
import confetti from 'canvas-confetti';

export type ScannerMode = 'attendance' | 'payment' | 'lookup';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  groups: Group[];
  teacher: TeacherProfile;
  attendanceRecords: AttendanceRecord[];
  onRecordAttendance: (studentId: string, status: AttendanceStatus, note?: string) => void;
  onRecordPayment: (
    studentId: string,
    amount: number,
    type: 'monthly_fee' | 'session_fee' | 'book_notes' | 'exam',
    method: 'cash' | 'vodafone_cash' | 'instapay' | 'bank_transfer',
    notes?: string
  ) => PaymentRecord | void;
  initialMode?: ScannerMode;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({
  isOpen,
  onClose,
  students,
  groups,
  teacher,
  attendanceRecords,
  onRecordAttendance,
  onRecordPayment,
  initialMode = 'attendance',
}) => {
  const [mode, setMode] = useState<ScannerMode>(initialMode);
  const [cameraError, setCameraError] = useState<string | null>(null);
  // Camera active and scanning enabled state (User requested toggle button to activate/deactivate scanner)
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isScanningEnabled, setIsScanningEnabled] = useState(true);

  // Scanned history session in modal for rapid attendance
  const [sessionScannedList, setSessionScannedList] = useState<
    Array<{
      id: string;
      studentName: string;
      studentCode: string;
      groupName: string;
      status: 'new' | 'already';
      time: string;
    }>
  >([]);

  const [scannedStudent, setScannedStudent] = useState<Student | null>(null);
  const [scanResultFeedback, setScanResultFeedback] = useState<{
    type: 'success' | 'warning' | 'info';
    title: string;
    message: string;
    receipt?: PaymentRecord;
  } | null>(null);

  // Cooldown tracker to prevent duplicate reads of the exact same QR within 2 seconds
  const lastScannedTimeRef = useRef<{ [code: string]: number }>({});

  // Manual code input or search
  const [searchQuery, setSearchQuery] = useState('');

  // Payment form state
  const [payAmount, setPayAmount] = useState<number>(teacher.defaultFee || 250);
  const [payType, setPayType] = useState<'monthly_fee' | 'session_fee' | 'book_notes' | 'exam'>('monthly_fee');
  const [payMethod, setPayMethod] = useState<'cash' | 'vodafone_cash' | 'instapay' | 'bank_transfer'>('cash');
  const [payNotes, setPayNotes] = useState('');

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-reader-container';

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScannedStudent(null);
      setScanResultFeedback(null);
      setSearchQuery('');
      return;
    }

    // Auto start camera if supported
    const timer = setTimeout(() => {
      startCamera();
    }, 300);

    return () => {
      clearTimeout(timer);
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerContainerId);
      }

      // Check available cameras
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        setCameraError('لم يتم العثور على كاميرا في هذا الجهاز.');
        return;
      }

      // Prefer rear/environment camera
      const backCamera = devices.find(
        (d) =>
          d.label.toLowerCase().includes('back') ||
          d.label.toLowerCase().includes('rear') ||
          d.label.toLowerCase().includes('خلفية')
      );
      const cameraId = backCamera ? backCamera.id : devices[0].id;

      await html5QrCodeRef.current.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleDecodedText(decodedText);
        },
        () => {
          // ignore scan frame errors
        }
      );
      setIsCameraActive(true);
    } catch (err: unknown) {
      console.warn('Camera start issue:', err);
      setCameraError('تعذر الوصول إلى الكاميرا أو تم رفض الإذن. يمكنك استخدام البحث أو إدخال الكود يدوياً.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Stop camera error', err);
      }
    }
    setIsCameraActive(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerContainerId);
      }
      const decodedText = await html5QrCodeRef.current.scanFile(file, true);
      handleDecodedText(decodedText);
    } catch (err) {
      sounds.playWarning();
      setScanResultFeedback({
        type: 'warning',
        title: 'لم يتم العثور على باركود QR في الصورة',
        message: 'يرجى التأكد من اختيار صورة واضحة تحتوي على رمز QR الخاص بالطالب.',
      });
    }
  };

  const parseCode = (raw: string): { studentId?: string; code?: string } => {
    const trimmed = raw.trim();
    // 1. Check if URL containing parameters (e.g., student portal QR)
    if (trimmed.includes('?') && (trimmed.includes('student=') || trimmed.includes('sid='))) {
      try {
        const url = new URL(trimmed, window.location.origin);
        const sid = url.searchParams.get('sid') || undefined;
        const student = url.searchParams.get('student') || undefined;
        return { studentId: sid, code: student };
      } catch {
        const matchSid = trimmed.match(/[?&]sid=([^&#]+)/);
        const matchCode = trimmed.match(/[?&]student=([^&#]+)/);
        return {
          studentId: matchSid ? decodeURIComponent(matchSid[1]) : undefined,
          code: matchCode ? decodeURIComponent(matchCode[1]) : undefined,
        };
      }
    }

    // 2. Check format: TEACHER_APP:STUDENT_ID:{id}|CODE:{code}
    if (trimmed.includes('TEACHER_APP:STUDENT_ID:')) {
      const matchId = trimmed.match(/STUDENT_ID:([^|]+)/);
      const matchCode = trimmed.match(/CODE:([^|]+)/);
      return {
        studentId: matchId ? matchId[1] : undefined,
        code: matchCode ? matchCode[1] : undefined,
      };
    }

    // 3. Direct code or ID
    return { code: trimmed };
  };

  const isScanningEnabledRef = useRef(true);
  useEffect(() => {
    isScanningEnabledRef.current = isScanningEnabled;
  }, [isScanningEnabled]);

  const handleDecodedText = (decodedText: string) => {
    // If scanning is paused by teacher, ignore scanned frames
    if (!isScanningEnabledRef.current) {
      return;
    }

    const { studentId, code } = parseCode(decodedText);
    const identifier = studentId || code || decodedText;

    // Cooldown check: ignore duplicate reads of same code within 2.5 seconds
    const now = Date.now();
    if (lastScannedTimeRef.current[identifier] && now - lastScannedTimeRef.current[identifier] < 2500) {
      return;
    }
    lastScannedTimeRef.current[identifier] = now;

    const student = students.find(
      (s) => (studentId && s.id === studentId) || (code && s.code.toLowerCase() === code.toLowerCase())
    );

    if (!student) {
      sounds.playWarning();
      setScanResultFeedback({
        type: 'warning',
        title: 'كود غير معروف',
        message: `تم قراءة الباركود (${decodedText}) ولكن لم يتم العثور على طالب مطابق.`,
      });
      return;
    }

    processStudentAction(student);
  };

  const processStudentAction = (student: Student) => {
    setScannedStudent(student);
    const today = new Date().toISOString().split('T')[0];
    const currentTimeStr = new Date().toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const group = groups.find((g) => g.id === student.groupId);
    const fee = student.customFee ?? group?.fee ?? teacher.defaultFee;
    setPayAmount(fee);

    if (mode === 'attendance') {
      // Check if already registered today
      const alreadyAttended = attendanceRecords.find(
        (r) => r.studentId === student.id && r.date === today
      );

      if (alreadyAttended) {
        sounds.playWarning();
        setScanResultFeedback({
          type: 'warning',
          title: 'الطالب مسجل حضور بالفعل اليوم!',
          message: `الطالب ${student.name} تم تسجيل حضوره مسبقاً في الساعة ${alreadyAttended.time}.`,
        });

        // Add to session list as already attended
        setSessionScannedList((prev) => [
          {
            id: `item-${Date.now()}-${student.id}`,
            studentName: student.name,
            studentCode: student.code,
            groupName: group?.name || 'عامة',
            status: 'already',
            time: alreadyAttended.time || currentTimeStr,
          },
          ...prev.slice(0, 19),
        ]);
      } else {
        // Record attendance instantly!
        sounds.playScanSuccess();
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.6 },
        });
        onRecordAttendance(student.id, 'present');
        setScanResultFeedback({
          type: 'success',
          title: '✅ تم تسجيل الحضور فورياً!',
          message: `تم تسجيل حضور الطالب ${student.name} (${student.code}) في مجموعة ${group?.name || ''} الآن.`,
        });

        // Add to session list as new recorded
        setSessionScannedList((prev) => [
          {
            id: `item-${Date.now()}-${student.id}`,
            studentName: student.name,
            studentCode: student.code,
            groupName: group?.name || 'عامة',
            status: 'new',
            time: currentTimeStr,
          },
          ...prev.slice(0, 19),
        ]);
      }
    } else if (mode === 'payment') {
      sounds.playScanSuccess();
      // Keep student in view so teacher can confirm payment amount
      setScanResultFeedback({
        type: 'info',
        title: `تسجيل مدفوعات: ${student.name}`,
        message: `يرجى تحديد المبلغ وطريقة الدفع ثم الضغط على تأكيد الاستلام.`,
      });
    } else {
      // Lookup mode
      sounds.playScanSuccess();
      setScanResultFeedback({
        type: 'info',
        title: `بيانات الطالب: ${student.name}`,
        message: `الكود: ${student.code} - المجموعة: ${group?.name || 'غير محددة'}`,
      });
    }
  };

  const handleManualPaymentSubmit = () => {
    if (!scannedStudent) return;
    const newRecord = onRecordPayment(scannedStudent.id, payAmount, payType, payMethod, payNotes);
    sounds.playPaymentCash();
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.5 },
    });
    setScanResultFeedback({
      type: 'success',
      title: '💵 تم تسجيل الدفعة وإصدار الإيصال!',
      message: `تم تحصيل مبلغ ${payAmount} ${teacher.currency} من الطالب ${scannedStudent.name}.`,
      receipt: newRecord || undefined,
    });
  };

  // Filter students for manual search/selection
  const filteredStudents = searchQuery.trim()
    ? students.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.studentPhone.includes(searchQuery)
      )
    : [];

  const studentGroup = scannedStudent ? groups.find((g) => g.id === scannedStudent.groupId) : undefined;

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                ماسح الباركود الذكي (QR Scanner)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                وجّه الكاميرا نحو كارت الطالب لتسجيل العملية فوراً
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors"
            >
              <span>تخطي / إغلاق</span>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="p-3 bg-slate-100/70 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex gap-2">
          <button
            onClick={() => {
              setMode('attendance');
              setScanResultFeedback(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs md:text-sm font-bold transition-all ${
              mode === 'attendance'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>تسجيل الحضور الفوري</span>
          </button>

          <button
            onClick={() => {
              setMode('payment');
              setScanResultFeedback(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs md:text-sm font-bold transition-all ${
              mode === 'payment'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>تسجيل المدفوعات</span>
          </button>

          <button
            onClick={() => {
              setMode('lookup');
              setScanResultFeedback(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs md:text-sm font-bold transition-all ${
              mode === 'lookup'
                ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>استعلام عن طالب</span>
          </button>
        </div>

        {/* Master Scanner Active Toggle Banner (زر تشغيل وإيقاف وضع مسح الكيور كود) */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-3 h-3 rounded-full shrink-0 ${
                isScanningEnabled && isCameraActive
                  ? 'bg-emerald-500 animate-ping'
                  : isScanningEnabled
                  ? 'bg-emerald-500'
                  : 'bg-rose-500'
              }`}
            />
            <div>
              <span className="font-extrabold text-slate-800 dark:text-slate-100 block">
                حالة المسح التلقائي:{' '}
                {isScanningEnabled ? (
                  <span className="text-emerald-600 dark:text-emerald-400">مفعّل ونشط (يسجل الحضور فوراً)</span>
                ) : (
                  <span className="text-rose-600 dark:text-rose-400">مُتوقف مؤقتاً (مُعطّل)</span>
                )}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {mode === 'attendance'
                  ? 'بمجرد قراءة باركود الطالب بالكاميرا، يتم تسجيل حضوره تلقائياً في ثانية واحدة'
                  : 'يتم التعرف على كارت الطالب فوراً'}
              </span>
            </div>
          </div>

          {/* ON / OFF Toggle Button */}
          <button
            onClick={() => setIsScanningEnabled(!isScanningEnabled)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-black text-xs transition-all active:scale-95 shadow-sm ${
              isScanningEnabled
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
            }`}
          >
            {isScanningEnabled ? (
              <>
                <Square className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
                <span>إيقاف المسح مؤقتاً</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>تفعيل وتشغيل المسح</span>
              </>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 md:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Active Camera View / Scanner box */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex flex-col items-center justify-center min-h-[260px]">
            <div id={scannerContainerId} className="w-full max-w-sm rounded-xl overflow-hidden" />

            {/* Overlay if scanning is paused by user toggle */}
            {isCameraActive && !isScanningEnabled && (
              <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white z-10 animate-in fade-in duration-200">
                <div className="w-12 h-12 rounded-2xl bg-rose-600/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mb-2">
                  <Square className="w-6 h-6 fill-rose-400" />
                </div>
                <h4 className="font-black text-base text-white">المسح متوقف مؤقتاً</h4>
                <p className="text-xs text-slate-300 mt-1 max-w-xs">
                  تم إيقاف استشعار الباركود. اضغط على زر تفعيل المسح لاستئناف تسجيل الحضور الفوري.
                </p>
                <button
                  onClick={() => setIsScanningEnabled(true)}
                  className="mt-3.5 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition-transform active:scale-95"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>تفعيل واستئناف المسح الآن</span>
                </button>
              </div>
            )}

            {!isCameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-300 bg-slate-900/90 backdrop-blur-xs">
                <Camera className="w-12 h-12 text-slate-500 mb-2" />
                <p className="text-sm font-medium">
                  {cameraError || 'الكاميرا غير نشطة أو غير متوفرة'}
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  لا تقلق! يمكنك استخدام البحث بالاسم أو الكود أدناه، أو مسح صورة كارت الـ QR من جهازك مباشرة.
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={startCamera}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md transition-transform active:scale-95"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>تشغيل الكاميرا</span>
                  </button>

                  <label className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md cursor-pointer transition-transform active:scale-95">
                    <Upload className="w-3.5 h-3.5" />
                    <span>رفع صورة QR كود</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <button
                    onClick={onClose}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-transform active:scale-95"
                  >
                    <span>تخطي والرجوع</span>
                  </button>
                </div>
              </div>
            )}

            {/* Target Reticle Overlay */}
            {isCameraActive && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="w-56 h-56 border-2 border-indigo-400/80 rounded-2xl relative animate-pulse">
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-indigo-400 rounded-tr-lg" />
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-indigo-400 rounded-tl-lg" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-indigo-400 rounded-br-lg" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-indigo-400 rounded-bl-lg" />
                </div>
              </div>
            )}
          </div>

          {/* Quick Search & Manual Code Test Section */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-indigo-500" />
                البحث السريع بالاسم أو الكود (بدون كاميرا)
              </span>
              <span className="text-[11px] text-slate-400">
                يمكنك كتابة اسم الطالب أو كوده هنا مباشرة
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم (مثال: يوسف، سارة) أو الكود (مثال: STU-1001)..."
                className="w-full pl-4 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            </div>

            {/* Quick search suggestions */}
            {searchQuery.trim() && (
              <div className="mt-2 max-h-40 overflow-y-auto space-y-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 shadow-lg">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSearchQuery('');
                        processStudentAction(s);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-800 text-right transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">
                          {s.name[0]}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                            {s.name}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {s.code}
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full">
                        اختيار للطالب
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="text-center text-xs text-slate-400 py-2">
                    لا توجد نتائج مطابقة لـ "{searchQuery}"
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Feedback Card / Result */}
          {scanResultFeedback && (
            <div
              className={`p-4 rounded-2xl border transition-all ${
                scanResultFeedback.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100'
                  : scanResultFeedback.type === 'warning'
                  ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-100'
                  : 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-800 text-indigo-950 dark:text-indigo-100'
              }`}
            >
              <div className="flex items-start gap-3">
                {scanResultFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : scanResultFeedback.type === 'warning' ? (
                  <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-6 h-6 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <h4 className="font-bold text-sm">{scanResultFeedback.title}</h4>
                  <p className="text-xs mt-1 opacity-90">{scanResultFeedback.message}</p>
                </div>
              </div>

              {/* Attendance WhatsApp Action */}
              {scannedStudent && mode === 'attendance' && (
                <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
                  <span className="text-xs">إشعار ولي الأمر بالواتساب:</span>
                  <a
                    href={generateAttendanceWhatsAppUrl(
                      scannedStudent,
                      teacher,
                      studentGroup,
                      'present',
                      new Date().toLocaleDateString('ar-EG'),
                      new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>إرسال رسالة الحضور</span>
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Real-time Session Scanned Stream (سجل الطلاب المسجلين بالمسح في الجلسة الحالية) */}
          {mode === 'attendance' && sessionScannedList.length > 0 && (
            <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-indigo-500" />
                  <span>سجل الطلاب المسجلين في هذه الجلسة ({sessionScannedList.length}):</span>
                </span>
                <button
                  onClick={() => setSessionScannedList([])}
                  className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline"
                >
                  مسح السجل
                </button>
              </div>

              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {sessionScannedList.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs border ${
                      item.status === 'new'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-200'
                        : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-950 dark:text-amber-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          item.status === 'new' ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                      />
                      <span className="font-bold">{item.studentName}</span>
                      <span className="text-[10px] font-mono opacity-70">({item.studentCode})</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] opacity-75">{item.groupName}</span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/60 dark:bg-slate-900/60">
                        {item.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Form when in Payment Mode and a student is active */}
          {scannedStudent && mode === 'payment' && (
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2.5">
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    بيانات السداد للطالب: {scannedStudent.name}
                  </h4>
                  <span className="text-xs text-slate-400 font-mono">
                    الكود: {scannedStudent.code} | {studentGroup?.name}
                  </span>
                </div>
                <div className="text-left font-bold text-emerald-600 dark:text-emerald-400">
                  {payAmount} {teacher.currency}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    المبلغ المطلوب ({teacher.currency}):
                  </label>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    نوع الدفعة:
                  </label>
                  <select
                    value={payType}
                    onChange={(e) => setPayType(e.target.value as 'monthly_fee' | 'session_fee' | 'book_notes' | 'exam')}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="monthly_fee">اشتراك شهري كامل</option>
                    <option value="session_fee">رسوم حصة واحدة</option>
                    <option value="book_notes">مذكرة وكتب دراسية</option>
                    <option value="exam">رسوم امتحان ومتابعة</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    طريقة الدفع:
                  </label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as 'cash' | 'vodafone_cash' | 'instapay' | 'bank_transfer')}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="cash">نقداً (كاش في الحصة)</option>
                    <option value="vodafone_cash">فودافون كاش / محفظة ذكية</option>
                    <option value="instapay">إنستاباي (InstaPay)</option>
                    <option value="bank_transfer">تحويل بنكي</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    ملاحظات الدفعة (اختياري):
                  </label>
                  <input
                    type="text"
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    placeholder="مثال: خصم تفوق أو تسليم إيصال"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleManualPaymentSubmit}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all shadow-md active:scale-95"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>تأكيد استلام المبلغ وتسجيل الإيصال</span>
                </button>
              </div>

              {scanResultFeedback?.receipt && (
                <div className="pt-2 flex justify-end">
                  <a
                    href={generatePaymentReceiptWhatsAppUrl(
                      scannedStudent,
                      teacher,
                      studentGroup,
                      payAmount,
                      teacher.currency,
                      scanResultFeedback.receipt.receiptNumber,
                      payType
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>إرسال إيصال السداد على واتساب ولي الأمر</span>
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-indigo-500" />
            <span>التنبيه الصوتي مفعّل تلقائياً عند كل مسح ناجح</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
