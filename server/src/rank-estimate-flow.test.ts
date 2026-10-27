import test from 'node:test';
import assert from 'node:assert/strict';
import { estimateRankRange, buildDistrictCurve, type HistoryCycle } from './rank-estimate/curve.js';
import { estimateScore } from './rank-estimate/score.js';
import { buildMockTrend } from './rank-estimate/trend.js';
import { evaluateMockRankEligibility } from './mock-exam.js';
import { rankEstimateConfig } from './rank-estimate/config.js';

const now=new Date('2026-10-27T00:00:00.000Z');
const mock=(id:string,daysAgo:number,rawScore:number,counted=true)=>({id,completedAt:new Date(now.getTime()-daysAgo*86400000),rawScore,difficulty:rankEstimateConfig.difficulty.referenceDifficulty,repeatShare:0,counted});
// Synthetic values below are TEST ONLY fixtures and must never be imported into production.
const fixture:HistoryCycle[]=[
 {district:'Thrissur',examYear:2023,notificationNo:'TEST ONLY',applicants:20000,attendees:10000,mainListSize:1000,mainListCutoff:70,supplementaryListSize:500,supplementaryListCutoff:60,topScore:95},
 {district:'Kozhikode',examYear:2023,notificationNo:'TEST ONLY',applicants:30000,attendees:18000,mainListSize:1800,mainListCutoff:62,supplementaryListSize:700,supplementaryListCutoff:55,topScore:90},
];

test('TEST ONLY journey: first mock gives a wide estimate and two more add trend points and narrow it',()=>{
 const mocks=[mock('TEST ONLY 1',20,67),mock('TEST ONLY 2',7,68),mock('TEST ONLY 3',0,69)];
 const first=estimateScore(mocks.slice(0,1),now)!,all=estimateScore(mocks,now)!,trend=buildMockTrend(mocks,buildDistrictCurve('Thrissur',fixture,{applicants:20000,expectedAttendanceRatio:.5}));
 assert.equal(first.reliability,'First estimate');
 assert.equal(first.halfWidth,7);
 assert.equal(all.reliability,'Reliable');
 assert.ok(all.halfWidth<first.halfWidth);
 assert.equal(trend.length,3);
 assert.equal(trend[0].expectedScore,67);
 assert.equal(trend.at(-1).expectedScore,all.expectedScore);
 assert.ok(trend[0].rankRange.highRank>trend.at(-1).rankRange.highRank);
});

test('TEST ONLY district change uses separate data and changes the displayed range',()=>{
 const estimate=estimateScore([mock('TEST ONLY',0,69)],now)!;
 const first=buildDistrictCurve('Thrissur',fixture,{applicants:20000,expectedAttendanceRatio:.5})!;
 const second=buildDistrictCurve('Kozhikode',fixture,{applicants:30000,expectedAttendanceRatio:.6})!;
 const firstRange=estimateRankRange(estimate.lowScore,estimate.highScore,first),secondRange=estimateRankRange(estimate.lowScore,estimate.highScore,second);
 assert.notDeepEqual(firstRange,secondRange);
});

test('TEST ONLY quit-early mock stays uncounted and does not add an estimate or trend point',()=>{
 const counted=[mock('TEST ONLY counted',0,72)];
 const quitEligibility=evaluateMockRankEligibility({quitEarly:true,durationSeconds:rankEstimateConfig.mock.durationSeconds,elapsedSeconds:500,answeredCount:20,questionCount:100,repeatShare:0});
 const uncounted=mock('TEST ONLY quit',0,98,quitEligibility.counted);
 assert.equal(quitEligibility.counted,false);
 assert.equal(estimateScore([...counted,uncounted],now)?.mockCount,1);
 assert.equal(buildMockTrend([...counted,uncounted],null).length,1);
});
