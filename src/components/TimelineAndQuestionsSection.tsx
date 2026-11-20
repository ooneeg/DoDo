import React, { useMemo, useState } from 'react';
import {
  CalendarClock,
  HelpCircle,
  GitBranch,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { formatMoney, type SimulationResult } from '../utils/simulator';
import {
  SIMULATION_QUESTIONS,
  calculateTimelineProjection,
  searchApparelConcepts,
  type DiagnosticAnswers,
  type TimeHorizon,
} from '../utils/timeline';

interface TimelineAndQuestionsSectionProps {
  result: SimulationResult;
  answers: DiagnosticAnswers;
  activeHorizon: TimeHorizon;
  onChangeAnswer: <K extends keyof DiagnosticAnswers>(
    key: K,
    value: DiagnosticAnswers[K]
  ) => void;
  onChangeHorizon: (horizon: TimeHorizon) => void;
  onAskDoDo: (question: string) => void;
}

export const TimelineAndQuestionsSection: React.FC<TimelineAndQuestionsSectionProps> = ({
  result,
  answers,
  activeHorizon,
  onChangeAnswer,
  onChangeHorizon,
  onAskDoDo,
}) => {
  const [expandedExplainId, setExpandedExplainId] = useState<string | null>(null);
  const [conceptQuery, setConceptQuery] = useState('');
  const [showConceptDrawer, setShowConceptDrawer] = useState(false);

  const timeline = useMemo(
    () => calculateTimelineProjection(result, answers, activeHorizon),
    [result, answers, activeHorizon]
  );

  const conceptMatches = useMemo(() => searchApparelConcepts(conceptQuery), [conceptQuery]);

  const maxProjectedUnits = useMemo(
    () => Math.max(1, ...timeline.allHorizons.map((h) => h.unitsSold)),
    [timeline.allHorizons]
  );

  const snap = timeline.activeSnapshot;
  const currency = result.input.currency;
  const fxRate = result.input.fxRate;

  return (
    <div className="space-y-5">
      {/* Interactive Time-Horizon Simulation Panel */}
      <div className="overflow-hidden rounded-2xl border border-teal-900/15 bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white shadow-sm">
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold">
                <CalendarClock className="h-4 w-4" />
                <span>محاكاة التوقيت والتدفق الزمني (تتفاعل فوراً مع إجاباتك بالأسفل)</span>
              </div>
              <h3 className="mt-1 text-base font-bold text-white sm:text-lg">
                ماذا سيحدث لمشروعك {snap.labelAr}؟
              </h3>
              <p className="mt-0.5 text-xs text-teal-100/80">
                الوصول لنقطة التعادل المتوقع: {timeline.estimatedBreakEvenLabelAr} · معدل العائد حسب
                طريقتك ({result.mfgLabelAr})
              </p>
            </div>

            {/* Interactive Horizon Switcher */}
            <div
              role="tablist"
              aria-label="الفترة الزمنية للمحاكاة"
              className="flex flex-wrap items-center gap-1 rounded-xl bg-white/10 p-1 backdrop-blur-xs"
            >
              {timeline.allHorizons.map((h) => {
                const active = h.horizon === activeHorizon;
                return (
                  <button
                    key={h.horizon}
                    role="tab"
                    type="button"
                    aria-selected={active}
                    onClick={() => onChangeHorizon(h.horizon)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-amber-400 text-slate-950 shadow-xs'
                        : 'text-teal-100 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {h.labelAr}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Horizon Trajectory Bars (click any period to jump) */}
          <div className="mt-4 grid grid-cols-5 gap-2">
            {timeline.allHorizons.map((h) => {
              const active = h.horizon === activeHorizon;
              const heightPct =
                h.unitsSold === 0 ? 8 : Math.max(14, Math.round((h.unitsSold / maxProjectedUnits) * 100));
              return (
                <button
                  key={h.horizon}
                  type="button"
                  onClick={() => onChangeHorizon(h.horizon)}
                  className={`group flex flex-col justify-end rounded-xl border p-2.5 text-right transition-all ${
                    active
                      ? 'border-amber-300/70 bg-white/12'
                      : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/8'
                  }`}
                >
                  <div className="mb-2 flex h-12 w-full items-end">
                    <div
                      className={`w-full rounded-t-md transition-all duration-300 ${
                        active ? 'bg-amber-400' : 'bg-teal-400/70 group-hover:bg-teal-300'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <div className="text-[11px] font-semibold text-teal-100 whitespace-nowrap truncate">
                    {h.labelAr}
                  </div>
                  <div className="font-mono-num mt-0.5 text-xs font-bold text-white">
                    {h.unitsSold.toLocaleString('en-US')} قطعة
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Horizon Metrics */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/8 p-3.5">
              <div className="text-[11px] text-teal-100/80">المبيعات المتوقعة ({snap.labelAr})</div>
              <div className="font-mono-num mt-1 text-lg font-bold text-white">
                {snap.unitsSold.toLocaleString('en-US')} قطعة
              </div>
              <div className="mt-0.5 text-[11px] text-amber-200 tabular-nums">
                مرتجعات تقديرية: {snap.estimatedReturnsUnits} قطعة
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/8 p-3.5">
              <div className="text-[11px] text-teal-100/80">إجمالي الإيرادات التراكمية</div>
              <div className="font-mono-num mt-1 text-lg font-bold text-amber-300">
                {formatMoney(snap.cumulativeRevenueUsd, currency, fxRate)}
              </div>
              <div className="mt-0.5 text-[11px] text-teal-100/75 tabular-nums">
                {snap.restockCycles} {snap.restockCycles === 1 ? 'دورة مخزون' : 'دورات إعادة شراء'}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/8 p-3.5">
              <div className="text-[11px] text-teal-100/80">الكاش المحصّل مقابل المعلّق</div>
              <div className="font-mono-num mt-1 text-lg font-bold text-emerald-300">
                {formatMoney(snap.cashCollectedUsd, currency, fxRate)}
              </div>
              <div className="mt-0.5 text-[11px] text-teal-100/75 tabular-nums">
                قيد التحصيل بالشحن: {formatMoney(snap.cashInTransitUsd, currency, fxRate)}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/8 p-3.5">
              <div className="text-[11px] text-teal-100/80">صافي العائد التراكمي</div>
              <div
                className={`font-mono-num mt-1 text-lg font-bold ${
                  snap.cumulativeNetCashUsd >= 0 ? 'text-emerald-300' : 'text-amber-200'
                }`}
              >
                {formatMoney(snap.cumulativeNetCashUsd, currency, fxRate)}
              </div>
              <div className="mt-0.5 text-[11px] text-teal-100/80">
                {snap.reachedBreakEven ? 'تجاوزت نقطة التعادل' : 'ما زلت في مرحلة التغطية'}
              </div>
            </div>
          </div>

          {/* Operational Narrative for Selected Horizon */}
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/6 p-4">
              <div className="mb-2 text-xs font-bold text-amber-300">{snap.headlineAr}</div>
              <ul className="space-y-1.5 text-xs leading-relaxed text-teal-50/90">
                {snap.whatHappensAr.map((line, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-amber-300/25 bg-amber-500/10 p-4">
              <div className="mb-2 text-xs font-bold text-amber-200">
                نقاط حاسمة لازم تنتبه لها في هذه الفترة:
              </div>
              <ul className="space-y-1.5 text-xs leading-relaxed text-amber-50/95">
                {snap.mustWatchOutAr.map((warn, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
                    <span>{warn}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Diagnostic Questions + Explain/Search + Undecided Branching */}
      <div className="rounded-2xl border border-teal-200 bg-white bg-gradient-to-b from-[#f1faf7] via-white to-[#fdf8ef] p-5 shadow-xs">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-teal-900/10 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              أسئلة من DoDo لضبط دقة المحاكاة الزمنية (والتفرع في اللي لسه محددتوش)
            </h3>
            <p className="mt-0.5 text-xs text-slate-600">
              كل إجابة بتحدّث أرقام الأسبوع والشهر والسنة فوق فوراً. لو سؤال مش واضح اضغط «مش فاهم؟» أو اختار «لسه محددتش» عشان نتناقش فيه.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowConceptDrawer((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-teal-700/30 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-900 transition-colors hover:bg-teal-100 whitespace-nowrap shrink-0"
          >
            <Search className="h-3.5 w-3.5 text-teal-700" />
            <span>دور على مصطلح أو حاجة مش فاهمها</span>
            {showConceptDrawer ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {/* Inline Concept Search & Learning Drawer */}
        {showConceptDrawer && (
          <div className="mb-5 rounded-xl border border-amber-300/70 bg-gradient-to-br from-amber-50/90 to-stone-50 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  aria-label="ابحث في مصطلحات المحاكاة والصناعة"
                  value={conceptQuery}
                  onChange={(e) => setConceptQuery(e.target.value)}
                  placeholder="اكتب أي مصطلح مش فاهمه (COD, MOQ, GSM, Tech Pack, AQL, CMT, White-Label...)"
                  className="w-full rounded-lg border border-amber-200 bg-white py-2 pr-9 pl-3 text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
                />
              </div>
              {conceptQuery.trim() && (
                <button
                  type="button"
                  onClick={() =>
                    onAskDoDo(`اشرح لي ببساطة وبأمثلة عملية ماذا يعني "${conceptQuery.trim()}" في صناعة الملابس وتأثيره على بدايتي؟`)
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 whitespace-nowrap shrink-0"
                >
                  <span>اسأل DoDo عن «{conceptQuery.trim()}»</span>
                  <ArrowLeft className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2.5 md:grid-cols-2">
              {conceptMatches.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-amber-200/80 bg-white/90 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900">{item.termAr}</span>
                    <span className="text-[11px] font-medium text-teal-800">{item.sourceRef}</span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-700">{item.meaningAr}</p>
                  <p className="mt-1 text-[11px] text-amber-900/90">مثال: {item.exampleAr}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unsettled Decisions Alert Banner */}
        {timeline.unsettledAlertsAr.length > 0 && (
          <div className="mb-4 rounded-xl border border-indigo-200 bg-gradient-to-l from-indigo-50/90 to-teal-50/70 p-3.5 text-xs text-slate-800">
            <span className="font-bold text-indigo-950">
              عندك {timeline.unsettledAlertsAr.length} نقاط لسه محددتهاش:
            </span>{' '}
            {timeline.unsettledAlertsAr.map((a) => a.titleAr).join(' · ')} — راجع التفرعات والنقاش المفتوح تحت كل نقطة لوضع خطة واضحة.
          </div>
        )}

        {/* 5 Interactive Questions */}
        <div className="space-y-4">
          {SIMULATION_QUESTIONS.map((q, idx) => {
            const currentVal = answers[q.id];
            const isUndecided = currentVal === 'undecided';
            const isExplainOpen = expandedExplainId === q.id;

            return (
              <div
                key={q.id}
                className={`rounded-xl border p-4 transition-colors ${
                  isUndecided
                    ? 'border-indigo-300 bg-indigo-50/40'
                    : 'border-slate-200/90 bg-white/90'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="text-[11px] font-semibold text-teal-800">
                      0{idx + 1}. {q.shortTitleAr}
                    </div>
                    <h4 className="mt-0.5 text-xs font-bold text-slate-900 sm:text-sm">
                      {q.questionAr}
                    </h4>
                  </div>

                  <button
                    type="button"
                    aria-expanded={isExplainOpen}
                    onClick={() => setExpandedExplainId(isExplainOpen ? null : q.id)}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      isExplainOpen
                        ? 'border-amber-400 bg-amber-100 text-amber-950'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-amber-300 hover:bg-amber-50'
                    }`}
                  >
                    <HelpCircle className="h-3.5 w-3.5 text-amber-700" />
                    <span>مش فاهم؟ افهم المقصود</span>
                  </button>
                </div>

                {/* Plain Explanation & Sources Drawer */}
                {isExplainOpen && (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/80 p-3.5 text-xs">
                    <div className="font-bold text-slate-900">المقصود بالجزء ده ببساطة:</div>
                    <p className="mt-1 leading-relaxed text-slate-700">{q.explainPlainAr}</p>
                    <p className="mt-1.5 leading-relaxed text-amber-950">
                      <span className="font-semibold">تأثيره على المحاكاة: </span>
                      {q.whyItMattersAr}
                    </p>
                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-amber-200/70 pt-2">
                      <span className="text-[11px] text-slate-600">
                        مراجع لفهم أعمق: {q.learnSources.join(' · ')}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          onAskDoDo(
                            `اشرح لي بالتفصيل "${q.shortTitleAr}": ${q.questionAr} وما المعايير العملية التي تنصحني بها حسب تفاصيل بدايتي؟`
                          )
                        }
                        className="font-semibold text-teal-800 hover:underline whitespace-nowrap"
                      >
                        اسأل DoDo يشرحها لي بأمثلة ←
                      </button>
                    </div>
                  </div>
                )}

                {/* Answer Choice Buttons */}
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {q.options.map((opt) => {
                    const selected = currentVal === opt.value;
                    const isBranchBtn = opt.value === 'undecided';
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() =>
                          onChangeAnswer(
                            q.id,
                            opt.value as DiagnosticAnswers[typeof q.id]
                          )
                        }
                        className={`flex flex-col items-start justify-between rounded-lg border p-2.5 text-right transition-all ${
                          selected
                            ? isBranchBtn
                              ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                              : 'border-teal-700 bg-teal-700 text-white shadow-xs'
                            : isBranchBtn
                              ? 'border-indigo-200 bg-indigo-50/70 text-indigo-950 hover:border-indigo-400'
                              : 'border-slate-200 bg-slate-50/70 text-slate-800 hover:border-teal-500 hover:bg-white'
                        }`}
                      >
                        <span className="text-xs font-semibold leading-snug">{opt.labelAr}</span>
                        <span
                          className={`mt-1 text-[10px] leading-snug ${
                            selected ? 'text-white/90' : 'text-slate-500'
                          }`}
                        >
                          {opt.effectNoteAr}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Branching Discussion Panel when User Picks "لسه محددتش" */}
                {isUndecided && (
                  <div className="mt-3 rounded-xl border border-indigo-200 bg-white p-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                      <GitBranch className="h-4 w-4 text-indigo-600" />
                      <span>تفرّع ونقاش حول: {q.shortTitleAr} (اللازم يتعمل دلوقتي)</span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-700">
                      {q.undecidedBranchAr.mustDoAr}
                    </p>

                    <div className="mt-3 grid grid-cols-1 gap-2.5 md:grid-cols-2">
                      {q.undecidedBranchAr.branches.map((branch) => (
                        <div
                          key={branch.titleAr}
                          className="flex flex-col justify-between rounded-lg border border-indigo-100 bg-indigo-50/50 p-3"
                        >
                          <div>
                            <div className="text-xs font-bold text-slate-900">{branch.titleAr}</div>
                            <p className="mt-1 text-[11px] leading-relaxed text-slate-700">
                              {branch.verdictAr}
                            </p>
                          </div>
                          <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-indigo-100 pt-2">
                            {branch.suggestedOptionValue && (
                              <button
                                type="button"
                                onClick={() =>
                                  onChangeAnswer(
                                    q.id,
                                    branch.suggestedOptionValue as DiagnosticAnswers[typeof q.id]
                                  )
                                }
                                className="rounded-md bg-teal-700 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-teal-800 whitespace-nowrap"
                              >
                                اعتمد المسار ده في المحاكاة
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onAskDoDo(branch.askPromptAr)}
                              className="text-[11px] font-semibold text-indigo-800 hover:underline whitespace-nowrap"
                            >
                              نتناقش فيها مع DoDo لايف ←
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
