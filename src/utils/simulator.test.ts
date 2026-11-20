import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSimulation,
  buildComparisonSummary,
  DEFAULT_SCENARIO_INPUT,
  type ScenarioInput,
} from './simulator';

test('converts EGP capital to USD accurately and splits budget to 100%', () => {
  const result = calculateSimulation({
    ...DEFAULT_SCENARIO_INPUT,
    capital: 500000,
    currency: 'EGP',
    fxRate: 50,
  });

  assert.equal(result.capitalUsd, 10000);
  const totalPct = result.budgetAllocations.reduce((acc, item) => acc + item.percentage, 0);
  assert.ok(Math.abs(totalPct - 100) < 0.01, `Expected 100%, got ${totalPct}`);
});

test('detects insufficient capital for high-MOQ FOB model with many SKUs', () => {
  const tightInput: ScenarioInput = {
    ...DEFAULT_SCENARIO_INPUT,
    capital: 2500,
    currency: 'USD',
    fxRate: 50,
    mfgModel: 'fob', // 500 MOQ per SKU
    skuCount: 5, // 2500 units minimum required
  };

  const result = calculateSimulation(tightInput);
  assert.equal(result.minRequiredUnits, 2500);
  assert.equal(result.capitalSufficient, false);
  assert.ok(result.recommendedActionAr.includes('الحد الأدنى المطلوب'));
});

test('POD model remains capital sufficient with low SKU count and requires zero raw fabric', () => {
  const podInput: ScenarioInput = {
    ...DEFAULT_SCENARIO_INPUT,
    capital: 1200,
    currency: 'USD',
    fxRate: 50,
    mfgModel: 'pod',
    skuCount: 3,
  };

  const result = calculateSimulation(podInput);
  assert.equal(result.requiresRawFabric, false);
  assert.equal(result.unitFabricCostUsd, 0);
  assert.equal(result.capitalSufficient, true);
  assert.ok(result.possibleUnits >= 3);
});

test('wholesale_office and white_label skip raw fabric purchase and offer fast lead time', () => {
  const wholesale = calculateSimulation({
    ...DEFAULT_SCENARIO_INPUT,
    capital: 100000,
    currency: 'EGP',
    mfgModel: 'wholesale_office',
    skuCount: 4,
  });

  const whiteLabel = calculateSimulation({
    ...DEFAULT_SCENARIO_INPUT,
    capital: 150000,
    currency: 'EGP',
    mfgModel: 'white_label',
    skuCount: 3,
  });

  assert.equal(wholesale.requiresRawFabric, false);
  assert.equal(wholesale.unitFabricCostUsd, 0);
  assert.equal(wholesale.leadTimeWeeks, '1 - 5 أيام');
  assert.equal(wholesale.capitalSufficient, true);

  assert.equal(whiteLabel.requiresRawFabric, false);
  assert.equal(whiteLabel.unitFabricCostUsd, 0);
  assert.ok(whiteLabel.unitTrimsPackagingUsd > wholesale.unitTrimsPackagingUsd);
});

test('heavier GSM increases unit fabric cost compared to lighter GSM for factory manufacturing', () => {
  const light = calculateSimulation({ ...DEFAULT_SCENARIO_INPUT, gsm: 160, mfgModel: 'cmt' });
  const heavy = calculateSimulation({ ...DEFAULT_SCENARIO_INPUT, gsm: 380, mfgModel: 'cmt' });

  assert.ok(heavy.unitFabricCostUsd > light.unitFabricCostUsd);
  assert.ok(heavy.unitCostUsd > light.unitCostUsd);
});

test('pathwayOptions evaluates all 6 operating pathways for the same capital', () => {
  const result = calculateSimulation({
    ...DEFAULT_SCENARIO_INPUT,
    capital: 150000,
    currency: 'EGP',
    skuCount: 4,
  });

  assert.equal(result.pathwayOptions.length, 6);
  const wholesaleOpt = result.pathwayOptions.find((p) => p.model === 'wholesale_office');
  const fobOpt = result.pathwayOptions.find((p) => p.model === 'fob');

  assert.ok(wholesaleOpt);
  assert.ok(fobOpt);
  assert.equal(wholesaleOpt.requiresRawFabric, false);
  assert.equal(fobOpt.requiresRawFabric, true);
  assert.equal(wholesaleOpt.capitalSufficient, true);
  assert.equal(fobOpt.capitalSufficient, false);
});

test('location changes localGuide hubs and price benchmarks to match where the user is', () => {
  const cairoSim = calculateSimulation({
    ...DEFAULT_SCENARIO_INPUT,
    location: 'cairo_giza',
  });
  const mahallaSim = calculateSimulation({
    ...DEFAULT_SCENARIO_INPUT,
    location: 'delta_mahalla',
  });
  const gulfSim = calculateSimulation({
    ...DEFAULT_SCENARIO_INPUT,
    location: 'gulf_ksa_uae',
    currency: 'USD',
  });

  assert.ok(cairoSim.localGuide.spots.some((s) => s.zoneNameAr.includes('الموسكي')));
  assert.ok(mahallaSim.localGuide.spots.some((s) => s.zoneNameAr.includes('المحلة')));
  assert.ok(gulfSim.localGuide.spots.some((s) => s.zoneNameAr.includes('دبي')));
  assert.ok(gulfSim.localGuide.priceBenchmarksAr.wholesaleReadyPieceAr.includes('$'));
  assert.ok(cairoSim.localGuide.priceBenchmarksAr.wholesaleReadyPieceAr.includes('ج.م'));
});

