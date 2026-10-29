import { Router } from 'express';
import { Question, TestSession, UserProgress } from './models.js';
import { rankEstimateConfig } from './rank-estimate/config.js';
import { selectMockQuestionSet } from './mock-exam.js';
import { questionDifficulty } from './rank-estimate/score.js';
import { checkAnswer } from './scoring.js';
import { z } from 'zod';

export function createMockExamRouter(auth: (req: any, res: any, next: any) => void) {
  const router = Router();
  router.get('/mock-config', (_req, res) => res.json({
    questionCount: rankEstimateConfig.mock.questionCount,
    durationSeconds: rankEstimateConfig.mock.durationSeconds,
    syllabusVersion: rankEstimateConfig.syllabus.version,
  }));

  router.post('/', auth, async (req: any, res, next) => {
    if (req.body?.mode !== 'mock') return next('route');
    const [progress, previousSessions] = await Promise.all([
      UserProgress.findOne({ userId: req.userId }),
      TestSession.find({ userId: req.userId, status: 'completed' }).select('questionIds').lean(),
    ]);
    const previouslyAnsweredIds = new Set<string>([
      ...(progress?.questions || []).map((row: any) => String(row.questionId)),
      ...previousSessions.flatMap((session: any) => (session.questionIds || []).map((id: any) => String(id))),
    ]);
    const candidateTopics = [...new Set(rankEstimateConfig.syllabus.sections.flatMap(section => [...section.topics, ...section.fallbackTopics]))];
    const candidates = await Question.find({
      topic: { $in: candidateTopics }, eligibleForPractice: true, needsReview: false,
      correctOption: { $in: ['A', 'B', 'C', 'D'] },
    }).lean();
    const firstAttemptStats = await TestSession.aggregate([
      { $unwind: '$answers' },
      { $match: { 'answers.questionId': { $in: candidates.map((question: any) => question._id) }, 'answers.isFirstAttempt': true, 'answers.firstIsCorrect': { $in: [true, false] } } },
      { $group: { _id: '$answers.questionId', firstAttempts: { $sum: 1 }, wrongFirstAttempts: { $sum: { $cond: ['$answers.firstIsCorrect', 0, 1] } } } },
    ]);
    const statsByQuestion = new Map(firstAttemptStats.map((row: any) => [String(row._id), row]));
    const topicTotals = new Map<string, { attempts: number; wrong: number }>();
    for (const question of candidates as any[]) {
      const stats: any = statsByQuestion.get(String(question._id));
      if (!stats) continue;
      const total = topicTotals.get(question.topic) || { attempts: 0, wrong: 0 };
      total.attempts += stats.firstAttempts;
      total.wrong += stats.wrongFirstAttempts;
      topicTotals.set(question.topic, total);
    }
    const topicAverages = new Map([...topicTotals].map(([topic, total]) => [topic, total.wrong / total.attempts]));
    const difficultyByQuestion = new Map((candidates as any[]).map(question => {
      const stats: any = statsByQuestion.get(String(question._id));
      return [String(question._id), questionDifficulty(stats?.firstAttempts || 0, stats?.wrongFirstAttempts || 0, topicAverages.get(question.topic))];
    }));
    const mock = selectMockQuestionSet(candidates as any[], previouslyAnsweredIds, Math.random, difficultyByQuestion);
    if (mock.questions.length !== rankEstimateConfig.mock.questionCount) {
      return res.status(409).json({ error: 'There are not enough verified questions to build a full mock exam yet.' });
    }
    const session = await TestSession.create({
      userId: req.userId,
      settings: {
        count: rankEstimateConfig.mock.questionCount,
        order: 'random', topics: [], mode: 'mock',
        durationSeconds: rankEstimateConfig.mock.durationSeconds,
      },
      questionIds: mock.questions.map(row => row.question._id),
      mockMetadata: {
        mockSetId: mock.mockSetId,
        syllabusVersion: rankEstimateConfig.syllabus.version,
        balanced: mock.balanced,
        imbalanceReasons: mock.imbalanceReasons,
        repeatCount: mock.repeatCount,
        repeatShare: mock.repeatShare,
        difficulty: mock.difficulty,
        questionSections: mock.questions.map(row => ({ questionId: row.question._id, sectionKey: row.sectionKey, seenBefore: row.seenBefore, difficulty: row.difficulty })),
      },
    });
    res.json({
      id: session.id, settings: session.settings, startedAt: session.startedAt,
      mockMetadata: session.mockMetadata,
      questions: mock.questions.map(({ question }: any) => {
        const { correctOption, explanation, ...safeQuestion } = question;
        return safeQuestion;
      }),
    });
  });

  router.post('/:id/answer', auth, async (req: any, res, next) => {
    const session: any = await TestSession.findOne({ _id: req.params.id, userId: req.userId, status: 'in_progress' });
    if (!session || session.settings.mode !== 'mock') return next('route');
    const parsed = z.object({ questionId: z.string(), selectedOption: z.string().regex(/^[A-D]$/), timeTakenMs: z.number().nonnegative().default(0) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Choose one of the listed options.' });
    if (!session.questionIds.some((id: any) => String(id) === parsed.data.questionId)) return res.status(400).json({ error: 'That question is not part of this test.' });
    const question: any = await Question.findById(parsed.data.questionId);
    if (!question) return res.status(404).json({ error: 'Question not found.' });
    let progress: any = await UserProgress.findOne({ userId: req.userId });
    if (!progress) progress = await UserProgress.create({ userId: req.userId, questions: [] });
    const progressRow: any = progress.questions.find((row: any) => String(row.questionId) === parsed.data.questionId);
    const priorAnswer: any = session.answers.find((answer: any) => String(answer.questionId) === parsed.data.questionId);
    const isCorrect = checkAnswer(parsed.data.selectedOption, question.correctOption);
    if (priorAnswer) {
      const wasCorrect = !!priorAnswer.isCorrect;
      priorAnswer.firstSelectedOption ||= priorAnswer.selectedOption;
      priorAnswer.selectedOption = parsed.data.selectedOption;
      priorAnswer.isCorrect = isCorrect;
      priorAnswer.timeTakenMs = parsed.data.timeTakenMs;
      if (progressRow && wasCorrect !== isCorrect) progressRow.correctCount = Math.max(0, (progressRow.correctCount || 0) + (isCorrect ? 1 : -1));
    } else {
      const firstEverAttempt = !progressRow || (progressRow.attempts || 0) === 0;
      session.answers.push({
        questionId: question._id, selectedOption: parsed.data.selectedOption, firstSelectedOption: parsed.data.selectedOption,
        firstIsCorrect: firstEverAttempt ? isCorrect : undefined, isFirstAttempt: firstEverAttempt || undefined,
        isCorrect, timeTakenMs: parsed.data.timeTakenMs, answeredAt: new Date(),
      });
      if (progressRow) {
        progressRow.attempts++;
        if (isCorrect) progressRow.correctCount++;
        progressRow.lastAnsweredAt = new Date();
      } else progress.questions.push({ questionId: question._id, attempts: 1, correctCount: isCorrect ? 1 : 0, lastAnsweredAt: new Date() } as any);
    }
    await Promise.all([session.save(), progress.save()]);
    return res.json({ saved: true });
  });

  return router;
}
