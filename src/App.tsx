import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { KeyRound, LogIn, LogOut, Sparkles } from 'lucide-react';
import {
  AdvisorView,
  INITIAL_ADVISOR_WELCOME,
  type ChatMessage,
} from './components/AdvisorView';
import { BrandStudioView } from './components/BrandStudioView';
import { CompareView } from './components/CompareView';
import { SessionContinuityModal } from './components/SessionContinuityModal';
import { SimulatorView } from './components/SimulatorView';
import { SourcesView } from './components/SourcesView';
import { TEXTILE_SOURCES, type TextileSource } from './data/sources';
import {
  auth,
  deleteScenarioFromCloud,
  ensureUserProfile,
  saveBrandSessionToCloud,
  saveScenarioToCloud,
  signInWithGoogle,
  signOutFirebase,
  subscribeUserBrandSessions,
  subscribeUserScenarios,
  type CloudBrandSessionRecord,
} from './firebase';
import {
  DEFAULT_BRAND_STATE,
  DEFAULT_VALUE_PROPOSITION,
  buildHumanSummaryAr,
  type BrandIdentityState,
  type SessionContinuitySnapshot,
} from './utils/sessionContinuity';
import {
  DEFAULT_SCENARIO_INPUT,
  DEFAULT_SEED_SCENARIOS,
  calculateSimulation,
  type ScenarioInput,
  type SimulationResult,
} from './utils/simulator';

type ActiveTab = 'simulator' | 'studio' | 'compare' | 'sources' | 'advisor';

const STORAGE_KEY = 'dodo_saved_scenarios_v1';
const BRAND_STORAGE_KEY = 'dodo_brand_state_v1';
const SUMMARY_STORAGE_KEY = 'dodo_session_summary_v1';
const MESSAGES_STORAGE_KEY = 'dodo_chat_messages_v1';

function loadInitialScenarios(): SimulationResult[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return DEFAULT_SEED_SCENARIOS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => {
        if (item && item.input && (!item.localGuide || !item.pathwayOptions)) {
          return calculateSimulation({
            ...DEFAULT_SCENARIO_INPUT,
            ...item.input,
            id: item.id || item.input.id,
          });
        }
        return item;
      });
    }
  } catch {
    // Fallback to seed scenarios if storage is unavailable
  }
  return DEFAULT_SEED_SCENARIOS;
}

function loadInitialBrandState(): BrandIdentityState {
  try {
    const raw = window.localStorage.getItem(BRAND_STORAGE_KEY);
    if (!raw) return DEFAULT_BRAND_STATE;
    const parsed = JSON.parse(raw) as Partial<BrandIdentityState>;
    return {
      ...DEFAULT_BRAND_STATE,
      ...parsed,
      palette:
        Array.isArray(parsed.palette) && parsed.palette.length === 3
          ? [parsed.palette[0], parsed.palette[1], parsed.palette[2]]
          : DEFAULT_BRAND_STATE.palette,
      sketchPathsSvg: Array.isArray(parsed.sketchPathsSvg)
        ? parsed.sketchPathsSvg
        : DEFAULT_BRAND_STATE.sketchPathsSvg,
      agreedGarments:
        Array.isArray(parsed.agreedGarments) && parsed.agreedGarments.length > 0
          ? parsed.agreedGarments
          : DEFAULT_BRAND_STATE.agreedGarments,
      valueProposition: parsed.valueProposition
        ? {
            ...DEFAULT_VALUE_PROPOSITION,
            ...parsed.valueProposition,
            proofPillars: Array.isArray(parsed.valueProposition.proofPillars)
              ? parsed.valueProposition.proofPillars
              : DEFAULT_VALUE_PROPOSITION.proofPillars,
          }
        : DEFAULT_VALUE_PROPOSITION,
    };
  } catch {
    return DEFAULT_BRAND_STATE;
  }
}

function loadInitialMessages(): ChatMessage[] {
  try {
    const raw = window.localStorage.getItem(MESSAGES_STORAGE_KEY);
    if (!raw) return [INITIAL_ADVISOR_WELCOME];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // Ignore storage read errors
  }
  return [INITIAL_ADVISOR_WELCOME];
}

