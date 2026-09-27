import React from 'react';
import {
  BookOpen,
  GraduationCap,
  Atom,
  Calculator,
  Globe,
  Award,
  Flame,
  Sparkles,
  Brain,
  Lightbulb,
  Trophy,
  Layers,
  Star,
  Target,
} from 'lucide-react';
import { Group, GroupIconType, GroupIconShape } from '../types';

export const GROUP_COLOR_OPTIONS: { id: string; name: string; bgClass: string; gradientClass: string; textClass: string; borderClass: string }[] = [
  { id: 'indigo', name: 'أزرق نيلي', bgClass: 'bg-indigo-50 dark:bg-indigo-950/50', gradientClass: 'from-indigo-600 to-indigo-700', textClass: 'text-indigo-600 dark:text-indigo-400', borderClass: 'border-indigo-200 dark:border-indigo-800' },
  { id: 'violet', name: 'بنفسجي', bgClass: 'bg-violet-50 dark:bg-violet-950/50', gradientClass: 'from-violet-600 to-violet-700', textClass: 'text-violet-600 dark:text-violet-400', borderClass: 'border-violet-200 dark:border-violet-800' },
  { id: 'emerald', name: 'أخضر زمردي', bgClass: 'bg-emerald-50 dark:bg-emerald-950/50', gradientClass: 'from-emerald-600 to-emerald-700', textClass: 'text-emerald-600 dark:text-emerald-400', borderClass: 'border-emerald-200 dark:border-emerald-800' },
  { id: 'amber', name: 'ذهبي / كهرماني', bgClass: 'bg-amber-50 dark:bg-amber-950/50', gradientClass: 'from-amber-500 to-amber-600', textClass: 'text-amber-600 dark:text-amber-400', borderClass: 'border-amber-200 dark:border-amber-800' },
  { id: 'rose', name: 'وردي ياقوتي', bgClass: 'bg-rose-50 dark:bg-rose-950/50', gradientClass: 'from-rose-600 to-rose-700', textClass: 'text-rose-600 dark:text-rose-400', borderClass: 'border-rose-200 dark:border-rose-800' },
  { id: 'blue', name: 'أزرق سماوي', bgClass: 'bg-blue-50 dark:bg-blue-950/50', gradientClass: 'from-blue-600 to-blue-700', textClass: 'text-blue-600 dark:text-blue-400', borderClass: 'border-blue-200 dark:border-blue-800' },
  { id: 'cyan', name: 'تركواز', bgClass: 'bg-cyan-50 dark:bg-cyan-950/50', gradientClass: 'from-cyan-600 to-cyan-700', textClass: 'text-cyan-600 dark:text-cyan-400', borderClass: 'border-cyan-200 dark:border-cyan-800' },
  { id: 'orange', name: 'برتقالي مشرق', bgClass: 'bg-orange-50 dark:bg-orange-950/50', gradientClass: 'from-orange-500 to-orange-600', textClass: 'text-orange-600 dark:text-orange-400', borderClass: 'border-orange-200 dark:border-orange-800' },
  { id: 'fuchsia', name: 'فوشيا ملكي', bgClass: 'bg-fuchsia-50 dark:bg-fuchsia-950/50', gradientClass: 'from-fuchsia-600 to-fuchsia-700', textClass: 'text-fuchsia-600 dark:text-fuchsia-400', borderClass: 'border-fuchsia-200 dark:border-fuchsia-800' },
];

export const GROUP_ICON_OPTIONS: { id: GroupIconType; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'book', label: 'كتاب وقراءة', icon: BookOpen },
  { id: 'graduation', label: 'تخرج وشهادة', icon: GraduationCap },
  { id: 'atom', label: 'علوم وفيزياء', icon: Atom },
  { id: 'calculator', label: 'رياضيات وحساب', icon: Calculator },
  { id: 'globe', label: 'لغات وجغرافيا', icon: Globe },
  { id: 'award', label: 'أوائل وتكريم', icon: Award },
  { id: 'flame', label: 'مكثف ومراجعة', icon: Flame },
  { id: 'sparkles', label: 'تأسيس وذكاء', icon: Sparkles },
  { id: 'brain', label: 'تفكير وفهم', icon: Brain },
  { id: 'lightbulb', label: 'إبداع وابتكار', icon: Lightbulb },
  { id: 'trophy', label: 'كأس الأبطال', icon: Trophy },
  { id: 'star', label: 'نجم ومميز', icon: Star },
  { id: 'target', label: 'تدريب واختبارات', icon: Target },
  { id: 'layers', label: 'مجموعة دراسية', icon: Layers },
];

export const GROUP_SHAPE_OPTIONS: { id: GroupIconShape; label: string; class: string }[] = [
  { id: 'squircle', label: 'عصري (مربع ناعم)', class: 'rounded-2xl' },
  { id: 'circle', label: 'دائري كلاسيكي', class: 'rounded-full' },
  { id: 'rounded', label: 'مستدير خفيف', class: 'rounded-xl' },
];

export const renderGroupIcon = (iconId?: GroupIconType, className = 'w-5 h-5') => {
  switch (iconId) {
    case 'book':
      return <BookOpen className={className} />;
    case 'graduation':
      return <GraduationCap className={className} />;
    case 'atom':
      return <Atom className={className} />;
    case 'calculator':
      return <Calculator className={className} />;
    case 'globe':
      return <Globe className={className} />;
    case 'award':
      return <Award className={className} />;
    case 'flame':
      return <Flame className={className} />;
    case 'sparkles':
      return <Sparkles className={className} />;
    case 'brain':
      return <Brain className={className} />;
    case 'lightbulb':
      return <Lightbulb className={className} />;
    case 'trophy':
      return <Trophy className={className} />;
    case 'star':
      return <Star className={className} />;
    case 'target':
      return <Target className={className} />;
    case 'layers':
    default:
      return <Layers className={className} />;
  }
};

interface GroupIconBadgeProps {
  group?: Group;
  icon?: GroupIconType;
  color?: string;
  shape?: GroupIconShape;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  hasShadow?: boolean;
}

export const GroupIconBadge: React.FC<GroupIconBadgeProps> = ({
  group,
  icon,
  color,
  shape,
  size = 'md',
  className = '',
  hasShadow = true,
}) => {
  const activeIcon = icon || group?.icon || 'layers';
  const activeColor = color || group?.color || 'indigo';
  const activeShape = shape || group?.iconShape || 'squircle';

  const colorConfig =
    GROUP_COLOR_OPTIONS.find((c) => c.id === activeColor) || GROUP_COLOR_OPTIONS[0];

  const shapeConfig =
    GROUP_SHAPE_OPTIONS.find((s) => s.id === activeShape) || GROUP_SHAPE_OPTIONS[0];

  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-14 h-14 text-xl',
  };

  const iconSizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7',
  };

  return (
    <div
      className={`inline-flex items-center justify-center bg-gradient-to-tr ${colorConfig.gradientClass} text-white shrink-0 ${
        shapeConfig.class
      } ${sizeClasses[size]} ${
        hasShadow ? 'shadow-md shadow-indigo-600/15' : ''
      } ${className}`}
    >
      {renderGroupIcon(activeIcon, iconSizeClasses[size])}
    </div>
  );
};
