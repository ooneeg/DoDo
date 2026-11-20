import type {
  BrandIdentityState,
  BrandStyleDirection,
  BrandValueProposition,
  DesignPlacementId,
  GarmentPieceId,
  LogoShapePreset,
  MotionStylePreset,
} from './sessionContinuity';

export interface GarmentTemplate {
  id: GarmentPieceId;
  nameAr: string;
  nameEn: string;
  recommendedGsm: string;
  fitAr: string;
  bodyPath: string;
  collarPath: string;
  seamPaths: string[];
  placementBox: Record<DesignPlacementId, { x: number; y: number; scale: number; labelAr: string }>;
}

export const GARMENT_TEMPLATES: Record<GarmentPieceId, GarmentTemplate> = {
  oversize_tee: {
    id: 'oversize_tee',
    nameAr: 'تيشيرت أوفرسايز',
    nameEn: 'Drop-Shoulder Boxy Tee',
    recommendedGsm: '240 – 280 GSM Single Jersey',
    fitAr: 'أكتاف ساقطة وقصة عريضة مناسبة للستريت وير والـ White-Label',
    bodyPath:
      'M 86 42 L 122 36 Q 150 56 178 36 L 214 42 L 266 78 L 244 128 L 216 112 L 216 266 L 84 266 L 84 112 L 56 128 L 34 78 Z',
    collarPath: 'M 122 36 Q 150 64 178 36',
    seamPaths: ['M 84 112 L 86 42', 'M 216 112 L 214 42', 'M 84 252 L 216 252'],
    placementBox: {
      left_chest: { x: 184, y: 112, scale: 0.34, labelAr: 'شعار صدر يمين/يسار (تطريز أو DTF)' },
      center_front: { x: 150, y: 144, scale: 0.68, labelAr: 'طباعة أمامية مركزية' },
      back_oversize: { x: 150, y: 152, scale: 0.85, labelAr: 'جرافيك ظهر كبير (Back Print)' },
      hem_woven: { x: 108, y: 238, scale: 0.25, labelAr: 'تيكت حياكة سفلي (Woven Label)' },
    },
  },
  heavy_hoodie: {
    id: 'heavy_hoodie',
    nameAr: 'هودي شتوي ثقيل',
    nameEn: 'Heavyweight Fleece Hoodie',
    recommendedGsm: '360 – 420 GSM Milton Fleece',
    fitAr: 'كابيشون مبطن، جيب كانجارو أمامي، ورباط معالج',
    bodyPath:
      'M 104 44 C 118 14 182 14 196 44 L 222 50 L 268 118 L 254 228 L 228 228 L 220 124 L 216 268 L 84 268 L 80 124 L 72 228 L 46 228 L 32 118 L 78 50 Z',
    collarPath: 'M 108 44 Q 150 76 192 44 M 116 40 C 128 20 172 20 184 40',
    seamPaths: [
      'M 104 188 L 196 188 L 204 244 L 96 244 Z',
      'M 84 252 L 216 252',
    ],
    placementBox: {
      left_chest: { x: 182, y: 108, scale: 0.32, labelAr: 'تطريز صدر عالي الكثافة' },
      center_front: { x: 150, y: 128, scale: 0.56, labelAr: 'شعار وسط الصدر (فوق الجيب)' },
      back_oversize: { x: 150, y: 150, scale: 0.84, labelAr: 'طباعة ظهر واسعة' },
      hem_woven: { x: 106, y: 232, scale: 0.24, labelAr: 'ليبل منسوج على الجيب' },
    },
  },
  boxy_crew: {
    id: 'boxy_crew',
    nameAr: 'سويت شيرت Boxy',
    nameEn: 'Boxy Crewneck Sweatshirt',
    recommendedGsm: '320 – 380 GSM French Terry',
    fitAr: 'بدون كابيشون مع ريب رقبة عريض مثالي للبراندات المينيمال',
    bodyPath:
      'M 92 40 L 122 36 Q 150 54 178 36 L 208 40 L 266 106 L 250 226 L 226 226 L 218 118 L 214 264 L 86 264 L 82 118 L 74 226 L 50 226 L 34 106 Z',
    collarPath: 'M 120 36 Q 150 66 180 36',
    seamPaths: ['M 86 248 L 214 248', 'M 126 52 Q 150 72 174 52'],
    placementBox: {
      left_chest: { x: 184, y: 112, scale: 0.32, labelAr: 'شعار صدر دقيق' },
      center_front: { x: 150, y: 142, scale: 0.64, labelAr: 'عمل فني مركزي' },
      back_oversize: { x: 150, y: 150, scale: 0.82, labelAr: 'طباعة ظهر متكاملة' },
      hem_woven: { x: 108, y: 234, scale: 0.25, labelAr: 'باتش جلدي/منسوج سفلي' },
    },
  },
  varsity_jacket: {
    id: 'varsity_jacket',
    nameAr: 'جاكيت Varsity',
    nameEn: 'College / Bomber Jacket',
    recommendedGsm: '420 GSM + Melton / Twill',
    fitAr: 'قطعة Hero ذات سعر بيع مرتفع مناسبة للتطريز الشينيل والأزرار الكبس',
    bodyPath:
      'M 96 42 L 126 36 L 150 48 L 174 36 L 204 42 L 264 102 L 250 226 L 226 226 L 218 116 L 214 266 L 86 266 L 82 116 L 74 226 L 50 226 L 36 102 Z',
    collarPath: 'M 124 38 Q 150 58 176 38 M 150 48 L 150 266',
    seamPaths: ['M 86 248 L 214 248', 'M 110 184 L 124 214', 'M 190 184 L 176 214'],
    placementBox: {
      left_chest: { x: 182, y: 112, scale: 0.3, labelAr: 'باتش شينيل صدر (يمنع تقاطع خط الأزرار)' },
      center_front: { x: 182, y: 114, scale: 0.34, labelAr: 'شعار صدر جانبي متوازن' },
      back_oversize: { x: 150, y: 148, scale: 0.86, labelAr: 'تطريز ظهر فخم على الجاكيت' },
      hem_woven: { x: 110, y: 236, scale: 0.24, labelAr: 'تيكت براند أسفل الجاكيت' },
    },
  },
  polo_knit: {
    id: 'polo_knit',
    nameAr: 'تيشيرت بولو بيكيه',
    nameEn: 'Piqué Knit Polo',
    recommendedGsm: '220 – 250 GSM Cotton Piqué',
    fitAr: 'ياقة بيكيه وأزرار أمامية بطابع Smart Casual أو فخامة هادئة',
    bodyPath:
      'M 92 42 L 124 34 L 150 48 L 176 34 L 208 42 L 260 80 L 238 128 L 212 112 L 212 264 L 88 264 L 88 112 L 62 128 L 40 80 Z',
    collarPath: 'M 124 34 L 148 56 L 136 62 L 116 40 Z M 176 34 L 152 56 L 164 62 L 184 40 Z M 150 56 L 150 108',
    seamPaths: ['M 88 250 L 212 250'],
    placementBox: {
      left_chest: { x: 182, y: 116, scale: 0.28, labelAr: 'تطريز ناعم على الصدر (إلزامي للبولو)' },
      center_front: { x: 182, y: 118, scale: 0.3, labelAr: 'علامة صدر جانبية نظيفة' },
      back_oversize: { x: 150, y: 148, scale: 0.72, labelAr: 'اسم البراند أسفل الياقة من الخلف' },
      hem_woven: { x: 108, y: 238, scale: 0.22, labelAr: 'تيكت فتحة جانبية سفلى' },
    },
  },
  tote_bag: {
    id: 'tote_bag',
    nameAr: 'توت باج كانفس',
    nameEn: 'Heavy Canvas Tote Bag',
    recommendedGsm: '340 GSM Cotton Duck Canvas',
    fitAr: 'قطعة مكملة منخفضة التكلفة لبناء الوعي بالهوية أو هدية مع الأوردر',
    bodyPath: 'M 78 96 L 222 96 L 232 264 L 68 264 Z',
    collarPath: 'M 106 96 C 106 30 194 30 194 96',
    seamPaths: ['M 78 110 L 222 110'],
    placementBox: {
      left_chest: { x: 150, y: 178, scale: 0.56, labelAr: 'شعار وسط الشنطة' },
      center_front: { x: 150, y: 180, scale: 0.78, labelAr: 'جرافيك كامل الواجهة' },
      back_oversize: { x: 150, y: 180, scale: 0.82, labelAr: 'شعار وهوية كبيرين' },
      hem_woven: { x: 104, y: 242, scale: 0.24, labelAr: 'ليبل جانبي مخيط' },
    },
  },
};

