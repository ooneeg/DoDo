import React, { useState } from 'react';
import {
  BookmarkPlus,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  RotateCcw,
  Send,
  Lightbulb,
} from 'lucide-react';
import {
  CATEGORY_CONFIG,
  DEFAULT_SCENARIO_INPUT,
  FABRIC_CONFIG,
  LOCATION_CONFIG,
  MARKET_CONFIG,
  MFG_CONFIG,
  VOLATILITY_CONFIG,
  formatMoney,
  type BrandCategory,
  type CurrencyCode,
  type FabricType,
  type FabricWeightGsm,
  type MacroVolatility,
  type ManufacturingModel,
  type MarketEnvironment,
  type OperatingLocation,
  type SalesChannel,
  type ScenarioInput,
  type SimulationResult,
  type SourcingOrigin,
} from '../utils/simulator';
import { MapPin, Layers, Calculator, ShieldCheck } from 'lucide-react';
import { MarkdownView } from './MarkdownView';
import { VisualExplanationPanel } from './VisualExplanationPanel';
import { TimelineAndQuestionsSection } from './TimelineAndQuestionsSection';
import { SourcingMapPanel } from './SourcingMapPanel';
import {
  DEFAULT_DIAGNOSTIC_ANSWERS,
  type DiagnosticAnswers,
  type TimeHorizon,
} from '../utils/timeline';

interface CitationItem {
  title: string;
  uri: string;
}

interface SimulatorViewProps {
  input: ScenarioInput;
  result: SimulationResult;
  onInputChange: (next: ScenarioInput) => void;
  onSaveScenario: (result: SimulationResult) => void;
  onAskSource: (sourceName: string) => void;
  onOpenFullAdvisor: (question?: string) => void;
}

