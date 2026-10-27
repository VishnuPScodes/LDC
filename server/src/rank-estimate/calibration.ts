import { rankEstimateConfig } from './config.js';

export type CalibrationRow = { predictedScore:number;predictedLowScore:number;predictedHighScore:number;actualScore:number;predictedRankLow?:number|null;predictedRankHigh?:number|null;actualRank?:number|null };

export function calibrationMetrics(rows:CalibrationRow[]){
 const scoreRows=rows.filter(row=>Number.isFinite(row.predictedScore)&&Number.isFinite(row.actualScore));
 const rankRows=scoreRows.filter(row=>Number.isFinite(row.actualRank)&&Number.isFinite(row.predictedRankLow)&&Number.isFinite(row.predictedRankHigh));
 const mean=(values:number[])=>values.length?values.reduce((sum,value)=>sum+value,0)/values.length:null;
 const scoreErrors=scoreRows.map(row=>Math.abs(row.predictedScore-row.actualScore));
 const rankErrors=rankRows.map(row=>Math.abs((row.predictedRankLow!+row.predictedRankHigh!)/2-row.actualRank!));
 const scoreInside=scoreRows.filter(row=>row.actualScore>=row.predictedLowScore&&row.actualScore<=row.predictedHighScore).length;
 const rankInside=rankRows.filter(row=>row.actualRank!>=Math.min(row.predictedRankLow!,row.predictedRankHigh!)&&row.actualRank!<=Math.max(row.predictedRankLow!,row.predictedRankHigh!)).length;
 return {
  scoreCount:scoreRows.length,meanAbsoluteScoreError:mean(scoreErrors),scoreRangeCoverage:scoreRows.length?scoreInside/scoreRows.length:null,
  rankCount:rankRows.length,meanAbsoluteRankError:mean(rankErrors),rankRangeCoverage:rankRows.length?rankInside/rankRows.length:null,
  targetRangeCoverage:rankEstimateConfig.calibration.targetRangeCoverage,
 };
}
