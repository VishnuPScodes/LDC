import test from 'node:test';
import assert from 'node:assert/strict';
import { adjustMockScore, estimateScore, questionDifficulty } from './rank-estimate/score.js';
import { rankEstimateConfig } from './rank-estimate/config.js';

const now = new Date('2026-10-27T00:00:00.000Z');
const mock = (id: string, daysAgo: number, rawScore: number, patch: Record<string, unknown> = {}) => ({
  id, completedAt: new Date(now.getTime() - daysAgo * 86400000), rawScore,
  difficulty: rankEstimateConfig.difficulty.referenceDifficulty, repeatShare: 0, counted: true, ...patch,
});

test('question difficulty uses first-attempt wrong share, then topic and neutral fallbacks', () => {
  const minimum = rankEstimateConfig.difficulty.minimumFirstAttempts;
  assert.equal(questionDifficulty(minimum, 12, .9), 12 / minimum);
  assert.equal(questionDifficulty(minimum - 1, 2, .4), .4);
  assert.equal(questionDifficulty(0, 0), rankEstimateConfig.difficulty.neutralDefault);
  assert.equal(questionDifficulty(minimum * 2, minimum * 3), 1);
});

test('difficulty adjustment is transparent, bounded, and zero at reference difficulty', () => {
  const k = rankEstimateConfig.difficulty.adjustmentK;
  const reference = rankEstimateConfig.difficulty.referenceDifficulty;
  assert.equal(adjustMockScore(60, reference), 60);
  assert.equal(adjustMockScore(60, reference + .25), 60 + k * .25);
  assert.equal(adjustMockScore(99, 1), 100);
  assert.equal(adjustMockScore(1, 0), 0);
});

test('recent mock average applies a 14-day half-life and ignores expired or uncounted mocks', () => {
  const estimate = estimateScore([
    mock('new', 0, 80), mock('old', rankEstimateConfig.averaging.recencyHalfLifeDays, 100),
    mock('expired', rankEstimateConfig.averaging.windowDays + 1, 100), mock('quit', 0, 100, { counted: false }),
  ], now)!;
  assert.equal(estimate.mockCount, 2);
  assert.equal(estimate.expectedScore, 86.7);
  assert.equal(estimate.reliability, 'Getting sharper');
});

test('uncertainty widens with disagreement and repeat share, then narrows with more mocks', () => {
  const one = estimateScore([mock('one', 0, 70)], now)!;
  const agreeing = estimateScore([mock('a', 0, 70), mock('b', 0, 70), mock('c', 0, 70)], now)!;
  const spread = estimateScore([mock('a', 0, 60), mock('b', 0, 80)], now)!;
  const repeats = estimateScore([mock('a', 0, 70, { repeatShare: .5 })], now)!;
  assert.equal(one.halfWidth, 7);
  assert.ok(agreeing.halfWidth < one.halfWidth);
  assert.ok(spread.halfWidth > one.halfWidth);
  assert.equal(repeats.halfWidth, 8);
  assert.equal(estimateScore([mock('old', rankEstimateConfig.averaging.windowDays + 1, 90)], now), null);
});

test('uncertainty range is clamped and reliability reaches Reliable at three mocks', () => {
  const estimate = estimateScore([mock('a', 0, 99), mock('b', 0, 99), mock('c', 0, 99)], now)!;
  assert.equal(estimate.reliability, 'Reliable');
  assert.equal(estimate.highScore, 100);
  assert.ok(estimate.lowScore >= 0);
});

test('section breakdown uses the same recency weights as the overall estimate', () => {
  const section = rankEstimateConfig.syllabus.sections[0];
  const estimate = estimateScore([
    mock('recent', 0, 80, { sectionScores: [{ sectionKey: section.key, marksScored: 4, possibleMarks: 5, marksLost: .5, accuracy: 80 }] }),
    mock('older', rankEstimateConfig.averaging.recencyHalfLifeDays, 80, { sectionScores: [{ sectionKey: section.key, marksScored: 2, possibleMarks: 5, marksLost: 1, accuracy: 40 }] }),
  ], now)!;
  assert.ok(Math.abs(estimate.sectionScores[0].marksScored - 10 / 3) < 1e-12);
  assert.ok(Math.abs(estimate.sectionScores[0].accuracy - 200 / 3) < 1e-12);
});
