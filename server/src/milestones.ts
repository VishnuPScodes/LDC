import {milestoneCatalog} from './milestone-config.js';
import {JOURNEY_MASTERY} from './journey-config.js';
import {dayKey} from './stats-date.js';

type Event={session:any;answer:any;question:any;date:Date};

export function computeMilestones(events:Event[],sessions:any[],questions:any[],dailyGoal:number,level:number,sessionAwards:Record<string,any>,now=new Date()){
 const earned=new Map<string,Date>(),earnedInSession=new Map<string,string>(),topicHistory=new Map<string,boolean[]>(),masteredTopics=new Set<string>(),answeredPerDay=new Map<string,Set<string>>(),goalForDay=new Map<string,number>(),lastSessionByDay=new Map<string,string>();
 const record=(id:string,date:Date,sessionId?:string)=>{if(!earned.has(id)){earned.set(id,date);if(sessionId)earnedInSession.set(id,sessionId)}};
 let answered=0;
 for(const event of events){
  answered++;const sessionId=String(event.session._id||event.session.id||'');record('first-question',event.date,sessionId);
  for(const target of [100,500,1000,5000])if(answered>=target)record(`questions-${target}`,event.date,sessionId);
  const topic=event.question.topic,history=topicHistory.get(topic)||[];history.push(!!event.answer.isCorrect);if(history.length>JOURNEY_MASTERY.attempts)history.shift();topicHistory.set(topic,history);
  if(history.length>=JOURNEY_MASTERY.attempts&&history.filter(Boolean).length/history.length>=JOURNEY_MASTERY.accuracy&&!masteredTopics.has(topic)){masteredTopics.add(topic);record('topic-1',event.date,sessionId);for(const target of [5,7,10,14])if(masteredTopics.size>=target){record(target===7?'journey-halfway':target===14?'exam-ready':`topics-${target}`,event.date,sessionId)}}
  const day=dayKey(event.date),questionsForDay=answeredPerDay.get(day)||new Set<string>();questionsForDay.add(String(event.answer.questionId));answeredPerDay.set(day,questionsForDay);goalForDay.set(day,goalForDay.get(day)||event.session.settings?.dailyGoal||dailyGoal);lastSessionByDay.set(day,sessionId);
 }
 const completed=[...sessions].filter(session=>session.status==='completed').sort((a,b)=>new Date(a.completedAt||a.startedAt||now).getTime()-new Date(b.completedAt||b.startedAt||now).getTime());
 const firstSession=completed[0];if(firstSession)record('first-session',new Date(firstSession.completedAt||firstSession.startedAt||now),String(firstSession._id||firstSession.id));
 const firstMock=completed.find(session=>session.settings?.mode==='mock');if(firstMock)record('first-mock',new Date(firstMock.completedAt||firstMock.startedAt||now),String(firstMock._id||firstMock.id));
 const eligibleByPaper=new Map<number,number>();for(const question of questions)if(question.paperNumber&&question.eligibleForPractice&&!question.needsReview)eligibleByPaper.set(question.paperNumber,(eligibleByPaper.get(question.paperNumber)||0)+1);
 const questionsById=new Map(questions.map(question=>[String(question._id||question.id),question]));
 for(const session of completed){const ids=(session.questionIds||[]).map((id:any)=>String(id)),paperNumbers=new Set(ids.map((id:string)=>questionsById.get(id)?.paperNumber).filter(Boolean));if(ids.length&&paperNumbers.size===1){const paper=[...paperNumbers][0] as number;if(ids.length>=(eligibleByPaper.get(paper)||Infinity)){record('full-paper',new Date(session.completedAt||session.startedAt||now),String(session._id||session.id));break}}}
 const goalDays=[...answeredPerDay].filter(([day,ids])=>ids.size>=(goalForDay.get(day)||dailyGoal)).map(([day])=>day).sort();let run=0,bestRun=0,previous:Date|null=null;
 for(const day of goalDays){const [year,month,date]=day.split('-').map(Number),value=new Date(Date.UTC(year,month-1,date)),sessionId=lastSessionByDay.get(day);run=previous&&(value.getTime()-previous.getTime())/86400000===1?run+1:1;bestRun=Math.max(bestRun,run);previous=value;if(run>=7)record('streak-7',new Date(Date.UTC(year,month-1,date,12)),sessionId);if(run>=30)record('streak-30',new Date(Date.UTC(year,month-1,date,12)),sessionId)}
 const sessionById=new Map(sessions.map(session=>[String(session._id||session.id),session]));for(const [id,award] of Object.entries(sessionAwards)){if(award.levelAfter>award.levelBefore){const session=sessionById.get(id);if(session)for(let reached=award.levelBefore+1;reached<=award.levelAfter;reached++)record(`level-${reached}`,new Date(session.completedAt||session.startedAt||now),id)}}
 const catalog=milestoneCatalog(level),byId=new Map(catalog.map(item=>[item.id,item]));
 for(const item of catalog){if(!earned.has(item.id))continue;const dependencies=item.dependsOn||[];if(dependencies.some(id=>!earned.has(id))){earned.delete(item.id);earnedInSession.delete(item.id);continue}const dependency=dependencies.map(id=>({id,date:earned.get(id)!})).sort((a,b)=>b.date.getTime()-a.date.getTime())[0];if(dependency&&dependency.date>earned.get(item.id)!){earned.set(item.id,dependency.date);const sessionId=earnedInSession.get(dependency.id);if(sessionId)earnedInSession.set(item.id,sessionId)}}
 const currentByType:Record<string,number>={questions:events.length,sessions:completed.length,mocks:completed.filter(session=>session.settings?.mode==='mock').length,topics:masteredTopics.size,streak:bestRun,paper:earned.has('full-paper')?1:0,level};
 return catalog.map(item=>{const date=earned.get(item.id),current=Math.min(item.target,currentByType[item.type]||0);return{...item,earned:!!date,earnedAt:date?.toISOString()||null,sessionId:earnedInSession.get(item.id)||null,current,progress:`${current} / ${item.target}`}}).sort((a,b)=>{if(a.earned!==b.earned)return a.earned?-1:1;if(a.earnedAt&&b.earnedAt)return a.earnedAt.localeCompare(b.earnedAt);return a.title.localeCompare(b.title)});
}
