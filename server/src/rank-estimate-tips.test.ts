import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDistrictCurve } from './rank-estimate/curve.js';
import { calculateImprovementTips } from './rank-estimate/tips.js';
import { rankEstimateConfig } from './rank-estimate/config.js';

const curve = buildDistrictCurve('Thrissur', [{ district: 'Thrissur', examYear: 2023, notificationNo: 'TEST ONLY', mainListSize: 1000, mainListCutoff: 70, supplementaryListSize: 500, supplementaryListCutoff: 60, attendees: 10000, applicants: 20000, topScore: 95 }], { applicants: 20000, expectedAttendanceRatio: .5 });
const section = (sectionKey: any, accuracy: number, attempted: number, marksLost = 0) => ({ sectionKey, title: sectionKey, marksScored: 0, possibleMarks: attempted, accuracy, attempted, marksLost });

test('accuracy target adds configured percentage points, caps at target, and converts to net marks', () => {
  const sectionScores = [section('generalEnglish', 50, 10)];
  const tip = calculateImprovementTips(sectionScores, 60, null)[0];
  assert.equal(tip.currentAccuracy, 50);
  assert.equal(tip.targetAccuracy, 50 + rankEstimateConfig.improvement.targetAccuracyIncrease);
  assert.ok(Math.abs(tip.marksGain - rankEstimateConfig.improvement.targetAccuracyIncrease / 100 * 10 * (1 - rankEstimateConfig.marking.wrong)) < 1e-12);
  const high = calculateImprovementTips([section('generalEnglish', 89, 10)], 60, null)[0];
  assert.equal(high.targetAccuracy, rankEstimateConfig.improvement.maximumTargetAccuracy);
});

test('largest mark or rank gains are prioritized and returned within the configured tip limit', () => {
  const tips = calculateImprovementTips([
    section('history', 50, 5), section('generalEnglish', 40, 10), section('currentAffairs', 30, 20),
  ], 62, curve);
  assert.equal(tips.length, rankEstimateConfig.improvement.tipLimit);
  assert.ok(tips[0].marksGain >= tips[1].marksGain);
  assert.ok(tips.every(tip => tip.rankGain === null || tip.rankGain >= 0));
});

test('negative-marking advice appears only above the lost-marks threshold and estimates half turned to skips', () => {
  const threshold = rankEstimateConfig.improvement.wrongMarksLostThreshold;
  assert.equal(calculateImprovementTips([section('history', 50, 10, threshold)], 60, null).some(tip => tip.kind === 'negative-marking'), false);
  const tips = calculateImprovementTips([section('history', 50, 10, threshold + 1)], 60, curve);
  const tip = tips.find(row => row.kind === 'negative-marking')!;
  assert.equal(tip.marksGain, (threshold + 1) * rankEstimateConfig.improvement.wrongToSkipShare);
  assert.ok(tip.rankGain !== null);
});

test('small Current Affairs samples produce a gentle practice suggestion', () => {
  const few = rankEstimateConfig.improvement.fewCurrentAffairsAttempts - 1;
  const tips = calculateImprovementTips([section('currentAffairs', 50, few)], 60, null);
  assert.ok(tips.some(tip => tip.kind === 'current-affairs-sample' && tip.attempted === few));
});

test('no curve keeps rank gains unavailable while still giving mark-focused tips', () => {
  const tips = calculateImprovementTips([section('generalEnglish', 40, 10)], 50, null);
  assert.ok(tips[0].marksGain > 0);
  assert.equal(tips[0].rankGain, null);
});
