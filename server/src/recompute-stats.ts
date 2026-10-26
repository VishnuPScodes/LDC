import 'dotenv/config';
import mongoose from 'mongoose';
import {getLearnerStats} from './learner-stats.js';
import {User} from './models.js';

const apply=process.argv.includes('--apply');
const userArg=process.argv.find(value=>value.startsWith('--user='))?.slice('--user='.length);

async function main(){
 await mongoose.connect(process.env.MONGODB_URI||'mongodb://127.0.0.1:27017/ldc_practice');
 const filter=userArg?{_id:userArg}:{};
 const users=await User.find(filter).select('_id learnerStatsSnapshot').lean();
 let changed=0;
 for(const user of users){
  const computed=await getLearnerStats(String(user._id));
  const snapshot={points:computed.points,level:computed.level,pointsToNextLevel:computed.pointsToNextLevel,questionsAnswered:computed.questionsAnswered,correct:computed.correct,accuracy:computed.accuracy,streak:computed.streak,bestStreak:computed.bestStreak,activeDays:computed.activeDays,sessionCount:computed.sessionCount,sessionsCompleted:computed.sessionsCompleted,mockExams:computed.mockExams,dailyGoal:computed.dailyGoal,goalDays:computed.goalDays,topicStats:computed.topicStats,coverage:computed.coverage,sessionPoints:computed.sessionPoints,sessionAwards:computed.sessionAwards,milestones:computed.milestones};
  const before=JSON.stringify(user.learnerStatsSnapshot||null),after=JSON.stringify(snapshot);
  if(before===after){console.log(`UNCHANGED ${user._id} · ${snapshot.points} points · level ${snapshot.level}`);continue}
  changed++;
  console.log(`${apply?'UPSERT':'DRY RUN'} ${user._id}: ${before==='null'?'no snapshot':before} -> ${JSON.stringify(snapshot)}`);
  if(apply)await User.updateOne({_id:user._id},{$set:{learnerStatsSnapshot:snapshot}});
 }
 console.log(`${apply?'Applied':'Dry run'}: ${changed} changed snapshots across ${users.length} users.`);
 await mongoose.disconnect();
}

main().catch(async error=>{console.error('Stats recompute failed',error);await mongoose.disconnect().catch(()=>undefined);process.exitCode=1});
