import { rankEstimateConfig, type RankSectionKey } from './config.js';
import type { DistrictCurve } from './curve.js';
import { rankAtScore } from './curve.js';

export type ImprovementSection = {
  sectionKey: RankSectionKey; title: string; marksScored: number; possibleMarks: number;
  accuracy: number; marksLost: number; attempted?: number;
};

export function calculateImprovementTips(sections: ImprovementSection[], expectedScore: number, curve: DistrictCurve | null) {
  const tips: Array<{
    kind: 'section' | 'negative-marking' | 'current-affairs-sample';
    sectionKey?: RankSectionKey; title: string; currentAccuracy?: number; targetAccuracy?: number;
    marksGain: number; rankGain: number | null; attempted?: number;
  }> = [];

  for (const section of sections) {
    const attempted = section.attempted ?? Math.max(0, section.possibleMarks);
    if (attempted <= 0) continue;
    const targetAccuracy = Math.min(rankEstimateConfig.improvement.maximumTargetAccuracy, section.accuracy + rankEstimateConfig.improvement.targetAccuracyIncrease);
    const accuracyGain = Math.max(0, targetAccuracy - section.accuracy) / 100;
    const marksGain = accuracyGain * attempted * (1 - rankEstimateConfig.marking.wrong);
    if (marksGain > 0) tips.push({
      kind: 'section', sectionKey: section.sectionKey, title: section.title,
      currentAccuracy: section.accuracy, targetAccuracy, marksGain,
      rankGain: estimateRankGain(expectedScore, marksGain, curve), attempted,
    });
  }

  const totalMarksLost = sections.reduce((sum, section) => sum + section.marksLost, 0);
  if (totalMarksLost > rankEstimateConfig.improvement.wrongMarksLostThreshold) {
    const marksGain = totalMarksLost * rankEstimateConfig.improvement.wrongToSkipShare;
    tips.push({
      kind: 'negative-marking', title: 'Skip more uncertain answers', marksGain,
      rankGain: estimateRankGain(expectedScore, marksGain, curve),
    });
  }

  const currentAffairs = sections.find(section => section.sectionKey === 'currentAffairs');
  if (currentAffairs && (currentAffairs.attempted || 0) < rankEstimateConfig.improvement.fewCurrentAffairsAttempts) {
    tips.push({
      kind: 'current-affairs-sample', sectionKey: 'currentAffairs', title: 'Practise Current Affairs',
      marksGain: 0, rankGain: null, attempted: currentAffairs.attempted || 0,
    });
  }

  return tips.sort((a, b) => (b.rankGain ?? b.marksGain) - (a.rankGain ?? a.marksGain)).slice(0, rankEstimateConfig.improvement.tipLimit);
}

function estimateRankGain(score: number, marksGain: number, curve: DistrictCurve | null) {
  if (!curve) return null;
  const before = rankAtScore(score, curve).rank;
  const after = rankAtScore(Math.min(100, score + marksGain), curve).rank;
  const gain = Math.max(0, before - after);
  const step = rankEstimateConfig.improvement.rankGainRounding;
  return gain < step / 2 ? 0 : Math.round(gain / step) * step;
}
