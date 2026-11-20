import type { SimulationResult } from './simulator';

export type TimeHorizon = '1w' | '1m' | '3m' | '6m' | '1y';

export type PaymentPolicyAnswer = 'cod' | 'mixed' | 'prepaid' | 'undecided';
export type MarketingPaceAnswer = 'organic' | 'steady_ads' | 'aggressive_launch' | 'undecided';
export type ReinvestAnswer = 'full_reinvest' | 'balanced_70_30' | 'withdraw_half' | 'undecided';
export type TechReadinessAnswer = 'ready_specs' | 'supplier_sizes' | 'need_help' | 'undecided';
export type OpsCapacityAnswer = 'solo_parttime' | 'solo_fulltime' | 'small_team' | 'undecided';

export interface DiagnosticAnswers {
  paymentPolicy: PaymentPolicyAnswer;
  marketingPace: MarketingPaceAnswer;
  reinvestPolicy: ReinvestAnswer;
  techReadiness: TechReadinessAnswer;
  opsCapacity: OpsCapacityAnswer;
}

export const DEFAULT_DIAGNOSTIC_ANSWERS: DiagnosticAnswers = {
  paymentPolicy: 'cod',
  marketingPace: 'steady_ads',
  reinvestPolicy: 'full_reinvest',
  techReadiness: 'undecided',
  opsCapacity: 'solo_fulltime',
};

export interface QuestionOption {
  value: string;
  labelAr: string;
  effectNoteAr: string;
}

export interface DiagnosticQuestionDef {
  id: keyof DiagnosticAnswers;
  questionAr: string;
  shortTitleAr: string;
  options: QuestionOption[];
  explainPlainAr: string;
  whyItMattersAr: string;
  learnSources: string[];
  undecidedBranchAr: {
    mustDoAr: string;
    branches: Array<{
      titleAr: string;
      verdictAr: string;
      suggestedOptionValue?: string;
      askPromptAr: string;
    }>;
  };
}

