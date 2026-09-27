import React, { useState, useRef } from 'react';
import { TeacherProfile, Gender } from '../types';
import {
  UserCog,
  User,
  Camera,
  Upload,
  Trash2,
  Sparkles,
  Phone,
  Building,
  BookOpen,
  DollarSign,
  Sun,
  Moon,
  Download,
  RotateCcw,
  Check,
  CheckCircle2,
  Award,
  Layers,
  Users,
  CreditCard,
  Image as ImageIcon,
} from 'lucide-react';
import { StorageService } from '../utils/storage';

// Preset avatar styles for instant selection
const PRESET_AVATARS = [
  {
    id: 'male-teacher-1',
    name: 'معلم متميز',
    gender: 'male',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'male-teacher-2',
    name: 'مستر عصري',
    gender: 'male',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'female-teacher-1',
    name: 'معلمة متميزة',
    gender: 'female',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'female-teacher-2',
    name: 'أستاذة قديرة',
    gender: 'female',
    url: 'https://images.unsplash.com/photo-1580894732489-026850c95029?auto=format&fit=crop&w=300&q=80',
  },
];

interface SettingsViewProps {
  teacher: TeacherProfile;
  onUpdateTeacher: (updated: TeacherProfile) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onDataReloadNeeded: () => void;
  totalStudents?: number;
  totalGroups?: number;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  teacher,
  onUpdateTeacher,
  isDarkMode,
  onToggleDarkMode,
  onDataReloadNeeded,
  totalStudents = 0,
  totalGroups = 0,
}) => {
  const [name, setName] = useState(teacher.name);
  const [gender, setGender] = useState<Gender>(teacher.gender);
  const [subject, setSubject] = useState(teacher.subject);
  const [phone, setPhone] = useState(teacher.phone);
  const [centerName, setCenterName] = useState(teacher.centerName);
  const [currency, setCurrency] = useState(teacher.currency);
  const [defaultFee, setDefaultFee] = useState<number>(teacher.defaultFee);
  const [avatarUrl, setAvatarUrl] = useState<string>(teacher.avatarUrl || '');
  const [bio, setBio] = useState<string>(teacher.bio || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [statusNotice, setStatusNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    setStatusNotice({ type, message });
    setTimeout(() => setStatusNotice(null), 4000);
  };

  // Handle local photo upload with client-side resize to keep storage tiny
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      notify('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 5 ميجابايت.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize to maximum 300x300 for crisp thumbnail without bloating localStorage
        const canvas = document.createElement('canvas');
        const maxSize = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setAvatarUrl(compressedDataUrl);
          notify('تم تجهيز الصورة بنجاح! اضغط "حفظ بيانات وصورة المعلم" لاعتمادها.');
        }
      };
      if (typeof event.target?.result === 'string') {
        img.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAvatarUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    notify('تم إزالة الصورة الشخصية.');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: TeacherProfile = {
      ...teacher,
      name: name.trim(),
      gender,
      subject: subject.trim(),
      phone: phone.trim(),
      centerName: centerName.trim(),
      currency: currency.trim(),
      defaultFee,
      avatarUrl,
      bio: bio.trim(),
    };
    onUpdateTeacher(updated);
    setSavedSuccess(true);
    notify('تم حفظ اسم وصورة وبيانات المعلم وتحديثها في جميع شاشات التطبيق بنجاح!');
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const handleExportBackup = () => {
    StorageService.exportFullBackup();
    notify('تم بدء تنزيل النسخة الاحتياطية كملف JSON.');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = StorageService.importBackup(content);
        if (success) {
          notify('تم استعادة النسخة الاحتياطية بنجاح!');
          onDataReloadNeeded();
        } else {
          notify('فشل استعادة الملف، تأكد من صحة الملف الاحتياطي.', 'error');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmResetData = () => {
    StorageService.resetAllData();
    setShowResetConfirmModal(false);
    notify('تم استعادة البيانات الافتراضية بنجاح.');
    onDataReloadNeeded();
  };

  const teacherPrefix = gender === 'female' ? 'أستاذة' : 'أستاذ';

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-1 sm:px-0">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <UserCog className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>لوحة تحكم المعلم والملف الشخصي</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              عدّل اسمك، صورة ملفك الشخصي، المادة وبيانات المركز، لتظهر فوراً على كروت الطلاب وإيصالات السداد.
            </p>
          </div>
        </div>

        {statusNotice && (
          <div
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold animate-in fade-in ${
              statusNotice.type === 'error'
                ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
            }`}
          >
            <Check className="w-4 h-4 shrink-0" />
            <span>{statusNotice.message}</span>
          </div>
        )}
      </div>

      {/* Main Grid: Edit Profile (Left 2 cols) & Live Preview / Stats (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: Profile Picture & Details */}
        <form onSubmit={handleSave} className="lg:col-span-2 space-y-6">
          {/* Card 1: Avatar Upload & Selection */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Camera className="w-4 h-4 text-indigo-500" />
              <span>صورة الملف الشخصي للمعلم</span>
            </h3>

            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* Avatar Preview */}
              <div className="relative group shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={name}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-indigo-500/80 shadow-xl"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white text-3xl font-black shadow-xl">
                    {name ? name.trim().charAt(0) : 'م'}
                  </div>
                )}

                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute -top-2 -right-2 p-1.5 rounded-full bg-rose-600 text-white hover:bg-rose-700 shadow-md transition-transform active:scale-95"
                    title="حذف الصورة والعودة للحرف الافتراضي"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Upload & Presets Actions */}
              <div className="space-y-3 flex-1 text-center sm:text-right">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    تغيير أو رفع صورة جديدة
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    اختر صورة من هاتفك أو جهازك (JPG أو PNG) أو اختر صورة جاهزة أدناه.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>رفع صورة من الجهاز</span>
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />

                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-medium transition-colors"
                    >
                      إزالة الصورة
                    </button>
                  )}
                </div>

                {/* Instant preset avatars */}
                <div className="pt-2">
                  <span className="text-[11px] text-slate-400 block mb-1.5">
                    أو اختر صورة جاهزة مباشرة:
                  </span>
                  <div className="flex items-center justify-center sm:justify-start gap-2 overflow-x-auto">
                    {PRESET_AVATARS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setAvatarUrl(preset.url)}
                        className={`relative rounded-xl overflow-hidden border-2 transition-transform hover:scale-105 ${
                          avatarUrl === preset.url
                            ? 'border-indigo-600 ring-2 ring-indigo-500/40'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                        title={preset.name}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-10 h-10 object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Personal & Center Information */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <User className="w-4 h-4 text-indigo-500" />
              <span>بيانات المعلم والتخصص</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Teacher Name */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  اسم المعلم / المعلمة بالكامل <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: أحمد محمود العطار"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  النوع واللقب:
                </label>
                <div className="flex gap-4 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 dark:text-slate-200">
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={gender === 'male'}
                      onChange={() => setGender('male')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>ذكر (أستاذ / مستر)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 dark:text-slate-200">
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={gender === 'female'}
                      onChange={() => setGender('female')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>أنثى (أستاذة / مس)</span>
                  </label>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  المادة الدراسية:
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="مثال: الفيزياء والكيمياء"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  رقم هاتف المعلم / واتساب:
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010xxxxxxxx"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              {/* Center / School Name */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  اسم السنتر / الأكاديمية أو المدرسة:
                </label>
                <input
                  type="text"
                  value={centerName}
                  onChange={(e) => setCenterName(e.target.value)}
                  placeholder="مثال: أكاديمية الفرسان التعليمية"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              {/* Currency */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  العملة المستخدمة:
                </label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="مثال: ج.م / ر.س / د.ك / $"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              {/* Default Fee */}
              <div className="sm:col-span-2">
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  الاشتراك الشهري الافتراضي ({currency}):
                </label>
                <input
                  type="number"
                  value={defaultFee}
                  onChange={(e) => setDefaultFee(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              {/* Bio / Teacher Message */}
              <div className="sm:col-span-2">
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  نبذة تعريفية أو رسالة المعلم للطلاب وأولياء الأمور:
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="مثال: معلم أول الفيزياء والكيمياء للثانوية العامة بخبرة 12 عاماً..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
              >
                حفظ بيانات وصورة المعلم
              </button>
            </div>
          </div>
        </form>

        {/* Right Sidebar: Live Preview Card + Quick Stats + Theme & Backup */}
        <div className="space-y-6">
          {/* Live Teacher ID Preview Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <span className="text-xs font-bold text-slate-400 block flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>معاينة حية لبطاقة المعلم</span>
            </span>

            {/* Visual Card */}
            <div className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-28 h-28 bg-indigo-500/20 rounded-full blur-xl pointer-events-none" />

              <div className="flex items-center gap-3 mb-3">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-400 shadow-md shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center font-black text-xl text-white border border-white/20 shrink-0">
                    {name ? name.trim().charAt(0) : 'م'}
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-[10px] text-indigo-200 block">
                    {teacherPrefix} /
                  </span>
                  <h4 className="font-extrabold text-sm sm:text-base text-white truncate">
                    {name || 'اسم المعلم'}
                  </h4>
                  <span className="text-[11px] text-indigo-200 font-medium block truncate">
                    مادة: {subject || 'المادة الدراسية'}
                  </span>
                </div>
              </div>

              {centerName && (
                <div className="pt-2 border-t border-white/10 text-[11px] text-indigo-100 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-indigo-300" />
                  <span className="truncate">{centerName}</span>
                </div>
              )}

              {phone && (
                <div className="mt-1 text-[11px] text-indigo-200 flex items-center gap-1.5" dir="ltr">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{phone}</span>
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-400 text-center">
              هكذا يظهر اسمك وصورتك في الشريط العلوي، كروت الـ QR، ورسائل الواتساب.
            </p>
          </div>

          {/* Teacher Stats Overview */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h4 className="font-bold text-xs text-slate-400">إحصائيات المنظومة الخاصة بك:</h4>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900">
                <span className="text-xl font-black text-indigo-700 dark:text-indigo-300 block">
                  {totalStudents}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">طالب مقيد</span>
              </div>
              <div className="p-3 rounded-2xl bg-violet-50 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-900">
                <span className="text-xl font-black text-violet-700 dark:text-violet-300 block">
                  {totalGroups}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">مجموعات دراسية</span>
              </div>
            </div>
          </div>

          {/* Theme Appearance Mode */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h4 className="font-bold text-xs text-slate-400 flex items-center gap-1.5">
              {isDarkMode ? <Moon className="w-3.5 h-3.5 text-indigo-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
              <span>مظهر التطبيق (الوضع الليلي والنهاري)</span>
            </h4>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (isDarkMode) onToggleDarkMode();
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
                  !isDarkMode
                    ? 'bg-indigo-50 border border-indigo-300 text-indigo-800 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>نهاري</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!isDarkMode) onToggleDarkMode();
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
                  isDarkMode
                    ? 'bg-indigo-950 border border-indigo-600 text-indigo-200 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Moon className="w-4 h-4 text-indigo-400" />
                <span>ليلي</span>
              </button>
            </div>
          </div>

          {/* Backup & Reset */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h4 className="font-bold text-xs text-slate-400 flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-emerald-500" />
              <span>النسخ الاحتياطي واستعادة البيانات</span>
            </h4>
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleExportBackup}
                className="w-full flex items-center justify-center gap-2 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>تنزيل نسخة احتياطية (JSON)</span>
              </button>

              <label className="w-full flex items-center justify-center gap-2 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-indigo-600" />
                <span>استيراد نسخة احتياطية</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => setShowResetConfirmModal(true)}
                className="w-full flex items-center justify-center gap-2 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-semibold transition-colors pt-2"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
                <span>استرجاع البيانات التجريبية</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-center sm:text-right">
            <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
              استرجاع البيانات التجريبية
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              هل أنت متأكد من رغبتك في إعادة تعيين البيانات؟ سيتم استرجاع قائمة الطلاب والمجموعات النموذجية وتصفير التغييرات غير المحفوظة في النسخ الاحتياطية.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmResetData}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-95"
              >
                نعم، استرجاع البيانات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
