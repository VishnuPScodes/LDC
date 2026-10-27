import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDistrictCurve, estimateRankRange, fitBand, monotonicAnchors, rankAtScore, type HistoryCycle } from './rank-estimate/curve.js';

const history: HistoryCycle[] = [
  { district: 'Thrissur', examYear: 2023, notificationNo: 'TEST ONLY', applicants: 20000, attendees: 10000, mainListSize: 1000, mainListCutoff: 70, supplementaryListSize: 500, supplementaryListCutoff: 60, shortListSize: 3000, shortListCutoff: 55, topScore: 95 },
  { district: 'Thrissur', examYear: 2021, notificationNo: 'TEST ONLY', applicants: 18000, attendees: 9000, mainListSize: 900, mainListCutoff: 68, supplementaryListSize: 400, supplementaryListCutoff: 58, shortListSize: 2500, shortListCutoff: 53, topScore: 93 },
];

test('curve combines recent cycles, scales percentiles to current attendance, and widens by cutoff movement', () => {
  const curve = buildDistrictCurve('Thrissur', history, { applicants: 24000, expectedAttendanceRatio: .5 })!;
  assert.deepEqual(curve.years, [2023, 2021]);
  assert.equal(curve.expectedAttendees, 12000);
  assert.equal(curve.scoreUncertainty, 1);
  assert.equal(curve.mainCutoffRange[0], 68);
  assert.equal(curve.mainCutoffRange[1], 70);
});

test('curve interpolation is monotonic and does not extrapolate beyond the end anchors', () => {
  const curve = buildDistrictCurve('Thrissur', history.slice(0, 1), { applicants: 20000, expectedAttendanceRatio: .5 })!;
  const scores = [0, 50, 55, 58, 60, 65, 70, 80, 95, 100];
  const ranks = scores.map(score => rankAtScore(score, curve).rank);
  for (let index = 1; index < ranks.length; index++) assert.ok(ranks[index] <= ranks[index - 1]);
  assert.equal(ranks[0], 10000);
  assert.ok(Math.abs((ranks.at(-1) || 0) - 1) < 1e-9);
  assert.equal(rankAtScore(110, curve).rank, rankAtScore(95, curve).rank);
  assert.equal(rankAtScore(110, curve).edgeLabel, 'Top range');
  assert.equal(rankAtScore(-10, curve).edgeLabel, 'Below past list ranges');
});

test('minimum main-list data gives a flat one-anchor curve, while a district without it has no curve', () => {
  const minimal = [{ district: 'Thrissur', examYear: 2023, notificationNo: 'TEST ONLY', mainListSize: 500, mainListCutoff: 65 }];
  const curve = buildDistrictCurve('Thrissur', minimal, null)!;
  assert.ok(Math.abs(rankAtScore(65, curve).rank - 500) < 1e-9);
  assert.ok(Math.abs(rankAtScore(80, curve).rank - 500) < 1e-9);
  assert.equal(buildDistrictCurve('Thrissur', [], null), null);
  assert.equal(buildDistrictCurve('Kollam', minimal, null), null);
});

test('anchor cleanup merges duplicate scores and enforces decreasing ranks as scores rise', () => {
  assert.deepEqual(monotonicAnchors([{ score: 50, rank: 400 }, { score: 50, rank: 100 }, { score: 60, rank: 300 }]), [
    { score: 50, rank: 200 }, { score: 60, rank: 200 },
  ]);
});

test('rank range rounds to readable bands and fit classification follows cutoff thresholds', () => {
  const curve = buildDistrictCurve('Thrissur', history, { applicants: 20000, expectedAttendanceRatio: .5 })!;
  const range = estimateRankRange(68, 72, curve);
  assert.equal(range.lowRank! % 50, 0);
  assert.equal(range.highRank! % 50, 0);
  assert.ok(range.highRank! > range.lowRank!);
  assert.equal(fitBand(80, curve), 'Strong position');
  assert.equal(fitBand(69, curve), 'In range');
  assert.equal(fitBand(66, curve), 'Getting close');
  assert.equal(fitBand(40, curve), 'Building up');
});

test('range endpoints reverse score order and edge labels avoid exact-rank extrapolation', () => {
  const withoutAttendees = history.slice(0, 1).map(({ attendees, applicants, ...row }) => row);
  const curve = buildDistrictCurve('Thrissur', withoutAttendees, null)!;
  const top = estimateRankRange(97, 99, curve);
  const bottom = estimateRankRange(1, 2, curve);
  assert.equal(top.label, 'Top range');
  assert.equal(bottom.label, 'Below past list ranges');
});
