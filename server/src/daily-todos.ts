import { Router } from 'express';
import { Question, SavedQuestion, TestSession, TodoDay, User, UserProgress, KnowledgeDay } from './models.js';
import { dayKey } from './stats-date.js';
import { getLearnerStats } from './learner-stats.js';

// Daily to-do list for the Today page.
//
// Once per IST day the server builds a pool of 10–15 small, personalised goals from the learner's own data
// (weak and untouched topics, review backlog, accuracy, reading goal, exam date …), shuffles it with a seed
// made from the learner and the date, and saves that order. The learner sees the first N items, where N is
// their chosen to-do count, so raising N only appends items and the list never reshuffles during the day.
// Progress is always measured live from today's activity; nothing is ticked off by hand.

export const TODO_COUNT_MIN = 3;
export const TODO_COUNT_MAX = 10;
export const TODO_COUNT_DEFAULT = 3;

export type TodoKind =
  | 'answer' | 'daily_goal' | 'correct' | 'accuracy' | 'correct_run' | 'speed'
  | 'read' | 'review' | 'weak_topic' | 'new_topic' | 'session' | 'saved' | 'mock' | 'exam_date';

export type TodoItem = { id: string; kind: TodoKind; group: string; target: number; topic?: string; pct?: number; seconds?: number; streak?: number };
export type MeasuredTodo = TodoItem & { current: number; done: boolean; accuracy?: number };

/** What the learner has done so far today (IST). */
export type TodayActivity = {
  answered: number;            // unique questions answered
  attempts: number;            // answers given
  correct: number;
  bestCorrectRun: number;
  fastAnswers: Record<number, number>; // seconds limit -> answers at or under it
  topicAttempts: Record<string, number>;
  reviewAnswers: number;
  savedAnswers: number;
  practiceSessionsCompleted: number;
  mocksCompleted: number;
  cardsRead: number;
  examDateSet: boolean;
};

