import 'dotenv/config';
import mongoose from 'mongoose';
import { RankCalibration } from './models.js';
import { calibrationMetrics } from './rank-estimate/calibration.js';

async function main(){
 if(process.env.LDC_RANK_HISTORY_ADMIN!=='true')throw new Error('Set LDC_RANK_HISTORY_ADMIN=true in the trusted admin shell to run this report.');
 if(!process.env.MONGODB_URI)throw new Error('MONGODB_URI is required.');
 await mongoose.connect(process.env.MONGODB_URI);
 try{
  const rows=await RankCalibration.find({actualScore:{$ne:null}}).select('predictedScore predictedLowScore predictedHighScore actualScore predictedRankLow predictedRankHigh actualRank').lean() as any[];
  process.stdout.write(`${JSON.stringify(calibrationMetrics(rows),null,2)}\n`);
 }finally{await mongoose.disconnect()}
}
main().catch(error=>{process.stderr.write(`${error instanceof Error?error.message:String(error)}\n`);process.exitCode=1});
