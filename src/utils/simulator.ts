export type CurrencyCode = 'EGP' | 'USD';
export type MarketEnvironment = 'egypt' | 'gulf' | 'global';
export type BrandCategory = 'basics' | 'streetwear' | 'activewear' | 'sustainable' | 'luxury';
export type FabricType =
  | 'egyptian_cotton'
  | 'cotton_blend'
  | 'recycled_poly'
  | 'linen'
  | 'technical';
export type ManufacturingModel =
  | 'wholesale_office'
  | 'white_label'
  | 'workshop'
  | 'cmt'
  | 'fob'
  | 'pod';
export type MacroVolatility = 'low' | 'medium' | 'high';
export type FabricWeightGsm = 160 | 220 | 300 | 380;
export type SourcingOrigin = 'local' | 'imported';
export type SalesChannel = 'dtc' | 'wholesale' | 'hybrid';
export type OperatingLocation =
  | 'cairo_giza'
  | 'delta_mahalla'
  | 'alex_north'
  | 'canal_portsaid'
  | 'upper_egypt'
  | 'gulf_ksa_uae'
  | 'international_remote';

export interface ScenarioInput {
  id?: string;
  name: string;
  capital: number;
  currency: CurrencyCode;
  fxRate: number; // 1 USD = fxRate EGP
  location: OperatingLocation;
  market: MarketEnvironment;
  category: BrandCategory;
  fabric: FabricType;
  gsm: FabricWeightGsm;
  sourcingOrigin: SourcingOrigin;
  mfgModel: ManufacturingModel;
  skuCount: number;
  volatility: MacroVolatility;
  salesChannel: SalesChannel;
  customUnitCost?: number;
  customSellingPrice?: number;
}

export interface BudgetLine {
  key: string;
  labelAr: string;
  amountUsd: number;
  percentage: number;
}

export interface RoadmapPhase {
  stepNumber: number;
  titleAr: string;
  descriptionAr: string;
  recommendedSources: string[];
}

export interface LaunchSuggestion {
  titleAr: string;
  detailAr: string;
  references: string[];
}

export interface PathwayOption {
  model: ManufacturingModel;
  labelAr: string;
  shortTagAr: string;
  requiresRawFabric: boolean;
  unitCostUsd: number;
  suggestedRetailUsd: number;
  grossMarginPct: number;
  netMarginPct: number;
  upfrontCommitmentUsd: number;
  financialCommitmentAr: string;
  possibleUnits: number;
  minRequiredUnits: number;
  capitalSufficient: boolean;
  leadTimeWeeks: string;
  summaryAr: string;
}

export interface LocalSpot {
  zoneNameAr: string;
  roleAr: string;
  bestForAr: string;
  priceGuideAr: string;
}

export interface LocalSourcingGuide {
  locationLabelAr: string;
  headlineAr: string;
  fabricOrWholesaleTipAr: string;
  priceBenchmarksAr: {
    fabricPerKgOrMeterAr: string;
    wholesaleReadyPieceAr: string;
    cmtMakePerPieceAr: string;
    recommendedSellingRangeAr: string;
  };
  spots: LocalSpot[];
}

export interface SimulationResult {
  id: string;
  input: ScenarioInput;
  capitalUsd: number;
  requiresRawFabric: boolean;
  unitFabricCostUsd: number;
  unitMakeCostUsd: number;
  unitTrimsPackagingUsd: number;
  estimatedUnitCostUsd: number;
  estimatedSellingPriceUsd: number;
  isCustomUnitCost: boolean;
  isCustomSellingPrice: boolean;
  unitCostUsd: number;
  suggestedRetailUsd: number;
  grossMarginPct: number;
  grossProfitPerUnitUsd: number;
  markupPct: number;
  unitMarketingCostUsd: number;
  unitFixedOverheadUsd: number;
  unitReturnShippingDragUsd: number;
  netProfitPerUnitUsd: number;
  netMarginPct: number;
  possibleUnits: number;
  unitsPerSku: number;
  minRequiredUnits: number;
  capitalSufficient: boolean;
  breakEvenReachable: boolean;
  breakEvenUnits: number;
  projectedCycleRevenueUsd: number;
  projectedNetCycleProfitUsd: number;
  upfrontCommitmentUsd: number;
  financialCommitmentSummaryAr: string;
  leadTimeWeeks: string;
  budgetAllocations: BudgetLine[];
  riskSummaryAr: string[];
  recommendedActionAr: string;
  strategicSuggestionsAr: LaunchSuggestion[];
  pathwayOptions: PathwayOption[];
  localGuide: LocalSourcingGuide;
  roadmap: RoadmapPhase[];
  locationLabelAr: string;
  marketLabelAr: string;
  categoryLabelAr: string;
  fabricLabelAr: string;
  mfgLabelAr: string;
  volatilityLabelAr: string;
  createdAt: string;
}

export const MARKET_CONFIG: Record<
  MarketEnvironment,
  {
    labelAr: string;
    markup: number;
    marketingPct: number;
    complianceFloorUsd: number;
    complianceNoteAr: string;
    primarySources: string[];
  }
> = {
  egypt: {
    labelAr: 'السوق المحلي (مصر)',
    markup: 2.55,
    marketingPct: 0.24,
    complianceFloorUsd: 180,
    complianceNoteAr: 'سجل تجاري وبطاقة ضريبية + فواتير إلكترونية + مواصفات EOS وحماية علامة محلية.',
    primarySources: ['CottonWorks', 'Textile Learner', 'FEI Egypt', 'EOS Egypt'],
  },
  gulf: {
    labelAr: 'تصدير إقليمي (السعودية والخليج)',
    markup: 3.1,
    marketingPct: 0.27,
    complianceFloorUsd: 950,
    complianceNoteAr: 'شهادة منشأ GOEIC + اتفاقية تيسير/أغادير + تغليف قياسي ومواءمة المقاسات.',
    primarySources: ['ITC', 'GOEIC', 'ETDA', 'CFDA'],
  },
  global: {
    labelAr: 'تصدير عالمي (أوروبا وأمريكا)',
    markup: 3.65,
    marketingPct: 0.29,
    complianceFloorUsd: 2600,
    complianceNoteAr:
      'قائمة المواد المقيدة AAFA RSL + شهادات OEKO-TEX / GOTS / Textile Exchange + تدقيق Better Work.',
    primarySources: ['ITC', 'AAFA', 'Textile Exchange', 'OEKO-TEX', 'Better Work'],
  },
};

export const CATEGORY_CONFIG: Record<
  BrandCategory,
  {
    labelAr: string;
    baseMakeUsd: number;
    readyWholesaleFactor: number;
    samplingComplexity: number;
    adviceAr: string;
    sources: string[];
  }
> = {
  basics: {
    labelAr: 'ملابس أساسية (Basics)',
    baseMakeUsd: 3.2,
    readyWholesaleFactor: 1.0,
    samplingComplexity: 1.0,
    adviceAr: 'الميزة التنافسية هنا في ثبات المقاسات وجودة الغزل ونسبة الانكماش المنخفضة.',
    sources: ['CottonWorks', 'Textile Learner', 'UNIQLO'],
  },
  streetwear: {
    labelAr: 'ستريت وير (Streetwear)',
    baseMakeUsd: 4.9,
    readyWholesaleFactor: 1.38,
    samplingComplexity: 1.25,
    adviceAr: 'الأوزان الثقيلة (300-380 GSM) ودقة الطباعة الرقمية أو التطريز تصنع فارق السعر.',
    sources: ['WTiN', 'CFDA', 'Virgil Abloh', 'Highsnobiety'],
  },
  activewear: {
    labelAr: 'ملابس رياضية (Activewear)',
    baseMakeUsd: 6.4,
    readyWholesaleFactor: 1.5,
    samplingComplexity: 1.45,
    adviceAr: 'يتطلب خيوط مرنة عالية الأداء، خياطة Flatlock، واختبارات طرد الرطوبة والتهوية.',
    sources: ['FabricLink', 'Swicofil', 'AATCC', 'Under Armour'],
  },
  sustainable: {
    labelAr: 'أزياء مستدامة (Eco)',
    baseMakeUsd: 5.9,
    readyWholesaleFactor: 1.48,
    samplingComplexity: 1.35,
    adviceAr: 'لا تعتمد على الادعاء التسويقي فقط؛ وثّق السلسلة بشهادات GRS أو OCS أو GOTS.',
    sources: ['Textile Exchange', 'GOTS', 'OEKO-TEX', 'Lenzing'],
  },
  luxury: {
    labelAr: 'فئة عليا (Accessible Luxury)',
    baseMakeUsd: 11.5,
    readyWholesaleFactor: 2.15,
    samplingComplexity: 1.8,
    adviceAr: 'ركز على التشطيبات الداخلية النظيفة، السحابات الفاخرة (Riri/YKK)، وسرد الهوية البصرية.',
    sources: ['CFDA', 'Tissura', 'Riri', 'Tom Ford'],
  },
};

