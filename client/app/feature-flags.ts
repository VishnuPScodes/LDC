export const featureFlags = {
  examCountdown: process.env.NEXT_PUBLIC_LDC_FEATURE_EXAM_COUNTDOWN !== 'false',
  points: process.env.NEXT_PUBLIC_LDC_FEATURE_POINTS !== 'false',
  journey: process.env.NEXT_PUBLIC_LDC_FEATURE_JOURNEY !== 'false',
  milestones: process.env.NEXT_PUBLIC_LDC_FEATURE_MILESTONES !== 'false',
  progressInsights: process.env.NEXT_PUBLIC_LDC_FEATURE_PROGRESS_INSIGHTS !== 'false',
  todaySummary: process.env.NEXT_PUBLIC_LDC_FEATURE_TODAY_SUMMARY !== 'false',
  rankEstimate: process.env.NEXT_PUBLIC_LDC_FEATURE_RANK_ESTIMATE !== 'false',
};

