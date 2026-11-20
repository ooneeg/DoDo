import React, { useMemo, useState } from 'react';
import {
  Check,
  Cloud,
  Copy,
  Download,
  FileUp,
  KeyRound,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import {
  buildHumanSummaryAr,
  decodeContinuityCode,
  encodeContinuityCode,
  type BrandIdentityState,
  type SessionContinuitySnapshot,
  type StudioMessageSnapshot,
} from '../utils/sessionContinuity';
import type { ScenarioInput } from '../utils/simulator';
import type { CloudBrandSessionRecord } from '../firebase';

interface SessionContinuityModalProps {
  open: boolean;
  initialMode: 'export' | 'import';
  onClose: () => void;
  scenario: ScenarioInput;
  brand: BrandIdentityState;
  messages: StudioMessageSnapshot[];
  summaryText: string;
  onSummaryChange: (summary: string) => void;
  onRestoreSnapshot: (snapshot: SessionContinuitySnapshot) => void;
  isSignedIn: boolean;
  cloudSessions: CloudBrandSessionRecord[];
  onSaveToCloud?: (code: string, summaryAr: string) => Promise<void>;
}

export const SessionContinuityModal: React.FC<SessionContinuityModalProps> = ({
  open,
  initialMode,
  onClose,
  scenario,
  brand,
  messages,
  summaryText,
  onSummaryChange,
  onRestoreSnapshot,
  isSignedIn,
  cloudSessions,
  onSaveToCloud,
}) => {
  const [tab, setTab] = useState<'export' | 'import'>(initialMode);
  const [pasteValue, setPasteValue] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [aiSummarizing, setAiSummarizing] = useState(false);
  const [cloudSaving, setCloudSaving] = useState(false);
  const [cloudMsg, setCloudMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setTab(initialMode);
      setImportError(null);
      setImportSuccess(null);
      setCloudMsg(null);
    }
  }, [open, initialMode]);

  const currentSnapshot: SessionContinuitySnapshot = useMemo(
    () => ({
      v: 1,
      savedAt: new Date().toISOString(),
      scenario,
      brand,
      conversationSummary: summaryText,
      recentMessages: messages.slice(-8),
    }),
    [scenario, brand, summaryText, messages]
  );

  const continuityCode = useMemo(
    () => encodeContinuityCode(currentSnapshot),
    [currentSnapshot]
  );

  const humanSummary = useMemo(
    () => buildHumanSummaryAr(currentSnapshot),
    [currentSnapshot]
  );

  if (!open) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(continuityCode);
      setCopiedCode(true);
      window.setTimeout(() => setCopiedCode(false), 2200);
    } catch {
      // Fallback handled visually if clipboard denied
    }
  };

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(`${humanSummary}\n\n--- كود الاستئناف ---\n${continuityCode}`);
      setCopiedSummary(true);
      window.setTimeout(() => setCopiedSummary(false), 2200);
    } catch {
      // Ignore clipboard failures
    }
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(currentSnapshot, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dodo-${(brand.brandName || 'session').toLowerCase().replace(/[^a-z0-9_-]/g, '-')}.dodo.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAiSummarize = async () => {
    setAiSummarizing(true);
    try {
      const res = await fetch('/api/studio/summarize-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand,
          scenario,
          messages: messages.slice(-8),
        }),
      });
      const data = await res.json();
      if (res.ok && data.summaryAr) {
        onSummaryChange(data.summaryAr);
      } else {
        onSummaryChange(humanSummary);
      }
    } catch {
      onSummaryChange(humanSummary);
    } finally {
      setAiSummarizing(false);
    }
  };

  const handleApplyCode = (rawInput: string) => {
    const res = decodeContinuityCode(rawInput);
    if (!res.ok) {
      setImportError(res.error);
      setImportSuccess(null);
      return;
    }
    setImportError(null);
    onRestoreSnapshot(res.snapshot);
    setImportSuccess(
      `تم استرجاع جلسة «${res.snapshot.brand.brandName}» وكل ما اتفقتما عليه مع DoDo بنجاح!`
    );
    window.setTimeout(() => {
      onClose();
    }, 900);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      setPasteValue(text);
      handleApplyCode(text);
    };
    reader.readAsText(file);
  };

  const handleCloudSave = async () => {
    if (!onSaveToCloud) return;
    setCloudSaving(true);
    setCloudMsg(null);
    try {
      await onSaveToCloud(continuityCode, summaryText || humanSummary);
      setCloudMsg('تم حفظ الجلسة في حسابك السحابي بنجاح.');
    } catch (err) {
      setCloudMsg(err instanceof Error ? err.message : 'تعذر الحفظ في السحابة.');
    } finally {
      setCloudSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="continuity-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-teal-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-l from-teal-950 via-slate-900 to-teal-900 px-5 py-4 text-white">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-amber-300" />
            <div>
              <h2 id="continuity-dialog-title" className="text-sm font-bold">
                كود وملخص حفظ واستئناف الجلسة (DoDo Memory Code)
              </h2>
              <p className="text-[11px] text-teal-100/85">
                احفظ الكود أو الملف بعد أي جلسة، وارفعه في البداية لو الداتا اتمسحت لنكمل من نفس النقطة فوراً
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="إغلاق نافذة كود الجلسة"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/80 hover:bg-white/15 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setTab('export')}
            className={`rounded-t-lg px-4 py-2 text-xs font-bold transition-colors ${
              tab === 'export'
                ? 'border border-b-0 border-slate-200 bg-white text-teal-900'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            أعطني كود وملخص الجلسة للحفظ
          </button>
          <button
            type="button"
            onClick={() => setTab('import')}
            className={`rounded-t-lg px-4 py-2 text-xs font-bold transition-colors ${
              tab === 'import'
                ? 'border border-b-0 border-slate-200 bg-white text-teal-900'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            عندي كود أو ملف قديم — افتكر اللي اتكلمنا فيه
          </button>
        </div>

        <div className="p-5 space-y-4">
          {tab === 'export' ? (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="session-summary-note" className="text-xs font-bold text-slate-800">
                    ملخص الاتفاقات والقرارات الحالية:
                  </label>
                  <button
                    type="button"
                    onClick={handleAiSummarize}
                    disabled={aiSummarizing}
                    className="inline-flex items-center gap-1 rounded-md border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-900 hover:bg-teal-100 disabled:opacity-60"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>{aiSummarizing ? 'جاري التلخيص...' : 'توليد ملخص ذكي'}</span>
                  </button>
                </div>
                <textarea
                  id="session-summary-note"
                  rows={3}
                  value={summaryText}
                  onChange={(e) => onSummaryChange(e.target.value)}
                  placeholder="أضف أو عدّل ملخص ما اتفقنا عليه (أو اضغط توليد ملخص ذكي)..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
                <div className="text-[11px] font-semibold text-slate-700">معاينة الملخص المقروء:</div>
                <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-slate-700 font-sans">
                  {humanSummary}
                </pre>
              </div>

              <div className="space-y-2">
                <label htmlFor="continuity-code-output" className="block text-xs font-bold text-slate-800">
                  كود استئناف الجلسة (يحفظ المحاكي + اسم البراند + اللوجو + السكتش + القطع + المحادثة):
                </label>
                <textarea
                  id="continuity-code-output"
                  readOnly
                  dir="ltr"
                  rows={4}
                  value={continuityCode}
                  className="font-mono-num w-full rounded-xl border border-teal-200 bg-teal-50/40 p-3 text-[11px] text-slate-800 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800"
                >
                  {copiedCode ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedCode ? 'تم نسخ الكود!' : 'نسخ الكود كاملاً'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                >
                  {copiedSummary ? <Check className="h-3.5 w-3.5 text-emerald-700" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedSummary ? 'تم النسخ!' : 'نسخ الملخص + الكود'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadJson}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-950 hover:bg-amber-100"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>تنزيل ملف (.dodo.json)</span>
                </button>

                {isSignedIn && onSaveToCloud && (
                  <button
                    type="button"
                    onClick={handleCloudSave}
                    disabled={cloudSaving}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-950 hover:bg-indigo-100 disabled:opacity-60"
                  >
                    <Cloud className="h-3.5 w-3.5" />
                    <span>{cloudSaving ? 'جاري الحفظ...' : 'حفظ بالسحابة'}</span>
                  </button>
                )}
              </div>

              {cloudMsg && (
                <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-2.5 text-xs text-indigo-950">
                  {cloudMsg}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label htmlFor="continuity-code-input" className="block text-xs font-bold text-slate-800">
                  الصق كود الجلسة (يبدأ بـ DODO1-) أو محتوى ملف الجلسة:
                </label>
                <textarea
                  id="continuity-code-input"
                  dir="ltr"
                  rows={5}
                  value={pasteValue}
                  onChange={(e) => setPasteValue(e.target.value)}
                  placeholder="DODO1-eyJ2IjoxLC..."
                  className="font-mono-num w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50">
                  <FileUp className="h-4 w-4 text-teal-700" />
                  <span>أو اختر ملف (.dodo.json) من جهازك</span>
                  <input
                    type="file"
                    accept=".json,.txt"
                    onChange={handleFileUpload}
                    className="sr-only"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => handleApplyCode(pasteValue)}
                  disabled={!pasteValue.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-5 py-2 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  <span>استرجاع الجلسة ومتابعة الكلام</span>
                </button>
              </div>

              {importError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                  {importError}
                </div>
              )}

              {importSuccess && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-900">
                  {importSuccess}
                </div>
              )}

              {isSignedIn && cloudSessions.length > 0 && (
                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <div className="text-xs font-bold text-slate-800">
                    أو استرجع جلسة محفوظة من حسابك السحابي:
                  </div>
                  <div className="space-y-2">
                    {cloudSessions.slice(0, 5).map((rec) => (
                      <div
                        key={rec.id}
                        className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">
                            {rec.brandName} — {rec.tagline}
                          </div>
                          <div className="text-[11px] text-slate-600 truncate">{rec.summaryAr}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleApplyCode(rec.continuityCode)}
                          className="shrink-0 rounded-lg bg-teal-700 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-teal-800"
                        >
                          استرجاع
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
