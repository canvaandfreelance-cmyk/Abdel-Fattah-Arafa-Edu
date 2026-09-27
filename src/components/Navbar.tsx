import React, { useState } from 'react';
import {
  GraduationCap,
  Sun,
  Moon,
  QrCode,
  Users,
  CalendarCheck,
  CreditCard,
  Layers,
  Video,
  Settings,
  LayoutDashboard,
  Menu,
  X,
  ChevronLeft,
  Sparkles,
  FileCheck2,
  AlertCircle,
} from 'lucide-react';
import { TeacherProfile } from '../types';

export type NavTab =
  | 'dashboard'
  | 'attendance'
  | 'students'
  | 'groups'
  | 'exams'
  | 'payments'
  | 'lessons'
  | 'settings'
  | 'defaulters';

interface NavbarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenScanner: () => void;
  teacher: TeacherProfile;
  totalStudents: number;
  totalGroups?: number;
  totalExams?: number;
  unpaidCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  isDarkMode,
  onToggleDarkMode,
  onOpenScanner,
  teacher,
  totalStudents,
  totalGroups = 0,
  totalExams = 0,
  unpaidCount = 0,
}) => {
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const teacherPrefix = teacher.gender === 'female' ? 'أ.' : 'أ.';

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'الرئيسية', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'attendance', label: 'تسجيل الحضور', icon: <CalendarCheck className="w-4 h-4" /> },
    { id: 'students', label: 'الطلاب', icon: <Users className="w-4 h-4" /> },
    { id: 'groups', label: 'المجموعات', icon: <Layers className="w-4 h-4" /> },
    { id: 'exams', label: 'الامتحانات', icon: <FileCheck2 className="w-4 h-4" />, badge: totalExams },
    { id: 'payments', label: 'المدفوعات', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'lessons', label: 'الحصص والفيديوهات', icon: <Video className="w-4 h-4" /> },
    { id: 'settings', label: 'لوحة تحكم المعلم', icon: <Settings className="w-4 h-4" /> },
  ];

  // Drawer menu items include dedicated "المتأخرون عن السداد" accessible from the 3 lines menu
  const drawerItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number; isDanger?: boolean }[] = [
    ...navItems.slice(0, 6),
    {
      id: 'defaulters',
      label: 'الطلاب المتأخرون عن السداد',
      icon: <AlertCircle className="w-4 h-4 text-rose-500" />,
      badge: unpaidCount,
      isDanger: true,
    },
    ...navItems.slice(6),
  ];

  const handleSelectTab = (tab: NavTab) => {
    onTabChange(tab);
    setIsMenuDrawerOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
            {/* Logo & Teacher Branding with Settings Icon next to name */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Teacher Avatar / Photo with click to open profile */}
              <button
                onClick={() => onTabChange('settings')}
                className="relative shrink-0 group focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-2xl"
                title="لوحة تحكم وتعديل صورة وبيانات المعلم"
              >
                {teacher.avatarUrl ? (
                  <img
                    src={teacher.avatarUrl}
                    alt={teacher.name}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl object-cover border-2 border-indigo-500/80 shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
                    {teacher.name ? (
                      <span className="font-black text-sm sm:text-base">
                        {teacher.name.trim().charAt(0)}
                      </span>
                    ) : (
                      <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7" />
                    )}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                </span>
              </button>

              {/* Teacher Details */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-base tracking-tight truncate text-right">
                    {teacherPrefix} {teacher.name}
                  </span>

                  <span className="hidden sm:inline-flex px-2 py-0.5 text-[11px] font-bold rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 truncate max-w-[120px]">
                    {teacher.subject}
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate max-w-[160px] sm:max-w-xs">
                  {teacher.centerName ? `${teacher.centerName}` : 'المنظومة التعليمية'}
                </p>
              </div>
            </div>

            {/* Quick Actions: Menu Drawer + Theme */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {/* Dark Mode Toggle */}
              <button
                onClick={onToggleDarkMode}
                className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title={isDarkMode ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'}
                aria-label="Toggle theme"
              >
                {isDarkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />}
              </button>

              {/* Menu Drawer Toggle Button (Gives mobile access to all sections) */}
              <button
                onClick={() => setIsMenuDrawerOpen(true)}
                className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="جميع أقسام التطبيق"
                aria-label="Open menu"
              >
                <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Bar Tabs - DESKTOP ONLY (hidden on mobile per user request!) */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2 overflow-x-auto py-2.5 border-t border-slate-100 dark:border-slate-800/80 no-scrollbar touch-pan-x">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all shrink-0 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Fixed Mobile Bottom Navigation Bar: clean 5 items */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 shadow-lg flex items-center justify-around">
        <button
          onClick={() => onTabChange('dashboard')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl text-[10px] font-bold transition-colors ${
            currentTab === 'dashboard'
              ? 'text-indigo-600 dark:text-indigo-400 font-black'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>الرئيسية</span>
        </button>

        <button
          onClick={() => onTabChange('attendance')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl text-[10px] font-bold transition-colors ${
            currentTab === 'attendance'
              ? 'text-indigo-600 dark:text-indigo-400 font-black'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <CalendarCheck className="w-5 h-5 mb-0.5" />
          <span>الحضور</span>
        </button>

        {/* Center Scanner elevated button */}
        <button
          onClick={onOpenScanner}
          className="-mt-5 p-3 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/40 active:scale-95 transition-transform flex items-center justify-center"
          title="مسح QR"
        >
          <QrCode className="w-6 h-6" />
        </button>

        <button
          onClick={() => onTabChange('students')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl text-[10px] font-bold transition-colors ${
            currentTab === 'students'
              ? 'text-indigo-600 dark:text-indigo-400 font-black'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span>الطلاب</span>
        </button>

        <button
          onClick={() => onTabChange('groups')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl text-[10px] font-bold transition-colors ${
            currentTab === 'groups'
              ? 'text-indigo-600 dark:text-indigo-400 font-black'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Layers className="w-5 h-5 mb-0.5" />
          <span>المجموعات</span>
        </button>
      </div>

      {/* Slide-out Menu Drawer for Instant Access to All Sections on Any Device */}
      {isMenuDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-start bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xs sm:max-w-sm bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-black text-sm">
                    {teacher.name ? teacher.name[0] : 'م'}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {teacherPrefix} {teacher.name}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {teacher.subject} • {teacher.centerName || 'المنظومة التعليمية'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsMenuDrawerOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 block px-2 mb-1">
                  أقسام التطبيق
                </span>
                {drawerItems.map((item) => {
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectTab(item.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs sm:text-sm font-bold transition-all text-right ${
                        isActive
                          ? item.isDanger
                            ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                            : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                          : item.isDanger
                          ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={isActive ? 'text-white' : item.isDanger ? 'text-rose-600 dark:text-rose-400' : 'text-indigo-600 dark:text-indigo-400'}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : item.isDanger
                              ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drawer Footer with Quick Scanner & Mode */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <button
                onClick={() => {
                  setIsMenuDrawerOpen(false);
                  onOpenScanner();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-600/20"
              >
                <QrCode className="w-4 h-4" />
                <span>فتح ماسح الباركود (QR)</span>
              </button>

              <button
                onClick={onToggleDarkMode}
                className="w-full flex items-center justify-center gap-2 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-bold"
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
                <span>{isDarkMode ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
