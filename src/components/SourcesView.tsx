import React, { useMemo, useState } from 'react';
import { ExternalLink, MessageSquare, Search } from 'lucide-react';
import {
  SOURCE_CATEGORY_LABELS,
  TEXTILE_SOURCES,
  type SourceCategory,
  type TextileSource,
} from '../data/sources';

interface SourcesViewProps {
  onConsultSource: (source: TextileSource) => void;
}

const PAGE_SIZE = 24;

export const SourcesView: React.FC<SourcesViewProps> = ({ onConsultSource }) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SourceCategory | 'all' | 'core16'>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TEXTILE_SOURCES.filter((s) => {
      const catMatch =
        category === 'all'
          ? true
          : category === 'core16'
            ? Boolean(s.isCore16)
            : s.category === category;
      if (!catMatch) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.shortName.toLowerCase().includes(q) ||
        s.domain.toLowerCase().includes(q) ||
        s.summaryAr.toLowerCase().includes(q) ||
        s.howToApplyAr.toLowerCase().includes(q) ||
        s.keyTopics.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [query, category]);

  const displayed = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  const handleCategoryChange = (next: SourceCategory | 'all' | 'core16') => {
    setCategory(next);
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <div className="space-y-5">
      {/* Header & Filter Bar */}
      <div className="rounded-2xl border border-teal-900/12 bg-gradient-to-b from-teal-50/75 via-white to-amber-50/35 p-5 space-y-4 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              دليل منظومة صناعة الملابس ({TEXTILE_SOURCES.length} مرجعاً وأداة ومصنعاً)
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 max-w-3xl">
              هذه المنظمات والمعارض وبرامج التصميم والماكينات والإكسسوارات والهيئات المصرية والعلامات العالمية تمثل المرجعية المساعدة لـ DoDo. ابحث عن أي مرجع أو اضغط «اسأل DoDo بناءً على ...» لفهم دوره وتطبيقه في مشروعك.
            </p>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              aria-label="ابحث في المصادر"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              placeholder="ابحث (CottonWorks, CLO 3D, YKK, GOEIC, Virgil...)"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pr-9 pl-3 text-xs text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 rounded-lg bg-slate-100 p-1.5">
          {(Object.keys(SOURCE_CATEGORY_LABELS) as Array<SourceCategory | 'all' | 'core16'>).map(
            (catKey) => (
              <button
                key={catKey}
                type="button"
                onClick={() => handleCategoryChange(catKey)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  category === catKey
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {SOURCE_CATEGORY_LABELS[catKey]}
              </button>
            )
          )}
        </div>

        <div className="text-xs text-slate-500 tabular-nums">
          عرض {displayed.length} من أصل {filtered.length} مرجع مطابق
        </div>
      </div>

      {/* Results Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
          لا توجد مراجع مطابقة لبحثك. جرّب مسح نص البحث أو اختيار «الكل».
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {displayed.map((source) => (
              <article
                key={source.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-stone-50/60 p-5 transition-colors hover:border-teal-400 shadow-xs"
              >
                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{source.name}</h3>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`زيارة الموقع الرسمي ${source.name}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:underline whitespace-nowrap shrink-0"
                    >
                      <span dir="ltr">{source.domain}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  {/* Unboxed metadata line */}
                  <div className="mb-3 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                    <span>{source.categoryLabelAr}</span>
                    <span aria-hidden="true">·</span>
                    <span>{source.stageLabelAr}</span>
                    {source.isCore16 && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-medium text-teal-700">مرجع أساسي</span>
                      </>
                    )}
                  </div>

                  <p className="mb-3 text-xs leading-relaxed text-slate-700">{source.summaryAr}</p>

                  <div className="mb-3 rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">
                    <span className="font-semibold text-slate-900">كيف يفيد براندك: </span>
                    {source.howToApplyAr}
                  </div>

                  <div
                    className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500"
                    dir="ltr"
                  >
                    {source.keyTopics.map((topic, idx) => (
                      <React.Fragment key={topic}>
                        {idx > 0 && <span aria-hidden="true">·</span>}
                        <span>{topic}</span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => onConsultSource(source)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition-colors hover:border-teal-600 hover:bg-teal-50/40 hover:text-teal-800 whitespace-nowrap"
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-teal-700" />
                    <span>اسأل DoDo بناءً على {source.shortName}</span>
                  </button>
                </div>
              </article>
            ))}
          </div>

          {hasMore && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 whitespace-nowrap"
              >
                عرض المزيد ({filtered.length - visibleCount} متبقٍ)
              </button>
              <button
                type="button"
                onClick={() => setVisibleCount(filtered.length)}
                className="rounded-lg bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 whitespace-nowrap"
              >
                عرض الكل ({filtered.length})
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
