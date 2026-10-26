'use client';
import {useEffect,useState} from 'react';
import {featureFlags} from './feature-flags';
import {daysUntilExam} from '../../server/src/exam-countdown';
import PointsLevelCard from './PointsLevelCard';

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
};

export default function TodayDashboard({ name, dailyCount, dailyGoal, streak, progress, syllabus, onStart, onContinuePdf, onOpenSyllabus, reviewDue = 0, reviewTomorrow=0, weekDays = [],unfinishedSession,onResume,language='en',targetExamDate,onOpenSettings,learnerStats,onOpenReview }: Props) {
  const ml=language==='ml';
  const [celebrate,setCelebrate]=useState(false);
  const topicStats: TopicProgress[] = progress?.coverage?.byTopic || [];
  const bestFocus = [...syllabus].map(topic => {
    const stats = topicStats.find(row => row.topic === topic.topic);
    const attempts = stats?.attempts || 0;
    const accuracy = stats?.accuracy || 0;
    return { ...topic, attempts, accuracy, priority: topic.marks * (attempts ? 1 - accuracy / 100 : 1) };
  }).sort((a, b) => b.priority - a.priority)[0];
  const percent = Math.min(100, Math.round(dailyCount / dailyGoal * 100));
  const circumference = 2 * Math.PI * 33;
  useEffect(()=>{if(percent<100)return;const now=new Date(),day=`${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`,key='ldc-goal-celebrated';if(localStorage.getItem(key)===day)return;localStorage.setItem(key,day);setCelebrate(true);const timer=window.setTimeout(()=>setCelebrate(false),1300);return()=>window.clearTimeout(timer)},[percent]);

  return <div className="today-page">
    <section className="today-heading">
      <div><div className="eyebrow">{ml?'ഇന്ന്':'TODAY'}</div><h1 className="title">{ml?`${name}, ഇന്ന് പഠിക്കാം.`:`Good ${new Date().getHours() < 12 ? 'morning' : 'day'}, ${name}.`}</h1><p className="today-subtitle">{ml?'ചെറിയൊരു പരിശീലനവും വലിയ മുന്നേറ്റമാണ്.':'A steady session is progress. Let’s take the next step.'}</p>{featureFlags.examCountdown&&<p className="exam-countdown">{targetExamDate?countdownText(daysUntilExam(targetExamDate),ml):<button type="button" className="text-button" onClick={onOpenSettings}>{ml?'പരീക്ഷാ തീയതി ചേർക്കുക':'Set your exam date'}</button>}</p>}</div>
      <div className="streak-card" aria-label={`${streak} day streak`}><span aria-hidden="true">✦</span><div><strong>{streak} day{streak === 1 ? '' : 's'}</strong><small>daily goal streak</small><div className="week-dots" aria-label="Weekly goal activity">{'MTWTFSS'.split('').map((day, i) => <span key={i} className={`${weekDays[i] ? 'complete' : ''}${i === (new Date().getDay()+6)%7 ? ' today' : ''}`} aria-hidden="true">{day}</span>)}</div></div></div>
    </section>

    {featureFlags.todaySummary&&dailyCount>0&&<section className="today-summary-card" aria-label={ml?'ഇന്നത്തെ സംഗ്രഹം':'Today summary'}><div className="eyebrow">{ml?'ഇന്നത്തെ സംഗ്രഹം':'TODAY SO FAR'}</div><div className="today-summary-stats"><span><strong>{dailyCount}</strong>{ml?' ചോദ്യങ്ങൾ':' questions'}</span><span><strong>{Math.round(learnerStats?.todayAccuracy||0)}%</strong>{ml?' കൃത്യത':' accuracy'}</span><span><strong>+{learnerStats?.pointsEarnedToday||0}</strong>{ml?' പോയിന്റുകൾ':' points'}</span></div></section>}

    {featureFlags.todaySummary&&learnerStats&&streak===0&&<section className="restart-streak-card"><div><strong>{ml?'ഇന്ന് പുതിയ തുടക്കം കുറിക്കാം':'Start a new streak today'}</strong><span>{ml?`${dailyGoal} ചോദ്യങ്ങൾ · ദിവസേനയുള്ള ലക്ഷ്യം നേടൂ`:`${dailyGoal} questions · meet your daily goal`}</span></div><button className="secondary-button" type="button" onClick={()=>onStart({count:dailyGoal})}>{ml?'പരിശീലിക്കുക':'Start today'} →</button></section>}

    {unfinishedSession&&<section className="continue-session-card"><div><strong>Continue where you left off</strong><span>{unfinishedSession.settings?.mode==='mock'?'Mock exam':`${unfinishedSession.settings?.count||0} question session`}</span></div><button type="button" className="secondary-button" onClick={()=>onResume?.(unfinishedSession)}>Continue →</button></section>}

    <div className="motivation-cards"><section className={`daily-goal-card${percent >= 100 ? ' goal-done' : ''}`} aria-label="Daily question goal">
      {celebrate&&<span className="goal-confetti" aria-hidden="true">{Array.from({length:7},(_,i)=><i key={i} style={{'--particle':i} as any}/>)}</span>}
      <div className="goal-ring" role="progressbar" aria-label="Daily goal progress" aria-valuemin={0} aria-valuemax={dailyGoal} aria-valuenow={Math.min(dailyCount, dailyGoal)}>
        <svg viewBox="0 0 76 76" aria-hidden="true"><circle className="goal-track" cx="38" cy="38" r="33"/><circle className="goal-progress" cx="38" cy="38" r="33" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - percent / 100)}/></svg>
        <span>{percent >= 100 ? '✓' : `${percent}%`}</span>
      </div>
      <div className="goal-copy"><div className="eyebrow">DAILY GOAL</div><h2>{percent >= 100 ? 'Goal complete' : 'One question at a time'}</h2><p>{dailyCount} of {dailyGoal} questions today</p></div>
      <div className="goal-count"><strong>{Math.min(dailyCount, dailyGoal)}</strong><span>/ {dailyGoal}</span></div>
    </section>{featureFlags.points&&<PointsLevelCard stats={learnerStats} language={language}/>}</div>

    <section className="today-plan card">
      <div className="plan-copy"><div className="eyebrow">TODAY’S PLAN</div><h2>{bestFocus?.topic || 'A short practice session'}</h2><p>{bestFocus ? `${Math.max(1, Math.min(10, dailyGoal - dailyCount || 10))} focused questions · ${bestFocus.marks} syllabus marks${bestFocus.attempts >= 10 ? ` · ${Math.round(bestFocus.accuracy)}% accuracy` : ''}` : 'A gentle mix from your eligible question bank.'}</p><span className="plan-note">Review due: {reviewDue}{reviewTomorrow?` · ${reviewTomorrow} tomorrow`:''}</span></div>
      <button className="button plan-start" type="button" onClick={() => onStart(bestFocus ? { topics: [bestFocus.topic] } : {})}>Start <span aria-hidden="true">→</span></button>
    </section>

    {featureFlags.todaySummary&&reviewDue>0&&<section className="review-due-card"><div><strong>{ml?`${reviewDue} ആവർത്തന ചോദ്യങ്ങൾ ഇന്ന് ചെയ്യാനുണ്ട്`:`${reviewDue} review questions due today`}</strong><span>{ml?'ഇപ്പോൾ വീണ്ടും പരിശീലിച്ച് ഓർമ്മ ഉറപ്പിക്കൂ.':'Give these questions another try to strengthen recall.'}</span></div><button className="secondary-button" type="button" onClick={onOpenReview}>{ml?'ആവർത്തിക്കുക':'Review now'} →</button></section>}

    <button className="syllabus-link" type="button" onClick={onOpenSyllabus}>{ml?'പാഠ്യപദ്ധതി യാത്ര കാണുക':'Explore syllabus journey'} <span aria-hidden="true">→</span></button>
    <button className="pdf-order-link" type="button" onClick={onContinuePdf}>Continue in Question Paper order <span aria-hidden="true">→</span></button>
  </div>;
}

function countdownText(days:number,ml:boolean){
  if(days<0)return ml?`പരീക്ഷാ തീയതി കഴിഞ്ഞു · ക്രമീകരണങ്ങളിൽ മാറ്റാം`:`Your exam date has passed · edit in settings`;
  if(days===0)return ml?'ഇന്നാണ് പരീക്ഷ! ആശംസകൾ.':'Your exam is today. Good luck!';
  if(ml)return `${days} ദിവസത്തിനകം പരീക്ഷ${days<30?' · മോക്ക് പരീക്ഷകൾ പരിശീലിക്കൂ':''}`;
  return `${days} ${days===1?'day':'days'} to your exam${days<30?' · practise a mock exam':''}`;
}
