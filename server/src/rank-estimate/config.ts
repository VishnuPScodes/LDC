export const rankEstimateConfig = {
  featureFlag: 'NEXT_PUBLIC_LDC_FEATURE_RANK_ESTIMATE',
  syllabus: {
    version: 'kerala-psc-ldc-2024',
    sourceUrl: 'https://www.keralapsc.gov.in/sites/default/files/inline-files/L%20D%20Clerks.pdf',
    sections: [
      { key: 'history', title: 'History', marks: 5, topics: ['History'], fallbackTopics: [] },
      { key: 'geography', title: 'Geography', marks: 5, topics: ['Geography'], fallbackTopics: [] },
      { key: 'economics', title: 'Economics', marks: 5, topics: ['Economics'], fallbackTopics: [] },
      { key: 'indianConstitution', title: 'Indian Constitution', marks: 5, topics: ['Indian Constitution'], fallbackTopics: [] },
      { key: 'keralaGovernance', title: 'Kerala Governance', marks: 5, topics: ['Kerala – Governance and System of Administration'], fallbackTopics: [] },
      { key: 'biologyPublicHealth', title: 'Biology and Public Health', marks: 6, topics: ['Biology and Public Health'], fallbackTopics: [] },
      { key: 'physics', title: 'Physics', marks: 3, topics: ['Physics'], fallbackTopics: [] },
      { key: 'chemistry', title: 'Chemistry', marks: 3, topics: ['Chemistry'], fallbackTopics: [] },
      { key: 'artsCultureSports', title: 'Arts, Literature, Culture and Sports', marks: 5, topics: ['Arts, Literature, Culture and Sports'], fallbackTopics: [] },
      { key: 'computerBasics', title: 'Basics of Computer', marks: 3, topics: ['Basics of Computer'], fallbackTopics: [] },
      { key: 'importantActs', title: 'Important Acts', marks: 5, topics: [], fallbackTopics: ['Indian Constitution', 'Kerala – Governance and System of Administration'] },
      { key: 'currentAffairs', title: 'Current Affairs', marks: 20, topics: ['Current Affairs'], fallbackTopics: [] },
      { key: 'arithmeticReasoning', title: 'Simple Arithmetic, Mental Ability and Reasoning', marks: 10, topics: ['Simple Arithmetic, Mental Ability and Reasoning'], fallbackTopics: [] },
      { key: 'generalEnglish', title: 'General English', marks: 10, topics: ['General English'], fallbackTopics: [] },
      { key: 'regionalLanguage', title: 'Regional Language', marks: 10, topics: ['Regional Language: Malayalam'], fallbackTopics: [] },
    ],
  },
  mock: {
    questionCount: 100,
    durationSeconds: 75 * 60,
    secondsPerQuestion: 45,
    minimumAnsweredShare: 0.7,
    maximumRepeatShare: 0.5,
    fullTimeShare: 1,
  },
  marking: { correct: 1, wrong: -1 / 3, skipped: 0 },
  difficulty: {
    minimumFirstAttempts: 30,
    neutralDefault: 0.5,
    referenceDifficulty: 0.5,
    adjustmentK: 8,
  },
  averaging: {
    windowDays: 60,
    recencyHalfLifeDays: 14,
    baseHalfWidth: 7,
    minimumHalfWidth: 3,
    disagreementMultiplier: 1,
    repeatShareWidening: 2,
  },
  curve: {
    maximumCycles: 3,
    cycleWeights: [0.5, 0.3, 0.2],
    attendanceRatioDefault: null as number | null,
    simulationDraws: 5000,
    simulationLowPercentile: 0.1,
    simulationHighPercentile: 0.9,
    rankRoundingBelow1000: 50,
    rankRoundingAtOrAbove1000: 100,
    outsideAnchorWidening: 3,
    strongPositionMargin: 5,
    nearSupplementaryMargin: 5,
  },
  improvement: {
    targetAccuracyIncrease: 15,
    maximumTargetAccuracy: 90,
    wrongMarksLostThreshold: 3,
    wrongToSkipShare: 0.5,
    fewCurrentAffairsAttempts: 8,
    tipLimit: 3,
  },
  calibration: { targetRangeCoverage: 0.8 },
  districts: [
    'Thiruvananthapuram', 'Kollam', 'Pathanamthitta', 'Alappuzha', 'Kottayam',
    'Idukki', 'Ernakulam', 'Thrissur', 'Palakkad', 'Malappuram', 'Kozhikode',
    'Wayanad', 'Kannur', 'Kasaragod',
  ],
} as const;

export type RankSectionConfig = (typeof rankEstimateConfig.syllabus.sections)[number];
export type RankSectionKey = RankSectionConfig['key'];

export const rankSyllabusQuestionTotal = rankEstimateConfig.syllabus.sections.reduce((sum, section) => sum + section.marks, 0);
