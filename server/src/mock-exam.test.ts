import test from 'node:test';
import assert from 'node:assert/strict';
import { rankEstimateConfig, rankSyllabusQuestionTotal } from './rank-estimate/config.js';
import { calculateMockSectionScores, evaluateMockRankEligibility, selectMockQuestionSet } from './mock-exam.js';

test('official LDC syllabus quotas total 100 questions', () => {
  assert.equal(rankSyllabusQuestionTotal, 100);
  assert.equal(rankEstimateConfig.mock.questionCount, 100);
  assert.equal(rankEstimateConfig.mock.durationSeconds, 75 * 60);
  assert.equal(rankEstimateConfig.syllabus.sections.find(section => section.key === 'importantActs')?.marks, 5);
});

test('mock selection uses fallback questions and records an unbalanced set and repeats', () => {
  const candidates = rankEstimateConfig.syllabus.sections.flatMap(section => {
    const topic = section.topics[0] || section.fallbackTopics[0];
    return topic ? Array.from({ length: section.marks }, (_, index) => ({ _id: `${section.key}-${index}`, topic })) : [];
  });
  const seen = new Set(candidates.slice(0, 20).map(question => String(question._id)));
  const result = selectMockQuestionSet(candidates, seen, () => 0);
  assert.equal(result.questions.length, 100);
  assert.ok(result.repeatShare > 0);
  assert.equal(result.balanced, false);
  assert.ok(result.imbalanceReasons.some(reason => reason.includes('Important Acts')));
  assert.equal(new Set(result.questions.map(row => String(row.question._id))).size, 100);
});

test('section score includes negative marking, skipped answers and possible marks', () => {
  const questions = [
    { questionId: 'h1', sectionKey: 'history' as const },
    { questionId: 'h2', sectionKey: 'history' as const },
    { questionId: 'h3', sectionKey: 'history' as const },
  ];
  const scores = calculateMockSectionScores(questions, [
    { questionId: 'h1', selectedOption: 'A', isCorrect: true },
    { questionId: 'h2', selectedOption: 'B', isCorrect: false },
    { questionId: 'h3', selectedOption: null, isCorrect: null },
  ]);
  const history = scores.find(row => row.sectionKey === 'history')!;
  assert.ok(Math.abs(history.marksScored - 2 / 3) < 1e-12);
  assert.ok(Math.abs(history.marksLost - 1 / 3) < 1e-12);
  assert.equal(history.skipped, 1);
  assert.equal(history.possibleMarks, 3);
});

test('rank eligibility applies quit, answered share, elapsed time and repeat limits', () => {
  const passing = { quitEarly: false, durationSeconds: 4500, elapsedSeconds: 2000, answeredCount: 70, questionCount: 100, repeatShare: .5 };
  assert.equal(evaluateMockRankEligibility(passing).counted, true);
  assert.equal(evaluateMockRankEligibility({ ...passing, quitEarly: true }).reason, 'This mock was quit before submission.');
  assert.match(evaluateMockRankEligibility({ ...passing, answeredCount: 69 }).reason || '', /70%/);
  assert.equal(evaluateMockRankEligibility({ ...passing, answeredCount: 1, elapsedSeconds: 4500 }).counted, true);
  assert.match(evaluateMockRankEligibility({ ...passing, repeatShare: .51 }).reason || '', /repeat/);
});
