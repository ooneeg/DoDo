import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Send,
  ExternalLink,
  Link2,
  Check,
  Compass,
  Trash2,
  Search,
  X,
  KeyRound,
  Palette,
  Sparkles,
  Wand2,
} from 'lucide-react';
import {
  SOURCE_CATEGORY_LABELS,
  TEXTILE_SOURCES,
  type SourceCategory,
} from '../data/sources';
import { formatMoney, type SimulationResult } from '../utils/simulator';
import type { BrandIdentityState } from '../utils/sessionContinuity';
import { MarkdownView } from './MarkdownView';
import { VisualExplanationPanel } from './VisualExplanationPanel';
import { LiveVoiceWidget } from './LiveVoiceWidget';

export interface CitationItem {
  title: string;
  uri: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  queryText?: string;
  citations?: CitationItem[];
  error?: boolean;
}

export const INITIAL_ADVISOR_WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    'أهلاً بك يا صديقي في **DoDo** — شريكك في بناء البراند من أول فكرة وقيمة مميزة في السوق (Value Propositions) لحد اللوجو والقطع على أرض الواقع.\n\nاحكِ لي عن فكرتك والناس اللي بتصنع لهم البراند، وهنسأل بعض أسئلة ذكية عشان نطلع سوا بـ **Value Propositions** قوية ومختلفة لبراندك، ثم نتفق على الاسم والقطع والديزاينز، ومع كود الجلسة نقدر نحفظ كل اتفاقنا ونكمل المرة الجاية من نفس النقطة!',
};

interface AdvisorViewProps {
  activeResult: SimulationResult;
  preselectedSourceIds: string[];
  prefilledQuestion: string;
  onClearPrefill: () => void;
  messages: ChatMessage[];
  onMessagesChange: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  brand: BrandIdentityState;
  onUpdateBrand: (next: BrandIdentityState) => void;
  sessionSummary: string;
  onOpenContinuity: (mode: 'export' | 'import') => void;
  onOpenStudio: () => void;
}

const LEARNING_PROMPTS = [
  {
    label: 'نبني سوا الـ Value Propositions لبراندك',
    prompt:
      'يا DoDo، أهم حاجة دلوقتي عايزين نتكلم سوا ونطلع بالـ Value Propositions للبراند بتاعي (My Value Propositions for my brand). اسألني الأسئلة الصح عن الجمهور المستهدف ومشكلة السوق الحالية عشان نصيغ قيمة فارقة قوية مرتبطة بأرقام المحاكي والقطع اللي هبدأ بيها.',
  },
  {
    label: 'فكّر معي في اسم براند وهوية بصرية',
    prompt:
      'يا DoDo، عايزين نفكر مع بعض في 5 أسماء براند قوية وعصرية تناسب مجالي في المحاكي، مع اقتراح فكرة اللوجو والألوان والقطع اللي نبدأ بيها في الدروب الأول.',
  },
  {
    label: 'نتفق على القطع والديزاينز الأولى',
    prompt:
      'ساعدني نتفق على أول 3 قطع نبدأ بيهم البراند (النوع، وزن القماش GSM، أماكن الطباعة أو التطريز، وتكلفة كل قطعة تقريباً) بحيث تناسب طريقة التشغيل المختارة في المحاكي.',
  },
  {
    label: 'فهم الصناعة من الصفر للعالمية',
    prompt:
      'اشرح لي خريطة صناعة الملابس خطوة بخطوة: من الألياف والغزل (CottonWorks / Rieter) إلى الباترون والـ 3D (CLO 3D / Lectra) والتصنيع والـ AQL (Textile Learner) حتى التصدير العالمي (ITC / AAFA / OEKO-TEX).',
  },
  {
    label: 'خطة بداية قوية بأرقامي الحالية',
    prompt:
      'بناءً على تفاصيل البداية الخاصة بي في المحاكي، أعطني أقوى خطة واقتراحات تنفيذية لاختيار الخامة والمصنع والإكسسوارات (YKK / Coats) وتسريع نقطة التعادل.',
  },
  {
    label: 'مكاتب الجملة أم المصانع؟ (حسب موقعي)',
    prompt:
      'قارن لي عملياً بين البداية من مكاتب الجملة (بدون شراء خامات) أو White-Label مقابل التصنيع من الصفر (شراء خامة + CMT/FOB)، وما أفضل الأماكن والأسعار التقريبية حسب موقعي الحالي؟',
  },
];

