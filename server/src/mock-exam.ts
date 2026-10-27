import { rankEstimateConfig, type RankSectionKey } from './rank-estimate/config.js';

export type MockCandidate = { _id: unknown; topic: string; [key: string]: unknown };
export type SelectedMockQuestion<T extends MockCandidate = MockCandidate> = {
  question: T;
  sectionKey: RankSectionKey;
  seenBefore: boolean;
  difficulty: number;
};

export function selectMockQuestionSet<T extends MockCandidate>(
  candidates: T[],
  previouslyAnsweredIds: Set<string>,
  random = Math.random,
  difficultyByQuestion = new Map<string, number>(),
) {
  const selected: SelectedMockQuestion<T>[] = [];
  const used = new Set<string>();
  const imbalanceReasons: string[] = [];

  for (const section of rankEstimateConfig.syllabus.sections) {
    const direct = candidates.filter(question => (section.topics as readonly string[]).includes(question.topic));
    const fallback = candidates.filter(question => (section.fallbackTopics as readonly string[]).includes(question.topic));
    const allowed = [...new Map([...direct, ...fallback].map(question => [String(question._id), question])).values()]
      .filter(question => !used.has(String(question._id)));
    const isDirect = new Set(direct.map(question => String(question._id)));
    const unseenDirect = shuffle(allowed.filter(question => isDirect.has(String(question._id)) && !previouslyAnsweredIds.has(String(question._id))), random);
    const unseenFallback = shuffle(allowed.filter(question => !isDirect.has(String(question._id)) && !previouslyAnsweredIds.has(String(question._id))), random);
    const seenDirect = shuffle(allowed.filter(question => isDirect.has(String(question._id)) && previouslyAnsweredIds.has(String(question._id))), random);
    const seenFallback = shuffle(allowed.filter(question => !isDirect.has(String(question._id)) && previouslyAnsweredIds.has(String(question._id))), random);
    const ordered = [...unseenDirect, ...unseenFallback, ...seenDirect, ...seenFallback];
    const chosen = ordered.slice(0, section.marks);

    if (chosen.length < section.marks) imbalanceReasons.push(`${section.title}: only ${chosen.length} of ${section.marks} questions available.`);
    if (chosen.some(question => !isDirect.has(String(question._id)))) imbalanceReasons.push(`${section.title}: filled using a related syllabus section.`);
    for (const question of chosen) {
      const id = String(question._id);
      used.add(id);
      selected.push({
        question,
        sectionKey: section.key,
        seenBefore: previouslyAnsweredIds.has(id),
        difficulty: difficultyByQuestion.get(id) ?? rankEstimateConfig.difficulty.neutralDefault,
      });
    }
  }

  const questions = shuffle(selected, random);
  const answerableCount = questions.length;
  const repeatCount = questions.filter(item => item.seenBefore).length;
  return {
    questions,
    mockSetId: createMockSetId(random),
    repeatCount,
    repeatShare: answerableCount ? repeatCount / answerableCount : 0,
    difficulty: answerableCount ? questions.reduce((sum, item) => sum + item.difficulty, 0) / answerableCount : rankEstimateConfig.difficulty.neutralDefault,
    balanced: questions.length === rankEstimateConfig.mock.questionCount && imbalanceReasons.length === 0,
    imbalanceReasons: [...new Set(imbalanceReasons)],
  };
}

export function calculateMockSectionScores(
  questionSections: { questionId: string; sectionKey: RankSectionKey }[],
  answers: { questionId: string; selectedOption?: string | null; isCorrect?: boolean | null }[],
) {
  const answerById = new Map(answers.map(answer => [answer.questionId, answer]));
  return rankEstimateConfig.syllabus.sections.map(section => {
    const rows = questionSections.filter(question => question.sectionKey === section.key);
    const sectionAnswers = rows.map(row => answerById.get(row.questionId)).filter((answer): answer is NonNullable<typeof answer> => !!answer);
    const correct = sectionAnswers.filter(answer => !!answer.selectedOption && answer.isCorrect === true).length;
    const wrong = sectionAnswers.filter(answer => !!answer.selectedOption && answer.isCorrect === false).length;
    const skipped = Math.max(0, rows.length - correct - wrong);
    const attempted = correct + wrong;
    return {
      sectionKey: section.key,
      title: section.title,
      questionCount: rows.length,
      possibleMarks: rows.length,
      correct,
      wrong,
      skipped,
      marksScored: correct + wrong * rankEstimateConfig.marking.wrong,
      marksLost: wrong * -rankEstimateConfig.marking.wrong,
      accuracy: attempted ? correct / attempted * 100 : 0,
    };
  });
}

export function evaluateMockRankEligibility(input: {
  quitEarly: boolean;
  durationSeconds: number;
  elapsedSeconds: number;
  answeredCount: number;
  questionCount: number;
  repeatShare: number;
}) {
  const config = rankEstimateConfig.mock;
  const answeredShare = input.questionCount ? input.answeredCount / input.questionCount : 0;
  const fullTimeUsed = input.elapsedSeconds >= input.durationSeconds * config.fullTimeShare;
  let reason: string | null = null;
  if (input.quitEarly) reason = 'This mock was quit before submission.';
  else if (input.repeatShare > config.maximumRepeatShare) reason = 'More than half of the questions were repeats.';
  else if (answeredShare < config.minimumAnsweredShare && !fullTimeUsed) reason = 'Answer at least 70% of the questions or use the full time.';
  return { counted: reason === null, reason, answeredShare, fullTimeUsed };
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const result = items.slice();
  for (let index = result.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

function createMockSetId(random: () => number) {
  const timestamp = Date.now().toString(36);
  const suffix = Array.from({ length: 12 }, () => Math.floor(random() * 36).toString(36)).join('');
  return `${timestamp}-${suffix}`;
}
