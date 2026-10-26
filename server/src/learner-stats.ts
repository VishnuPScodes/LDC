import { Question,TestSession,User } from './models.js';
import {isTopicMastered} from './journey-mastery.js';
import {dayKey} from './stats-date.js';
import {computeMilestones} from './milestones.js';

export function pointsForLevel(level:number){return level<=1?0:Math.ceil(100*Math.pow(level-1,1.5))}
export function levelForPoints(points:number){let level=1;while(pointsForLevel(level+1)<=points)level++;return level}

type Answer={questionId:any;selectedOption?:string;isCorrect?:boolean|null;answeredAt?:Date|string;timeTakenMs?:number};
type Session={_id?:any;id?:string;settings?:any;answers?:Answer[];status?:string;quitEarly?:boolean;startedAt?:Date|string;completedAt?:Date|string;score?:any};
type QuestionInfo={_id?:any;id?:string;topic:string;paperNumber?:number;paperCode?:string;correctOption?:string|null;eligibleForPractice?:boolean;needsReview?:boolean};

export function computeLearnerStats(sessions:Session[],questionRows:QuestionInfo[],dailyGoal=20,now=new Date()){
 const questions=new Map(questionRows.map(question=>[String(question._id||question.id),question]));
 const events=sessions.flatMap(session=>(session.answers||[]).filter(answer=>!!answer.selectedOption&&answer.answeredAt).map(answer=>({session,answer,question:questions.get(String(answer.questionId)),date:new Date(answer.answeredAt as any)}))).filter(event=>event.question);
 events.sort((a,b)=>a.date.getTime()-b.date.getTime());
 const allTopicRows=new Map<string,{topic:string;attempts:number;correct:number;recent:{correct:boolean;date:string}[];questions:number}>(),coveredByTopic=new Map<string,Set<string>>();
 for(const question of questionRows){const row=allTopicRows.get(question.topic)||{topic:question.topic,attempts:0,correct:0,recent:[],questions:0};if(question.eligibleForPractice&&!question.needsReview)row.questions++;allTopicRows.set(question.topic,row)}
 const answeredByDay=new Map<string,Set<string>>(),goalForDay=new Map<string,number>(),lastSessionByDay=new Map<string,string>(),practicePointsByDay=new Map<string,number>(),paidPracticeQuestionDays=new Set<string>(),pointsPerDay=new Map<string,number>(),sessionPointMap=new Map<string,number>(),activityByDay=new Map<string,{attempts:number;correct:number;topics:Map<string,{attempts:number;correct:number}>}>(),goalDays=new Set<string>(),mockTrend:any[]=[];
 let correct=0,points=0,reviewPoints=0,mockBonus=0;
 for(const event of events){const {session,answer,question,date}=event;const day=dayKey(date),id=String(answer.questionId),topic=allTopicRows.get(question!.topic)!;topic.attempts++;if(answer.isCorrect)topic.correct++;
  topic.recent.push({correct:!!answer.isCorrect,date:date.toISOString()});
  const daySet=answeredByDay.get(day)||new Set<string>();daySet.add(id);answeredByDay.set(day,daySet);goalForDay.set(day,goalForDay.get(day)||session.settings?.dailyGoal||dailyGoal);const sessionId=String(session._id||session.id||'unknown');lastSessionByDay.set(day,sessionId);
  const activity=activityByDay.get(day)||{attempts:0,correct:0,topics:new Map<string,{attempts:number;correct:number}>()};activity.attempts++;if(answer.isCorrect)activity.correct++;const activityTopic=activity.topics.get(question!.topic)||{attempts:0,correct:0};activityTopic.attempts++;if(answer.isCorrect)activityTopic.correct++;activity.topics.set(question!.topic,activityTopic);activityByDay.set(day,activity);
  if(question!.eligibleForPractice&&!question!.needsReview){const covered=coveredByTopic.get(question!.topic)||new Set<string>();covered.add(id);coveredByTopic.set(question!.topic,covered)}
  const uniqueKey=`${day}:${id}`,firstPracticeAttempt=!!session.settings?.reviewOnly||!paidPracticeQuestionDays.has(uniqueKey);if(!session.settings?.reviewOnly)paidPracticeQuestionDays.add(uniqueKey);
  if(answer.isCorrect){correct++;if(session.settings?.reviewOnly){points+=3;reviewPoints+=3;pointsPerDay.set(day,(pointsPerDay.get(day)||0)+3);sessionPointMap.set(sessionId,(sessionPointMap.get(sessionId)||0)+3)}else if(firstPracticeAttempt){const daily=practicePointsByDay.get(day)||0;const amount=Math.min(2,Math.max(0,300-daily));practicePointsByDay.set(day,daily+amount);points+=amount;pointsPerDay.set(day,(pointsPerDay.get(day)||0)+amount);sessionPointMap.set(sessionId,(sessionPointMap.get(sessionId)||0)+amount)}}
 }
 for(const [key,row] of allTopicRows){row.recent=row.recent.slice(-20);allTopicRows.set(key,row)}
 for(const [day,items] of answeredByDay){if(items.size>=(goalForDay.get(day)||dailyGoal)){goalDays.add(day);points+=10;pointsPerDay.set(day,(pointsPerDay.get(day)||0)+10);const sessionId=lastSessionByDay.get(day)||'unknown';sessionPointMap.set(sessionId,(sessionPointMap.get(sessionId)||0)+10)}}
 for(const session of sessions){if(session.settings?.mode!=='mock'||session.status!=='completed'||session.quitEarly)continue;const answers=(session.answers||[]).filter(answer=>!!answer.selectedOption);if(!answers.length)continue;const scoreAccuracy=answers.filter(answer=>answer.isCorrect).length/answers.length*100;const bonus=20+Math.floor(scoreAccuracy/10);const key=dayKey(session.completedAt||session.startedAt||now),sessionId=String(session._id||session.id||'unknown');points+=bonus;mockBonus+=bonus;pointsPerDay.set(key,(pointsPerDay.get(key)||0)+bonus);sessionPointMap.set(sessionId,(sessionPointMap.get(sessionId)||0)+bonus);mockTrend.push({date:key,accuracy:Math.round(scoreAccuracy),points:bonus})}
 const currentDay=dayKey(now),todayCount=answeredByDay.get(currentDay)?.size||0;
 const metDays=[...goalDays].sort();let streak=0,cursor=new Date(now);if(!goalDays.has(currentDay))cursor.setDate(cursor.getDate()-1);while(goalDays.has(dayKey(cursor))){streak++;cursor.setDate(cursor.getDate()-1)}
 let bestStreak=0,run=0,previous:Date|null=null;for(const key of metDays){const [year,month,day]=key.split('-').map(Number),date=new Date(Date.UTC(year,month-1,day));if(previous&&(date.getTime()-previous.getTime())/86400000===1)run++;else run=1;bestStreak=Math.max(bestStreak,run);previous=date}
 const level=levelForPoints(points),nextLevelPoints=pointsForLevel(level+1),currentLevelPoints=pointsForLevel(level),nextPoints=nextLevelPoints-points;
 let runningSessionPoints=0;const sessionAwards:any={};for(const session of [...sessions].sort((a,b)=>new Date(a.completedAt||a.startedAt||now).getTime()-new Date(b.completedAt||b.startedAt||now).getTime())){const id=String(session._id||session.id||'unknown'),earned=sessionPointMap.get(id)||0,before=levelForPoints(runningSessionPoints);runningSessionPoints+=earned;sessionAwards[id]={points:earned,levelBefore:before,levelAfter:levelForPoints(runningSessionPoints),pointsToNextLevel:Math.max(0,pointsForLevel(levelForPoints(runningSessionPoints)+1)-runningSessionPoints)}}
 const totalAnswered=events.length,accuracy=totalAnswered?correct/totalAnswered*100:0;
 const topicStats=[...allTopicRows.values()].map(row=>{const recentAccuracy=row.recent.length?row.recent.filter(x=>x.correct).length/row.recent.length*100:0,attempted=coveredByTopic.get(row.topic)?.size||0;return{...row,attempted,total:row.questions,questionsLeft:Math.max(0,row.questions-attempted),accuracy:row.attempts?row.correct/row.attempts*100:0,recentAccuracy,mastered:isTopicMastered(row.recent.map(x=>x.correct))}});
 const milestones=computeMilestones(events as any,sessions,questionRows as any,dailyGoal,level,sessionAwards,now);
 const sessionsCompleted=sessions.filter(session=>session.status==='completed').length,mockExams=sessions.filter(session=>session.status==='completed'&&session.settings?.mode==='mock').length;
 const activeDays=new Set(events.map(event=>dayKey(event.date))).size;
 const dailyActivity=[...activityByDay].sort(([a],[b])=>a.localeCompare(b)).map(([date,activity])=>({date,count:answeredByDay.get(date)?.size||0,attempts:activity.attempts,correct:activity.correct,goal:goalForDay.get(date)||dailyGoal,goalMet:goalDays.has(date),points:pointsPerDay.get(date)||0,topics:[...activity.topics].map(([topic,value])=>({topic,...value}))}));
 return {points,level,nextLevelPoints,currentLevelPoints,pointsToNextLevel:nextPoints,levelProgress:Math.max(0,Math.min(100,(points-currentLevelPoints)/(nextLevelPoints-currentLevelPoints)*100)),questionsAnswered:totalAnswered,correct,accuracy,todayCount,todayAccuracy:(()=>{const today=events.filter(event=>dayKey(event.date)===currentDay);return today.length?today.filter(event=>event.answer.isCorrect).length/today.length*100:0})(),activeDays,sessionCount:sessions.length,sessionsCompleted,mockExams,streak,bestStreak,dailyGoal,goalDays:[...goalDays],dailyActivity,topicActivity:[...activityByDay].flatMap(([date,activity])=>[...activity.topics].map(([topic,value])=>({date,topic,...value}))),topicStats,topicsMastered:topicStats.filter(row=>row.mastered).length,mockTrend:mockTrend.sort((a,b)=>a.date.localeCompare(b.date)),sessionPoints:Object.fromEntries(sessionPointMap),sessionAwards,milestones,pointsEarnedToday:pointsPerDay.get(currentDay)||0,pointsBreakdown:{practice:points-reviewPoints-mockBonus-goalDays.size*10,review:reviewPoints,mock:mockBonus,goal:goalDays.size*10},coverage:{attempted:new Set(events.filter(event=>event.question?.eligibleForPractice&&!event.question.needsReview).map(event=>String(event.answer.questionId))).size,total:questionRows.filter(question=>question.eligibleForPractice&&!question.needsReview).length}};
}

export async function getLearnerStats(userId:string,now=new Date()){
 const [user,sessions]=await Promise.all([User.findById(userId).select('settings').lean(),TestSession.find({userId}).sort({startedAt:1}).lean()]);
 const ids=[...new Set(sessions.flatMap((session:any)=>(session.questionIds||[]).map((id:any)=>String(id))))];
 const questionRows=await Question.find({$or:[{_id:{$in:ids}},{eligibleForPractice:true,needsReview:false}]}).select('_id topic paperNumber paperCode correctOption eligibleForPractice needsReview').lean();
 return computeLearnerStats(sessions as any,questionRows as any,(user as any)?.settings?.dailyGoal||20,now);
}
