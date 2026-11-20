export type VisualGuideId =
  | 'fabric_gsm'
  | 'tech_pack_cad'
  | 'trims_printing_aql'
  | 'supply_chain_pathways';

export interface VisualGuideSpec {
  id: VisualGuideId;
  titleAr: string;
  captionAr: string;
  imageAltAr: string;
  searchQueryEn: string;
  videoSearchQueryEn: string;
  attributedSources: Array<{
    name: string;
    domain: string;
    url: string;
  }>;
}

export interface CitationLike {
  title: string;
  uri: string;
}

export const VISUAL_GUIDES: Record<VisualGuideId, VisualGuideSpec> = {
  fabric_gsm: {
    id: 'fabric_gsm',
    titleAr: 'توضيح بصري: بنية النسيج وأوزان القماش (GSM)',
    captionAr:
      'مقارنة مرئية لبنية الغزل وثقل القماش: سنجل جيرسي خفيف (160 GSM) للصيفي، قطن ممشط متوسط متماسك (220 GSM) للتيشيرتات الأساسية، وميلتون/فليس شتوي مبطن (380 GSM).',
    imageAltAr: 'لوحة مقارنة بصرية لأوزان الأقمشة القطنية وبنية الحياكة 160 و220 و380 GSM',
    searchQueryEn: 'single jersey knit vs fleece fabric GSM weave structure cotton',
    videoSearchQueryEn: 'fabric GSM weight single jersey fleece explained textile',
    attributedSources: [
      { name: 'CottonWorks', domain: 'cottonworks.com', url: 'https://www.cottonworks.com' },
      { name: 'Textile Learner', domain: 'textilelearner.net', url: 'https://textilelearner.net' },
      { name: 'The Textile Institute', domain: 'textileinstitute.org', url: 'https://www.textileinstitute.org' },
      { name: 'SwatchOn', domain: 'swatchon.com', url: 'https://swatchon.com' },
    ],
  },
  tech_pack_cad: {
    id: 'tech_pack_cad',
    titleAr: 'توضيح بصري: ملف المواصفات الفنية (Tech Pack) وتعشيق الباترون',
    captionAr:
      'رسم هندسي أمامي وخلفي لتحديد نقاط القياس (عرض الصدر، طول الجسم، سقوط الكتف، والكم) مع مخطط تعشيق الباترون (Marker Nesting) لتقليل هالك القص في المصنع.',
    imageAltAr: 'مخطط Tech Pack لتيشيرت وهودي أوفرسايز مع جدول نقاط القياس وتعشيق الباترون',
    searchQueryEn: 'apparel tech pack flat sketch measurement spec sheet marker layout',
    videoSearchQueryEn: 'how to make apparel tech pack CLO 3D pattern marker tutorial',
    attributedSources: [
      { name: 'CLO 3D', domain: 'clo3d.com', url: 'https://www.clo3d.com' },
      { name: 'Lectra', domain: 'lectra.com', url: 'https://www.lectra.com' },
      { name: 'Adobe Illustrator', domain: 'adobe.com', url: 'https://www.adobe.com' },
      { name: 'Optitex', domain: 'optitex.com', url: 'https://optitex.com' },
    ],
  },
  trims_printing_aql: {
    id: 'trims_printing_aql',
    titleAr: 'توضيح بصري: الإكسسوارات والتيكت والطباعة وفحص الجودة (AQL)',
    captionAr:
      'عناصر القيمة المضافة للقطعة: تيكت الرقبة المنسوج (Woven Label)، كرت السعر (Hangtag)، السحابات المعدنية، عينات التطريز وطباعة النقل الحراري (DTF)، وشريط القياس لفحص المطابقة.',
    imageAltAr: 'دليل بصري لإكسسوارات الملابس والتيكت والطباعة والتطريز وأدوات الفحص',
    searchQueryEn: 'woven neck label hangtag YKK zipper embroidery DTF transfer inspection',
    videoSearchQueryEn: 'DTF printing vs embroidery woven label AQL garment quality inspection',
    attributedSources: [
      { name: 'YKK', domain: 'ykk.com', url: 'https://www.ykk.com' },
      { name: 'Avery Dennison', domain: 'averydennison.com', url: 'https://www.averydennison.com' },
      { name: 'Epson', domain: 'epson.com', url: 'https://epson.com' },
      { name: 'Tajima', domain: 'tajima.com', url: 'https://www.tajima.com' },
      { name: 'AATCC', domain: 'aatcc.org', url: 'https://www.aatcc.org' },
    ],
  },
  supply_chain_pathways: {
    id: 'supply_chain_pathways',
    titleAr: 'توضيح بصري: الفرق بين مكاتب الجملة والبلانكات (White-Label) والتصنيع (CMT/FOB)',
    captionAr:
      'مقارنة لمسارات الشغل الثلاثة: من اليسار (شراء جاهز من مكاتب الجملة بدون خامات) ← الوسط (تجهيز بلانكات سادة بالتيكت والطباعة) ← اليمين (طاولة القص وماكينات الخياطة في التصنيع الخاص).',
    imageAltAr: 'رسم تخطيطي لمسارات صناعة الملابس: الجملة الجاهزة مقابل White-Label مقابل التصنيع CMT',
    searchQueryEn: 'CMT vs FOB garment factory sewing line white label apparel production',
    videoSearchQueryEn: 'CMT vs FOB garment manufacturing sewing line wholesale tour',
    attributedSources: [
      { name: 'Sourcify', domain: 'trysourcify.com', url: 'https://www.trysourcify.com' },
      { name: 'ETDA Egypt', domain: 'etda.gov.eg', url: 'https://www.etda.gov.eg' },
      { name: 'Fashiondex', domain: 'fashiondex.com', url: 'https://fashiondex.com' },
      { name: 'Jack Sewing Machine', domain: 'chinajack.com', url: 'https://www.chinajack.com' },
    ],
  },
};