export const FABRIC_CONFIG: Record<
  FabricType,
  {
    labelAr: string;
    baseMeterUsd: number;
    avgMetersPerGarment: number;
    riskNoteAr: string;
    sources: string[];
  }
> = {
  egyptian_cotton: {
    labelAr: 'قطن مصري ممشط / طويل التيلة',
    baseMeterUsd: 4.35,
    avgMetersPerGarment: 1.55,
    riskNoteAr: 'توفر محلي ممتاز مع حساسية لتقلب أسعار الغزل والانكماش إذا لم يُعالج حرارياً.',
    sources: ['CottonWorks', 'Fibre2Fashion', 'Misr Spinning'],
  },
  cotton_blend: {
    labelAr: 'قطن مخلوط (65% قطن / 35% بوليستر)',
    baseMeterUsd: 3.1,
    avgMetersPerGarment: 1.55,
    riskNoteAr: 'توازن اقتصادي ممتاز وثبات شكلي جيد لكنه أقل جاذبية في قطاع الاستدامة الأوروبي.',
    sources: ['Textile School', 'Textile Learner'],
  },
  recycled_poly: {
    labelAr: 'بوليستر / نايلون معاد تدويره',
    baseMeterUsd: 4.85,
    avgMetersPerGarment: 1.5,
    riskNoteAr: 'يتطلب فواتير تتبع معتمدة (Transaction Certificate) لإثبات شهادة GRS عند التصدير.',
    sources: ['Textile Exchange', 'REPREVE', 'Swicofil'],
  },
  linen: {
    labelAr: 'كتان طبيعي (Linen)',
    baseMeterUsd: 6.4,
    avgMetersPerGarment: 1.65,
    riskNoteAr: 'خامة موسمية حساسة للتجعد والانكماش وتحتاج غسيل إنزيمي قبل أو بعد القص.',
    sources: ['FabricLink', 'The Textile Institute', 'AATCC'],
  },
  technical: {
    labelAr: 'خامات ذكية / وظيفية (Technical)',
    baseMeterUsd: 7.45,
    avgMetersPerGarment: 1.5,
    riskNoteAr: 'تتطلب كميات طلب أعلى من المصانع الموردة واختبارات جودة معملية صارمة.',
    sources: ['WTiN', 'Swicofil', 'INVISTA', 'ASTM'],
  },
};

export const MFG_CONFIG: Record<
  ManufacturingModel,
  {
    labelAr: string;
    shortTagAr: string;
    requiresRawFabric: boolean;
    moqPerSku: number;
    makeFactor: number;
    wholesalePieceMultiplier: number;
    markupAdjustment: number;
    samplingFactor: number;
    leadTimeWeeks: string;
    riskNoteAr: string;
    summaryAr: string;
  }
> = {
  wholesale_office: {
    labelAr: 'مكاتب الجملة (شراء جاهز بدون خامات)',
    shortTagAr: 'بدون شراء خامات · أسرع دوران',
    requiresRawFabric: false,
    moqPerSku: 12,
    makeFactor: 0,
    wholesalePieceMultiplier: 1.0,
    markupAdjustment: 0.72,
    samplingFactor: 0.12,
    leadTimeWeeks: '1 - 5 أيام',
    riskNoteAr:
      'لا تحتاج لشراء خامات أو قص أو باترون، لكن المنافسة سعرية والهامش أقل مع صعوبة التفرد بالتصميم.',
    summaryAr:
      'شراء سيري (دستة/نصف دستة) جاهز من مكتب الجملة وبيعه مباشرة أو تغليفه لبدء التدفق النقدي فوراً.',
  },
  white_label: {
    labelAr: 'براند على بلانكات جاهزة (White-Label)',
    shortTagAr: 'بدون شراء خامات · هوية وتيكت خاص',
    requiresRawFabric: false,
    moqPerSku: 24,
    makeFactor: 0,
    wholesalePieceMultiplier: 0.94,
    markupAdjustment: 0.88,
    samplingFactor: 0.25,
    leadTimeWeeks: '5 - 10 أيام',
    riskNoteAr:
      'تشتري تيشيرتات أو هوديز سادة جاهزة بدون خامات وتضيف التيكت والطباعة/التطريز؛ تأكد من ثبات توفر المقاسات عند المورد.',
    summaryAr:
      'أفضل حل وسط: تتجنب وجع رأس شراء الأقمشة والقص، وتبني هوية براند خاصة عبر الطباعة والتيكت.',
  },
  workshop: {
    labelAr: 'ورشة محلية صغيرة + شراء خامة (Small Batch)',
    shortTagAr: 'شراء خامة · كمية صغيرة مرنة',
    requiresRawFabric: true,
    moqPerSku: 40,
    makeFactor: 1.32,
    wholesalePieceMultiplier: 0,
    markupAdjustment: 1.0,
    samplingFactor: 0.85,
    leadTimeWeeks: '2 - 4 أسابيع',
    riskNoteAr: 'مرونة عالية برأس مال صغير، لكن يجب فحص كل قطعة يدوياً لتفادي تباين المقاسات.',
    summaryAr:
      'تشتري ثوب قماش محدود من التاجر وتنفّذ باترونك الخاص في ورشة صغيرة لاختبار السوق.',
  },
  cmt: {
    labelAr: 'شراء خامة + مصنع تشغيل (CMT)',
    shortTagAr: 'شراء خامة · تحكم كامل بالهامش',
    requiresRawFabric: true,
    moqPerSku: 180,
    makeFactor: 1.0,
    wholesalePieceMultiplier: 0,
    markupAdjustment: 1.0,
    samplingFactor: 1.0,
    leadTimeWeeks: '4 - 7 أسابيع',
    riskNoteAr: 'تحكم كامل في جودة القماش وهامش الربح، ويتطلب متابعة لصيقة في مراحل القص والخياطة.',
    summaryAr:
      'تتفق مع مورد قماش وصباغة وتسلّم الخامة لمصنع تشغيل (قص وخياطة وتشطيب) بأعلى هامش ربح.',
  },
  fob: {
    labelAr: 'مصنع متكامل من الألف للياء (Full-Package / FOB)',
    shortTagAr: 'شامل الخامة والتصنيع · أقل تكلفة للقطعة',
    requiresRawFabric: true,
    moqPerSku: 500,
    makeFactor: 0.82,
    wholesalePieceMultiplier: 0,
    markupAdjustment: 1.04,
    samplingFactor: 1.1,
    leadTimeWeeks: '7 - 12 أسبوع',
    riskNoteAr: 'أقل تكلفة للقطعة عند الكميات الكبيرة؛ إلزامي اعتماد عينة ما قبل الإنتاج (PP Sample).',
    summaryAr:
      'المصنع يوفّر الخامة والإكسسوار والتصنيع والشحن بسعر قطعة موحد؛ مثالي للتصدير والكميات الكبيرة.',
  },
  pod: {
    labelAr: 'طباعة وتجهيز عند الطلب (POD)',
    shortTagAr: 'بدون شراء خامات · صفر مخزون',
    requiresRawFabric: false,
    moqPerSku: 1,
    makeFactor: 0,
    wholesalePieceMultiplier: 1.38,
    markupAdjustment: 0.85,
    samplingFactor: 0.15,
    leadTimeWeeks: '3 - 7 أيام',
    riskNoteAr: 'صفر مخزون راكد تقريباً، لكن هامش الربح أضيق والاعتماد كلي على التميز التسويقي.',
    summaryAr:
      'لا تشتري قماشاً ولا تخزن بضاعة؛ المطبعة تنفّذ وتشحن للعميل بعد كل طلب أونلاين.',
  },
};

