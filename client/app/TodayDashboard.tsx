'use client';
import {useEffect,useState} from 'react';
import {featureFlags} from './feature-flags';
import {daysUntilExam} from '../../server/src/exam-countdown';
import PointsLevelCard from './PointsLevelCard';
import RankEstimateCard from './RankEstimateCard';
import {topicLabel} from './topic-labels';
import MotivationQuoteCard from './MotivationQuoteCard';

type Topic = { topic: string; marks: number };
type TopicProgress = { topic: string; attempted: number; total: number; attempts: number; correct: number; accuracy: number };

type Props = {
  name: string;
  dailyCount: number;
  dailyGoal: number;
  streak: number;
  progress: any;
  syllabus: Topic[];
  onStart: (config?: any) => void;
  onPracticeTopic: (topic: string) => void;
  onContinuePdf: () => void;
  onOpenSyllabus: () => void;
  reviewDue?: number;
  reviewTomorrow?: number;
  weekDays?: boolean[];
  unfinishedSession?: any;
  onResume?: (session:any)=>void;
  language?: 'en'|'ml';
  targetExamDate?: string;
  onOpenSettings?:()=>void;
  learnerStats?:any;
  onOpenReview?:()=>void;
  onStartMock?:()=>void;
  loading?:boolean;
};