export const AdvisorView: React.FC<AdvisorViewProps> = ({
  activeResult,
  preselectedSourceIds,
  prefilledQuestion,
  onClearPrefill,
  messages,
  onMessagesChange,
  brand,
  onUpdateBrand,
  sessionSummary,
  onOpenContinuity,
  onOpenStudio,
}) => {
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>(preselectedSourceIds);
  const [pickerCategory, setPickerCategory] = useState<SourceCategory | 'core16' | 'all'>('core16');
  const [pickerQuery, setPickerQuery] = useState('');
  const [includeSimulatorContext, setIncludeSimulatorContext] = useState(true);
  const [targetUrl, setTargetUrl] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  const [extractingVp, setExtractingVp] = useState(false);
  const [vpExtractError, setVpExtractError] = useState<string | null>(null);
  const [vpExtractedNote, setVpExtractedNote] = useState<string | null>(null);
  const [extractedVpOptions, setExtractedVpOptions] = useState<
    Array<{
      titleAr: string;
      angleAr: string;
      targetAudience: string;
      customerPain: string;
      uniquePromise: string;
      proofPillars: string[];
      positioningStatement: string;
    }>
  >([]);
  const [vpAppliedBanner, setVpAppliedBanner] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (preselectedSourceIds.length > 0) {
      setSelectedSourceIds(preselectedSourceIds);
    }
  }, [preselectedSourceIds]);

  useEffect(() => {
    if (prefilledQuestion) {
      setInputValue(prefilledQuestion);
      onClearPrefill();
    }
  }, [prefilledQuestion, onClearPrefill]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const pickerSources = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    return TEXTILE_SOURCES.filter((s) => {
      if (q) {
        return (
          s.name.toLowerCase().includes(q) ||
          s.shortName.toLowerCase().includes(q) ||
          s.categoryLabelAr.toLowerCase().includes(q)
        );
      }
      if (pickerCategory === 'core16') return Boolean(s.isCore16);
      if (pickerCategory === 'all') return true;
      return s.category === pickerCategory;
    }).slice(0, 20);
  }, [pickerCategory, pickerQuery]);

  const toggleSource = (id: string) => {
    setSelectedSourceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const sendMessage = async (questionText?: string) => {
    const q = (questionText ?? inputValue).trim();
    if (!q || loading) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: q,
    };

    onMessagesChange((prev) => [...prev, userMsg]);
    if (!questionText) setInputValue('');
    setLoading(true);

    try {
      const scenarioContext = includeSimulatorContext
        ? {
            scenarioName: activeResult.input.name,
            capital: formatMoney(
              activeResult.capitalUsd,
              activeResult.input.currency,
              activeResult.input.fxRate
            ),
            location: activeResult.locationLabelAr,
            market: activeResult.marketLabelAr,
            category: activeResult.categoryLabelAr,
            fabric: activeResult.requiresRawFabric
              ? `${activeResult.fabricLabelAr} (${activeResult.input.gsm} GSM)`
              : 'بدون شراء خامة (شراء قطعة جاهزة / بلانك)',
            requiresRawFabric: activeResult.requiresRawFabric,
            sourcingOrigin:
              activeResult.input.sourcingOrigin === 'local' ? 'توريد محلي' : 'استيراد مباشر',
            manufacturingModel: activeResult.mfgLabelAr,
            skuCount: activeResult.input.skuCount,
            unitCost: formatMoney(
              activeResult.unitCostUsd,
              activeResult.input.currency,
              activeResult.input.fxRate
            ),
            suggestedPrice: formatMoney(
              activeResult.suggestedRetailUsd,
              activeResult.input.currency,
              activeResult.input.fxRate
            ),
            grossProfitPerUnit: formatMoney(
              activeResult.grossProfitPerUnitUsd,
              activeResult.input.currency,
              activeResult.input.fxRate
            ),
            netProfitPerUnit: formatMoney(
              activeResult.netProfitPerUnitUsd,
              activeResult.input.currency,
              activeResult.input.fxRate
            ),
            grossMarginPct: Number(activeResult.grossMarginPct.toFixed(1)),
            netMarginPct: Number(activeResult.netMarginPct.toFixed(1)),
            possibleUnits: activeResult.possibleUnits,
            breakEvenUnits: activeResult.breakEvenUnits,
            capitalSufficient: activeResult.capitalSufficient,
            localPriceBenchmarks: activeResult.localGuide.priceBenchmarksAr,
          }
        : null;

      const historyPayload = messages
        .filter((m) => m.id !== 'welcome' && !m.error)
        .slice(-8)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          sourceIds: selectedSourceIds,
          targetUrl: targetUrl.trim() || undefined,
          scenarioContext,
          brandContext: brand,
          sessionMemory: sessionSummary || undefined,
          history: historyPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'تعذر الاتصال بخدمة التحليل.');
      }

      const botMsg: ChatMessage = {
        id: `a_${Date.now()}`,
        role: 'assistant',
        content: data.text,
        queryText: q,
        citations: Array.isArray(data.citations) ? data.citations : [],
      };
      onMessagesChange((prev) => [...prev, botMsg]);
    } catch (err) {
      onMessagesChange((prev) => [
        ...prev,
        {
          id: `e_${Date.now()}`,
          role: 'assistant',
          content: err instanceof Error ? err.message : 'حدث خطأ أثناء معالجة السؤال.',
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleExtractValuePropsFromChat = async () => {
    setExtractingVp(true);
    setVpExtractError(null);
    setVpAppliedBanner(null);
    try {
      const historyPayload = messages
        .filter((m) => m.id !== 'welcome' && !m.error)
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/studio/value-propositions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: historyPayload.length > 0 ? 'extract_from_chat' : 'generate',
          brand,
          recentMessages: historyPayload,
          scenarioContext: {
            category: activeResult.categoryLabelAr,
            mfgModel: activeResult.mfgLabelAr,
            location: activeResult.locationLabelAr,
            unitCost: activeResult.unitCostUsd,
            suggestedRetail: activeResult.suggestedRetailUsd,
            grossMarginPct: Number(activeResult.grossMarginPct.toFixed(1)),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'تعذر استخراج الـ Value Propositions من المحادثة.');
      }
      setVpExtractedNote(data.strategicNoteAr || null);
      setExtractedVpOptions(Array.isArray(data.options) ? data.options : []);
    } catch (err) {
      setVpExtractError(err instanceof Error ? err.message : 'تعذر الاتصال بالمساعد.');
    } finally {
      setExtractingVp(false);
    }
  };

  const selectedSourcesObjects = useMemo(
    () => TEXTILE_SOURCES.filter((s) => selectedSourceIds.includes(s.id)),
    [selectedSourceIds]
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
      {/* Scope, Live Voice & Learning Tracks Sidebar */}
      <aside className="lg:col-span-4 rounded-2xl border border-teal-900/12 bg-gradient-to-b from-[#edf8f5] via-white to-[#fdf8ee] p-5 space-y-4 shadow-xs">
        <LiveVoiceWidget />

        <div className="border-t border-slate-200/70 pt-3">
          <h2 className="text-base font-bold text-slate-900">توجيه المراجع ومحاور التعلّم</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            اختر مراجع محددة من المنظومة أو اتركها تلقائية حسب حديثك مع DoDo.
          </p>
        </div>

        <div>
          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={includeSimulatorContext}
              onChange={(e) => setIncludeSimulatorContext(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
            />
            <span>ربط الحديث بخطتك ({activeResult.input.name}) وهوية ({brand.brandName})</span>
          </label>
        </div>

        <div>
          <label
            htmlFor="advisor-url"
            className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-700"
          >
            <Link2 className="h-3.5 w-3.5 text-slate-500" />
            <span>رابط صفحة أو مقال محدد للشرح والتطبيق (اختياري)</span>
          </label>
          <input
            id="advisor-url"
            type="url"
            dir="ltr"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="https://www.cottonworks.com/..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Selected Sources Summary */}
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-700">
              المراجع المحددة ({selectedSourceIds.length === 0 ? 'تلقائي من المنظومة' : selectedSourceIds.length})
            </span>
            {selectedSourceIds.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedSourceIds([])}
                className="text-xs font-medium text-teal-700 hover:underline whitespace-nowrap shrink-0"
              >
                رجوع للتلقائي
              </button>
            )}
          </div>

          {selectedSourcesObjects.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {selectedSourcesObjects.map((src) => (
                <button
                  key={src.id}
                  type="button"
                  onClick={() => toggleSource(src.id)}
                  className="inline-flex items-center gap-1 rounded-md bg-teal-700 px-2 py-1 text-[11px] font-medium text-white hover:bg-teal-800"
                >
                  <span>{src.shortName}</span>
                  <X className="h-3 w-3" />
                </button>
              ))}
            </div>
          )}

          {/* Category + Search Picker */}
          <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/70 p-2.5">
            <div className="grid grid-cols-2 gap-1.5">
              <select
                aria-label="تصفية فئة المراجع"
                value={pickerCategory}
                onChange={(e) =>
                  setPickerCategory(e.target.value as SourceCategory | 'core16' | 'all')
                }
                className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-800 focus:border-teal-600 focus:outline-none"
              >
                {(Object.keys(SOURCE_CATEGORY_LABELS) as Array<SourceCategory | 'all' | 'core16'>).map(
                  (k) => (
                    <option key={k} value={k}>
                      {SOURCE_CATEGORY_LABELS[k]}
                    </option>
                  )
                )}
              </select>
              <div className="relative">
                <Search className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  aria-label="ابحث في المراجع لاختيارها"
                  value={pickerQuery}
                  onChange={(e) => setPickerQuery(e.target.value)}
                  placeholder="بحث مرجع..."
                  className="w-full rounded-md border border-slate-200 bg-white py-1.5 pr-6 pl-2 text-[11px] text-slate-900 focus:border-teal-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {pickerSources.map((src) => {
                const active = selectedSourceIds.includes(src.id);
                return (
                  <button
                    key={src.id}
                    type="button"
                    onClick={() => toggleSource(src.id)}
                    className={`flex items-center justify-between gap-1 rounded-md px-2 py-1.5 text-right text-[11px] transition-colors ${
                      active
                        ? 'bg-teal-700 font-semibold text-white'
                        : 'border border-slate-200/80 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="truncate">{src.shortName}</span>
                    {active && <Check className="h-3 w-3 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-3">
          <div className="mb-2 text-xs font-semibold text-slate-700">ابدأ حواراً سريعاً مع صديقك:</div>
          <div className="space-y-1.5">
            {LEARNING_PROMPTS.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => sendMessage(item.prompt)}
                disabled={loading}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-right text-xs font-medium text-slate-800 transition-colors hover:border-teal-600 hover:bg-white disabled:opacity-50"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Chat Workspace */}
      <section className="lg:col-span-8 flex flex-col rounded-2xl border border-teal-900/15 bg-white shadow-xs overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-teal-900/10 bg-gradient-to-l from-teal-950 via-slate-900 to-teal-900 px-5 py-3.5 text-white">
          <div>
            <h2 className="text-base font-bold text-white">
              صديقك DoDo — لبناء البراند والقطع والقرارات
            </h2>
            <p className="text-xs text-teal-100/85">
              اسم البراند، القطع والديزاينز، الخامات، ومقارنة مكاتب الجملة بالمصانع مع حفظ ذاكرة الجلسة
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => onOpenContinuity('import')}
              className="inline-flex items-center gap-1 rounded-lg border border-white/25 bg-white/10 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-white/20 whitespace-nowrap"
            >
              <KeyRound className="h-3.5 w-3.5 text-amber-300" />
              <span>استرجاع كود</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenContinuity('export')}
              className="inline-flex items-center gap-1 rounded-lg bg-amber-400 px-2.5 py-1.5 text-[11px] font-bold text-slate-950 hover:bg-amber-300 whitespace-nowrap"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>حفظ كود الجلسة</span>
            </button>
            {messages.length > 1 && (
              <button
                type="button"
                onClick={() => onMessagesChange([INITIAL_ADVISOR_WELCOME])}
                className="inline-flex items-center gap-1 rounded-lg border border-white/25 bg-white/10 px-2.5 py-1.5 text-[11px] text-white hover:bg-white/20 whitespace-nowrap shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>محادثة جديدة</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Continuity Memory & Value Proposition Strip */}
        <div className="border-b border-teal-100 bg-teal-50/70 px-4 py-2.5 space-y-2 text-[11px]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-teal-950 min-w-0">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-600" />
              <span className="truncate">
                <strong>البراند الحالي:</strong> {brand.brandName} ·{' '}
                {sessionSummary
                  ? `الذاكرة المسترجعة: ${sessionSummary}`
                  : `القطع: ${brand.agreedGarments.length} قطع متفق عليها`}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleExtractValuePropsFromChat}
                disabled={extractingVp}
                className="inline-flex items-center gap-1 rounded-md bg-teal-700 px-2.5 py-1 font-bold text-white hover:bg-teal-800 transition-colors whitespace-nowrap disabled:opacity-60"
              >
                <Wand2 className="h-3 w-3" />
                <span>
                  {extractingVp
                    ? 'جاري الاستخراج...'
                    : 'استخرج الـ Value Propositions من نقاشنا'}
                </span>
              </button>
              <button
                type="button"
                onClick={onOpenStudio}
                className="inline-flex items-center gap-1 rounded-md border border-teal-300 bg-white px-2.5 py-1 font-bold text-teal-900 hover:bg-teal-700 hover:text-white transition-colors whitespace-nowrap"
              >
                <Palette className="h-3 w-3" />
                <span>استوديو البراند</span>
              </button>
            </div>
          </div>

          {brand.valueProposition?.positioningStatement && (
            <div className="flex items-start gap-1.5 rounded-lg border border-teal-200/80 bg-white/90 px-3 py-1.5 text-slate-800">
              <Compass className="h-3.5 w-3.5 text-teal-700 shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                <strong className="text-teal-950">Value Proposition الحالية: </strong>
                {brand.valueProposition.positioningStatement}
              </span>
            </div>
          )}

          {vpExtractError && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-amber-950">
              {vpExtractError}
            </div>
          )}

          {vpAppliedBanner && (
            <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 font-semibold text-emerald-950">
              {vpAppliedBanner}
            </div>
          )}

          {extractedVpOptions.length > 0 && (
            <div className="rounded-xl border border-teal-200 bg-white p-3 space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-teal-950">
                  {vpExtractedNote || 'مقترحات Value Propositions المستخلصة لبراندك:'}
                </span>
                <button
                  type="button"
                  onClick={() => setExtractedVpOptions([])}
                  aria-label="إغلاق مقترحات القيمة المقترحة"
                  className="text-slate-500 hover:text-slate-800"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                {extractedVpOptions.map((opt, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col justify-between rounded-lg border border-slate-200 bg-slate-50/70 p-2.5 space-y-2"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-teal-900">{opt.titleAr}</div>
                      <div className="text-[10px] text-amber-800 font-medium">{opt.angleAr}</div>
                      <p className="text-[11px] text-slate-800 leading-relaxed">
                        {opt.positioningStatement}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateBrand({
                          ...brand,
                          valueProposition: {
                            targetAudience: opt.targetAudience,
                            customerPain: opt.customerPain,
                            uniquePromise: opt.uniquePromise,
                            proofPillars: (opt.proofPillars || []).slice(0, 5),
                            positioningStatement: opt.positioningStatement,
                          },
                        });
                        setVpAppliedBanner(
                          `تم اعتماد وحفظ «${opt.titleAr}» كـ Value Proposition لبراند ${brand.brandName}!`
                        );
                        setExtractedVpOptions([]);
                      }}
                      className="inline-flex w-full items-center justify-center gap-1 rounded-md bg-teal-700 px-2.5 py-1.5 font-bold text-white hover:bg-teal-800"
                    >
                      <Check className="h-3 w-3" />
                      <span>اعتماد وحفظ لبراندك</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div ref={scrollRef} className="h-[500px] space-y-4 overflow-y-auto p-5 bg-slate-50/40">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[90%] rounded-xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-slate-900 text-white text-sm leading-relaxed'
                    : msg.error
                      ? 'border border-red-200 bg-red-50 text-red-800 text-sm'
                      : 'border border-slate-200 bg-white text-slate-800'
                }`}
              >
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div>
                    <MarkdownView content={msg.content} />
                    {msg.id !== 'welcome' && !msg.error && (
                      <VisualExplanationPanel
                        queryText={msg.queryText || ''}
                        answerText={msg.content}
                        citations={msg.citations}
                      />
                    )}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 border-t border-slate-100 pt-2.5">
                        <div className="mb-1 text-[11px] font-semibold text-slate-500">
                          المراجع المساعدة المستعان بها:
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                          {msg.citations.map((c) => (
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
            </div>
          ))}

          {loading && (
            <div className="flex justify-end">
              <div className="w-2/3 rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                <div className="text-xs font-medium text-teal-700">
                  DoDo يبحث في مراجع الصناعة ويصيغ لك الاقتراحات والأفكار...
                </div>
                <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-4/5 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex items-center gap-2.5 border-t border-slate-100 p-4 bg-white rounded-b-xl"
        >
          <input
            type="text"
            aria-label="اكتب لـ DoDo لفهم المجال أو الاتفاق على اسم البراند والقطع"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="احكِ لـ DoDo فكرتك أو اسأل عن اسم البراند، القطع، الأقمشة، أو الأسعار..."
            className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !inputValue.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800 disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            <Send className="h-4 w-4" />
            <span>إرسال</span>
          </button>
        </form>
      </section>
    </div>
  );
};