export const VOLATILITY_CONFIG: Record<
  MacroVolatility,
  {
    labelAr: string;
    reservePct: number;
    costBufferMultiplier: number;
  }
> = {
  low: { labelAr: 'مستقر نسبياً', reservePct: 0.12, costBufferMultiplier: 1.03 },
  medium: { labelAr: 'متوسط (تذبذب خيوط وشحن)', reservePct: 0.18, costBufferMultiplier: 1.11 },
  high: { labelAr: 'مرتفع (تضخم وتقلب صرف حاد)', reservePct: 0.26, costBufferMultiplier: 1.23 },
};

interface LocationTemplate {
  labelAr: string;
  headlineAr: string;
  fabricOrWholesaleTipAr: string;
  egpCostFactor: number;
  spots: Array<{
    zoneNameAr: string;
    roleAr: string;
    bestForAr: string;
    baseMinUsd: number;
    baseMaxUsd: number;
    unitLabelAr: string;
  }>;
}

export const LOCATION_CONFIG: Record<OperatingLocation, LocationTemplate> = {
  cairo_giza: {
    labelAr: 'القاهرة الكبرى والجيزة',
    headlineAr: 'أقوى مركز متكامل في مصر: خامات في الأزهر وشبرا، ومكاتب جملة في الموسكي وجسر السويس، ومصانع في العبور والعاشر.',
    fabricOrWholesaleTipAr:
      'إذا بدأت بدون شراء خامات، جولة في مكاتب جسر السويس والعتبة/الموسكي تمنحك تشكيلاً جاهزاً بالدستة. وإذا أردت تصنيعاً، اجمع قماشك من شبرا الخيمة أو الأزهر وتعاقد مع ورشة في الوراق أو مصنع في العبور.',
    egpCostFactor: 1.0,
    spots: [
      {
        zoneNameAr: 'الموسكي وحارة اليهود والرويعي (العتبة)',
        roleAr: 'مكاتب الجملة والسيري الجاهز',
        bestForAr: 'بداية سريعة بدون خامات (كاجوال، أطفالي، بيتي)',
        baseMinUsd: 3.4,
        baseMaxUsd: 7.8,
        unitLabelAr: 'للقطعة جملة',
      },
      {
        zoneNameAr: 'جسر السويس (شارع جمال عبد الناصر وتقسيم عمر بن الخطاب)',
        roleAr: 'مراكز جملة وتصفيات ومصانع بلانكات (White-Label)',
        bestForAr: 'تيشيرتات وهوديز سادة وموديلات شبابية جاهزة للتجهيز',
        baseMinUsd: 4.0,
        baseMaxUsd: 10.5,
        unitLabelAr: 'للقطعة جملة/بلانك',
      },
      {
        zoneNameAr: 'الأزهر والغورية وشبرا الخيمة (بهتيم / مسطرد)',
        roleAr: 'تجارة الأقمشة بالكيلو والمتر + مصابغ التريكو',
        bestForAr: 'شراء سنجل جيرسي وميلتون وقطن ممشط للتصنيع',
        baseMinUsd: 4.8,
        baseMaxUsd: 8.6,
        unitLabelAr: 'لكيلو القماش المصبوغ',
      },
      {
        zoneNameAr: 'العبور والعاشر من رمضان ومدينة بدر',
        roleAr: 'مصانع التشغيل CMT والـ FOB والمطابع المركزية',
        bestForAr: 'تشغيل براند متكامل بكميات 150-500+ قطعة وتجهيز التصدير',
        baseMinUsd: 1.9,
        baseMaxUsd: 4.5,
        unitLabelAr: 'مصنعية تشغيل CMT/قطعة',
      },
    ],
  },
  delta_mahalla: {
    labelAr: 'المحلة الكبرى وطنطا والدلتا',
    headlineAr: 'قلعة الغزل والنسيج والميلتون في مصر: أرخص تكلفة خامة مباشر من المصانع والمصابغ بدون وسطاء.',
    fabricOrWholesaleTipAr:
      'موقعك في الدلتا يوفّر عليك 10-15% من تكلفة القماش والشحن؛ يمكنك الشراء من سوق القيصرية وشارع المحجوب بالمحلة أو التعاقد مباشرة مع مصانع التريكو والملابس الجاهزة في سمنود والمنصورة.',
    egpCostFactor: 0.91,
    spots: [
      {
        zoneNameAr: 'القيصرية وشارع المحجوب (المحلة الكبرى)',
        roleAr: 'تجار الجملة والأقمشة القطنية والوبريات',
        bestForAr: 'ملابس قطنية، بيجامات، بلانكات، وأقمشة تريكو مباشرة',
        baseMinUsd: 3.0,
        baseMaxUsd: 7.0,
        unitLabelAr: 'للقطعة جملة',
      },
      {
        zoneNameAr: 'المنطقة الصناعية بالمحلة وسمنود',
        roleAr: 'مصابغ التريكو وورش القص والتشغيل CMT',
        bestForAr: 'صباغة وتجهيز أوزان 220-380 GSM وتصنيع السويت شيرت',
        baseMinUsd: 4.4,
        baseMaxUsd: 7.9,
        unitLabelAr: 'لكيلو القماش الجاهز',
      },
      {
        zoneNameAr: 'شارع العباسي والسكك الجديدة (المنصورة وطنطا)',
        roleAr: 'مكاتب توزيع جملة المحافظات والملابس الشبابية',
        bestForAr: 'تجارة الجملة السريعة بدون شراء خامات أو تغليف براند',
        baseMinUsd: 3.6,
        baseMaxUsd: 8.8,
        unitLabelAr: 'للقطعة جملة',
      },
    ],
  },
  alex_north: {
    labelAr: 'الإسكندرية وبرج العرب والعامرية',
    headlineAr: 'مركز تصدير قوي ومصانع عملاقة في برج العرب والعامرية مع سوق جملة نشط في المنشية.',
    fabricOrWholesaleTipAr:
      'للبداية السريعة بالجملة أو الإكسسوارات ابدأ بالمنشية وزنقة الستات. أما إذا كنت تبني براند للتصدير فمصانع العامرية وبرج العرب (مثل مصانع المنطقة الحرة) هي الأقرب لميناء الإسكندرية.',
    egpCostFactor: 0.96,
    spots: [
      {
        zoneNameAr: 'المنشية والسبع بنات وزنقة الستات',
        roleAr: 'مكاتب جملة الملابس والإكسسوارات والخيوط والتيكت',
        bestForAr: 'شراء سيري جاهز + تجهيز الإكسسوارات والتغليف',
        baseMinUsd: 3.5,
        baseMaxUsd: 8.2,
        unitLabelAr: 'للقطعة جملة',
      },
      {
        zoneNameAr: 'المنطقة الحرة بالعامرية وبرج العرب',
        roleAr: 'مصانع التصدير المتكاملة (FOB) ومصانع النسيج الكبرى',
        bestForAr: 'إنتاج كميات متوسطة وكبيرة بمعايير جودة تصديرية',
        baseMinUsd: 2.1,
        baseMaxUsd: 4.8,
        unitLabelAr: 'مصنعية تصديرية/قطعة',
      },
      {
        zoneNameAr: 'سيدي بشر والعصافرة (ورش الحرفيين)',
        roleAr: 'ورش صغيرة وطباعة DTF/حراري للدفعات التجريبية',
        bestForAr: 'تشغيل 30-100 قطعة في موديلات الستريت وير والبلانكات',
        baseMinUsd: 2.6,
        baseMaxUsd: 5.5,
        unitLabelAr: 'تشغيل + طباعة/قطعة',
      },
    ],
  },
  canal_portsaid: {
    labelAr: 'بورسعيد ومدن القناة',
    headlineAr: 'بوابة استيراد الأقمشة والملابس الجاهزة ومصانع المنطقة الحرة بالاستثمار.',
    fabricOrWholesaleTipAr:
      'تتمتع بورسعيد بميزة توفر أقمشة مستوردة وتصفيات تصدير ومكاتب جملة سريعة، بجانب مصانع المنطقة الصناعية جنوب بورسعيد للاستثمار والتصدير.',
    egpCostFactor: 0.97,
    spots: [
      {
        zoneNameAr: 'شارع التجارية والحميدي (بورسعيد)',
        roleAr: 'مكاتب الجملة والتوزيع والمستورد الجاهز',
        bestForAr: 'شراء جملة جاهز للملابس الكاجوال والشتوية بدون خامات',
        baseMinUsd: 4.0,
        baseMaxUsd: 9.5,
        unitLabelAr: 'للقطعة جملة',
      },
      {
        zoneNameAr: 'المنطقة الصناعية جنوب بورسعيد',
        roleAr: 'مصانع جاهزة (FOB / CMT) ومصانع الجينز والتريكو',
        bestForAr: 'تعاقدات التصنيع بكميات تجارية وتصديرية',
        baseMinUsd: 2.0,
        baseMaxUsd: 4.6,
        unitLabelAr: 'مصنعية تشغيل/قطعة',
      },
    ],
  },
  upper_egypt: {
    labelAr: 'صعيد مصر (أسيوط / المنيا / سوهاج / بني سويف)',
    headlineAr: 'نمو طلب قوي مع هامش منافسة أقل إقليمياً؛ الأفضل الشراء من مراكز القاهرة/المحلة أو التصنيع ببني سويف.',
    fabricOrWholesaleTipAr:
      'لأن تكلفة الشحن تؤثر على القطعة، ابدأ بشحن عينات سيري جاهزة من مكاتب الموسكي/جسر السويس أو تعامل مع المجمع الصناعي في بياض العرب (بني سويف) إذا كنت تبحث عن تشغيل مصنع قريب.',
    egpCostFactor: 1.03,
    spots: [
      {
        zoneNameAr: 'أسواق الجملة الإقليمية (أسيوط / المنيا) + شحن من الموسكي',
        roleAr: 'توريد بضاعة جاهزة للمتاجر المحلية والأونلاين',
        bestForAr: 'بدء بيع سريع بدون تخزين خامات وبأقل مخاطرة شحن',
        baseMinUsd: 3.8,
        baseMaxUsd: 8.6,
        unitLabelAr: 'للقطعة واصلة بالشحن',
      },
      {
        zoneNameAr: 'المنطقة الصناعية ببياض العرب (بني سويف)',
        roleAr: 'مصانع الغزل والملابس الجاهزة بالصعيد',
        bestForAr: 'خطوط إنتاج قريبة عند التوسع لـ 300+ قطعة',
        baseMinUsd: 1.9,
        baseMaxUsd: 4.2,
        unitLabelAr: 'مصنعية تشغيل/قطعة',
      },
    ],
  },
  gulf_ksa_uae: {
    labelAr: 'السعودية والإمارات والخليج',
    headlineAr: 'قوة شرائية مرتفعة تناسب الهوية الفاخرة والستريت وير؛ التوريد عبر أسواق الجملة بالخليج أو التصنيع بمصر/تركيا.',
    fabricOrWholesaleTipAr:
      'للبداية السريعة في الرياض وجدة ودبي بدون مصنع، اعتمد على أسواق البطحاء والبلد وسوق التنين/نايف أو اطلب بلانكات عالية الوزن مع طباعة محلية. وعند التوسع صمّم البراند وصنّع في مصر أو تركيا بتكلفة أقل 35%.',
    egpCostFactor: 1.38,
    spots: [
      {
        zoneNameAr: 'سوق نايف وسوق التنين (دبي) ومناطق عجمان الصناعية',
        roleAr: 'مكاتب جملة، مشاغل خياطة سريعة، واستيراد بلانكات',
        bestForAr: 'تجربة موديلات سريعة وخدمات Private Label بالخليج',
        baseMinUsd: 6.5,
        baseMaxUsd: 16.0,
        unitLabelAr: 'للقطعة جملة/تجهيز',
      },
      {
        zoneNameAr: 'البطحاء (الرياض) وسوق البلد (جدة)',
        roleAr: 'مراكز الجملة الرئيسية للملابس والإكسسوارات والتغليف',
        bestForAr: 'التجارة المباشرة وتجهيز كميات التجزئة والأونلاين',
        baseMinUsd: 6.0,
        baseMaxUsd: 14.5,
        unitLabelAr: 'للقطعة جملة',
      },
      {
        zoneNameAr: 'التصنيع التعاقدي في مصر أو تركيا والشحن للخليج',
        roleAr: 'تصنيع FOB / CMT بجودة قطن مصري وميزة اتفاقية تيسير',
        bestForAr: 'رفع هامش الربح الإجمالي لـ 65%+ بعد إثبات المبيعات',
        baseMinUsd: 8.0,
        baseMaxUsd: 15.0,
        unitLabelAr: 'تكلفة قطعة شاملة الشحن',
      },
    ],
  },
  international_remote: {
    labelAr: 'عمل عن بُعد / استيراد دولي وأونلاين',
    headlineAr: 'إدارة مرنة عبر الطباعة عند الطلب (POD) أو الاستيراد المباشر من مراكز إسطنبول والصين.',
    fabricOrWholesaleTipAr:
      'يمكنك إطلاق المتجر من أي مكان بدون مخزون عبر POD، أو زيارة/التعاقد أونلاين مع مصانع Merter بإسطنبول (MOQ منخفض 50-100 قطعة) أو مجمعات قوانغتشو via Alibaba/Global Sources.',
    egpCostFactor: 1.28,
    spots: [
      {
        zoneNameAr: 'حي ميرتر وعثمان بيه (إسطنبول - تركيا)',
        roleAr: 'مكاتب جملة ومصانع كميات مرنة للتصدير السريع',
        bestForAr: 'ستريت وير وكاجوال جاهز أو تصنيع خاص بـ 50-150 قطعة',
        baseMinUsd: 6.0,
        baseMaxUsd: 15.0,
        unitLabelAr: 'للقطعة FOB/جملة',
      },
      {
        zoneNameAr: 'قوانغتشو وشيشي (الصين) عبر Global Sources / Alibaba',
        roleAr: 'بلانكات ثقيلة، خامات تقنية، وإكسسوارات متخصصة',
        bestForAr: 'Activewear والجاكيتات والقطع ذات الإكسسوارات المعقدة',
        baseMinUsd: 4.5,
        baseMaxUsd: 12.5,
        unitLabelAr: 'للقطعة قبل الشحن',
      },
      {
        zoneNameAr: 'مزودو POD العالميين (Printful / Gelato / Kornit)',
        roleAr: 'طباعة وشحن أوتوماتيكي قطعة بقطعة',
        bestForAr: 'اختبار التصاميم في أمريكا وأوروبا بدون رأس مال مخزون',
        baseMinUsd: 11.0,
        baseMaxUsd: 21.0,
        unitLabelAr: 'للقطعة مطبوعة جاهزة',
      },
    ],
  },
};

