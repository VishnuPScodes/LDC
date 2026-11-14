import { Router } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { z } from 'zod';
import { User, TestSession, Feedback, KnowledgeDay } from './models.js';
import { dayKey } from './stats-date.js';

const ADMIN_COOKIE = 'ldc_admin';
const ADMIN_TTL_SECONDS = 12 * 60 * 60;
const DAY_MS = 86400000;

/** Admin credentials come from ADMIN_EMAIL / ADMIN_PASSWORD. Outside production they default to admin1 / admin1. */
export function adminCredentials(env: NodeJS.ProcessEnv = process.env): { username: string; password: string } | null {
  const username = env.ADMIN_EMAIL?.trim(), password = env.ADMIN_PASSWORD;
  if (username && password) return { username: username.toLowerCase(), password };
  if (env.NODE_ENV === 'production') return null;
  return { username: 'admin1', password: 'admin1' };
}

function sameSecret(a: string, b: string) {
  const ha = crypto.createHash('sha256').update(a).digest(), hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function checkAdminLogin(username: string, password: string, creds = adminCredentials()) {
  if (!creds) return false;
  const userOk = sameSecret(username.trim().toLowerCase(), creds.username), passOk = sameSecret(password, creds.password);
  return userOk && passOk;
}

/** IST day keys from `days-1` days ago through today, oldest first. */
export function dayRange(days: number, now = new Date()) {
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) keys.push(dayKey(now.getTime() - i * DAY_MS));
  return [...new Set(keys)];
}

export type ActivityPair = { date: string; userId: string };

/** Daily signups, running total of users and distinct active learners for each day in the range. */
export function buildGrowthSeries(days: string[], signupsByDay: Record<string, number>, usersBeforeRange: number, activity: ActivityPair[]) {
  const activeByDay = new Map<string, Set<string>>();
  for (const { date, userId } of activity) {
    if (!activeByDay.has(date)) activeByDay.set(date, new Set());
    activeByDay.get(date)!.add(userId);
  }
  let total = usersBeforeRange;
  return days.map(date => {
    const signups = signupsByDay[date] || 0;
    total += signups;
    return { date, signups, totalUsers: total, activeUsers: activeByDay.get(date)?.size || 0 };
  });
}

/** Distinct learners active in the last `window` days of the range (inclusive of today). */
export function activeInWindow(days: string[], activity: ActivityPair[], window: number) {
  const from = days[Math.max(0, days.length - window)];
  return new Set(activity.filter(pair => pair.date >= from).map(pair => pair.userId)).size;
}

const attempts = new Map<string, { count: number; resetAt: number }>();
function tooManyAttempts(key: string) {
  const now = Date.now(), entry = attempts.get(key);
  if (!entry || entry.resetAt < now) return false;
  return entry.count >= 10;
}
function recordFailure(key: string) {
  const now = Date.now(), entry = attempts.get(key);
  if (!entry || entry.resetAt < now) attempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
  else entry.count++;
}

