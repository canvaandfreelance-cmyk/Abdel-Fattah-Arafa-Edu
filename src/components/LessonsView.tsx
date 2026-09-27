import React, { useState } from 'react';
import { EducationalResource, Group, TeacherProfile } from '../types';
import {
  Video,
  FileText,
  Link2,
  Plus,
  Trash2,
  ExternalLink,
  Share2,
  PlayCircle,
  Copy,
  Check,
  X,
} from 'lucide-react';

interface LessonsViewProps {
  resources: EducationalResource[];
  groups: Group[];
  teacher: TeacherProfile;
  onAddResource: (resource: Omit<EducationalResource, 'id' | 'createdAt'>) => void;
  onDeleteResource: (id: string) => void;
}

export const LessonsView: React.FC<LessonsViewProps> = ({
  resources,
  groups,
  teacher,
  onAddResource,
  onDeleteResource,
}) => {
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [resourceToDelete, setResourceToDelete] = useState<EducationalResource | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'video' | 'pdf' | 'link' | 'exam'>('video');
  const [url, setUrl] = useState('');
  const [groupId, setGroupId] = useState('all');
  const [description, setDescription] = useState('');

  const handleOpenAdd = () => {
    setTitle('');
    setType('video');
    setUrl('');
    setGroupId(groups[0]?.id || 'all');
    setDescription('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    const grp = groups.find((g) => g.id === groupId);
    onAddResource({
      title: title.trim(),
      type,
      url: url.trim(),
      groupId,
      grade: grp?.grade || 'جميع المراحل',
      description: description.trim(),
    });

    setIsModalOpen(false);
  };

  const handleCopy = (res: EducationalResource) => {
    navigator.clipboard.writeText(res.url);
    setCopiedId(res.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShareWhatsApp = (res: EducationalResource) => {
    const text = `📚 *${res.title}*
المادة: ${teacher.subject}
المعلم: ${teacher.name}
${res.description ? `التفاصيل: ${res.description}` : ''}
🔗 الرابط: ${res.url}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const filteredResources = resources.filter(
    (r) => selectedGroupId === 'all' || r.groupId === selectedGroupId || r.groupId === 'all'
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Video className="w-6 h-6 text-indigo-600" />
            <span>مكتبة الفيديوهات، الحصص والمذكرات التعليمية</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            أضف روابط حصص الشرح واليوتيوب والمذكرات بصيغة PDF لمشاركتها مباشرة مع طلاب مجموعاتك عبر واتساب.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة فيديو أو مذكرة</span>
        </button>
      </div>

      {/* Group Filter */}
      <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
        <button
          onClick={() => setSelectedGroupId('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
            selectedGroupId === 'all'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          الكل ({resources.length})
        </button>
        {groups.map((group) => (
          <button
            key={group.id}
            onClick={() => setSelectedGroupId(group.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              selectedGroupId === group.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {group.name}
          </button>
        ))}
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredResources.map((res) => {
          const group = groups.find((g) => g.id === res.groupId);

          return (
            <div
              key={res.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-white ${
                        res.type === 'video'
                          ? 'bg-rose-500'
                          : res.type === 'pdf'
                          ? 'bg-amber-500'
                          : 'bg-indigo-500'
                      }`}
                    >
                      {res.type === 'video' ? (
                        <PlayCircle className="w-5 h-5" />
                      ) : res.type === 'pdf' ? (
                        <FileText className="w-5 h-5" />
                      ) : (
                        <Link2 className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {res.type === 'video' ? 'فيديو مسجل' : res.type === 'pdf' ? 'مذكرة PDF' : 'رابط تعليمي'}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {group?.name || 'لكل المجموعات'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setResourceToDelete(res)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    title="حذف هذا المورد أو الفيديو"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-relaxed">
                  {res.title}
                </h3>

                {res.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                    {res.description}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <a
                  href={res.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>فتح الرابط</span>
                </a>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopy(res)}
                    className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-xl text-xs transition-colors"
                    title="نسخ الرابط"
                  >
                    {copiedId === res.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={() => handleShareWhatsApp(res)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                    title="مشاركة على جروب واتساب"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>واتساب</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Resource Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Video className="w-5 h-5 text-indigo-600" />
                <span>إضافة فيديو أو مورد تعليمي جديد</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  عنوان الفيديو أو الحصة <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: شرح الفصل الثاني وحل أسئلة كتاب الوزارة"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    النوع:
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'video' | 'pdf' | 'link' | 'exam')}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white"
                  >
                    <option value="video">فيديو يوتيوب / زووم</option>
                    <option value="pdf">مذكرة أو كتاب (PDF)</option>
                    <option value="exam">امتحان إلكتروني (Google Forms)</option>
                    <option value="link">رابط موقع تعليمي</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    مخصص لمجموعة:
                  </label>
                  <select
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white"
                  >
                    <option value="all">متاح لجميع المجموعات</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  رابط الفيديو أو الملف (URL) <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="url"
                  required
                  dir="ltr"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-sm focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  وصف مختصر أو تعليمات للطلاب:
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="مثال: يرجى مشاهدة الفيديو وحل الواجب قبل موعد الحصة القادمة"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
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
                  إضافة الآن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resource Delete Confirmation Modal */}
      {resourceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-center sm:text-right">
            <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
              تأكيد حذف المورد التعليمي
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              هل أنت متأكد من رغبتك في حذف <span className="font-bold text-slate-800 dark:text-slate-200">({resourceToDelete.title})</span>؟ لن يتمكن الطلاب من الوصول لهذا الرابط بعد الحذف.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setResourceToDelete(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteResource(resourceToDelete.id);
                  setResourceToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-95"
              >
                نعم، حذف المورد
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