const GSM_MULTIPLIER: Record<FabricWeightGsm, number> = {
  160: 0.88,
  220: 1.0,
  300: 1.24,
  380: 1.44,
};

const CHANNEL_MARKUP_FACTOR: Record<SalesChannel, number> = {
  dtc: 1.0,
  hybrid: 0.88,
  wholesale: 0.72,
};

function computeModelMetrics(
  model: ManufacturingModel,
  input: ScenarioInput,
  capitalUsd: number
) {
  const market = MARKET_CONFIG[input.market];
  const category = CATEGORY_CONFIG[input.category];
  const fabric = FABRIC_CONFIG[input.fabric];
  const mfg = MFG_CONFIG[model];
  const vol = VOLATILITY_CONFIG[input.volatility];
  const loc = LOCATION_CONFIG[input.location];
  const gsmFactor = GSM_MULTIPLIER[input.gsm] ?? 1.0;
  const originFactor = input.sourcingOrigin === 'imported' ? 1.18 : 1.0;

  let unitFabricCostUsd = 0;
  let unitMakeCostUsd = 0;
  let unitTrimsPackagingUsd = 0;

  if (mfg.requiresRawFabric) {
    // Fabric cost includes 7% marker/cutting waste allowance (Textile Learner standard)
    unitFabricCostUsd =
      fabric.baseMeterUsd * fabric.avgMetersPerGarment * gsmFactor * originFactor * 1.07;
    unitMakeCostUsd = category.baseMakeUsd * mfg.makeFactor;
    unitTrimsPackagingUsd = input.category === 'luxury' ? 3.25 : 1.35;
  } else {
    // Ready garment / White-label / POD: zero raw fabric buying
    const baseReadyPieceUsd =
      4.4 * category.readyWholesaleFactor * (0.7 + gsmFactor * 0.3) * (loc.egpCostFactor * 0.35 + 0.65);
    unitFabricCostUsd = 0;
    unitMakeCostUsd = baseReadyPieceUsd * mfg.wholesalePieceMultiplier;
    if (model === 'wholesale_office') {
      unitTrimsPackagingUsd = 0.45; // Basic packaging bag / price tag
    } else if (model === 'white_label') {
      unitTrimsPackagingUsd = 1.65; // Woven neck label, hangtag, DTF/embroidery customization
    } else {
      // POD already includes printing in fulfillment cost
      unitTrimsPackagingUsd = 0.35;
    }
  }

  const rawUnitCostUsd = unitFabricCostUsd + unitMakeCostUsd + unitTrimsPackagingUsd;
  const unitCostUsd = rawUnitCostUsd * vol.costBufferMultiplier;

  const effectiveMarkup =
    market.markup * mfg.markupAdjustment * (CHANNEL_MARKUP_FACTOR[input.salesChannel] ?? 1);
  const suggestedRetailUsd = Math.max(unitCostUsd * 1.28, unitCostUsd * effectiveMarkup);
  const grossProfitPerUnitUsd = Math.max(0.1, suggestedRetailUsd - unitCostUsd);
  const grossMarginPct = (grossProfitPerUnitUsd / suggestedRetailUsd) * 100;

  const safeSkus = Math.max(1, Math.min(40, Math.round(Number(input.skuCount) || 1)));
  const reserveUsd = capitalUsd * vol.reservePct;
  const complianceUsd = mfg.requiresRawFabric
    ? Math.min(capitalUsd * 0.18, market.complianceFloorUsd)
    : Math.min(capitalUsd * 0.08, market.complianceFloorUsd * 0.45);
  const samplingUsd = Math.min(
    capitalUsd * 0.14,
    safeSkus * 115 * category.samplingComplexity * mfg.samplingFactor
  );
  const marketingUsd = capitalUsd * market.marketingPct;
  const productionUsd = Math.max(
    0,
    capitalUsd - reserveUsd - complianceUsd - samplingUsd - marketingUsd
  );

  const possibleUnits = Math.max(0, Math.floor(productionUsd / unitCostUsd));
  const minRequiredUnits = model === 'pod' ? safeSkus : safeSkus * mfg.moqPerSku;
  const capitalSufficient =
    model === 'pod' ? possibleUnits >= safeSkus : possibleUnits >= minRequiredUnits;

  const fixedLaunchCostsUsd = samplingUsd + complianceUsd + marketingUsd;
  const breakEvenUnits = Math.ceil(fixedLaunchCostsUsd / grossProfitPerUnitUsd);

  const divUnits = Math.max(1, possibleUnits);
  const estMarketingPerUnit = marketingUsd / divUnits;
  const estOverheadPerUnit = (samplingUsd + complianceUsd) / divUnits;
  const estShippingDrag =
    input.salesChannel === 'wholesale' ? suggestedRetailUsd * 0.015 : suggestedRetailUsd * 0.045;
  const estNetPerUnit =
    grossProfitPerUnitUsd - estMarketingPerUnit - estOverheadPerUnit - estShippingDrag;
  const netMarginPct = suggestedRetailUsd > 0 ? (estNetPerUnit / suggestedRetailUsd) * 100 : 0;

  // Financial upfront commitment before revenue: POD locks virtually 0 inventory cash (only test sample + setup),
  // wholesale locks ready inventory only, while direct manufacturing locks raw fabric + sampling + MOQ deposit.
  const upfrontCommitmentUsd =
    model === 'pod'
      ? samplingUsd + complianceUsd
      : Math.min(capitalUsd - reserveUsd, minRequiredUnits * unitCostUsd + samplingUsd + complianceUsd);

  const financialCommitmentAr =
    model === 'pod'
      ? 'التزام مالي شبه صفري (عينة اختبار وتسويق فقط بدون تجميد بضاعة)'
      : model === 'wholesale_office'
        ? 'التزام مرن (شراء دست جاهزة عند اللزوم بدون تكلفة خامات أو باترون)'
        : model === 'white_label'
          ? 'التزام منخفض-متوسط (بلانكات جاهزة + تجهيز التيكت والطباعة)'
          : model === 'workshop'
            ? 'التزام متوسط (شراء ثوب قماش محدود + باترون + مصنعية ورشة)'
            : model === 'cmt'
              ? 'التزام تصنيعي مرتفع (تمويل القماش والصباغة والباترون ودفعة التشغيل)'
              : 'التزام استثماري كامل (تمويل كامل لـ MOQ كبير وشهادات قبل الإطلاق)';

  return {
    mfg,
    unitFabricCostUsd,
    unitMakeCostUsd,
    unitTrimsPackagingUsd,
    unitCostUsd,
    suggestedRetailUsd,
    grossProfitPerUnitUsd,
    grossMarginPct,
    netMarginPct,
    upfrontCommitmentUsd,
    financialCommitmentAr,
    reserveUsd,
    complianceUsd,
    samplingUsd,
    marketingUsd,
    productionUsd,
    possibleUnits,
    minRequiredUnits,
    capitalSufficient,
    breakEvenUnits,
    fixedLaunchCostsUsd,
  };
}