test('global export market triggers higher markup and cites AAFA, ITC, and Textile Exchange', () => {
  const globalSim = calculateSimulation({
    ...DEFAULT_SCENARIO_INPUT,
    capital: 25000,
    currency: 'USD',
    market: 'global',
  });
  const localSim = calculateSimulation({
    ...DEFAULT_SCENARIO_INPUT,
    capital: 25000,
    currency: 'USD',
    market: 'egypt',
  });

  assert.ok(globalSim.grossMarginPct > localSim.grossMarginPct);
  const allRoadmapSources = globalSim.roadmap.flatMap((p) => p.recommendedSources);
  assert.ok(allRoadmapSources.includes('AAFA'));
  assert.ok(allRoadmapSources.includes('Textile Exchange'));
  assert.ok(allRoadmapSources.includes('ITC'));
});

test('generates 4 concrete strategic suggestions referencing relevant tools and local bodies', () => {
  const localSim = calculateSimulation({
    ...DEFAULT_SCENARIO_INPUT,
    capital: 200000,
    currency: 'EGP',
    market: 'egypt',
  });
  assert.equal(localSim.strategicSuggestionsAr.length, 4);
  const combinedRefs = localSim.strategicSuggestionsAr.flatMap((s) => s.references);
  assert.ok(combinedRefs.includes('CLO 3D'));
  assert.ok(combinedRefs.includes('GOEIC'));
});

test('buildComparisonSummary identifies cheapest unit cost and highest margin scenarios', () => {
  const lowCost = calculateSimulation({
    ...DEFAULT_SCENARIO_INPUT,
    id: 'cheap',
    fabric: 'cotton_blend',
    gsm: 160,
    market: 'egypt',
  });
  const highMargin = calculateSimulation({
    ...DEFAULT_SCENARIO_INPUT,
    id: 'global',
    capital: 20000,
    currency: 'USD',
    fabric: 'egyptian_cotton',
    market: 'global',
  });

  const summary = buildComparisonSummary([lowCost, highMargin]);
  assert.ok(summary !== null);
  assert.equal(summary.cheapestUnitCostId, 'cheap');
  assert.equal(summary.highestMarginId, 'global');
});

test('customUnitCost and customSellingPrice accurately recalculate unit profit, markup, and margins', () => {
  const custom = calculateSimulation({
    ...DEFAULT_SCENARIO_INPUT,
    capital: 200000,
    currency: 'EGP',
    fxRate: 50,
    mfgModel: 'wholesale_office',
    customUnitCost: 250, // $5
    customSellingPrice: 500, // $10
  });

  assert.equal(custom.isCustomUnitCost, true);
  assert.equal(custom.isCustomSellingPrice, true);
  assert.equal(custom.unitCostUsd, 5);
  assert.equal(custom.suggestedRetailUsd, 10);
  assert.equal(custom.grossProfitPerUnitUsd, 5);
  assert.equal(Math.round(custom.grossMarginPct), 50);
  assert.equal(Math.round(custom.markupPct), 100);
  assert.equal(custom.breakEvenReachable, true);
  assert.ok(custom.netProfitPerUnitUsd < custom.grossProfitPerUnitUsd);
});

test('selling below unit cost marks breakEvenReachable false without throwing', () => {
  const lossSim = calculateSimulation({
    ...DEFAULT_SCENARIO_INPUT,
    capital: 150000,
    currency: 'EGP',
    fxRate: 50,
    customUnitCost: 400,
    customSellingPrice: 300,
  });

  assert.equal(lossSim.breakEvenReachable, false);
  assert.equal(lossSim.breakEvenUnits, 0);
  assert.ok(lossSim.grossProfitPerUnitUsd < 0);
  assert.ok(lossSim.grossMarginPct < 0);
});

test('upfrontCommitmentUsd is lowest for POD and higher for direct manufacturing while CMT yields better gross margin than wholesale', () => {
  const sim = calculateSimulation({
    ...DEFAULT_SCENARIO_INPUT,
    capital: 250000,
    currency: 'EGP',
    fxRate: 50,
    skuCount: 3,
  });

  const pod = sim.pathwayOptions.find((p) => p.model === 'pod')!;
  const wholesale = sim.pathwayOptions.find((p) => p.model === 'wholesale_office')!;
  const cmt = sim.pathwayOptions.find((p) => p.model === 'cmt')!;

  assert.ok(pod.upfrontCommitmentUsd < wholesale.upfrontCommitmentUsd);
  assert.ok(wholesale.upfrontCommitmentUsd < cmt.upfrontCommitmentUsd);
  assert.ok(cmt.grossMarginPct > wholesale.grossMarginPct);
  assert.ok(sim.upfrontCommitmentUsd > 0);
  assert.ok(sim.financialCommitmentSummaryAr.length > 5);
});
