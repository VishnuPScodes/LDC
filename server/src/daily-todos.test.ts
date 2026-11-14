import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTodoCandidates, orderTodos, measureTodos, computeTodayActivity, clampTodoCount, type PoolContext } from './daily-todos.js';

const ctx: PoolContext = {
  dailyGoal: 20, knowledgeGoal: 10, overallAccuracy: 62, questionsAnswered: 400, streak: 3, reviewDue: 7, savedCount: 4, mockExams: 1, examDateSet: false,
  topics: [
    { topic: 'History', attempts: 40, accuracy: 45, attempted: 30, total: 136 },
    { topic: 'Geography', attempts: 30, accuracy: 80, attempted: 25, total: 80 },
    { topic: 'Physics', attempts: 12, accuracy: 50, attempted: 10, total: 34 },
    { topic: 'Basics of Computer', attempts: 0, accuracy: 0, attempted: 0, total: 15 },
  ],
};

test('the pool has 10–15 varied, personalised goals', () => {
  const pool = buildTodoCandidates(ctx);
  assert.ok(pool.length >= 10 && pool.length <= 15, `pool size ${pool.length}`);
  assert.equal(new Set(pool.map(item => item.id)).size, pool.length, 'ids are unique');
  assert.equal(pool.find(item => item.kind === 'weak_topic')?.topic, 'History', 'weakest judged topic first');
  assert.equal(pool.find(item => item.kind === 'new_topic')?.topic, 'Basics of Computer', 'least covered topic');
  assert.equal(pool.find(item => item.kind === 'review')?.target, 5, 'review capped at 5');
  assert.equal(pool.find(item => item.kind === 'accuracy')?.pct, 65, 'accuracy target a little above average');
  assert.ok(pool.some(item => item.kind === 'daily_goal' && item.streak === 3), 'streak goal when on a streak');
  assert.ok(pool.some(item => item.kind === 'exam_date'), 'nudges to set an exam date');
});

test('a beginner gets gentle goals and no mock exam', () => {
  const pool = buildTodoCandidates({ ...ctx, questionsAnswered: 0, overallAccuracy: 0, streak: 0, reviewDue: 0, savedCount: 0, mockExams: 0, topics: [] });
  assert.ok(!pool.some(item => item.kind === 'mock' || item.kind === 'review' || item.kind === 'saved'));
  assert.equal(pool.find(item => item.kind === 'accuracy')?.pct, 60);
  assert.ok(pool.length >= 9);
});

test('order is stable for a learner and day, and differs between days', () => {
  const pool = buildTodoCandidates(ctx);
  const a = orderTodos(pool, 'user1:2026-11-14').map(item => item.id);
  const b = orderTodos(pool, 'user1:2026-11-14').map(item => item.id);
  const c = orderTodos(pool, 'user1:2026-11-15').map(item => item.id);
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, c);
  assert.equal(a.length, pool.length);
});

test('the first items cover different groups, so a 3-item list is varied', () => {
  for (const day of ['2026-11-14', '2026-11-15', '2026-11-16', '2026-11-17']) {
    const ordered = orderTodos(buildTodoCandidates(ctx), `u:${day}`);
    const groups = ordered.slice(0, 5).map(item => item.group);
    assert.equal(new Set(groups).size, 5, `${day}: ${groups}`);
  }
});

test('raising the count only appends items', () => {
  const ordered = orderTodos(buildTodoCandidates(ctx), 'u:2026-11-14');
  assert.deepEqual(ordered.slice(0, 5).slice(0, 3), ordered.slice(0, 3));
});

test('progress is measured from today’s answers only', () => {
  const now = new Date('2026-11-14T18:00:00+05:30');
  const at = (time: string) => new Date(`2026-11-14T${time}+05:30`);
  const sessions = [
    { settings: { mode: 'practice' }, status: 'completed', completedAt: at('10:20:00'), answers: [
      { questionId: 'q1', selectedOption: 'A', isCorrect: true, answeredAt: at('10:00:00'), timeTakenMs: 20000 },
      { questionId: 'q2', selectedOption: 'B', isCorrect: true, answeredAt: at('10:01:00'), timeTakenMs: 50000 },
      { questionId: 'q3', selectedOption: 'C', isCorrect: true, answeredAt: at('10:02:00'), timeTakenMs: 40000 },
      { questionId: 'q4', selectedOption: 'D', isCorrect: false, answeredAt: at('10:03:00'), timeTakenMs: 10000 },
      { questionId: 'old', selectedOption: 'A', isCorrect: true, answeredAt: new Date('2026-11-13T10:00:00+05:30'), timeTakenMs: 1000 },
    ] },
    { settings: { mode: 'practice', reviewOnly: true }, status: 'in_progress', answers: [
      { questionId: 'q5', selectedOption: 'A', isCorrect: true, answeredAt: at('11:00:00'), timeTakenMs: 30000 },
    ] },
  ];
  const topics = new Map([['q1', 'History'], ['q2', 'History'], ['q5', 'Geography']]);
  const activity = computeTodayActivity(sessions, topics, now, { cardsRead: 6, examDateSet: false });
  assert.equal(activity.answered, 5);
  assert.equal(activity.correct, 4);
  assert.equal(activity.bestCorrectRun, 3);
  assert.equal(activity.fastAnswers[45], 4);
  assert.equal(activity.topicAttempts.History, 2);
  assert.equal(activity.reviewAnswers, 1);
  assert.equal(activity.practiceSessionsCompleted, 1);

  const measured = measureTodos([
    { id: 'answer-5', kind: 'answer', group: 'volume', target: 5 },
    { id: 'read-5', kind: 'read', group: 'read', target: 5 },
    { id: 'acc', kind: 'accuracy', group: 'quality', target: 10, pct: 70 },
    { id: 'weak', kind: 'weak_topic', group: 't', target: 5, topic: 'History' },
  ], activity);
  assert.deepEqual(measured.map(item => [item.current, item.done]), [[5, true], [5, true], [5, false], [2, false]]);
  assert.equal(measured[2].accuracy, 80);
});

test('the to-do count is clamped to 3–10', () => {
  assert.equal(clampTodoCount(undefined), 3);
  assert.equal(clampTodoCount(1), 3);
  assert.equal(clampTodoCount(7), 7);
  assert.equal(clampTodoCount(40), 10);
});
