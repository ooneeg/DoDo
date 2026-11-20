import type { ScenarioInput } from './simulator';

export type GarmentPieceId =
  | 'oversize_tee'
  | 'heavy_hoodie'
  | 'boxy_crew'
  | 'varsity_jacket'
  | 'polo_knit'
  | 'tote_bag';

export type LogoShapePreset = 'sketch' | 'monogram' | 'crest' | 'stitch' | 'orbit';
export type MotionStylePreset = 'stitch' | 'pulse' | 'orbit' | 'runway' | 'shimmer';
export type DesignPlacementId = 'left_chest' | 'center_front' | 'back_oversize' | 'hem_woven';
export type BrandStyleDirection = 'streetwear' | 'minimal' | 'luxury' | 'athletic' | 'heritage';

export interface BrandValueProposition {
  targetAudience: string;
  customerPain: string;
  uniquePromise: string;
  proofPillars: string[];
  positioningStatement: string;
}

export interface StudioMessageSnapshot {
  role: 'user' | 'assistant';
  content: string;
}

export interface BrandIdentityState {
  brandName: string;
  tagline: string;
  styleDirection: BrandStyleDirection;
  palette: [string, string, string]; // [primary, accent, surface/garment]
  logoShape: LogoShapePreset;
  sketchPathsSvg: string[]; // Compact SVG path 'd' strings from user canvas drawing
  motionStyle: MotionStylePreset;
  agreedGarments: GarmentPieceId[];
  placement: DesignPlacementId;
  designNotes: string;
  valueProposition: BrandValueProposition;
}

export interface SessionContinuitySnapshot {
  v: 1;
  savedAt: string;
  scenario: Partial<ScenarioInput>;
  brand: BrandIdentityState;
  conversationSummary: string;
  recentMessages: StudioMessageSnapshot[];
}

export const DEFAULT_VALUE_PROPOSITION: BrandValueProposition = {
  targetAudience: 'الشباب والمهنيون (20–35 سنة) الباحثون عن قطع بيسك وستريت وير بتلبيس مضبوط وخامة تعيش.',
  customerPain: 'تيشيرتات وهوديز السوق بتكش أو تبهت بعد 3 غسلات أو بتتباع بأسعار مستوردة مبالغ فيها.',
  uniquePromise: 'قطع قطن مصري ثقيلة معالجة ضد الانكماش بتصميم معاصر وقيمة سعرية عادلة.',
  proofPillars: [
    'قطن طويل التيلة 260–380 GSM معالج ضد الوبرة',
    'باترون Drop-Shoulder مجرب على 5 مقاسات',
    'ضمان استبدال مجاني خلال 14 يوم على الخامة والطباعة',
  ],
  positioningStatement:
    'لـ الشباب الباحثين عن ملابس يومية متقنة، يقدم براند KHEIT قطع قطن مصري ثقيلة تعيش طويلاً وتحتفظ بشكلها بدون أسعار المستورد المبالغ فيها.',
};

export const DEFAULT_BRAND_STATE: BrandIdentityState = {
  brandName: 'KHEIT',
  tagline: 'Crafted Heavyweight Cotton',
  styleDirection: 'streetwear',
  palette: ['#0f766e', '#d97706', '#1e293b'],
  logoShape: 'monogram',
  sketchPathsSvg: [],
  motionStyle: 'stitch',
  agreedGarments: ['oversize_tee', 'heavy_hoodie'],
  placement: 'left_chest',
  designNotes: 'طباعة DTF عالية الكثافة أو تطريز شينيل على الصدر مع تيكت قماش منسوج عند الرقبة.',
  valueProposition: DEFAULT_VALUE_PROPOSITION,
};

const CODE_PREFIX = 'DODO1-';