export function selectVisualGuidesForText(text: string): VisualGuideSpec[] {
  const q = text.toLowerCase();
  const scores: Array<{ id: VisualGuideId; score: number }> = [
    {
      id: 'fabric_gsm',
      score:
        (q.match(/قماش|قطن|كتان|بوليستر|gsm|غزل|نسيج|سنجل|جيرسي|ميلتون|فليس|خامة|خامات|combed|carded|cotton|fabric|linen/g)
          ?.length ?? 0) * 2,
    },
    {
      id: 'tech_pack_cad',
      score:
        (q.match(/باترون|مقاس|قياسات|tech pack|3d|cad|clo|lectra|optitex|gerber|illustrator|تعشيق|marker|عينة|تصميم/g)
          ?.length ?? 0) * 2,
    },
    {
      id: 'trims_printing_aql',
      score:
        (q.match(/تيكت|سحاب|خيط|تغليف|طباع|تطريز|جود|aql|dtf|dtg|ykk|coats|epson|tajima|kornit|label|zipper|فحص/g)
          ?.length ?? 0) * 2,
    },
    {
      id: 'supply_chain_pathways',
      score:
        (q.match(/جملة|مكتب|مصنع|ورشة|cmt|fob|pod|white.?label|بلانك|تصنيع|تصدير|ماكين|سلسلة|بداية|تكلفة|ربح|هامش/g)
          ?.length ?? 0) * 2,
    },
  ];

  const sorted = scores.sort((a, b) => b.score - a.score);
  const top = sorted.filter((s) => s.score > 0).slice(0, 2);
  if (top.length === 0) {
    return [VISUAL_GUIDES.supply_chain_pathways, VISUAL_GUIDES.fabric_gsm];
  }
  return top.map((item) => VISUAL_GUIDES[item.id]);
}

export function extractVideoLinks(citations: CitationLike[] = []): CitationLike[] {
  return citations.filter((c) => {
    const u = c.uri.toLowerCase();
    return (
      u.includes('youtube.com') ||
      u.includes('youtu.be') ||
      u.includes('vimeo.com') ||
      u.includes('/video') ||
      u.includes('webinar')
    );
  });
}

export function shouldRecommendVideoLinks(text: string, citations: CitationLike[] = []): boolean {
  if (extractVideoLinks(citations).length > 0) return true;
  const q = text.toLowerCase();
  return /فيديو|شرح|عملي|إزاي|كيف|خطوة|ماكين|طباع|تطريز|قص|خياط|3d|clo|dtf|aql|جملة|مصنع|باترون|قماش/.test(
    q
  );
}

export function buildSourceImageSearchUrl(domain: string, topicQueryEn: string): string {
  return `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`site:${domain} ${topicQueryEn}`)}`;
}

export function buildYouTubeTutorialUrl(queryEn: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(queryEn)}`;
}