export const SIMULATION_QUESTIONS: DiagnosticQuestionDef[] = [
  {
    id: 'paymentPolicy',
    shortTitleAr: 'طريقة تحصيل الفلوس من العملاء',
    questionAr: 'هتبيع للعملاء إزاي من ناحية الدفع: كاش عند الاستلام (COD) ولا دفع مسبق أونلاين؟',
    options: [
      { value: 'cod', labelAr: 'دفع عند الاستلام بالكامل (COD)', effectNoteAr: 'مرتجعات ~12% وتحصيل يتأخر 5-7 أيام' },
      { value: 'mixed', labelAr: 'مختلط (50% مسبق / 50% عند الاستلام)', effectNoteAr: 'توازن جيد وسيولة أسرع' },
      { value: 'prepaid', labelAr: 'دفع مسبق / إنستاباي / بطاقة', effectNoteAr: 'مرتجعات ~3% وسيولة فورية' },
      { value: 'undecided', labelAr: 'لسه محددتش — نتناقش فيها', effectNoteAr: 'يفترض تحوطاً 10% مرتجع وتأخير تحصيل' },
    ],
    explainPlainAr:
      'المقصود هنا إزاي الفلوس هترجعلك من العميل. في الدفع عند الاستلام (COD) شركة الشحن بتحصّل الفلوس بعد 5-10 أيام، وبيكون فيه نسبة عملاء بترفض الاستلام فبتدفع شحن رايح جاي وفلوسك بتتعطل.',
    whyItMattersAr:
      'بيحدد سرعة رجوع الكاش في الأسبوع والشهر الأول؛ لو فلوسك محبوسة عند شركة الشحن مش هتقدر تعيد شراء المقاسات اللي خلصت بسرعة.',
    learnSources: ['Business of Fashion', 'Textile Learner', 'Shopify Apparel Benchmarks'],
    undecidedBranchAr: {
      mustDoAr:
        'لو لسه محددتش: في مصر والخليج العميل الجديد بيخاف يدفع أونلاين أول مرة، بس لو فتحت COD مطلق بدون تأكيد هتخسر في المرتجعات. اللازم يتعمل: اطلب مصاريف الشحن مسبقاً (فودافون كاش/إنستاباي) أو تأكيد واتساب أوتوماتيكي قبل خروج الأوردر.',
      branches: [
        {
          titleAr: 'مسار الأمان للمبتدئ: عربون شحن مسبق + COD للباقي',
          verdictAr: 'يخفض نسبة المرتجع الوهمي من 15% إلى أقل من 4% ويحمي سيولة الشهر الأول.',
          suggestedOptionValue: 'mixed',
          askPromptAr: 'إزاي أقنع العميل يدفع الشحن مسبقاً أو جزء من الطلب في بداية براند ملابس جديد؟',
        },
        {
          titleAr: 'لو هبدأ COD كامل لجذب أول عملاء',
          verdictAr: 'مقبول في أول 50 قطعة بشرط ترفع سعر القطعة +5% كاحتياطي شحن مرتجع وتفحص جدول المقاسات.',
          suggestedOptionValue: 'cod',
          askPromptAr: 'احسب لي المخاطرة لو بدأت دفع عند الاستلام بالكامل في أول شهر ومعدل المرتجع المتوقع؟',
        },
      ],
    },
  },
  {
    id: 'marketingPace',
    shortTitleAr: 'طريقة البيع وجلب الطلبات',
    questionAr: 'ناوي تبيع وتجيب أول طلبات إزاي في الشهر الأول؟',
    options: [
      { value: 'organic', labelAr: 'محتوى عضوي ومعارف (بدون إعلانات تقيلة)', effectNoteAr: 'نمو بطيء وآمن ومصاريف كاش أقل' },
      { value: 'steady_ads', labelAr: 'إعلانات ممولة متزنة + ريلز منتظمة', effectNoteAr: 'دوران متوسط (15-35% أسبوعياً)' },
      { value: 'aggressive_launch', labelAr: 'حملة إطلاق قوية + مؤثرين', effectNoteAr: 'بيع سريع وخطر نفاد المقاسات مبكراً' },
      { value: 'undecided', labelAr: 'لسه محددتش — نتناقش فيها', effectNoteAr: 'يحتاج خطة استحواذ قبل حرق ميزانية التسويق' },
    ],
    explainPlainAr:
      'يعني الخطة اللي هتوصّل بيها القطعة للعميل: هل هتعتمد على تصوير ريلز وتيك توك وبيع للمعارف الأول، ولا هتشغل إعلانات ميتا/تيك توك بميزانية يومية، ولا هتبعت قطع لمؤثرين (Micro-influencers)؟',
    whyItMattersAr:
      'التسويق هو محرك السرعة في المحاكاة: مصنع ممتاز بدون حركة بيع يعني بضاعة راكدة في الشهر الثالث، وإعلانات قوية على مخزون قليل معناها نفاد المقاسات في الأسبوع الثاني.',
    learnSources: ['WGSN', 'Highsnobiety', 'Business of Fashion'],
    undecidedBranchAr: {
      mustDoAr:
        'لو لسه محددتش: إوعى تصرف ميزانية التسويق كلها في أول أسبوعين على إعلان واحد! لازم الأول تصوّر 10 فيديوهات لابس فيها القطعة على موديل حقيقي وتجرب إعلان رسائل/تحويل بميزانية اختبار صغيرة لمدة 5 أيام عشان تعرف تكلفة الأوردر (CAC).',
      branches: [
        {
          titleAr: 'لو ميزانيتك محدودة وتخاف تحرق فلوس الإعلانات',
          verdictAr: 'ابدأ بـ 30% محتوى تيك توك/ريلز + ميكرو إنفلونسرز مقابل قطع مجانية قبل ضخ إعلانات ممولة.',
          suggestedOptionValue: 'organic',
          askPromptAr: 'اعمل لي خطة تسويق منخفضة التكلفة لأول شهر لبيع أول 50 قطعة بدون إهدار ميزانية؟',
        },
        {
          titleAr: 'لو جاهز بمنتج وبضاعة وعايز دوران شهري منظم',
          verdictAr: 'خصص ميزانية أسبوعية ثابتة لا تتجاوز 25% من مبيعات الأسبوع السابق وراقب تكلفة الرسالة/الشراء.',
          suggestedOptionValue: 'steady_ads',
          askPromptAr: 'كم تكلفة الاستحواذ (CAC) المنطقية لبيع قطعة ملابس في مصر أو الخليج مقارنة بسعر بيعي؟',
        },
      ],
    },
  },
  {
    id: 'reinvestPolicy',
    shortTitleAr: 'تدوير الأرباح وإعادة الشراء',
    questionAr: 'لما تبدأ تبيع ويرجعلك كاش، هتعمل إيه في الأرباح أول 6 شهور؟',
    options: [
      { value: 'full_reinvest', labelAr: 'إعادة ضخ 100% من الأرباح لتكبير البضاعة', effectNoteAr: 'أسرع نمو سنوي وتراكم مخزون' },
      { value: 'balanced_70_30', labelAr: '70% للتشغيل والتكبير و30% احتياطي/سحب', effectNoteAr: 'نمو متوازن مع سيولة أمان' },
      { value: 'withdraw_half', labelAr: 'سحب 50% من الربح كمصروف شخصي', effectNoteAr: 'يثبت حجم البراند ويبطئ التوسع' },
      { value: 'undecided', labelAr: 'لسه محددتش — نتناقش فيها', effectNoteAr: 'مهم لحسم خطة الـ 6 شهور والسنة' },
    ],
    explainPlainAr:
      'يعني كل دورة بيع (مثلاً بعد ما تبيع أول 100 قطعة)، هل هترجع كل الفلوس اللي دخلت عشان تجيب 140 قطعة ثم 200 قطعة، ولا هتسحب جزء منها لحسابك الشخصي؟',
    whyItMattersAr:
      'الفرق في محاكاة السنة الواحدة ضخم جداً: تدوير 100% في أول 6 شهور ممكن يضاعف حجم البراند 3-4 مرات مقارنة بالسحب المبكر، خصوصاً لو ناوي تنتقل من مكاتب الجملة للتصنيع الخاص.',
    learnSources: ['CFDA', 'Business of Fashion', 'ITMF'],
    undecidedBranchAr: {
      mustDoAr:
        'لو لسه محددتش: القاعدة الذهبية في أول 90 يوماً هي «ممنوع سحب أرباح» لو بتشتغل برأس مال صغير أو متوسط. لازم تضخ المكسب في سد المقاسات الناقصة وتزويد الموديل الرابح (Best Seller) لحد ما توصل لدورتين متكاملتين.',
      branches: [
        {
          titleAr: 'لو ده مشروعك الأساسي ومحتاج دخل شهري منه',
          verdictAr: 'اعتمد نظام 70/30 بعد الشهر الثاني، واسحب نسبة ثابتة من صافي الربح المحقق فقط مش من الكاش الإجمالي!',
          suggestedOptionValue: 'balanced_70_30',
          askPromptAr: 'إزاي أفصل بين رأس مال البضاعة والمصروف الشخصي عشان البراند ميقعش بعد 3 شهور؟',
        },
        {
          titleAr: 'لو معاك مصدر دخل تاني وهدفك تكبر البراند للتصنيع والتصدير',
          verdictAr: 'تدوير 100% لمدة 6 شهور هيوصلك للحد الأدنى لمصانع الـ CMT/FOB أسرع بنص الوقت.',
          suggestedOptionValue: 'full_reinvest',
          askPromptAr: 'لو دورت 100% من الأرباح لمدة 6 شهور، إمتى أقدر أتحول من مكتب الجملة لتصنيع براندي في مصنع؟',
        },
      ],
    },
  },
  {
    id: 'techReadiness',
    shortTitleAr: 'جاهزية المقاسات والتيكت والتجهيز الفني',
    questionAr: 'هل جهزت جدول المقاسات والتيكت والتغليف (أو الـ Tech Pack) ولا لسه؟',
    options: [
      { value: 'ready_specs', labelAr: 'جاهز (جدول مقاسات + لوجو + تيكت وتغليف)', effectNoteAr: 'أقل مرتجع مقاسات وانطلاقة فورية' },
      { value: 'supplier_sizes', labelAr: 'هعتمد على مقاسات المورد/المصنع الجاهزة مؤقتاً', effectNoteAr: 'بداية سريعة لكن تحتاج اختبار عينة' },
      { value: 'need_help', labelAr: 'محتاج أعملهم من الصفر ومش فاهم التفاصيل', effectNoteAr: 'يضيف أسبوع تجهيز في البداية' },
      { value: 'undecided', labelAr: 'لسه محددتش — نتناقش فيها', effectNoteAr: 'أهم سبب لتأخير البداية ومرتجعات المقاس' },
    ],
    explainPlainAr:
      'الـ Tech Pack هو «الروشتة الهندسية» للقطعة (الطول، العرض، وزن القماش GSM، مكان اللوجو، ونوع الغرزة). ولو بتشتري جاهز من مكتب جملة، المقصود هنا التأكد إن مقاس L عندهم فعلاً يلبّس L مش ضيق، وإن عندك تيكت وكيس تغليف باسمك.',
    whyItMattersAr:
      '40% من مرتجعات الملابس أونلاين سببها اختلاف المقاسات أو الانكماش بعد أول غسلة. ضبطها قبل الإنتاج أو الشراء يوفر آلاف الجنيهات في الشهر الأول.',
    learnSources: ['CLO 3D', 'Textile Learner', 'Avery Dennison', 'AATCC'],
    undecidedBranchAr: {
      mustDoAr:
        'لو لسه محددتش: لازم تقف هنا قبل دفع أي فلوس! لو هتصنع في مصنع لازم تعمل عينة واحدة وتغسلها وتقيسها قبل وبعد الغسيل. لو هتشتري جملة، قِس بنفسك كل مقاس بالمازورة واكتب جدول مقاسات بالسنتيمتر لعملاء المتجر.',
      branches: [
        {
          titleAr: 'لو هتبدأ من مكاتب الجملة أو بلانكات جاهزة',
          verdictAr: 'اطبع تيكت رقبة وكرت سعر وكيس مطبوع (تكلفة بسيطة) واكتب جدول مقاسات حقيقي بالمازورة لقطع المورد.',
          suggestedOptionValue: 'supplier_sizes',
          askPromptAr: 'إيه أبسط طريقة أجهز بيها تيكت وتغليف احترافي لقطع جاهزة من غير تكلفة مصانع كبيرة؟',
        },
        {
          titleAr: 'لو ناوي تصنع في ورشة أو مصنع CMT',
          verdictAr: 'ممنوع تقص ثوب قماش بدون باترون مجرب وعينة PP Sample معتمدة بالمازورة واختبار انكماش.',
          suggestedOptionValue: 'need_help',
          askPromptAr: 'اشرح لي خطوة بخطوة إزاي أعمل أول Tech Pack وجدول مقاسات سليم قبل دخول المصنع؟',
        },
      ],
    },
  },
  {
    id: 'opsCapacity',
    shortTitleAr: 'الوقت المتاح وفريق التشغيل',
    questionAr: 'مين هيدير الشغل اليومي (الرد على العملاء، التغليف، متابعة المورد/المصنع)؟',
    options: [
      { value: 'solo_parttime', labelAr: 'لوحدي بجانب شغل/دراسة (2-3 ساعات يومياً)', effectNoteAr: 'سقف عملي ~35 طلب/أسبوع' },
      { value: 'solo_fulltime', labelAr: 'متفرغ بالكامل لوحدي', effectNoteAr: 'سقف عملي ~90 طلب/أسبوع' },
      { value: 'small_team', labelAr: 'شركاء أو معايا حد للتغليف والرد', effectNoteAr: 'قدرة توسع لـ 250+ طلب/أسبوع' },
      { value: 'undecided', labelAr: 'لسه محددتش — نتناقش فيها', effectNoteAr: 'يوضح سقف الطلبات قبل الاختناق التشغيلي' },
    ],
    explainPlainAr:
      'يعني طاقتك اليومية لتجهيز الأوردرات وتسليمها لشركة الشحن والرد على رسائل العملاء ومتابعة المرتجعات أو النزول للموردين.',
    whyItMattersAr:
      'ناس كتير بتنجح في الإعلان وتقع في التشغيل: تأخير الرد أو الشحن 4 أيام بيضاعف نسبة إلغاء الطلبات في الشهر الثاني.',
    learnSources: ['Sourcify', 'Fashiondex', 'AAPN'],
    undecidedBranchAr: {
      mustDoAr:
        'لو لسه محددتش: احسب وقتك بواقعية. لو بتشتغل لوحدك بجانب وظيفة، اختار مسار جاهز بدون شراء خامات (مكاتب جملة أو White-Label أو POD) عشان متضيعش يومك بين تجار القماش والورش وتتأخر على طلبات العملاء.',
      branches: [
        {
          titleAr: 'لو وقتي ضيق وبشتغل لوحدي حالياً',
          verdictAr: 'لازم تشتغل بمورد جاهز قريب منك أو شركة Fulfillment تخزن وتشحن بدالك بعد أول 50 طلب.',
          suggestedOptionValue: 'solo_parttime',
          askPromptAr: 'إزاي أدير براند ملابس بـ 3 ساعات يومياً فقط من غير ما أتأخر على الشحن والعملاء؟',
        },
        {
          titleAr: 'لو معايا شريك أو هفرّغ نفسي تماماً',
          verdictAr: 'قسم الأدوار فوراً: شخص للموردين والجودة والمخزون، وشخص للمحتوى والإعلانات والعملاء.',
          suggestedOptionValue: 'small_team',
          askPromptAr: 'إيه أنسب تقسيم أدوار بين شريكين بيبدأوا براند ملابس عشان الشغل ميتلخبطش؟',
        },
      ],
    },
  },
];