export const STYLE_DIRECTIONS: Record<
  BrandStyleDirection,
  { labelAr: string; fontFamily: string; badgeBorder: string; descriptionAr: string }
> = {
  streetwear: {
    labelAr: 'ستريت وير جريء (Streetwear)',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    badgeBorder: '4',
    descriptionAr: 'خطوط عريضة، تباين لوني حاد، وجاهزية لطباعة الظهر والتطريز السميك.',
  },
  minimal: {
    labelAr: 'مينيمال معاصر (Minimal)',
    fontFamily: "'IBM Plex Sans Arabic', sans-serif",
    badgeBorder: '1.5',
    descriptionAr: 'نسب نظيفة، حروف متباعدة، وشعار صغير دقيق يناسب البيسك اليومي.',
  },
  luxury: {
    labelAr: 'فخامة هادئة (Quiet Luxury)',
    fontFamily: 'Georgia, serif',
    badgeBorder: '2',
    descriptionAr: 'إحساس تراثي متزن، تذهيب أو تطريز خيط حريري، وتيكت منسوج فاخر.',
  },
  athletic: {
    labelAr: 'رياضي وتقني (Technical)',
    fontFamily: "'IBM Plex Mono', monospace",
    badgeBorder: '3',
    descriptionAr: 'أشكال ديناميكية سريعة القراءة مع طباعة عاكسة أو سيليكون حراري.',
  },
  heritage: {
    labelAr: 'هوية عربية/مصرية حديثة',
    fontFamily: "'IBM Plex Sans Arabic', sans-serif",
    badgeBorder: '2.5',
    descriptionAr: 'دمج الخط العربي والزخرفة الهندسية في قالب علامة ملابس عالمية.',
  },
};