/** Everything the pool builder needs to personalise the day's goals. */
export type PoolContext = {
  dailyGoal: number;
  knowledgeGoal: number;
  overallAccuracy: number;     // 0–100, 0 when the learner has no history
  questionsAnswered: number;   // all-time
  streak: number;
  reviewDue: number;
  savedCount: number;
  mockExams: number;
  examDateSet: boolean;
  topics: { topic: string; attempts: number; accuracy: number; attempted: number; total: number }[];
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const roundTo5 = (value: number) => Math.round(value / 5) * 5;

// Small deterministic PRNG so a learner gets the same order all day, on every device.
function seededRandom(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  let a = h >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** Builds the day's candidate goals (10–15) with a weight for how useful each one is today. */
export function buildTodoCandidates(ctx: PoolContext): (TodoItem & { weight: number })[] {
  const out: (TodoItem & { weight: number })[] = [];
  const add = (item: TodoItem, weight: number) => out.push({ ...item, weight });
  const beginner = ctx.questionsAnswered < 30;
  const goal = clamp(ctx.dailyGoal || 20, 5, 100);

  // Volume: one of these leads most lists.
  if (goal > 5) add({ id: 'answer-5', kind: 'answer', group: 'volume', target: 5 }, beginner ? 6 : 3);
  if (ctx.streak >= 2) add({ id: 'daily-goal-streak', kind: 'daily_goal', group: 'volume', target: goal, streak: ctx.streak }, 7);
  else add({ id: 'daily-goal', kind: 'daily_goal', group: 'volume', target: goal }, beginner ? 3 : 6);

  // Quality: accuracy target sits a little above the learner's own average.
  const pct = ctx.questionsAnswered >= 20 ? clamp(roundTo5(ctx.overallAccuracy + 5), 50, 90) : 60;
  add({ id: `accuracy-${pct}`, kind: 'accuracy', group: 'quality', target: 10, pct }, 5);
  add({ id: 'correct-8', kind: 'correct', group: 'correct', target: beginner ? 5 : 8 }, 4);
  add({ id: 'correct-run-5', kind: 'correct_run', group: 'run', target: beginner ? 3 : 5 }, 3);
  add({ id: 'speed-45', kind: 'speed', group: 'speed', target: 10, seconds: 45 }, beginner ? 1 : 3);

  // Reading.
  const reading = clamp(ctx.knowledgeGoal || 10, 5, 100);
  add({ id: 'read-5', kind: 'read', group: 'read', target: 5 }, 4);
  if (reading !== 5) add({ id: `read-${reading}`, kind: 'read', group: 'read', target: reading }, 3);

  // Spaced review backlog.
  if (ctx.reviewDue > 0) add({ id: 'review', kind: 'review', group: 'review', target: Math.min(5, ctx.reviewDue) }, 7);

  // Weak topics: lowest accuracy among topics with enough attempts to judge.
  const judged = ctx.topics.filter(row => row.attempts >= 5 && row.total > 0).sort((a, b) => a.accuracy - b.accuracy);
  judged.slice(0, 2).forEach((row, index) => add({ id: `weak-${row.topic}`, kind: 'weak_topic', group: `topic-${index}`, target: 5, topic: row.topic }, index === 0 ? 6 : 4));

  // Fresh ground: the least-covered topic the learner has barely touched.
  const weak = new Set(judged.slice(0, 2).map(row => row.topic));
  const fresh = ctx.topics.filter(row => row.total > 0 && !weak.has(row.topic)).sort((a, b) => a.attempted / a.total - b.attempted / b.total || b.total - a.total);
  if (fresh[0]) add({ id: `new-${fresh[0].topic}`, kind: 'new_topic', group: 'topic-new', target: 5, topic: fresh[0].topic }, 4);

  add({ id: 'session-1', kind: 'session', group: 'session', target: 1 }, 3);
  if (ctx.savedCount > 0) add({ id: 'saved-3', kind: 'saved', group: 'saved', target: Math.min(3, ctx.savedCount) }, 2);
  if (!beginner) add({ id: 'mock-1', kind: 'mock', group: 'mock', target: 1 }, ctx.mockExams === 0 ? 2 : 1);
  if (!ctx.examDateSet) add({ id: 'exam-date', kind: 'exam_date', group: 'setup', target: 1 }, 2);

  // Keep the pool to at most 15 by dropping the least useful goals.
  const MAX_POOL = 15;
  if (out.length > MAX_POOL) {
    const keep = new Set([...out].sort((a, b) => b.weight - a.weight).slice(0, MAX_POOL));
    return out.filter(item => keep.has(item));
  }
  return out;
}

/**
 * Orders the candidates for a learner and day: weighted random (better goals tend to come first), with one goal
 * per group before any group repeats, so the first few items are varied.
 */
export function orderTodos(candidates: (TodoItem & { weight: number })[], seed: string): TodoItem[] {
  const random = seededRandom(seed);
  const keyed = candidates.map(item => ({ item, key: Math.pow(random() || 1e-9, 1 / Math.max(0.1, item.weight)) })).sort((a, b) => b.key - a.key).map(row => row.item);
  const first: typeof keyed = [], rest: typeof keyed = [], groups = new Set<string>();
  for (const item of keyed) { if (groups.has(item.group)) rest.push(item); else { groups.add(item.group); first.push(item); } }
  return [...first, ...rest].map(({ weight: _weight, ...item }) => item);
}

/** Measures each goal against today's activity. */
export function measureTodos(items: TodoItem[], activity: TodayActivity): MeasuredTodo[] {
  return items.map(item => {
    let current = 0, done = false, accuracy: number | undefined;
    switch (item.kind) {
      case 'answer': case 'daily_goal': current = activity.answered; break;
      case 'correct': current = activity.correct; break;
      case 'correct_run': current = activity.bestCorrectRun; break;
      case 'speed': current = activity.fastAnswers[item.seconds || 45] || 0; break;
      case 'read': current = activity.cardsRead; break;
      case 'review': current = activity.reviewAnswers; break;
      case 'weak_topic': case 'new_topic': current = activity.topicAttempts[item.topic || ''] || 0; break;
      case 'session': current = activity.practiceSessionsCompleted; break;
      case 'saved': current = activity.savedAnswers; break;
      case 'mock': current = activity.mocksCompleted; break;
      case 'exam_date': current = activity.examDateSet ? 1 : 0; break;
      case 'accuracy':
        current = activity.attempts;
        accuracy = activity.attempts ? Math.round(activity.correct / activity.attempts * 100) : 0;
        done = activity.attempts >= item.target && accuracy >= (item.pct || 0);
        break;
    }
    if (item.kind !== 'accuracy') done = current >= item.target;
    return { ...item, current: Math.min(current, item.target), done, ...(accuracy !== undefined ? { accuracy } : {}) };
  });
}

/** Today's activity from the learner's sessions (answers are grouped by IST day, like the rest of the stats). */
export function computeTodayActivity(sessions: any[], topicById: Map<string, string>, now: Date, extra: { cardsRead: number; examDateSet: boolean }): TodayActivity {
  const today = dayKey(now);
  const activity: TodayActivity = { answered: 0, attempts: 0, correct: 0, bestCorrectRun: 0, fastAnswers: {}, topicAttempts: {}, reviewAnswers: 0, savedAnswers: 0, practiceSessionsCompleted: 0, mocksCompleted: 0, cardsRead: extra.cardsRead, examDateSet: extra.examDateSet };
  const unique = new Set<string>();
  const events: { at: number; correct: boolean }[] = [];
  for (const session of sessions) {
    const mode = session.settings?.mode;
    if (session.status === 'completed' && !session.quitEarly && session.completedAt && dayKey(session.completedAt) === today) {
      if (mode === 'mock') activity.mocksCompleted++; else activity.practiceSessionsCompleted++;
    }
    for (const answer of session.answers || []) {
      if (!answer.selectedOption || !answer.answeredAt || dayKey(answer.answeredAt) !== today) continue;
      const id = String(answer.questionId);
      unique.add(id);
      activity.attempts++;
      if (answer.isCorrect) activity.correct++;
      events.push({ at: new Date(answer.answeredAt).getTime(), correct: !!answer.isCorrect });
      const ms = Number(answer.timeTakenMs) || 0;
      if (ms > 0 && mode !== 'mock') for (const limit of [30, 45, 60]) if (ms <= limit * 1000) activity.fastAnswers[limit] = (activity.fastAnswers[limit] || 0) + 1;
      const topic = topicById.get(id);
      if (topic) activity.topicAttempts[topic] = (activity.topicAttempts[topic] || 0) + 1;
      if (session.settings?.reviewOnly) activity.reviewAnswers++;
      if (session.settings?.savedOnly) activity.savedAnswers++;
    }
  }
  activity.answered = unique.size;
  let run = 0;
  for (const event of events.sort((a, b) => a.at - b.at)) { run = event.correct ? run + 1 : 0; activity.bestCorrectRun = Math.max(activity.bestCorrectRun, run); }
  return activity;
}

export function clampTodoCount(value: unknown) {
  const n = Number(value);
  return Number.isInteger(n) ? clamp(n, TODO_COUNT_MIN, TODO_COUNT_MAX) : TODO_COUNT_DEFAULT;
}

async function buildPoolForUser(userId: string, now: Date) {
  const [stats, progress, savedCount] = await Promise.all([
    getLearnerStats(userId, now),
    UserProgress.findOne({ userId }).populate('questions.questionId', 'eligibleForPractice needsReview correctOption').lean(),
    SavedQuestion.countDocuments({ userId }),
  ]);
  const reviewDue = ((progress as any)?.questions || []).filter((row: any) => row.reviewAt && new Date(row.reviewAt) <= now && row.questionId?.eligibleForPractice && !row.questionId.needsReview && ['A', 'B', 'C', 'D'].includes(row.questionId.correctOption || '')).length;
  const user = await User.findById(userId).select('settings').lean() as any;
  const ctx: PoolContext = {
    dailyGoal: stats.dailyGoal, knowledgeGoal: stats.knowledgeGoal, overallAccuracy: stats.accuracy, questionsAnswered: stats.questionsAnswered,
    streak: stats.streak, reviewDue, savedCount, mockExams: stats.mockExams, examDateSet: !!user?.settings?.targetExamDate,
    topics: stats.topicStats.map((row: any) => ({ topic: row.topic, attempts: row.attempts, accuracy: row.accuracy, attempted: row.attempted, total: row.total })),
  };
  return orderTodos(buildTodoCandidates(ctx), `${userId}:${dayKey(now)}`);
}

export function createTodoRouter(auth: (req: any, res: any, next: any) => void) {
  const router = Router();

  router.get('/todos', auth, async (req: any, res) => {
    const now = new Date(), date = dayKey(now);
    const user = await User.findById(req.userId).select('settings').lean() as any;
    let day = await TodoDay.findOne({ userId: req.userId, date }).lean() as any;
    if (!day) {
      const items = await buildPoolForUser(req.userId, now);
      // Upsert so two tabs opening at once still agree on one list.
      day = await TodoDay.findOneAndUpdate({ userId: req.userId, date }, { $setOnInsert: { items } }, { upsert: true, new: true, setDefaultsOnInsert: true }).lean();
    }
    const dayStart = new Date(`${date}T00:00:00+05:30`);
    const [sessions, knowledge] = await Promise.all([
      TestSession.find({ userId: req.userId, $or: [{ 'answers.answeredAt': { $gte: dayStart } }, { completedAt: { $gte: dayStart } }] }).select('settings status quitEarly completedAt answers').lean(),
      KnowledgeDay.findOne({ userId: req.userId, date }).select('read').lean() as any,
    ]);
    const ids = [...new Set((sessions as any[]).flatMap(session => (session.answers || []).map((answer: any) => String(answer.questionId))))];
    const topics = ids.length ? await Question.find({ _id: { $in: ids } }).select('_id topic').lean() : [];
    const topicById = new Map((topics as any[]).map(row => [String(row._id), row.topic as string]));
    const activity = computeTodayActivity(sessions as any[], topicById, now, { cardsRead: knowledge?.read || 0, examDateSet: !!user?.settings?.targetExamDate });
    const count = clampTodoCount(user?.settings?.todoCount);
    const items = measureTodos((day.items || []).slice(0, count), activity);
    res.json({ date, count, chosen: Number.isInteger(user?.settings?.todoCount), available: (day.items || []).length, min: TODO_COUNT_MIN, max: TODO_COUNT_MAX, items, completed: items.filter(item => item.done).length });
  });

  return router;
}
