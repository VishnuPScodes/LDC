import { LdcCurrentCycle, LdcHistory, RankCalibration, TestSession, User } from '../models.js';
import { rankEstimateConfig } from './config.js';
import { buildDistrictCurve, estimateRankRange, fitBand } from './curve.js';
import { estimateScore, type MockScoreInput } from './score.js';
import { calculateImprovementTips } from './tips.js';
import { buildMockTrend } from './trend.js';

export async function getUserRankEstimate(userId: string, requestedDistrict?: string) {
  const user = await User.findById(userId).select('settings').lean() as any;
  const district = requestedDistrict || user?.settings?.district || null;
  const cutoff = new Date(Date.now() - rankEstimateConfig.averaging.windowDays * 86400000);
  const sessions = await TestSession.find({
    userId, status: 'completed', 'settings.mode': 'mock', 'mockMetadata.eligibility.counted': true,
    completedAt: { $gte: cutoff },
  }).select('_id completedAt mockMetadata').sort({ completedAt: 1 }).lean() as any[];
  const allMocks = sessions.length ? sessions : await TestSession.find({ userId, 'settings.mode': 'mock' }).select('mockMetadata').sort({ startedAt: -1 }).limit(1).lean() as any[];
  const lockedReason = sessions.length ? null : allMocks[0]?.mockMetadata?.eligibility?.reason || null;
  const mocks: MockScoreInput[] = sessions.map(session => ({
    id: String(session._id), completedAt: session.completedAt,
    rawScore: session.mockMetadata.rawScore,
    difficulty: session.mockMetadata.difficulty,
    repeatShare: session.mockMetadata.repeatShare,
    counted: !!session.mockMetadata.eligibility?.counted,
    sectionScores: session.mockMetadata.sectionScores,
  }));
  const result = await getRankEstimateForMocks(mocks, district);
  if (district && result.estimate) {
    const current: any = await LdcCurrentCycle.findOne({ district }).lean();
    if (current?.examDate && new Date(current.examDate).getTime() > Date.now()) {
      const rankRange = (result.estimate as any).rankRange;
      await RankCalibration.updateOne(
        { userId, district, examDate: current.examDate, actualScore: null },
        { $set: {
          predictedAt: new Date(), predictedScore: result.estimate.expectedScore,
          predictedLowScore: result.estimate.lowScore, predictedHighScore: result.estimate.highScore,
          predictedRankLow: rankRange?.lowRank ?? null, predictedRankHigh: rankRange?.highRank ?? null,
        }, $setOnInsert: { userId, district, examDate: current.examDate } },
        { upsert: true },
      );
    }
  }
  return { ...result, lockedReason };
}

export async function getRankEstimateForMocks(mocks: MockScoreInput[], district: string | null) {
  const districtsWithHistory = await LdcHistory.distinct('district', { mainListSize: { $gt: 0 }, mainListCutoff: { $ne: null } });
  const estimate = estimateScore(mocks);
  const sectionTopics = Object.fromEntries(rankEstimateConfig.syllabus.sections.map(section => [section.key, section.topics.length ? section.topics : section.fallbackTopics]));
  const base = { district, districts: rankEstimateConfig.districts, districtsWithHistory, estimate, curveYears: [] as number[], trend: [] as any[], noHistory: false, sectionTopics, scoreMinimum: rankEstimateConfig.score.minimum, scoreMaximum: rankEstimateConfig.score.maximum, syllabusVersion: rankEstimateConfig.syllabus.version };
  if (!estimate || !district) return { ...base, trend: estimate ? buildMockTrend(mocks, null) : [] };

  const historical = await LdcHistory.find({ district, mainListSize: { $gt: 0 }, mainListCutoff: { $ne: null } })
    .sort({ examYear: -1 }).limit(rankEstimateConfig.curve.maximumCycles).lean() as any[];
  const current = await LdcCurrentCycle.findOne({ district }).lean() as any;
  const curve = buildDistrictCurve(district, historical as any, current);
  if (!curve) return { ...base, estimate: { ...estimate, tips: calculateImprovementTips(estimate.sectionScores, estimate.expectedScore, null) }, noHistory: true, trend: buildMockTrend(mocks, null) };

  const range = estimateRankRange(estimate.lowScore, estimate.highScore, curve);
  const tips = calculateImprovementTips(estimate.sectionScores, estimate.expectedScore, curve);
  return {
    ...base,
    estimate: { ...estimate, rankRange: range, fitBand: fitBand(estimate.expectedScore, curve), tips },
    curveYears: curve.years, trend: buildMockTrend(mocks, curve), noHistory: false,
  };
}