export const CURATED_PALETTES: Array<{
  id: string;
  labelAr: string;
  colors: [string, string, string]; // [primary, accent, garmentBase]
}> = [
  { id: 'nile_amber', labelAr: 'نيل وكهرمان (هوية دافئة)', colors: ['#0f766e', '#d97706', '#1e293b'] },
  { id: 'obsidian_lime', labelAr: 'فحمي وحمضي (ستريت وير)', colors: ['#18181b', '#84cc16', '#27272a'] },
  { id: 'sand_espresso', labelAr: 'رملي وإسبريسو (فخامة هادئة)', colors: ['#451a03', '#b45309', '#f5f0e6'] },
  { id: 'crimson_slate', labelAr: 'عنابي وكلاسيك (فارسيتي)', colors: ['#881337', '#f59e0b', '#0f172a'] },
  { id: 'cobalt_cream', labelAr: 'كوبالت وكريمي (عصري)', colors: ['#1d4ed8', '#38bdf8', '#f8fafc'] },
];

export const MOTION_STYLE_LABELS: Record<MotionStylePreset, { labelAr: string; descAr: string }> = {
  stitch: { labelAr: 'رسم غرزة الخياطة (Stitch Draw)', descAr: 'يظهر اللوجو وكأنه يُنسج بالإبرة والخيط على القماش.' },
  pulse: { labelAr: 'نبض العلامة (Kinetic Pulse)', descAr: 'حركة نبض متزنة تبرز حضور الشعار في الريلز والمتجر.' },
  orbit: { labelAr: 'دوران الشارة (3D Orbit)', descAr: 'التفاف الشعار بحركة حلقية مناسبة لشاشات الانتظار والفيديو.' },
  runway: { labelAr: 'ظهور المنصة (Runway Reveal)', descAr: 'انكشاف سينمائي درامي مثالي لإطلاق الدروب الجديد.' },
  shimmer: { labelAr: 'بريق المعدن (Luxury Shimmer)', descAr: 'تدرج ضوئي ناعم يعكس طابع الليبل الذهبي والفاخر.' },
};

