import test from 'node:test';
import assert from 'node:assert/strict';
import { knowledgeGoalReached } from './knowledge-routes.js';
import { computeLearnerStats, KNOWLEDGE_GOAL_XP } from './learner-stats.js';

test('the goal is reached exactly once, when the count crosses it', () => {
  assert.equal(knowledgeGoalReached(9, 10, 10, false), true);
  assert.equal(knowledgeGoalReached(3, 25, 10, false), true);
  assert.equal(knowledgeGoalReached(10, 11, 10, false), false);
  assert.equal(knowledgeGoalReached(9, 10, 10, true), false);
  assert.equal(knowledgeGoalReached(4, 8, 10, false), false);
});

test('each day the reading goal was met adds XP', () => {
  const none = computeLearnerStats([], [], 20, new Date('2026-11-07T10:00:00+05:30'));
  const two = computeLearnerStats([], [], 20, new Date('2026-11-07T10:00:00+05:30'), [
    { date: '2026-11-06', goalMetAt: new Date('2026-11-06T09:00:00+05:30') },
    { date: '2026-11-07', goalMetAt: new Date('2026-11-07T09:00:00+05:30') },
    { date: '2026-11-05', goalMetAt: null },
  ]);
  assert.equal(two.points - none.points, 2 * KNOWLEDGE_GOAL_XP);
});
