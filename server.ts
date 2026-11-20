import 'dotenv/config';
import http from 'http';
import express, { type Request, type Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Modality, Type, type LiveServerMessage } from '@google/genai';
import { WebSocketServer, type WebSocket } from 'ws';
import { TEXTILE_SOURCES, type TextileSource } from './src/data/sources.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const MODEL_NAME = 'gemini-4-hydrogen';
const FAST_MODEL_NAME = 'gemini-3.1-flash-lite';
const LIVE_MODEL_NAME = 'gemini-3.8-live';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('MISSING_API_KEY');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

interface CitationItem {
  title: string;
  uri: string;
}

function extractCitations(response: unknown): CitationItem[] {
  const r = response as {
    candidates?: Array<{
      groundingMetadata?: {
        groundingChunks?: Array<{
          web?: { uri?: string; title?: string };
        }>;
      };
    }>;
  };
  const chunks = r?.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const seen = new Set<string>();
  const citations: CitationItem[] = [];

  for (const chunk of chunks) {
    const uri = chunk?.web?.uri;
    if (uri && !seen.has(uri)) {
      seen.add(uri);
      citations.push({
        uri,
        title: chunk.web?.title || uri,
      });
    }
  }
  return citations;
}

function formatGeminiError(err: unknown): { status: number; message: string } {
  const message = err instanceof Error ? err.message : String(err);
  if (message === 'MISSING_API_KEY') {
    return {
      status: 503,
      message:
        'مفتاح Gemini API غير مضبوط في إعدادات الخادم (Settings > Secrets). أضف GEMINI_API_KEY لتفعيل الاستشارة الحية.',
    };
  }
  if (
    message.includes('403') ||
    message.includes('PERMISSION_DENIED') ||
    message.includes('API_KEY_INVALID')
  ) {
    return {
      status: 403,
      message:
        'تعذر التحقق من صلاحية GEMINI_API_KEY. يرجى مراجعة المفتاح في لوحة Settings > Secrets.',
    };
  }
  if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
    return {
      status: 429,
      message:
        'تم الوصول للحد الأقصى للطلبات حالياً (Rate Limit). يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.',
    };
  }
  return {
    status: 500,
    message: `تعذر إتمام الطلب عبر Gemini: ${message}`,
  };
}

