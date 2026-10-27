import { Router } from 'express';
import { Question, TestSession, UserProgress } from './models.js';
import { rankEstimateConfig } from './rank-estimate/config.js';
import { selectMockQuestionSet } from './mock-exam.js';

export function createMockExamRouter(auth: (req: any, res: any, next: any) => void) {
  const router = Router();
  router.get('/mock-config', (_req, res) => res.json({
    questionCount: rankEstimateConfig.mock.questionCount,
    durationSeconds: rankEstimateConfig.mock.durationSeconds,
    syllabusVersion: rankEstimateConfig.syllabus.version,
  }));

  router.post('/', auth, async (req: any, res, next) => {
    if (req.body?.mode !== 'mock') return next('route');
    const progress = await UserProgress.findOne({ userId: req.userId });
    const previouslyAnsweredIds = new Set<string>((progress?.questions || []).map((row: any) => String(row.questionId)));
    const candidateTopics = [...new Set(rankEstimateConfig.syllabus.sections.flatMap(section => [...section.topics, ...section.fallbackTopics]))];
    const candidates = await Question.find({
      topic: { $in: candidateTopics }, eligibleForPractice: true, needsReview: false,
      correctOption: { $in: ['A', 'B', 'C', 'D'] },
    }).lean();
    const mock = selectMockQuestionSet(candidates as any[], previouslyAnsweredIds);
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

  return router;
}