function loadInitialSummary(): string {
  try {
    return window.localStorage.getItem(SUMMARY_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('simulator');
  const [simInput, setSimInput] = useState<ScenarioInput>(DEFAULT_SCENARIO_INPUT);
  const [savedScenarios, setSavedScenarios] = useState<SimulationResult[]>(loadInitialScenarios);
  const [brandState, setBrandState] = useState<BrandIdentityState>(loadInitialBrandState);
  const [sessionSummary, setSessionSummary] = useState<string>(loadInitialSummary);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(loadInitialMessages);

  const [preselectedSourceIds, setPreselectedSourceIds] = useState<string[]>([]);
  const [prefilledQuestion, setPrefilledQuestion] = useState('');

  const [continuityModal, setContinuityModal] = useState<{
    open: boolean;
    mode: 'export' | 'import';
  }>({ open: false, mode: 'export' });
  const [restoreToast, setRestoreToast] = useState<string | null>(null);

  // Google Maps Case A Quota Exceeded Banner State
  const [gmpQuotaExceeded, setGmpQuotaExceeded] = useState(false);

  // Firebase Auth & Firestore Cloud State
  const [user, setUser] = useState<User | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [cloudBrandSessions, setCloudBrandSessions] = useState<CloudBrandSessionRecord[]>([]);

  const currentResult = useMemo(() => calculateSimulation(simInput), [simInput]);

  useEffect(() => {
    const onQuotaExceeded = () => setGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuotaExceeded);
  }, []);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        try {
          await ensureUserProfile(nextUser);
        } catch {
          // Handled via Firebase logs
        }
      } else {
        setCloudBrandSessions([]);
      }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubScenarios = subscribeUserScenarios(user.uid, (cloudScenarios) => {
      if (cloudScenarios.length > 0) {
        setSavedScenarios(cloudScenarios);
      }
    });
    const unsubBrands = subscribeUserBrandSessions(user.uid, (sessions) => {
      setCloudBrandSessions(sessions);
    });
    return () => {
      unsubScenarios();
      unsubBrands();
    };
  }, [user]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedScenarios));
    } catch {
      // Ignore storage quota errors
    }
  }, [savedScenarios]);

  useEffect(() => {
    try {
      window.localStorage.setItem(BRAND_STORAGE_KEY, JSON.stringify(brandState));
    } catch {
      // Ignore storage quota errors
    }
  }, [brandState]);

  useEffect(() => {
    try {
      window.localStorage.setItem(SUMMARY_STORAGE_KEY, sessionSummary);
    } catch {
      // Ignore storage quota errors
    }
  }, [sessionSummary]);

  useEffect(() => {
    try {
      window.localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(chatMessages.slice(-20)));
    } catch {
      // Ignore storage quota errors
    }
  }, [chatMessages]);

  const handleSaveScenario = (result: SimulationResult) => {
    const sameNameCount = savedScenarios.filter((item) => item.input.name === result.input.name).length;
    const finalName =
      sameNameCount > 0 ? `${result.input.name} (${sameNameCount + 1})` : result.input.name;
    const stampedResult: SimulationResult = {
      ...result,
      input: { ...result.input, name: finalName },
      id: `sim_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setSavedScenarios((prev) => [stampedResult, ...prev]);

    if (user) {
      void saveScenarioToCloud(user.uid, stampedResult);
    }
  };

  const handleDeleteScenario = (id: string) => {
    setSavedScenarios((prev) => prev.filter((item) => item.id !== id));
    if (user) {
      void deleteScenarioFromCloud(user.uid, id);
    }
  };

  const handleClearAll = () => {
    setSavedScenarios([]);
  };

  const handleRestoreSeeds = () => {
    setSavedScenarios(DEFAULT_SEED_SCENARIOS);
  };

  const handleConsultSource = (source: TextileSource) => {
    setPreselectedSourceIds([source.id]);
    setPrefilledQuestion(source.samplePromptAr);
    setActiveTab('advisor');
  };

  const handleAskSourceByName = (sourceName: string) => {
    const found = TEXTILE_SOURCES.find(
      (s) =>
        s.name.toLowerCase().includes(sourceName.toLowerCase()) ||
        s.shortName.toLowerCase().includes(sourceName.toLowerCase())
    );
    if (found) {
      setPreselectedSourceIds([found.id]);
      setPrefilledQuestion(found.samplePromptAr);
    } else {
      setPreselectedSourceIds([]);
      setPrefilledQuestion(`كيف أستفيد من ${sourceName} في خطتي الحالية للبراند؟`);
    }
    setActiveTab('advisor');
  };

  const handleOpenFullAdvisor = (question?: string) => {
    if (question) {
      setPrefilledQuestion(question);
    }
    setActiveTab('advisor');
  };

  const handleRestoreSnapshot = (snapshot: SessionContinuitySnapshot) => {
    setSimInput((prev) => ({
      ...DEFAULT_SCENARIO_INPUT,
      ...prev,
      ...snapshot.scenario,
    }));
    setBrandState(snapshot.brand);
    const derivedSummary = snapshot.conversationSummary || buildHumanSummaryAr(snapshot);
    setSessionSummary(derivedSummary);

    const restoredChat: ChatMessage[] = [
      INITIAL_ADVISOR_WELCOME,
      {
        id: `restored_banner_${Date.now()}`,
        role: 'assistant',
        content: `**أهلاً بعودتك يا صديقي! افتكرت كل اللي اتكلمنا فيه من كود الجلسة:**\n\n${derivedSummary}\n\nتقدر تكمل نقاشنا من هنا أو تدخل الاستوديو وتلاقي اللوجو والسكتش والقطع جاهزة زي ما سبناها!`,
      },
      ...snapshot.recentMessages.map((m, idx) => ({
        id: `restored_${Date.now()}_${idx}`,
        role: m.role,
        content: m.content,
      })),
    ];
    setChatMessages(restoredChat);
    setRestoreToast(`تم استرجاع جلسة براند «${snapshot.brand.brandName}» وكل ما اتفقتم عليه.`);
    window.setTimeout(() => setRestoreToast(null), 4500);
  };

  const handleSaveSessionToCloud = async (code: string, summaryAr: string) => {
    if (!user) return;
    await ensureUserProfile(user);
    const sessionId = `brand_${brandState.brandName.toLowerCase().replace(/[^a-z0-9_-]/g, '_') || 'default'}`;
    await saveBrandSessionToCloud(
      user.uid,
      sessionId,
      {
        v: 1,
        savedAt: new Date().toISOString(),
        scenario: simInput,
        brand: brandState,
        conversationSummary: summaryAr,
        recentMessages: chatMessages
          .filter((m) => m.id !== 'welcome' && !m.error)
          .slice(-8)
          .map((m) => ({ role: m.role, content: m.content })),
      },
      code,
      summaryAr
    );
  };

  const handleSignIn = async () => {
    setAuthBusy(true);
    try {
      await signInWithGoogle();
    } catch {
      // Popup closed or blocked
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSignOut = async () => {
    setAuthBusy(true);
    try {
      await signOutFirebase();
    } finally {
      setAuthBusy(false);
    }
  };

  const navItems: Array<{ id: ActiveTab; label: string }> = [
    { id: 'simulator', label: 'محاكي البراند' },
    { id: 'studio', label: 'استوديو البراند' },
    { id: 'compare', label: `مقارنة (${savedScenarios.length})` },
    { id: 'sources', label: `دليل المنظومة (${TEXTILE_SOURCES.length})` },
    { id: 'advisor', label: 'صديقك DoDo' },
  ];

  return (
    <div className="min-h-screen text-slate-900">
      {gmpQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-amber-900 flex items-center justify-between gap-4 sticky top-0 z-50">
          <div className="text-sm font-medium">
            <span>This demo Google Maps API key has exceeded its quota. Please try again later or visit the </span>
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold hover:text-amber-700"
            >
              maps developer site
            </a>
            <span> for more details.</span>
          </div>
          <button
            type="button"
            onClick={() => setGmpQuotaExceeded(false)}
            aria-label="Dismiss"
            className="p-1 rounded hover:bg-amber-100 text-amber-700 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Three-Zone Top Bar */}
      <header className="border-b border-teal-900/12 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          {/* Zone 1: Single-line brand wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab('simulator')}
            className="text-xl font-bold tracking-tight text-teal-950 whitespace-nowrap shrink-0"
            dir="ltr"
          >
            DoDo
          </button>

          {/* Zone 2: Clean text navigation tabs */}
          <nav aria-label="التنقل الرئيسي" className="hidden md:flex items-center gap-5">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`border-b-2 py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'border-teal-700 text-teal-900 font-bold'
                      : 'border-transparent text-slate-600 hover:text-teal-900'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Session Memory Code + Cloud Account + Primary Action */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setContinuityModal({ open: true, mode: 'import' })}
              title="حفظ أو استرجاع كود الجلسة"
              className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-2 text-xs font-semibold text-amber-950 hover:bg-amber-100 whitespace-nowrap"
            >
              <KeyRound className="h-3.5 w-3.5 text-amber-700" />
              <span className="hidden sm:inline">كود الجلسة</span>
            </button>

            {user ? (
              <button
                type="button"
                onClick={handleSignOut}
                disabled={authBusy}
                title={`مسجل كـ ${user.displayName || user.email || 'Google'}`}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
              >
                <LogOut className="h-3.5 w-3.5 text-slate-500" />
                <span className="hidden lg:inline max-w-[90px] truncate">
                  {user.displayName || 'حسابي'}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSignIn}
                disabled={authBusy}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
              >
                <LogIn className="h-3.5 w-3.5 text-teal-700" />
                <span className="hidden sm:inline">دخول Google</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('advisor')}
              className="rounded-lg bg-gradient-to-l from-teal-800 to-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition-all hover:from-teal-700 hover:to-slate-800 whitespace-nowrap"
            >
              اسأل DoDo
            </button>
          </div>
        </div>

        {/* Mobile Tab Strip */}
        <nav
          aria-label="تنقل الجوال"
          className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 md:hidden border-t border-slate-200/70 bg-slate-50/80 px-4 py-2.5"
        >
          {navItems.map((item, idx) => {
            const isActive = activeTab === item.id;
            const spanLast = idx === navItems.length - 1 ? 'col-span-2 sm:col-span-1' : '';
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`rounded-md px-2.5 py-2 text-xs font-medium text-center whitespace-nowrap ${spanLast} ${
                  isActive ? 'bg-teal-700 text-white' : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {restoreToast && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-950">
            <Sparkles className="h-4 w-4 text-emerald-700 shrink-0" />
            <span>{restoreToast}</span>
          </div>
        )}

        <div className="mb-6 rounded-2xl border border-teal-900/12 bg-gradient-to-l from-teal-900/8 via-white/80 to-amber-500/10 px-5 py-4 backdrop-blur-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="max-w-3xl">
              <h1 className="text-xl font-bold text-slate-900 sm:text-2xl text-balance">
                DoDo — صديقك لبناء براند الملابس ومحاكاة الأرباح والمصانع واللوجو
              </h1>
              <p className="mt-1 text-sm text-slate-700">
                اختر طريقة التشغيل، ارسم سكتش اللوجو وحركه وتخيله على القطع، وتحدّث مع DoDo من {TEXTILE_SOURCES.length} مرجعاً — مع كود حفظ سريع لتستأنف من آخر نقطة دائماً.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setContinuityModal({ open: true, mode: 'import' })}
                className="inline-flex items-center gap-1.5 rounded-lg border border-teal-300 bg-white px-3 py-2 text-xs font-bold text-teal-900 hover:bg-teal-50"
              >
                <KeyRound className="h-3.5 w-3.5 text-amber-600" />
                <span>ادخل بكود جلسة قديمة</span>
              </button>
              <button
                type="button"
                onClick={() => setContinuityModal({ open: true, mode: 'export' })}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-2 text-xs font-bold text-white hover:bg-teal-800"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>احفظ الجلسة الحالية</span>
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'simulator' && (
          <SimulatorView
            input={simInput}
            result={currentResult}
            onInputChange={setSimInput}
            onSaveScenario={handleSaveScenario}
            onAskSource={handleAskSourceByName}
            onOpenFullAdvisor={handleOpenFullAdvisor}
          />
        )}

        {activeTab === 'studio' && (
          <BrandStudioView
            brand={brandState}
            onChangeBrand={setBrandState}
            activeResult={currentResult}
            onDiscussWithFriend={(promptText) => handleOpenFullAdvisor(promptText)}
            onOpenContinuity={(mode) => setContinuityModal({ open: true, mode })}
          />
        )}

        {activeTab === 'compare' && (
          <CompareView
            scenarios={savedScenarios}
            onLoadScenario={(loadedInput) => setSimInput(loadedInput)}
            onDeleteScenario={handleDeleteScenario}
            onClearAll={handleClearAll}
            onRestoreSeeds={handleRestoreSeeds}
            onGoToSimulator={() => setActiveTab('simulator')}
          />
        )}

        {activeTab === 'sources' && <SourcesView onConsultSource={handleConsultSource} />}

        {activeTab === 'advisor' && (
          <AdvisorView
            activeResult={currentResult}
            preselectedSourceIds={preselectedSourceIds}
            prefilledQuestion={prefilledQuestion}
            onClearPrefill={() => setPrefilledQuestion('')}
            messages={chatMessages}
            onMessagesChange={setChatMessages}
            brand={brandState}
            onUpdateBrand={setBrandState}
            sessionSummary={sessionSummary}
            onOpenContinuity={(mode) => setContinuityModal({ open: true, mode })}
            onOpenStudio={() => setActiveTab('studio')}
          />
        )}
      </main>

      <SessionContinuityModal
        open={continuityModal.open}
        initialMode={continuityModal.mode}
        onClose={() => setContinuityModal((prev) => ({ ...prev, open: false }))}
        scenario={simInput}
        brand={brandState}
        messages={chatMessages
          .filter((m) => m.id !== 'welcome' && !m.error)
          .slice(-8)
          .map((m) => ({ role: m.role, content: m.content }))}
        summaryText={sessionSummary}
        onSummaryChange={setSessionSummary}
        onRestoreSnapshot={handleRestoreSnapshot}
        isSignedIn={Boolean(user)}
        cloudSessions={cloudBrandSessions}
        onSaveToCloud={handleSaveSessionToCloud}
      />
    </div>
  );
}