function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function selectFocusedSources(question: string, sourceIds?: string[]): TextileSource[] {
  if (Array.isArray(sourceIds) && sourceIds.length > 0) {
    const explicit = TEXTILE_SOURCES.filter((s) => sourceIds.includes(s.id));
    if (explicit.length > 0) {
      return explicit.slice(0, 12);
    }
  }

  const q = question.toLowerCase();
  const picked: TextileSource[] = [];
  const addByCat = (cat: TextileSource['category'], limit: number) => {
    const matches = TEXTILE_SOURCES.filter((s) => s.category === cat).slice(0, limit);
    picked.push(...matches);
  };

  if (/مصر|محلي|محلة|عاشر|تصدير|جمارك|عتبة|موسكي|جسر|برج العرب|بورسعيد|جملة|goeic|etda|fei|كويز|أغادير/.test(q)) {
    addByCat('egypt', 4);
    addByCat('sourcing', 3);
  }
  if (/3d|cad|باترون|clo|lectra|gerber|illustrator|تعشيق/.test(q)) {
    addByCat('cad', 4);
  }
  if (/ماكين|غزل|نسيج|خياط|قص|تريكو|rieter|mayer|pegasus|jack|shima/.test(q)) {
    addByCat('machinery', 4);
  }
  if (/طباع|تطريز|حرار|dtf|dtg|epson|kornit|tajima|stahls/.test(q)) {
    addByCat('printing', 4);
  }
  if (/سحاب|خيط|تيكت|تغليف|تجهيز|بلانك|white.?label|ykk|coats|avery|riri|prym/.test(q)) {
    addByCat('trims', 4);
  }
  if (/شهاد|جود|اختبار|استدام|aql|oeko|gots|aatcc|astm|rsl|iso/.test(q)) {
    addByCat('standards', 4);
  }
  if (/قماش|قطن|كتان|ألياف|tencel|lenzing|cotton|repreve|swatch/.test(q)) {
    addByCat('materials', 4);
  }
  if (/موض|ترند|ألوان|براند|مصمم|لوجو|هوية|wgsn|vogue|bof|pantone|virgil|rick/.test(q)) {
    addByCat('trends', 3);
    addByCat('designers', 2);
  }

  if (picked.length === 0) {
    return TEXTILE_SOURCES.filter((s) => s.isCore16).slice(0, 10);
  }

  const unique = Array.from(new Map(picked.map((s) => [s.id, s])).values());
  return unique.slice(0, 10);
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '4mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, brand: 'DoDo', sourcesCount: TEXTILE_SOURCES.length });
  });

  app.get('/api/public-config', (_req: Request, res: Response) => {
    const mapsApiKey =
      process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '';
    res.json({
      mapsApiKey,
      hasGeminiKey: Boolean(
        process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
      ),
    });
  });

  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
      const {
        question,
        sourceIds,
        targetUrl,
        scenarioContext,
        brandContext,
        sessionMemory,
        history,
      } = req.body as {
        question?: string;
        sourceIds?: string[];
        targetUrl?: string;
        scenarioContext?: Record<string, unknown> | null;
        brandContext?: Record<string, unknown> | null;
        sessionMemory?: string;
        history?: Array<{ role: 'user' | 'assistant'; content: string }>;
      };

      if (!question || typeof question !== 'string' || question.trim().length < 2) {
        return res.status(400).json({ error: 'يرجى كتابة سؤال واضح أولاً.' });
      }

      const focusedSources = selectFocusedSources(question, sourceIds);
      const uniqueDomains = Array.from(new Set(focusedSources.map((s) => s.domain)));
      const domainFilterQuery = uniqueDomains.map((d) => `site:${d}`).join(' OR ');

      const cleanTargetUrl =
        typeof targetUrl === 'string' && targetUrl.trim() && isValidHttpUrl(targetUrl.trim())
          ? targetUrl.trim()
          : null;

      const recentHistory = Array.isArray(history)
        ? history
            .slice(-8)
            .map((h) => `${h.role === 'user' ? 'المستخدم' : 'DoDo'}: ${h.content}`)
            .join('\n')
        : '';

      const systemInstruction = `أنت "DoDo" — صديق وشريك شخصي ومستشار استراتيجي خبير في صناعة الملابس والنسيج وبناء البراندات من الصفر للعالمية.
تحدّث مع المستخدم بروح صديق ذكي ومتفهم يشاركه بناء البراند خطوة بخطوة (تحديد الـ Value Propositions للبراند، اقتراح أسماء البراند، مناقشة القطع والديزاينز، اللوجو والهوية البصرية، والتنفيذ الواقعي).

فهمك العميق للـ Value Propositions (القيمة المقترحة للبراند):
- أنت تفهم بعمق إطار Value Proposition Canvas (مهام العميل Jobs، آلامه Pains، مكاسبه Gains، وكيف نربطها بمسكّنات الألم Pain Relievers وصانعات المكسب Gain Creators) وصياغة الـ Positioning Statement.
- ارفض الشعارات الفضفاضة المستهلكة مثل "جودة عالية وسعر مناسب"، وساعد المستخدم يطلع بـ Value Propositions حقيقية ومقنعة ومبنية على ميزة قابلة للإثبات في الملابس (مثل: وزن القماش GSM، ثبات اللون والانكماش، باترون مضبوط لجسم معين، حصرية الدروب Limited Drop، شفافية الخامة OEKO-TEX، تجربة الفتح والضمان، أو معادلة السعر مقابل المستورد).
- عندما يتكلم المستخدم عن بناء أو تحسين الـ Value Propositions لبراند، اتّبع أسلوب الحوار التفاعلي:
  1) اسأله أسئلة ذكية ومحددة (من عميلك المثالي؟ إيه أكتر حاجة بتضايقه في البراندات الموجودة حالياً؟ وإيه الحاجة اللي لو دفع فيها عندك يحس إنه كسبان؟).
  2) اقترح عليه 2–3 صياغات قوية للـ Value Propositions مرتبطة بأرقام المحاكي (تكلفة القطعة وسعر البيع وطريقة التشغيل) والقطع المتفق عليها.
  3) لخّص النتيجة النهائية في صورة واضحة (الجمهور المستهدف + المشكلة + الوعد الفارق + 3 إثباتات عملية + جملة القيمة النهائية) عشان يقدر يحفظها مباشرة في ملف البراند.

لديك معرفة عميقة بمنظومة الملابس الشاملة التي تغطي:
- المعايير والشهادات (The Textile Institute, ITMF, ITC, AATCC, ASTM, ISO, OEKO-TEX, GOTS, Bluesign, ZDHC, Better Work, Textile Exchange, AAFA, CFDA, SEAMS, WIPO).
- الأقمشة والألياف (CottonWorks, FabricLink, Swicofil, Première Vision, Lenzing/TENCEL, REPREVE, INVISTA, SwatchOn).
- الاتجاهات والتصميم والـ CAD (WGSN, BoF, Pantone, CLO 3D, Browzwear, Optitex, Lectra, Gerber AccuMark, Adobe Illustrator).
- الماكينات والطباعة والتطريز والإكسسوارات (Rieter, Mayer & Cie., Shima Seiki, Pegasus, Siruba, Jack, Epson, Kornit, Tajima, YKK, Coats, AMANN, Avery Dennison, Nilörn).
- منظومة مصر والمصانع والبراندات العالمية (ETDA, FEI, GOEIC, EOS, Better Work Egypt, Misr Spinning, Arafa Holding, Cottonil, Lotus Garments، ونماذج Nike, UNIQLO, LVMH، وفلسفات Virgil Abloh, Rick Owens, Rei Kawakubo).

مهمتك:
1. استعن بالبحث الحي (googleSearch) عبر المراجع المساعدة ومنها: (${domainFilterQuery}).
2. فرّق بوضوح بين طرق التشغيل: مكاتب الجملة (بدون خامات)، White-Label / بلانكات جاهزة، ورشة صغيرة، CMT، FOB، وPOD، مع أماكن وأسعار حسب موقع المستخدم.
3. إذا توافر ملخص جلسة مسترجع أو تفاصيل براند حالي (بما فيها الـ Value Proposition الحالية، الاسم، القطع المتفق عليها، الألوان، السكتش)، اعتبره ذاكرتك الحية وتابع مباشرة من حيث انتهيتما دون سؤال المستخدم أن يبدأ من الصفر!
4. ادعم إجابتك بوصف بصري دقيق وأرفق روابط فيديوهات حقيقية من نتائج البحث عند الحاجة، والتزم بالمصطلحات الصناعية (GSM, CMT, FOB, AQL, MOQ, Tech Pack).`;

      const promptParts = [
        sessionMemory ? `ذاكرة الجلسة السابقة المسترجعة بالكود:\n${sessionMemory}` : '',
        brandContext ? `هوية البراند والقطع المتفق عليها حالياً في الاستوديو:\n${JSON.stringify(brandContext, null, 2)}` : '',
        scenarioContext ? `تفاصيل المحاكي الحالية للمستخدم:\n${JSON.stringify(scenarioContext, null, 2)}` : '',
        recentHistory ? `سياق المحادثة السابقة:\n${recentHistory}` : '',
        cleanTargetUrl ? `الرابط المباشر المطلوب شرحه via urlContext:\n${cleanTargetUrl}` : '',
        `رسالة المستخدم:\n${question.trim()}`,
      ]
        .filter(Boolean)
        .join('\n\n');

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: promptParts,
        config: {
          systemInstruction,
          tools: [{ googleSearch: {} }, { urlContext: {} }],
        },
      });

      const text = response.text;
      if (!text) {
        return res.status(502).json({ error: 'لم يرجع النموذج إجابة نصية. حاول إعادة صياغة الرسالة.' });
      }

      return res.json({
        text,
        citations: extractCitations(response),
        searchedDomains: uniqueDomains,
      });
    } catch (err) {
      const formatted = formatGeminiError(err);
      return res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // Multimodal Sketch-to-Logo & Visual Identity Idea Generator (uses gemini-4-hydrogen — no paid key needed)
  app.post('/api/studio/sketch-ideas', async (req: Request, res: Response) => {
    try {
      const {
        sketchPngDataUrl,
        brandName,
        styleDirection,
        agreedGarments,
        userNotes,
        scenarioContext,
      } = req.body as {
        sketchPngDataUrl?: string;
        brandName?: string;
        styleDirection?: string;
        agreedGarments?: string[];
        userNotes?: string;
        scenarioContext?: Record<string, unknown>;
      };

      const ai = getGeminiClient();
      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

      if (typeof sketchPngDataUrl === 'string' && sketchPngDataUrl.includes('base64,')) {
        const [meta, base64] = sketchPngDataUrl.split('base64,');
        const mimeMatch = meta.match(/data:(image\/[a-zA-Z0-9.+-]+);/);
        if (base64 && base64.length > 20) {
          parts.push({
            inlineData: {
              mimeType: mimeMatch?.[1] || 'image/png',
              data: base64,
            },
          });
        }
      }

      parts.push({
        text: `أنت المخرج الإبداعي وصديق المستخدم "DoDo" في استوديو بناء براندات الملابس.
انظر إلى السكتش المرفق (إن وُجد) واقرأ المعطيات التالية لتوليد 3 أفكار متكاملة لاسم البراند واللوجو والهوية البصرية وتطبيقها على قطع الملابس:
- الاسم المبدئي أو المفضل: ${brandName || 'اقترح أسماء قوية'}
- التوجيه الأسلوبي: ${styleDirection || 'streetwear'}
- القطع المتفق عليها: ${Array.isArray(agreedGarments) ? agreedGarments.join(', ') : 'oversize_tee, heavy_hoodie'}
- ملاحظات المستخدم: ${userNotes || 'لا توجد ملاحظات إضافية'}
- سياق المحاكي: ${scenarioContext ? JSON.stringify(scenarioContext) : 'محلي وعالمي'}

مطلوب مخرجات منظمة (JSON) تشرح ماذا رأيت في السكتش التخيلي وكيف تطوره لشعار احترافي قابل للتطريز والطباعة (DTF/Silkscreen)، مع كود لوني (Hex) واقتراحات أماكن وضع اللوجو ونوع الخامة.`,
      });

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sketchObservationAr: {
                type: Type.STRING,
                description: 'ما الذي نلاحظه في السكتش التخيلي المرسوم وكيف نبني عليه.',
              },
              concepts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    titleAr: { type: Type.STRING },
                    brandName: { type: Type.STRING },
                    tagline: { type: Type.STRING },
                    conceptAr: { type: Type.STRING },
                    printSpecAr: { type: Type.STRING },
                    primaryHex: { type: Type.STRING },
                    accentHex: { type: Type.STRING },
                    garmentHex: { type: Type.STRING },
                    recommendedShape: { type: Type.STRING },
                  },
                },
              },
            },
          },
        },
      });

      const rawJson = (response.text || '{}').trim();
      const parsed = JSON.parse(rawJson);
      return res.json(parsed);
    } catch (err) {
      const formatted = formatGeminiError(err);
      return res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // Generate or Extract Brand Value Propositions (uses gemini-4-hydrogen — no paid key needed)
  app.post('/api/studio/value-propositions', async (req: Request, res: Response) => {
    try {
      const {
        mode,
        brand,
        scenarioContext,
        recentMessages,
        userAngle,
      } = req.body as {
        mode?: 'generate' | 'extract_from_chat';
        brand?: Record<string, unknown>;
        scenarioContext?: Record<string, unknown>;
        recentMessages?: Array<{ role: string; content: string }>;
        userAngle?: string;
      };

      const ai = getGeminiClient();
      const historyBlock = Array.isArray(recentMessages) && recentMessages.length > 0
        ? `سياق الحوار الأخير بين المستخدم وDoDo:\n${recentMessages
            .slice(-10)
            .map((m) => `${m.role === 'user' ? 'المستخدم' : 'DoDo'}: ${m.content}`)
            .join('\n')}`
        : '';

      const instruction =
        mode === 'extract_from_chat'
          ? `أنت الخبير الاستراتيجي "DoDo" المتخصص في بناء الـ Value Propositions لبراندات الملابس.
اقرأ الحوار السابق بينك وبين المستخدم بعناية، واستخرج وحسّن منه 3 مقترحات Value Propositions تمثل ما اتفقتما عليه أو ما يتناسب مع طموحه في الحديث، بحيث يكون الخيار الأول هو الأقرب لما ورد في النقاش مباشرة، والخياران التاليان زوايا أقوى أو مكملة.`
          : `أنت الخبير الاستراتيجي "DoDo" المتخصص في بناء الـ Value Propositions لبراندات الملابس.
قم ببناء 3 خيارات Value Propositions مختلفة وقوية (بزاوية التميز بالخامة/التصنيع، وزاوية الهوية والندرة، وزاوية حل مشكلة يومية للعميل) متوافقة تماماً مع أرقام المحاكي (طريقة التشغيل وسعر البيع) وهوية البراند والقطع المتفق عليها. تجنب الجمل الفضفاضة مثل "أعلى جودة وأقل سعر" واجعل كل قيمة قابلة للإثبات العملي في الملابس.`;

      const prompt = `${instruction}

معطيات البراند الحالية:
${JSON.stringify(brand || {}, null, 2)}

معطيات المحاكي والجدوى:
${JSON.stringify(scenarioContext || {}, null, 2)}

${userAngle ? `توجيه إضافي من المستخدم: ${userAngle}\n` : ''}${historyBlock}`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              strategicNoteAr: {
                type: Type.STRING,
                description: 'خلاصة استراتيجية قصيرة توضح كيف اختيرت القيم المقترحة بناءً على كلامنا وأرقام البراند.',
              },
              options: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    titleAr: { type: Type.STRING },
                    angleAr: { type: Type.STRING },
                    targetAudience: { type: Type.STRING },
                    customerPain: { type: Type.STRING },
                    uniquePromise: { type: Type.STRING },
                    proofPillars: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    positioningStatement: { type: Type.STRING },
                  },
                },
              },
            },
          },
        },
      });

      const parsed = JSON.parse((response.text || '{}').trim());
      return res.json(parsed);
    } catch (err) {
      const formatted = formatGeminiError(err);
      return res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // Fast executive summary synthesis for Session Continuity Code (uses gemini-3.1-flash-lite)
  app.post('/api/studio/summarize-session', async (req: Request, res: Response) => {
    try {
      const { brand, scenario, messages } = req.body as {
        brand?: Record<string, unknown>;
        scenario?: Record<string, unknown>;
        messages?: Array<{ role: string; content: string }>;
      };
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: FAST_MODEL_NAME,
        contents: `لخّص هذه الجلسة في 4 جمل عربية عملية ومباشرة (بدون مقدمات) شاملة الـ Value Proposition للبراند، والقطع، وطريقة التشغيل، لكي يتذكر DoDo والمستخدم كل القرارات المتفق عليها عند العودة لاحقاً:
البراند والـ Value Proposition: ${JSON.stringify(brand || {})}
المحاكي: ${JSON.stringify(scenario || {})}
آخر الرسائل: ${JSON.stringify((messages || []).slice(-8))}`,
      });
      return res.json({ summaryAr: (response.text || '').trim() });
    } catch (err) {
      const formatted = formatGeminiError(err);
      return res.status(formatted.status).json({ error: formatted.message });
    }
  });

  app.post('/api/analyze-scenario', async (req: Request, res: Response) => {
    try {
      const { scenario } = req.body as { scenario?: Record<string, unknown> };
      if (!scenario) {
        return res.status(400).json({ error: 'بيانات السيناريو مطلوبة للتحليل.' });
      }

      const ai = getGeminiClient();
      const prompt = `بصفتك مستشار DoDo الخبير في صناعة الملابس، حلّل تفاصيل البداية التالية وقدّم **اقتراحات استراتيجية وتنفيذية قوية جداً** مستنداً إلى منظومة المراجع:

تفاصيل البداية والنتائج الحسابية:
${JSON.stringify(scenario, null, 2)}

المطلوب في التحليل (بالعربية، عملي، ومباشر جداً):
1. تقييم واقعية خطة البداية (رأس المال، طريقة الشغل المختارة: هل تحتاج شراء خامات أم مكاتب جملة/تجهيز جاهز؟ تكلفة القطعة، هامش الربح، والـ MOQ) وأقوى بديل يرفع فرص النجاح.
2. اقتراحات أماكن وأسعار ملموسة حسب موقع المستخدم الحالي.
3. اقتراحات تقنية دقيقة للخامة والوزن (GSM) أو التجهيز (تيكت/تغليف/طباعة/تطريز/CAD 3D).
4. قائمة الإكسسوارات والاختبارات والامتثال المطلوبة وخطة العمل الفورية لأول 30 يوماً.`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      return res.json({
        text: response.text ?? '',
        citations: extractCitations(response),
      });
    } catch (err) {
      const formatted = formatGeminiError(err);
      return res.status(formatted.status).json({ error: formatted.message });
    }
  });

  app.post('/api/compare-scenarios', async (req: Request, res: Response) => {
    try {
      const { scenarios } = req.body as { scenarios?: Array<Record<string, unknown>> };
      if (!Array.isArray(scenarios) || scenarios.length < 2) {
        return res.status(400).json({ error: 'يجب اختيار سيناريوهين على الأقل لإجراء المقارنة الذكية.' });
      }

      const ai = getGeminiClient();
      const prompt = `بصفتك مستشار DoDo في صناعة الملابس، قارن بين سيناريوهات الانطلاق التالية مستنداً إلى مراجع الصناعة العالمية والمصرية:

السيناريوهات:
${JSON.stringify(scenarios.slice(0, 4), null, 2)}

قدّم حكماً مقارناً حاسماً يشمل:
1. أي فكرة هي الأقوى للبدء الآن بأعلى عائد وأقل مخاطرة على رأس المال؟ ولماذا؟
2. مقارنة سلاسل التوريد والخامات والـ MOQ والتجهيز الفني بين الأفكار.
3. التوصية التنفيذية للانتقال من المرحلة الأولى إلى العالمية انطلاقاً من الخيار الفائز.`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      return res.json({
        text: response.text ?? '',
        citations: extractCitations(response),
      });
    } catch (err) {
      const formatted = formatGeminiError(err);
      return res.status(formatted.status).json({ error: formatted.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = http.createServer(app);

  // Real-Time Live Voice WebSocket Bridge (/live -> gemini-3.8-live)
  const wss = new WebSocketServer({ server, path: '/live' });
  wss.on('connection', async (clientWs: WebSocket) => {
    let liveSession: Awaited<ReturnType<GoogleGenAI['live']['connect']>> | null = null;
    try {
      const ai = getGeminiClient();
      liveSession = await ai.live.connect({
        model: LIVE_MODEL_NAME,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction:
            'أنت DoDo، صديق وشريك خبير في صناعة الملابس وبناء البراندات والـ Value Propositions (القيمة المقترحة). تحدث مع المستخدم بالعربية الدافئة العملية لمساعدته يكتشف ويصيغ الـ Value Propositions لبراند الملابس الخاص به (الجمهور، المشكلة، الوعد الفارق، وإثبات الخامة GSM والتقفيل)، بجانب اسم البراند، القطع، مكاتب الجملة vs التصنيع، وتصميم الشعار.',
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const content = message.serverContent;
            if (content?.inputTranscription?.text) {
              clientWs.send(
                JSON.stringify({ inputTranscript: content.inputTranscription.text })
              );
            }
            if (content?.outputTranscription?.text) {
              clientWs.send(
                JSON.stringify({ outputTranscript: content.outputTranscription.text })
              );
            }
            for (const part of content?.modelTurn?.parts ?? []) {
              if (part.inlineData?.data) {
                clientWs.send(JSON.stringify({ audio: part.inlineData.data }));
              }
            }
            if (content?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
          },
          onerror: (err: unknown) => {
            const msg = err instanceof Error ? err.message : String(err);
            clientWs.send(JSON.stringify({ error: `خطأ في الجلسة الصوتية: ${msg}` }));
          },
        },
      });
      clientWs.send(JSON.stringify({ ready: true }));
    } catch (err) {
      const formatted = formatGeminiError(err);
      clientWs.send(JSON.stringify({ error: formatted.message }));
      clientWs.close();
      return;
    }

    clientWs.on('message', (raw) => {
      try {
        const parsed = JSON.parse(raw.toString()) as { audio?: string; text?: string };
        if (parsed.audio && liveSession) {
          liveSession.sendRealtimeInput({
            audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' },
          });
        } else if (parsed.text && liveSession) {
          liveSession.sendRealtimeInput({ text: parsed.text });
        }
      } catch {
        // Ignore malformed client audio packets
      }
    });

    clientWs.on('close', () => {
      try {
        liveSession?.close();
      } catch {
        // Ignore close cleanup errors
      }
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`DoDo Apparel Studio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
