import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Question, SavedQuestion } from './models.js';

export const SAVED_NOTE_MAX = 500;
export const savedNoteSchema = z.object({ note: z.string().trim().max(SAVED_NOTE_MAX).optional() }).strict();

const QUESTION_FIELDS = '_id questionNumber text options topic subtopic correctOption explanation paperCode paperNumber examDate sourcePage';

// Same question shape the review/report screens use, plus the learner's note and save time.
export function toSavedItem(row: { note?: string | null; createdAt?: Date | string | null; questionId: any }) {
  const q = row.questionId;
  return {
    question: {
      _id: String(q._id), questionNumber: q.questionNumber, text: q.text || '', options: (q.options || []).map((o: any) => ({ key: o.key, text: o.text })),
      topic: q.topic, subtopic: q.subtopic, correctOption: q.correctOption ?? null, explanation: q.explanation ?? null,
      paperCode: q.paperCode, paperNumber: q.paperNumber, examDate: q.examDate, sourcePage: q.sourcePage,
    },
    note: row.note || '',
    savedAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
  };
}

export function createSavedRouter(auth: (req: any, res: any, next: any) => void) {
  const router = Router();
  const validId = (req: any, res: any, next: any) => mongoose.isValidObjectId(req.params.questionId) ? next() : res.status(400).json({ error: 'That question link is not valid.' });

  router.get('/saved', auth, async (req: any, res) => {
    const rows = await SavedQuestion.find({ userId: req.userId }).sort({ createdAt: -1, _id: -1 }).populate({ path: 'questionId', select: QUESTION_FIELDS }).lean();
    res.json(rows.filter((row: any) => row.questionId).map((row: any) => toSavedItem(row)));
  });

  router.get('/saved/ids', auth, async (req: any, res) => {
    const rows = await SavedQuestion.find({ userId: req.userId }).select('questionId').lean();
    res.json({ ids: rows.map((row: any) => String(row.questionId)) });
  });

  router.post('/saved/:questionId', auth, validId, async (req: any, res) => {
    const parsed = savedNoteSchema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ error: `Keep your note under ${SAVED_NOTE_MAX} characters.` });
    if (!await Question.exists({ _id: req.params.questionId })) return res.status(404).json({ error: 'Question not found.' });
    const update: any = { $setOnInsert: { userId: req.userId, questionId: req.params.questionId } };
    if (parsed.data.note !== undefined) update.$set = { note: parsed.data.note };
    else update.$setOnInsert.note = '';
    const row = await SavedQuestion.findOneAndUpdate({ userId: req.userId, questionId: req.params.questionId }, update, { upsert: true, new: true, runValidators: true })
      .populate({ path: 'questionId', select: QUESTION_FIELDS }).lean();
    res.json(toSavedItem(row as any));
  });

  router.post('/saved/:questionId/remove', auth, validId, async (req: any, res) => {
    await SavedQuestion.deleteOne({ userId: req.userId, questionId: req.params.questionId });
    res.json({ removed: true });
  });

  return router;
}
