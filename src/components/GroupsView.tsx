import React, { useState } from 'react';
import { Group, Student, TeacherProfile, GroupIconType, GroupIconShape } from '../types';
import {
  Layers,
  Plus,
  Clock,
  Calendar,
  Users,
  Edit2,
  Trash2,
  CalendarCheck,
  CreditCard,
  X,
  Sparkles,
  Search,
  Check,
  AlertTriangle,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { NavTab } from './Navbar';
import {
  GroupIconBadge,
  GROUP_COLOR_OPTIONS,
  GROUP_ICON_OPTIONS,
  GROUP_SHAPE_OPTIONS,
} from './GroupIconBadge';

const DAYS_OF_WEEK = [
  'السبت',
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
];

interface GroupsViewProps {
  groups: Group[];
  students: Student[];
  teacher: TeacherProfile;
  onAddGroup: (group: Omit<Group, 'id' | 'createdAt'>) => void;
  onUpdateGroup: (group: Group) => void;
  onDeleteGroup: (id: string, transferToGroupId?: string) => void;
  onNavigate: (tab: NavTab) => void;
}

export const GroupsView: React.FC<GroupsViewProps> = ({
  groups,
  students,
  teacher,
  onAddGroup,
  onUpdateGroup,
  onDeleteGroup,
  onNavigate,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [transferGroupId, setTransferGroupId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  const [scheduleDays, setScheduleDays] = useState<string[]>(['السبت', 'الثلاثاء']);
  const [scheduleTime, setScheduleTime] = useState('04:30 مساءً');
  const [fee, setFee] = useState<number>(teacher.defaultFee || 250);
  const [feeType, setFeeType] = useState<'monthly' | 'per_session'>('monthly');
  const [color, setColor] = useState<string>('indigo');
  const [icon, setIcon] = useState<GroupIconType>('graduation');
  const [iconShape, setIconShape] = useState<GroupIconShape>('squircle');
  const [notes, setNotes] = useState('');

  const todayArabicDay = new Intl.DateTimeFormat('ar-EG', { weekday: 'long' }).format(new Date());

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleOpenAdd = () => {
    setEditingGroup(null);
    setName('');
    setGrade('الصف الثالث الثانوي');
    setScheduleDays(['السبت', 'الثلاثاء']);
    setScheduleTime('04:30 مساءً');
    setFee(teacher.defaultFee || 250);
    setFeeType('monthly');
    setColor('indigo');
    setIcon('graduation');
    setIconShape('squircle');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (group: Group) => {
    setEditingGroup(group);
    setName(group.name);
    setGrade(group.grade);
    setScheduleDays(group.scheduleDays);
    setScheduleTime(group.scheduleTime);
    setFee(group.fee);
    setFeeType(group.feeType);
    setColor(group.color || 'indigo');
    setIcon(group.icon || 'layers');
    setIconShape(group.iconShape || 'squircle');
    setNotes(group.notes || '');
    setIsModalOpen(true);
  };

  const toggleDay = (day: string) => {
    if (scheduleDays.includes(day)) {
      setScheduleDays(scheduleDays.filter((d) => d !== day));
    } else {
      setScheduleDays([...scheduleDays, day]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingGroup) {
      onUpdateGroup({
        ...editingGroup,
        name: name.trim(),
        grade: grade.trim(),
        scheduleDays,
        scheduleTime,
        fee,
        feeType,
        color,
        icon,
        iconShape,
        notes: notes.trim(),
      });
      showNotification(`تم تحديث مجموعة "${name.trim()}" بنجاح.`);
    } else {
      onAddGroup({
        name: name.trim(),
        grade: grade.trim(),
        scheduleDays,
        scheduleTime,
        fee,
        feeType,
        color,
        icon,
        iconShape,
        notes: notes.trim(),
      });
      showNotification(`تم إنشاء مجموعة "${name.trim()}" وتخصيص أيقونتها ولونها بنجاح.`);
    }
    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!groupToDelete) return;
    const name = groupToDelete.name;
    onDeleteGroup(groupToDelete.id, transferGroupId || undefined);
    setGroupToDelete(null);
    setTransferGroupId('');
    showNotification(`تم حذف مجموعة "${name}" بنجاح.`);
  };

  // Filter groups
  const filteredGroups = groups.filter((g) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      g.name.toLowerCase().includes(q) ||
      g.grade.toLowerCase().includes(q) ||
      g.scheduleDays.some((d) => d.includes(q))
    );
  });

  // Groups having classes today
  const groupsTodayCount = groups.filter((g) =>
    g.scheduleDays.some((d) => d.includes(todayArabicDay) || todayArabicDay.includes(d))
  ).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="flex items-center gap-2 p-3.5 bg-emerald-600 text-white rounded-2xl shadow-lg text-xs sm:text-sm font-bold animate-in fade-in slide-in-from-top-2">
          <Check className="w-5 h-5 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" />
            <span>إدارة المجموعات والصفوف الدراسية</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 font-bold font-mono">
              {groups.length} مجموعات
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            أنشئ مجموعاتك، حدد اسمها وأيقونتها المعبرة ولونها المميز ومواعيد حصصها وقيمة الاشتراك.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md shadow-indigo-600/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء مجموعة جديدة</span>
        </button>
      </div>

      {/* Quick KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 block">إجمالي المجموعات</span>
          <span className="text-xl font-black text-slate-800 dark:text-white">{groups.length}</span>
        </div>
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 block">إجمالي الطلاب المقيدين</span>
          <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{students.length}</span>
        </div>
        <div className="col-span-2 sm:col-span-1 p-3.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block">حصص اليوم ({todayArabicDay})</span>
          <span className="text-xl font-black text-emerald-800 dark:text-emerald-200">{groupsTodayCount} مجموعات</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث باسم المجموعة (مثال: الثالث الثانوي)، أو المرحلة، أو اليوم..."
          className="w-full pl-4 pr-11 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 shadow-xs"
        />
        <Search className="w-5 h-5 text-slate-400 absolute right-4 top-3" />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute left-3.5 top-3 p-1 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Groups Grid */}
      {filteredGroups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGroups.map((group) => {
            const groupStudents = students.filter((s) => s.groupId === group.id);
            const isToday = group.scheduleDays.some((d) => d.includes(todayArabicDay) || todayArabicDay.includes(d));

            return (
              <div
                key={group.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden"
              >
                {/* Active Today Ribbon */}
                {isToday && (
                  <div className="absolute top-0 left-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-br-2xl shadow-xs">
                    حصّة اليوم
                  </div>
                )}

                <div className="space-y-3">
                  {/* Header: Icon & Name & Actions */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Custom Icon Badge */}
                      <GroupIconBadge
                        group={group}
                        size="lg"
                        className="hover:scale-105 transition-transform"
                      />

                      <div className="min-w-0">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {group.grade}
                        </span>
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mt-1 truncate">
                          {group.name}
                        </h3>
                      </div>
                    </div>

                    {/* Edit & Delete Action Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(group)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="تعديل المجموعة والأيقونة واللون"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setGroupToDelete(group)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                        title="حذف المجموعة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Days badges */}
                  <div className="flex flex-wrap gap-1">
                    {group.scheduleDays.map((day) => (
                      <span
                        key={day}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-colors ${
                          todayArabicDay.includes(day) || day.includes(todayArabicDay)
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {day}
                      </span>
                    ))}
                  </div>

                  {/* Schedule Time */}
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    <span>الموعد: {group.scheduleTime}</span>
                  </div>

                  {/* Notes */}
                  {group.notes && (
                    <p className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl truncate">
                      {group.notes}
                    </p>
                  )}
                </div>

                {/* Bottom stats & quick actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span>{groupStudents.length} طلاب مسجلين</span>
                    </div>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">
                      {group.fee} {teacher.currency} / {group.feeType === 'monthly' ? 'شهرياً' : 'للحصة'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => onNavigate('attendance')}
                      className="flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95"
                    >
                      <CalendarCheck className="w-3.5 h-3.5" />
                      <span>تسجيل الحضور</span>
                    </button>
                    <button
                      onClick={() => onNavigate('students')}
                      className="py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors text-center"
                    >
                      عرض الطلاب
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-3">
          <Layers className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">لم يتم العثور على أي مجموعة</h4>
          <p className="text-xs text-slate-400">ابدأ بإنشاء مجموعة دراسية جديدة بالضغط على الزر أدناه</p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء مجموعة الآن</span>
          </button>
        </div>
      )}

      {/* Add / Edit Group Modal with Custom Icon, Shape & Color Picker */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-sm sm:text-base">
                <Layers className="w-5 h-5 text-indigo-600" />
                <span>{editingGroup ? 'تعديل بيانات وأيقونة ولون المجموعة' : 'إنشاء مجموعة جديدة وتخصيص شكلها'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs">
              {/* 1. Live Interactive Preview of Group Badge */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3.5">
                <GroupIconBadge
                  icon={icon}
                  color={color}
                  shape={iconShape}
                  size="xl"
                  className="shadow-md"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-slate-400 font-bold block mb-0.5">معاينة مباشرة لشكل وأيقونة ولون المجموعة:</span>
                  <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                    {name || 'اسم المجموعة الدراسية'}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{grade}</span>
                    <span>•</span>
                    <span>{scheduleTime}</span>
                    <span>•</span>
                    <span className="font-bold text-emerald-600">{fee} {teacher.currency}</span>
                  </div>
                </div>
              </div>

              {/* Group Name & Grade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    اسم المجموعة الدراسية <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: الصف الثالث الثانوي (علمي) - السبت والثلاثاء"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    الصف أو المرحلة الدراسية:
                  </label>
                  <input
                    type="text"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="مثال: الصف الثالث الثانوي"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* 2. Group Color Palette */}
              <div>
                <label className="block font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                  لون المجموعة المميز:
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
                  {GROUP_COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setColor(c.id)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                        color === c.id
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/40 scale-105'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full bg-gradient-to-tr ${c.gradientClass} shadow-xs`} />
                      <span className="text-[10px] text-slate-600 dark:text-slate-400 truncate max-w-[60px]">
                        {c.name.split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Group Icon Shape */}
              <div>
                <label className="block font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                  شكل إطار الأيقونة:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {GROUP_SHAPE_OPTIONS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setIconShape(s.id)}
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border font-bold text-xs transition-all ${
                        iconShape === s.id
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/30'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-indigo-600 ${s.class}`} />
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Group Icon Selector Grid */}
              <div>
                <label className="block font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                  أيقونة ورمز المجموعة:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 max-h-44 overflow-y-auto p-1 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  {GROUP_ICON_OPTIONS.map((item) => {
                    const IconComponent = item.icon;
                    const isSelected = icon === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setIcon(item.id)}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs font-bold'
                            : 'border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                        title={item.label}
                      >
                        <IconComponent className="w-5 h-5 mb-1" />
                        <span className="text-[10px] truncate max-w-[65px]">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Schedule Days */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  أيام الحصص الأسبوعية:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS_OF_WEEK.map((day) => {
                    const isSelected = scheduleDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Schedule Time & Fee */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    موعد وتوقيت الحصة:
                  </label>
                  <input
                    type="text"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    placeholder="مثال: 04:30 مساءً"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    قيمة الاشتراك ({teacher.currency}):
                  </label>
                  <input
                    type="number"
                    value={fee}
                    onChange={(e) => setFee(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    نوع الاشتراك:
                  </label>
                  <select
                    value={feeType}
                    onChange={(e) => setFeeType(e.target.value as 'monthly' | 'per_session')}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white"
                  >
                    <option value="monthly">شهرياً (شامل)</option>
                    <option value="per_session">بالحصة الواحدة</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  ملاحظات أو مكان القاعة والسنتر:
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: سنتر الأوائل - القاعة 2"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                {editingGroup ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setGroupToDelete(editingGroup);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl font-bold transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>حذف هذه المجموعة</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md transition-all active:scale-95"
                  >
                    {editingGroup ? 'حفظ التعديلات' : 'إنشاء المجموعة'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Group Delete Confirmation Modal */}
      {groupToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-center sm:text-right">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                  تأكيد حذف المجموعة
                </h3>
                <p className="text-xs text-slate-500">
                  حذف المجموعة وإدارة الطلاب المقيدين بها
                </p>
              </div>
            </div>

            {/* Group details card */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
              <GroupIconBadge group={groupToDelete} size="md" />
              <div className="min-w-0 text-right">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                  {groupToDelete.name}
                </h4>
                <p className="text-xs text-slate-500">
                  {groupToDelete.grade} • {groupToDelete.scheduleTime}
                </p>
              </div>
            </div>

            {/* Students Enrolled count & transfer option */}
            {(() => {
              const enrolledCount = students.filter((s) => s.groupId === groupToDelete.id).length;
              const otherGroups = groups.filter((g) => g.id !== groupToDelete.id);

              if (enrolledCount > 0) {
                return (
                  <div className="space-y-2 text-right">
                    <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl leading-relaxed">
                      ⚠️ يوجد <span className="font-bold">{enrolledCount} طلاب</span> مقيدين حالياً بهذه المجموعة.
                    </p>

                    {otherGroups.length > 0 && (
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                          نقل هؤلاء الطلاب إلى مجموعة بديلة (اختياري):
                        </label>
                        <select
                          value={transferGroupId}
                          onChange={(e) => setTransferGroupId(e.target.value)}
                          className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                        >
                          <option value="">بدون مجموعة (غير معينين)</option>
                          {otherGroups.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.name} ({g.scheduleTime})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <p className="text-xs text-slate-500 text-right">
                  لا يوجد طلاب مقيدين حالياً في هذه المجموعة.
                </p>
              );
            })()}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setGroupToDelete(null)}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 sm:flex-initial px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md shadow-rose-600/20 active:scale-95 transition-all"
              >
                نعم، حذف المجموعة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
