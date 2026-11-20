import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_BRAND_STATE,
  buildHumanSummaryAr,
  decodeContinuityCode,
  encodeContinuityCode,
  type SessionContinuitySnapshot,
} from './sessionContinuity';

test('encodes and decodes full session snapshot including Arabic text and hand-drawn sketch paths', () => {
  const sample: SessionContinuitySnapshot = {
    v: 1,
    savedAt: '2026-11-20T12:00:00.000Z',
    scenario: {
      name: 'براند شتوي قطن مصري',
      capital: 180000,
      currency: 'EGP',
      mfgModel: 'white_label',
      location: 'cairo_giza',
    },
    brand: {
      ...DEFAULT_BRAND_STATE,
      brandName: 'نَسْج / NASG',
      tagline: 'هوية مصرية معاصرة',
      agreedGarments: ['heavy_hoodie', 'oversize_tee'],
      sketchPathsSvg: ['M 40 40 L 120 40 L 80 120 Z', 'M 50 90 Q 80 60 110 90'],
      designNotes: 'ميلتون 380 GSM مع تطريز بارز على الصدر وتيكت قماش',
      valueProposition: {
        targetAudience: 'شباب الجامعات والمبدعين في القاهرة',
        customerPain: 'صعوبة إيجاد هودي ثقيل بتطريز متقن وسعر محلي',
        uniquePromise: 'هودي قطن مصري 380 GSM بهوية خط عربي معاصرة',
        proofPillars: ['خامة لا تنكمش', 'تطريز شينيل أصلي'],
        positioningStatement: 'للمبدعين في القاهرة، يقدم براند نَسْج هودي قطن ثقيل بهوية عربية معاصرة.',
      },
    },
    conversationSummary: 'اتفقنا على البدء بـ 2 موديل بنظام White-Label في جسر السويس قبل التوسع للعبور.',
    recentMessages: [
      { role: 'user', content: 'عايز نعمل هودي تقيل بس من غير ما أشتري قماش دلوقتي' },
      { role: 'assistant', content: 'أفضل بداية لك هي البلانكات الجاهزة 380 GSM وتجهيز اللوجو بالتطريز.' },
    ],
  };

  const code = encodeContinuityCode(sample);
  assert.ok(code.startsWith('DODO1-'));

  const decoded = decodeContinuityCode(code);
  assert.equal(decoded.ok, true);
  if (decoded.ok) {
    assert.equal(decoded.snapshot.brand.brandName, 'نَسْج / NASG');
    assert.equal(decoded.snapshot.brand.sketchPathsSvg.length, 2);
    assert.equal(decoded.snapshot.scenario.mfgModel, 'white_label');
    assert.equal(decoded.snapshot.scenario.capital, 180000);
    assert.equal(decoded.snapshot.recentMessages.length, 2);
    assert.match(decoded.snapshot.brand.valueProposition.uniquePromise, /380 GSM/);
  }
});

test('supports restoring directly from raw JSON export payload as well', () => {
  const sample: SessionContinuitySnapshot = {
    v: 1,
    savedAt: '2026-11-20T12:00:00.000Z',
    scenario: { capital: 5000, currency: 'USD', mfgModel: 'cmt' },
    brand: DEFAULT_BRAND_STATE,
    conversationSummary: 'جلسة تصنيع CMT',
    recentMessages: [],
  };

  const decoded = decodeContinuityCode(JSON.stringify(sample));
  assert.equal(decoded.ok, true);
  if (decoded.ok) {
    assert.equal(decoded.snapshot.scenario.mfgModel, 'cmt');
    assert.ok(decoded.snapshot.brand.valueProposition.positioningStatement.length > 0);
  }
});

test('rejects corrupted or empty session continuity codes cleanly', () => {
  const emptyRes = decodeContinuityCode('   ');
  assert.equal(emptyRes.ok, false);

  const invalidRes = decodeContinuityCode('DODO1-not_valid_base64!!!');
  assert.equal(invalidRes.ok, false);
});

test('builds readable Arabic summary for resumed sessions including Value Proposition', () => {
  const summary = buildHumanSummaryAr({
    v: 1,
    savedAt: '2026-11-20T12:00:00.000Z',
    scenario: { capital: 120000, currency: 'EGP', mfgModel: 'wholesale_office' },
    brand: DEFAULT_BRAND_STATE,
    conversationSummary: 'تجربة سريعة في العتبة',
    recentMessages: [],
  });

  assert.match(summary, /KHEIT/);
  assert.match(summary, /wholesale_office/);
  assert.match(summary, /تيشيرت أوفرسايز/);
  assert.match(summary, /Value Proposition/);
});