export interface SketchIdeaCard {
  id: string;
  titleAr: string;
  conceptAr: string;
  suggestedBrandName: string;
  suggestedTagline: string;
  recommendedShape: LogoShapePreset;
  recommendedGarment: GarmentPieceId;
  recommendedPalette: [string, string, string];
  printSpecAr: string;
}

export function analyzeSketchGeometry(sketchPathsSvg: string[]): {
  strokeCount: number;
  complexityLabelAr: string;
  suggestedFormAr: string;
} {
  const strokeCount = sketchPathsSvg.length;
  if (strokeCount === 0) {
    return {
      strokeCount: 0,
      complexityLabelAr: 'لم يتم رسم خطوط بعد',
      suggestedFormAr: 'ارسم أي شكل بسيط (حرف، موجة، تاج، نجمة، خط هندسي) وسأولد منه أفكاراً فوراً.',
    };
  }
  const totalLen = sketchPathsSvg.reduce((acc, d) => acc + d.length, 0);
  if (strokeCount <= 3 && totalLen < 500) {
    return {
      strokeCount,
      complexityLabelAr: 'سكتش مينيمال حاد (1-3 خطوط)',
      suggestedFormAr: 'مثالي جداً للتطريز الدقيق عالي الكثافة وتيكت الرقبة المنسوج دون فقدان التفاصيل.',
    };
  }
  if (strokeCount <= 8) {
    return {
      strokeCount,
      complexityLabelAr: 'شعار متوازن متوسط التفاصيل',
      suggestedFormAr: 'يناسب طباعة DTF أو السلك سكرين على الصدر مع نسخة مبسطة لليبل الداخلي.',
    };
  }
  return {
    strokeCount,
    complexityLabelAr: 'عمل فني تفصيلي (Graphic Illustration)',
    suggestedFormAr: 'الأقوى في طباعة الظهر الكبيرة (Back Print) لتيشيرت أوفرسايز أو هودي شتوي.',
  };
}

export function generateSketchInspiredConcepts(
  brand: BrandIdentityState
): SketchIdeaCard[] {
  const geom = analyzeSketchGeometry(brand.sketchPathsSvg);
  const baseName = brand.brandName.trim() || 'KHEIT';

  return [
    {
      id: 'concept_embroidery',
      titleAr: '1. شعار تطريز الصدر المستلهم من السكتش',
      conceptAr: `تحويل خطوط رسمتك (${geom.complexityLabelAr}) إلى شارة تطريز متماسكة بدون تفاصيل زائدة تضيع مع الخيط، مع كتابة الاسم أسفلها بخط هندسي نظيف.`,
      suggestedBrandName: baseName,
      suggestedTagline: 'STITCHED EDITION · 380 GSM',
      recommendedShape: brand.sketchPathsSvg.length > 0 ? 'sketch' : 'stitch',
      recommendedGarment: 'heavy_hoodie',
      recommendedPalette: ['#0f766e', '#d97706', '#1e293b'],
      printSpecAr: 'تطريز مسطح + خيط Madeira 40wt بعرض 7 سم على يسار الصدر',
    },
    {
      id: 'concept_street_back',
      titleAr: '2. جرافيك ظهر ستريت وير (Statement Back Print)',
      conceptAr: `تكبير شكل السكتش التخيلي داخل إطار هندسي عصري مع إحداثيات المجموعة على الظهر ليصنع قطعة بصرية لافتة من الخلف.`,
      suggestedBrandName: `${baseName} STUDIO`,
      suggestedTagline: 'DROP 01 // URBAN ARCHIVE',
      recommendedShape: brand.sketchPathsSvg.length > 0 ? 'sketch' : 'orbit',
      recommendedGarment: 'oversize_tee',
      recommendedPalette: ['#18181b', '#84cc16', '#27272a'],
      printSpecAr: 'طباعة Screen Print أو Kornit DTG بعرض 30 سم على الظهر',
    },
    {
      id: 'concept_woven_luxury',
      titleAr: '3. هوية الفخامة الهادئة والتيكت المنسوج',
      conceptAr: `تجريد فكرتك إلى أيقونة مونوغرام متزنة مع ألوان ترابية هادئة ترفع القيمة المدركة للقطعة وتسمح بهامش ربح أعلى.`,
      suggestedBrandName: baseName,
      suggestedTagline: 'ATELIER · CAIRO TO GLOBAL',
      recommendedShape: brand.sketchPathsSvg.length > 0 ? 'sketch' : 'crest',
      recommendedGarment: 'polo_knit',
      recommendedPalette: ['#451a03', '#b45309', '#f5f0e6'],
      printSpecAr: 'تيكت Damask منسوج + ختم حراري ناعم أو تطريز ناعم',
    },
    {
      id: 'concept_varsity_badge',
      titleAr: '4. شارة Varsity وتجهيز الدفعة الأولى',
      conceptAr: `وضع السكتش داخل درع أو شارة دائرية بارزة تصلح للجاكيت والشنطة التكميلية (Tote Bag) لخلق عائلة منتجات مترابطة.`,
      suggestedBrandName: `${baseName} CLUB`,
      suggestedTagline: 'HEAVYWEIGHT GOODS',
      recommendedShape: brand.sketchPathsSvg.length > 0 ? 'sketch' : 'monogram',
      recommendedGarment: 'varsity_jacket',
      recommendedPalette: ['#881337', '#f59e0b', '#0f172a'],
      printSpecAr: 'باتش شينيل (Chenille Patch) مع حواف تطريز ساتان',
    },
  ];
}