function formatRangeMoney(minUsd: number, maxUsd: number, currency: CurrencyCode, fxRate: number) {
  return `${formatMoney(minUsd, currency, fxRate)} – ${formatMoney(maxUsd, currency, fxRate)}`;
}

export function calculateSimulation(input: ScenarioInput): SimulationResult {
  const safeFx = Math.max(1, Number(input.fxRate) || 50);
  const safeCapital = Math.max(100, Number(input.capital) || 100);
  const safeSkus = Math.max(1, Math.min(40, Math.round(Number(input.skuCount) || 1)));
  const safeLocation: OperatingLocation = LOCATION_CONFIG[input.location]
    ? input.location
    : 'cairo_giza';
  const normalizedInput: ScenarioInput = {
    ...input,
    location: safeLocation,
    skuCount: safeSkus,
  };

  const capitalUsd = normalizedInput.currency === 'EGP' ? safeCapital / safeFx : safeCapital;

  const market = MARKET_CONFIG[normalizedInput.market];
  const category = CATEGORY_CONFIG[normalizedInput.category];
  const fabric = FABRIC_CONFIG[normalizedInput.fabric];
  const vol = VOLATILITY_CONFIG[normalizedInput.volatility];
  const loc = LOCATION_CONFIG[safeLocation];

  const activeMetrics = computeModelMetrics(normalizedInput.mfgModel, normalizedInput, capitalUsd);
  const { mfg } = activeMetrics;

  const estimatedUnitCostUsd = activeMetrics.unitCostUsd;
  const estimatedSellingPriceUsd = activeMetrics.suggestedRetailUsd;

  const rawCustomUnit = Number(normalizedInput.customUnitCost);
  const isCustomUnitCost = Number.isFinite(rawCustomUnit) && rawCustomUnit > 0;
  const unitCostUsd = isCustomUnitCost
    ? normalizedInput.currency === 'EGP'
      ? rawCustomUnit / safeFx
      : rawCustomUnit
    : estimatedUnitCostUsd;

  const rawCustomPrice = Number(normalizedInput.customSellingPrice);
  const isCustomSellingPrice = Number.isFinite(rawCustomPrice) && rawCustomPrice > 0;
  const suggestedRetailUsd = isCustomSellingPrice
    ? normalizedInput.currency === 'EGP'
      ? rawCustomPrice / safeFx
      : rawCustomPrice
    : isCustomUnitCost
      ? Math.max(
          unitCostUsd * 1.28,
          unitCostUsd *
            market.markup *
            mfg.markupAdjustment *
            (CHANNEL_MARKUP_FACTOR[normalizedInput.salesChannel] ?? 1)
        )
      : estimatedSellingPriceUsd;

  const grossProfitPerUnitUsd = suggestedRetailUsd - unitCostUsd;
  const grossMarginPct =
    suggestedRetailUsd > 0 ? (grossProfitPerUnitUsd / suggestedRetailUsd) * 100 : 0;
  const markupPct = unitCostUsd > 0 ? (grossProfitPerUnitUsd / unitCostUsd) * 100 : 0;

  const possibleUnits = Math.max(0, Math.floor(activeMetrics.productionUsd / Math.max(0.1, unitCostUsd)));
  const capitalSufficient =
    normalizedInput.mfgModel === 'pod'
      ? possibleUnits >= safeSkus
      : possibleUnits >= activeMetrics.minRequiredUnits;
  const breakEvenReachable = grossProfitPerUnitUsd > 0.01;
  const breakEvenUnits = breakEvenReachable
    ? Math.ceil(activeMetrics.fixedLaunchCostsUsd / grossProfitPerUnitUsd)
    : 0;

  const divisorUnits = Math.max(1, possibleUnits);
  const unitMarketingCostUsd = activeMetrics.marketingUsd / divisorUnits;
  const unitFixedOverheadUsd = (activeMetrics.samplingUsd + activeMetrics.complianceUsd) / divisorUnits;
  const unitReturnShippingDragUsd =
    normalizedInput.salesChannel === 'wholesale'
      ? suggestedRetailUsd * 0.015
      : suggestedRetailUsd * 0.045;
  const netProfitPerUnitUsd =
    grossProfitPerUnitUsd -
    unitMarketingCostUsd -
    unitFixedOverheadUsd -
    unitReturnShippingDragUsd;
  const netMarginPct =
    suggestedRetailUsd > 0 ? (netProfitPerUnitUsd / suggestedRetailUsd) * 100 : 0;

  const unitsPerSku = Math.floor(possibleUnits / safeSkus);
  const projectedCycleRevenueUsd = possibleUnits * suggestedRetailUsd;
  const projectedNetCycleProfitUsd =
    possibleUnits * grossProfitPerUnitUsd - activeMetrics.fixedLaunchCostsUsd;

  const budgetAllocations: BudgetLine[] = [
    {
      key: 'production',
      labelAr: mfg.requiresRawFabric
        ? 'الإنتاج والخامات والتشغيل'
        : 'شراء البضاعة الجاهزة والتجهيز',
      amountUsd: activeMetrics.productionUsd,
      percentage: (activeMetrics.productionUsd / capitalUsd) * 100,
    },
    {
      key: 'marketing',
      labelAr: 'التسويق والاستحواذ والمحتوى',
      amountUsd: activeMetrics.marketingUsd,
      percentage: (activeMetrics.marketingUsd / capitalUsd) * 100,
    },
    {
      key: 'reserve',
      labelAr: 'احتياطي الطوارئ وتقلب الأسعار',
      amountUsd: activeMetrics.reserveUsd,
      percentage: (activeMetrics.reserveUsd / capitalUsd) * 100,
    },
    {
      key: 'sampling',
      labelAr: mfg.requiresRawFabric
        ? 'الباترون والعينات (Tech Pack)'
        : 'تجهيز العينات واللوجو والتيكت',
      amountUsd: activeMetrics.samplingUsd,
      percentage: (activeMetrics.samplingUsd / capitalUsd) * 100,
    },
    {
      key: 'compliance',
      labelAr: 'التراخيص والاختبارات والامتثال',
      amountUsd: activeMetrics.complianceUsd,
      percentage: (activeMetrics.complianceUsd / capitalUsd) * 100,
    },
  ];

  // Evaluate all 6 pathways for side-by-side decision making
  const allModels: ManufacturingModel[] = [
    'wholesale_office',
    'white_label',
    'workshop',
    'cmt',
    'fob',
    'pod',
  ];
  const pathwayOptions: PathwayOption[] = allModels.map((modelKey) => {
    const m = computeModelMetrics(modelKey, normalizedInput, capitalUsd);
    return {
      model: modelKey,
      labelAr: m.mfg.labelAr,
      shortTagAr: m.mfg.shortTagAr,
      requiresRawFabric: m.mfg.requiresRawFabric,
      unitCostUsd: m.unitCostUsd,
      suggestedRetailUsd: m.suggestedRetailUsd,
      grossMarginPct: m.grossMarginPct,
      netMarginPct: m.netMarginPct,
      upfrontCommitmentUsd: m.upfrontCommitmentUsd,
      financialCommitmentAr: m.financialCommitmentAr,
      possibleUnits: m.possibleUnits,
      minRequiredUnits: m.minRequiredUnits,
      capitalSufficient: m.capitalSufficient,
      leadTimeWeeks: m.mfg.leadTimeWeeks,
      summaryAr: m.mfg.summaryAr,
    };
  });

  // Build local guide with formatted prices in the user's selected currency
  const gsmFactor = GSM_MULTIPLIER[normalizedInput.gsm] ?? 1.0;
  const fabricKgMinUsd = 4.4 * loc.egpCostFactor * (0.85 + gsmFactor * 0.15);
  const fabricKgMaxUsd = 8.2 * loc.egpCostFactor * (0.85 + gsmFactor * 0.15);
  const wholesalePieceMinUsd =
    3.3 * category.readyWholesaleFactor * (loc.egpCostFactor * 0.4 + 0.6);
  const wholesalePieceMaxUsd =
    6.8 * category.readyWholesaleFactor * (loc.egpCostFactor * 0.4 + 0.6);
  const cmtMinUsd = category.baseMakeUsd * 0.62 * loc.egpCostFactor;
  const cmtMaxUsd = category.baseMakeUsd * 1.15 * loc.egpCostFactor;

  const localGuide: LocalSourcingGuide = {
    locationLabelAr: loc.labelAr,
    headlineAr: loc.headlineAr,
    fabricOrWholesaleTipAr: loc.fabricOrWholesaleTipAr,
    priceBenchmarksAr: {
      fabricPerKgOrMeterAr: formatRangeMoney(
        fabricKgMinUsd,
        fabricKgMaxUsd,
        normalizedInput.currency,
        safeFx
      ),
      wholesaleReadyPieceAr: formatRangeMoney(
        wholesalePieceMinUsd,
        wholesalePieceMaxUsd,
        normalizedInput.currency,
        safeFx
      ),
      cmtMakePerPieceAr: formatRangeMoney(
        cmtMinUsd,
        cmtMaxUsd,
        normalizedInput.currency,
        safeFx
      ),
      recommendedSellingRangeAr: formatRangeMoney(
        activeMetrics.suggestedRetailUsd * 0.85,
        activeMetrics.suggestedRetailUsd * 1.25,
        normalizedInput.currency,
        safeFx
      ),
    },
    spots: loc.spots.map((spot) => ({
      zoneNameAr: spot.zoneNameAr,
      roleAr: spot.roleAr,
      bestForAr: spot.bestForAr,
      priceGuideAr: `${formatRangeMoney(
        spot.baseMinUsd * (0.8 + category.readyWholesaleFactor * 0.2),
        spot.baseMaxUsd * (0.8 + category.readyWholesaleFactor * 0.2),
        normalizedInput.currency,
        safeFx
      )} (${spot.unitLabelAr})`,
    })),
  };

  const riskSummaryAr: string[] = [
    mfg.requiresRawFabric
      ? fabric.riskNoteAr
      : 'مسار بدون شراء خامات: لا تتحمل هالك القص أو تعطل الصباغة، وتركيزك الأساسي على التفتيش السريع والتصوير والتسويق.',
    mfg.riskNoteAr,
    market.complianceNoteAr,
  ];
  if (
    mfg.requiresRawFabric &&
    normalizedInput.sourcingOrigin === 'imported' &&
    normalizedInput.volatility === 'high'
  ) {
    riskSummaryAr.push(
      'تحذير عالي الخطورة: الاعتماد على خامات مستوردة مع تضخم وتقلب صرف حاد قد يضغط على رأس المال العامل في إعادة التمويل.'
    );
  }

  if (!breakEvenReachable) {
    riskSummaryAr.unshift(
      'سعر البيع المحدد أقل من أو يساوي تكلفة القطعة الواحدة؛ كل قطعة مباعة تحقق خسارة مباشرة ما لم ترفع السعر أو تقلل التكلفة.'
    );
  }

  let recommendedActionAr = mfg.requiresRawFabric
    ? 'الخطة متوازنة مبدئياً؛ ابدأ بتوثيق الـ Tech Pack واعتماد عينة ما قبل الإنتاج (PP Sample) قبل قص كامل الكمية.'
    : 'خطة سريعة الدوران بدون شراء خامات؛ افحص عينات المورد وتأكد من ثبات جدول المقاسات قبل ضخ الميزانية الإعلانية.';

  if (!breakEvenReachable) {
    recommendedActionAr =
      'تنبيه تسعير: سعر البيع أقل من أو يساوي تكلفة القطعة الواحدة؛ ارفع سعر البيع أو اختر مسار توريد أقل تكلفة لتحقيق هامش ربح إيجابي.';
  } else if (!capitalSufficient) {
    const maxAffordableSkus = Math.max(
      1,
      Math.floor(possibleUnits / Math.max(1, mfg.moqPerSku))
    );
    recommendedActionAr = `رأس المال الحالي يغطي ${possibleUnits} قطعة بينما الحد الأدنى المطلوب هو ${activeMetrics.minRequiredUnits} قطعة. يُنصح بتقليل الموديلات إلى ${maxAffordableSkus} موديل أو التحول لمكاتب الجملة / White-Label / ورشة صغيرة لتبدأ بدون تعطل.`;
  } else if (normalizedInput.market === 'global' && capitalUsd < 10000) {
    recommendedActionAr =
      'رأس المال يكفي الإنتاج، لكن اختراق السوق العالمي يتطلب ميزانية امتثال وشهادات وتجارب سوقية أكبر؛ ابدأ بالتصدير الإقليمي أو البيع المحلي أولاً.';
  }

  // Generate 4 concrete strategic suggestions tailored to pathway + location + capital
  const strategicSuggestionsAr: LaunchSuggestion[] = [];

  // 1. Pathway & Capital Architecture
  if (!mfg.requiresRawFabric) {
    strategicSuggestionsAr.push({
      titleAr: 'الانطلاق الذكي بدون شراء خامات واختبار السوق أولاً',
      detailAr: `بدلاً من تجميد ${Math.round(capitalUsd).toLocaleString('en-US')}$ في أثواب قماش وباترونات، استخدم ${mfg.labelAr} في ${loc.labelAr} لتسليم البضاعة خلال ${mfg.leadTimeWeeks}، واحتفظ بسيولة للتسويق وإعادة الشراء للموديل الأسرع مبيعاً.`,
      references: ['Sourcify', 'Fashiondex', 'ETDA'],
    });
  } else if (capitalUsd < 6000) {
    strategicSuggestionsAr.push({
      titleAr: 'استراتيجية «المنتج الأيقوني الواحد» لتعظيم رأس المال',
      detailAr: `برأس مال ${Math.round(capitalUsd).toLocaleString('en-US')}$، ركّز على ${Math.min(2, safeSkus)} موديل أساسي (Hero SKU) بنفس الخامة (${normalizedInput.gsm} GSM) مع تنويع الألوان عبر Pantone بدلاً من تشتيت الباترونات والـ MOQ — كما بدأت Under Armour وLevi's.`,
      references: ['Under Armour', 'Pantone', 'Textile Learner'],
    });
  } else {
    strategicSuggestionsAr.push({
      titleAr: 'هيكلة المجموعة الأساسية + قطع الجذب (Core + Drop Model)',
      detailAr: `وزّع الـ ${activeMetrics.possibleUnits} قطعة بحيث تغطي 70% قطعاً أساسية متكررة الطلب (تضمن التدفق النقدي مثل UNIQLO)، و30% قطعاً مميزة محدودة الكمية (Drop) تبني هوية البراند وترفع متوسط السلة.`,
      references: ['UNIQLO', 'Rei Kawakubo', 'CFDA'],
    });
  }

  // 2. Location-specific Actionable Sourcing Recommendation
  strategicSuggestionsAr.push({
    titleAr: `نقطة البداية الأنسب في ${loc.labelAr}`,
    detailAr: `${loc.spots[0]?.zoneNameAr}: نقطة انطلاق عملية بأسعار تقديرية ${localGuide.spots[0]?.priceGuideAr}؛ قارن 3 موردين على الأقل قبل التعاقد واحجز ${formatMoney(activeMetrics.reserveUsd, normalizedInput.currency, safeFx)} كاحتياطي إعادة تمويل.`,
    references: ['ETDA', 'FEI Egypt', 'Made in Egypt'],
  });

  // 3. Technical / Branding Precision (Prototyping or Trims)
  if (mfg.requiresRawFabric) {
    strategicSuggestionsAr.push({
      titleAr: 'اعتماد الباترون الرقمي 3D وملف Tech Pack قبل أي قص',
      detailAr: `ارسم القطع في Adobe Illustrator واختبر التلبيس افتراضياً عبر CLO 3D أو Optitex، وتأكد أن مصنع ${mfg.labelAr} يخرج كفاءة تعشيق (Marker) لا تقل عن 82% على Lectra أو AccuMark لتوفير 8-12% من فاتورة القماش.`,
      references: ['CLO 3D', 'Adobe Illustrator', 'Lectra', 'AccuMark'],
    });
  } else {
    strategicSuggestionsAr.push({
      titleAr: 'تحويل القطعة الجاهزة لهوية براند حقيقية بأقل تكلفة',
      detailAr: `حتى عند الشراء من مكاتب الجملة أو البلانكات بدون خامات، اصنع فارق السعر بتغيير تيكت الرقبة (Woven Label) وكرت السعر والتغليف عبر Avery Dennison أو Nilörn مع طباعة DTF عالية الثبات (Epson) أو تطريز (Tajima).`,
      references: ['Avery Dennison', 'Nilörn', 'Epson', 'Tajima'],
    });
  }

  // 4. Quality & Scaling to Export
  if (normalizedInput.market === 'egypt' || normalizedInput.sourcingOrigin === 'local') {
    strategicSuggestionsAr.push({
      titleAr: 'ضبط الجودة والانتقال التدريجي من التجارة/الورشة للتصدير',
      detailAr: `التزم بمواصفات EOS وبطاقة العناية (ISO 3758) وفحص AQL على أول دفعة. بمجرد ثبات مبيعات 3 موديلات، انتقل للتصنيع التعاقدي (CMT/FOB) في العاشر أو المحلة وسجّل في GOEIC للتصدير إلى الخليج.`,
      references: ['GOEIC', 'EOS Egypt', 'ISO', 'AATCC'],
    });
  } else {
    strategicSuggestionsAr.push({
      titleAr: 'تأمين الامتثال التصديري وسلاسل التوريد العالمية',
      detailAr: `افحص التعريفات الجمركية وشهادات المنشأ (QIZ / EUR.1) عبر ITC وMTI Egypt، واختر مصنعاً معتمداً لدى Better Work مع التزام الخامات بـ OEKO-TEX Standard 100 وقائمة AAFA RSL لتفادي احتجاز الشحنات.`,
      references: ['ITC', 'OEKO-TEX', 'AAFA', 'Better Work'],
    });
  }

  const roadmap: RoadmapPhase[] = [
    {
      stepNumber: 1,
      titleAr: mfg.requiresRawFabric
        ? 'هندسة الخامة والـ Tech Pack والـ 3D'
        : 'اختيار الموردين وعينات الجملة/البلانك',
      descriptionAr: mfg.requiresRawFabric
        ? `تحديد مواصفات ${fabric.labelAr} بوزن ${normalizedInput.gsm} GSM ونسب الانكماش (AATCC) وألوان Pantone في نطاق ${loc.labelAr}، ورسم القطع في Illustrator/CLO 3D مع حساب هالك القص (7%).`
        : `مسح 3-5 مكاتب جملة أو موردي بلانكات في ${loc.labelAr}، ومطابقة الوزن (${normalizedInput.gsm} GSM) والمقاسات وسرعة إعادة التوريد خلال ${mfg.leadTimeWeeks} بدون شراء خامات.`,
      recommendedSources: mfg.requiresRawFabric
        ? [...new Set([...fabric.sources, 'CLO 3D', 'Pantone', 'Textile Learner'])]
        : ['Sourcify', 'Fashiondex', 'ETDA', 'Pantone'],
    },
    {
      stepNumber: 2,
      titleAr: mfg.requiresRawFabric
        ? 'الإكسسوارات والباترون وضبط الجودة (AQL)'
        : 'التجهيز باللوجو والتيكت والتغليف (Branding)',
      descriptionAr: mfg.requiresRawFabric
        ? `التعاقد بنظام ${mfg.labelAr} لإنتاج ${activeMetrics.possibleUnits} قطعة موزعة على ${
            safeSkus === 1
              ? 'موديل واحد'
              : safeSkus === 2
                ? 'موديلين'
                : safeSkus <= 10
                  ? `${safeSkus} موديلات`
                  : `${safeSkus} موديلاً`
          } بخيوط Coats وسحابات YKK، مع فحص عينة ما قبل الإنتاج (PP Sample) ومعيار AQL 2.5.`
        : `تجهيز ${activeMetrics.possibleUnits} قطعة عبر إضافة تيكت القماش، الهانج تاج، وأكياس التغليف (Avery Dennison / Nilörn)، مع فحص نسبة العيوب والكي والتغليف قبل الإطلاق.`,
      recommendedSources: mfg.requiresRawFabric
        ? ['AAPN', 'YKK', 'Coats', 'Textile Learner', 'Hashima']
        : ['Avery Dennison', 'Nilörn', 'Epson', 'Tajima', 'YKK'],
    },
    {
      stepNumber: 3,
      titleAr: 'إطلاق القناة التجارية وتدوير رأس المال',
      descriptionAr: `تطوير هوية البراند لفئة ${category.labelAr} وإطلاق قناة ${
        normalizedInput.salesChannel === 'dtc'
          ? 'البيع المباشر للمستهلك (DTC)'
          : normalizedInput.salesChannel === 'wholesale'
            ? 'الجملة والبوتيكات (B2B)'
            : 'البيع الهجين (DTC + B2B)'
      } بسعر مستهدف ${formatMoney(activeMetrics.suggestedRetailUsd, normalizedInput.currency, safeFx)} ومراقبة نقطة التعادل عند ${activeMetrics.breakEvenUnits} قطعة.`,
      recommendedSources: ['CFDA', 'WGSN', 'Business of Fashion', 'WIPO'],
    },
    {
      stepNumber: 4,
      titleAr: 'التحول للتصنيع المستقل والتوسع التصديري',
      descriptionAr: mfg.requiresRawFabric
        ? 'استخراج بيانات الجمارك والاتفاقيات عبر ITC وGOEIC، وتأمين شهادات OEKO-TEX / GOTS / Textile Exchange والالتزام بقائمة AAFA RSL ومعايير Better Work للوصول للمشترين الدوليين.'
        : 'بعد تثبيت الطلب عبر مكاتب الجملة، حوّل أفضل 20% من الموديلات إلى تصنيع خاص CMT/FOB لرفع هامش الربح 15-22% والتوسع عبر GOEIC وITC للتصدير الإقليمي.',
      recommendedSources: ['ITC', 'GOEIC', 'AAFA', 'Textile Exchange', 'OEKO-TEX'],
    },
  ];

  return {
    id: normalizedInput.id || `sim_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    input: normalizedInput,
    capitalUsd,
    requiresRawFabric: mfg.requiresRawFabric,
    unitFabricCostUsd: isCustomUnitCost ? 0 : activeMetrics.unitFabricCostUsd,
    unitMakeCostUsd: isCustomUnitCost ? unitCostUsd : activeMetrics.unitMakeCostUsd,
    unitTrimsPackagingUsd: isCustomUnitCost ? 0 : activeMetrics.unitTrimsPackagingUsd,
    estimatedUnitCostUsd,
    estimatedSellingPriceUsd,
    isCustomUnitCost,
    isCustomSellingPrice,
    unitCostUsd,
    suggestedRetailUsd,
    grossMarginPct,
    grossProfitPerUnitUsd,
    markupPct,
    unitMarketingCostUsd,
    unitFixedOverheadUsd,
    unitReturnShippingDragUsd,
    netProfitPerUnitUsd,
    netMarginPct,
    possibleUnits,
    unitsPerSku,
    minRequiredUnits: activeMetrics.minRequiredUnits,
    capitalSufficient,
    breakEvenReachable,
    breakEvenUnits,
    projectedCycleRevenueUsd,
    projectedNetCycleProfitUsd,
    upfrontCommitmentUsd: activeMetrics.upfrontCommitmentUsd,
    financialCommitmentSummaryAr: activeMetrics.financialCommitmentAr,
    leadTimeWeeks: mfg.leadTimeWeeks,
    budgetAllocations,
    riskSummaryAr,
    recommendedActionAr,
    strategicSuggestionsAr,
    pathwayOptions,
    localGuide,
    roadmap,
    locationLabelAr: loc.labelAr,
    marketLabelAr: market.labelAr,
    categoryLabelAr: category.labelAr,
    fabricLabelAr: fabric.labelAr,
    mfgLabelAr: mfg.labelAr,
    volatilityLabelAr: vol.labelAr,
    createdAt: new Date().toISOString(),
  };
}

export function formatMoney(
  amountUsd: number,
  currency: CurrencyCode,
  fxRate: number
): string {
  if (currency === 'EGP') {
    const egpVal = Math.round(amountUsd * fxRate);
    return `${egpVal.toLocaleString('en-US')} ج.م`;
  }
  return `$${amountUsd.toLocaleString('en-US', {
    minimumFractionDigits: amountUsd < 100 ? 1 : 0,
    maximumFractionDigits: amountUsd < 100 ? 1 : 0,
  })}`;
}

export interface ComparisonDelta {
  cheapestUnitCostId: string;
  highestMarginId: string;
  fastestBreakEvenId: string;
  highestVolumeId: string;
}

export function buildComparisonSummary(results: SimulationResult[]): ComparisonDelta | null {
  if (results.length === 0) return null;
  let cheapest = results[0];
  let bestMargin = results[0];
  let fastestBe = results[0];
  let highestVol = results[0];

  for (const r of results) {
    if (r.unitCostUsd < cheapest.unitCostUsd) cheapest = r;
    if (r.grossMarginPct > bestMargin.grossMarginPct) bestMargin = r;
    if (r.breakEvenUnits < fastestBe.breakEvenUnits) fastestBe = r;
    if (r.possibleUnits > highestVol.possibleUnits) highestVol = r;
  }

  return {
    cheapestUnitCostId: cheapest.id,
    highestMarginId: bestMargin.id,
    fastestBreakEvenId: fastestBe.id,
    highestVolumeId: highestVol.id,
  };
}

export const DEFAULT_SCENARIO_INPUT: ScenarioInput = {
  name: 'كاجوال قطن مصري — انطلاق محلي',
  capital: 300000,
  currency: 'EGP',
  fxRate: 50,
  location: 'cairo_giza',
  market: 'egypt',
  category: 'basics',
  fabric: 'egyptian_cotton',
  gsm: 220,
  sourcingOrigin: 'local',
  mfgModel: 'cmt',
  skuCount: 3,
  volatility: 'medium',
  salesChannel: 'dtc',
};

export const DEFAULT_SEED_SCENARIOS: SimulationResult[] = [
  calculateSimulation({
    ...DEFAULT_SCENARIO_INPUT,
    id: 'seed_local_cotton',
  }),
  calculateSimulation({
    id: 'seed_wholesale_ready',
    name: 'مكاتب جملة العتبة/جسر السويس — بدون خامات',
    capital: 120000,
    currency: 'EGP',
    fxRate: 50,
    location: 'cairo_giza',
    market: 'egypt',
    category: 'streetwear',
    fabric: 'egyptian_cotton',
    gsm: 220,
    sourcingOrigin: 'local',
    mfgModel: 'wholesale_office',
    skuCount: 5,
    volatility: 'medium',
    salesChannel: 'dtc',
  }),
  calculateSimulation({
    id: 'seed_gulf_streetwear',
    name: 'ستريت وير ثقيل — تصدير للخليج',
    capital: 900000,
    currency: 'EGP',
    fxRate: 50,
    location: 'cairo_giza',
    market: 'gulf',
    category: 'streetwear',
    fabric: 'egyptian_cotton',
    gsm: 380,
    sourcingOrigin: 'local',
    mfgModel: 'cmt',
    skuCount: 4,
    volatility: 'medium',
    salesChannel: 'dtc',
  }),
];
