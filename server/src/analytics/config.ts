import {rankEstimateConfig} from '../rank-estimate/config.js';

export const analyticsConfig={
 cacheTtlMs:15*60*1000,
 recentWindowDays:14,
 confidenceAttempts:20,
 trendThresholdPoints:5,
 mastery:{weak:50,developing:70,good:85},
 ranges:['7','30','all'] as const,
 review:{minimumDue:10,minutesPerQuestion:2,maximumMinutes:30,priority:100},
 marks:{downTrendMultiplier:.5,questions:20,priorityMultiplier:1},
 coverage:{lowAttempts:20,lowPriorityMultiplier:1.5,priorityMultiplier:1},
 negativeMarking:{recentMocks:2,marksLost:3,minimumAccuracy:70,priority:75,questions:10},
 mockCadence:{minimumAnswered:300,days:10,priority:65},
 decline:{minimumPriorMastery:70,dropPoints:10,priority:60},
 time:{averageSeconds:50,unanswered:10,priority:55,questions:25},
 dailyPlanMinutes:45,
 minimumPersonalizedAttempts:50,
 reviewDueHours:2,
 sectionQuestionCount:20,
 fullMockQuestionCount:100,
 marking:rankEstimateConfig.marking,
 sections:rankEstimateConfig.syllabus.sections.map(section=>({
  key:section.key,title:section.title,marks:section.marks,
  topics:[...section.topics],fallbackTopics:[...section.fallbackTopics],
 })),
} as const;

export type AnalyticsRange=typeof analyticsConfig.ranges[number];
