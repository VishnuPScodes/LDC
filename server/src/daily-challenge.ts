import { Router } from 'express';
import { Question } from './models.js';
import { isTimeSensitiveQuestion } from './time-sensitive.js';

export const DAILY_LAUNCH_DATE = '2026-01-01';
export const DAILY_QUESTION_COUNT = 10;
const DAY_MS = 86400000;

/** Calendar date (YYYY-MM-DD) in Asia/Kolkata for the given instant. */
export function istDateKey(now: Date): string {
  // IST is a fixed UTC+05:30 offset with no DST.
  return new Date(now.getTime() + 330 * 60000).toISOString().slice(0, 10);
}

/** Challenge number: the launch date is #1. */
export function dailyNumber(dateKey: string): number {
  return Math.round((Date.parse(`${dateKey}T00:00:00Z`) - Date.parse(`${DAILY_LAUNCH_DATE}T00:00:00Z`)) / DAY_MS) + 1;
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) { hash ^= value.charCodeAt(index); hash = Math.imul(hash, 16777619); }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic pick: same ids (in any order) + same date always give the same set. */
export function pickDailyIds(ids: string[], dateKey: string, count = DAILY_QUESTION_COUNT): string[] {
  const pool = [...new Set(ids)].sort();
  const random = mulberry32(hashString(`ldc-daily:${dateKey}`));
  for (let index = pool.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [pool[index], pool[swap]] = [pool[swap], pool[index]];
  }
  return pool.slice(0, Math.max(0, Math.min(count, pool.length)));
}

type DailyPayload = { date: string; number: number; questions: any[] };

function shapeQuestion(question: any) {
  return {
    _id: String(question._id), questionNumber: question.questionNumber, text: question.text, options: (question.options || []).map((option: any) => ({ key: option.key, text: option.text })),
    correctOption: question.correctOption, explanation: question.explanation, topic: question.topic, sourcePage: question.sourcePage, paperNumber: question.paperNumber,
    pdfOrder: question.pdfOrder, paperCode: question.paperCode, examDate: question.examDate,
  };
}

export function createDailyRouter() {
  const router = Router();
  const cache = new Map<string, Promise<DailyPayload>>();

  const build = async (dateKey: string): Promise<DailyPayload> => {
    const eligible = await Question.find({ eligibleForPractice: true, needsReview: false, correctOption: { $in: ['A', 'B', 'C', 'D'] } })
      .select('_id text options').lean();
    const ids = (eligible as any[])
      .filter(question => (question.options || []).length === 4 && !isTimeSensitiveQuestion(question.text || ''))
      .map(question => String(question._id));
    const picked = pickDailyIds(ids, dateKey);
    const rows = await Question.find({ _id: { $in: picked } }).lean();
    const byId = new Map((rows as any[]).map(row => [String(row._id), row]));
    return { date: dateKey, number: dailyNumber(dateKey), questions: picked.flatMap(id => byId.has(id) ? [shapeQuestion(byId.get(id))] : []) };
  };

  router.get('/daily', async (_req, res) => {
    const dateKey = istDateKey(new Date());
    try {
      let pending = cache.get(dateKey);
      if (!pending) {
        cache.clear();
        pending = build(dateKey);
        cache.set(dateKey, pending);
        pending.catch(() => cache.delete(dateKey));
      }
      const payload = await pending;
      if (!payload.questions.length) { cache.delete(dateKey); return res.status(503).json({ error: 'Today’s challenge is not available yet.' }); }
      res.set('Cache-Control', 'no-store');
      return res.json(payload);
    } catch (error) {
      console.error('Could not build the daily challenge', error);
      return res.status(500).json({ error: 'Could not load today’s challenge. Please retry.' });
    }
  });

  return router;
}