export interface ApparelConceptEntry {
  id: string;
  termAr: string;
  termEn: string;
  meaningAr: string;
  exampleAr: string;
  sourceRef: string;
}

export const APPAREL_CONCEPT_HELPERS: ApparelConceptEntry[] = [
  {
    id: 'moq',
    termAr: 'الحد الأدنى للطلب (MOQ)',
    termEn: 'Minimum Order Quantity',
    meaningAr: 'أقل عدد قطع يقبل المصنع أو مكتب الجملة يبيعه أو ينتجه لك في الموديل الواحد (مثلاً 12 قطعة في الجملة مقابل 180-500 قطعة في المصنع).',
    exampleAr: 'لو الـ MOQ هو 180 قطعة وعندك 3 موديلات يبقى لازم ميزانيتك تكفي 540 قطعة.',
    sourceRef: 'Sourcify',
  },
  {
    id: 'cmt_vs_fob',
    termAr: 'الفرق بين CMT و FOB ومكاتب الجملة',
    termEn: 'CMT vs FOB vs Wholesale',
    meaningAr: 'في الجملة بتاخد قطعة جاهزة بدون شراء خامات؛ في CMT إنت بتشتري القماش والإكسسوار والمصنع بيقص ويخيط؛ في FOB المصنع بيتكفل بكل شيء ويسلمك قطعة تامة.',
    exampleAr: 'للمبتدئ برأس مال صغير: مكاتب الجملة أو White-Label أسرع وأأمن، وللمتوسع: CMT أو FOB أعلى في هامش الربح.',
    sourceRef: 'Textile Learner',
  },
  {
    id: 'gsm',
    termAr: 'وزن القماش (GSM)',
    termEn: 'Grams per Square Meter',
    meaningAr: 'وزن المتر المربع من القماش بالجرام؛ يحدد ثقل القطعة وموسمها. 160-180 خفيف صيفي، 220-240 تيشيرت ثقيل، 300-380 هوديز وسويت شيرت شتوي.',
    exampleAr: 'تيشيرت ستريت وير أوفرسايز غالباً يحتاج 240-280 GSM سنجل جيرسي قطن.',
    sourceRef: 'CottonWorks',
  },
  {
    id: 'cod',
    termAr: 'الدفع عند الاستلام والمرتجعات (COD)',
    termEn: 'Cash on Delivery & Return Rate',
    meaningAr: 'العميل يدفع للمندوب عند استلام الطرد. مشكلة الـ COD إن المبلغ يتأخر في شركة الشحن 5-10 أيام وإذا رفض العميل الاستلام تتحمل تكلفة الشحن.',
    exampleAr: 'طلب تأكيد الشحن أو عربون مصاريف الشحن يخفض المرتجع من 14% إلى 4%.',
    sourceRef: 'Business of Fashion',
  },
  {
    id: 'tech_pack',
    termAr: 'ملف المواصفات الفنية (Tech Pack)',
    termEn: 'Technical Specification Pack',
    meaningAr: 'ملف يحتوي على رسم القطعة من الأمام والخلف، جدول المقاسات لكل حجم (S-XXL)، نوع القماش والغرز والإكسسوارات ومكان الطباعة.',
    exampleAr: 'وجود Tech Pack يمنع المصنع من إنتاج مقاسات عشوائية تسبب مرتجعات.',
    sourceRef: 'CLO 3D',
  },
  {
    id: 'aql',
    termAr: 'فحص الجودة العشوائي (AQL)',
    termEn: 'Acceptable Quality Limit',
    meaningAr: 'معيار عالمي لفحص عينة إحصائية من الإنتاج قبل استلامه من المصنع للتأكد أن العيوب لا تتعدى النسبة المسموحة (عادة AQL 2.5).',
    exampleAr: 'فحص 32 قطعة عشوائية من دفعة 200 قطعة يكشف أخطاء الخياطة أو السحابات قبل الدفع النهائي.',
    sourceRef: 'AATCC',
  },
  {
    id: 'cac_roas',
    termAr: 'تكلفة جلب العميل والعائد الإعلاني (CAC / ROAS)',
    termEn: 'Customer Acquisition Cost',
    meaningAr: 'المبلغ الإعلاني الذي تدفعه لتبيع قطعة واحدة. يجب أن يكون هامش ربح القطعة أعلى من تكلفة الإعلان + الشحن + المرتجع.',
    exampleAr: 'إذا كان ربح القطعة 250 ج.م وتكلفة الإعلان للأوردر 110 ج.م يتبقى لك 140 ج.م صافي قبل المصاريف الثابتة.',
    sourceRef: 'Vogue Business',
  },
  {
    id: 'white_label',
    termAr: 'التجهيز على بلانكات جاهزة (White-Label)',
    termEn: 'White-Label Apparel',
    meaningAr: 'شراء ملابس سادة خالية من أي علامة تجارية من مصنع/مكتب بلانكات بدون شراء خامات، ثم وضع التيكت والطباعة والتغليف الخاص ببراندك.',
    exampleAr: 'يجمع بين سرعة الجملة (أسبوع) وبناء هوية براند مستقلة.',
    sourceRef: 'Fashiondex',
  },
];

