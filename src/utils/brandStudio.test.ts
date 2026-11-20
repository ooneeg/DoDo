import test from 'node:test';
import assert from 'node:assert/strict';
import {
  VALUE_PROPOSITION_ARCHETYPES,
  analyzeSketchGeometry,
  buildBrandSvgMarkup,
  composeValuePropositionStatement,
  generateSketchInspiredConcepts,
  getValuePropositionReadiness,
} from './brandStudio';
import { DEFAULT_BRAND_STATE } from './sessionContinuity';

test('analyzes empty vs minimal vs detailed sketches cleanly', () => {
  const empty = analyzeSketchGeometry([]);
  assert.equal(empty.strokeCount, 0);

  const minimal = analyzeSketchGeometry(['M 10 10 L 100 100', 'M 100 10 L 10 100']);
  assert.equal(minimal.strokeCount, 2);
  assert.match(minimal.complexityLabelAr, /مينيمال/);
});

test('generates 4 sketch-inspired logo and garment concepts', () => {
  const ideas = generateSketchInspiredConcepts({
    ...DEFAULT_BRAND_STATE,
    brandName: 'WATAN',
    sketchPathsSvg: ['M 30 30 L 90 30 L 60 90 Z'],
  });
  assert.equal(ideas.length, 4);
  assert.equal(ideas[0].recommendedShape, 'sketch');
  assert.match(ideas[0].suggestedBrandName, /WATAN/);
});

test('builds valid standalone SVG markup preserving user sketch paths safely', () => {
  const svg = buildBrandSvgMarkup({
    ...DEFAULT_BRAND_STATE,
    brandName: 'A&B <Studio>',
    logoShape: 'sketch',
    sketchPathsSvg: ['M 20 20 L 80 80'],
  });
  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.includes('A&amp;B &lt;Studio&gt;'));
  assert.ok(svg.includes('M 20 20 L 80 80'));
});

test('composes Value Proposition statement and evaluates readiness checks', () => {
  const vp = VALUE_PROPOSITION_ARCHETYPES[0].build('NOOR');
  assert.match(vp.positioningStatement, /NOOR/);
  assert.equal(vp.proofPillars.length, 3);

  const composed = composeValuePropositionStatement(
    {
      targetAudience: 'المهندسين والمصممين',
      customerPain: 'القمصان الرسمية بتكرمش بسرعة',
      uniquePromise: 'تيشيرت بولو قطن مصري مريح وشيك',
    },
    'NOOR'
  );
  assert.match(composed, /NOOR/);
  assert.match(composed, /المهندسين والمصممين/);

  const ready = getValuePropositionReadiness(vp);
  assert.equal(ready.completedCount, 4);
  assert.equal(ready.totalCount, 4);

  const incomplete = getValuePropositionReadiness({
    targetAudience: 'شباب',
    customerPain: '',
    uniquePromise: '',
    proofPillars: [],
    positioningStatement: '',
  });
  assert.equal(incomplete.completedCount, 0);
});
