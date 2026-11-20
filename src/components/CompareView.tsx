import React, { useState } from 'react';
import { Trash2, ArrowUpLeft, Sparkles, RotateCcw, ExternalLink } from 'lucide-react';
import {
  buildComparisonSummary,
  formatMoney,
  type ScenarioInput,
  type SimulationResult,
} from '../utils/simulator';
import { MarkdownView } from './MarkdownView';

interface CitationItem {
  title: string;
  uri: string;
}

interface CompareViewProps {
  scenarios: SimulationResult[];
  onLoadScenario: (input: ScenarioInput) => void;
  onDeleteScenario: (id: string) => void;
  onClearAll: () => void;
  onRestoreSeeds: () => void;
  onGoToSimulator: () => void;
}

export const CompareView: React.FC<CompareViewProps> = ({
  scenarios,
  onLoadScenario,
  onDeleteScenario,
  onClearAll,
  onRestoreSeeds,
  onGoToSimulator,
}) => {
  const [verdict, setVerdict] = useState<string | null>(null);
  const [citations, setCitations] = useState<CitationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const delta = buildComparisonSummary(scenarios);

  const handleAiCompare = async () => {
    if (scenarios.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/compare-scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarios: scenarios.slice(0, 4).map((s) => ({
            name: s.input.name,
            capitalUsd: Math.round(s.capitalUsd),
            location: s.locationLabelAr,
            market: s.marketLabelAr,
            category: s.categoryLabelAr,
            fabric: s.requiresRawFabric ? s.fabricLabelAr : 'بدون شراء خامة (جاهز)',
            requiresRawFabric: s.requiresRawFabric,
            gsm: s.input.gsm,
            mfgModel: s.mfgLabelAr,
            skuCount: s.input.skuCount,
            unitCostUsd: Number(s.unitCostUsd.toFixed(2)),
            suggestedRetailUsd: Number(s.suggestedRetailUsd.toFixed(2)),
            grossMarginPct: Number(s.grossMarginPct.toFixed(1)),
            possibleUnits: s.possibleUnits,
            minRequiredUnits: s.minRequiredUnits,
            capitalSufficient: s.capitalSufficient,
            breakEvenUnits: s.breakEvenUnits,
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'تعذر إتمام المقارنة الذكية.');
      }
      setVerdict(data.text);
      setCitations(Array.isArray(data.citations) ? data.citations : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء المقارنة.');
    } finally {
      setLoading(false);
    }
  };

  if (scenarios.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
        <h2 className="text-base font-bold text-slate-900">لا توجد سيناريوهات محفوظة للمقارنة</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          جرّب تعديل رأس المال والخامة ونموذج التصنيع في المحاكي ثم اضغط على «حفظ الفكرة للمقارنة» لعرض الفروق جنباً إلى جنب.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onGoToSimulator}
            className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 whitespace-nowrap shrink-0"
          >
            الانتقال إلى المحاكي
          </button>
          <button
            type="button"
            onClick={onRestoreSeeds}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-4 w-4" />
            <span>استعادة أمثلة استرشادية</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-teal-900/12 bg-gradient-to-b from-white via-white to-teal-50/40 p-5 shadow-xs">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              مقارنة الأفكار والسيناريوهات ({scenarios.length})
            </h2>
            <p className="text-xs text-slate-500">
              مقارنة رقمية مباشرة لتكلفة القطعة، الكمية، نقطة التعادل، وملاءمة رأس المال
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {scenarios.length >= 2 && (
              <button
                type="button"
                onClick={handleAiCompare}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-teal-800 disabled:opacity-60 whitespace-nowrap shrink-0"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{loading ? 'جاري التحليل المقارن...' : 'حُكم المستشار بين الأفكار'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClearAll}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-red-700 whitespace-nowrap shrink-0"
            >
              مسح الكل
            </button>
          </div>
        </div>

        {/* Highlights Strip */}
        {delta && scenarios.length >= 2 && (() => {
          const cheapest = scenarios.find((s) => s.id === delta.cheapestUnitCostId);
          const bestMargin = scenarios.find((s) => s.id === delta.highestMarginId);
          const fastestBe = scenarios.find((s) => s.id === delta.fastestBreakEvenId);
          return (
            <div className="mb-4 grid grid-cols-1 gap-3 border-b border-slate-100 pb-4 sm:grid-cols-3 text-xs">
              {cheapest && (
                <div className="rounded-xl border border-teal-200/80 bg-gradient-to-br from-teal-50 to-white p-3.5">
                  <div className="flex items-center justify-between text-teal-900">
                    <span>أقل تكلفة للقطعة</span>
                    <span className="font-mono-num font-bold text-teal-900">
                      {formatMoney(cheapest.unitCostUsd, cheapest.input.currency, cheapest.input.fxRate)}
                    </span>
                  </div>
                  <div className="mt-1 font-bold text-slate-900 truncate">{cheapest.input.name}</div>
                </div>
              )}
              {bestMargin && (
                <div className="rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-white p-3.5">
                  <div className="flex items-center justify-between text-amber-950">
                    <span>أعلى هامش ربح إجمالي</span>
                    <span className="font-mono-num font-bold text-amber-900">
                      {bestMargin.grossMarginPct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-1 font-bold text-slate-900 truncate">{bestMargin.input.name}</div>
                </div>
              )}
              {fastestBe && (
                <div className="rounded-xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50 to-white p-3.5">
                  <div className="flex items-center justify-between text-indigo-950">
                    <span>أسرع نقطة تعادل</span>
                    <span className="font-mono-num font-bold text-indigo-900">
                      {fastestBe.breakEvenUnits} قطعة
                    </span>
                  </div>
                  <div className="mt-1 font-bold text-slate-900 truncate">{fastestBe.input.name}</div>
                </div>
              )}
            </div>
          );
        })()}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-right text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="px-3 py-2.5 font-semibold">الفكرة / السيناريو</th>
                <th className="px-3 py-2.5 font-semibold">رأس المال</th>
                <th className="px-3 py-2.5 font-semibold">السوق والخامة</th>
                <th className="px-3 py-2.5 font-semibold">التصنيع</th>
                <th className="px-3 py-2.5 font-semibold">تكلفة القطعة</th>
                <th className="px-3 py-2.5 font-semibold">سعر البيع</th>
                <th className="px-3 py-2.5 font-semibold">الهامش</th>
                <th className="px-3 py-2.5 font-semibold">الكمية / التعادل</th>
                <th className="px-3 py-2.5 font-semibold">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scenarios.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70">
                  <td className="px-3 py-3 font-semibold text-slate-900">
                    <div>{s.input.name}</div>
                    <div className="mt-0.5 text-[11px] font-normal text-slate-500">
                      {s.categoryLabelAr} · {s.input.skuCount} موديلات
                    </div>
                  </td>
                  <td className="font-mono-num px-3 py-3 text-slate-800">
                    {formatMoney(s.capitalUsd, s.input.currency, s.input.fxRate)}
                  </td>
                  <td className="px-3 py-3 text-slate-700">
                    <div>{s.marketLabelAr}</div>
                    <div className="mt-0.5 text-[11px] text-slate-500">
                      {s.locationLabelAr} ·{' '}
                      {s.requiresRawFabric ? `${s.fabricLabelAr} (${s.input.gsm} GSM)` : 'جاهز بدون خامات'}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-slate-700">
                    <div>{s.mfgLabelAr}</div>
                    <div
                      className={`mt-0.5 text-[11px] font-medium ${
                        s.capitalSufficient ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {s.capitalSufficient ? 'كافٍ للـ MOQ' : 'تحت الحد الأدنى'}
                    </div>
                  </td>
                  <td className="font-mono-num px-3 py-3 font-semibold text-slate-900">
                    {formatMoney(s.unitCostUsd, s.input.currency, s.input.fxRate)}
                  </td>
                  <td className="font-mono-num px-3 py-3 font-semibold text-teal-800">
                    {formatMoney(s.suggestedRetailUsd, s.input.currency, s.input.fxRate)}
                  </td>
                  <td className="font-mono-num px-3 py-3 text-slate-800">
                    <div className="font-semibold">{s.grossMarginPct.toFixed(1)}% إجمالي</div>
                    <div className="mt-0.5 text-[11px] text-slate-500">
                      ربح {formatMoney(s.grossProfitPerUnitUsd, s.input.currency, s.input.fxRate)} · صافي {s.netMarginPct.toFixed(1)}%
                    </div>
                  </td>
                  <td className="font-mono-num px-3 py-3 text-slate-800">
                    <div>{s.possibleUnits} قطعة</div>
                    <div className="mt-0.5 text-[11px] text-slate-500">
                      تعادل: {s.breakEvenUnits} قطعة
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          onLoadScenario(s.input);
                          onGoToSimulator();
                        }}
                        aria-label={`فتح '${s.input.name}' في المحاكي`}
                        className="inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 whitespace-nowrap"
                      >
                        <ArrowUpLeft className="h-3 w-3" />
                        <span>فتح</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteScenario(s.id)}
                        aria-label={`حذف '${s.input.name}'`}
                        className="rounded border border-slate-200 p-1 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(loading || error || verdict) && (
        <div className="rounded-xl border border-teal-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-sm font-bold text-slate-900">
              المقارنة الاستراتيجية المرجعية بين السيناريوهات
            </h3>
            <span className="text-xs text-slate-500">تحليل مدعوم بمنظومة DoDo للمراجع</span>
          </div>

          {loading && (
            <div className="space-y-2 py-2">
              <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-4/5 animate-pulse rounded bg-slate-100" />
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              {error}
            </div>
          )}

          {!loading && verdict && (
            <div>
              <MarkdownView content={verdict} />
              {citations.length > 0 && (
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <div className="mb-1.5 text-xs font-semibold text-slate-600">
                    مراجع مساعدة مستشهد بها:
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
                    {citations.map((c) => (
                      <a
                        key={c.uri}
                        href={c.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-teal-700 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span className="max-w-[260px] truncate">{c.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