function toBase64UrlUtf8(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  const b64 =
    typeof btoa === 'function'
      ? btoa(binary)
      : Buffer.from(bytes).toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64UrlUtf8(token: string): string {
  const padded = token.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((token.length + 3) % 4);
  if (typeof atob === 'function') {
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  }
  return Buffer.from(padded, 'base64').toString('utf8');
}

function sanitizeValueProposition(raw?: Partial<BrandValueProposition>): BrandValueProposition {
  const pillars = Array.isArray(raw?.proofPillars)
    ? raw.proofPillars
        .filter((p) => typeof p === 'string' && p.trim().length > 0)
        .slice(0, 5)
        .map((p) => p.trim().slice(0, 160))
    : DEFAULT_VALUE_PROPOSITION.proofPillars;

  return {
    targetAudience: (raw?.targetAudience ?? DEFAULT_VALUE_PROPOSITION.targetAudience).slice(0, 260),
    customerPain: (raw?.customerPain ?? DEFAULT_VALUE_PROPOSITION.customerPain).slice(0, 260),
    uniquePromise: (raw?.uniquePromise ?? DEFAULT_VALUE_PROPOSITION.uniquePromise).slice(0, 260),
    proofPillars: pillars,
    positioningStatement: (
      raw?.positioningStatement ?? DEFAULT_VALUE_PROPOSITION.positioningStatement
    ).slice(0, 420),
  };
}

function sanitizeSnapshot(raw: SessionContinuitySnapshot): SessionContinuitySnapshot {
  const safeSketch = Array.isArray(raw.brand?.sketchPathsSvg)
    ? raw.brand.sketchPathsSvg.filter((p) => typeof p === 'string').slice(0, 24)
    : [];

  const safeGarments = Array.isArray(raw.brand?.agreedGarments)
    ? raw.brand.agreedGarments.slice(0, 8)
    : DEFAULT_BRAND_STATE.agreedGarments;

  const safePalette: [string, string, string] = [
    raw.brand?.palette?.[0] || DEFAULT_BRAND_STATE.palette[0],
    raw.brand?.palette?.[1] || DEFAULT_BRAND_STATE.palette[1],
    raw.brand?.palette?.[2] || DEFAULT_BRAND_STATE.palette[2],
  ];

  const safeMessages = Array.isArray(raw.recentMessages)
    ? raw.recentMessages
        .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .slice(-8)
        .map((m) => ({
          role: m.role,
          content: m.content.slice(0, 480),
        }))
    : [];

  return {
    v: 1,
    savedAt: raw.savedAt || new Date().toISOString(),
    scenario: raw.scenario || {},
    brand: {
      brandName: (raw.brand?.brandName || DEFAULT_BRAND_STATE.brandName).slice(0, 60),
      tagline: (raw.brand?.tagline || DEFAULT_BRAND_STATE.tagline).slice(0, 120),
      styleDirection: raw.brand?.styleDirection || DEFAULT_BRAND_STATE.styleDirection,
      palette: safePalette,
      logoShape: raw.brand?.logoShape || DEFAULT_BRAND_STATE.logoShape,
      sketchPathsSvg: safeSketch,
      motionStyle: raw.brand?.motionStyle || DEFAULT_BRAND_STATE.motionStyle,
      agreedGarments: safeGarments,
      placement: raw.brand?.placement || DEFAULT_BRAND_STATE.placement,
      designNotes: (raw.brand?.designNotes || '').slice(0, 800),
      valueProposition: sanitizeValueProposition(raw.brand?.valueProposition),
    },
    conversationSummary: (raw.conversationSummary || '').slice(0, 1500),
    recentMessages: safeMessages,
  };
}

export function encodeContinuityCode(snapshot: SessionContinuitySnapshot): string {
  const clean = sanitizeSnapshot(snapshot);
  return `${CODE_PREFIX}${toBase64UrlUtf8(JSON.stringify(clean))}`;
}

export function decodeContinuityCode(inputText: string): {
  ok: true;
  snapshot: SessionContinuitySnapshot;
} | {
  ok: false;
  error: string;
} {
  const trimmed = inputText.trim();
  if (!trimmed) {
    return { ok: false, error: 'الخانة فارغة — الصق كود الجلسة أو ارفع ملف الحفظ أولاً.' };
  }

  try {
    let parsed: unknown;
    if (trimmed.startsWith('{')) {
      parsed = JSON.parse(trimmed);
    } else {
      const codeToken = trimmed.startsWith(CODE_PREFIX)
        ? trimmed.slice(CODE_PREFIX.length).replace(/\s+/g, '')
        : trimmed.replace(/\s+/g, '');
      const jsonStr = fromBase64UrlUtf8(codeToken);
      parsed = JSON.parse(jsonStr);
    }

    if (!parsed || typeof parsed !== 'object') {
      return { ok: false, error: 'تنسيق الكود غير صالح.' };
    }

    const obj = parsed as Partial<SessionContinuitySnapshot>;
    if (obj.v !== 1 || !obj.brand) {
      return { ok: false, error: 'هذا الكود لا يطابق صيغة جلسة DoDo المعتمدة.' };
    }

    return {
      ok: true,
      snapshot: sanitizeSnapshot(obj as SessionContinuitySnapshot),
    };
  } catch {
    return {
      ok: false,
      error: 'تعذر قراءة كود الاستئناف. تأكد من نسخ الكود كاملاً بدايةً من DODO1- أو رفع ملف .json صحيح.',
    };
  }
}

export function buildHumanSummaryAr(snapshot: SessionContinuitySnapshot): string {
  const garmentsMap: Record<GarmentPieceId, string> = {
    oversize_tee: 'تيشيرت أوفرسايز',
    heavy_hoodie: 'هودي ثقيل',
    boxy_crew: 'سويت شيرت Boxy',
    varsity_jacket: 'جاكيت Varsity',
    polo_knit: 'بولو نيت',
    tote_bag: 'توت باج قماش',
  };

  const pieces =
    snapshot.brand.agreedGarments.map((g) => garmentsMap[g] || g).join('، ') || 'لم تُحدد بعد';
  const capitalLine = snapshot.scenario.capital
    ? `${snapshot.scenario.capital.toLocaleString('en-US')} ${snapshot.scenario.currency || 'EGP'}`
    : 'غير محدد';
  const vp = snapshot.brand.valueProposition;

  const lines = [
    `ملخص جلسة DoDo — براند: ${snapshot.brand.brandName} (${snapshot.brand.tagline})`,
    vp?.positioningStatement ? `• القيمة المقترحة (Value Proposition): ${vp.positioningStatement}` : '',
    vp?.targetAudience ? `• الجمهور المستهدف: ${vp.targetAudience}` : '',
    `• طريقة التشغيل في المحاكي: ${snapshot.scenario.mfgModel || 'غير محددة'} | رأس المال: ${capitalLine}`,
    `• القطع المتفق عليها: ${pieces}`,
    `• التوجيه الفني والألوان: ${snapshot.brand.styleDirection} (${snapshot.brand.palette.join(' / ')}) | حركة اللوجو: ${snapshot.brand.motionStyle}`,
    snapshot.brand.sketchPathsSvg.length > 0
      ? `• السكتش المرسوم: محفوظ (${snapshot.brand.sketchPathsSvg.length} خط رسم متجه)`
      : `• شكل الشعار: ${snapshot.brand.logoShape}`,
    snapshot.brand.designNotes ? `• ملاحظات التصميم والخامة: ${snapshot.brand.designNotes}` : '',
    snapshot.conversationSummary ? `• خلاصة الاتفاق والنقاش: ${snapshot.conversationSummary}` : '',
  ].filter(Boolean);

  return lines.join('\n');
}
