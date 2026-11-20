import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSimulation, DEFAULT_SCENARIO_INPUT } from './simulator';
import {
  calculateTimelineProjection,
  DEFAULT_DIAGNOSTIC_ANSWERS,
  searchApparelConcepts,
  type DiagnosticAnswers,
} from './timeline';

test('wholesale_office begins selling in 1 week while FOB has production lead-time delay', () => {
  const wholesaleSim = calculateSimulation({
    ...DEFAULT_SCENARIO_INPUT,
    capital: 150000,
    currency: 'EGP',
    mfgModel: 'wholesale_office',
    skuCount: 3,
  });
  const fobSim = calculateSimulation({
    ...DEFAULT_SCENARIO_INPUT,
    capital: 2500000,
    currency: 'EGP',
    mfgModel: 'fob',
    skuCount: 3,
  });

  const wholesale1w = calculateTimelineProjection(
    wholesaleSim,
    DEFAULT_DIAGNOSTIC_ANSWERS,
    '1w'
  );
  const fob1w = calculateTimelineProjection(fobSim, DEFAULT_DIAGNOSTIC_ANSWERS, '1w');

  assert.ok(wholesale1w.activeSnapshot.unitsSold > 0);
  assert.equal(fob1w.activeSnapshot.unitsSold, 0);
  assert.equal(wholesale1w.allHorizons.length, 5);
});

test('full reinvestment produces larger 1-year volume and revenue than withdrawing half', () => {
  const sim = calculateSimulation({
    ...DEFAULT_SCENARIO_INPUT,
    capital: 200000,
    currency: 'EGP',
    mfgModel: 'white_label',
  });

  const fullReinvest = calculateTimelineProjection(
    sim,
    { ...DEFAULT_DIAGNOSTIC_ANSWERS, reinvestPolicy: 'full_reinvest' },
    '1y'
  );
  const withdrawHalf = calculateTimelineProjection(
    sim,
    { ...DEFAULT_DIAGNOSTIC_ANSWERS, reinvestPolicy: 'withdraw_half' },
    '1y'
  );

  assert.ok(
    fullReinvest.activeSnapshot.cumulativeRevenueUsd >
      withdrawHalf.activeSnapshot.cumulativeRevenueUsd
  );
  assert.ok(
    fullReinvest.activeSnapshot.unitsSold >= withdrawHalf.activeSnapshot.unitsSold
  );
});

test('prepaid policy lowers return units and cash-in-transit compared to COD in 1-month view', () => {
  const sim = calculateSimulation({
    ...DEFAULT_SCENARIO_INPUT,
    capital: 180000,
    currency: 'EGP',
    mfgModel: 'wholesale_office',
  });

  const cod1m = calculateTimelineProjection(
    sim,
    { ...DEFAULT_DIAGNOSTIC_ANSWERS, paymentPolicy: 'cod' },
    '1m'
  );
  const prepaid1m = calculateTimelineProjection(
    sim,
    { ...DEFAULT_DIAGNOSTIC_ANSWERS, paymentPolicy: 'prepaid' },
    '1m'
  );

  assert.ok(
    prepaid1m.activeSnapshot.estimatedReturnsUnits <
      cod1m.activeSnapshot.estimatedReturnsUnits
  );
  assert.ok(
    prepaid1m.activeSnapshot.cashInTransitUsd < cod1m.activeSnapshot.cashInTransitUsd
  );
});

test('undecided answers generate explicit must-do unsettled alerts', () => {
  const sim = calculateSimulation(DEFAULT_SCENARIO_INPUT);
  const undecidedAnswers: DiagnosticAnswers = {
    paymentPolicy: 'undecided',
    marketingPace: 'undecided',
    reinvestPolicy: 'full_reinvest',
    techReadiness: 'undecided',
    opsCapacity: 'solo_fulltime',
  };

  const projection = calculateTimelineProjection(sim, undecidedAnswers, '3m');
  assert.equal(projection.unsettledAlertsAr.length, 3);
  assert.ok(projection.unsettledAlertsAr[0].mustDoAr.length > 10);
});

test('searchApparelConcepts matches Arabic and English industry terms', () => {
  const codMatches = searchApparelConcepts('COD');
  const moqMatches = searchApparelConcepts('MOQ');
  const gsmMatches = searchApparelConcepts('وزن القماش');

  assert.ok(codMatches.length >= 1);
  assert.ok(moqMatches.length >= 1);
  assert.ok(gsmMatches.some((m) => m.id === 'gsm'));
});

import {
  extractVideoLinks,
  selectVisualGuidesForText,
  shouldRecommendVideoLinks,
} from './visualGuidesLogic';

test('below-cost scenario keeps timeline calculation stable and never claims break-even', () => {
  const lossSim = calculateSimulation({
    ...DEFAULT_SCENARIO_INPUT,
    capital: 150000,
    currency: 'EGP',
    fxRate: 50,
    mfgModel: 'wholesale_office',
    customUnitCost: 400,
    customSellingPrice: 300,
  });

  const proj = calculateTimelineProjection(lossSim, DEFAULT_DIAGNOSTIC_ANSWERS, '3m');
  assert.equal(proj.activeSnapshot.reachedBreakEven, false);
  assert.ok(proj.estimatedBreakEvenLabelAr.includes('أقل من التكلفة'));
  assert.ok(Number.isFinite(proj.activeSnapshot.cumulativeNetCashUsd));
});

test('selectVisualGuidesForText and video helpers match topic and extract real video URLs', () => {
  const fabricGuides = selectVisualGuidesForText('ما الفرق بين 160 و 380 GSM في القطن؟');
  const cadGuides = selectVisualGuidesForText('كيف أجهز ملف Tech Pack في CLO 3D؟');

  assert.equal(fabricGuides[0].id, 'fabric_gsm');
  assert.equal(cadGuides[0].id, 'tech_pack_cad');

  const videos = extractVideoLinks([
    { title: 'CottonWorks Guide', uri: 'https://www.cottonworks.com/en/resources/' },
    { title: 'CLO 3D Tech Pack Demo', uri: 'https://www.youtube.com/watch?v=abc123' },
  ]);
  assert.equal(videos.length, 1);
  assert.equal(shouldRecommendVideoLinks('اشرح لي عملياً بالماكينة إزاي أضبط الغرزة', []), true);
});
