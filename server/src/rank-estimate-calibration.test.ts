import test from 'node:test';
import assert from 'node:assert/strict';
import { calibrationMetrics } from './rank-estimate/calibration.js';
import { rankEstimateConfig } from './rank-estimate/config.js';

test('calibration report computes aggregate score error and interval coverage without returning user rows',()=>{
 const metrics=calibrationMetrics([
  {predictedScore:70,predictedLowScore:65,predictedHighScore:75,actualScore:72,predictedRankLow:900,predictedRankHigh:1200,actualRank:1100},
  {predictedScore:80,predictedLowScore:75,predictedHighScore:85,actualScore:90,predictedRankLow:500,predictedRankHigh:700,actualRank:900},
 ]);
 assert.equal(metrics.meanAbsoluteScoreError,6);
 assert.equal(metrics.scoreRangeCoverage,.5);
 assert.equal(metrics.rankCount,2);
 assert.equal(metrics.meanAbsoluteRankError,175);
 assert.equal(metrics.rankRangeCoverage,.5);
 assert.equal(metrics.targetRangeCoverage,rankEstimateConfig.calibration.targetRangeCoverage);
 assert.equal('userId' in metrics,false);
});

test('empty calibration data reports unavailable metrics rather than misleading zero error',()=>{
 const metrics=calibrationMetrics([]);
 assert.equal(metrics.scoreCount,0);
 assert.equal(metrics.meanAbsoluteScoreError,null);
 assert.equal(metrics.scoreRangeCoverage,null);
 assert.equal(metrics.rankCount,0);
 assert.equal(metrics.meanAbsoluteRankError,null);
 assert.equal(metrics.rankRangeCoverage,null);
});

test('rank coverage excludes records without an actual rank or a predicted rank range',()=>{
 const metrics=calibrationMetrics([
  {predictedScore:70,predictedLowScore:65,predictedHighScore:75,actualScore:70,predictedRankLow:null,predictedRankHigh:null,actualRank:1000},
  {predictedScore:70,predictedLowScore:65,predictedHighScore:75,actualScore:70,predictedRankLow:500,predictedRankHigh:700,actualRank:null},
 ]);
 assert.equal(metrics.scoreCount,2);
 assert.equal(metrics.rankCount,0);
 assert.equal(metrics.rankRangeCoverage,null);
});