export default function TodayDashboard({ name, dailyCount, dailyGoal, streak, progress, syllabus, onStart, onContinuePdf, onOpenSyllabus, reviewDue = 0, reviewTomorrow=0, weekDays = [],unfinishedSession,onResume,language='en',targetExamDate,onOpenSettings,learnerStats,onOpenReview,onStartMock,loading=false }: Props) {
  const ml=language==='ml';
  const [celebrate,setCelebrate]=useState(false);
  const topicStats: TopicProgress[] = progress?.coverage?.byTopic || [];
  const bestFocus = [...syllabus].map(topic => {
    const stats = topicStats.find(row => row.topic === topic.topic);
    const attempts = stats?.attempts || 0;
    const accuracy = stats?.accuracy || 0;
    return { ...topic, attempts, accuracy, priority: topic.marks * (attempts ? 1 - accuracy / 100 : 1) };
  }).sort((a, b) => b.priority - a.priority)[0];
  const planFocus=loading?undefined:bestFocus;
  const percent = Math.min(100, Math.round(dailyCount / dailyGoal * 100));
  const circumference = 2 * Math.PI * 33;
  useEffect(()=>{if(percent<100)return;const now=new Date(),day=`${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`,key='ldc-goal-celebrated';if(localStorage.getItem(key)===day)return;localStorage.setItem(key,day);setCelebrate(true);const timer=window.setTimeout(()=>setCelebrate(false),1300);return()=>window.clearTimeout(timer)},[percent]);

  return <div className="today-page">
    <section className="today-heading">
      <div><h1 className="title">{ml?`നമസ്കാരം, ${name}`:`Good ${new Date().getHours() < 12 ? 'morning' : 'day'}, ${name}.`}</h1><p className="today-subtitle">{ml?'ചെറിയൊരു പരിശീലനവും വലിയ മുന്നേറ്റമാണ്.':'A steady session is progress. Let’s take the next step.'}</p>{featureFlags.examCountdown&&<p className="exam-countdown">{targetExamDate?countdownText(daysUntilExam(targetExamDate),ml):<button type="button" className="text-button" onClick={onOpenSettings}>{ml?'പരീക്ഷാ തീയതി ചേർക്കുക':'Set your exam date'}</button>}</p>}</div>
    </section>

    <MotivationQuoteCard language={language}/>

    {loading&&<div className="today-placeholder" aria-hidden="true"/>}
    {!loading&&featureFlags.todaySummary&&dailyCount>0&&<section className="today-summary-card" aria-label={ml?'ഇന്നത്തെ സംഗ്രഹം':'Today summary'}><div className="eyebrow">{ml?'ഇന്നത്തെ സംഗ്രഹം':'TODAY SO FAR'}</div><div className="today-summary-stats"><span><strong>{dailyCount}</strong>{ml?' ചോദ്യങ്ങൾ':' questions'}</span><span><strong>{Math.round(learnerStats?.todayAccuracy||0)}%</strong>{ml?' കൃത്യത':' accuracy'}</span><span><strong>+{learnerStats?.pointsEarnedToday||0}</strong>{ml?' പോയിന്റുകൾ':' points'}</span></div></section>}

    <div className="motivation-cards"><section className={`daily-goal-card${percent >= 100 ? ' goal-done' : ''}`} aria-label="Daily question goal">
      {celebrate&&<span className="goal-confetti" aria-hidden="true">{Array.from({length:7},(_,i)=><i key={i} style={{'--particle':i} as any}/>)}</span>}
      <div className="goal-ring" role="progressbar" aria-label="Daily goal progress" aria-valuemin={0} aria-valuemax={dailyGoal} aria-valuenow={Math.min(dailyCount, dailyGoal)}>
        <svg viewBox="0 0 76 76" aria-hidden="true"><circle className="goal-track" cx="38" cy="38" r="33"/><circle className="goal-progress" cx="38" cy="38" r="33" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - percent / 100)}/></svg>
        <span>{percent >= 100 ? '✓' : `${percent}%`}</span>
      </div>
      <div className="goal-copy"><div className="eyebrow">{ml?'ദൈനംദിന ലക്ഷ്യം':'DAILY GOAL'}</div><h2>{percent >= 100 ? (ml?'ലക്ഷ്യം പൂർത്തിയായി':'Goal complete') : (ml?'ഓരോ ചോദ്യമായി':'One question at a time')}</h2><p>{ml?`ഇന്ന് ${dailyGoal}ൽ ${dailyCount} ചോദ്യങ്ങൾ`:`${dailyCount} of ${dailyGoal} questions today`}</p></div>
      <div className="goal-count"><strong>{Math.min(dailyCount, dailyGoal)}</strong><span>/ {dailyGoal}</span></div>
      <div className="goal-streak" aria-label={`${streak} day streak`}><span aria-hidden="true">🔥</span><strong>{streak}-day streak</strong></div>
    </section>{featureFlags.points&&<PointsLevelCard stats={learnerStats} language={language}/>}</div>

    {featureFlags.rankEstimate&&<RankEstimateCard language={language} onStart={onStartMock}/>}

    <section className="today-plan card">
      <div className="plan-copy"><div className="eyebrow">{ml?'ഇന്നത്തെ പദ്ധതി':'TODAY’S PLAN'}</div><h2>{planFocus?topicLabel(planFocus.topic,language):(ml?'ഒരു ചെറിയ പരിശീലന സെഷൻ':'A short practice session')}</h2><p>{planFocus ? `${Math.max(1, Math.min(10, dailyGoal - dailyCount || 10))} ${ml?'ചോദ്യങ്ങൾ':'focused questions'} · ${planFocus.marks} ${ml?'സിലബസ് മാർക്കുകൾ':'syllabus marks'}${planFocus.attempts >= 10 ? ` · ${Math.round(planFocus.accuracy)}% ${ml?'കൃത്യത':'accuracy'}` : ''}` : (ml?'ലഭ്യമായ ചോദ്യങ്ങളിൽ നിന്നുള്ള പരിശീലനം.':'A gentle mix from your eligible question bank.')}</p><span className="plan-note">{ml?'ആവർത്തനം:':'Review due:'} {reviewDue}{reviewTomorrow?` · ${reviewTomorrow} ${ml?'നാളെ':'tomorrow'}`:''}</span></div>
      <button className="button plan-start" type="button" onClick={() => onStart(planFocus ? { topics: [planFocus.topic] } : {})}>{ml?'തുടങ്ങുക':'Start'} <span aria-hidden="true">→</span></button>
    </section>

    <div className="today-quick-links">{unfinishedSession&&<button className="text-button" type="button" onClick={()=>onResume?.(unfinishedSession)}>{ml?'സെഷൻ തുടരുക':'Continue session'} →</button>}{featureFlags.todaySummary&&reviewDue>0&&<button className="text-button" type="button" onClick={onOpenReview}>{ml?`${reviewDue} ആവർത്തന ചോദ്യങ്ങൾ`:`Review ${reviewDue} due questions`} →</button>}{!loading&&featureFlags.todaySummary&&learnerStats&&streak===0&&<span>{ml?'ഇന്ന് ഒരു പുതിയ തുടക്കം കുറിക്കാം':'Start a new streak today'}</span>}</div>

    <div className="today-links"><button className="syllabus-link" type="button" onClick={onOpenSyllabus}>{ml?'പാഠ്യപദ്ധതി കാണുക':'Explore syllabus'} <span aria-hidden="true">→</span></button><button className="pdf-order-link" type="button" onClick={onContinuePdf}>{ml?'ചോദ്യപേപ്പർ ക്രമത്തിൽ തുടരുക':'Continue in Question Paper order'} <span aria-hidden="true">→</span></button></div>
  </div>;
}

function countdownText(days:number,ml:boolean){
  if(days<0)return ml?`പരീക്ഷാ തീയതി കഴിഞ്ഞു · ക്രമീകരണങ്ങളിൽ മാറ്റാം`:`Your exam date has passed · edit in settings`;
  if(days===0)return ml?'ഇന്നാണ് പരീക്ഷ! ആശംസകൾ.':'Your exam is today. Good luck!';
  if(ml)return `${days} ദിവസത്തിനകം പരീക്ഷ${days<30?' · മോക്ക് പരീക്ഷകൾ പരിശീലിക്കൂ':''}`;
  return `${days} ${days===1?'day':'days'} to your exam${days<30?' · practise a mock exam':''}`;
}