export interface HorizonSnapshot {
  horizon: TimeHorizon;
  labelAr: string;
  durationWeeks: number;
  activeSellingWeeks: number;
  unitsSold: number;
  cumulativeRevenueUsd: number;
  cumulativeGrossProfitUsd: number;
  cumulativeNetCashUsd: number;
  cashCollectedUsd: number;
  cashInTransitUsd: number;
  restockCycles: number;
  estimatedReturnsUnits: number;
  reachedBreakEven: boolean;
  headlineAr: string;
  whatHappensAr: string[];
  mustWatchOutAr: string[];
}

export interface TimelineSimulation {
  activeHorizon: TimeHorizon;
  activeSnapshot: HorizonSnapshot;
  allHorizons: HorizonSnapshot[];
  estimatedBreakEvenLabelAr: string;
  unsettledAlertsAr: Array<{
    questionId: keyof DiagnosticAnswers;
    titleAr: string;
    mustDoAr: string;
  }>;
}

const HORIZON_META: Array<{ horizon: TimeHorizon; labelAr: string; weeks: number }> = [
  { horizon: '1w', labelAr: 'خلال أسبوع', weeks: 1 },
  { horizon: '1m', labelAr: 'خلال شهر', weeks: 4.3 },
  { horizon: '3m', labelAr: 'خلال 3 شهور', weeks: 13 },
  { horizon: '6m', labelAr: 'خلال 6 شهور', weeks: 26 },
  { horizon: '1y', labelAr: 'خلال سنة كاملة', weeks: 52 },
];

