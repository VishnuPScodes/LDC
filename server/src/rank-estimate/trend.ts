import { estimateScore, type MockScoreInput } from './score.js';
import { estimateRankRange, type DistrictCurve } from './curve.js';

export function buildMockTrend(mocks:MockScoreInput[],curve:DistrictCurve|null){
 const ordered=mocks.filter(mock=>mock.counted).sort((a,b)=>new Date(a.completedAt).getTime()-new Date(b.completedAt).getTime()),trend:any[]=[];
 for(let index=0;index<ordered.length;index++){
  const prefix=ordered.slice(0,index+1),estimate=estimateScore(prefix,new Date(prefix.at(-1)!.completedAt));
  if(!estimate)continue;
  trend.push({completedAt:prefix.at(-1)!.completedAt,expectedScore:estimate.expectedScore,lowScore:estimate.lowScore,highScore:estimate.highScore,rankRange:curve?estimateRankRange(estimate.lowScore,estimate.highScore,curve):null});
 }
 return trend;
}
