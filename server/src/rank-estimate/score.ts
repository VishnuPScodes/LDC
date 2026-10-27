import { rankEstimateConfig, type RankSectionKey } from './config.js';

export type MockScoreInput = {
  id: string;
  completedAt: string | Date;
  rawScore: number;
  difficulty: number;
  repeatShare: number;
  counted: boolean;
  sectionScores?: Array<{ sectionKey: RankSectionKey; marksScored: number; possibleMarks: number; marksLost: number; accuracy: number; attempted?: number }>;
};

export function questionDifficulty(firstAttempts: number, wrongFirstAttempts: number, topicAverage?: number | null) {
  if (firstAttempts >= rankEstimateConfig.difficulty.minimumFirstAttempts) {
    return clamp(wrongFirstAttempts / firstAttempts, 0, 1);
  }
  if (topicAverage !== null && topicAverage !== undefined) return clamp(topicAverage, 0, 1);
  return rankEstimateConfig.difficulty.neutralDefault;
}

export function adjustMockScore(rawScore: number, mockDifficulty: number) {
  const { adjustmentK, referenceDifficulty } = rankEstimateConfig.difficulty;
  return clamp(rawScore + adjustmentK * (mockDifficulty - referenceDifficulty), 0, 100);
}

export function estimateScore(mocks: MockScoreInput[], now: Date = new Date()) {
  const { windowDays, recencyHalfLifeDays, baseHalfWidth, minimumHalfWidth, disagreementMultiplier, repeatShareWidening } = rankEstimateConfig.averaging;
  const cutoff = now.getTime() - windowDays * 86400000;
  const used = mocks
    .filter(mock => mock.counted && new Date(mock.completedAt).getTime() >= cutoff && new Date(mock.completedAt).getTime() <= now.getTime())
    .map(mock => ({ ...mock, adjustedScore: adjustMockScore(mock.rawScore, mock.difficulty) }))
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  if (!used.length) return null;

  const weights = used.map(mock => 2 ** (-Math.max(0, (now.getTime() - new Date(mock.completedAt).getTime()) / 86400000) / recencyHalfLifeDays));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const weightedMean = used.reduce((sum, mock, index) => sum + mock.adjustedScore * weights[index], 0) / totalWeight;
  const variance = used.reduce((sum, mock, index) => sum + weights[index] * (mock.adjustedScore - weightedMean) ** 2, 0) / totalWeight;
  const spread = Math.sqrt(variance);
  const repeatShare = used.reduce((sum, mock, index) => sum + mock.repeatShare * weights[index], 0) / totalWeight;
  const halfWidth = Math.max(minimumHalfWidth, baseHalfWidth / Math.sqrt(used.length) + spread * disagreementMultiplier + repeatShare * repeatShareWidening);
  const sectionScores = rankEstimateConfig.syllabus.sections.map(section => {
    const values = used.map((mock, index) => ({ row: mock.sectionScores?.find(item => item.sectionKey === section.key), weight: weights[index] })).filter(item => item.row);
    const weight = values.reduce((sum, item) => sum + item.weight, 0);
    const avg = (key: 'marksScored' | 'possibleMarks' | 'marksLost' | 'accuracy' | 'attempted') => weight ? values.reduce((sum, item) => sum + (item.row![key] || 0) * item.weight, 0) / weight : 0;
    return { sectionKey: section.key, title: section.title, marksScored: avg('marksScored'), possibleMarks: avg('possibleMarks'), marksLost: avg('marksLost'), accuracy: avg('accuracy'), attempted: avg('attempted') };
  });
  return {
    expectedScore: round1(clamp(weightedMean, 0, 100)),
    lowScore: round1(clamp(weightedMean - halfWidth, 0, 100)),
    highScore: round1(clamp(weightedMean + halfWidth, 0, 100)),
    halfWidth: round1(halfWidth),
    mockCount: used.length,
    reliability: used.length === 1 ? 'First estimate' as const : used.length === 2 ? 'Getting sharper' as const : 'Reliable' as const,
    mocks: used,
    sectionScores,
  };
}

function clamp(value: number, minimum: number, maximum: number) { return Math.min(maximum, Math.max(minimum, value)); }
function round1(value: number) { return Math.round(value * 10) / 10; }