function getLeadTimeDelayWeeks(model: SimulationResult['input']['mfgModel'], techReadiness: TechReadinessAnswer): number {
  const extraTechDelay = techReadiness === 'need_help' || techReadiness === 'undecided' ? 0.6 : 0;
  switch (model) {
    case 'wholesale_office':
      return 0.25; // ~2 days to inspect and bring ready stock
    case 'pod':
      return 0.2;
    case 'white_label':
      return 1.0 + extraTechDelay * 0.5;
    case 'workshop':
      return 2.5 + extraTechDelay;
    case 'cmt':
      return 4.5 + extraTechDelay;
    case 'fob':
      return 8.0 + extraTechDelay;
  }
}

export function calculateTimelineProjection(
  sim: SimulationResult,
  answers: DiagnosticAnswers,
  activeHorizon: TimeHorizon
): TimelineSimulation {
  const leadDelayWeeks = getLeadTimeDelayWeeks(sim.input.mfgModel, answers.techReadiness);

  const paymentReturnRate =
    answers.paymentPolicy === 'prepaid'
      ? 0.03
      : answers.paymentPolicy === 'mixed'
        ? 0.06
        : answers.paymentPolicy === 'cod'
          ? 0.12
          : 0.1;

  const cashTransitFraction =
    answers.paymentPolicy === 'prepaid'
      ? 0.03
      : answers.paymentPolicy === 'mixed'
        ? 0.12
        : 0.22;

  const techReturnPenalty =
    answers.techReadiness === 'ready_specs'
      ? 0
      : answers.techReadiness === 'supplier_sizes'
        ? 0.03
        : 0.06;

  const effectiveReturnRate = Math.min(0.24, paymentReturnRate + techReturnPenalty);

  // Weekly demand rate based on marketing pace & ops ceiling
  const baseWeeklySellThrough =
    answers.marketingPace === 'aggressive_launch'
      ? Math.max(18, Math.round(sim.possibleUnits * 0.24))
      : answers.marketingPace === 'steady_ads'
        ? Math.max(10, Math.round(sim.possibleUnits * 0.14))
        : answers.marketingPace === 'organic'
          ? Math.max(4, Math.round(sim.possibleUnits * 0.06))
          : Math.max(7, Math.round(sim.possibleUnits * 0.1));

  const opsWeeklyCap =
    answers.opsCapacity === 'solo_parttime'
      ? 35
      : answers.opsCapacity === 'solo_fulltime'
        ? 90
        : answers.opsCapacity === 'small_team'
          ? 260
          : 60;

  const effectiveWeeklySales = Math.max(1, Math.min(baseWeeklySellThrough, opsWeeklyCap));

  const reinvestRatio =
    answers.reinvestPolicy === 'full_reinvest'
      ? 0.92
      : answers.reinvestPolicy === 'balanced_70_30'
        ? 0.7
        : answers.reinvestPolicy === 'withdraw_half'
          ? 0.45
          : 0.65;

  const fixedSetupCostUsd = sim.budgetAllocations
    .filter((b) => b.key === 'sampling' || b.key === 'compliance')
    .reduce((sum, b) => sum + b.amountUsd, 0);
  const initialMarketingUsd =
    sim.budgetAllocations.find((b) => b.key === 'marketing')?.amountUsd ?? 0;

  const initialBatchUnits = Math.max(1, sim.possibleUnits);

  const allHorizons: HorizonSnapshot[] = HORIZON_META.map((meta) => {
    const activeSellingWeeks = Math.max(0, meta.weeks - leadDelayWeeks);

    // Simulate inventory + demand compounding across restock cycles
    const safeUnitMargin = Math.max(0, sim.grossProfitPerUnitUsd);
    const cycleGrowthFactor =
      1 + ((safeUnitMargin * (1 - effectiveReturnRate)) / Math.max(1, sim.unitCostUsd)) * reinvestRatio;

    let cumulativeCapUnits = initialBatchUnits;
    let cycles = 1;
    let remainingWeeks = activeSellingWeeks;
    const avgCycleSellWeeks = Math.max(2.5, initialBatchUnits / effectiveWeeklySales + Math.min(2.5, leadDelayWeeks * 0.45));

    while (remainingWeeks > avgCycleSellWeeks && cycles < 12) {
      remainingWeeks -= avgCycleSellWeeks;
      cycles += 1;
      const nextBatch = Math.floor(
        initialBatchUnits * Math.pow(Math.min(1.48, Math.max(1.0, cycleGrowthFactor)), cycles - 1)
      );
      cumulativeCapUnits += nextBatch;
    }

    // Reinvesting profits funds extra SKUs/ad scale each restock cycle (bounded by ops capacity)
    const reinvestmentDemandMultiplier =
      cycles > 1 ? 1 + (cycles - 1) * (reinvestRatio * 0.14) : 1;
    const scaledWeeklySales = Math.min(opsWeeklyCap, effectiveWeeklySales * reinvestmentDemandMultiplier);
    const rawUnitsDemanded = Math.floor(activeSellingWeeks * scaledWeeklySales);

    const unitsSold = activeSellingWeeks <= 0 ? 0 : Math.min(rawUnitsDemanded, cumulativeCapUnits);
    const estimatedReturnsUnits = Math.round(unitsSold * effectiveReturnRate);
    const netKeptUnits = Math.max(0, unitsSold - estimatedReturnsUnits);

    const cumulativeRevenueUsd = netKeptUnits * sim.suggestedRetailUsd;
    const returnShippingPenaltyUsd = estimatedReturnsUnits * Math.max(1.2, sim.unitCostUsd * 0.14);
    const ongoingMarketingUsd =
      activeSellingWeeks <= 0
        ? 0
        : initialMarketingUsd * Math.max(1, meta.weeks / 4.3) * 0.65;

    const cumulativeGrossProfitUsd =
      netKeptUnits * sim.grossProfitPerUnitUsd - returnShippingPenaltyUsd;
    const cumulativeNetCashUsd =
      cumulativeGrossProfitUsd - fixedSetupCostUsd - ongoingMarketingUsd;

    const cashInTransitUsd =
      unitsSold > 0
        ? Math.round(
            Math.min(cumulativeRevenueUsd, effectiveWeeklySales * 1.3 * sim.suggestedRetailUsd) *
              cashTransitFraction
          )
        : 0;
    const cashCollectedUsd = Math.max(0, cumulativeRevenueUsd - cashInTransitUsd);
    const reachedBreakEven = sim.breakEvenReachable && netKeptUnits >= sim.breakEvenUnits && unitsSold > 0;

    // Concrete stage narrative tailored to horizon + model + answers
    const whatHappensAr: string[] = [];
    const mustWatchOutAr: string[] = [];
    let headlineAr = '';

    if (meta.horizon === '1w') {
      if (activeSellingWeeks <= 0) {
        headlineAr = 'أسبوع التجهيز والعينات — لا توجد مبيعات فعلية بعد';
        whatHappensAr.push(
          sim.requiresRawFabric
            ? `شراء الخامات أو اعتماد الباترون وتجهيز عينة ما قبل الإنتاج (PP Sample) في نطاق ${sim.localGuide.locationLabelAr}.`
            : 'الاتفاق مع مورد البلانكات وتجهيز اللوجو والتيكت والتغليف قبل فتح البيع.'
        );
        whatHappensAr.push('تصوير الموديلات الأولى وبناء صفحة المتجر / الحساب التجاري.');
        mustWatchOutAr.push('لا تدفع كامل مبلغ التشغيل قبل فحص عينة ملموسة بالمازورة.');
      } else {
        headlineAr = `انطلاقة سريعة: بيع متوقع لـ ${unitsSold} قطعة في الأسبوع الأول`;
        whatHappensAr.push(
          `تأمين أول دفعة جاهزة بدون شراء خامات من ${sim.localGuide.spots[0]?.zoneNameAr || sim.localGuide.locationLabelAr} وبدء الاختبار الفعلي.`
        );
        whatHappensAr.push(`قياس استجابة العملاء للمقاسات والسعر (${Math.round(effectiveWeeklySales)} طلب/أسبوع).`);
        mustWatchOutAr.push(
          answers.paymentPolicy === 'cod'
            ? 'راقب تأكيد أوردرات الـ COD بالهاتف/الواتساب حتى لا ترتفع نسبة المرتجع من البداية.'
            : 'تأكد من وضوح جدول المقاسات لتجنب طلبات الاستبدال.'
        );
      }
    } else if (meta.horizon === '1m') {
      if (activeSellingWeeks <= 0) {
        headlineAr = 'شهر التصنيع والامتثال — البضاعة قيد الإنتاج في المصنع';
        whatHappensAr.push(
          `خط الإنتاج يعمل على ${sim.possibleUnits} قطعة بمدة توريد (${sim.leadTimeWeeks}) مع متابعة فحص الجودة المرحلي.`
        );
        whatHappensAr.push('بدء الحجز المسبق (Pre-order) وبناء قائمة انتظار عبر المحتوى التمهيدي.');
        mustWatchOutAr.push('راقب التزام المصنع بموعد التسليم (Lead Time) حتى لا يضيع الموسم.');
      } else {
        headlineAr = `اختبار السوق الحقيقي: مبيعات صافية ~${netKeptUnits} قطعة وتحقق اتجاه الطلب`;
        whatHappensAr.push(
          `تظهر بوضوح الموديلات الأسرع مبيعاً (Best Sellers) والمقاسات الأكثر طلباً (عادة M وL).`
        );
        whatHappensAr.push(
          reachedBreakEven
            ? `تجاوزت نقطة التعادل (${sim.breakEvenUnits} قطعة) ودخل البراند في منطقة الربح الصافي.`
            : `البراند في طريق التعادل (${netKeptUnits} من أصل ${sim.breakEvenUnits} قطعة مطلوبة للتعادل).`
        );
        mustWatchOutAr.push(
          `تحصيل شركة الشحن قد يحجز ~${Math.round(cashInTransitUsd).toLocaleString('en-US')}$ كأموال قيد التحصيل — لا تعتمد على إنفاقها قبل وصولها للبنك.`
        );
      }
    } else if (meta.horizon === '3m') {
      headlineAr = `دورة رأس المال الأولى وإعادة الشراء (${cycles} ${cycles === 1 ? 'دورة' : 'دورات'})`;
      whatHappensAr.push(
        `بيع ~${netKeptUnits} قطعة صافية؛ تظهر هنا قيمة سياسة التدوير (${
          answers.reinvestPolicy === 'full_reinvest' ? 'ضخ كامل الأرباح' : 'التوزيع المتوازن'
        }) في توسيع المخزون.`
      );
      whatHappensAr.push(
        sim.requiresRawFabric
          ? 'تقييم تكلفة القص الفعلية والمصنعية لتخفيض تكلفة القطعة في الدفعة الثانية.'
          : 'أول فرصة ذهبية لتحويل أنجح موديلين من مكتب الجملة إلى تصنيع خاص (CMT) لرفع الهامش.'
      );
      mustWatchOutAr.push('احذر من "المقاسات المتبقية الميتة" (S أو XXL) — صفّها بعروض حزم قبل دخول موسم جديد.');
    } else if (meta.horizon === '6m') {
      headlineAr = `تثبيت الهوية وتوسيع التشكيلة (${cycles} دورات دوران)`;
      whatHappensAr.push(
        `حجم تداول متوقع يصل إلى ${netKeptUnits.toLocaleString('en-US')} قطعة؛ قاعدة عملاء متكرري الشراء تخفض تكلفة الإعلان.`
      );
      whatHappensAr.push(
        'الانتقال من الشغل الفردي البسيط إلى نظام جرد منظم وموردين ثابتين بعقود أو أولوية تصنيع.'
      );
      mustWatchOutAr.push(
        answers.opsCapacity === 'solo_parttime'
          ? 'تحذير تشغيلي: حجم الطلبات سيتجاوز قدرتك الفردية (3 ساعات/يوم) — ستحتاج مساعد تغليف أو شركة Fulfillment.'
          : 'راقب تضخم أسعار القماش أو الجملة بين المواسم لتحديث سعر البيع مبكراً.'
      );
    } else {
      headlineAr = `سنة كاملة: التحول لعلامة تجارية مستقرة وجاهزة للتصدير (${cycles} دورات)`;
      whatHappensAr.push(
        `إجمالي مبيعات تقديري ~${netKeptUnits.toLocaleString('en-US')} قطعة؛ مع تدوير الأرباح تصل للحد الأدنى لمصانع FOB أو التوسع بالبيع الجملة (B2B).`
      );
      whatHappensAr.push(
        'توثيق العلامة التجارية قانونياً (سجل، علامة WIPO، وتجهيز ملفات التصدير GOEIC / ITC).'
      );
      mustWatchOutAr.push('التحدي الأكبر في السنة الأولى هو تخطيط السيولة بين الشتوي والصيفي دون تعثر المخزون.');
    }

    return {
      horizon: meta.horizon,
      labelAr: meta.labelAr,
      durationWeeks: meta.weeks,
      activeSellingWeeks: Number(activeSellingWeeks.toFixed(1)),
      unitsSold,
      cumulativeRevenueUsd,
      cumulativeGrossProfitUsd,
      cumulativeNetCashUsd,
      cashCollectedUsd,
      cashInTransitUsd,
      restockCycles: cycles,
      estimatedReturnsUnits,
      reachedBreakEven,
      headlineAr,
      whatHappensAr,
      mustWatchOutAr,
    };
  });

  const activeSnapshot =
    allHorizons.find((h) => h.horizon === activeHorizon) ?? allHorizons[1];

  const netWeeklyKeptUnits = Math.max(0.5, effectiveWeeklySales * (1 - effectiveReturnRate));
  const weeksToBreakEven = leadDelayWeeks + sim.breakEvenUnits / netWeeklyKeptUnits;
  const estimatedBreakEvenLabelAr = !sim.breakEvenReachable
    ? 'لا تتحقق بالسعر الحالي (سعر البيع أقل من التكلفة)'
    : weeksToBreakEven <= 1.5
      ? 'حوالي أسبوع ونصف'
      : weeksToBreakEven <= 5
        ? `حوالي ${Math.ceil(weeksToBreakEven)} أسابيع`
        : `حوالي ${Math.max(2, Math.round(weeksToBreakEven / 4.3))} شهور`;

  const unsettledAlertsAr = SIMULATION_QUESTIONS.filter(
    (q) => answers[q.id] === 'undecided'
  ).map((q) => ({
    questionId: q.id,
    titleAr: q.shortTitleAr,
    mustDoAr: q.undecidedBranchAr.mustDoAr,
  }));

  return {
    activeHorizon,
    activeSnapshot,
    allHorizons,
    estimatedBreakEvenLabelAr,
    unsettledAlertsAr,
  };
}

export function searchApparelConcepts(query: string): ApparelConceptEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return APPAREL_CONCEPT_HELPERS;
  return APPAREL_CONCEPT_HELPERS.filter(
    (item) =>
      item.termAr.toLowerCase().includes(q) ||
      item.termEn.toLowerCase().includes(q) ||
      item.meaningAr.toLowerCase().includes(q) ||
      item.sourceRef.toLowerCase().includes(q)
  );
}
