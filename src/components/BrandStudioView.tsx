import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Compass,
  Download,
  Eraser,
  Film,
  Grid,
  KeyRound,
  MessageSquare,
  Palette,
  PenTool,
  Plus,
  Shirt,
  Sparkles,
  Trash2,
  Undo2,
  Wand2,
} from 'lucide-react';
import {
  CURATED_PALETTES,
  GARMENT_TEMPLATES,
  MOTION_STYLE_LABELS,
  STYLE_DIRECTIONS,
  VALUE_PROPOSITION_ARCHETYPES,
  analyzeSketchGeometry,
  buildBrandSvgMarkup,
  composeValuePropositionStatement,
  generateSketchInspiredConcepts,
  getValuePropositionReadiness,
  type SketchIdeaCard,
} from '../utils/brandStudio';
import type {
  BrandIdentityState,
  BrandStyleDirection,
  BrandValueProposition,
  DesignPlacementId,
  GarmentPieceId,
  LogoShapePreset,
  MotionStylePreset,
} from '../utils/sessionContinuity';
import type { SimulationResult } from '../utils/simulator';

interface BrandStudioViewProps {
  brand: BrandIdentityState;
  onChangeBrand: (next: BrandIdentityState) => void;
  activeResult: SimulationResult;
  onDiscussWithFriend: (promptText: string) => void;
  onOpenContinuity: (mode: 'export' | 'import') => void;
}

interface AiSketchConcept {
  titleAr: string;
  brandName: string;
  tagline: string;
  conceptAr: string;
  printSpecAr: string;
  primaryHex: string;
  accentHex: string;
  garmentHex: string;
  recommendedShape: string;
}

const STARTER_SKETCHES: Array<{ label: string; paths: string[] }> = [
  {
    label: 'قوس ونسيج',
    paths: [
      'M 80 170 Q 160 40 240 170',
      'M 105 140 Q 160 110 215 140',
      'M 120 175 L 200 175',
    ],
  },
  {
    label: 'جوهرة هندسية',
    paths: [
      'M 160 44 L 236 116 L 160 196 L 84 116 Z',
      'M 122 116 L 198 116',
      'M 160 72 L 160 164',
    ],
  },
  {
    label: 'رمز إبرة ومقص',
    paths: [
      'M 100 175 L 210 65',
      'M 110 75 Q 160 140 215 165',
      'M 210 65 A 12 12 0 1 0 195 52',
    ],
  },
];