export function createAdminRouter(jwtSecret: string, cookieOpts: Record<string, unknown>) {
  const router = Router();
  const adminCookieOpts = { ...cookieOpts, maxAge: ADMIN_TTL_SECONDS * 1000 };

  function requireAdmin(req: any, res: any, next: any) {
    const token = req.cookies?.[ADMIN_COOKIE];
    try {
      if (!token) throw 0;
      const payload = jwt.verify(token, jwtSecret) as any;
      if (payload?.role !== 'admin') throw 0;
      next();
    } catch {
      return res.status(401).json({ error: 'Admin sign-in required.' });
    }
  }

  router.post('/login', (req: any, res) => {
    const key = String(req.headers['x-forwarded-for'] || req.ip || 'unknown').split(',')[0].trim();
    if (tooManyAttempts(key)) return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' });
    if (!adminCredentials()) return res.status(503).json({ error: 'Admin access is not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD on the server.' });
    const p = z.object({ username: z.string().min(1).max(254), password: z.string().min(1).max(200) }).safeParse(req.body);
    if (!p.success || !checkAdminLogin(p.data.username, p.data.password)) {
      recordFailure(key);
      return res.status(401).json({ error: 'Wrong email or password.' });
    }
    attempts.delete(key);
    res.cookie(ADMIN_COOKIE, jwt.sign({ role: 'admin' }, jwtSecret, { expiresIn: ADMIN_TTL_SECONDS }), adminCookieOpts).json({ ok: true });
  });

  router.post('/logout', (_req, res) => { res.clearCookie(ADMIN_COOKIE, { ...cookieOpts, maxAge: undefined }).json({ ok: true }); });

  router.get('/me', requireAdmin, (_req, res) => res.json({ ok: true }));

  router.get('/overview', requireAdmin, async (req: any, res) => {
    const rangeDays = [7, 30, 90].includes(Number(req.query.range)) ? Number(req.query.range) : 30;
    const days = dayRange(rangeDays), start = new Date(`${days[0]}T00:00:00+05:30`);
    const tz = 'Asia/Kolkata';
    try {
      const [totalUsers, usersBeforeRange, signupRows, sessionPairs, knowledgePairs, sessionTotals, activatedUsers, totalSuggestions, recentUsers] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ createdAt: { $lt: start } }),
        User.aggregate([{ $match: { createdAt: { $gte: start } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: tz } }, count: { $sum: 1 } } }]),
        TestSession.aggregate([{ $match: { startedAt: { $gte: start } } }, { $group: { _id: { date: { $dateToString: { format: '%Y-%m-%d', date: '$startedAt', timezone: tz } }, userId: '$userId' } } }]),
        KnowledgeDay.aggregate([{ $match: { date: { $gte: days[0] }, read: { $gt: 0 } } }, { $group: { _id: { date: '$date', userId: '$userId' } } }]),
        TestSession.aggregate([{ $group: { _id: null, sessions: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }, answers: { $sum: { $size: { $ifNull: ['$answers', []] } } } } }]),
        TestSession.distinct('userId', { status: 'completed' }),
        Feedback.countDocuments(),
        User.find().select('name email createdAt').sort({ createdAt: -1 }).limit(10).lean(),
      ]);
      const signupsByDay = Object.fromEntries(signupRows.map((row: any) => [row._id, row.count]));
      const activity: ActivityPair[] = [...sessionPairs, ...knowledgePairs].map((row: any) => ({ date: row._id.date, userId: String(row._id.userId) }));
      const series = buildGrowthSeries(days, signupsByDay, usersBeforeRange, activity);
      const sumSignups = (n: number) => series.slice(-n).reduce((sum, row) => sum + row.signups, 0);
      const totals = sessionTotals[0] || { sessions: 0, completed: 0, answers: 0 };
      // Week-over-week signup growth, always over the last 14 days regardless of chosen range.
      const twoWeeks = dayRange(14), twoWeekStart = new Date(`${twoWeeks[0]}T00:00:00+05:30`), weekStart = new Date(`${twoWeeks[7]}T00:00:00+05:30`);
      const [thisWeek, lastWeek] = await Promise.all([
        User.countDocuments({ createdAt: { $gte: weekStart } }),
        User.countDocuments({ createdAt: { $gte: twoWeekStart, $lt: weekStart } }),
      ]);
      res.json({
        rangeDays,
        users: {
          total: totalUsers,
          newToday: sumSignups(1), new7d: thisWeek, new30d: rangeDays >= 30 ? sumSignups(30) : await User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 30 * DAY_MS) } }),
          weekOverWeekPct: lastWeek ? Math.round((thisWeek - lastWeek) / lastWeek * 100) : null,
          activated: activatedUsers.length,
        },
        active: { today: activeInWindow(days, activity, 1), last7d: activeInWindow(days, activity, 7), inRange: activeInWindow(days, activity, rangeDays) },
        practice: { sessions: totals.sessions, completed: totals.completed, answers: totals.answers },
        suggestions: { total: totalSuggestions },
        series,
        recentUsers: recentUsers.map((user: any) => ({ id: String(user._id), name: user.name, email: user.email, joinedAt: user.createdAt })),
      });
    } catch (error) {
      console.error('Admin overview failed', error);
      res.status(500).json({ error: 'Could not load admin stats.' });
    }
  });

  router.get('/suggestions', requireAdmin, async (req: any, res) => {
    const limit = 30, filter: any = {};
    if (typeof req.query.before === 'string' && !Number.isNaN(Date.parse(req.query.before))) filter.createdAt = { $lt: new Date(req.query.before) };
    try {
      const rows = await Feedback.find(filter).sort({ createdAt: -1 }).limit(limit + 1).populate('userId', 'name email').lean();
      res.json({
        items: rows.slice(0, limit).map((row: any) => ({ id: String(row._id), message: row.message, createdAt: row.createdAt, user: row.userId ? { name: row.userId.name, email: row.userId.email } : null })),
        hasMore: rows.length > limit,
      });
    } catch (error) {
      console.error('Admin suggestions failed', error);
      res.status(500).json({ error: 'Could not load suggestions.' });
    }
  });

  return router;
}