export const SimulatorView: React.FC<SimulatorViewProps> = ({
  input,
  result,
  onInputChange,
  onSaveScenario,
  onAskSource,
  onOpenFullAdvisor,
}) => {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiCitations, setAiCitations] = useState<CitationItem[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  const [diagnosticAnswers, setDiagnosticAnswers] = useState<DiagnosticAnswers>(
    DEFAULT_DIAGNOSTIC_ANSWERS
  );
  const [activeHorizon, setActiveHorizon] = useState<TimeHorizon>('1m');

  const updateDiagnosticAnswer = <K extends keyof DiagnosticAnswers>(
    key: K,
    value: DiagnosticAnswers[K]
  ) => {
    setDiagnosticAnswers((prev) => ({ ...prev, [key]: value }));
  };

  // Inline Quick-Ask state inside Simulator so user can ask to learn apparel concepts immediately
  const [quickQuestion, setQuickQuestion] = useState('');
  const [lastQuickQuery, setLastQuickQuery] = useState('');
  const [quickAnswer, setQuickAnswer] = useState<string | null>(null);
  const [quickCitations, setQuickCitations] = useState<CitationItem[]>([]);
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickError, setQuickError] = useState<string | null>(null);

  const updateField = <K extends keyof ScenarioInput>(key: K, value: ScenarioInput[K]) => {
    if (key === 'currency' && value !== input.currency) {
      const fx = Math.max(1, Number(input.fxRate) || 50);
      const convertVal = (v?: number) => {
        if (!v || v <= 0) return undefined;
        return value === 'EGP' ? Math.round(v * fx) : Number((v / fx).toFixed(2));
      };
      onInputChange({
        ...input,
        currency: value as CurrencyCode,
        customUnitCost: convertVal(input.customUnitCost),
        customSellingPrice: convertVal(input.customSellingPrice),
      });
      return;
    }
    onInputChange({ ...input, [key]: value });
  };

  const adjustSellingPricePct = (factor: number) => {
    const currentDisplay =
      input.currency === 'EGP'
        ? result.suggestedRetailUsd * input.fxRate
        : result.suggestedRetailUsd;
    const nextPrice =
      input.currency === 'EGP'
        ? Math.max(1, Math.round(currentDisplay * factor))
        : Math.max(0.5, Number((currentDisplay * factor).toFixed(1)));
    updateField('customSellingPrice', nextPrice);
  };

  const handleSave = () => {
    onSaveScenario(result);
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 2400);
  };

  const handleReset = () => {
    onInputChange({ ...DEFAULT_SCENARIO_INPUT });
    setAiAnalysis(null);
    setAiCitations([]);
    setAiError(null);
  };

  const buildScenarioPayload = () => ({
    name: result.input.name,
    capitalFormatted: formatMoney(result.capitalUsd, input.currency, input.fxRate),
    capitalUsd: Math.round(result.capitalUsd),
    location: result.locationLabelAr,
    market: result.marketLabelAr,
    category: result.categoryLabelAr,
    fabric: result.requiresRawFabric ? result.fabricLabelAr : 'بدون شراء خامة (قطعة جاهزة / بلانك)',
    gsm: input.gsm,
    requiresRawFabric: result.requiresRawFabric,
    sourcingOrigin: input.sourcingOrigin === 'local' ? 'توريد محلي' : 'استيراد مباشر',
    manufacturingModel: result.mfgLabelAr,
    skuCount: result.input.skuCount,
    volatility: result.volatilityLabelAr,
    salesChannel: input.salesChannel,
    unitCostUsd: Number(result.unitCostUsd.toFixed(2)),
    unitCostFormatted: formatMoney(result.unitCostUsd, input.currency, input.fxRate),
    suggestedRetailUsd: Number(result.suggestedRetailUsd.toFixed(2)),
    sellingPriceFormatted: formatMoney(result.suggestedRetailUsd, input.currency, input.fxRate),
    grossProfitPerUnitFormatted: formatMoney(result.grossProfitPerUnitUsd, input.currency, input.fxRate),
    netProfitPerUnitFormatted: formatMoney(result.netProfitPerUnitUsd, input.currency, input.fxRate),
    grossMarginPct: Number(result.grossMarginPct.toFixed(1)),
    netMarginPct: Number(result.netMarginPct.toFixed(1)),
    markupPct: Number(result.markupPct.toFixed(0)),
    possibleUnits: result.possibleUnits,
    minRequiredUnits: result.minRequiredUnits,
    capitalSufficient: result.capitalSufficient,
    breakEvenUnits: result.breakEvenUnits,
    localPriceBenchmarks: result.localGuide.priceBenchmarksAr,
  });

  const handleDeepAnalysis = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const response = await fetch('/api/analyze-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: buildScenarioPayload() }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'تعذر إتمام التحليل.');
      }
      setAiAnalysis(data.text);
      setAiCitations(Array.isArray(data.citations) ? data.citations : []);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع أثناء التحليل.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleQuickAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = quickQuestion.trim();
    if (!q || quickLoading) return;
    setLastQuickQuery(q);
    setQuickLoading(true);
    setQuickError(null);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          scenarioContext: buildScenarioPayload(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'تعذر الحصول على إجابة.');
      }
      setQuickAnswer(data.text);
      setQuickCitations(Array.isArray(data.citations) ? data.citations : []);
    } catch (err) {
      setQuickError(err instanceof Error ? err.message : 'حدث خطأ أثناء الاتصال بالمستشار.');
    } finally {
      setQuickLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
      {/* Left Control Panel */}
      <section
        aria-label="مدخلات المحاكي"
        className="lg:col-span-4 rounded-2xl border border-teal-900/12 bg-white bg-gradient-to-b from-[#edf8f5] via-white to-[#fdf8ee] p-5 shadow-xs"
      >
        <div className="mb-4 flex items-center justify-between gap-2 border-b border-teal-900/10 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">تفاصيل البداية والبيئة</h2>
            <p className="text-xs text-slate-600">تتحدث الحسابات والمحاكاة الزمنية لحظياً</p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            title="إعادة ضبط القيم الافتراضية"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>إعادة ضبط</span>
          </button>
        </div>

        <div className="space-y-3.5">
          <div>
            <label htmlFor="sim-name" className="mb-1 block text-xs font-medium text-slate-700">
              اسم الفكرة / السيناريو
            </label>
            <input
              id="sim-name"
              type="text"
              value={input.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="col-span-2">
              <label htmlFor="sim-capital" className="mb-1 block text-xs font-medium text-slate-700">
                رأس المال المتاح
              </label>
              <input
                id="sim-capital"
                type="number"
                min={100}
                step={1000}
                value={input.capital}
                onChange={(e) => updateField('capital', Number(e.target.value) || 0)}
                className="font-mono-num w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="sim-currency" className="mb-1 block text-xs font-medium text-slate-700">
                العملة
              </label>
              <select
                id="sim-currency"
                value={input.currency}
                onChange={(e) => updateField('currency', e.target.value as CurrencyCode)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
              >
                <option value="EGP">جنيه (EGP)</option>
                <option value="USD">دولار (USD)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="sim-fx" className="mb-1 block text-xs font-medium text-slate-700">
                سعر الصرف (1$ = ؟ ج.م)
              </label>
              <input
                id="sim-fx"
                type="number"
                min={1}
                step={0.5}
                value={input.fxRate}
                onChange={(e) => updateField('fxRate', Number(e.target.value) || 50)}
                className="font-mono-num w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="sim-skus" className="mb-1 block text-xs font-medium text-slate-700">
                عدد الموديلات (SKUs)
              </label>
              <input
                id="sim-skus"
                type="number"
                min={1}
                max={40}
                value={input.skuCount}
                onChange={(e) => updateField('skuCount', Number(e.target.value) || 1)}
                className="font-mono-num w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="sim-location" className="mb-1 block text-xs font-medium text-slate-700">
              أنا فين حالياً (لتحديد الأماكن والأسعار)
            </label>
            <select
              id="sim-location"
              value={input.location}
              onChange={(e) => updateField('location', e.target.value as OperatingLocation)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
            >
              {Object.entries(LOCATION_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.labelAr}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="sim-market" className="mb-1 block text-xs font-medium text-slate-700">
              السوق المستهدف للبيع
            </label>
            <select
              id="sim-market"
              value={input.market}
              onChange={(e) => updateField('market', e.target.value as MarketEnvironment)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
            >
              {Object.entries(MARKET_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.labelAr}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="sim-category" className="mb-1 block text-xs font-medium text-slate-700">
              فئة البراند (Category)
            </label>
            <select
              id="sim-category"
              value={input.category}
              onChange={(e) => updateField('category', e.target.value as BrandCategory)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
            >
              {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.labelAr}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="sim-fabric" className="mb-1 block text-xs font-medium text-slate-700">
              الخامة الأساسية المتاحة
            </label>
            <select
              id="sim-fabric"
              value={input.fabric}
              onChange={(e) => updateField('fabric', e.target.value as FabricType)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
            >
              {Object.entries(FABRIC_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.labelAr}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="sim-gsm" className="mb-1 block text-xs font-medium text-slate-700">
                وزن القماش (GSM)
              </label>
              <select
                id="sim-gsm"
                value={input.gsm}
                onChange={(e) => updateField('gsm', Number(e.target.value) as FabricWeightGsm)}
                className="font-mono-num w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
              >
                <option value={160}>160 GSM (خفيف)</option>
                <option value={220}>220 GSM (متوسط)</option>
                <option value={300}>300 GSM (ثقيل)</option>
                <option value={380}>380 GSM (شتوي)</option>
              </select>
            </div>
            <div>
              <label htmlFor="sim-origin" className="mb-1 block text-xs font-medium text-slate-700">
                مصدر الخامة
              </label>
              <select
                id="sim-origin"
                value={input.sourcingOrigin}
                onChange={(e) => updateField('sourcingOrigin', e.target.value as SourcingOrigin)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
              >
                <option value="local">توريد محلي</option>
                <option value="imported">استيراد مباشر</option>
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-teal-200/80 bg-teal-50/50 p-3 space-y-2">
            <label htmlFor="sim-mfg" className="block text-xs font-bold text-teal-950">
              طريقة التشغيل (التصنيع المباشر / مكاتب الجملة / POD)
            </label>
            <select
              id="sim-mfg"
              value={input.mfgModel}
              onChange={(e) => updateField('mfgModel', e.target.value as ManufacturingModel)}
              className="w-full rounded-lg border border-teal-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-teal-600 focus:outline-none"
            >
              {Object.entries(MFG_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.labelAr}
                </option>
              ))}
            </select>
            <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] text-slate-700">
              <span>
                الالتزام المبدئي:{' '}
                <strong className="font-mono-num text-teal-900">
                  {formatMoney(result.upfrontCommitmentUsd, input.currency, input.fxRate)}
                </strong>
              </span>
              <span>
                صافي الهامش:{' '}
                <strong className="font-mono-num text-slate-900">
                  {result.netMarginPct.toFixed(1)}%
                </strong>
              </span>
            </div>
            <p className="text-[11px] leading-snug text-slate-600">
              {result.financialCommitmentSummaryAr}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="sim-channel" className="mb-1 block text-xs font-medium text-slate-700">
                قناة البيع
              </label>
              <select
                id="sim-channel"
                value={input.salesChannel}
                onChange={(e) => updateField('salesChannel', e.target.value as SalesChannel)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
              >
                <option value="dtc">متجر إلكتروني (DTC)</option>
                <option value="hybrid">هجين (DTC + B2B)</option>
                <option value="wholesale">جملة وبوتيكات (B2B)</option>
              </select>
            </div>
            <div>
              <label htmlFor="sim-vol" className="mb-1 block text-xs font-medium text-slate-700">
                تقلب السوق والصرف
              </label>
              <select
                id="sim-vol"
                value={input.volatility}
                onChange={(e) => updateField('volatility', e.target.value as MacroVolatility)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
              >
                {Object.entries(VOLATILITY_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.labelAr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-teal-200/80 bg-teal-50/45 p-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-teal-950">
                سعر القطعة والبيع (اختياري — لو عندك تسعير محدد)
              </span>
              {(result.isCustomUnitCost || result.isCustomSellingPrice) && (
                <button
                  type="button"
                  onClick={() =>
                    onInputChange({
                      ...input,
                      customUnitCost: undefined,
                      customSellingPrice: undefined,
                    })
                  }
                  className="text-[11px] font-semibold text-teal-800 hover:underline whitespace-nowrap"
                >
                  رجّع التلقائي
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="sim-unit-cost" className="mb-1 block text-[11px] font-medium text-slate-700">
                  تكلفة القطعة ({input.currency === 'EGP' ? 'ج.م' : '$'})
                </label>
                <input
                  id="sim-unit-cost"
                  type="number"
                  min={0}
                  step={input.currency === 'EGP' ? 10 : 0.5}
                  value={input.customUnitCost && input.customUnitCost > 0 ? input.customUnitCost : ''}
                  placeholder={`تلقائي: ${Math.round(
                    input.currency === 'EGP'
                      ? result.estimatedUnitCostUsd * input.fxRate
                      : result.estimatedUnitCostUsd
                  )}`}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    updateField('customUnitCost', val > 0 ? val : undefined);
                  }}
                  className="font-mono-num w-full rounded-lg border border-teal-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="sim-sell-price" className="mb-1 block text-[11px] font-medium text-slate-700">
                  هبيعها بكام ({input.currency === 'EGP' ? 'ج.م' : '$'})
                </label>
                <input
                  id="sim-sell-price"
                  type="number"
                  min={0}
                  step={input.currency === 'EGP' ? 25 : 1}
                  value={
                    input.customSellingPrice && input.customSellingPrice > 0
                      ? input.customSellingPrice
                      : ''
                  }
                  placeholder={`مقترح: ${Math.round(
                    input.currency === 'EGP'
                      ? result.estimatedSellingPriceUsd * input.fxRate
                      : result.estimatedSellingPriceUsd
                  )}`}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    updateField('customSellingPrice', val > 0 ? val : undefined);
                  }}
                  className="font-mono-num w-full rounded-lg border border-teal-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800 whitespace-nowrap"
            >
              <BookmarkPlus className="h-4 w-4" />
              <span>{savedNotice ? 'تم حفظ السيناريو في المقارنة' : 'حفظ الفكرة للمقارنة'}</span>
            </button>

            <button
              type="button"
              onClick={handleDeepAnalysis}
              disabled={aiLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 disabled:opacity-60 whitespace-nowrap"
            >
              <Sparkles className="h-4 w-4 text-teal-700" />
              <span>{aiLoading ? 'جاري تحليل خطتك بالمراجع...' : 'تحليل واقتراحات متقدمة من DoDo'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Right Results Workspace */}
      <section aria-label="نتائج المحاكاة وخارطة الطريق" className="lg:col-span-8 space-y-5">
        {/* Inline Ask-DoDo Learning & Guidance Bar */}
        <div className="rounded-2xl border border-teal-900/20 bg-gradient-to-l from-teal-950 via-slate-900 to-teal-900 p-4 text-white shadow-sm">
          <form onSubmit={handleQuickAsk} className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="quick-ask-input" className="text-sm font-bold text-white">
                اسأل DoDo لفهم مجال الملابس أو استشارة حول تفاصيل بدايتك
              </label>
              <button
                type="button"
                onClick={() => onOpenFullAdvisor(quickQuestion.trim() || undefined)}
                className="text-xs font-semibold text-amber-300 hover:underline whitespace-nowrap shrink-0"
              >
                فتح المحادثة الكاملة
              </button>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="quick-ask-input"
                type="text"
                value={quickQuestion}
                onChange={(e) => setQuickQuestion(e.target.value)}
                placeholder="مثال: ما الفرق بين غزل Combed وCarded؟ أو كيف أبدأ بـ 150 ألف جنيه من مكاتب الجملة؟"
                className="flex-1 rounded-lg border border-white/20 bg-white/95 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:border-amber-300 focus:bg-white focus:outline-none"
              />
              <button
                type="submit"
                disabled={quickLoading || !quickQuestion.trim()}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition-colors hover:bg-amber-300 disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                <Send className="h-4 w-4" />
                <span>{quickLoading ? 'جاري الإجابة...' : 'اسأل الآن'}</span>
              </button>
            </div>
          </form>

          {quickError && (
            <div className="mt-3 rounded-lg border border-red-300/40 bg-red-950/60 p-3 text-xs text-red-100">
              {quickError}
            </div>
          )}

          {quickLoading && (
            <div className="mt-3 space-y-2">
              <div className="h-3.5 w-3/4 animate-pulse rounded bg-white/15" />
              <div className="h-3.5 w-full animate-pulse rounded bg-white/15" />
            </div>
          )}

          {!quickLoading && quickAnswer && (
            <div className="mt-3 rounded-xl bg-white p-4 text-slate-900">
              <MarkdownView content={quickAnswer} />
              <VisualExplanationPanel
                queryText={lastQuickQuery}
                answerText={quickAnswer}
                citations={quickCitations}
                compact
              />
              {quickCitations.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-100 pt-2 text-xs">
                  {quickCitations.map((c) => (
                    <a
                      key={c.uri}
                      href={c.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-teal-700 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span className="max-w-[240px] truncate">{c.title}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status Banner */}
        <div
          className={`flex items-start gap-3 rounded-2xl border p-4 shadow-xs ${
            result.capitalSufficient
              ? 'border-emerald-300/80 bg-gradient-to-l from-emerald-50 to-teal-50/70 text-emerald-950'
              : 'border-amber-300 bg-gradient-to-l from-amber-50 to-orange-50/60 text-amber-950'
          }`}
        >
          {result.capitalSufficient ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
          ) : (
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          )}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
              <span>
                {result.capitalSufficient
                  ? 'رأس المال يغطي الحد الأدنى للتشغيل (MOQ)'
                  : 'تحذير طاقة رأس المال: الكمية أقل من الحد الأدنى للتشغيل'}
              </span>
              <span className="text-xs font-normal text-slate-600">·</span>
              <span className="font-mono-num text-xs font-medium text-slate-700">
                المتاح: {result.possibleUnits} قطعة / المطلوب: {result.minRequiredUnits} قطعة
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-700">{result.recommendedActionAr}</p>
          </div>
        </div>

        {/* Primary KPI Grid with Blended Tonal Surfaces */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white to-slate-100/80 p-4 shadow-xs">
            <div className="text-xs text-slate-600">تكلفة القطعة التقديرية</div>
            <div className="font-mono-num mt-1 text-xl font-bold text-slate-900">
              {formatMoney(result.unitCostUsd, input.currency, input.fxRate)}
            </div>
            <div className="mt-1 text-xs text-slate-600 tabular-nums">
              {result.requiresRawFabric
                ? `قماش ${formatMoney(result.unitFabricCostUsd, input.currency, input.fxRate)} · تشغيل ${formatMoney(result.unitMakeCostUsd, input.currency, input.fxRate)}`
                : `قطعة جاهزة ${formatMoney(result.unitMakeCostUsd, input.currency, input.fxRate)} · تجهيز ${formatMoney(result.unitTrimsPackagingUsd, input.currency, input.fxRate)}`}
            </div>
          </div>

          <div className="rounded-2xl border border-teal-200/90 bg-gradient-to-br from-teal-50/90 to-emerald-50/70 p-4 shadow-xs">
            <div className="text-xs text-teal-900">سعر البيع للقطعة</div>
            <div className="font-mono-num mt-1 text-xl font-bold text-teal-900">
              {formatMoney(result.suggestedRetailUsd, input.currency, input.fxRate)}
            </div>
            <div className="mt-1 text-xs text-teal-800/80 tabular-nums">
              هامش إجمالي {result.grossMarginPct.toFixed(1)}% · ربح {formatMoney(result.grossProfitPerUnitUsd, input.currency, input.fxRate)}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/80 to-stone-50 p-4 shadow-xs">
            <div className="text-xs text-amber-950">حجم الدفعة الأولى</div>
            <div className="font-mono-num mt-1 text-xl font-bold text-slate-900">
              {result.possibleUnits.toLocaleString('en-US')} قطعة
            </div>
            <div className="mt-1 text-xs text-slate-600 tabular-nums">
              ~{result.unitsPerSku} قطعة/موديل · مدة {result.leadTimeWeeks}
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/70 to-slate-50 p-4 shadow-xs">
            <div className="text-xs text-indigo-950">نقطة التعادل (Break-Even)</div>
            <div className="font-mono-num mt-1 text-xl font-bold text-slate-900">
              {result.breakEvenReachable
                ? `${result.breakEvenUnits.toLocaleString('en-US')} قطعة`
                : 'لا تتحقق'}
            </div>
            <div className="mt-1 text-xs text-slate-600 tabular-nums">
              صافي دورة متوقع:{' '}
              {formatMoney(result.projectedNetCycleProfitUsd, input.currency, input.fxRate)}
            </div>
          </div>
        </div>

        {/* Dedicated Per-Piece Unit Economics & Profit Margin Breakdown */}
        <div className="rounded-2xl border border-teal-200 bg-white bg-gradient-to-l from-white via-[#f3faf8] to-[#fdf8ef] p-5 shadow-xs">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-teal-900/10 pb-2.5">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-teal-700" />
              <h3 className="text-sm font-bold text-slate-900">
                حاسبة القطعة الواحدة وهامش الربح (تكلفة × سعر بيع × صافي ربح)
              </h3>
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-slate-600">اختبر تعديل سعر البيع:</span>
              <button
                type="button"
                onClick={() => adjustSellingPricePct(0.95)}
                className="rounded-md border border-slate-200 bg-white px-2 py-0.5 font-semibold text-slate-700 hover:border-amber-400 hover:bg-amber-50"
              >
                -5%
              </button>
              <button
                type="button"
                onClick={() => adjustSellingPricePct(1.05)}
                className="rounded-md border border-slate-200 bg-white px-2 py-0.5 font-semibold text-slate-700 hover:border-teal-500 hover:bg-teal-50"
              >
                +5%
              </button>
              {result.isCustomSellingPrice && (
                <button
                  type="button"
                  onClick={() => updateField('customSellingPrice', undefined)}
                  className="rounded-md border border-teal-200 bg-teal-50 px-2 py-0.5 font-semibold text-teal-900 hover:bg-teal-100"
                >
                  السعر المقترح
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-200/90 bg-white/95 p-3.5">
              <div className="flex items-center justify-between gap-1 text-[11px] font-medium text-slate-500">
                <span>1. تكلفة القطعة الواحدة</span>
                {result.isCustomUnitCost && (
                  <span className="text-teal-700 font-semibold">سعرك المخصص</span>
                )}
              </div>
              <div className="font-mono-num mt-1 text-lg font-bold text-slate-900">
                {formatMoney(result.unitCostUsd, input.currency, input.fxRate)}
              </div>
              <p className="mt-1 text-[11px] leading-snug text-slate-600 tabular-nums">
                {result.isCustomUnitCost
                  ? `التقدير التلقائي لمسارك كان ${formatMoney(result.estimatedUnitCostUsd, input.currency, input.fxRate)}`
                  : result.requiresRawFabric
                    ? `خامة ${formatMoney(result.unitFabricCostUsd, input.currency, input.fxRate)} + تشغيل ${formatMoney(result.unitMakeCostUsd, input.currency, input.fxRate)} + إكسسوار وتغليف ${formatMoney(result.unitTrimsPackagingUsd, input.currency, input.fxRate)}`
                    : `قطعة جاهزة ${formatMoney(result.unitMakeCostUsd, input.currency, input.fxRate)} + تيكت وتغليف ${formatMoney(result.unitTrimsPackagingUsd, input.currency, input.fxRate)}`}
              </p>
            </div>

            <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-3.5">
              <div className="flex items-center justify-between gap-1 text-[11px] font-medium text-teal-900">
                <span>2. هتبيع القطعة بكام؟</span>
                <span className="font-semibold">
                  {result.isCustomSellingPrice ? 'سعرك المخصص' : 'مقترح السوق'}
                </span>
              </div>
              <div className="font-mono-num mt-1 text-lg font-bold text-teal-950">
                {formatMoney(result.suggestedRetailUsd, input.currency, input.fxRate)}
              </div>
              <p className="mt-1 text-[11px] leading-snug text-teal-900/80 tabular-nums">
                زيادة على التكلفة (Markup):{' '}
                {result.markupPct >= 0 ? `+${result.markupPct.toFixed(0)}%` : `${result.markupPct.toFixed(0)}%`}
              </p>
            </div>

            <div
              className={`rounded-xl border p-3.5 ${
                result.grossProfitPerUnitUsd > 0
                  ? 'border-emerald-200 bg-emerald-50/60'
                  : 'border-red-300 bg-red-50/70'
              }`}
            >
              <div className="text-[11px] font-medium text-slate-700">
                3. الربح الإجمالي وهامش القطعة
              </div>
              <div
                className={`font-mono-num mt-1 text-lg font-bold ${
                  result.grossProfitPerUnitUsd > 0 ? 'text-emerald-900' : 'text-red-700'
                }`}
              >
                {formatMoney(result.grossProfitPerUnitUsd, input.currency, input.fxRate)}
              </div>
              <p className="mt-1 text-[11px] leading-snug text-slate-700 tabular-nums">
                هامش الربح الإجمالي: <span className="font-bold">{result.grossMarginPct.toFixed(1)}%</span>
              </p>
            </div>

            <div
              className={`rounded-xl border p-3.5 ${
                result.netProfitPerUnitUsd > 0
                  ? 'border-amber-200 bg-amber-50/70'
                  : 'border-red-200 bg-red-50/60'
              }`}
            >
              <div className="text-[11px] font-medium text-amber-950">
                4. صافي ربح القطعة الحقيقي
              </div>
              <div
                className={`font-mono-num mt-1 text-lg font-bold ${
                  result.netProfitPerUnitUsd > 0 ? 'text-slate-900' : 'text-red-700'
                }`}
              >
                {formatMoney(result.netProfitPerUnitUsd, input.currency, input.fxRate)}
              </div>
              <p className="mt-1 text-[11px] leading-snug text-slate-600 tabular-nums">
                هامش صافي <span className="font-bold">{result.netMarginPct.toFixed(1)}%</span> بعد تسويق{' '}
                {formatMoney(result.unitMarketingCostUsd, input.currency, input.fxRate)} وشحن/ثوابت{' '}
                {formatMoney(
                  result.unitFixedOverheadUsd + result.unitReturnShippingDragUsd,
                  input.currency,
                  input.fxRate
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Time-Horizon Simulation & Clarifying Q&A */}
        <TimelineAndQuestionsSection
          result={result}
          answers={diagnosticAnswers}
          activeHorizon={activeHorizon}
          onChangeAnswer={updateDiagnosticAnswer}
          onChangeHorizon={setActiveHorizon}
          onAskDoDo={(question) => onOpenFullAdvisor(question)}
        />

        {/* Operating Pathways Comparison for Current Capital */}
        <div className="rounded-2xl border border-teal-200 bg-white bg-gradient-to-b from-white to-[#f3faf8] p-5 shadow-xs">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-teal-700" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  مقارنة طرق التشغيل: كيف يختلف هامش الربح والالتزامات المالية؟
                </h3>
                <p className="text-[11px] text-slate-600">
                  قارن بين التصنيع المباشر، مكاتب الجملة، والطباعة عند الطلب (POD) بنفس رأس مالك الحالي
                </p>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-900">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-700" />
              <span>التزام المسار الحالي: {formatMoney(result.upfrontCommitmentUsd, input.currency, input.fxRate)}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-right text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="px-2.5 py-2 font-semibold">طريقة التشغيل</th>
                  <th className="px-2.5 py-2 font-semibold">الالتزام المالي المبدئي</th>
                  <th className="px-2.5 py-2 font-semibold">تكلفة القطعة</th>
                  <th className="px-2.5 py-2 font-semibold">البيع والهامش (إجمالي / صافي)</th>
                  <th className="px-2.5 py-2 font-semibold">الكمية / MOQ</th>
                  <th className="px-2.5 py-2 font-semibold">مدة التجهيز</th>
                  <th className="px-2.5 py-2 font-semibold">اختيار</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.pathwayOptions.map((opt) => {
                  const isCurrent = opt.model === input.mfgModel;
                  return (
                    <tr
                      key={opt.model}
                      className={isCurrent ? 'bg-teal-50/70' : 'hover:bg-slate-50/70'}
                    >
                      <td className="px-2.5 py-2.5">
                        <div className="font-semibold text-slate-900">{opt.labelAr}</div>
                        <div className="mt-0.5 text-[11px] text-slate-500">{opt.shortTagAr}</div>
                      </td>
                      <td className="px-2.5 py-2.5">
                        <div className="font-mono-num font-bold text-slate-900 whitespace-nowrap">
                          {formatMoney(opt.upfrontCommitmentUsd, input.currency, input.fxRate)}
                        </div>
                        <div className="mt-0.5 max-w-[200px] text-[10px] leading-snug text-slate-600">
                          {opt.financialCommitmentAr}
                        </div>
                      </td>
                      <td className="font-mono-num px-2.5 py-2.5 font-semibold text-slate-900 whitespace-nowrap">
                        {formatMoney(opt.unitCostUsd, input.currency, input.fxRate)}
                      </td>
                      <td className="font-mono-num px-2.5 py-2.5 text-slate-800 whitespace-nowrap">
                        <div>{formatMoney(opt.suggestedRetailUsd, input.currency, input.fxRate)}</div>
                        <div className="text-[11px] text-teal-800 font-semibold">
                          إجمالي {opt.grossMarginPct.toFixed(1)}% · صافي {opt.netMarginPct.toFixed(1)}%
                        </div>
                      </td>
                      <td className="font-mono-num px-2.5 py-2.5 whitespace-nowrap">
                        <div className="font-medium text-slate-900">
                          {opt.possibleUnits.toLocaleString('en-US')} قطعة
                        </div>
                        <div
                          className={`text-[11px] ${
                            opt.capitalSufficient ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {opt.capitalSufficient
                            ? 'يغطي الـ MOQ'
                            : `يحتاج ${opt.minRequiredUnits} قطعة`}
                        </div>
                      </td>
                      <td className="px-2.5 py-2.5 text-slate-700 whitespace-nowrap">
                        {opt.leadTimeWeeks}
                      </td>
                      <td className="px-2.5 py-2.5 whitespace-nowrap">
                        {isCurrent ? (
                          <span className="text-[11px] font-bold text-teal-800">المسار الحالي</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => updateField('mfgModel', opt.model)}
                            aria-label={`تطبيق مسار ${opt.labelAr}`}
                            className="rounded border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-teal-600 hover:text-teal-800"
                          >
                            تطبيق
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Location-Tailored Places & Prices Guide */}
        <div className="rounded-2xl border border-amber-200 bg-white bg-gradient-to-b from-[#fefaf0] via-white to-[#f8f7f3] p-5 shadow-xs">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-amber-900/10 pb-2.5">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-amber-700" />
              <h3 className="text-sm font-bold text-slate-900">
                اقتراحات الأماكن والأسعار حسب موقعك: {result.localGuide.locationLabelAr}
              </h3>
            </div>
            <span className="text-xs text-slate-600">نطاقات أسعار استرشادية للبداية</span>
          </div>

          <p className="text-xs leading-relaxed text-slate-800">
            {result.localGuide.headlineAr}
          </p>
          <p className="mt-1.5 rounded-lg bg-amber-100/50 px-3 py-2 text-xs leading-relaxed text-slate-800 border border-amber-200/70">
            {result.localGuide.fabricOrWholesaleTipAr}
          </p>

          {/* Price Benchmarks Strip */}
          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200/90 bg-white/90 p-3">
              <div className="text-[11px] text-slate-500">سعر القماش التقريبي</div>
              <div className="font-mono-num mt-1 text-xs font-bold text-slate-900">
                {result.localGuide.priceBenchmarksAr.fabricPerKgOrMeterAr}
              </div>
              <div className="mt-0.5 text-[10px] text-slate-500">للكيلو / المتر</div>
            </div>
            <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-3">
              <div className="text-[11px] text-teal-900">قطعة جاهزة (مكاتب جملة)</div>
              <div className="font-mono-num mt-1 text-xs font-bold text-teal-900">
                {result.localGuide.priceBenchmarksAr.wholesaleReadyPieceAr}
              </div>
              <div className="mt-0.5 text-[10px] text-teal-800/80">بدون شراء خامات</div>
            </div>
            <div className="rounded-xl border border-slate-200/90 bg-white/90 p-3">
              <div className="text-[11px] text-slate-500">مصنعية تشغيل (CMT)</div>
              <div className="font-mono-num mt-1 text-xs font-bold text-slate-900">
                {result.localGuide.priceBenchmarksAr.cmtMakePerPieceAr}
              </div>
              <div className="mt-0.5 text-[10px] text-slate-500">قص وحياكة وتشطيب</div>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3">
              <div className="text-[11px] text-amber-950">سلم سعر البيع المقترح</div>
              <div className="font-mono-num mt-1 text-xs font-bold text-amber-950">
                {result.localGuide.priceBenchmarksAr.recommendedSellingRangeAr}
              </div>
              <div className="mt-0.5 text-[10px] text-amber-900/80">للمستهلك النهائي</div>
            </div>
          </div>

          {/* Local Spots Grid */}
          <div className="mt-3.5 grid grid-cols-1 gap-3 md:grid-cols-2">
            {result.localGuide.spots.map((spot) => (
              <div
                key={spot.zoneNameAr}
                className="rounded-xl border border-stone-200 bg-white/95 p-3.5 transition-colors hover:border-teal-400"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-900">{spot.zoneNameAr}</h4>
                  <span className="font-mono-num shrink-0 text-[11px] font-semibold text-teal-800">
                    {spot.priceGuideAr}
                  </span>
                </div>
                <div className="mt-1 text-[11px] font-medium text-slate-600">{spot.roleAr}</div>
                <p className="mt-1 text-[11px] text-slate-500">الأنسب لـ: {spot.bestForAr}</p>
              </div>
            ))}
          </div>

          <SourcingMapPanel
            activeLocation={input.location}
            requiresRawFabric={result.requiresRawFabric}
          />
        </div>

        {/* Strong Tailored Launch Suggestions based on Starting Details */}
        <div className="rounded-2xl border border-teal-200 bg-white bg-gradient-to-br from-white via-[#f3faf8] to-[#f2f4fd] p-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between gap-2 border-b border-teal-900/10 pb-2.5">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-teal-700" />
              <h3 className="text-sm font-bold text-slate-900">
                اقتراحات قوية مخصصة لتفاصيل بدايتك
              </h3>
            </div>
            <span className="text-xs text-slate-500">مبنية على موقعك ومسارك ورأس المال</span>
          </div>

          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            {result.strategicSuggestionsAr.map((item) => (
              <div
                key={item.titleAr}
                className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white/90 p-4 transition-colors hover:border-teal-400"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{item.titleAr}</h4>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-700">{item.detailAr}</p>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-slate-200/70 pt-2 text-[11px] text-slate-500">
                  <span>مراجع مساعدة:</span>
                  {item.references.map((ref, idx) => (
                    <React.Fragment key={ref}>
                      {idx > 0 && <span aria-hidden="true">·</span>}
                      <button
                        type="button"
                        onClick={() => onAskSource(ref)}
                        className="font-medium text-teal-700 hover:underline"
                      >
                        {ref}
                      </button>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live AI Analysis Output (when triggered) */}
        {(aiLoading || aiError || aiAnalysis) && (
          <div className="rounded-xl border border-teal-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-bold text-slate-900">
                التحليل الاستشاري المتقدم من DoDo
              </h3>
              <span className="text-xs text-slate-500">مستند إلى منظومة المراجع</span>
            </div>

            {aiLoading && (
              <div className="space-y-2.5 py-2">
                <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-slate-100" />
              </div>
            )}

            {aiError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                {aiError}
              </div>
            )}

            {!aiLoading && aiAnalysis && (
              <div>
                <MarkdownView content={aiAnalysis} />
                {aiCitations.length > 0 && (
                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <div className="mb-1.5 text-xs font-semibold text-slate-600">
                      مراجع وروابط ساعدت في هذا التحليل:
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
                      {aiCitations.map((c) => (
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

        {/* Budget Allocation + Costing Breakdown */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white bg-gradient-to-b from-white to-[#f3faf8] p-5 shadow-xs">
            <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-bold text-slate-900">توزيع رأس المال المقترح</h3>
              <span className="font-mono-num text-xs font-semibold text-slate-600">
                الإجمالي: {formatMoney(result.capitalUsd, input.currency, input.fxRate)}
              </span>
            </div>
            <div className="space-y-3">
              {result.budgetAllocations.map((line) => (
                <div key={line.key}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{line.labelAr}</span>
                    <span className="font-mono-num text-slate-900">
                      {formatMoney(line.amountUsd, input.currency, input.fxRate)} (
                      {line.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/70">
                    <div
                      className="h-full rounded-full bg-gradient-to-l from-teal-700 to-teal-500 transition-all duration-200"
                      style={{ width: `${Math.min(100, Math.max(2, line.percentage))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white bg-gradient-to-b from-white to-[#fdf8ef] p-5 shadow-xs">
            <h3 className="mb-3 border-b border-slate-100 pb-2.5 text-sm font-bold text-slate-900">
              التشخيص الفني والبيئي
            </h3>
            <ul className="space-y-2.5 text-xs leading-relaxed text-slate-700">
              {result.riskSummaryAr.map((note, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-600" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 4-Stage Global Scaling Roadmap */}
        <div className="rounded-2xl border border-teal-200 bg-white bg-gradient-to-b from-white to-[#f7f6f2] p-5 shadow-xs">
          <div className="mb-4 border-b border-slate-100 pb-2.5">
            <h3 className="text-sm font-bold text-slate-900">
              خارطة الطريق من الصفر إلى العالمية (مخصصة لمدخلاتك)
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              كل مرحلة مرتبطة بالمراجع والأدوات الأنسب لاتخاذ القرار الصحيح
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {result.roadmap.map((phase) => (
              <div
                key={phase.stepNumber}
                className="rounded-xl border border-teal-900/10 bg-white bg-gradient-to-br from-[#f2f9f7] via-white to-[#fdf8ef] p-4"
              >
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-teal-900">
                    0{phase.stepNumber}. {phase.titleAr}
                  </span>
                </div>
                <p className="mb-3 text-xs leading-relaxed text-slate-700">
                  {phase.descriptionAr}
                </p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
                  <span>المراجع المساعدة:</span>
                  {phase.recommendedSources.map((src, i) => (
                    <React.Fragment key={src}>
                      {i > 0 && <span aria-hidden="true">·</span>}
                      <button
                        type="button"
                        onClick={() => onAskSource(src)}
                        className="font-medium text-teal-700 underline-offset-2 hover:underline"
                      >
                        {src}
                      </button>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