export const BrandStudioView: React.FC<BrandStudioViewProps> = ({
  brand,
  onChangeBrand,
  activeResult,
  onDiscussWithFriend,
  onOpenContinuity,
}) => {
  const sketchCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const motionCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const currentPointsRef = useRef<Array<{ x: number; y: number }>>([]);

  const [brushSize, setBrushSize] = useState(5);
  const [brushColor, setBrushColor] = useState(brand.palette[0]);
  const [showGrid, setShowGrid] = useState(true);
  const [activeGarmentPreview, setActiveGarmentPreview] = useState<GarmentPieceId>(
    brand.agreedGarments[0] || 'heavy_hoodie'
  );
  const [logoScaleAdjust, setLogoScaleAdjust] = useState(1.0);
  const [sketchNotes, setSketchNotes] = useState('');

  // Multimodal Gemini sketch analysis state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiObservation, setAiObservation] = useState<string | null>(null);
  const [aiConcepts, setAiConcepts] = useState<AiSketchConcept[]>([]);

  // Value Proposition AI Generator state
  const [vpAngleNote, setVpAngleNote] = useState('');
  const [vpLoading, setVpLoading] = useState(false);
  const [vpError, setVpError] = useState<string | null>(null);
  const [vpStrategicNote, setVpStrategicNote] = useState<string | null>(null);
  const [vpSuggestions, setVpSuggestions] = useState<
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

  // Moving logo video recording state
  const [recordingVideo, setRecordingVideo] = useState(false);
  const [videoDownloadUrl, setVideoDownloadUrl] = useState<string | null>(null);

  const updateBrand = <K extends keyof BrandIdentityState>(
    key: K,
    val: BrandIdentityState[K]
  ) => {
    onChangeBrand({ ...brand, [key]: val });
  };

  const updateValueProp = <K extends keyof BrandValueProposition>(
    key: K,
    val: BrandValueProposition[K]
  ) => {
    onChangeBrand({
      ...brand,
      valueProposition: {
        ...brand.valueProposition,
        [key]: val,
      },
    });
  };

  useEffect(() => {
    setBrushColor(brand.palette[0]);
  }, [brand.palette]);

  useEffect(() => {
    if (brand.agreedGarments.length > 0 && !brand.agreedGarments.includes(activeGarmentPreview)) {
      setActiveGarmentPreview(brand.agreedGarments[0]);
    }
  }, [brand.agreedGarments, activeGarmentPreview]);

  // Redraw SVG paths onto the interactive sketch canvas cleanly whenever state updates
  useEffect(() => {
    const canvas = sketchCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (showGrid) {
      ctx.save();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      for (let x = 40; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 40; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      ctx.strokeStyle = '#cbd5e1';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.strokeStyle = brushColor || '#0f766e';
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const d of brand.sketchPathsSvg) {
      try {
        const p2d = new Path2D(d);
        ctx.stroke(p2d);
      } catch {
        // Ignore invalid path strings
      }
    }
    ctx.restore();
  }, [brand.sketchPathsSvg, showGrid, brushColor, brushSize]);

  // Animated Moving Logo Canvas Loop (supports Stitch Draw, Pulse, Orbit, Runway, Shimmer + Video Export)
  useEffect(() => {
    const canvas = motionCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const start = performance.now();

    const drawFrame = () => {
      const elapsed = (performance.now() - start) / 1000;
      const cycle = (elapsed % 3.2) / 3.2; // 0..1 smooth 3.2s loop
      const w = canvas.width;
      const h = canvas.height;
      const [primary, accent, surface] = brand.palette;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = surface || '#0f172a';
      ctx.fillRect(0, 0, w, h);

      // Subtle atmospheric backdrop ring
      ctx.save();
      ctx.strokeStyle = `${accent}33`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2 - 14, 78 + Math.sin(cycle * Math.PI * 2) * 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.translate(w / 2, h / 2 - 16);

      if (brand.motionStyle === 'pulse') {
        const s = 1 + Math.sin(cycle * Math.PI * 2) * 0.08;
        ctx.scale(s, s);
      } else if (brand.motionStyle === 'orbit') {
        ctx.rotate(Math.sin(cycle * Math.PI * 2) * 0.14);
      } else if (brand.motionStyle === 'runway') {
        const alpha = Math.min(1, cycle * 2.2);
        ctx.globalAlpha = alpha;
        ctx.translate(0, (1 - Math.min(1, cycle * 2)) * 18);
      }

      // Draw Emblem or User Sketch Paths
      if (brand.sketchPathsSvg.length > 0 && brand.logoShape === 'sketch') {
        ctx.save();
        ctx.translate(-80, -60);
        ctx.scale(0.5, 0.5);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (brand.motionStyle === 'stitch') {
          ctx.setLineDash([28, 12]);
          ctx.lineDashOffset = -cycle * 240;
        }
        for (const d of brand.sketchPathsSvg) {
          try {
            ctx.stroke(new Path2D(d));
          } catch {
            // Skip invalid path
          }
        }
        ctx.restore();
      } else {
        ctx.strokeStyle = brand.motionStyle === 'shimmer' && cycle > 0.45 && cycle < 0.65 ? '#fde68a' : accent;
        ctx.lineWidth = 4;
        if (brand.motionStyle === 'stitch') {
          ctx.setLineDash([12, 6]);
          ctx.lineDashOffset = -cycle * 140;
        }
        if (brand.logoShape === 'crest') {
          ctx.beginPath();
          ctx.moveTo(0, -46);
          ctx.lineTo(44, -26);
          ctx.lineTo(44, 16);
          ctx.quadraticCurveTo(44, 42, 0, 56);
          ctx.quadraticCurveTo(-44, 42, -44, 16);
          ctx.lineTo(-44, -26);
          ctx.closePath();
          ctx.stroke();
        } else if (brand.logoShape === 'orbit') {
          ctx.beginPath();
          ctx.arc(0, 0, 40, 0, Math.PI * 2);
          ctx.stroke();
          ctx.save();
          ctx.rotate(cycle * Math.PI * 2);
          ctx.strokeStyle = primary;
          ctx.beginPath();
          ctx.ellipse(0, 0, 56, 18, 0.35, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else {
          ctx.fillStyle = primary;
          ctx.beginPath();
          ctx.roundRect(-42, -42, 84, 84, 18);
          ctx.fill();
          ctx.stroke();
        }
        const initial = (brand.brandName || 'D').trim().charAt(0).toUpperCase();
        ctx.fillStyle = '#ffffff';
        ctx.font = '800 38px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(initial, 0, 2);
      }
      ctx.restore();

      // Wordmark + Tagline
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText((brand.brandName || 'DoDo').slice(0, 22), w / 2, h - 42);
      ctx.fillStyle = accent;
      ctx.font = '600 10px monospace';
      ctx.fillText((brand.tagline || '').slice(0, 40), w / 2, h - 20);
      ctx.restore();

    };

    drawFrame();
    const timerId = window.setInterval(drawFrame, 45);
    return () => window.clearInterval(timerId);
  }, [brand]);

  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = sketchCanvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.round(((e.clientX - rect.left) / rect.width) * canvas.width),
      y: Math.round(((e.clientY - rect.top) / rect.height) * canvas.height),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const pt = getCanvasCoords(e);
    currentPointsRef.current = [pt];
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = sketchCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const pt = getCanvasCoords(e);
    const pts = currentPointsRef.current;
    const prev = pts[pts.length - 1];
    pts.push(pt);

    ctx.save();
    ctx.strokeStyle = brushColor || '#0f766e';
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    ctx.restore();
  };

  const handlePointerUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const pts = currentPointsRef.current;
    if (pts.length >= 2) {
      // Downsample points slightly for ultra-compact Continuity Code serialization
      const sampled = pts.filter((_, i) => i === 0 || i === pts.length - 1 || i % 2 === 0);
      const d = sampled
        .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
        .join(' ');
      onChangeBrand({
        ...brand,
        logoShape: 'sketch',
        sketchPathsSvg: [...brand.sketchPathsSvg, d].slice(-24),
      });
    }
    currentPointsRef.current = [];
  };

  const handleUndoStroke = () => {
    updateBrand('sketchPathsSvg', brand.sketchPathsSvg.slice(0, -1));
  };

  const handleClearSketch = () => {
    updateBrand('sketchPathsSvg', []);
  };

  const handleGenerateFromSketch = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const pngDataUrl = sketchCanvasRef.current?.toDataURL('image/png') || '';
      const res = await fetch('/api/studio/sketch-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sketchPngDataUrl: pngDataUrl,
          brandName: brand.brandName,
          styleDirection: brand.styleDirection,
          agreedGarments: brand.agreedGarments,
          userNotes: sketchNotes || brand.designNotes,
          scenarioContext: {
            category: activeResult.categoryLabelAr,
            mfgModel: activeResult.mfgLabelAr,
            location: activeResult.locationLabelAr,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'تعذر توليد أفكار السكتش.');
      }
      setAiObservation(data.sketchObservationAr || null);
      setAiConcepts(Array.isArray(data.concepts) ? data.concepts : []);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'تعذر الاتصال بالمساعد.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleDownloadLogoSvg = () => {
    const svg = buildBrandSvgMarkup(brand);
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(brand.brandName || 'brand').toLowerCase()}-logo.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRecordMovingLogoVideo = () => {
    const canvas = motionCanvasRef.current;
    if (!canvas || typeof MediaRecorder === 'undefined' || !canvas.captureStream) return;

    setRecordingVideo(true);
    setVideoDownloadUrl(null);
    const stream = canvas.captureStream(30);
    const chunks: BlobPart[] = [];
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';
    const recorder = new MediaRecorder(stream, { mimeType });

    recorder.ondataavailable = (ev) => {
      if (ev.data.size > 0) chunks.push(ev.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setVideoDownloadUrl(url);
      setRecordingVideo(false);
    };
    recorder.start();
    window.setTimeout(() => {
      if (recorder.state === 'recording') {
        recorder.stop();
      }
    }, 3400);
  };

  const toggleGarment = (id: GarmentPieceId) => {
    const exists = brand.agreedGarments.includes(id);
    const next = exists
      ? brand.agreedGarments.filter((g) => g !== id)
      : [...brand.agreedGarments, id];
    updateBrand('agreedGarments', next.length > 0 ? next : [id]);
  };

  const applyLocalCard = (card: SketchIdeaCard) => {
    onChangeBrand({
      ...brand,
      brandName: card.suggestedBrandName,
      tagline: card.suggestedTagline,
      logoShape: card.recommendedShape,
      palette: card.recommendedPalette,
      agreedGarments: brand.agreedGarments.includes(card.recommendedGarment)
        ? brand.agreedGarments
        : [card.recommendedGarment, ...brand.agreedGarments],
      designNotes: card.printSpecAr,
    });
    setActiveGarmentPreview(card.recommendedGarment);
  };

  const applyAiCard = (c: AiSketchConcept) => {
    const safeShape: LogoShapePreset =
      c.recommendedShape === 'crest' ||
      c.recommendedShape === 'stitch' ||
      c.recommendedShape === 'orbit' ||
      c.recommendedShape === 'sketch'
        ? c.recommendedShape
        : brand.sketchPathsSvg.length > 0
          ? 'sketch'
          : 'monogram';

    onChangeBrand({
      ...brand,
      brandName: c.brandName || brand.brandName,
      tagline: c.tagline || brand.tagline,
      logoShape: safeShape,
      palette: [
        /^#[0-9a-fA-F]{6}$/.test(c.primaryHex) ? c.primaryHex : brand.palette[0],
        /^#[0-9a-fA-F]{6}$/.test(c.accentHex) ? c.accentHex : brand.palette[1],
        /^#[0-9a-fA-F]{6}$/.test(c.garmentHex) ? c.garmentHex : brand.palette[2],
      ],
      designNotes: c.printSpecAr || brand.designNotes,
    });
  };

  const handleGenerateValuePropositions = async () => {
    setVpLoading(true);
    setVpError(null);
    try {
      const res = await fetch('/api/studio/value-propositions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'generate',
          brand,
          userAngle: vpAngleNote,
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
        throw new Error(data.error || 'تعذر توليد الـ Value Propositions.');
      }
      setVpStrategicNote(data.strategicNoteAr || null);
      setVpSuggestions(Array.isArray(data.options) ? data.options : []);
    } catch (err) {
      setVpError(err instanceof Error ? err.message : 'تعذر الاتصال بالمساعد.');
    } finally {
      setVpLoading(false);
    }
  };

  const applyValuePropOption = (opt: BrandValueProposition) => {
    onChangeBrand({
      ...brand,
      valueProposition: {
        targetAudience: opt.targetAudience,
        customerPain: opt.customerPain,
        uniquePromise: opt.uniquePromise,
        proofPillars: opt.proofPillars.slice(0, 5),
        positioningStatement: opt.positioningStatement,
      },
    });
  };

  const sketchGeom = useMemo(
    () => analyzeSketchGeometry(brand.sketchPathsSvg),
    [brand.sketchPathsSvg]
  );
  const localConcepts = useMemo(() => generateSketchInspiredConcepts(brand), [brand]);
  const vpReadiness = useMemo(
    () => getValuePropositionReadiness(brand.valueProposition),
    [brand.valueProposition]
  );
  const activeTemplate = GARMENT_TEMPLATES[activeGarmentPreview];
  const placement = activeTemplate.placementBox[brand.placement];

  return (
    <div className="space-y-6">
      {/* Partner Studio Hero & Memory Code Actions */}
      <div className="rounded-2xl border border-teal-900/15 bg-gradient-to-l from-teal-950 via-slate-900 to-teal-900 p-5 text-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <h2 className="text-lg font-bold text-white">
              استوديو DoDo — شريكك في بناء البراند واللوجو وتخيله على القطع
            </h2>
            <p className="text-xs text-teal-100/90 leading-relaxed">
              ارسم أي شكل تخيلي للشعار في لوحة الرسم، ولّد منه أفكار براند كاملة وهوية بصرية، حرّك اللوجو وصدره فيديو، وتفق مع DoDo على القطع والديزاينز مع حفظ الجلسة بكود تقدر ترجعه في أي وقت.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenContinuity('import')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/25 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/20"
            >
              <KeyRound className="h-3.5 w-3.5 text-amber-300" />
              <span>عندي كود جلسة سابقة</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenContinuity('export')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-300"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>احفظ كود الجلسة والاتفاق</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stage 1 + Stage 2: Interactive Sketch Canvas + Identity Builder */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Sketch Canvas Column */}
        <section
          aria-label="لوحة رسم السكتش التخيلي للشعار"
          className="lg:col-span-6 rounded-2xl border border-teal-200 bg-white bg-gradient-to-b from-[#effaf7] via-white to-[#fdf9ef] p-5 shadow-xs space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <PenTool className="h-4 w-4 text-teal-700" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  1. ارسم شكلاً تخيلياً للوجو (Sketch-to-Logo)
                </h3>
                <p className="text-[11px] text-slate-600">{sketchGeom.complexityLabelAr}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowGrid((g) => !g)}
                title="إظهار أو إخفاء شبكة المحاذاة"
                className={`rounded-lg border p-1.5 text-xs ${
                  showGrid
                    ? 'border-teal-600 bg-teal-50 text-teal-800'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                <Grid className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleUndoStroke}
                disabled={brand.sketchPathsSvg.length === 0}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                <Undo2 className="h-3.5 w-3.5" />
                <span>تراجع</span>
              </button>
              <button
                type="button"
                onClick={handleClearSketch}
                disabled={brand.sketchPathsSvg.length === 0}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-red-700 hover:bg-red-50 disabled:opacity-40"
              >
                <Eraser className="h-3.5 w-3.5" />
                <span>مسح</span>
              </button>
            </div>
          </div>

          <div className="rounded-xl border-2 border-dashed border-teal-300/80 bg-white overflow-hidden">
            <canvas
              ref={sketchCanvasRef}
              width={320}
              height={240}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              className="w-full h-[240px] touch-none cursor-crosshair block"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">حجم القلم:</span>
              {[3, 5, 8].map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setBrushSize(sz)}
                  className={`rounded-md px-2 py-0.5 font-mono-num ${
                    brushSize === sz
                      ? 'bg-teal-700 text-white font-bold'
                      : 'border border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  {sz}px
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-600">سكتش سريع:</span>
              {STARTER_SKETCHES.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() =>
                    onChangeBrand({
                      ...brand,
                      logoShape: 'sketch',
                      sketchPathsSvg: preset.paths,
                    })
                  }
                  className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-medium text-slate-700 hover:border-teal-500 hover:bg-teal-50"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              aria-label="وصف إضافي للشكل اللي رسمته"
              value={sketchNotes}
              onChange={(e) => setSketchNotes(e.target.value)}
              placeholder="ملاحظة عن الرسمة (مثلاً: عايز الشكل ده يتحول لتطريز نسر أو حرف K مودرن...)"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
            />

            <button
              type="button"
              onClick={handleGenerateFromSketch}
              disabled={aiLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-60"
            >
              <Wand2 className="h-4 w-4" />
              <span>
                {aiLoading
                  ? 'DoDo يحلل السكتش ويولد الأفكار...'
                  : 'ولّد أفكار لوجو وبراند من الشكل المرسوم'}
              </span>
            </button>
            <p className="text-[11px] text-slate-600">{sketchGeom.suggestedFormAr}</p>
          </div>
        </section>

        {/* Identity, Logo Builder & Moving Logo Column */}
        <section
          aria-label="إعداد اسم البراند والألوان واللوجو المتحرك"
          className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">
                2. اسم البراند، الهوية، واللوجو المتحرك (Moving Logo)
              </h3>
            </div>
            <button
              type="button"
              onClick={handleDownloadLogoSvg}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-3.5 w-3.5" />
              <span>تنزيل SVG</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="brand-name-input" className="mb-1 block text-xs font-medium text-slate-700">
                اسم البراند
              </label>
              <input
                id="brand-name-input"
                type="text"
                value={brand.brandName}
                onChange={(e) => updateBrand('brandName', e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="brand-tag-input" className="mb-1 block text-xs font-medium text-slate-700">
                شعار مكتوب (Tagline)
              </label>
              <input
                id="brand-tag-input"
                type="text"
                value={brand.tagline}
                onChange={(e) => updateBrand('tagline', e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="brand-style-dir" className="mb-1 block text-xs font-medium text-slate-700">
                شخصية البراند
              </label>
              <select
                id="brand-style-dir"
                value={brand.styleDirection}
                onChange={(e) =>
                  updateBrand('styleDirection', e.target.value as BrandStyleDirection)
                }
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-900"
              >
                {Object.entries(STYLE_DIRECTIONS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.labelAr}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="brand-logo-shape" className="mb-1 block text-xs font-medium text-slate-700">
                نمط أيقونة اللوجو
              </label>
              <select
                id="brand-logo-shape"
                value={brand.logoShape}
                onChange={(e) => updateBrand('logoShape', e.target.value as LogoShapePreset)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-900"
              >
                <option value="sketch">السكتش المرسوم بيدي ({brand.sketchPathsSvg.length} خط)</option>
                <option value="monogram">مونوغرام هندسي (Monogram)</option>
                <option value="crest">درع كلاسيكي (Crest)</option>
                <option value="stitch">إطار غرزة خياطة (Stitch)</option>
                <option value="orbit">مدار عصري (Orbit)</option>
              </select>
            </div>
          </div>

          {/* Color Palette Picker */}
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-slate-700">لوحة ألوان الهوية والقطعة:</div>
            <div className="flex flex-wrap gap-1.5">
              {CURATED_PALETTES.map((pal) => {
                const active = pal.colors.join() === brand.palette.join();
                return (
                  <button
                    key={pal.id}
                    type="button"
                    onClick={() => updateBrand('palette', pal.colors)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] transition-colors ${
                      active
                        ? 'border-teal-700 bg-teal-50 font-bold text-teal-950'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="flex items-center gap-0.5">
                      {pal.colors.map((hex) => (
                        <span
                          key={hex}
                          className="h-3 w-3 rounded-full border border-black/15"
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </span>
                    <span>{pal.labelAr}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Moving Logo Canvas + Motion Switcher */}
          <div className="rounded-xl border border-slate-200 bg-slate-900 p-3.5 text-white space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                <Film className="h-4 w-4" />
                <span>معاينة اللوجو المتحرك (Moving Logo Preview)</span>
              </div>
              <select
                aria-label="نمط حركة اللوجو"
                value={brand.motionStyle}
                onChange={(e) => updateBrand('motionStyle', e.target.value as MotionStylePreset)}
                className="rounded-md border border-white/20 bg-slate-800 px-2.5 py-1 text-[11px] text-white"
              >
                {Object.entries(MOTION_STYLE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.labelAr}
                  </option>
                ))}
              </select>
            </div>

            <canvas
              ref={motionCanvasRef}
              width={480}
              height={240}
              className="w-full h-[210px] rounded-lg border border-white/10 block"
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-slate-300">
                {MOTION_STYLE_LABELS[brand.motionStyle].descAr}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRecordMovingLogoVideo}
                  disabled={recordingVideo}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-3 py-1.5 text-[11px] font-bold text-slate-950 hover:bg-amber-300 disabled:opacity-60"
                >
                  <Film className="h-3.5 w-3.5" />
                  <span>{recordingVideo ? 'جاري تسجيل 3 ثوانٍ...' : 'سجّل فيديو اللوجو (.webm)'}</span>
                </button>
                {videoDownloadUrl && (
                  <a
                    href={videoDownloadUrl}
                    download={`${(brand.brandName || 'logo').toLowerCase()}-moving-logo.webm`}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-400"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>تنزيل الفيديو</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Stage 3: Ideas Generated from the Drawn Sketch */}
      <section className="rounded-2xl border border-amber-200 bg-white bg-gradient-to-b from-[#fefaf0] via-white to-[#f6fbf9] p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-900/10 pb-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">
              أفكار الشعار والهوية المولّدة من رسمتك ({brand.sketchPathsSvg.length} خطوط سكتش)
            </h3>
          </div>
          <span className="text-xs text-slate-500">اضغط «اعتماد الفكرة» لتطبيقها فوراً على اللوجو والقطع</span>
        </div>

        {aiError && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">
            تنبيه التحليل الحي عبر Gemini: {aiError} — يمكنك استخدام الأفكار المحلية المولدة أدناه بشكل فوري.
          </div>
        )}

        {aiObservation && (
          <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-3.5 text-xs leading-relaxed text-teal-950">
            <span className="font-bold">قراءة DoDo لسكتش اللوجو: </span>
            {aiObservation}
          </div>
        )}

        {aiConcepts.length > 0 && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {aiConcepts.map((c, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-xl border border-teal-200 bg-white p-4 shadow-xs"
              >
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-teal-900">{c.titleAr}</div>
                  <div className="text-sm font-extrabold text-slate-900" dir="ltr">
                    {c.brandName}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{c.conceptAr}</p>
                  <div className="text-[11px] font-medium text-amber-900 bg-amber-50 rounded px-2 py-1">
                    {c.printSpecAr}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => applyAiCard(c)}
                  className="mt-3 w-full rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800"
                >
                  اعتماد الفكرة وتطبيقها على القطع
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {localConcepts.map((card) => (
            <div
              key={card.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white/95 p-4 hover:border-teal-400 transition-colors"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-900">{card.titleAr}</h4>
                  <span className="flex items-center gap-1">
                    {card.recommendedPalette.map((hex) => (
                      <span
                        key={hex}
                        className="h-3 w-3 rounded-full border border-black/15"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-slate-700">{card.conceptAr}</p>
                <p className="text-[11px] text-teal-800 font-medium">{card.printSpecAr}</p>
              </div>
              <button
                type="button"
                onClick={() => applyLocalCard(card)}
                className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg border border-teal-600 bg-teal-50/70 px-3 py-1.5 text-xs font-semibold text-teal-900 hover:bg-teal-700 hover:text-white transition-colors"
              >
                <Check className="h-3.5 w-3.5" />
                <span>اعتماد هذا التوجه</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Stage 3.5: Brand Value Propositions Workshop */}
      <section
        aria-label="بناء القيمة المقترحة للبراند Value Propositions"
        className="rounded-2xl border border-teal-200 bg-white bg-gradient-to-b from-[#effaf7] via-white to-[#fdfaf2] p-5 shadow-xs space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-start gap-2.5">
            <Compass className="h-5 w-5 text-teal-700 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                3. القيمة المقترحة للبراند (My Brand Value Propositions)
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                مكتمل {vpReadiness.completedCount} من {vpReadiness.totalCount} أركان · الجمهور المستهدف · المشكلة · الوعد الفارق · الإثبات الصناعي
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              onDiscussWithFriend(
                `يا DoDo، عايزين نتكلم ونظبط الـ Value Propositions الخاصة ببراند "${brand.brandName}" (${STYLE_DIRECTIONS[brand.styleDirection].labelAr}) على قطع (${brand.agreedGarments
                  .map((id) => GARMENT_TEMPLATES[id]?.nameAr)
                  .join('، ')}) وطريقة التشغيل (${activeResult.mfgLabelAr}).\n\nالوضع الحالي عندي:\n- الجمهور: ${brand.valueProposition.targetAudience}\n- مشكلة العميل: ${brand.valueProposition.customerPain}\n- الوعد المبدئي: ${brand.valueProposition.uniquePromise}\n\nاسألني عشان نفهم العميل أكتر ونطلع بـ Value Propositions قوية ومختلفة فعلاً عن السوق.`
              )
            }
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 whitespace-nowrap"
          >
            <MessageSquare className="h-3.5 w-3.5 text-amber-300" />
            <span>ناقش وابنِ الـ Value Propositions مع DoDo</span>
          </button>
        </div>

        {/* Archetype Templates */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-700">
            قوالب سريعة حسب زاوية التميز (اضغط لتجربتها وتعديلها):
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {VALUE_PROPOSITION_ARCHETYPES.map((arch) => (
              <button
                key={arch.id}
                type="button"
                onClick={() => applyValuePropOption(arch.build(brand.brandName))}
                className="rounded-xl border border-slate-200 bg-white p-3 text-right hover:border-teal-600 hover:bg-teal-50/40 transition-colors"
              >
                <div className="text-xs font-bold text-teal-900">{arch.labelAr}</div>
                <div className="mt-1 text-[11px] text-slate-600 leading-relaxed">{arch.angleAr}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Editable Value Proposition Canvas Fields */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-7 space-y-3">
            <div>
              <label htmlFor="vp-audience" className="mb-1 block text-xs font-semibold text-slate-800">
                من هو العميل المستهدف؟ (Target Audience / Customer Jobs)
              </label>
              <input
                id="vp-audience"
                type="text"
                value={brand.valueProposition.targetAudience}
                onChange={(e) => updateValueProp('targetAudience', e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="vp-pain" className="mb-1 block text-xs font-semibold text-slate-800">
                ما المشكلة أو الإحباط الذي يواجهه في السوق؟ (Customer Pain)
              </label>
              <input
                id="vp-pain"
                type="text"
                value={brand.valueProposition.customerPain}
                onChange={(e) => updateValueProp('customerPain', e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="vp-promise" className="mb-1 block text-xs font-semibold text-slate-800">
                ما الوعد الأساسي والميزة الفارقة للبراند؟ (Unique Value Promise)
              </label>
              <input
                id="vp-promise"
                type="text"
                value={brand.valueProposition.uniquePromise}
                onChange={(e) => updateValueProp('uniquePromise', e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="vp-statement" className="text-xs font-bold text-teal-950">
                  جملة الـ Value Proposition النهائية للبراند:
                </label>
                <button
                  type="button"
                  onClick={() =>
                    updateValueProp(
                      'positioningStatement',
                      composeValuePropositionStatement(brand.valueProposition, brand.brandName)
                    )
                  }
                  className="text-[11px] font-semibold text-teal-700 hover:underline"
                >
                  صياغة الجملة من الأركان تلقائياً
                </button>
              </div>
              <textarea
                id="vp-statement"
                rows={3}
                value={brand.valueProposition.positioningStatement}
                onChange={(e) => updateValueProp('positioningStatement', e.target.value)}
                className="w-full rounded-xl border border-teal-200 bg-teal-50/40 p-3 text-xs font-medium text-slate-900 leading-relaxed focus:border-teal-600 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="lg:col-span-5 space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-900">
                أدلة الإثبات في القطعة والتجربة (Proof Pillars)
              </span>
              <button
                type="button"
                onClick={() =>
                  updateValueProp(
                    'proofPillars',
                    [...brand.valueProposition.proofPillars, 'ميزة إثبات جديدة في الخامة أو التقفيل'].slice(0, 5)
                  )
                }
                disabled={brand.valueProposition.proofPillars.length >= 5}
                className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:border-teal-600 disabled:opacity-40"
              >
                <Plus className="h-3 w-3" />
                <span>إضافة إثبات</span>
              </button>
            </div>

            <div className="space-y-2">
              {brand.valueProposition.proofPillars.map((pillar, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    aria-label={`دليل إثبات ${idx + 1}`}
                    value={pillar}
                    onChange={(e) => {
                      const next = [...brand.valueProposition.proofPillars];
                      next[idx] = e.target.value;
                      updateValueProp('proofPillars', next);
                    }}
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
                  />
                  {brand.valueProposition.proofPillars.length > 1 && (
                    <button
                      type="button"
                      aria-label={`حذف الإثبات ${idx + 1}`}
                      onClick={() =>
                        updateValueProp(
                          'proofPillars',
                          brand.valueProposition.proofPillars.filter((_, i) => i !== idx)
                        )
                      }
                      className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 pt-3 space-y-2">
              <input
                type="text"
                aria-label="زاوية أو تركيز خاص لـ Value Propositions"
                value={vpAngleNote}
                onChange={(e) => setVpAngleNote(e.target.value)}
                placeholder="تركيز إضافي (مثلاً: تركيز على طلاب الجامعات أو أسعار الجملة)..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleGenerateValuePropositions}
                disabled={vpLoading}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2.5 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-60"
              >
                <Wand2 className="h-3.5 w-3.5" />
                <span>
                  {vpLoading
                    ? 'DoDo يصيغ مقترحات الـ Value Propositions...'
                    : 'ولّد 3 خيارات Value Propositions من براندي والمحاكي'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {vpError && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">
            تنبيه التحليل الحي: {vpError}
          </div>
        )}

        {vpStrategicNote && (
          <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-3 text-xs text-teal-950 leading-relaxed">
            <strong>تحليل DoDo لتموضع البراند: </strong>
            {vpStrategicNote}
          </div>
        )}

        {vpSuggestions.length > 0 && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {vpSuggestions.map((opt, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between rounded-xl border border-teal-200 bg-white p-4 space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-teal-900">{opt.titleAr}</div>
                  <div className="text-[11px] font-medium text-amber-800">{opt.angleAr}</div>
                  <p className="text-xs text-slate-800 leading-relaxed font-medium">
                    {opt.positioningStatement}
                  </p>
                  <ul className="list-disc pr-4 text-[11px] text-slate-600 space-y-0.5">
                    {(opt.proofPillars || []).slice(0, 3).map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => applyValuePropOption(opt)}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-teal-700 px-3 py-2 text-xs font-bold text-white hover:bg-teal-800"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>اعتماد هذه القيمة للبراند</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Stage 4: Agree on Garments & Visualize Logo on Pieces */}
      <section className="rounded-2xl border border-teal-200 bg-white p-5 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Shirt className="h-4 w-4 text-teal-700" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                4. الاتفاق على نوع القطع وتخيّل اللوجو عليها (Garment Visualization)
              </h3>
              <p className="text-[11px] text-slate-600">
                اختر القطع التي سنتفق على إطلاقها أولاً وحدد مكان وحجم الشعار عليها
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              onDiscussWithFriend(
                `يا DoDo، اتفقنا في الاستوديو على براند "${brand.brandName}" (${brand.tagline}) بأسلوب ${STYLE_DIRECTIONS[brand.styleDirection].labelAr} والقطع المتفق عليها هي: ${brand.agreedGarments
                  .map((id) => GARMENT_TEMPLATES[id]?.nameAr)
                  .join('، ')}. وملاحظاتنا: ${brand.designNotes}. قيّم هذه المجموعة واقترح أفضل خامة وتكلفة وأماكن تنفيذ مناسبة لميزانيتي.`
              )
            }
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-teal-800"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>ناقش هذه القطع والديزاين مع صديقك DoDo</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-6 space-y-4">
            <div>
              <div className="mb-2 text-xs font-bold text-slate-800">
                القطع المتفق عليها في المجموعة الأولى (اضغط للتحديد):
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {(Object.keys(GARMENT_TEMPLATES) as GarmentPieceId[]).map((gid) => {
                  const tpl = GARMENT_TEMPLATES[gid];
                  const agreed = brand.agreedGarments.includes(gid);
                  const previewing = activeGarmentPreview === gid;
                  return (
                    <div
                      key={gid}
                      className={`rounded-xl border p-2.5 transition-colors ${
                        previewing
                          ? 'border-teal-700 bg-teal-50/70'
                          : agreed
                            ? 'border-emerald-300 bg-emerald-50/40'
                            : 'border-slate-200 bg-slate-50/60'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setActiveGarmentPreview(gid);
                          if (!agreed) toggleGarment(gid);
                        }}
                        className="w-full text-right"
                      >
                        <div className="flex items-center justify-between gap-1 text-xs font-bold text-slate-900">
                          <span>{tpl.nameAr}</span>
                          {agreed && <Check className="h-3.5 w-3.5 text-emerald-700 shrink-0" />}
                        </div>
                        <div className="mt-0.5 text-[10px] text-slate-600">{tpl.recommendedGsm}</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleGarment(gid)}
                        className="mt-1.5 text-[10px] font-semibold text-teal-800 hover:underline"
                      >
                        {agreed ? 'إزالة من الاتفاق' : '+ ضم للاتفاق'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="garment-placement" className="mb-1 block text-xs font-medium text-slate-700">
                  مكان اللوجو على القطعة
                </label>
                <select
                  id="garment-placement"
                  value={brand.placement}
                  onChange={(e) => updateBrand('placement', e.target.value as DesignPlacementId)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-900"
                >
                  <option value="left_chest">يسار الصدر (شعار مدمج)</option>
                  <option value="center_front">وسط الصدر (توسط كلاسيكي)</option>
                  <option value="back_oversize">ظهر كبير (Back Print)</option>
                  <option value="hem_woven">تيكت منسوج أسفل القطعة</option>
                </select>
              </div>
              <div>
                <label htmlFor="logo-scale-slider" className="mb-1 block text-xs font-medium text-slate-700">
                  حجم الشعار على القطعة ({Math.round(logoScaleAdjust * 100)}%)
                </label>
                <input
                  id="logo-scale-slider"
                  type="range"
                  min={0.6}
                  max={1.4}
                  step={0.05}
                  value={logoScaleAdjust}
                  onChange={(e) => setLogoScaleAdjust(Number(e.target.value))}
                  className="w-full accent-teal-700 mt-2"
                />
              </div>
            </div>

            <div>
              <label htmlFor="brand-design-notes" className="mb-1 block text-xs font-medium text-slate-700">
                ملاحظات التصميم والخامة والطباعة المتفق عليها:
              </label>
              <textarea
                id="brand-design-notes"
                rows={3}
                value={brand.designNotes}
                onChange={(e) => updateBrand('designNotes', e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Live Vector Garment Mockup Column */}
          <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-100 via-stone-50 to-teal-50/40 p-5 flex flex-col items-center">
            <div className="mb-2 flex w-full items-center justify-between text-xs">
              <span className="font-bold text-slate-900">
                تخيّل القطعة: {activeTemplate.nameAr}
              </span>
              <span className="text-[11px] font-medium text-teal-800">{placement.labelAr}</span>
            </div>

            <svg
              viewBox="0 0 300 295"
              className="w-full max-w-[330px] drop-shadow-md"
              role="img"
              aria-label={`معاينة ${activeTemplate.nameAr} مع شعار ${brand.brandName}`}
            >
              {/* Garment Base Shape */}
              <path
                d={activeTemplate.bodyPath}
                fill={brand.palette[2] || '#1e293b'}
                stroke="#0f172a"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              {/* Collar & Seam Detail */}
              <path
                d={activeTemplate.collarPath}
                fill="none"
                stroke="#94a3b8"
                strokeOpacity="0.65"
                strokeWidth="2"
                strokeLinecap="round"
              />
              {activeTemplate.seamPaths.map((sp, i) => (
                <path
                  key={i}
                  d={sp}
                  fill="none"
                  stroke="#94a3b8"
                  strokeOpacity="0.4"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />
              ))}

              {/* Neck Woven Brand Label */}
              <rect x="132" y="49" width="36" height="10" rx="2" fill={brand.palette[0]} />
              <text
                x="150"
                y="56.5"
                textAnchor="middle"
                fontSize="6"
                fontWeight="bold"
                fill="#ffffff"
              >
                {(brand.brandName || 'D').slice(0, 8)}
              </text>

              {/* Placed Logo / Hand-Drawn Sketch on Agreed Spot */}
              <g
                transform={`translate(${placement.x}, ${placement.y}) scale(${
                  placement.scale * logoScaleAdjust
                })`}
              >
                {brand.sketchPathsSvg.length > 0 && brand.logoShape === 'sketch' ? (
                  <g transform="translate(-80, -60) scale(0.5)">
                    {brand.sketchPathsSvg.map((d, idx) => (
                      <path
                        key={idx}
                        d={d}
                        fill="none"
                        stroke={brand.palette[1]}
                        strokeWidth="11"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ))}
                    <text
                      x="160"
                      y="225"
                      textAnchor="middle"
                      fontSize="24"
                      fontWeight="800"
                      fill="#ffffff"
                    >
                      {(brand.brandName || 'DoDo').slice(0, 14)}
                    </text>
                  </g>
                ) : (
                  <g>
                    <rect
                      x="-32"
                      y="-28"
                      width="64"
                      height="52"
                      rx="10"
                      fill={brand.palette[0]}
                      stroke={brand.palette[1]}
                      strokeWidth="2.5"
                    />
                    <text
                      x="0"
                      y="3"
                      textAnchor="middle"
                      fontSize="22"
                      fontWeight="800"
                      fill="#ffffff"
                    >
                      {(brand.brandName || 'D').trim().charAt(0).toUpperCase()}
                    </text>
                    <text
                      x="0"
                      y="19"
                      textAnchor="middle"
                      fontSize="8.5"
                      fontWeight="700"
                      fill={brand.palette[1]}
                    >
                      {(brand.brandName || 'DoDo').slice(0, 10)}
                    </text>
                  </g>
                )}
              </g>
            </svg>

            <p className="mt-2 text-center text-[11px] text-slate-600">{activeTemplate.fitAr}</p>
          </div>
        </div>
      </section>
    </div>
  );
};
