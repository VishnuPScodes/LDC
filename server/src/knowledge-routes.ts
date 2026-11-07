import { Router } from 'express';
import { z } from 'zod';
import { KnowledgeDay, User } from './models.js';
import { dayKey } from './stats-date.js';
import { KNOWLEDGE_GOAL_XP } from './learner-stats.js';

// Whether this report is the one that reaches today's reading goal (so the client can celebrate once).
export function knowledgeGoalReached(previousRead: number, read: number, goal: number, alreadyMet: boolean): boolean {
  return !alreadyMet && goal > 0 && previousRead < goal && read >= goal;
}

export function createKnowledgeRouter(auth: (req: any, res: any, next: any) => void) {
  const router = Router();

  router.get('/knowledge/today', auth, async (req: any, res) => {
    const date = dayKey(new Date());
    const [user, day] = await Promise.all([User.findById(req.userId).select('settings').lean(), KnowledgeDay.findOne({ userId: req.userId, date }).lean()]);
    const goal = (day as any)?.goalMetAt ? (day as any).goal : ((user as any)?.settings?.knowledgeGoal || 10);
    res.json({ date, read: (day as any)?.read || 0, goal, goalMet: !!(day as any)?.goalMetAt, xp: KNOWLEDGE_GOAL_XP });
  });

  // The client reports how many cards it has read today; the count only ever goes up.
  router.post('/knowledge/read', auth, async (req: any, res) => {
    const parsed = z.object({ read: z.number().int().min(0).max(5000) }).strict().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid reading count.' });
    const date = dayKey(new Date());
    const user = await User.findById(req.userId).select('settings').lean();
    const currentGoal = (user as any)?.settings?.knowledgeGoal || 10;
    const before = await KnowledgeDay.findOne({ userId: req.userId, date }).lean() as any;
    const previousRead = before?.read || 0, read = Math.max(previousRead, parsed.data.read);
    const goal = before?.goalMetAt ? before.goal : currentGoal;
    const justMet = knowledgeGoalReached(previousRead, read, goal, !!before?.goalMetAt);
    const update: any = { $set: { read, goal } };
    if (justMet) update.$set.goalMetAt = new Date();
    const day = await KnowledgeDay.findOneAndUpdate({ userId: req.userId, date }, update, { upsert: true, new: true, setDefaultsOnInsert: true }).lean() as any;
    res.json({ date, read: day.read, goal: day.goal, goalMet: !!day.goalMetAt, justMet, xp: KNOWLEDGE_GOAL_XP });
  });

  return router;
}