export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildBrandSvgMarkup(brand: BrandIdentityState): string {
  const [primary, accent] = brand.palette;
  const safeName = escapeXml((brand.brandName || 'DoDo').slice(0, 22));
  const safeTag = escapeXml((brand.tagline || '').slice(0, 36));
  const initial = escapeXml((brand.brandName || 'D').trim().charAt(0).toUpperCase());

  const hasSketch = brand.sketchPathsSvg.length > 0 && brand.logoShape === 'sketch';
  const sketchMarkup = hasSketch
    ? `<g transform="translate(80, 24) scale(0.5)">
        ${brand.sketchPathsSvg
          .map(
            (d) =>
              `<path d="${escapeXml(d)}" fill="none" stroke="${escapeXml(primary)}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" />`
          )
          .join('')}
      </g>`
    : '';

  let emblem = sketchMarkup;
  if (!emblem) {
    if (brand.logoShape === 'crest') {
      emblem = `
        <path d="M160 26 L216 48 V102 C216 134 160 156 160 156 C160 156 104 134 104 102 V48 Z" fill="none" stroke="${escapeXml(primary)}" stroke-width="5"/>
        <path d="M160 40 L202 58 V98 C202 122 160 140 160 140 C160 140 118 122 118 98 V58 Z" fill="${escapeXml(accent)}" fill-opacity="0.16" stroke="${escapeXml(accent)}" stroke-width="2.5"/>
        <text x="160" y="106" text-anchor="middle" font-size="44" font-weight="800" fill="${escapeXml(primary)}">${initial}</text>
      `;
    } else if (brand.logoShape === 'stitch') {
      emblem = `
        <rect x="104" y="34" width="112" height="112" rx="22" fill="none" stroke="${escapeXml(primary)}" stroke-width="4" stroke-dasharray="10 6"/>
        <path d="M126 120 L160 54 L194 120 M138 100 H182" fill="none" stroke="${escapeXml(accent)}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
      `;
    } else if (brand.logoShape === 'orbit') {
      emblem = `
        <circle cx="160" cy="90" r="52" fill="none" stroke="${escapeXml(primary)}" stroke-width="4"/>
        <ellipse cx="160" cy="90" rx="68" ry="22" transform="rotate(-24 160 90)" fill="none" stroke="${escapeXml(accent)}" stroke-width="3.5"/>
        <circle cx="160" cy="90" r="14" fill="${escapeXml(primary)}"/>
      `;
    } else {
      emblem = `
        <rect x="108" y="36" width="104" height="104" rx="26" fill="${escapeXml(primary)}"/>
        <circle cx="192" cy="54" r="9" fill="${escapeXml(accent)}"/>
        <text x="160" y="106" text-anchor="middle" font-size="52" font-weight="800" fill="#ffffff">${initial}</text>
      `;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" width="320" height="240">
  <rect width="320" height="240" rx="24" fill="#ffffff"/>
  ${emblem}
  <text x="160" y="188" text-anchor="middle" font-family="sans-serif" font-size="28" font-weight="800" letter-spacing="3" fill="${escapeXml(primary)}">${safeName}</text>
  <text x="160" y="214" text-anchor="middle" font-family="monospace" font-size="11" letter-spacing="2" fill="${escapeXml(accent)}">${safeTag}</text>
</svg>`;
}

export interface ValuePropositionArchetype {
  id: string;
  labelAr: string;
  angleAr: string;
  build: (brandName: string) => BrandValueProposition;
}

export const VALUE_PROPOSITION_ARCHETYPES: ValuePropositionArchetype[] = [
  {
    id: 'craft_value',
    labelAr: 'خامة ثقيلة بسعر عادل',
    angleAr: 'تركيز على جودة القطن المصري والباترون مقابل أسعار البراندات المستوردة.',
    build: (brandName) => {
      const name = (brandName || 'KHEIT').trim();
      return {
        targetAudience: 'الشباب والمهنيون (20–35 سنة) اللي يهمهم خامة تثبت وتعيش في اللبس اليومي.',
        customerPain: 'القطع المتاحة إما مستوردة بأسعار مبالغ فيها أو محلية بتكش وتبهت بعد غسلتين.',
        uniquePromise: 'جودة قماش ثقيل وتقفيل تصدير بسعر محلي واضح ومضمون.',
        proofPillars: [
          'قطن مصري ممشط عالي الكثافة (260–380 GSM) معالج ضد الانكماش',
          'خياطة أوفر لوك مزدوجة وتيكت منسوج لا يضايق الرقبة',
          'ضمان استبدال مجاني إذا تغيرت الخامة أو الطباعة',
        ],
        positioningStatement: `لـ ${'الشباب الباحثين عن جودة تعيش'}، يقدم براند ${name} قطعاً بوزن ثقيل وتقفيل تصدير تحل مشكلة الكششان والبهتان بسعر محلي عادل.`,
      };
    },
  },
  {
    id: 'limited_culture',
    labelAr: 'ستريت وير محدود وهوية ثقافية',
    angleAr: 'قيمة التميز والندرة والإحساس بالانتماء لمجتمع أو قصة محلية عصرية.',
    build: (brandName) => {
      const name = (brandName || 'KHEIT').trim();
      return {
        targetAudience: 'جمهور الستريت وير وصناع الذوق (18–29 سنة) الباحثون عن قطع تعبّر عن شخصيتهم.',
        customerPain: 'تكرار نفس الديزاينات المستهلكة في كل البراندات وعدم وجود هوية أصلية تحترم ثقافتنا.',
        uniquePromise: 'دروبات محدودة الترقيم (Limited Drops) بجرافيك أصيل مستوحى من ثقافتنا وتفاصيل غير مكررة.',
        proofPillars: [
          'إصدار محدود بأعداد مرقمة لكل ديزاين بدون إعادة طباعة بنفس الشكل',
          'تطريز شينيل أو طباعة كثيفة عالية الثبات على الظهر والصدر',
          'تغليف وتجربة فتح صندوق (Unboxing) تحكي قصة كل مجموعة',
        ],
        positioningStatement: `لـ ${'صناع الذوق ومحبي الستريت وير'}، يقدم براند ${name} إصدارات محدودة الهوية تجمع الجرافيك الأصيل والباترون العريض لتمنحك تفرداً لا يتكرر في السوق.`,
      };
    },
  },
  {
    id: 'smart_daily_uniform',
    labelAr: 'بيسك عملي لا يحتاج تفكيراً',
    angleAr: 'تركيز على الراحة وتناسق الألوان وسهولة التنسيق للعمل والخروج.',
    build: (brandName) => {
      const name = (brandName || 'KHEIT').trim();
      return {
        targetAudience: 'الموظفون ورواد الأعمال والطلبة (23–40 سنة) الباحثون عن لوك أنيق ومريح يومياً.',
        customerPain: 'إهدار الوقت كل صباح في تنسيق قطع غير متوافقة أو خامات تتكرمش وتفقد شكلها.',
        uniquePromise: 'نظام كبسولة متناسق الألوان والقصات (Effortless Daily Uniform) يجمع بين الشياكة والراحة.',
        proofPillars: [
          'لوحة ألوان محايدة متناغمة تسهل لبس أي قطعتين معاً',
          'خامة ناعمة مهواة مقاومة للتجعيد طوال اليوم',
          'دليل مقاسات واضح ومفصل يقلل حيرة الشراء أونلاين',
        ],
        positioningStatement: `لـ ${'المهنيين ومحبي الإطلالة المرتبة اليومية'}، يوفر براند ${name} كبسولة ملابس متناسقة الألوان والقصات تمنحك أناقة فورية طوال اليوم بدون مجهود.`,
      };
    },
  },
  {
    id: 'conscious_traceable',
    labelAr: 'خامة موثقة ومستدامة',
    angleAr: 'شفافية المصدر وشهادات الصباغة الآمنة (OEKO-TEX / GOTS) وقصة التصنيع النظيف.',
    build: (brandName) => {
      const name = (brandName || 'KHEIT').trim();
      return {
        targetAudience: 'العملاء الواعون بالصحة والبيئة والعائلات الباحثة عن خامات آمنة على البشرة.',
        customerPain: 'غموض مصادر الأقمشة والأصباغ الكيميائية الرخيصة التي تسبب حساسية أو تضر بالبيئة.',
        uniquePromise: 'ملابس شفافة المصدر بألياف طبيعية أو معاد تدويرها وصباغة آمنة موثقة.',
        proofPillars: [
          'ألياف قطن أو TENCEL / أقطان غير مبيضة بصباغة منخفضة الأثر',
          'بطاقة تتبع لكل قطعة توضح مكان النسيج والمصنع ونسبة الخامة',
          'تغليف قابل لإعادة التدوير وخالٍ من البلاستيك الضار',
        ],
        positioningStatement: `لـ ${'العملاء الواعين بصحة بشرتهم والبيئة'}، يقدم براند ${name} قطعاً طبيعية موثقة المصدر وصباغة آمنة تجمع النعومة بالشفافية الكاملة.`,
      };
    },
  },
];

export function composeValuePropositionStatement(
  vp: Pick<BrandValueProposition, 'targetAudience' | 'customerPain' | 'uniquePromise'>,
  brandName: string
): string {
  const name = (brandName || 'البراند').trim();
  const audience = vp.targetAudience.trim() || 'العميل المستهدف';
  const promise = vp.uniquePromise.trim() || 'قيمة واضحة ومميزة';
  const pain = vp.customerPain.trim();
  if (pain) {
    return `لـ ${audience}، يقدم براند ${name} ${promise}، ليحل بوضوح مشكلة: ${pain}.`;
  }
  return `لـ ${audience}، يقدم براند ${name} ${promise}.`;
}

export function getValuePropositionReadiness(vp: BrandValueProposition): {
  completedCount: number;
  totalCount: number;
  checks: Array<{ key: string; labelAr: string; done: boolean }>;
} {
  const checks = [
    { key: 'audience', labelAr: 'تحديد الجمهور المستهدف', done: vp.targetAudience.trim().length >= 8 },
    { key: 'pain', labelAr: 'تشخيص مشكلة العميل بالسوق', done: vp.customerPain.trim().length >= 8 },
    { key: 'promise', labelAr: 'صياغة الوعد الفارق للبراند', done: vp.uniquePromise.trim().length >= 8 },
    {
      key: 'proof',
      labelAr: 'تجهيز إثباتات الخامة والتنفيذ',
      done: vp.proofPillars.filter((p) => p.trim().length >= 4).length >= 2,
    },
  ];
  return {
    completedCount: checks.filter((c) => c.done).length,
    totalCount: checks.length,
    checks,
  };
}
